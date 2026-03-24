import Job from '../models/Job.js';
import User from '../models/User.js';
import SuggestedJob from '../models/SuggestedJob.js';
import StudentProfile from '../models/StudentProfile.js';

export const getStudentsForMentor = async (req, res) => {
	try {
		const mentorId = req.user._id;

		const verifiedProfiles = await StudentProfile.find({
			mentor: mentorId,
			mentorRequestStatus: 'verified'
		})
			.select('userId')
			.lean();

		const verifiedStudentIds = verifiedProfiles.map((profile) => profile.userId);

		const students = await User.find({
			_id: { $in: verifiedStudentIds },
			role: 'student'
		})
			.select('_id name email institution')
			.sort({ name: 1 });

		res.status(200).json({
			success: true,
			students
		});
	} catch (error) {
		console.error('Error fetching students for mentor:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to fetch students',
			error: error.message
		});
	}
};

export const suggestJobToStudent = async (req, res) => {
	try {
		const { jobId, studentId, studentIds } = req.body;

		if (!jobId) {
			return res.status(400).json({
				success: false,
				message: 'jobId is required'
			});
		}

		const targetStudentIds = Array.isArray(studentIds) && studentIds.length
			? studentIds
			: studentId
				? [studentId]
				: [];

		if (!targetStudentIds.length) {
			return res.status(400).json({
				success: false,
				message: 'studentId or studentIds is required'
			});
		}

		const job = await Job.findById(jobId).select('_id status applicationDeadline');
		if (!job) {
			return res.status(404).json({
				success: false,
				message: 'Job not found'
			});
		}

		const now = new Date();
		const isDeadlinePassed = job.applicationDeadline && new Date(job.applicationDeadline) < now;
		if (job.status === 'expired' || isDeadlinePassed) {
			return res.status(400).json({
				success: false,
				message: 'Expired jobs cannot be suggested'
			});
		}

		const students = await User.find({
			_id: { $in: targetStudentIds },
			role: 'student'
		}).select('_id');

		const validStudentIds = students.map((student) => student._id.toString());
		if (!validStudentIds.length) {
			return res.status(400).json({
				success: false,
				message: 'No valid students found to suggest this job'
			});
		}

		const mentorId = req.user._id.toString();
		const uniqueStudentIds = [...new Set(validStudentIds)];

		const operations = uniqueStudentIds.map((id) => ({
			updateOne: {
				filter: {
					mentor: mentorId,
					student: id,
					job: jobId
				},
				update: {
					$setOnInsert: {
						mentor: mentorId,
						student: id,
						job: jobId,
						createdAt: new Date()
					}
				},
				upsert: true
			}
		}));

		const writeResult = await SuggestedJob.bulkWrite(operations, { ordered: false });
		const createdCount = writeResult.upsertedCount || 0;
		const duplicateCount = uniqueStudentIds.length - createdCount;
		const totalSuggestions = await SuggestedJob.countDocuments({ mentor: mentorId });

		return res.status(201).json({
			success: true,
			message: createdCount > 0
				? 'Job suggestion saved successfully'
				: 'This job was already suggested to the selected student(s)',
			createdCount,
			duplicateCount,
			totalTargets: uniqueStudentIds.length,
			totalSuggestions
		});
	} catch (error) {
		console.error('Error suggesting job to student:', error);
		return res.status(500).json({
			success: false,
			message: 'Failed to suggest job',
			error: error.message
		});
	}
};

export const getRecentSuggestions = async (req, res) => {
	try {
		const [suggestions, totalSuggestions] = await Promise.all([
			SuggestedJob.find({ mentor: req.user._id })
			.populate('student', 'name email')
			.populate({
				path: 'job',
				populate: {
					path: 'company',
					select: 'name'
				}
			})
			.sort({ createdAt: -1 })
			.limit(10),
			SuggestedJob.countDocuments({ mentor: req.user._id })
		]);

		res.status(200).json({
			success: true,
			suggestions,
			totalSuggestions
		});
	} catch (error) {
		console.error('Error fetching recent mentor suggestions:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to fetch recent suggestions',
			error: error.message
		});
	}
};

export const getSuggestionsTotal = async (req, res) => {
	try {
		const totalSuggestions = await SuggestedJob.countDocuments({ mentor: req.user._id });

		return res.status(200).json({
			success: true,
			totalSuggestions
		});
	} catch (error) {
		console.error('Error fetching mentor suggestion total:', error);
		return res.status(500).json({
			success: false,
			message: 'Failed to fetch total suggestions',
			error: error.message
		});
	}
};

