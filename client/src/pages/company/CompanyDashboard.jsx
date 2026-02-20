import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import jobService from '../../services/jobService';
import './Dashboard.css';

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
    // TODO: Navigate to applicants page
    console.log('View applicants clicked');
  };

  const handleManageJobs = () => {
    navigate('/company/manage-jobs');
  };

  const handleCompanyProfile = () => {
    // TODO: Navigate to company profile page
    console.log('Company profile clicked');
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Company Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {user.name || 'Company'}!</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="stats-grid">
          <div className="stat-box">
            <h3>{stats.activeJobs}</h3>
            <p>Active Jobs</p>
          </div>
          <div className="stat-box">
            <h3>{stats.applicants}</h3>
            <p>Applicants</p>
          </div>
          <div className="stat-box">
            <h3>{stats.interviews}</h3>
            <p>Interviews</p>
          </div>
          <div className="stat-box">
            <h3>{stats.hired}</h3>
            <p>Hired</p>
          </div>
        </div>

        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button className="action-btn" onClick={handlePostJob}>Post New Job</button>
            <button className="action-btn" onClick={handleViewApplicants}>View Applicants</button>
            <button className="action-btn" onClick={handleManageJobs}>Manage Jobs</button>
            <button className="action-btn" onClick={handleCompanyProfile}>Company Profile</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDashboard;
