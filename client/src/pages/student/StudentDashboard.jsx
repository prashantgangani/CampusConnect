import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const StudentDashboard = () => {
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
        <h1>Student Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {user.name || 'Student'}!</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="stats-grid">
          <div className="stat-box">
            <h3>0</h3>
            <p>Applications</p>
          </div>
          <div className="stat-box">
            <h3>0</h3>
            <p>Jobs Available</p>
          </div>
          <div className="stat-box">
            <h3>0</h3>
            <p>Interviews</p>
          </div>
          <div className="stat-box">
            <h3>0</h3>
            <p>Offers</p>
          </div>
        </div>

        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button className="action-btn">Browse Jobs</button>
            <button className="action-btn">View Applications</button>
            <button className="action-btn">Take Quiz</button>
            <button className="action-btn">Update Profile</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
