import api from './api';

const mentorService = {
  getStudents: async () => {
    const response = await api.get('/mentor/students');
    return response.data;
  },

  suggestJob: async ({ jobId, studentId, studentIds }) => {
    const payload = { jobId };

    if (Array.isArray(studentIds) && studentIds.length) {
      payload.studentIds = studentIds;
    } else if (studentId) {
      payload.studentId = studentId;
    }

    const response = await api.post('/mentor/suggest', payload);
    return response.data;
  },

  getRecentSuggestions: async () => {
    const response = await api.get('/mentor/suggestions/recent');
    return response.data;
  },

  getSuggestionsTotal: async () => {
    const response = await api.get('/mentor/suggestions/total');
    return response.data;
  },

  getAwaitingApprovals: async () => {
    const response = await api.get('/mentor/applications/awaiting');
    return response.data;
  },

  approveApplication: async (applicationId) => {
    const response = await api.patch(`/mentor/applications/${applicationId}/approve`);
    return response.data;
  },

  rejectApplication: async (applicationId) => {
    const response = await api.patch(`/mentor/applications/${applicationId}/reject`);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/mentor/profile');
    return response.data;
  },

  searchPlacementCells: async (query) => {
    const response = await api.get('/mentor/search-placement-cells', {
      params: { q: query }
    });
    return response.data;
  },

  assignPlacementCell: async (placementEmail) => {
    const response = await api.post('/mentor/assign-placement-cell', { placementEmail });
    return response.data;
  }
};

export default mentorService;
