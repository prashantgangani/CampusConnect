import User from '../models/User.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import StudentProfile from '../models/StudentProfile.js';

const PLACED_STATUSES = ['selected', 'offer_accepted'];

const parseSalaryValue = (salaryText) => {
	if (!salaryText || typeof salaryText !== 'string') return null;

	const normalized = salaryText.toLowerCase().replace(/,/g, '');
	const matches = normalized.match(/\d+(?:\.\d+)?/g);
	if (!matches || matches.length === 0) return null;

	const values = matches.map((item) => Number(item)).filter((item) => !Number.isNaN(item));
	if (!values.length) return null;

	let amount = values.length > 1
		? values.reduce((sum, current) => sum + current, 0) / values.length
		: values[0];

	if (/k\b|thousand/.test(normalized)) {
		amount *= 1000;
	} else if (/lpa|lac|lakh/.test(normalized)) {
		amount *= 100000;
	} else if (/cr|crore/.test(normalized)) {
		amount *= 10000000;
	}

	return Math.round(amount);
};

const formatCurrency = (value) => {
	if (typeof value !== 'number' || Number.isNaN(value)) return 'N/A';
	if (value <= 0) return 'N/A';

	return new Intl.NumberFormat('en-IN', {
		style: 'currency',
		currency: 'INR',
		maximumFractionDigits: 0
	}).format(value);
};

const resolveCompanyName = (companyRecord) => {
	if (!companyRecord) return 'Unknown Company';
	return companyRecord.companyName || companyRecord.name || companyRecord.email || 'Unknown Company';
};

