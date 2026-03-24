import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import jobService from '../../services/jobService';
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

  const [companyJobs, setCompanyJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [quizSaving, setQuizSaving] = useState(false);

  const [quizForm, setQuizForm] = useState({
    jobId: '',
    title: 'Company Round Quiz',
    description: '',
    passingPercentage: 70,
    timeLimit: 30,
    quizDeadline: '',
    questions: [createEmptyQuestion()]
  });

  useEffect(() => {
    const loadJobs = async () => {
      setLoading(true);
      try {
        const jobsData = await jobService.getJobsByCompany();
        const jobs = Array.isArray(jobsData.jobs) ? jobsData.jobs : [];
        setCompanyJobs(jobs);
        setQuizForm((prev) => ({
          ...prev,
          jobId: prev.jobId || jobs?.[0]?._id || ''
        }));
      } catch (err) {
        setMessage({ text: err.message || 'Failed to load company jobs.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
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
    if (!quizForm.jobId || !quizForm.quizDeadline || !quizForm.questions.length) {
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
        quizDeadline: quizForm.quizDeadline,
        questions: quizForm.questions.map((question) => ({
          question: question.question.trim(),
          options: question.options.map((option) => option.trim()),
          correctAnswer: question.correctAnswer.trim(),
          marks: Number(question.marks) || 1
        }))
      };

      await jobService.uploadCompanyApplicantQuiz(quizForm.jobId, payload);

      setMessage({
        text: 'Quiz uploaded successfully. Eligible applicants will move to company quiz round.',
        type: 'success'
      });
    } catch (err) {
      setMessage({ text: err.message || 'Failed to upload company applicant quiz.', type: 'error' });
    } finally {
      setQuizSaving(false);
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
        <h1>Upload Company Applicant Quiz</h1>
        <p>Create and manage company-round quizzes without crowding the applicants screen.</p>
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
                    onChange={(event) => setQuizForm((prev) => ({ ...prev, jobId: event.target.value }))}
                  >
                    {companyJobs.map((job) => (
                      <option key={job._id} value={job._id}>{job.title}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Deadline
                  <input
                    type="datetime-local"
                    value={quizForm.quizDeadline}
                    onChange={(event) => setQuizForm((prev) => ({ ...prev, quizDeadline: event.target.value }))}
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
                    min="1"
                    value={quizForm.timeLimit}
                    onChange={(event) => setQuizForm((prev) => ({ ...prev, timeLimit: event.target.value }))}
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
                  {quizSaving ? 'Uploading...' : 'Upload Quiz'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyApplicantQuizUpload;
