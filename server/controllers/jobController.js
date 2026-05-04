import Job from '../models/Job.js';
import Application from '../models/Application.js';
import Quiz from '../models/Quiz.js';
import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import {
  notifyPlacementUsers,
  notifyPlacementUsersForJob
} from '../utils/notificationHelper.js';

const normalizeQuizPayload = (quizInput = {}) => {
  if (!quizInput || !Array.isArray(quizInput.questions) || quizInput.questions.length === 0) {
    return null;
  }

  const questions = quizInput.questions.map((question, index) => {
    const prompt = (question?.question || '').trim();
    const options = Array.isArray(question?.options)
      ? question.options.map((option) => (option || '').trim()).filter(Boolean)
      : [];
    const correctAnswer = (question?.correctAnswer || '').trim();
    const marks = Number(question?.marks) > 0 ? Number(question.marks) : 1;

    if (!prompt) {
      throw new Error(`Quiz question ${index + 1}: prompt is required.`);
    }
    if (options.length !== 4) {
      throw new Error(`Quiz question ${index + 1}: exactly 4 options are required.`);
    }
    if (!correctAnswer || !options.includes(correctAnswer)) {
      throw new Error(`Quiz question ${index + 1}: correct answer must match one of the options.`);
    }

    return {
      question: prompt,
      options,
      correctAnswer,
      marks
    };
  });

  const totalMarks = questions.reduce((sum, question) => sum + (Number(question.marks) || 1), 0);
  const passingPercentage = Number(quizInput.passingPercentage) > 0
    ? Number(quizInput.passingPercentage)
    : 70;
  const timeLimit = Number(quizInput.timeLimit) > 0 ? Number(quizInput.timeLimit) : 30;

  return {
    title: (quizInput.title || 'Screening Quiz').trim(),
    description: (quizInput.description || '').trim(),
    questions,
    totalMarks,
    passingPercentage,
    timeLimit
  };
};

// Create a new job posting
export const createJob = async (req, res) => {
  try {
    const {
      title,
      description,
      requirements,
      location,
      salary,
      jobType,
      experience,
      skills,
      applicationDeadline,
      quiz
    } = req.body;

    // Get company from authenticated user
    const company = req.user._id;

    const job = new Job({
      title,
      description,
      requirements,
      company,
      companyName: req.user?.institution || '',
      location,
      salary,
      jobType,
      experience,
      skills,
      applicationDeadline
    });

    await job.save();

    await notifyPlacementUsers({
      title: 'New Job Posted',
      message: `${req.user?.name || req.user?.institution || 'A company'} posted a new job: ${job.title}.`,
      type: 'job',
      metadata: {
        jobId: job._id,
        companyId: company,
        companyName: req.user?.name || req.user?.institution || ''
      }
    });

    const normalizedQuiz = normalizeQuizPayload(quiz);
    if (normalizedQuiz) {
      await Quiz.findOneAndUpdate(
        { jobId: job._id },
        {
          $set: {
            ...normalizedQuiz,
            jobId: job._id
          }
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true
        }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Job posted successfully',
      job,
      hasQuiz: !!normalizedQuiz
    });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to post job',
      error: error.message
    });
  }
};

export const getCompanyJobQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await Job.findById(id).select('_id company title');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    if (job.company.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this job quiz'
      });
    }

    const quiz = await Quiz.findOne({ jobId: job._id }).lean();

    return res.status(200).json({
      success: true,
      quiz: quiz || null
    });
  } catch (error) {
    console.error('Error fetching company job quiz:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch job quiz',
      error: error.message
    });
  }
};

export const upsertCompanyJobQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await Job.findById(id).select('_id company title');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    if (job.company.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this job quiz'
      });
    }

    const normalizedQuiz = normalizeQuizPayload(req.body);
    if (!normalizedQuiz) {
      return res.status(400).json({
        success: false,
        message: 'At least one quiz question is required'
      });
    }

    const quiz = await Quiz.findOneAndUpdate(
      { jobId: job._id },
      {
        $set: {
          ...normalizedQuiz,
          jobId: job._id
        }
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Job quiz saved successfully',
      quiz
    });
  } catch (error) {
    console.error('Error saving company job quiz:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to save job quiz',
      error: error.message
    });
  }
};

export const getPlacementCellsForCompany = async (req, res) => {
  try {
    const placementCells = await User.find({ role: 'placement' })
      .select('_id name email institution')
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      placementCells
    });
  } catch (error) {
    console.error('Error fetching placement cells for company:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch placement cells',
      error: error.message
    });
  }
};

