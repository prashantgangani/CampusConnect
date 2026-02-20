import express from 'express';
import {
	getStudentsForMentor,
	suggestJobToStudent,
	getRecentSuggestions
} from '../controllers/mentorController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('mentor'));

router.get('/students', getStudentsForMentor);
router.post('/suggest', suggestJobToStudent);
router.get('/suggestions/recent', getRecentSuggestions);

export default router;
