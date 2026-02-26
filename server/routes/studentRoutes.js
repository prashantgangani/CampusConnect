import express from 'express';
import multer from 'multer';
import { 
  getStudentProfile, 
  updateStudentProfile, 
  deleteResume,
  getSuggestedJobs,
  requestMentorByEmail,
  searchMentors,
  uploadResume
} from '../controllers/studentController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024
  }
});

const uploadResumeMiddleware = (req, res, next) => {
  upload.single('resume')(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Resume must be 2MB or smaller'
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message || 'Invalid file upload request'
    });
  });
};

// All routes are protected and only accessible by students
router.use(protect);
router.use(authorize('student'));

// Get student profile
router.get('/profile', getStudentProfile);

// Update student profile
router.put('/profile', updateStudentProfile);

// Delete resume
router.delete('/profile/resume', deleteResume);

// Upload/replace resume to Cloudinary
router.post('/profile/resume', uploadResumeMiddleware, uploadResume);

// Get mentor suggestions for logged-in student
router.get('/suggestions', getSuggestedJobs);

// Search mentors by email/name (min 3 chars)
router.get('/search-mentors', searchMentors);

// Student mentor request flow
router.post('/request-mentor', requestMentorByEmail);

export default router;
