import express from 'express';
import { uploadResume, downloadResume } from '../controllers/resumeController.js';
import { uploadResumeSingle } from '../middlewares/uploadMiddleware.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';

const router = express.Router();

router.post('/upload', protect, authorize('student'), uploadResumeSingle, uploadResume);
// Allow students (own resume) and companies (applicant resumes) to retrieve download URL
router.get('/download/:publicId', protect, authorize('student', 'company', 'mentor', 'admin'), downloadResume);

export default router;