export const getPendingMentorRequests = async (req, res) => {
	try {
		const mentorId = req.user._id;
		const pendingProfiles = await StudentProfile.find({
			mentorRequested: mentorId,
			mentorRequestStatus: 'pending'
		})
			.populate('userId', 'name email institution')
			.populate('mentorRequested', 'name email')
			.select('userId fullName email institution mentorRequestedAt mentorReviewNote _id')
			.sort({ mentorRequestedAt: -1 })
			.lean();

		const pendingRequests = pendingProfiles.map((profile) => ({
			_id: profile._id,
			profileId: profile._id,
			studentId: profile.userId?._id || profile.userId,
			studentName: profile.fullName || profile.userId?.name || 'Unknown',
			studentEmail: profile.email || profile.userId?.email || 'No email',
			studentInstitution: profile.institution || profile.userId?.institution || '',
			requestedAt: profile.mentorRequestedAt,
			note: profile.mentorReviewNote || ''
		}));

		return res.status(200).json({
			success: true,
			requests: pendingRequests
		});
	} catch (error) {
		console.error('Error fetching pending requests:', error);
		return res.status(500).json({
			success: false,
			message: 'Failed to fetch pending mentor requests',
			error: error.message
		});
	}
};

export const reviewMentorRequest = async (req, res) => {
	try {
		const { profileId, action, note } = req.body;
		const mentorId = req.user._id;

		if (!profileId || !['approve', 'reject'].includes(action)) {
			return res.status(400).json({
				success: false,
				message: 'profileId and action (approve/reject) are required'
			});
		}

		const profile = await StudentProfile.findOne({
			_id: profileId,
			mentorRequested: mentorId,
			mentorRequestStatus: 'pending'
		});

		if (!profile) {
			return res.status(404).json({
				success: false,
				message: 'No pending request found for this profile'
			});
		}

		if (action === 'approve') {
			profile.mentor = mentorId;
			profile.mentorRequestStatus = 'verified';
		} else if (action === 'reject') {
			profile.mentor = null;
			profile.mentorRequestStatus = 'rejected';
		}

		profile.mentorReviewedAt = new Date();
		profile.mentorReviewNote = note || '';

		await profile.save();

		return res.status(200).json({
			success: true,
			message: action === 'approve' ? 'Student request approved' : 'Student request rejected'
		});
	} catch (error) {
		console.error('Error reviewing mentor request:', error);
		return res.status(500).json({
			success: false,
			message: 'Failed to review mentor request',
			error: error.message
		});
	}
};

export const getMentorProfile = async (req, res) => {
	try {
		const mentor = await User.findById(req.user._id)
			.select('name email role institution department college placementCell placementCellEmail placementCellAssignedAt')
			.populate('placementCell', 'name email institution department college role');

		if (!mentor) {
			return res.status(404).json({
				success: false,
				message: 'Mentor profile not found'
			});
		}

		return res.status(200).json({
			success: true,
			profile: mentor
		});
	} catch (error) {
		console.error('Error fetching mentor profile:', error);
		return res.status(500).json({
			success: false,
			message: 'Failed to fetch mentor profile',
			error: error.message
		});
	}
};

export const searchPlacementCells = async (req, res) => {
	try {
		const query = (req.query.q || '').trim().toLowerCase();

		if (query.length < 3) {
			return res.status(400).json({
				success: false,
				message: 'Search query must be at least 3 characters'
			});
		}

		const placementCells = await User.find({
			role: 'placement',
			$or: [
				{ email: { $regex: query, $options: 'i' } },
				{ name: { $regex: query, $options: 'i' } }
			]
		})
			.select('_id name email institution department college')
			.limit(10)
			.lean();

		return res.status(200).json({
			success: true,
			placementCells
		});
	} catch (error) {
		console.error('Error searching placement cells:', error);
		return res.status(500).json({
			success: false,
			message: 'Failed to search placement cells',
			error: error.message
		});
	}
};

export const assignPlacementCellByEmail = async (req, res) => {
	try {
		const placementEmail = (req.body.placementEmail || '').trim().toLowerCase();

		if (!placementEmail) {
			return res.status(400).json({
				success: false,
				message: 'Placement cell email is required'
			});
		}

		const placementCell = await User.findOne({
			email: placementEmail,
			role: 'placement'
		}).select('_id name email institution department college role');

		if (!placementCell) {
			return res.status(404).json({
				success: false,
				message: 'No placement cell account found with this email'
			});
		}

		const updatedMentor = await User.findByIdAndUpdate(
			req.user._id,
			{
				$set: {
					placementCell: placementCell._id,
					placementCellEmail: placementCell.email,
					placementCellAssignedAt: new Date()
				}
			},
			{
				new: true,
				runValidators: true,
				select: 'name email role institution department college placementCell placementCellEmail placementCellAssignedAt'
			}
		).populate('placementCell', 'name email institution department college role');

		if (!updatedMentor) {
			return res.status(404).json({
				success: false,
				message: 'Mentor profile not found'
			});
		}

		return res.status(200).json({
			success: true,
			message: 'Placement cell selected successfully',
			profile: updatedMentor
		});
	} catch (error) {
		console.error('Error assigning placement cell:', error);
		return res.status(500).json({
			success: false,
			message: 'Failed to assign placement cell',
			error: error.message
		});
	}
};
