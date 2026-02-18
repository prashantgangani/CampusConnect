import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jobService from '../../services/jobService';
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
  const [loading, setLoading] = useState(true);
  const [profileCompletion, setProfileCompletion] = useState(35);
  const [missingProfileItems, setMissingProfileItems] = useState([]);
  const [studentProfile, setStudentProfile] = useState(null);

  // Fetch all dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch student profile
        const profileRes = await fetch('http://localhost:5000/api/student/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        let studentProfileData = null;
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData.data) {
            studentProfileData = profileData.data;
            setStudentProfile(profileData.data);
            setProfileCompletion(profileData.data.profileCompletion || 35);
            
            // Calculate missing profile items
            const missing = [];
            if (!profileData.data.phone) missing.push('Phone');
            if (!profileData.data.cgpa) missing.push('CGPA');
            if (!profileData.data.skills || profileData.data.skills.length === 0) missing.push('Skills');
            if (!profileData.data.resume) missing.push('Resume');
            setMissingProfileItems(missing);
          }
        }

        // Fetch student applications
        const applicationsRes = await fetch('http://localhost:5000/api/applications', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (applicationsRes.ok) {
          const appData = await applicationsRes.json();
          const applications = appData.data || [];
          
          // Process applications
          const processed = applications.map(app => ({
            id: app._id,
            jobTitle: app.jobId?.title || 'Unknown Job',
            company: app.jobId?.company?.name || 'Unknown Company',
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
          
          // Calculate stats
          const totalApps = applications.length;
          const interviews = applications.filter(a => 
            a.status === 'interview_scheduled'
          ).length;
          const shortlisted = applications.filter(a => 
            ['shortlisted', 'interview_scheduled', 'selected'].includes(a.status)
          ).length;
          
          // Calculate applications from this week (last 7 days)
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          const appsThisWeek = applications.filter(a => 
            new Date(a.appliedAt) >= sevenDaysAgo
          ).length;
          
          setStats({
            applications: totalApps,
            applicationsThisWeek: appsThisWeek,
            interviews,
            shortlisted,
            profileViews: studentProfileData?.profileViews || 0
          });
        }

        // Fetch available jobs
        const jobsResponse = await jobService.getAllJobs();
        const jobs = jobsResponse.jobs || [];
        
        // Filter out jobs user has already applied to
        const appliedJobIds = recentApplications.map(app => app.jobId?._id);
        const availableJobs = jobs.filter(job => !appliedJobIds.includes(job._id));
        
        setAvailableOpportunities(availableJobs.slice(0, 3));
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleUpdateProfile = () => {
    navigate('/student/profile');
  };

  const handleApplyJob = async (jobId) => {
    try {
      const response = await fetch('http://localhost:5000/api/applications/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ jobId })
      });

      if (response.ok) {
        alert('Application submitted! Please take the quiz.');
        // Refresh applications
        window.location.reload();
      } else {
        alert('Failed to apply for job');
      }
    } catch (error) {
      console.error('Error applying:', error);
      alert('Error applying for job');
    }
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

      {/* Main Content */}
      <div className="dashboard-main">
        <div className="dashboard-left">
          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: '#e0e7ff' }}>📋</div>
              <div className="stat-content">
                <div className="stat-number">{stats.applications}</div>
                <div className="stat-label">Applications</div>
                <div className="stat-change">+{stats.applicationsThisWeek} this week</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: '#f0fdf4' }}>📅</div>
              <div className="stat-content">
                <div className="stat-number">{stats.interviews}</div>
                <div className="stat-label">Interviews</div>
                <div className="stat-change">{stats.interviews > 0 ? stats.interviews + ' upcoming' : '0 upcoming'}</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: '#f0fdf4' }}>⭐</div>
              <div className="stat-content">
                <div className="stat-number">{stats.shortlisted}</div>
                <div className="stat-label">Shortlisted</div>
                <div className="stat-change">+{stats.shortlisted} new</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: '#fef3c7' }}>👁️</div>
              <div className="stat-content">
                <div className="stat-number">{stats.profileViews}</div>
                <div className="stat-label">Profile Views</div>
                <div className="stat-change">+{stats.profileViews} this week</div>
              </div>
            </div>
          </div>

          {/* Recent Applications */}
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
                        <span className="quiz-badge">Take Quiz →</span>
                      )}
                      {app.quizScore && (
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
                  return (
                    <div key={job._id} className="opportunity-item">
                      <div style={{ marginBottom: '8px' }}>
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
              <button className="action-item" onClick={() => navigate('/student/profile')}>
                <span>📤</span>
                <span>Upload Resume</span>
              </button>
              <button className="action-item" onClick={() => console.log('Add skills')}>
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
              {missingProfileItems.length === 0 ? (
                <p className="all-done">✅ All done! Your profile is complete</p>
              ) : (
                <>
                  <span className="items-count">{missingProfileItems.length} items left:</span>
                  <div className="items-tags">
                    {missingProfileItems.map((item, idx) => (
                      <span key={idx} className="item-tag">{item}</span>
                    ))}
                  </div>
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
    </div>
  );
};

export default StudentDashboard;
