import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import jobService from '../../services/jobService';
import '../student/Dashboard.css';
import './PostJob.css';

const PostJob = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    location: '',
    salary: '',
    jobType: 'full-time',
    experience: '',
    skills: '',
    applicationDeadline: ''
  });
  const [quizQuestions, setQuizQuestions] = useState([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const createEmptyQuestion = () => ({
    question: '',
    options: ['', '', '', ''],
    correctOptionIndex: 0,
    marks: 1
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSkillsChange = (e) => {
    const skills = e.target.value.split(',').map(skill => skill.trim()).filter(skill => skill);
    setFormData({
      ...formData,
      skills: skills.join(', ')
    });
  };

  const addQuizQuestion = () => {
    setQuizQuestions((prev) => [...prev, createEmptyQuestion()]);
  };

  const removeQuizQuestion = (indexToRemove) => {
    setQuizQuestions((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const updateQuizQuestionText = (index, value) => {
    setQuizQuestions((prev) =>
      prev.map((question, questionIndex) =>
        questionIndex === index
          ? { ...question, question: value }
          : question
      )
    );
  };

  const updateQuizOption = (questionIndex, optionIndex, value) => {
    setQuizQuestions((prev) =>
      prev.map((question, currentQuestionIndex) => {
        if (currentQuestionIndex !== questionIndex) {
          return question;
        }

        const updatedOptions = [...question.options];
        updatedOptions[optionIndex] = value;

        return {
          ...question,
          options: updatedOptions
        };
      })
    );
  };

  const updateCorrectOptionIndex = (questionIndex, index) => {
    setQuizQuestions((prev) =>
      prev.map((question, currentQuestionIndex) =>
        currentQuestionIndex === questionIndex
          ? { ...question, correctOptionIndex: index }
          : question
      )
    );
  };

  const updateQuestionMarks = (questionIndex, marks) => {
    const normalizedMarks = Math.max(1, Number(marks) || 1);
    setQuizQuestions((prev) =>
      prev.map((question, currentQuestionIndex) =>
        currentQuestionIndex === questionIndex
          ? { ...question, marks: normalizedMarks }
          : question
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const normalizedQuizQuestions = quizQuestions.map((question) => ({
        question: question.question.trim(),
        options: question.options.map((option) => option.trim()),
        correctAnswer: question.options[question.correctOptionIndex]?.trim() || '',
        marks: Number(question.marks) > 0 ? Number(question.marks) : 1
      }));

      const invalidQuizQuestionIndex = normalizedQuizQuestions.findIndex((question) => (
        !question.question
        || question.options.length !== 4
        || question.options.some((option) => !option)
        || !question.correctAnswer
      ));

      if (invalidQuizQuestionIndex !== -1) {
        setMessage({
          text: `Please complete quiz question ${invalidQuizQuestionIndex + 1} (question, 4 options, correct answer).`,
          type: 'error'
        });
        setLoading(false);
        return;
      }

      // Convert skills string to array
      const jobData = {
        ...formData,
        skills: formData.skills.split(',').map(skill => skill.trim()).filter(skill => skill),
        quiz: normalizedQuizQuestions.length
          ? {
              title: 'Job Screening Quiz',
              description: `Quiz for ${formData.title || 'this role'}`,
              questions: normalizedQuizQuestions,
              passingPercentage: 70,
              timeLimit: 30
            }
          : null
      };

      await jobService.createJob(jobData);
      setMessage({ text: 'Job posted successfully!', type: 'success' });

      // Reset form
      setFormData({
        title: '',
        description: '',
        requirements: '',
        location: '',
        salary: '',
        jobType: 'full-time',
        experience: '',
        skills: '',
        applicationDeadline: ''
      });
      setQuizQuestions([]);

      // Redirect to dashboard after success
      setTimeout(() => {
        navigate('/company/dashboard');
      }, 2000);

    } catch (error) {
      setMessage({
        text: error.message || 'Failed to post job. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="post-job-theme-root">
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
          <button className="profile-btn" onClick={() => navigate('/company/manage-jobs')}>Manage Jobs</button>
          <button className="profile-btn" onClick={() => navigate('/company/dashboard')}>Back to Dashboard</button>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="welcome-section">
        <h1>Post a New Job, {user.name || 'Company'} 👋</h1>
        <p>Create your job posting and optionally add a role-specific MCQ screening quiz.</p>
      </div>

      <div className="post-job-content-wrap">
        <div className="post-job-card">
          <div className="post-job-header">
            <h2>Job Details</h2>
            <p>Fill all required information to publish the opening.</p>
          </div>

          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="post-job-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="title">Job Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Software Engineer, Data Analyst"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="jobType">Job Type</label>
                <select
                  id="jobType"
                  name="jobType"
                  value={formData.jobType}
                  onChange={handleChange}
                >
                  <option value="full-time">Full Time</option>
                  <option value="part-time">Part Time</option>
                  <option value="internship">Internship</option>
                  <option value="contract">Contract</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Job Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe responsibilities and expected outcomes..."
                rows="6"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="requirements">Requirements *</label>
              <textarea
                id="requirements"
                name="requirements"
                value={formData.requirements}
                onChange={handleChange}
                placeholder="List qualifications, skills, and minimum expectations..."
                rows="6"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="location">Location *</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. New York, NY or Remote"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="salary">Salary Range</label>
                <input
                  type="text"
                  id="salary"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  placeholder="e.g. $50,000 - $70,000 or Negotiable"
                />
              </div>
            </div>

            <div className="form-group">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="experience">Experience Level</label>
                  <input
                    type="text"
                    id="experience"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    placeholder="e.g. 2-4 years, Entry level, Senior"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="applicationDeadline">Application Deadline</label>
                  <input
                    type="date"
                    id="applicationDeadline"
                    name="applicationDeadline"
                    value={formData.applicationDeadline}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="skills">Skills (comma-separated)</label>
              <input
                type="text"
                id="skills"
                name="skills"
                value={formData.skills}
                onChange={handleSkillsChange}
                placeholder="e.g. JavaScript, React, Node.js, Python"
              />
            </div>

            <section className="quiz-builder-section">
              <div className="quiz-builder-header">
                <div>
                  <label>Job-Specific MCQ Quiz (Optional)</label>
                  <p>Students will attempt this quiz before mentor verification.</p>
                </div>
                <button
                  type="button"
                  onClick={addQuizQuestion}
                  className="quiz-add-btn"
                >
                  + Add Question
                </button>
              </div>

              {quizQuestions.length === 0 ? (
                <p className="quiz-empty-text">
                  No quiz questions added yet.
                </p>
              ) : (
                <div className="quiz-question-grid">
                  {quizQuestions.map((quizQuestion, questionIndex) => (
                    <div key={`quiz-question-${questionIndex}`} className="quiz-question-card">
                      <div className="quiz-question-top">
                        <strong>Question {questionIndex + 1}</strong>
                        <button
                          type="button"
                          onClick={() => removeQuizQuestion(questionIndex)}
                          className="quiz-remove-btn"
                        >
                          Remove
                        </button>
                      </div>

                      <input
                        type="text"
                        value={quizQuestion.question}
                        onChange={(event) => updateQuizQuestionText(questionIndex, event.target.value)}
                        placeholder="Enter question text"
                        className="quiz-question-input"
                      />

                      <div className="quiz-options-grid">
                        {quizQuestion.options.map((option, optionIndex) => (
                          <div key={`quiz-option-${questionIndex}-${optionIndex}`} className="quiz-option-row">
                            <input
                              type="text"
                              value={option}
                              onChange={(event) => updateQuizOption(questionIndex, optionIndex, event.target.value)}
                              placeholder={`Option ${optionIndex + 1}`}
                            />
                            <label className="quiz-correct-label">
                              <input
                                type="radio"
                                name={`correct-option-${questionIndex}`}
                                checked={quizQuestion.correctOptionIndex === optionIndex}
                                onChange={() => updateCorrectOptionIndex(questionIndex, optionIndex)}
                              />
                              Correct
                            </label>
                          </div>
                        ))}
                      </div>

                      <div className="quiz-marks-row">
                        <label htmlFor={`marks-${questionIndex}`}>Marks</label>
                        <input
                          id={`marks-${questionIndex}`}
                          type="number"
                          min="1"
                          value={quizQuestion.marks}
                          onChange={(event) => updateQuestionMarks(questionIndex, event.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <div className="form-actions">
              <button
                type="button"
                onClick={() => navigate('/company/dashboard')}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="submit-btn"
              >
                {loading ? 'Posting Job...' : 'Post Job'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostJob;
