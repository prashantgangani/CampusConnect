import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import jobService from '../../services/jobService';
import applicationService from '../../services/applicationService';
import api from '../../services/api';
import './Dashboard.css';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  
  const [stats, setStats] = useState({
    applications: 0,
    applicationsThisWeek: 0,
    interviews: 0,
    shortlisted: 0,
    profileViews: 0
  });
  
  const [recentApplications, setRecentApplications] = useState([]);
  const [availableOpportunities, setAvailableOpportunities] = useState([]);
  const [suggestedJobs, setSuggestedJobs] = useState([]);
  const [suggestedJobMap, setSuggestedJobMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [profileCompletion, setProfileCompletion] = useState(35);
  const [missingProfileItems, setMissingProfileItems] = useState([]);
  const [studentProfile, setStudentProfile] = useState(null);
  const [uiMessage, setUiMessage] = useState(null);
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [quizApplicationId, setQuizApplicationId] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizCurrentIndex, setQuizCurrentIndex] = useState(0);
  const [quizResultModal, setQuizResultModal] = useState({
    open: false,
    passed: false,
    percentage: 0,
    text: '',
    applicationId: null
  });
  const [infoModal, setInfoModal] = useState({
    open: false,
    title: '',
    text: ''
  });

  const getErrorMessage = (error, fallback) => {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.error) return error.error;
    if (error?.data?.message) return error.data.message;
    if (error?.data?.error) return error.data.error;
    return fallback;
  };

  const fetchDashboardData = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);

      const profileResponse = await api.get('/student/profile');
      const profileData = profileResponse?.data;

      let studentProfileData = null;
      if (profileData?.data) {
        studentProfileData = profileData.data;
        setStudentProfile(profileData.data);
        setProfileCompletion(profileData.data.profileCompletion || 35);

        const missing = [];
        if (!profileData.data.phone) missing.push('Phone');
        if (!profileData.data.cgpa) missing.push('CGPA');
        if (!profileData.data.skills || profileData.data.skills.length === 0) missing.push('Skills');
        if (!profileData.data.resume) missing.push('Resume');
        setMissingProfileItems(missing);
      }

      const applicationsResponse = await api.get('/applications');
      const appData = applicationsResponse?.data;

      let applications = [];
      if (appData) {
        applications = appData.data || [];

        const processed = applications.map((app) => ({
          id: app._id,
          jobId: app.jobId?._id,
          jobTitle: app.jobId?.title || 'Unknown Job',
          company: app.jobId?.company?.name || app.jobId?.companyName || 'Company',
          status: formatApplicationStatus(app.status),
          statusType: app.status,
          quizScore: app.quizScore,
          interviewDate: app.interviewDate,
          mentorApprovedAt: app.mentorApprovedAt,
          date: new Date(app.appliedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          })
        }));

        setRecentApplications(processed);

        const totalApps = applications.length;
        const interviews = applications.filter((a) => a.status === 'interview_scheduled').length;
        const shortlisted = applications.filter((a) =>
          ['shortlisted', 'interview_scheduled', 'selected'].includes(a.status)
        ).length;

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const appsThisWeek = applications.filter((a) => new Date(a.appliedAt) >= sevenDaysAgo).length;

        setStats({
          applications: totalApps,
          applicationsThisWeek: appsThisWeek,
          interviews,
          shortlisted,
          profileViews: studentProfileData?.profileViews || 0
        });
      }

      const jobsResponse = await jobService.getAllJobs();
      const jobs = jobsResponse.jobs || [];
      const suggestionsResponse = await api.get('/student/suggestions');
      const suggestions = suggestionsResponse?.data?.suggestions || [];
      const normalizedSuggestions = suggestions.filter((suggestion) => suggestion?.job?._id);

      setSuggestedJobs(normalizedSuggestions);

      const suggestionLookup = suggestions.reduce((accumulator, suggestion) => {
        const suggestionJobId = suggestion?.job?._id;
        if (!suggestionJobId || accumulator[suggestionJobId]) {
          return accumulator;
        }

        accumulator[suggestionJobId] = {
          mentorName: suggestion?.mentor?.name || 'Mentor'
        };
        return accumulator;
      }, {});

      setSuggestedJobMap(suggestionLookup);

      const appliedJobIds = applications.map((app) => app.jobId?._id).filter(Boolean);
      const availableJobs = jobs.filter((job) => !appliedJobIds.includes(job._id));

      const sortedJobs = availableJobs.sort((first, second) => {
        const firstSuggested = suggestionLookup[first._id] ? 1 : 0;
        const secondSuggested = suggestionLookup[second._id] ? 1 : 0;
        return secondSuggested - firstSuggested;
      });

      setAvailableOpportunities(sortedJobs.slice(0, 3));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setUiMessage({
        type: 'error',
        text: getErrorMessage(error, 'Unable to load dashboard data right now. Please refresh and try again.')
      });
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  // Fetch all dashboard data
  useEffect(() => {
    if (token) {
      fetchDashboardData(true);
    }
  }, [token, fetchDashboardData]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleUpdateProfile = () => {
    navigate('/student/profile?action=edit');
  };

  const handleQuickUploadResume = () => {
    navigate('/student/profile?action=upload');
  };

  const handleQuickAddSkill = () => {
    navigate('/student/profile?action=skills');
  };

  const handleApplyJob = async (jobId) => {
    try {
      const response = await applicationService.applyForJob(jobId);
      if (response.success) {
        setInfoModal({
          open: true,
          title: 'Application Submitted',
          text: 'Application submitted successfully. You can now take the quiz from Recent Applications.'
        });
        fetchDashboardData(false);
      } else {
        setUiMessage({
          type: 'error',
          text: response.message || 'Failed to apply for job.'
        });
      }
    } catch (error) {
      console.error('Error applying:', error);
      setUiMessage({
        type: 'error',
        text: getErrorMessage(error, 'Unable to apply for this job right now.')
      });
    }
  };

  const handleTakeQuiz = async (applicationId) => {
    try {
      if (!applicationId) {
        setUiMessage({
          type: 'error',
          text: 'Quiz is not available for this application right now. Please refresh and try again.'
        });
        return;
      }

      setUiMessage(null);
      setQuizLoading(true);
      setQuizModalOpen(true);
      setQuizApplicationId(applicationId);

      const quizStartResponse = await applicationService.startQuiz(applicationId);
      const questions = quizStartResponse.questions || [];

      if (!questions.length) {
        setQuizModalOpen(false);
        setUiMessage({
          type: 'error',
          text: 'Quiz questions are not available right now. Please try again in a moment.'
        });
        return;
      }

      setQuizQuestions(questions);
      setQuizAnswers({});
      setQuizCurrentIndex(0);
    } catch (error) {
      console.error('Error taking quiz:', error);
      setQuizModalOpen(false);
      setUiMessage({
        type: 'error',
        text: getErrorMessage(error, 'Unable to start quiz right now. Please try again.')
      });
    } finally {
      setQuizLoading(false);
    }
  };

  const handleSelectQuizAnswer = (questionId, option) => {
    setQuizAnswers((prev) => ({
      ...prev,
      [questionId]: option
    }));
  };

  const handleCloseQuizModal = () => {
    if (quizSubmitting) return;
    setQuizModalOpen(false);
    setQuizLoading(false);
    setQuizSubmitting(false);
    setQuizQuestions([]);
    setQuizAnswers({});
    setQuizCurrentIndex(0);
    setQuizApplicationId(null);
  };

  const handleSubmitQuiz = async () => {
    if (!quizQuestions.length || !quizApplicationId) return;

    const unanswered = quizQuestions.filter((question) => !quizAnswers[question._id]);
    if (unanswered.length > 0) {
      setUiMessage({
        type: 'error',
        text: `Please answer all questions before submitting. ${unanswered.length} question(s) remaining.`
      });
      return;
    }

    try {
      setQuizSubmitting(true);
      const answersPayload = quizQuestions.map((question) => ({
        questionId: question._id,
        selectedAnswer: quizAnswers[question._id]
      }));

      const submitResponse = await applicationService.submitApplicationQuiz(quizApplicationId, answersPayload);
      const resultText = submitResponse.passed
        ? `Quiz completed successfully! You scored ${submitResponse.percentage}%. Your application is sent to mentor for verification.`
        : `Quiz completed. You scored ${submitResponse.percentage}%. You did not reach the passing score.`;

      handleCloseQuizModal();
      setQuizResultModal({
        open: true,
        passed: !!submitResponse.passed,
        percentage: submitResponse.percentage || 0,
        text: resultText,
        applicationId: quizApplicationId
      });
    } catch (error) {
      console.error('Error submitting quiz:', error);
      setUiMessage({
        type: 'error',
        text: getErrorMessage(error, 'Unable to submit quiz right now. Please try again.')
      });
    } finally {
      setQuizSubmitting(false);
    }
  };

  const handleQuizResultOk = () => {
    const statusType = quizResultModal.passed ? 'pending_mentor' : 'quiz_failed';

    if (quizResultModal.applicationId) {
      setRecentApplications((prev) =>
        prev.map((application) =>
          application.id === quizResultModal.applicationId
            ? {
                ...application,
                statusType,
                status: formatApplicationStatus(statusType),
                quizScore: quizResultModal.percentage
              }
            : application
        )
      );
    }

    setQuizResultModal({
      open: false,
      passed: false,
      percentage: 0,
      text: '',
      applicationId: null
    });
    fetchDashboardData(false);
  };

  const handleInfoModalOk = () => {
    setInfoModal({
      open: false,
      title: '',
      text: ''
    });
  };

  const formatApplicationStatus = (statusType) => {
    const statusMap = {
      'quiz_pending': 'Quiz Pending',
      'quiz_failed': 'Quiz Failed',
      'pending_mentor': 'Awaiting Mentor',
      'mentor_approved': 'Mentor Approved',
      'mentor_rejected': 'Mentor Rejected',
      'shortlisted': 'Shortlisted',
      'interview_scheduled': 'Interview Scheduled',
      'selected': 'Selected',
      'rejected': 'Rejected',
      'offer_made': 'Offer Made',
      'offer_accepted': 'Offer Accepted',
      'withdrawn': 'Withdrawn'
    };
    return statusMap[statusType] || statusType;
  };

  const getStatusColor = (statusType) => {
    const colorMap = {
      'quiz_pending': '#f59e0b',
      'quiz_failed': '#ef4444',
      'pending_mentor': '#f59e0b',
      'mentor_approved': '#10b981',
      'mentor_rejected': '#ef4444',
      'shortlisted': '#3b82f6',
      'interview_scheduled': '#8b5cf6',
      'selected': '#10b981',
      'rejected': '#ef4444',
      'offer_made': '#10b981',
      'offer_accepted': '#059669',
      'withdrawn': '#6b7280'
    };
    return colorMap[statusType] || '#6b7280';
  };

  const getStatusBgColor = (statusType) => {
    const bgMap = {
      'quiz_pending': '#fef3c7',
      'quiz_failed': '#fee2e2',
      'pending_mentor': '#fef3c7',
      'mentor_approved': '#d1fae5',
      'mentor_rejected': '#fee2e2',
      'shortlisted': '#dbeafe',
      'interview_scheduled': '#ede9fe',
      'selected': '#d1fae5',
      'rejected': '#fee2e2',
      'offer_made': '#d1fae5',
      'offer_accepted': '#ccfbf1',
      'withdrawn': '#f3f4f6'
    };
    return bgMap[statusType] || '#f3f4f6';
  };

  const calculateMatchScore = (job) => {
    if (!studentProfile) return 0;
    
    let score = 50; // Base score
    
    // CGPA match
    if (studentProfile.cgpa >= 8) score += 20;
    else if (studentProfile.cgpa >= 7) score += 15;
    else if (studentProfile.cgpa >= 6) score += 10;
    
    // Skills match (basic calculation)
    const jobSkills = job.skills || [];
    if (studentProfile.skills && studentProfile.skills.length > 0) {
      const matchedSkills = studentProfile.skills.filter(skill =>
        jobSkills.some(jSkill => jSkill.toLowerCase().includes(skill.toLowerCase()))
      );
      score += Math.min((matchedSkills.length / jobSkills.length) * 30, 30);
    }
    
    return Math.round(score);
  };

  const remainingProfileCompletion = Math.max(0, 100 - (profileCompletion || 0));

  if (loading) {
    return (
      <div className="student-dashboard">
        <div className="dashboard-header">
          <div className="header-left">
            <div className="logo-section">
              <span className="logo-icon">🎓</span>
              <span className="logo-text">CampusConnect</span>
            </div>
          </div>
          <div className="header-right">
            <div className="notification-bell">🔔</div>
            <button className="profile-btn" onClick={() => navigate('/student/profile')}>My Profile</button>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>
        <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="student-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <div className="logo-section">
            <span className="logo-icon">🎓</span>
            <span className="logo-text">CampusConnect</span>
          </div>
        </div>
        <div className="search-bar">
          <input type="text" placeholder="Search jobs, companies..." />
        </div>
        <div className="header-right">
          <div className="notification-bell">🔔</div>
          <button className="profile-btn" onClick={() => navigate('/student/profile')}>My Profile</button>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {/* Welcome Section */}
      <div className="welcome-section">
        <h1>Welcome back, {user.name}! 👋</h1>
        <p>Here's what's happening with your applications today.</p>
      </div>

      {uiMessage && (
        <div className={`dashboard-message ${uiMessage.type === 'success' ? 'message-success' : 'message-error'}`}>
          <span>{uiMessage.text}</span>
          <button type="button" className="message-close" onClick={() => setUiMessage(null)}>
            ×
          </button>
        </div>
      )}

      <div className="stats-wrapper">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#e0e7ff' }}>📋</div>
            <div className="stat-content">
              <div className="stat-number">{stats.applications}</div>
              <div className="stat-label">Applications</div>
              <div className="stat-change">{stats.applicationsThisWeek} this week</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#f0fdf4' }}>📅</div>
            <div className="stat-content">
              <div className="stat-number">{stats.interviews}</div>
              <div className="stat-label">Interviews</div>
              <div className="stat-change">{stats.interviews} upcoming</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#f0fdf4' }}>⭐</div>
            <div className="stat-content">
              <div className="stat-number">{stats.shortlisted}</div>
              <div className="stat-label">Shortlisted</div>
              <div className="stat-change">{stats.shortlisted} new</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#fef3c7' }}>👁️</div>
            <div className="stat-content">
              <div className="stat-number">{stats.profileViews}</div>
              <div className="stat-label">Profile Views</div>
              <div className="stat-change">{stats.profileViews} this week</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-main">
        <div className="dashboard-left">
          {/* Recent Applications */}
          <div className="section-card suggested-jobs-section">
            <div className="section-header">
              <h3>
                ⭐ Suggested by Your Mentor
                {suggestedJobs.length > 0 && (
                  <span className="suggestion-count-badge">{suggestedJobs.length}</span>
                )}
              </h3>
            </div>

            {suggestedJobs.length === 0 ? (
              <div className="empty-state">
                <p>No job suggestions from your mentor yet.</p>
              </div>
            ) : (
              <div className="suggested-jobs-list">
                {suggestedJobs.map((suggestion) => {
                  const job = suggestion.job;
                  return (
                    <div key={suggestion._id} className="suggested-job-card">
                      <div className="suggested-job-head">
                        <span className="mentor-suggest-pill">Suggested by your mentor</span>
                        <span className="suggested-mentor-name">Mentor: {suggestion.mentor?.name || 'Mentor'}</span>
                      </div>

                      <h4>{job?.title || 'Job Opportunity'}</h4>
                      <p className="company-name">{job?.company?.name || 'Company'}</p>

                      <div className="suggested-job-meta">
                        <span>📍 {job?.location || 'Location not specified'}</span>
                        <span>
                          ⏳ {job?.applicationDeadline
                            ? new Date(job.applicationDeadline).toLocaleDateString()
                            : 'No deadline'}
                        </span>
                      </div>

                      <div className="opp-actions">
                        <span className="react-btn">Priority Recommendation</span>
                        <button className="apply-btn" onClick={() => handleApplyJob(job._id)}>
                          Apply Now →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="section-card">
            <div className="section-header">
              <h3>Recent Applications</h3>
              <a href="#" className="view-link">View all →</a>
            </div>
            
            {recentApplications.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📄</div>
                <p>No applications yet</p>
                <p className="empty-text">Start applying to jobs to see them here</p>
              </div>
            ) : (
              <div className="applications-list">
                {recentApplications.map((app) => (
                  <div key={app.id} className="application-item">
                    <div className="app-info">
                      <div className="app-icon">🏢</div>
                      <div className="app-details">
                        <h4>{app.jobTitle}</h4>
                        <p>{app.company}</p>
                      </div>
                    </div>
                    <div className="app-middle">
                      {app.statusType === 'quiz_pending' && (
                        <button
                          type="button"
                          className="quiz-badge"
                          disabled={quizLoading || quizSubmitting}
                          onClick={() => handleTakeQuiz(app.id)}
                        >
                          Take Quiz →
                        </button>
                      )}
                      {app.quizScore !== undefined && app.quizScore !== null && (
                        <span className="quiz-score">Score: {app.quizScore}%</span>
                      )}
                      {app.interviewDate && (
                        <span className="interview-date">
                          📅 {new Date(app.interviewDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="app-status">
                      <span 
                        className="status-badge" 
                        style={{ 
                          backgroundColor: getStatusBgColor(app.statusType),
                          color: getStatusColor(app.statusType)
                        }}
                      >
                        {app.status}
                      </span>
                      <p className="app-date">{app.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available Opportunities */}
          <div className="section-card">
            <h3>Available Opportunities</h3>
            
            {availableOpportunities.length === 0 ? (
              <div className="empty-state">
                <p>No opportunities available</p>
              </div>
            ) : (
              <div className="opportunities-list">
                {availableOpportunities.map((job) => {
                  const matchScore = calculateMatchScore(job);
                  const suggestedMeta = suggestedJobMap[job._id];
                  const isSuggested = Boolean(suggestedMeta);
                  return (
                    <div key={job._id} className={`opportunity-item ${isSuggested ? 'opportunity-item-suggested' : ''}`}>
                      <div style={{ marginBottom: '8px' }}>
                        {isSuggested && (
                          <span className="mentor-suggested-badge">⭐ Suggested by your Mentor</span>
                        )}
                        <span className="placement-badge">placement</span>
                      </div>
                      <div className="opp-header">
                        <div>
                          <h4>{job.title}</h4>
                          <p className="company-name">{job.company?.name || 'Company'}</p>
                        </div>
                        <div className="match-score-badge" style={{ 
                          backgroundColor: matchScore >= 80 ? '#d1fae5' : matchScore >= 60 ? '#fef3c7' : '#fee2e2',
                          color: matchScore >= 80 ? '#059669' : matchScore >= 60 ? '#b45309' : '#dc2626'
                        }}>
                          <span className="match-percent">{matchScore}%</span>
                          <span className="match-label">Match</span>
                        </div>
                      </div>
                      <div className="job-meta">
                        <span>{job.skills?.join(', ') || 'wgyrg'}</span>
                      </div>
                      <div className="opp-actions">
                        <span className="react-btn">React 👍</span>
                        <button className="apply-btn" onClick={() => handleApplyJob(job._id)}>
                          Apply Now →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="dashboard-right">
          {/* Quick Actions */}
          <div className="quick-actions-card">
            <h3>Quick Actions</h3>
            <div className="action-btn-group">
              <button className="action-item" onClick={handleUpdateProfile}>
                <span>👤</span>
                <span>Update Profile</span>
              </button>
              <button className="action-item" onClick={handleQuickUploadResume}>
                <span>📤</span>
                <span>Upload Resume</span>
              </button>
              <button className="action-item" onClick={handleQuickAddSkill}>
                <span>➕</span>
                <span>Add Skills</span>
              </button>
            </div>
          </div>

          {/* Profile Completion */}
          <div className="profile-completion-card">
            <h3>Complete Your Profile</h3>
            <p className="completion-text">
              A complete profile gets 3x more visibility to recruiters.
            </p>
            <div className="completion-bar-container">
              <div className="completion-bar-bg">
                <div 
                  className="completion-bar-fill" 
                  style={{ width: `${profileCompletion}%` }}
                ></div>
              </div>
              <span className="completion-percent">{profileCompletion}%</span>
            </div>
            <div className="completion-items-list">
              {profileCompletion >= 100 ? (
                <p className="all-done">✅ All done! Your profile is complete</p>
              ) : (
                <>
                  <p className="completion-remaining">
                    Your profile has {remainingProfileCompletion}% remaining. Complete it for better placement chances.
                  </p>
                  {missingProfileItems.length > 0 && (
                    <>
                      <span className="items-count">{missingProfileItems.length} items left:</span>
                      <div className="items-tags">
                        {missingProfileItems.map((item, idx) => (
                          <span key={idx} className="item-tag">{item}</span>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
            <button className="complete-btn" onClick={handleUpdateProfile}>
              Complete Now
            </button>
          </div>

          {/* User Card */}
          <div className="user-card">
            <div className="user-avatar">👤</div>
            <h4>{user.name || 'Student'}</h4>
            <p className="user-subtitle">charusat</p>
            <button className="edit-profile-btn" onClick={handleUpdateProfile}>
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      {quizModalOpen && (
        <div className="quiz-modal-overlay">
          <div className="quiz-modal">
            <div className="quiz-modal-header">
              <h3>Job Screening Quiz</h3>
              <button type="button" className="quiz-close" onClick={handleCloseQuizModal} disabled={quizSubmitting}>
                ×
              </button>
            </div>

            {quizLoading ? (
              <div className="quiz-loading">Loading quiz questions...</div>
            ) : (
              <>
                <div className="quiz-progress">
                  <span>Question {quizCurrentIndex + 1} of {quizQuestions.length}</span>
                  <span>{Object.keys(quizAnswers).length}/{quizQuestions.length} answered</span>
                </div>

                {quizQuestions[quizCurrentIndex] && (
                  <div className="quiz-question-block">
                    <p className="quiz-question-text">{quizQuestions[quizCurrentIndex].question}</p>
                    <div className="quiz-options">
                      {quizQuestions[quizCurrentIndex].options.map((option, optionIndex) => {
                        const questionId = quizQuestions[quizCurrentIndex]._id;
                        const isSelected = quizAnswers[questionId] === option;

                        return (
                          <button
                            key={`${questionId}-${optionIndex}`}
                            type="button"
                            className={`quiz-option ${isSelected ? 'quiz-option-selected' : ''}`}
                            onClick={() => handleSelectQuizAnswer(questionId, option)}
                            disabled={quizSubmitting}
                          >
                            <span className="quiz-option-label">{String.fromCharCode(65 + optionIndex)}</span>
                            <span>{option}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="quiz-actions">
                  <button
                    type="button"
                    className="quiz-nav-btn"
                    onClick={() => setQuizCurrentIndex((prev) => Math.max(prev - 1, 0))}
                    disabled={quizCurrentIndex === 0 || quizSubmitting}
                  >
                    Previous
                  </button>

                  {quizCurrentIndex < quizQuestions.length - 1 ? (
                    <button
                      type="button"
                      className="quiz-nav-btn quiz-nav-primary"
                      onClick={() => setQuizCurrentIndex((prev) => Math.min(prev + 1, quizQuestions.length - 1))}
                      disabled={quizSubmitting}
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="quiz-nav-btn quiz-submit-btn"
                      onClick={handleSubmitQuiz}
                      disabled={quizSubmitting}
                    >
                      {quizSubmitting ? 'Submitting...' : 'Submit Quiz'}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {quizResultModal.open && (
        <div className="quiz-result-overlay">
          <div className="quiz-result-modal">
            <div className={`quiz-result-icon ${quizResultModal.passed ? 'result-pass' : 'result-fail'}`}>
              {quizResultModal.passed ? '✅' : '❌'}
            </div>
            <h3 className="quiz-result-title">
              {quizResultModal.passed ? 'Quiz Passed' : 'Quiz Failed'}
            </h3>
            <p className="quiz-result-score">Score: {quizResultModal.percentage}%</p>
            <p className="quiz-result-text">{quizResultModal.text}</p>
            <button type="button" className="quiz-result-ok" onClick={handleQuizResultOk}>
              OK
            </button>
          </div>
        </div>
      )}

      {infoModal.open && (
        <div className="quiz-result-overlay">
          <div className="quiz-result-modal">
            <div className="quiz-result-icon result-pass">ℹ️</div>
            <h3 className="quiz-result-title">{infoModal.title}</h3>
            <p className="quiz-result-text">{infoModal.text}</p>
            <button type="button" className="quiz-result-ok" onClick={handleInfoModalOk}>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
