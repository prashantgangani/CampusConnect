import express from 'express';
import {
	getPlacementDashboardData,
	getRecentJobPosts,
	getRecentCompanyRegistrations,
	getPlacementProfile,
	updatePlacementProfile,
	approveCompany,
	getPlacementAnalytics,
	getPlacementReportData
} from '../controllers/placementController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('placement'));

router.get('/dashboard', getPlacementDashboardData);
router.get('/recent-jobs', getRecentJobPosts);
router.get('/recent-companies', getRecentCompanyRegistrations);
router.get('/profile', getPlacementProfile);
router.put('/profile', updatePlacementProfile);
router.put('/companies/:companyId/approve', approveCompany);
router.get('/analytics', getPlacementAnalytics);
router.post('/report-data', getPlacementReportData);

export default router;
