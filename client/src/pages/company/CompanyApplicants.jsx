import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import jobService from '../../services/jobService';
import '../student/Dashboard.css';
import './CompanyApplicants.css';

const createEmptyQuestion = () => ({
  question: '',
  options: ['', '', '', ''],
  correctAnswer: '',
  marks: 1
});

const CompanyApplicants = () => {
  const navigate = useNavigate();
  const [approvedApplicants, setApprovedApplicants] = useState([]);
  const [passedApplicants, setPassedApplicants] = useState([]);
  const [companyJobs, setCompanyJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const [selectedProfile, setSelectedProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [quizForm, setQuizForm] = useState({
    jobId: '',
    title: 'Company Round Quiz',
    description: '',
    passingPercentage: 70,
    timeLimit: 30,
    quizDeadline: '',
    questions: [createEmptyQuestion()]
  });
  const [quizSaving, setQuizSaving] = useState(false);

  const loadApplicantsAndJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const [applicantsData, jobsData] = await Promise.all([
        jobService.getCompanyApprovedApplicants(),
        jobService.getJobsByCompany()
      ]);

      const pendingList = applicantsData.pendingApplicants || applicantsData.data || [];
      const passedList = applicantsData.passedApplicants || [];

      setApprovedApplicants(Array.isArray(pendingList) ? pendingList : []);
      setPassedApplicants(Array.isArray(passedList) ? passedList : []);
      setCompanyJobs(Array.isArray(jobsData.jobs) ? jobsData.jobs : []);

      setQuizForm((prev) => ({
        ...prev,
        jobId: prev.jobId || jobsData.jobs?.[0]?._id || ''
      }));
    } catch (err) {
      setError(err.message || 'Failed to load applicants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplicantsAndJobs();
  }, []);

  const handleViewProfile = async (studentId) => {
    setProfileLoading(true);
    setProfileError(null);
    try {
      const data = await jobService.getStudentProfileForCompany(studentId);
      setSelectedProfile(data.data);
      setShowProfileModal(true);
    } catch (err) {
      setProfileError(err.message || 'Failed to load student profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleViewResume = async (publicId) => {
    if (!publicId) return;
    try {
      const result = await jobService.getResumeUrl(publicId);

      if (result?.success && result?.url) {
        try {
          const response = await fetch(result.url, {
            headers: {
              Accept: 'application/pdf'
            }
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const blob = await response.blob();
          if (blob.size === 0) {
            throw new Error('Received empty PDF');
          }

          const blobUrl = URL.createObjectURL(blob);
          window.open(blobUrl, '_blank', 'noopener,noreferrer');
          return;
        } catch {
          window.open(result.url, '_blank', 'noopener,noreferrer');
          return;
        }
      }

      setProfileError('Resume URL not found');
    } catch (err) {
      setProfileError(err.message || 'Failed to view resume');
    }
  };

  const closeProfileModal = () => {
    setShowProfileModal(false);
    setSelectedProfile(null);
    setProfileError(null);
  };

  const handleRejectApplicant = async (applicationId) => {
    if (!applicationId) return;

    const confirmed = window.confirm('Are you sure you want to reject this applicant?');
    if (!confirmed) return;

    try {
      setActionLoadingId(applicationId);
      await jobService.rejectCompanyApplicant(applicationId);
      setApprovedApplicants((prev) => prev.filter((app) => app._id !== applicationId));
      setPassedApplicants((prev) => prev.filter((app) => app._id !== applicationId));
      setMessage({ type: 'success', text: 'Applicant rejected.' });
    } catch (err) {
      setError(err.message || 'Failed to reject applicant');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleHireApplicant = async (applicationId) => {
    if (!applicationId) return;

    const confirmed = window.confirm('Approve this passed student as hired?');
    if (!confirmed) return;

    try {
      setActionLoadingId(applicationId);
      await jobService.hireCompanyApplicant(applicationId);
      setPassedApplicants((prev) => prev.filter((app) => app._id !== applicationId));
      setMessage({ type: 'success', text: 'Student approved as hired.' });
    } catch (err) {
      setError(err.message || 'Failed to approve applicant');
    } finally {
      setActionLoadingId(null);
    }
  };

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
      setError('Please complete all quiz fields correctly before uploading.');
      return;
    }

    try {
      setQuizSaving(true);
      setError(null);

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
        type: 'success',
        text: 'Company applicant quiz uploaded. Eligible applicants are moved to company quiz round.'
      });

      await loadApplicantsAndJobs();
    } catch (err) {
      setError(err.message || 'Failed to upload company applicant quiz');
    } finally {
      setQuizSaving(false);
    }
  };

  const socialLinks = selectedProfile?.links
    ? Object.entries(selectedProfile.links).filter(([, value]) => Boolean(value))
    : [];

  return (
    <div className="student-dashboard company-applicants-root">
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
          <button className="back-btn" onClick={() => navigate('/company/dashboard')}>← Back to Dashboard</button>
        </div>
      </div>

      <div className="welcome-section">
        <h1>View Applicants</h1>
        <p>Upload company quiz, track passed students, and approve hires.</p>
      </div>

      <div className="dashboard-main">
        <div className="full-width-section">
          {message?.text && (
            <div className={`applicants-message ${message.type}`}>{message.text}</div>
          )}

          {loading ? (
            <div className="applicants-card">
              <p>Loading applicants...</p>
            </div>
          ) : (
            <>
              <div className="applicants-card quiz-upload-card">
                <h3 className="applicants-title">Upload Company Applicant Quiz</h3>

                <div className="quiz-upload-grid">
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

                <label className="quiz-upload-block">
                  Quiz Title
                  <input
                    type="text"
                    value={quizForm.title}
                    onChange={(event) => setQuizForm((prev) => ({ ...prev, title: event.target.value }))}
                  />
                </label>

                <label className="quiz-upload-block">
                  Description
                  <textarea
                    rows={2}
                    value={quizForm.description}
                    onChange={(event) => setQuizForm((prev) => ({ ...prev, description: event.target.value }))}
                  />
                </label>

                <div className="quiz-question-list">
                  {quizForm.questions.map((question, index) => (
                    <div key={`q-${index}`} className="quiz-question-item">
                      <div className="quiz-question-top">
                        <h4>Question {index + 1}</h4>
                        {quizForm.questions.length > 1 && (
                          <button type="button" className="quiz-link-btn" onClick={() => removeQuestion(index)}>
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

                      <div className="quiz-options-grid">
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

                      <div className="quiz-question-bottom">
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

                <div className="quiz-upload-actions">
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

              {error && (
                <div className="applicants-card">
                  <p className="applicants-error">{error}</p>
                </div>
              )}

              <div className="applicants-card">
                <h3 className="applicants-title">Applicant Pool ({approvedApplicants.length})</h3>
                {approvedApplicants.length === 0 ? (
                  <p className="applicants-muted">No applicants in pending pool right now.</p>
                ) : (
                  <ul className="approved-list">
                    {approvedApplicants.map((app) => (
                      <li key={app._id} className="approved-item">
                        <div>
                          <div className="approved-job-title">{app.jobId?.title || 'Job title not found'}</div>
                          <div className="approved-subline">{app.studentId?.name || 'Unknown student'} • {app.studentId?.email || ''}</div>
                          <div className="approved-subline">Applied on: {new Date(app.appliedAt).toLocaleDateString()}</div>
                          <div className="approved-subline">Status: {app.status?.replaceAll('_', ' ')}</div>
                        </div>
                        <div className="approved-actions">
                          <button
                            onClick={() => handleViewProfile(app.studentId?._id || app.studentId)}
                            className="profile-btn-small"
                            disabled={profileLoading}
                          >
                            {profileLoading ? 'Loading...' : 'See Profile'}
                          </button>
                          <button
                            onClick={() => handleRejectApplicant(app._id)}
                            className="reject-btn-small"
                            disabled={actionLoadingId === app._id}
                          >
                            {actionLoadingId === app._id ? 'Rejecting...' : 'Reject'}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="applicants-card passed-applicants-card">
                <h3 className="applicants-title">Students Passed Company Quiz (After Deadline) ({passedApplicants.length})</h3>
                {passedApplicants.length === 0 ? (
                  <p className="applicants-muted">No passed students are available for company approval yet.</p>
                ) : (
                  <ul className="approved-list">
                    {passedApplicants.map((app) => (
                      <li key={app._id} className="approved-item">
                        <div>
                          <div className="approved-job-title">{app.jobId?.title || 'Job title not found'}</div>
                          <div className="approved-subline">{app.studentId?.name || 'Unknown student'} • {app.studentId?.email || ''}</div>
                          <div className="approved-subline">Company Quiz Score: {app.companyQuizScore ?? 'N/A'}%</div>
                        </div>
                        <div className="approved-actions">
                          <button
                            onClick={() => handleViewProfile(app.studentId?._id || app.studentId)}
                            className="profile-btn-small"
                            disabled={profileLoading}
                          >
                            {profileLoading ? 'Loading...' : 'See Profile'}
                          </button>
                          <button
                            onClick={() => handleHireApplicant(app._id)}
                            className="hire-btn-small"
                            disabled={actionLoadingId === app._id}
                          >
                            {actionLoadingId === app._id ? 'Approving...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleRejectApplicant(app._id)}
                            className="reject-btn-small"
                            disabled={actionLoadingId === app._id}
                          >
                            {actionLoadingId === app._id ? 'Rejecting...' : 'Reject'}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {showProfileModal && selectedProfile && (
        <div className="company-applicants-modal-overlay">
          <div className="company-applicants-modal">
            <div className="company-applicants-modal-head">
              <h2>Student Profile</h2>
              <button onClick={closeProfileModal} className="company-applicants-close">×</button>
            </div>

            {profileError ? (
              <p className="applicants-error">{profileError}</p>
            ) : (
              <div>
                <div className="company-applicants-section">
                  <h3>Personal Information</h3>
                  <div className="company-applicants-grid">
                    <div><strong>Full Name:</strong> {selectedProfile.fullName || 'N/A'}</div>
                    <div><strong>Email:</strong> {selectedProfile.email || 'N/A'}</div>
                    <div><strong>Phone:</strong> {selectedProfile.phone || 'N/A'}</div>
                    <div><strong>Institution:</strong> {selectedProfile.institution || 'N/A'}</div>
                    <div><strong>Department:</strong> {selectedProfile.department || 'N/A'}</div>
                    <div><strong>CGPA:</strong> {selectedProfile.cgpa || 'N/A'}</div>
                  </div>
                </div>

                <div className="company-applicants-section">
                  <h3>Academic Information</h3>
                  <div className="company-applicants-grid">
                    <div><strong>10th Marks:</strong> {selectedProfile.tenthMarks || 'N/A'}%</div>
                    <div><strong>12th Marks:</strong> {selectedProfile.twelfthMarks || 'N/A'}%</div>
                  </div>
                </div>

                <div className="company-applicants-section">
                  <h3>Skills</h3>
                  <div className="company-applicants-skills">
                    {selectedProfile.skills && selectedProfile.skills.length > 0 ? (
                      selectedProfile.skills.map((skill, index) => (
                        <span key={index} className="company-applicants-skill">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span>N/A</span>
                    )}
                  </div>
                </div>

                <div className="company-applicants-section">
                  <h3>Resume</h3>
                  {selectedProfile.resume ? (
                    <button
                      onClick={() => handleViewResume(selectedProfile.resume.publicId || selectedProfile.resume.fileName)}
                      className="company-applicants-resume-btn"
                    >
                      View Resume ({selectedProfile.resume.fileName || 'resume'})
                    </button>
                  ) : (
                    <span>N/A</span>
                  )}
                </div>

                <div className="company-applicants-section">
                  <h3>Social & Coding Profiles</h3>
                  <div className="company-applicants-links">
                    {socialLinks.length > 0 ? (
                      socialLinks.map(([key, value]) => (
                        <div key={key} className="company-applicants-link-row">
                          <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong>
                          <a href={value} target="_blank" rel="noopener noreferrer">
                            {value}
                          </a>
                        </div>
                      ))
                    ) : (
                      <span>N/A</span>
                    )}
                  </div>
                </div>

                <div className="company-applicants-section">
                  <h3>Mentor Information</h3>
                  {selectedProfile.mentor ? (
                    <div>
                      <div><strong>Mentor:</strong> {selectedProfile.mentor.name} ({selectedProfile.mentor.email})</div>
                    </div>
                  ) : selectedProfile.mentorRequested ? (
                    <div>
                      <div><strong>Requested Mentor:</strong> {selectedProfile.mentorRequested.name} ({selectedProfile.mentorRequested.email})</div>
                      <div><strong>Status:</strong> {selectedProfile.mentorRequestStatus}</div>
                    </div>
                  ) : (
                    <span>No mentor assigned</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyApplicants;
