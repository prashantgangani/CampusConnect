import express from 'express';
import {
  getStudentApplications,
  applyForJob,
  startQuiz,
  submitQuiz,
  getApplicationDetail,
  withdrawApplication,
  getQuizResult
} from '../controllers/applicationController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// All routes require authentication and student role
router.use(protect);
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