// Get all jobs (for students and mentors - only approved jobs)
export const getAllJobs = async (req, res) => {
  try {
    const role = req.user?.role;

    let placementCellId = null;
    let query = role === 'mentor'
      ? {}
      : {
          status: 'active',
          approvalStatus: 'approved'
        };

    if (role === 'mentor') {
      const mentor = await User.findById(req.user._id)
        .select('placementCell')
        .lean();
      placementCellId = mentor?.placementCell ? String(mentor.placementCell) : null;
    }

    if (role === 'student') {
      const studentProfile = await StudentProfile.findOne({
        userId: req.user._id,
        mentorRequestStatus: 'verified'
      })
        .populate('mentor', 'placementCell')
        .select('mentor mentorRequestStatus')
        .lean();

      placementCellId = studentProfile?.mentor?.placementCell
        ? String(studentProfile.mentor.placementCell)
        : null;
    }

    if (placementCellId) {
      query.$or = [
        { allowedPlacementCells: { $exists: false } },
        { allowedPlacementCells: { $size: 0 } },
        { allowedPlacementCells: placementCellId }
      ];
    } else {
      query.$or = [
        { allowedPlacementCells: { $exists: false } },
        { allowedPlacementCells: { $size: 0 } }
      ];
    }

    const jobs = await Job.find(query)
      .populate('company', 'name email institution')
      .populate('allowedPlacementCells', 'name email institution')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      jobs
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch jobs',
      error: error.message
    });
  }
};

// Get jobs by company (shows all jobs for the company)
export const getJobsByCompany = async (req, res) => {
  try {
    const company = req.user._id;
    const jobs = await Job.find({ company })
      .populate('allowedPlacementCells', 'name email institution')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      jobs
    });
  } catch (error) {
    console.error('Error fetching company jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company jobs',
      error: error.message
    });
  }
};

// Get job by ID
export const getJobById = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await Job.findById(id)
      .populate('company', 'name email institution')
      .populate('allowedPlacementCells', 'name email institution');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    res.status(200).json({
      success: true,
      job
    });
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job',
      error: error.message
    });
  }
};

// Update job
export const updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    const job = await Job.findById(id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if user is the company that posted the job
    if (job.company.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this job'
      });
    }

    if (updates.allowedPlacementCells !== undefined) {
      if (!Array.isArray(updates.allowedPlacementCells)) {
        return res.status(400).json({
          success: false,
          message: 'allowedPlacementCells must be an array of placement cell ids'
        });
      }

      const uniqueCellIds = [...new Set(updates.allowedPlacementCells.map((id) => String(id)))];
      const validPlacementCount = await User.countDocuments({
        _id: { $in: uniqueCellIds },
        role: 'placement'
      });

      if (validPlacementCount !== uniqueCellIds.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more selected placement cells are invalid'
        });
      }

      updates.allowedPlacementCells = uniqueCellIds;
    }

    const updatedJob = await Job.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    }).populate('allowedPlacementCells', 'name email institution');

    if (updates.allowedPlacementCells !== undefined) {
      await notifyPlacementUsersForJob({
        job: updatedJob,
        title: 'Job Assignment Updated',
        message: `A job assignment was updated for ${updatedJob.title}.`,
        type: 'job',
        metadata: {
          jobId: updatedJob._id,
          companyId: updatedJob.company,
          companyName: updatedJob.companyName || req.user?.name || ''
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Job updated successfully',
      job: updatedJob
    });
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update job',
      error: error.message
    });
  }
};

// Delete job
export const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await Job.findById(id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if user is the company that posted the job
    if (job.company.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this job'
      });
    }

    await Job.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete job',
      error: error.message
    });
  }
};

// Get pending jobs (for placement verification)
export const getPendingJobs = async (req, res) => {
  try {
    console.log('getPendingJobs called by user:', req.user?.name, 'role:', req.user?.role);

    // Check total jobs and their statuses
    const totalJobs = await Job.countDocuments();
    const pendingJobs = await Job.countDocuments({ approvalStatus: 'pending' });
    const approvedJobs = await Job.countDocuments({ approvalStatus: 'approved' });
    const rejectedJobs = await Job.countDocuments({ approvalStatus: 'rejected' });

    console.log('Database stats:', { totalJobs, pendingJobs, approvedJobs, rejectedJobs });

    const jobs = await Job.find({ approvalStatus: 'pending' })
      .populate('company', 'name email institution')
      .sort({ createdAt: -1 });

    console.log('Found', jobs.length, 'pending jobs');

    res.status(200).json({
      success: true,
      jobs,
      stats: { totalJobs, pendingJobs, approvedJobs, rejectedJobs }
    });
  } catch (error) {
    console.error('Error fetching pending jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending jobs',
      error: error.message
    });
  }
};

// Approve job (placement only)
export const approveJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const job = await Job.findById(id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    if (job.approvalStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Job is not pending approval'
      });
    }

    job.approvalStatus = 'approved';
    job.reviewedBy = req.user._id;
    job.reviewDate = new Date();
    if (notes) job.reviewNotes = notes;

    await job.save();

    res.status(200).json({
      success: true,
      message: 'Job approved successfully',
      job
    });
  } catch (error) {
    console.error('Error approving job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve job',
      error: error.message
    });
  }
};

