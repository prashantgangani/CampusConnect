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
  }
};

export default mentorService;
