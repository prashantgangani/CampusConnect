import express from 'express';
import {
	getStudentsForMentor,
	suggestJobToStudent,
	getRecentSuggestions,
	getSuggestionsTotal,
	getPendingMentorRequests,
	reviewMentorRequest,
	getMentorProfile,
	searchPlacementCells,
	assignPlacementCellByEmail
} from '../controllers/mentorController.js';
import {
  getMentorAwaitingApplications,
  approveApplicationByMentor,
  rejectApplicationByMentor
} from '../controllers/applicationController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('mentor'));

router.get('/students', getStudentsForMentor);
router.post('/suggest', suggestJobToStudent);
router.get('/suggestions/recent', getRecentSuggestions);
router.get('/suggestions/total', getSuggestionsTotal);
router.get('/requests/pending', getPendingMentorRequests);
router.post('/review-request', reviewMentorRequest);
router.get('/profile', getMentorProfile);
router.get('/search-placement-cells', searchPlacementCells);
router.post('/assign-placement-cell', assignPlacementCellByEmail);
router.get('/applications/awaiting', getMentorAwaitingApplications);
router.patch('/applications/:id/approve', approveApplicationByMentor);
router.patch('/applications/:id/reject', rejectApplicationByMentor);

export default router;