const getPlacementAnalyticsPayload = async ({ year, companyId }) => {
	const selectedYear = year ? Number(year) : null;
	const currentYear = new Date().getFullYear();

	const yearRangeFilter = selectedYear
		? {
			appliedAt: {
				$gte: new Date(selectedYear, 0, 1),
				$lt: new Date(selectedYear + 1, 0, 1)
			}
		}
		: {
			appliedAt: {
				$gte: new Date(currentYear - 5, 0, 1),
				$lt: new Date(currentYear + 1, 0, 1)
			}
		};

	const baseMatch = {
		...yearRangeFilter
	};

	const applications = await Application.find(baseMatch)
		.populate('jobId', 'title salary company companyName')
		.lean();

	const companyIdsInApplications = [...new Set(
		applications
			.map((application) => String(application?.jobId?.company || ''))
			.filter(Boolean)
	)];

	const companyRecords = await User.find({ _id: { $in: companyIdsInApplications }, role: 'company' })
		.select('_id name email companyName')
		.lean();

	const companyMap = new Map(companyRecords.map((company) => [String(company._id), company]));

	const studentYearMap = new Map();
	const yearWiseMap = new Map();
	const companyWiseMap = new Map();
	const salaryValues = [];

	for (const application of applications) {
		const companyKey = String(application?.jobId?.company || '');
		if (!companyKey) continue;
		if (companyId && companyKey !== String(companyId)) continue;

		const yearBucket = new Date(application.appliedAt || application.createdAt).getFullYear();
		const studentId = String(application.studentId);
		const isPlaced = PLACED_STATUSES.includes(application.status);

		const mapKey = `${yearBucket}:${studentId}`;
		if (!studentYearMap.has(mapKey)) {
			studentYearMap.set(mapKey, isPlaced);
		} else if (isPlaced) {
			studentYearMap.set(mapKey, true);
		}

		if (!companyWiseMap.has(companyKey)) {
			companyWiseMap.set(companyKey, {
				companyId: companyKey,
				companyName: resolveCompanyName(companyMap.get(companyKey)),
				placedStudents: 0,
				salaryValues: []
			});
		}

		if (isPlaced) {
			const companyItem = companyWiseMap.get(companyKey);
			companyItem.placedStudents += 1;

			const parsedSalary = parseSalaryValue(application.jobId?.salary);
			if (parsedSalary) {
				companyItem.salaryValues.push(parsedSalary);
				salaryValues.push(parsedSalary);
			}
		}
	}

	for (const [studentYearKey, placed] of studentYearMap.entries()) {
		const [yearKey] = studentYearKey.split(':');
		const numericYear = Number(yearKey);

		if (!yearWiseMap.has(numericYear)) {
			yearWiseMap.set(numericYear, {
				year: numericYear,
				placedStudents: 0,
				unplacedStudents: 0,
				totalStudents: 0
			});
		}

		const bucket = yearWiseMap.get(numericYear);
		bucket.totalStudents += 1;
		if (placed) {
			bucket.placedStudents += 1;
		} else {
			bucket.unplacedStudents += 1;
		}
	}

	const yearWise = [...yearWiseMap.values()].sort((a, b) => a.year - b.year);
	const totalPlacedStudents = yearWise.reduce((sum, item) => sum + item.placedStudents, 0);
	const totalUnplacedStudents = yearWise.reduce((sum, item) => sum + item.unplacedStudents, 0);
	const totalStudents = totalPlacedStudents + totalUnplacedStudents;

	const minSalary = salaryValues.length ? Math.min(...salaryValues) : null;
	const maxSalary = salaryValues.length ? Math.max(...salaryValues) : null;
	const avgSalary = salaryValues.length
		? Math.round(salaryValues.reduce((sum, item) => sum + item, 0) / salaryValues.length)
		: null;

	const companyWise = [...companyWiseMap.values()]
		.map((item) => {
			const avgCompanySalary = item.salaryValues.length
				? Math.round(item.salaryValues.reduce((sum, amount) => sum + amount, 0) / item.salaryValues.length)
				: null;

			return {
				companyId: item.companyId,
				companyName: item.companyName,
				placedStudents: item.placedStudents,
				averageSalary: avgCompanySalary,
				averageSalaryLabel: formatCurrency(avgCompanySalary)
			};
		})
		.sort((a, b) => b.placedStudents - a.placedStudents);

	const companyOptionsRaw = await User.find({ role: 'company' })
		.select('_id name email companyName')
		.sort({ name: 1 })
		.lean();

	const displayNameFrequency = companyOptionsRaw.reduce((accumulator, company) => {
		const label = resolveCompanyName(company);
		accumulator[label] = (accumulator[label] || 0) + 1;
		return accumulator;
	}, {});

	const companyOptions = companyOptionsRaw.map((company) => {
		const baseName = resolveCompanyName(company);
		const shouldDisambiguate = (displayNameFrequency[baseName] || 0) > 1;
		const disambiguatedName = shouldDisambiguate && company.email
			? `${baseName} (${company.email})`
			: baseName;

		return {
			id: company._id,
			name: disambiguatedName
		};
	});

	return {
		yearWise,
		companyWise,
		companyOptions,
		summary: {
			totalStudents,
			placedStudents: totalPlacedStudents,
			unplacedStudents: totalUnplacedStudents,
			placementRate: totalStudents > 0 ? Math.round((totalPlacedStudents / totalStudents) * 100) : 0,
			averageSalary: avgSalary,
			averageSalaryLabel: formatCurrency(avgSalary),
			minimumSalary: minSalary,
			minimumSalaryLabel: formatCurrency(minSalary),
			maximumSalary: maxSalary,
			maximumSalaryLabel: formatCurrency(maxSalary)
		}
	};
};

export const getPlacementDashboardData = async (req, res) => {
	try {
		const [
			totalStudents,
			totalJobs,
			totalPlacements,
			approvedCompanyJobs,
			pendingCompanyJobs
		] = await Promise.all([
			User.countDocuments({ role: 'student' }),
			Job.countDocuments(),
			Application.countDocuments({ status: { $in: ['selected', 'offer_accepted'] } }),
			Job.distinct('company', { approvalStatus: 'approved' }),
			Job.distinct('company', { approvalStatus: 'pending' })
		]);

		res.status(200).json({
			success: true,
			stats: {
				totalStudents,
				totalJobs,
				verifiedCompanies: approvedCompanyJobs.length,
				totalPlacements,
				pendingCompanies: pendingCompanyJobs.length
			}
		});
	} catch (error) {
		console.error('Error fetching placement dashboard data:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to fetch placement dashboard data',
			error: error.message
		});
	}
};

export const getRecentJobPosts = async (req, res) => {
	try {
		const jobs = await Job.find({})
			.populate('company', 'name email')
			.sort({ createdAt: -1 })
			.limit(5);

		res.status(200).json({
			success: true,
			jobs
		});
	} catch (error) {
		console.error('Error fetching recent job posts:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to fetch recent job posts',
			error: error.message
		});
	}
};

