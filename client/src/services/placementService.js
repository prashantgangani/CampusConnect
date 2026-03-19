import api from './api';

const placementService = {
  getDashboard: async () => {
    const response = await api.get('/placement/dashboard');
    return response.data;
  },

  getRecentJobs: async () => {
    const response = await api.get('/placement/recent-jobs');
    return response.data;
  },

  getRecentCompanies: async () => {
    const response = await api.get('/placement/recent-companies');
    return response.data;
  },

  approveCompany: async (companyId) => {
    const response = await api.put(`/placement/companies/${companyId}/approve`);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/placement/profile');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/placement/profile', profileData);
    return response.data;
  }
};

export default placementService;
