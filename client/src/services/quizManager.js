/**
 * Quiz Manager Service
 * Centralized service for all quiz-related operations
 */

import api from './api';

const quizManager = {
  // Get all company quizzes
  getAllQuizzes: async () => {
    try {
      const response = await api.get('/applications/company/quizzes');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Upload or update a company quiz
  uploadQuiz: async (jobId, quizData) => {
    try {
      const response = await api.put(`/applications/company/jobs/${jobId}/quiz`, quizData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get quiz by job ID
  getQuizByJob: async (jobId) => {
    try {
      const response = await api.get(`/applications/company/jobs/${jobId}/quiz`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete a quiz
  deleteQuiz: async (jobId) => {
    try {
      const response = await api.delete(`/applications/company/jobs/${jobId}/quiz`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Reassign quiz to a student
  reassignQuiz: async (jobId, studentEmail) => {
    try {
      const response = await api.post(`/applications/company/jobs/${jobId}/reassign-quiz`, {
        studentEmail
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get quiz results for a specific job
  getQuizResults: async (jobId) => {
    try {
      const response = await api.get(`/applications/company/jobs/${jobId}/quiz-results`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Validate quiz data before submission
  validateQuizData: (quizData) => {
    const errors = [];

    if (!quizData.jobId) {
      errors.push('Job selection is required');
    }

    if (!quizData.startTime || !quizData.endTime) {
      errors.push('Start and end times are required');
    }

    if (new Date(quizData.startTime) >= new Date(quizData.endTime)) {
      errors.push('End time must be after start time');
    }

    if (!Array.isArray(quizData.questions) || quizData.questions.length === 0) {
      errors.push('At least one question is required');
    }

    quizData.questions?.forEach((question, index) => {
      if (!question.question?.trim()) {
        errors.push(`Question ${index + 1}: prompt is required`);
      }
      if (!Array.isArray(question.options) || question.options.length !== 4) {
        errors.push(`Question ${index + 1}: exactly 4 options are required`);
      }
      if (!question.correctAnswer || !question.options.includes(question.correctAnswer)) {
        errors.push(`Question ${index + 1}: correct answer must be one of the options`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

export default quizManager;