export const getRecentCompanyRegistrations = async (req, res) => {
	try {
		const companies = await User.find({ role: 'company' })
			.select('_id name email createdAt')
			.sort({ createdAt: -1 })
			.limit(8)
			.lean();

		if (!companies.length) {
			return res.status(200).json({ success: true, companies: [] });
		}

		const companyIds = companies.map((company) => company._id);

		const [approvedJobs, pendingJobs, rejectedJobs] = await Promise.all([
			Job.aggregate([
				{ $match: { company: { $in: companyIds }, approvalStatus: 'approved' } },
				{ $group: { _id: '$company', count: { $sum: 1 } } }
			]),
			Job.aggregate([
				{ $match: { company: { $in: companyIds }, approvalStatus: 'pending' } },
				{ $group: { _id: '$company', count: { $sum: 1 } } }
			]),
			Job.aggregate([
				{ $match: { company: { $in: companyIds }, approvalStatus: 'rejected' } },
				{ $group: { _id: '$company', count: { $sum: 1 } } }
			])
		]);

		const approvedMap = new Map(approvedJobs.map((item) => [String(item._id), item.count]));
		const pendingMap = new Map(pendingJobs.map((item) => [String(item._id), item.count]));
		const rejectedMap = new Map(rejectedJobs.map((item) => [String(item._id), item.count]));

		const companiesWithStatus = companies.map((company) => {
			const companyId = String(company._id);
			const approvedCount = approvedMap.get(companyId) || 0;
			const pendingCount = pendingMap.get(companyId) || 0;
			const rejectedCount = rejectedMap.get(companyId) || 0;
			const verificationStatus = approvedCount > 0
				? 'verified'
				: pendingCount > 0
					? 'pending'
					: rejectedCount > 0
						? 'rejected'
						: 'unverified';

			return {
				...company,
				verificationStatus,
				pendingJobs: pendingCount,
				rejectedJobs: rejectedCount
			};
		});

		res.status(200).json({
			success: true,
			companies: companiesWithStatus
		});
	} catch (error) {
		console.error('Error fetching recent company registrations:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to fetch recent company registrations',
			error: error.message
		});
	}
};

export const approveCompany = async (req, res) => {
	try {
		const { companyId } = req.params;

		const company = await User.findOne({ _id: companyId, role: 'company' });
		if (!company) {
			return res.status(404).json({
				success: false,
				message: 'Company not found'
			});
		}

		const pendingJobs = await Job.find({ company: companyId, approvalStatus: 'pending' });
		if (!pendingJobs.length) {
			return res.status(200).json({
				success: true,
				message: 'Company already has no pending jobs'
			});
		}

		await Job.updateMany(
			{ company: companyId, approvalStatus: 'pending' },
			{
				$set: {
					approvalStatus: 'approved',
					reviewedBy: req.user._id,
					reviewDate: new Date(),
					reviewNotes: 'Approved from placement dashboard company queue'
				}
			}
		);

		res.status(200).json({
			success: true,
			message: `Approved ${pendingJobs.length} pending job(s) for ${company.name}`
		});
	} catch (error) {
		console.error('Error approving company:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to approve company',
			error: error.message
		});
	}
};

export const getPlacementProfile = async (req, res) => {
	try {
		const user = await User.findById(req.user._id).select('name email role institution department college');
		if (!user) {
			return res.status(404).json({ success: false, message: 'User not found' });
		}

		res.status(200).json({ success: true, profile: user });
	} catch (error) {
		console.error('Error fetching placement profile:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to fetch placement profile',
			error: error.message
		});
	}
};

export const updatePlacementProfile = async (req, res) => {
	try {
		const updates = {};
		const allowedFields = ['name', 'institution', 'department', 'college'];
		allowedFields.forEach((field) => {
			if (req.body[field] !== undefined) {
				updates[field] = req.body[field];
			}
		});

		const user = await User.findByIdAndUpdate(req.user._id, updates, {
			new: true,
			runValidators: true,
			select: 'name email role institution department college'
		});

		if (!user) {
			return res.status(404).json({ success: false, message: 'User not found' });
		}

		res.status(200).json({ success: true, profile: user });
	} catch (error) {
		console.error('Error updating placement profile:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to update placement profile',
			error: error.message
		});
	}
};

export const getPlacementAnalytics = async (req, res) => {
	try {
		const { year, companyId } = req.query;
		const payload = await getPlacementAnalyticsPayload({ year, companyId });

		res.status(200).json({
			success: true,
			filters: {
				year: year ? Number(year) : null,
				companyId: companyId || null
			},
			...payload
		});
	} catch (error) {
		console.error('Error fetching placement analytics:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to fetch placement analytics',
			error: error.message
		});
	}
};

