import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import jobService from '../../services/jobService';
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

  const handleQuizUpload = () => {
    navigate('/company/quiz-upload');
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
      id: 'quiz-upload',
      title: 'Quiz Upload',
      description: 'Create and manage company quizzes',
      icon: '📋',
      color: '#ddd6fe',
      textColor: '#7c3aed',
      onClick: handleQuizUpload
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
