import express from 'express';
import {
  createJob,
  getAllJobs,
  getJobsByCompany,
  getJobById,
  updateJob,
  deleteJob,
  getPendingJobs,
  approveJob,
  rejectJob
} from '../controllers/jobController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All job routes require authentication
router.use(protect);

// Get pending jobs (for placement verification)
router.get('/pending', authorize('placement'), getPendingJobs);

// Create a new job (company only)
router.post('/', authorize('company'), createJob);

// Get all jobs (students get approved active, mentors get all company posts)
router.get('/', authorize('student', 'mentor'), getAllJobs);

// Get jobs by company (all jobs for company)
router.get('/company', authorize('company'), getJobsByCompany);

// Temporary route to check all jobs (for debugging)
router.get('/debug-all', async (req, res) => {
  try {
    const jobs = await Job.find({}).sort({ createdAt: -1 });
    res.json({ success: true, jobs, count: jobs.length });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Get job by ID
router.get('/:id', getJobById);

// Update job (company only)
router.put('/:id', authorize('company'), updateJob);

// Approve job (placement only)
router.put('/:id/approve', authorize('placement'), approveJob);

// Reject job (placement only)
router.put('/:id/reject', authorize('placement'), rejectJob);

// Delete job (company only)
router.delete('/:id', authorize('company'), deleteJob);

export default router;
