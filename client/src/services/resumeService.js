import api from './api';

const uploadResume = async (file, onUploadProgress) => {
  const formData = new FormData();
  formData.append('resume', file);

  const requestConfig = {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    ...(typeof onUploadProgress === 'function' ? { onUploadProgress } : {})
  };

  try {
    const response = await api.post('/resume/upload', formData, requestConfig);

    return response.data;
  } catch (error) {
    if (error?.status === 404) {
      const fallbackResponse = await api.post('/student/profile/resume', formData, requestConfig);

      return fallbackResponse.data;
    }

    throw error;
  }
};

const getResumeUrl = async (publicId) => {
  const response = await api.get(`/resume/download/${encodeURIComponent(publicId)}`);
  return response.data;
};

export default {
  uploadResume,
  getResumeUrl
};
