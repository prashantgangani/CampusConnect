import Job from '../models/Job.js';
import User from '../models/User.js';
import SuggestedJob from '../models/SuggestedJob.js';

export const getStudentsForMentor = async (req, res) => {
	try {
		const students = await User.find({ role: 'student' })
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

		return res.status(201).json({
			success: true,
			message: createdCount > 0
				? 'Job suggestion saved successfully'
				: 'This job was already suggested to the selected student(s)',
			createdCount,
			duplicateCount,
			totalTargets: uniqueStudentIds.length
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
		const suggestions = await SuggestedJob.find({ mentor: req.user._id })
			.populate('student', 'name email')
			.populate({
				path: 'job',
				populate: {
					path: 'company',
					select: 'name'
				}
			})
			.sort({ createdAt: -1 })
			.limit(10);

		res.status(200).json({
			success: true,
			suggestions
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
