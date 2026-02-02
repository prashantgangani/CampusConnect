import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const CompanyDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
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
            <h3>0</h3>
            <p>Active Jobs</p>
          </div>
          <div className="stat-box">
            <h3>0</h3>
            <p>Applicants</p>
          </div>
          <div className="stat-box">
            <h3>0</h3>
            <p>Interviews</p>
          </div>
          <div className="stat-box">
            <h3>0</h3>
            <p>Hired</p>
          </div>
        </div>

        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button className="action-btn">Post New Job</button>
            <button className="action-btn">View Applicants</button>
            <button className="action-btn">Manage Jobs</button>
            <button className="action-btn">Company Profile</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDashboard;
