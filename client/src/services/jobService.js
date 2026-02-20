import api from './api.js';
import notificationService, { NOTIFICATION_EVENTS } from './notificationService.js';

const jobService = {
  // Create a new job posting
  createJob: async (jobData) => {
    try {
      const response = await api.post('/jobs', jobData);
      // Emit event for all other components to refresh
      notificationService.emit(NOTIFICATION_EVENTS.JOB_CREATED, response.data.job);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all jobs
  getAllJobs: async () => {
    try {
      const response = await api.get('/jobs');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get jobs by company
  getJobsByCompany: async () => {
    try {
      const response = await api.get('/jobs/company');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get company-specific dashboard stats
  getCompanyStats: async () => {
    try {
      const response = await api.get('/jobs/company/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get job by ID
  getJobById: async (jobId) => {
    try {
      const response = await api.get(`/jobs/${jobId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update job
  updateJob: async (jobId, jobData) => {
    try {
      const response = await api.put(`/jobs/${jobId}`, jobData);
      // Emit event for all other components to refresh
      notificationService.emit(NOTIFICATION_EVENTS.JOB_UPDATED, response.data.job);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete job
  deleteJob: async (jobId) => {
    try {
      const response = await api.delete(`/jobs/${jobId}`);
      // Emit event for all other components to refresh
      notificationService.emit(NOTIFICATION_EVENTS.JOB_DELETED, { jobId });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get pending jobs (for placement)
  getPendingJobs: async () => {
    try {
      const response = await api.get('/jobs/pending');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Approve job (placement only)
  approveJob: async (jobId, notes) => {
    try {
      const response = await api.put(`/jobs/${jobId}/approve`, { notes });
      // Emit event for all other components to refresh
      notificationService.emit(NOTIFICATION_EVENTS.JOB_APPROVED, response.data.job);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Reject job (placement only)
  rejectJob: async (jobId, notes) => {
    try {
      const response = await api.put(`/jobs/${jobId}/reject`, { notes });
      // Emit event for all other components to refresh
      notificationService.emit(NOTIFICATION_EVENTS.JOB_REJECTED, response.data.job);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default jobService;
