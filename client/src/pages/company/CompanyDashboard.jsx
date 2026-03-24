import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import jobService from '../../services/jobService';
import applicationService from '../../services/applicationService';
import '../student/Dashboard.css';

const CompanyDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [stats, setStats] = useState({
    activeJobs: 0,
    applicants: 0,
    interviews: 0,
    hired: 0
  });
  const [quizzes, setQuizzes] = useState([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await jobService.getCompanyStats();
        setStats(data.stats || {
          activeJobs: 0,
          applicants: 0,
          interviews: 0,
          hired: 0
        });
      } catch (error) {
        console.error('Failed to load company stats:', error);
        try {
          const jobsData = await jobService.getJobsByCompany();
          const ownJobs = jobsData.jobs || [];
          const fallbackActive = ownJobs.filter((job) => !job.status || job.status === 'active').length;

          setStats((prev) => ({
            ...prev,
            activeJobs: fallbackActive
          }));
        } catch (fallbackError) {
          console.error('Fallback company jobs fetch failed:', fallbackError);
        }
      }
    };
    loadStats();
  }, []);

  const loadQuizzes = async () => {
    setLoadingQuizzes(true);
    try {
      const response = await applicationService.getCompanyQuizzes();
      setQuizzes(response.data || []);
    } catch (error) {
      console.error('Failed to load company quizzes:', error);
      setQuizzes([]);
    } finally {
      setLoadingQuizzes(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handlePostJob = () => {
    navigate('/company/post-job');
  };

  const handleViewApplicants = () => {
    navigate('/company/applicants');
  };

  const handleManageJobs = () => {
    navigate('/company/manage-jobs');
  };

  const handleScheduleInterviews = () => {
    navigate('/company/interviews');
  };

  const handleViewReports = () => {
    navigate('/company/reports');
  };

  const handleCompanyProfile = () => {
    navigate('/company/profile');
  };

  const handleEditQuiz = (quiz) => {
    // Navigate to quiz upload page with quiz data for editing
    navigate('/company/quiz-upload', { state: { quiz, isEdit: true } });
  };

  const handleDeleteQuiz = async (quiz) => {
    if (!window.confirm(`Are you sure you want to delete the quiz for "${quiz.jobTitle}"? This will reset all student applications to mentor approved status.`)) {
      return;
    }

    try {
      await applicationService.deleteCompanyApplicantQuiz(quiz.jobId);
      alert('Quiz deleted successfully!');
      loadQuizzes(); // Reload quizzes
    } catch (error) {
      console.error('Failed to delete quiz:', error);
      alert('Failed to delete quiz. Please try again.');
    }
  };

  const handleReassignQuiz = async (quiz) => {
    const studentEmail = prompt(`Enter student email to reassign quiz for "${quiz.jobTitle}":`);
    if (!studentEmail || !studentEmail.trim()) {
      return;
    }

    try {
      await applicationService.reassignCompanyQuizToStudent(quiz.jobId, studentEmail.trim());
      alert(`Quiz reassigned successfully to ${studentEmail}!`);
    } catch (error) {
      console.error('Failed to reassign quiz:', error);
      alert(error.message || 'Failed to reassign quiz. Please check the email and try again.');
    }
  };

  const quickActions = [
    {
      id: 'post-job',
      title: 'Post New Job',
      description: 'Create and publish job opportunities',
      icon: '📝',
      color: '#e0f2fe',
      textColor: '#0369a1',
      onClick: handlePostJob
    },
    {
      id: 'view-applicants',
      title: 'View Applicants',
      description: 'Review and manage job applications',
      icon: '👥',
      color: '#d1fae5',
      textColor: '#059669',
      onClick: handleViewApplicants
    },
    {
      id: 'manage-jobs',
      title: 'Manage Jobs',
      description: 'Edit and update your job postings',
      icon: '⚙️',
      color: '#fef3c7',
      textColor: '#92400e',
      onClick: handleManageJobs
    },
    {
      id: 'schedule-interviews',
      title: 'Schedule Interviews',
      description: 'Organize and manage interview sessions',
      icon: '📅',
      color: '#fee2e2',
      textColor: '#b91c1c',
      onClick: handleScheduleInterviews
    },
    {
      id: 'view-reports',
      title: 'View Reports',
      description: 'Analyze hiring metrics and insights',
      icon: '📊',
      color: '#f3e8ff',
      textColor: '#7c3aed',
      onClick: handleViewReports
    }
  ];

  return (
    <div className="student-dashboard">
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
          <div className="notification-bell">🔔</div>
          <button className="profile-btn" onClick={handleCompanyProfile}>Company Profile</button>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="welcome-section">
        <h1>Welcome back, {user.name || 'Company'}!</h1>
        <p>Manage your jobs, applicants, and placements from one place.</p>
      </div>

      <div className="stats-wrapper">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}>📝</div>
            <div className="stat-content">
              <div className="stat-number">{stats.activeJobs}</div>
              <div className="stat-label">Active Jobs</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#d1fae5', color: '#059669' }}>👥</div>
            <div className="stat-content">
              <div className="stat-number">{stats.applicants}</div>
              <div className="stat-label">Applicants</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>📅</div>
            <div className="stat-content">
              <div className="stat-number">{stats.interviews}</div>
              <div className="stat-label">Interviews</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#fee2e2', color: '#b91c1c' }}>🎉</div>
            <div className="stat-content">
              <div className="stat-number">{stats.hired}</div>
              <div className="stat-label">Hired</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quiz Section */}
      <div className="quiz-section" style={{ margin: '20px 0', padding: '0 20px' }}>
        <h2 style={{ marginBottom: '15px', color: '#1e293b' }}>Uploaded Quizzes</h2>
        {loadingQuizzes ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div>Loading quizzes...</div>
          </div>
        ) : quizzes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '2px dashed #cbd5e1' }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>📝</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#475569', marginBottom: '5px' }}>No Quizzes Uploaded Yet</div>
            <div style={{ color: '#64748b' }}>Upload your first company quiz to get started</div>
          </div>
        ) : (
          <div className="quiz-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
            {quizzes.map((quiz) => (
              <div key={quiz._id} className="quiz-card" style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                transition: 'box-shadow 0.2s ease'
              }}>
                <div style={{ marginBottom: '15px' }}>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
                    {quiz.title}
                  </h3>
                  <p style={{ margin: '0', fontSize: '14px', color: '#64748b' }}>
                    Job: {quiz.jobTitle}
                  </p>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#475569' }}>
                    {quiz.description || 'No description provided'}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '13px', color: '#64748b' }}>
                    <span>📊 {quiz.questionsCount} Questions</span>
                    <span>⏱️ {quiz.timeLimit} mins</span>
                    <span>✅ {quiz.passingPercentage}% Pass</span>
                  </div>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '5px' }}>
                    <strong>Start:</strong> {quiz.startTime ? new Date(quiz.startTime).toLocaleString() : 'Not set'}
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>
                    <strong>End:</strong> {quiz.endTime ? new Date(quiz.endTime).toLocaleString() : 'Not set'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleEditQuiz(quiz)}
                    style={{
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDeleteQuiz(quiz)}
                    style={{
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#dc2626'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#ef4444'}
                  >
                    🗑️ Delete
                  </button>
                  <button
                    onClick={() => handleReassignQuiz(quiz)}
                    style={{
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#059669'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#10b981'}
                  >
                    📧 Reassign
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="dashboard-main">
        <div className="dashboard-left">
          <div className="section-card">
            <h3>Company Insights</h3>
            <p style={{ color: '#94a3b8' }}>Track your latest stats and updates here.</p>
          </div>
        </div>

        <div className="dashboard-right">
          <div className="quick-actions-card">
            <h3>Quick Actions</h3>
            <div className="action-btn-group">
              {quickActions.map((action) => (
                <div key={`${action.id}-item`} className="action-item" onClick={action.onClick}>
                  <span style={{ fontSize: '18px' }}>{action.icon}</span>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 600 }}>{action.title}</span>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>{action.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CompanyDashboard;
