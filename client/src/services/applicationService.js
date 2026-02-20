import api from './api.js';

const applicationService = {
  // Get all applications for student
  getApplications: async () => {
    try {
      const response = await api.get('/applications');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Apply for a job
  applyForJob: async (jobId) => {
    try {
      const response = await api.post('/applications/apply', { jobId });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Submit quiz answers
  submitQuiz: async (applicationId, jobId, answers) => {
    try {
      const response = await api.post('/applications/submit-quiz', {
        applicationId,
        jobId,
        answers
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Start quiz for application
  startQuiz: async (applicationId) => {
    try {
      const response = await api.post('/applications/start-quiz', { applicationId });
      return response.data;
    } catch (error) {
      const status = error?.status || error?.response?.status;

      // Legacy fallback for route mismatch only
      if (status === 404) {
        try {
          const response = await api.get(`/applications/${applicationId}/start-quiz`);
          return response.data;
        } catch (fallbackError) {
          throw fallbackError.response?.data || fallbackError.message;
        }
      }

      throw error.response?.data || error.message;
    }
  },

  // Submit quiz for application (Question-based flow)
  submitApplicationQuiz: async (applicationId, answers) => {
    try {
      const response = await api.post('/applications/submit-quiz', {
        applicationId,
        answers
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get application details
  getApplicationDetail: async (applicationId) => {
    try {
      const response = await api.get(`/applications/${applicationId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get quiz result
  getQuizResult: async (applicationId) => {
    try {
      const response = await api.get(`/applications/${applicationId}/quiz-result`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Withdraw application
  withdrawApplication: async (applicationId) => {
    try {
      const response = await api.delete(`/applications/${applicationId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default applicationService;
