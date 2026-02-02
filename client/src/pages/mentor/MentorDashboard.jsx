import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const MentorDashboard = () => {
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
        <h1>Mentor Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {user.name || 'Mentor'}!</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="stats-grid">
          <div className="stat-box">
            <h3>0</h3>
            <p>Students</p>
          </div>
          <div className="stat-box">
            <h3>0</h3>
            <p>Pending Approvals</p>
          </div>
          <div className="stat-box">
            <h3>0</h3>
            <p>Feedback Given</p>
          </div>
          <div className="stat-box">
            <h3>0</h3>
            <p>Sessions</p>
          </div>
        </div>

        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button className="action-btn">Approve Students</button>
            <button className="action-btn">Give Feedback</button>
            <button className="action-btn">View Students</button>
            <button className="action-btn">Mentor Profile</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorDashboard;
