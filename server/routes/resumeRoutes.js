import express from 'express';
import { uploadResume } from '../controllers/resumeController.js';
import { uploadResumeSingle } from '../middlewares/uploadMiddleware.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';

const router = express.Router();

router.post('/upload', protect, authorize('student'), uploadResumeSingle, uploadResume);

export default router;