export const getPlacementReportData = async (req, res) => {
	try {
		const { year, companyId, reportType = 'placement-summary', title = '' } = req.body || {};
		const payload = await getPlacementAnalyticsPayload({ year, companyId });

		const selectedYear = year ? Number(year) : null;
		const currentYear = new Date().getFullYear();
		const yearRangeFilter = selectedYear
			? {
				appliedAt: {
					$gte: new Date(selectedYear, 0, 1),
					$lt: new Date(selectedYear + 1, 0, 1)
				}
			}
			: {
				appliedAt: {
					$gte: new Date(currentYear - 5, 0, 1),
					$lt: new Date(currentYear + 1, 0, 1)
				}
			};

		const reportApplications = await Application.find(yearRangeFilter)
			.populate('jobId', 'title salary company companyName')
			.lean();

		const reportCompanyIds = [...new Set(
			reportApplications
				.map((application) => String(application?.jobId?.company || ''))
				.filter(Boolean)
		)];

		const reportCompanies = await User.find({ _id: { $in: reportCompanyIds }, role: 'company' })
			.select('_id name email companyName')
			.lean();
		const reportCompanyMap = new Map(reportCompanies.map((company) => [String(company._id), company]));

		const studentLatestMap = new Map();

		for (const application of reportApplications) {
			const companyKey = String(application?.jobId?.company || '');
			if (!companyKey) continue;
			if (companyId && companyKey !== String(companyId)) continue;

			const studentKey = String(application.studentId);
			if (!studentLatestMap.has(studentKey)) {
				studentLatestMap.set(studentKey, {
					placed: false,
					latestApplication: application,
					placedApplication: null
				});
			}

			const current = studentLatestMap.get(studentKey);
			if (new Date(application.appliedAt || application.createdAt) > new Date(current.latestApplication.appliedAt || current.latestApplication.createdAt)) {
				current.latestApplication = application;
			}

			if (PLACED_STATUSES.includes(application.status)) {
				current.placed = true;
				if (!current.placedApplication || new Date(application.appliedAt || application.createdAt) > new Date(current.placedApplication.appliedAt || current.placedApplication.createdAt)) {
					current.placedApplication = application;
				}
			}
		}

		const studentIds = [...studentLatestMap.keys()];
		const [studentProfiles, studentUsers] = await Promise.all([
			StudentProfile.find({ userId: { $in: studentIds } })
				.select('userId fullName email phone institution department cgpa profileCompletion')
				.lean(),
			User.find({ _id: { $in: studentIds }, role: 'student' })
				.select('_id name email institution department')
				.lean()
		]);

		const profileMap = new Map(studentProfiles.map((profile) => [String(profile.userId), profile]));
		const userMap = new Map(studentUsers.map((student) => [String(student._id), student]));

		const studentDetails = studentIds.map((studentId) => {
			const profile = profileMap.get(studentId);
			const userRecord = userMap.get(studentId);
			const mapping = studentLatestMap.get(studentId);
			const placedApplication = mapping?.placedApplication;
			const companyKey = String(placedApplication?.jobId?.company || mapping?.latestApplication?.jobId?.company || '');
			const companyRecord = reportCompanyMap.get(companyKey);

			return {
				studentId,
				name: profile?.fullName || userRecord?.name || 'Student',
				email: profile?.email || userRecord?.email || '',
				phone: profile?.phone || '',
				institution: profile?.institution || userRecord?.institution || '',
				department: profile?.department || userRecord?.department || '',
				cgpa: profile?.cgpa ?? '',
				profileCompletion: profile?.profileCompletion ?? '',
				placementStatus: mapping?.placed ? 'Placed' : 'Not Placed',
				companyName: mapping?.placed ? resolveCompanyName(companyRecord) : '',
				jobTitle: mapping?.placed ? (placedApplication?.jobId?.title || '') : '',
				salaryOrStipend: mapping?.placed ? (placedApplication?.jobId?.salary || '') : ''
			};
		});

		res.status(200).json({
			success: true,
			report: {
				title: String(title || '').trim() || 'Placement Summary Report',
				reportType,
				generatedAt: new Date().toISOString(),
				filters: {
					year: year ? Number(year) : null,
					companyId: companyId || null
				}
			},
			studentDetails,
			...payload
		});
	} catch (error) {
		console.error('Error fetching placement report data:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to generate placement report data',
			error: error.message
		});
	}
};
