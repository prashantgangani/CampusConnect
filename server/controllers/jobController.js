import Job from '../models/Job.js';
import Application from '../models/Application.js';

// Create a new job posting
export const createJob = async (req, res) => {
  try {
    const { title, description, requirements, location, salary, jobType, experience, skills, applicationDeadline } = req.body;

    // Get company from authenticated user
    const company = req.user._id;

    const job = new Job({
      title,
      description,
      requirements,
      company,
      location,
      salary,
      jobType,
      experience,
      skills,
      applicationDeadline
    });

    await job.save();

    res.status(201).json({
      success: true,
      message: 'Job posted successfully',
      job
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

// Get all jobs (for students and mentors - only approved jobs)
export const getAllJobs = async (req, res) => {
  try {
    const role = req.user?.role;

    // Mentors can review all company posts for suggestion workflows.
    const query = role === 'mentor'
      ? {}
      : {
          status: 'active',
          approvalStatus: 'approved'
        };

    const jobs = await Job.find(query)
      .populate('company', 'name email')
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
      .populate('company', 'name email');

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
    const updates = req.body;

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

    const updatedJob = await Job.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    });

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
      .populate('company', 'name email')
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
        status: { $ne: 'withdrawn' }
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
