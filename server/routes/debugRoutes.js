import express from 'express';
import Job from '../models/Job.js';
import User from '../models/User.js';

const router = express.Router();

// Debug: Check MongoDB connection and data
router.get('/db-status', async (req, res) => {
  try {
    const connection = await Job.collection.db.admin().ping();
    const jobCount = await Job.countDocuments();
    const userCount = await User.countDocuments();
    
    res.json({
      success: true,
      mongodb: 'connected',
      collections: {
        jobs: jobCount,
        users: userCount
      },
      ping: connection
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection error',
      error: error.message
    });
  }
});

// Debug: Get all jobs (no filtering)
router.get('/all-jobs', async (req, res) => {
  try {
    const jobs = await Job.find({})
      .populate('company', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: jobs.length,
      jobs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch jobs',
      error: error.message
    });
  }
});

export default router;
