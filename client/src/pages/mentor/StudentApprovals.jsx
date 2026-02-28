import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import mentorService from '../../services/mentorService';
import './Dashboard.css';

const StudentApprovals = () => {
  const navigate = useNavigate();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(null);
  const [processingApplication, setProcessingApplication] = useState(null);
  const [toast, setToast] = useState(null);
  const [awaitingApprovals, setAwaitingApprovals] = useState([]);

  const fetchAllRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const [response, awaitingResponse] = await Promise.all([
        axios.get('http://localhost:5000/api/mentor/requests/pending', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        mentorService.getAwaitingApprovals()
      ]);

      if (response.data.success) {
        setPendingRequests(response.data.requests || []);
      }

      setAwaitingApprovals(awaitingResponse.data || []);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      setError(error.response?.data?.message || 'Failed to load pending requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllRequests();
  }, [fetchAllRequests]);

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
        const toastType = action === 'approve' ? 'success' : 'error';
        showToast(toastType, response.data.message || `Request ${action}d successfully`);
        await fetchAllRequests();
      }
    } catch (error) {
      console.error('Error reviewing request:', error);
      showToast('error', error.response?.data?.message || 'Failed to review request');
    } finally {
      setProcessing(null);
    }
  };

  const handleApplicationReview = async (applicationId, action) => {
    try {
      setProcessingApplication(applicationId);

      if (action === 'approve') {
        await mentorService.approveApplication(applicationId);
        showToast('success', 'Application approved successfully');
      } else {
        await mentorService.rejectApplication(applicationId);
        showToast('error', 'Application rejected successfully');
      }

      setAwaitingApprovals((prev) => prev.filter((application) => application._id !== applicationId));
    } catch (error) {
      showToast('error', error?.message || 'Failed to process application');
    } finally {
      setProcessingApplication(null);
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
          <span className="mentor-logo-text">
            <span className="mentor-logo-campus">Campus</span>
            <span className="mentor-logo-connect">Connect</span>
          </span>
        </div>

        <div className="mentor-nav-actions">
          <button className="mentor-logout-btn" onClick={() => navigate('/mentor/dashboard')}>
            Dashboard
          </button>
          <button onClick={handleLogout} className="mentor-logout-btn mentor-logout-danger">
            Logout
          </button>
        </div>
      </div>

      <div className="mentor-welcome-section">
        <h1>Mentor Requests 🎯</h1>
        <p>Review quiz-passed applications and pending student mentor requests.</p>
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
          <>
            <section className="mentor-main-section">
              <div className="mentor-section-head">
                <h2>Quiz-passed Applications Approvals</h2>
                <span>{awaitingApprovals.length} pending</span>
              </div>

              {awaitingApprovals.length === 0 ? (
                <p className="mentor-empty">No quiz-passed applications pending approval.</p>
              ) : (
                <div className="mentor-requests-grid">
                  {awaitingApprovals.map((application) => (
                    <div key={application._id} className="mentor-request-card">
                      <div className="mentor-request-meta-row">
                        <span className="mentor-request-status-badge">QUIZ-PASSED APPLICATION</span>
                        <span className="mentor-request-score">Quiz Score: {application.quizScore ?? 0}%</span>
                      </div>

                      <div className="mentor-request-info">
                        <h3 className="mentor-request-name">{application.studentId?.name || 'Student'}</h3>
                        <p className="mentor-request-email">Job: {application.jobId?.title || 'Job Title'}</p>
                      </div>

                      <div className="mentor-request-actions">
                        <button
                          type="button"
                          className="mentor-request-btn approve"
                          onClick={() => handleApplicationReview(application._id, 'approve')}
                          disabled={processingApplication === application._id}
                        >
                          {processingApplication === application._id ? 'Processing...' : 'Approve'}
                        </button>
                        <button
                          type="button"
                          className="mentor-request-btn reject"
                          onClick={() => handleApplicationReview(application._id, 'reject')}
                          disabled={processingApplication === application._id}
                        >
                          {processingApplication === application._id ? 'Processing...' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="mentor-recent-section">
              <div className="mentor-section-head">
                <h2>Student Mentor Requests</h2>
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
          </>
        )}
      </div>
    </div>
  );
};

export default StudentApprovals;
