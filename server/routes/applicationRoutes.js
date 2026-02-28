import express from 'express';
import {
  getStudentApplications,
  applyForJob,
  startQuiz,
  submitQuiz,
  getApplicationDetail,
  withdrawApplication,
  getQuizResult,
  getMentorAwaitingApplications,
  approveApplicationByMentor,
  rejectApplicationByMentor
} from '../controllers/applicationController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Mentor approval routes
router.get('/mentor/awaiting', authorize('mentor'), getMentorAwaitingApplications);
router.patch('/:id/approve', authorize('mentor'), approveApplicationByMentor);
router.patch('/:id/reject', authorize('mentor'), rejectApplicationByMentor);

// Student routes require student role
router.use(authorize('student'));

// Get all applications for student
router.get('/', getStudentApplications);

// Apply for a job
router.post('/apply', applyForJob);

// Start quiz for an application
router.post('/start-quiz', startQuiz);
router.get('/:applicationId/start-quiz', startQuiz);
router.get('/start-quiz/:applicationId', startQuiz);
router.get('/startQuiz/:applicationId', startQuiz);

// Submit quiz answers
router.post('/submit-quiz', submitQuiz);
router.post('/submitQuiz', submitQuiz);

// Get specific application details
router.get('/:applicationId', getApplicationDetail);

// Get quiz result for an application
router.get('/:applicationId/quiz-result', getQuizResult);

// Withdraw application
router.delete('/:applicationId', withdrawApplication);

export default router;
