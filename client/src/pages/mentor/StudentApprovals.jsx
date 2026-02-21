import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';

const StudentApprovals = () => {
  const navigate = useNavigate();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchPendingRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/mentor/requests/pending', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setPendingRequests(response.data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      setError(error.response?.data?.message || 'Failed to load pending requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingRequests();
  }, [fetchPendingRequests]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = (type, message) => {
    setToast({ type, message });
  };

  const handleReview = async (profileId, action) => {
    try {
      setProcessing(profileId);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/mentor/review-request',
        {
          profileId,
          action,
          note: ''
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        showToast('success', response.data.message || `Request ${action}d successfully`);
        await fetchPendingRequests();
      }
    } catch (error) {
      console.error('Error reviewing request:', error);
      showToast('error', error.response?.data?.message || 'Failed to review request');
    } finally {
      setProcessing(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="mentor-dashboard-root">
      <div className="mentor-dashboard-header">
        <div className="mentor-logo-wrap">
          <span className="mentor-logo-icon">🎓</span>
          <span className="mentor-logo-text">CampusConnect</span>
        </div>

        <div className="mentor-nav-actions">
          <button className="mentor-logout-btn" onClick={() => navigate('/mentor/dashboard')}>
            Dashboard
          </button>
          <button onClick={handleLogout} className="mentor-logout-btn">
            Logout
          </button>
        </div>
      </div>

      <div className="mentor-welcome-section">
        <h1>Student Mentor Requests 🎯</h1>
        <p>Review and approve students who requested you as their mentor.</p>
      </div>

      {toast?.message && (
        <div
          className={`mentor-toast ${
            toast.type === 'success' ? 'mentor-toast-success' : 'mentor-toast-error'
          }`}
        >
          {toast.message}
        </div>
      )}

      {error && <div className="mentor-error-box">{error}</div>}

      <div className="mentor-dashboard-content">
        {loading ? (
          <div className="mentor-loading">Loading pending requests...</div>
        ) : (
          <section className="mentor-main-section">
            <div className="mentor-section-head">
              <h2>Pending Requests</h2>
              <span>{pendingRequests.length} pending</span>
            </div>

            {pendingRequests.length === 0 ? (
              <p className="mentor-empty">No pending mentor requests at the moment.</p>
            ) : (
              <div className="mentor-requests-grid">
                {pendingRequests.map((request) => (
                  <div key={request._id} className="mentor-request-card">
                    <div className="mentor-request-header">
                      <div className="mentor-request-avatar">👤</div>
                      <div className="mentor-request-info">
                        <h3 className="mentor-request-name">{request.studentName}</h3>
                        <p className="mentor-request-email">{request.studentEmail}</p>
                        {request.studentInstitution && (
                          <p className="mentor-request-institution">
                            🏫 {request.studentInstitution}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mentor-request-meta">
                      <span className="mentor-request-date">
                        Requested: {new Date(request.requestedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="mentor-request-actions">
                      <button
                        type="button"
                        className="mentor-request-btn approve"
                        onClick={() => handleReview(request.profileId, 'approve')}
                        disabled={processing === request.profileId}
                      >
                        {processing === request.profileId ? 'Processing...' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        className="mentor-request-btn reject"
                        onClick={() => handleReview(request.profileId, 'reject')}
                        disabled={processing === request.profileId}
                      >
                        {processing === request.profileId ? 'Processing...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default StudentApprovals;
