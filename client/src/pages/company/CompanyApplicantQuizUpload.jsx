import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import jobService from '../../services/jobService';
import quizManager from '../../services/quizManager';
import '../student/Dashboard.css';
import './CompanyApplicantQuizUpload.css';

const createEmptyQuestion = () => ({
  question: '',
  options: ['', '', '', ''],
  correctAnswer: '',
  marks: 1
});

const CompanyApplicantQuizUpload = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [companyJobs, setCompanyJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [quizSaving, setQuizSaving] = useState(false);
  const [quizzes, setQuizzes] = useState([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const [quizForm, setQuizForm] = useState({
    jobId: '',
    title: 'Company Round Quiz',
    description: '',
    passingPercentage: 70,
    timeLimit: 30,
    startTime: '',
    endTime: '',
    questions: [createEmptyQuestion()]
  });

  // Auto-calculate duration when start and end times change
  const calculateDuration = (start, end) => {
    if (!start || !end) return '';
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return '';
    const diffMs = endDate - startDate;
    if (diffMs <= 0) return '';
    const diffMins = Math.round(diffMs / 60000);
    return diffMins.toString();
  };

  // Auto-calculate end time when start time and duration change (FIXED - no timezone issues)
  const calculateEndTime = (start, durationStr) => {
    if (!start || !durationStr) return '';
    const duration = parseInt(durationStr, 10);
    if (isNaN(duration) || duration <= 0) return '';
    
    // Parse datetime-local string: "2026-03-24T21:30"
    const dateParts = start.split('T');
    if (dateParts.length !== 2) return '';
    
    const [year, month, day] = dateParts[0].split('-').map(Number);
    const [hours, minutes] = dateParts[1].split(':').map(Number);
    
    // Create date with local timezone (not UTC)
    const startDate = new Date(year, month - 1, day, hours, minutes, 0);
    
    // Add duration in minutes
    const endDate = new Date(startDate.getTime() + duration * 60000);
    
    // Format back to datetime-local: "2026-03-24T21:50"
    const endYear = endDate.getFullYear();
    const endMonth = String(endDate.getMonth() + 1).padStart(2, '0');
    const endDay = String(endDate.getDate()).padStart(2, '0');
    const endHours = String(endDate.getHours()).padStart(2, '0');
    const endMinutes = String(endDate.getMinutes()).padStart(2, '0');
    
    return `${endYear}-${endMonth}-${endDay}T${endHours}:${endMinutes}`;
  };

  const loadCompanyQuizForJob = async (jobId) => {
    if (!jobId) return;
    try {
      setLoading(true);
      const response = await jobService.getCompanyApplicantQuizByJob(jobId);
      if (response?.success && response?.data) {
        const quiz = response.data;
        setQuizForm((prev) => ({
          ...prev,
          title: quiz.title || 'Company Round Quiz',
          description: quiz.description || '',
          passingPercentage: quiz.passingPercentage || 70,
          timeLimit: quiz.timeLimit || 30,
          startTime: quiz.startTime ? new Date(quiz.startTime).toISOString().slice(0, 16) : '',
          endTime: quiz.endTime ? new Date(quiz.endTime).toISOString().slice(0, 16) : '',
          questions: Array.isArray(quiz.questions) && quiz.questions.length > 0 ? quiz.questions : [createEmptyQuestion()]
        }));
      } else {
        setQuizForm((prev) => ({
          ...prev,
          title: 'Company Round Quiz',
          description: '',
          passingPercentage: 70,
          timeLimit: 30,
          startTime: '',
          endTime: '',
          questions: [createEmptyQuestion()]
        }));
      }
    } catch (err) {
      // no existing quiz is OK
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadJobs = async () => {
      setLoading(true);
      try {
        const jobsData = await jobService.getJobsByCompany();
        const jobs = Array.isArray(jobsData.jobs) ? jobsData.jobs : [];
        setCompanyJobs(jobs);

        const defaultJobId = quizForm.jobId || jobs?.[0]?._id || '';
        setQuizForm((prev) => ({ ...prev, jobId: defaultJobId }));

        if (defaultJobId) {
          await loadCompanyQuizForJob(defaultJobId);
        }
      } catch (err) {
        setMessage({ text: err.message || 'Failed to load company jobs.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, []);

  // Handle edit mode from navigation state
  useEffect(() => {
    const state = location.state;
    if (state?.quiz && state?.isEdit) {
      const quiz = state.quiz;
      setIsEditMode(true);
      setQuizForm({
        jobId: quiz.jobId,
        title: quiz.title || 'Company Round Quiz',
        description: quiz.description || '',
        passingPercentage: quiz.passingPercentage || 70,
        timeLimit: quiz.timeLimit || 30,
        startTime: quiz.startTime ? new Date(quiz.startTime).toISOString().slice(0, 16) : '',
        endTime: quiz.endTime ? new Date(quiz.endTime).toISOString().slice(0, 16) : '',
        questions: Array.isArray(quiz.questions) && quiz.questions.length > 0 ? quiz.questions : [createEmptyQuestion()]
      });
      setLoading(false);
    } else {
      setIsEditMode(false);
    }
  }, [location.state]);

  useEffect(() => {
    loadQuizzes();
  }, []);

  const addQuestion = () => {
    setQuizForm((prev) => ({
      ...prev,
      questions: [...prev.questions, createEmptyQuestion()]
    }));
  };

  const removeQuestion = (index) => {
    setQuizForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, idx) => idx !== index)
    }));
  };

  const updateQuestionField = (index, field, value) => {
    setQuizForm((prev) => {
      const nextQuestions = [...prev.questions];
      nextQuestions[index] = {
        ...nextQuestions[index],
        [field]: value
      };
      return {
        ...prev,
        questions: nextQuestions
      };
    });
  };

  const updateQuestionOption = (index, optionIndex, value) => {
    setQuizForm((prev) => {
      const nextQuestions = [...prev.questions];
      const nextOptions = [...nextQuestions[index].options];
      nextOptions[optionIndex] = value;
      nextQuestions[index] = {
        ...nextQuestions[index],
        options: nextOptions
      };
      return {
        ...prev,
        questions: nextQuestions
      };
    });
  };

  const canSubmitQuiz = useMemo(() => {
    if (!quizForm.jobId || !quizForm.startTime || !quizForm.endTime || !quizForm.questions.length) {
      return false;
    }

    const now = new Date();
    const startTime = new Date(quizForm.startTime);
    const endTime = new Date(quizForm.endTime);

    if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
      return false;
    }

    if (startTime < now || endTime <= startTime) {
      return false;
    }

    return quizForm.questions.every((question) => {
      const trimmedQuestion = question.question.trim();
      const trimmedOptions = question.options.map((opt) => opt.trim());
      const selectedAnswer = question.correctAnswer.trim();
      return (
        trimmedQuestion &&
        trimmedOptions.length === 4 &&
        trimmedOptions.every(Boolean) &&
        selectedAnswer &&
        trimmedOptions.includes(selectedAnswer)
      );
    });
  }, [quizForm]);

  const handleUploadQuiz = async () => {
    if (!canSubmitQuiz) {
      setMessage({ text: 'Please complete all quiz fields correctly before uploading.', type: 'error' });
      return;
    }

    try {
      setQuizSaving(true);
      setMessage({ text: '', type: '' });

      const payload = {
        title: quizForm.title,
        description: quizForm.description,
        passingPercentage: Number(quizForm.passingPercentage) || 70,
        timeLimit: Number(quizForm.timeLimit) || 30,
        startTime: quizForm.startTime,
        endTime: quizForm.endTime,
        questions: quizForm.questions.map((question) => ({
          question: question.question.trim(),
          options: question.options.map((option) => option.trim()),
          correctAnswer: question.correctAnswer.trim(),
          marks: Number(question.marks) || 1
        }))
      };

      // Validate quiz data
      const validation = quizManager.validateQuizData({
        ...payload,
        jobId: quizForm.jobId
      });

      if (!validation.isValid) {
        setMessage({ text: validation.errors.join('; '), type: 'error' });
        return;
      }

      await quizManager.uploadQuiz(quizForm.jobId, payload);

      const successMsg = isEditMode 
        ? 'Quiz updated successfully! Changes will apply to new quiz attempts.'
        : 'Quiz uploaded successfully. Eligible applicants will move to company quiz round.';

      setMessage({
        text: successMsg,
        type: 'success'
      });
      
      // Reset form for new quiz (only if not in edit mode)
      if (!isEditMode) {
        setQuizForm({
          jobId: quizForm.jobId,
          title: 'Company Round Quiz',
          description: '',
          passingPercentage: 70,
          timeLimit: 30,
          startTime: '',
          endTime: '',
          questions: [createEmptyQuestion()]
        });
      }
      
      // Reload quizzes after upload
      setTimeout(() => loadQuizzes(), 500);
    } catch (err) {
      setMessage({ text: err.message || 'Failed to upload company applicant quiz.', type: 'error' });
    } finally {
      setQuizSaving(false);
    }
  };

  const loadQuizzes = async () => {
    setLoadingQuizzes(true);
    try {
      const response = await quizManager.getAllQuizzes();
      setQuizzes(response.data || []);
    } catch (error) {
      console.error('Failed to load company quizzes:', error);
      setQuizzes([]);
    } finally {
      setLoadingQuizzes(false);
    }
  };

  const handleEditQuiz = (quiz) => {
    navigate('/company/quiz-upload', { state: { quiz, isEdit: true } });
  };

  const handleDeleteQuiz = async (quiz) => {
    if (!window.confirm(`Are you sure you want to delete the quiz for "${quiz.jobTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await quizManager.deleteQuiz(quiz.jobId);
      setMessage({
        text: `Quiz for "${quiz.jobTitle}" deleted successfully!`,
        type: 'success'
      });
      loadQuizzes();
    } catch (error) {
      console.error('Failed to delete quiz:', error);
      setMessage({
        text: error.message || 'Failed to delete quiz. Please try again.',
        type: 'error'
      });
    }
  };

  const handleReassignQuiz = async (quiz) => {
    const studentEmail = prompt(`Enter student email to reassign quiz for "${quiz.jobTitle}":`);
    if (!studentEmail || !studentEmail.trim()) {
      return;
    }

    try {
      await quizManager.reassignQuiz(quiz.jobId, studentEmail.trim());
      setMessage({
        text: `Quiz reassigned successfully to ${studentEmail}!`,
        type: 'success'
      });
    } catch (error) {
      console.error('Failed to reassign quiz:', error);
      setMessage({
        text: error.message || 'Failed to reassign quiz. Please check the email and try again.',
        type: 'error'
      });
    }
  };

  return (
    <div className="student-dashboard company-quiz-upload-root">
      <div className="dashboard-header">
        <div className="header-left">
          <div className="logo-section">
            <span className="logo-icon">🏢</span>
            <span className="logo-text">
              <span className="logo-campus">Campus</span>
              <span className="logo-connect">Connect</span>
            </span>
          </div>
        </div>

        <div className="header-right">
          <button className="profile-btn" onClick={() => navigate('/company/applicants')}>View Applicants</button>
          <button className="back-btn" onClick={() => navigate('/company/dashboard')}>← Back to Dashboard</button>
        </div>
      </div>

      <div className="welcome-section">
        <h1>{isEditMode ? 'Edit Company Quiz' : 'Upload Company Applicant Quiz'}</h1>
        <p>{isEditMode ? 'Update the quiz configuration and questions.' : 'Create and manage company-round quizzes without crowding the applicants screen.'}</p>
      </div>

      <div className="dashboard-main">
        <div className="full-width-section">
          <div className="company-quiz-upload-card company-quiz-upload-info">
            <h3>Before You Publish</h3>
            <p>
              This quiz is sent to students who pass mentor verification for the selected job. After quiz deadline,
              passed students appear in the "Students Passed Company Quiz" section for your final approval.
            </p>
            <ul>
              <li>Pick the correct job role and deadline.</li>
              <li>Set clear passing percentage and time limit.</li>
              <li>Add only job-relevant questions with unambiguous answers.</li>
            </ul>
          </div>

          {message.text && (
            <div className={`company-quiz-upload-message ${message.type}`}>
              {message.text}
            </div>
          )}

          {loading ? (
            <div className="company-quiz-upload-card">
              <p>Loading company jobs...</p>
            </div>
          ) : companyJobs.length === 0 ? (
            <div className="company-quiz-upload-card">
              <p>No jobs found. Post a job first, then upload a company applicant quiz.</p>
            </div>
          ) : (
            <div className="company-quiz-upload-card">
              <h3>Quiz Configuration</h3>

              <div className="company-quiz-upload-grid">
                <label>
                  Job
                  <select
                    value={quizForm.jobId}
                    onChange={async (event) => {
                      const selectedJobId = event.target.value;
                      setQuizForm((prev) => ({ ...prev, jobId: selectedJobId }));
                      await loadCompanyQuizForJob(selectedJobId);
                    }}
                  >
                    {companyJobs.map((job) => (
                      <option key={job._id} value={job._id}>{job.title}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Start Time
                  <input
                    type="datetime-local"
                    value={quizForm.startTime}
                    onChange={(event) => {
                      const newStart = event.target.value;
                      setQuizForm((prev) => ({ ...prev, startTime: newStart }));
                      
                      // If end time exists, recalculate duration
                      if (quizForm.endTime) {
                        const duration = calculateDuration(newStart, quizForm.endTime);
                        if (duration) {
                          setQuizForm((prev) => ({ ...prev, timeLimit: duration }));
                        }
                      }
                      // If duration exists but no end time, calculate end time
                      else if (quizForm.timeLimit && quizForm.timeLimit.toString().trim() !== '') {
                        const newEndTime = calculateEndTime(newStart, quizForm.timeLimit.toString());
                        if (newEndTime) {
                          setQuizForm((prev) => ({ ...prev, endTime: newEndTime }));
                        }
                      }
                    }}
                  />
                </label>

                <label>
                  End Time
                  <input
                    type="datetime-local"
                    value={quizForm.endTime}
                    onChange={(event) => {
                      const newEnd = event.target.value;
                      setQuizForm((prev) => ({ ...prev, endTime: newEnd }));
                      // Auto-calculate duration only if start time is set
                      if (quizForm.startTime) {
                        const duration = calculateDuration(quizForm.startTime, newEnd);
                        if (duration) {
                          setQuizForm((prev) => ({ ...prev, timeLimit: duration }));
                        }
                      }
                    }}
                  />
                </label>

                <label>
                  Passing %
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={quizForm.passingPercentage}
                    onChange={(event) => setQuizForm((prev) => ({ ...prev, passingPercentage: event.target.value }))}
                  />
                </label>

                <label>
                  Time (minutes)
                  <input
                    type="number"
                    value={quizForm.timeLimit}
                    placeholder="Enter duration in minutes"
                    onChange={(event) => {
                      const inputValue = event.target.value;
                      // Allow empty string so user can clear the field
                      setQuizForm((prev) => ({ ...prev, timeLimit: inputValue }));
                      
                      // Only calculate end time if we have valid start time and duration
                      if (quizForm.startTime && inputValue && inputValue.trim() !== '') {
                        const durationNum = parseInt(inputValue, 10);
                        if (durationNum > 0) {
                          const newEndTime = calculateEndTime(quizForm.startTime, inputValue);
                          if (newEndTime) {
                            setQuizForm((prev) => ({ ...prev, endTime: newEndTime }));
                          }
                        }
                      }
                    }}
                  />
                </label>
              </div>

              <label className="company-quiz-upload-block">
                Quiz Title
                <input
                  type="text"
                  value={quizForm.title}
                  onChange={(event) => setQuizForm((prev) => ({ ...prev, title: event.target.value }))}
                />
              </label>

              <label className="company-quiz-upload-block">
                Description
                <textarea
                  rows={2}
                  value={quizForm.description}
                  onChange={(event) => setQuizForm((prev) => ({ ...prev, description: event.target.value }))}
                />
              </label>

              <div className="company-quiz-question-list">
                {quizForm.questions.map((question, index) => (
                  <div key={`q-${index}`} className="company-quiz-question-item">
                    <div className="company-quiz-question-top">
                      <h4>Question {index + 1}</h4>
                      {quizForm.questions.length > 1 && (
                        <button type="button" className="company-quiz-link-btn" onClick={() => removeQuestion(index)}>
                          Remove
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      placeholder="Enter question"
                      value={question.question}
                      onChange={(event) => updateQuestionField(index, 'question', event.target.value)}
                    />

                    <div className="company-quiz-options-grid">
                      {question.options.map((option, optionIndex) => (
                        <input
                          key={`q-${index}-opt-${optionIndex}`}
                          type="text"
                          placeholder={`Option ${optionIndex + 1}`}
                          value={option}
                          onChange={(event) => updateQuestionOption(index, optionIndex, event.target.value)}
                        />
                      ))}
                    </div>

                    <div className="company-quiz-question-bottom">
                      <label>
                        Correct Answer
                        <select
                          value={question.correctAnswer}
                          onChange={(event) => updateQuestionField(index, 'correctAnswer', event.target.value)}
                        >
                          <option value="">Select answer</option>
                          {question.options
                            .map((option) => option.trim())
                            .filter(Boolean)
                            .map((option) => (
                              <option key={`q-${index}-ans-${option}`} value={option}>
                                {option}
                              </option>
                            ))}
                        </select>
                      </label>

                      <label>
                        Marks
                        <input
                          type="number"
                          min="1"
                          value={question.marks}
                          onChange={(event) => updateQuestionField(index, 'marks', event.target.value)}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <div className="company-quiz-upload-actions">
                <button type="button" className="profile-btn-small" onClick={addQuestion}>+ Add Question</button>
                <button
                  type="button"
                  className="hire-btn-small"
                  disabled={!canSubmitQuiz || quizSaving}
                  onClick={handleUploadQuiz}
                >
                  {quizSaving ? (isEditMode ? 'Updating...' : 'Uploading...') : (isEditMode ? 'Update Quiz' : 'Upload Quiz')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Uploaded Quizzes Section */}
        <div className="full-width-section">
          <div className="company-quiz-upload-card">
            <h3>Uploaded Quizzes</h3>
            {loadingQuizzes ? (
              <p>Loading quizzes...</p>
            ) : quizzes.length === 0 ? (
              <p className="applicants-muted">No quizzes uploaded yet. Create one above to get started.</p>
            ) : (
              <div className="quiz-grid-container">
                {quizzes.map((quiz) => (
                  <div key={quiz._id} className="quiz-card">
                    <div className="quiz-card-header">
                      <h4 title={quiz.jobTitle}>{quiz.jobTitle || 'Quiz'}</h4>
                      <span className="quiz-questions-count">{quiz.questions?.length || 0} Q</span>
                    </div>
                    <div className="quiz-card-body">
                      <p><strong>Time:</strong> {quiz.timeLimit} mins</p>
                      <p><strong>Pass:</strong> {quiz.passingPercentage}%</p>
                      {quiz.description && (
                        <p className="quiz-description">{quiz.description}</p>
                      )}
                    </div>
                    <div className="quiz-card-footer">
                      <small>{new Date(quiz.createdAt).toLocaleDateString()}</small>
                    </div>
                    <div className="quiz-card-actions">
                      <button 
                        className="profile-btn-small" 
                        onClick={() => handleEditQuiz(quiz)}
                        title="Edit this quiz"
                      >
                        ✏️ Edit
                      </button>
                      <button 
                        className="reject-btn-small" 
                        onClick={() => handleDeleteQuiz(quiz)}
                        title="Delete this quiz"
                      >
                        🗑️ Delete
                      </button>
                      <button 
                        className="profile-btn-small" 
                        onClick={() => handleReassignQuiz(quiz)}
                        title="Reassign quiz to a student"
                      >
                        ↪️ Reassign
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyApplicantQuizUpload;
