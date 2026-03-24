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
  rejectApplicationByMentor,
  getCompanyApprovedApplications,
  rejectApplicationByCompany,
  upsertCompanyApplicantQuiz,
  hireApplicationByCompany,
  selectApplicationFromInterview,
  getCompanyApplicantQuiz,
  reassignCompanyApplicant,
  getStudentCompanyQuizzes,
  getCompanyQuizzes,
  deleteCompanyApplicantQuiz,
  reassignCompanyQuizToStudent
} from '../controllers/applicationController.js';
import { getStudentProfileForCompany } from '../controllers/studentController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Mentor approval routes
router.get('/mentor/awaiting', authorize('mentor'), getMentorAwaitingApplications);
router.patch('/:id/approve', authorize('mentor'), approveApplicationByMentor);
router.patch('/:id/reject', authorize('mentor'), rejectApplicationByMentor);

// Company route for mentor-approved applications
router.get('/company/approved', authorize('company'), getCompanyApprovedApplications);
router.get('/company/jobs/:jobId/quiz', authorize('company'), getCompanyApplicantQuiz);
router.put('/company/jobs/:jobId/quiz', authorize('company'), upsertCompanyApplicantQuiz);
router.patch('/company/:id/hire', authorize('company'), hireApplicationByCompany);
router.patch('/company/:id/select', authorize('company'), selectApplicationFromInterview);
router.patch('/company/:id/reject', authorize('company'), rejectApplicationByCompany);
router.patch('/company/:id/reassign', authorize('company'), reassignCompanyApplicant);

// Company quiz management routes
router.get('/company/quizzes', authorize('company'), getCompanyQuizzes);
router.delete('/company/jobs/:jobId/quiz', authorize('company'), deleteCompanyApplicantQuiz);
router.post('/company/jobs/:jobId/reassign-quiz', authorize('company'), reassignCompanyQuizToStudent);

// Company route to view student profile (only for approved applications)
router.get('/student/:studentId/profile', authorize('company'), getStudentProfileForCompany);

// Student routes require student role
router.use(authorize('student'));

// Get all applications for student
router.get('/', getStudentApplications);

// Apply for a job
router.post('/apply', applyForJob);

// Get company quiz information assigned to student
router.get('/student/company-quizzes', getStudentCompanyQuizzes);

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
