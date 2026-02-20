import express from 'express';
import {
	getPlacementDashboardData,
	getRecentJobPosts,
	getRecentCompanyRegistrations,
	approveCompany
} from '../controllers/placementController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('placement'));

router.get('/dashboard', getPlacementDashboardData);
router.get('/recent-jobs', getRecentJobPosts);
router.get('/recent-companies', getRecentCompanyRegistrations);
router.put('/companies/:companyId/approve', approveCompany);

export default router;
