import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const PlacementDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleVerifyCompanies = () => {
    navigate('/placement/verify-companies');
  };

  const handleManageJobs = () => {
    // TODO: Navigate to manage all jobs page
    console.log('Manage jobs clicked');
  };

  const handleViewAnalytics = () => {
    // TODO: Navigate to analytics page
    console.log('View analytics clicked');
  };

  const handleGenerateReports = () => {
    // TODO: Navigate to reports page
    console.log('Generate reports clicked');
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Placement Cell Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {user.name || 'Admin'}!</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="stats-grid">
          <div className="stat-box">
            <h3>0</h3>
            <p>Total Students</p>
          </div>
          <div className="stat-box">
            <h3>0</h3>
            <p>Total Jobs</p>
          </div>
          <div className="stat-box">
            <h3>0</h3>
            <p>Companies</p>
          </div>
          <div className="stat-box">
            <h3>0</h3>
            <p>Placements</p>
          </div>
        </div>

        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button className="action-btn" onClick={handleVerifyCompanies}>Verify Companies</button>
            <button className="action-btn" onClick={handleManageJobs}>Manage Jobs</button>
            <button className="action-btn" onClick={handleViewAnalytics}>View Analytics</button>
            <button className="action-btn" onClick={handleGenerateReports}>Generate Reports</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlacementDashboard;
