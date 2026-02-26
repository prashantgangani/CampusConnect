import api from './api';

const uploadResume = async (file) => {
  const formData = new FormData();
  formData.append('resume', file);

  try {
    const response = await api.post('/resume/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data;
  } catch (error) {
    if (error?.status === 404) {
      const fallbackResponse = await api.post('/student/profile/resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return fallbackResponse.data;
    }

    throw error;
  }
};

export default {
  uploadResume
};
