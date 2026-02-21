import express from 'express';
import { 
  getStudentProfile, 
  updateStudentProfile, 
  deleteResume,
  getSuggestedJobs,
  requestMentorByEmail,
  searchMentors
} from '../controllers/studentController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// All routes are protected and only accessible by students
router.use(protect);
router.use(authorize('student'));

// Get student profile
router.get('/profile', getStudentProfile);

// Update student profile
router.put('/profile', updateStudentProfile);

// Delete resume
router.delete('/profile/resume', deleteResume);

// Get mentor suggestions for logged-in student
router.get('/suggestions', getSuggestedJobs);

// Search mentors by email/name (min 3 chars)
router.get('/search-mentors', searchMentors);

// Student mentor request flow
router.post('/request-mentor', requestMentorByEmail);

export default router;