// Reject job (placement only)
export const rejectJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const job = await Job.findById(id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    if (job.approvalStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Job is not pending approval'
      });
    }

    job.approvalStatus = 'rejected';
    job.reviewedBy = req.user._id;
    job.reviewDate = new Date();
    if (notes) job.reviewNotes = notes;

    await job.save();

    res.status(200).json({
      success: true,
      message: 'Job rejected successfully',
      job
    });
  } catch (error) {
    console.error('Error rejecting job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject job',
      error: error.message
    });
  }
};

// Company dashboard stats (company-specific)
export const getCompanyStats = async (req, res) => {
  try {
    const companyId = req.user._id;

    const companyJobs = await Job.find({ company: companyId }).select('_id status').lean();
    const companyJobIds = companyJobs.map((job) => job._id);

    const activeJobs = companyJobs.filter(
      (job) => !job.status || job.status === 'active'
    ).length;

    if (companyJobIds.length === 0) {
      return res.status(200).json({
        success: true,
        stats: {
          activeJobs: 0,
          applicants: 0,
          interviews: 0,
          hired: 0
        }
      });
    }

    const [applicants, interviews, hired] = await Promise.all([
      Application.countDocuments({
        jobId: { $in: companyJobIds },
        status: { $in: ['mentor_approved', 'company_quiz_pending', 'company_quiz_passed'] }
      }),
      Application.countDocuments({
        jobId: { $in: companyJobIds },
        status: 'interview_scheduled'
      }),
      Application.countDocuments({
        jobId: { $in: companyJobIds },
        status: { $in: ['selected', 'offer_accepted'] }
      })
    ]);

    res.status(200).json({
      success: true,
      stats: {
        activeJobs,
        applicants,
        interviews,
        hired
      }
    });
  } catch (error) {
    console.error('Error fetching company stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company stats',
      error: error.message
    });
  }
};

// Company reports (company-specific analytics)
export const getCompanyReports = async (req, res) => {
  try {
    const companyId = req.user._id;

    const jobs = await Job.find({ company: companyId })
      .select('_id title status createdAt applicationDeadline location jobType')
      .sort({ createdAt: -1 })
      .lean();

    if (!jobs.length) {
      return res.status(200).json({
        success: true,
        summary: {
          totalJobsPosted: 0,
          activeJobs: 0,
          totalApplications: 0,
          passedAndApplied: 0,
          mentorApproved: 0,
          interviewsScheduled: 0,
          hired: 0
        },
        jobs: []
      });
    }

    const jobIds = jobs.map((job) => job._id);
    const applications = await Application.find({ jobId: { $in: jobIds } })
      .select('jobId status')
      .lean();

    const passedAndAppliedStatuses = new Set([
      'pending_mentor',
      'mentor_approved',
      'mentor_rejected',
      'company_quiz_pending',
      'company_quiz_passed',
      'company_quiz_failed',
      'shortlisted',
      'interview_scheduled',
      'selected',
      'rejected',
      'offer_made',
      'offer_accepted'
    ]);

    const hiredStatuses = new Set(['selected', 'offer_accepted']);

    const reportByJobId = new Map(
      jobs.map((job) => [
        String(job._id),
        {
          jobId: job._id,
          title: job.title,
          status: job.status || 'active',
          location: job.location || 'Not specified',
          jobType: job.jobType || 'Not specified',
          postedOn: job.createdAt,
          applicationDeadline: job.applicationDeadline || null,
          totalApplications: 0,
          passedAndApplied: 0,
          mentorApproved: 0,
          interviewsScheduled: 0,
          hired: 0
        }
      ])
    );

    const summary = {
      totalJobsPosted: jobs.length,
      activeJobs: jobs.filter((job) => !job.status || job.status === 'active').length,
      totalApplications: 0,
      passedAndApplied: 0,
      mentorApproved: 0,
      interviewsScheduled: 0,
      hired: 0
    };

    for (const application of applications) {
      const jobKey = String(application.jobId);
      const jobReport = reportByJobId.get(jobKey);

      if (!jobReport) continue;

      jobReport.totalApplications += 1;
      summary.totalApplications += 1;

      if (passedAndAppliedStatuses.has(application.status)) {
        jobReport.passedAndApplied += 1;
        summary.passedAndApplied += 1;
      }

      if (application.status === 'mentor_approved') {
        jobReport.mentorApproved += 1;
        summary.mentorApproved += 1;
      }

      if (application.status === 'interview_scheduled') {
        jobReport.interviewsScheduled += 1;
        summary.interviewsScheduled += 1;
      }

      if (hiredStatuses.has(application.status)) {
        jobReport.hired += 1;
        summary.hired += 1;
      }
    }

    return res.status(200).json({
      success: true,
      summary,
      jobs: Array.from(reportByJobId.values())
    });
  } catch (error) {
    console.error('Error fetching company reports:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch company reports',
      error: error.message
    });
  }
};
