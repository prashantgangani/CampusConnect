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
            <button className="action-btn">Verify Companies</button>
            <button className="action-btn">Manage Jobs</button>
            <button className="action-btn">View Analytics</button>
            <button className="action-btn">Generate Reports</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlacementDashboard;
