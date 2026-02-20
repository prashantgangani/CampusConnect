import User from '../models/User.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';

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

		const [approvedJobs, pendingJobs] = await Promise.all([
			Job.aggregate([
				{ $match: { company: { $in: companyIds }, approvalStatus: 'approved' } },
				{ $group: { _id: '$company', count: { $sum: 1 } } }
			]),
			Job.aggregate([
				{ $match: { company: { $in: companyIds }, approvalStatus: 'pending' } },
				{ $group: { _id: '$company', count: { $sum: 1 } } }
			])
		]);

		const approvedMap = new Map(approvedJobs.map((item) => [String(item._id), item.count]));
		const pendingMap = new Map(pendingJobs.map((item) => [String(item._id), item.count]));

		const companiesWithStatus = companies.map((company) => {
			const companyId = String(company._id);
			const approvedCount = approvedMap.get(companyId) || 0;
			const pendingCount = pendingMap.get(companyId) || 0;

			return {
				...company,
				verificationStatus: approvedCount > 0 ? 'verified' : pendingCount > 0 ? 'pending' : 'unverified',
				pendingJobs: pendingCount
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
