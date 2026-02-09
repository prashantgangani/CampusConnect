import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import jobService from '../../services/jobService';
import { useDataRefresh } from '../../hooks/useDataRefresh';
import { NOTIFICATION_EVENTS } from '../../services/notificationService';
import './VerifyCompanies.css';

const VerifyCompanies = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [reviewNotes, setReviewNotes] = useState({});
  const [actionLoading, setActionLoading] = useState({});

  // Debug: Check user role on mount
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');
    console.log('VerifyCompanies Debug:', {
      userRole: user.role,
      hasToken: !!token,
      user: user
    });
  }, []);

  const fetchPendingJobs = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      setMessage({ text: '', type: '' });
      console.log('Fetching pending jobs...');
      const response = await jobService.getPendingJobs();
      console.log('Pending jobs response:', response);
      console.log('Jobs array:', response.jobs);
      setJobs(response.jobs || []);
    } catch (error) {
      console.error('Error fetching pending jobs:', error);
      setJobs([]);
      const errorMsg = error?.message || 'Failed to load pending jobs';
      setError(errorMsg);
      setMessage({ text: errorMsg, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingJobs();
  }, [fetchPendingJobs]);

  // Auto-refresh when jobs are approved or rejected from other sources
  useDataRefresh(
    fetchPendingJobs,
    [NOTIFICATION_EVENTS.JOB_APPROVED, NOTIFICATION_EVENTS.JOB_REJECTED],
    500
  );

  const handleApprove = async (jobId) => {
    const notes = reviewNotes[jobId] || '';
    setActionLoading(prev => ({ ...prev, [jobId]: true }));

    try {
      await jobService.approveJob(jobId, notes);
      setMessage({ text: 'Job approved successfully', type: 'success' });
      fetchPendingJobs(); // Refresh the list
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (error) {
      console.error('Approve error:', error);
      const errorMsg = error?.message || 'Failed to approve job';
      setMessage({ text: errorMsg, type: 'error' });
    } finally {
      setActionLoading(prev => ({ ...prev, [jobId]: false }));
    }
  };

  const handleReject = async (jobId) => {
    const notes = reviewNotes[jobId] || '';
    if (!notes.trim()) {
      setMessage({ text: 'Please provide rejection reason', type: 'error' });
      return;
    }

    setActionLoading(prev => ({ ...prev, [jobId]: true }));

    try {
      await jobService.rejectJob(jobId, notes);
      setMessage({ text: 'Job rejected successfully', type: 'success' });
      fetchPendingJobs(); // Refresh the list
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (error) {
      console.error('Reject error:', error);
      const errorMsg = error?.message || 'Failed to reject job';
      setMessage({ text: errorMsg, type: 'error' });
    } finally {
      setActionLoading(prev => ({ ...prev, [jobId]: false }));
    }
  };

  const handleNotesChange = (jobId, notes) => {
    setReviewNotes(prev => ({ ...prev, [jobId]: notes }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="verify-companies-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div className="loading">Loading pending jobs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="verify-companies-container">
        <div className="verify-companies-header">
          <div className="header-content">
            <h1>Verify Companies</h1>
            <p>Review and approve job postings from companies</p>
          </div>
          <button
            onClick={() => navigate('/placement/dashboard')}
            className="back-btn"
          >
            Back to Dashboard
          </button>
        </div>
        <div className="error-message" style={{
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #ef4444'
        }}>
          <h3>Error Loading Jobs</h3>
          <p>{error}</p>
          <p style={{ fontSize: '12px', marginTop: '10px' }}>
            Please check your connection, or try refreshing the page.
          </p>
          <button
            onClick={fetchPendingJobs}
            style={{
              marginTop: '10px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="verify-companies-container">
      <div className="verify-companies-header">
        <div className="header-content">
          <h1>Verify Companies</h1>
          <p>Review and approve job postings from companies</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={fetchPendingJobs}
            className="back-btn"
            style={{ backgroundColor: '#10b981', color: 'white', borderColor: '#059669' }}
          >
            🔄 Refresh Jobs
          </button>
          <button
            onClick={() => navigate('/placement/dashboard')}
            className="back-btn"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Debug Info */}
      <div style={{
        backgroundColor: '#f0f9ff',
        color: '#0369a1',
        padding: '12px 16px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #0ea5e9',
        fontSize: '12px'
      }}>
        <strong>🔐 Debug Info:</strong>
        <div>Current Role: <strong>{JSON.parse(localStorage.getItem('user') || '{}').role || 'Not set'}</strong></div>
        <div>Token Present: <strong>{localStorage.getItem('token') ? '✅ Yes' : '❌ No'}</strong></div>
      </div>

      <div className="jobs-summary">
        <div className="summary-card">
          <h3>{jobs.length}</h3>
          <p>Pending Approvals</p>
        </div>
      </div>

      <div className="pending-jobs-list">
        {jobs.length === 0 ? (
          <div className="no-jobs">
            <h3>No pending jobs</h3>
            <p>All job postings have been reviewed.</p>
          </div>
        ) : (
          jobs.map(job => (
            <div key={job._id} className="job-review-card">
              <div className="job-header">
                <div className="job-title-section">
                  <h3>{job.title}</h3>
                  <div className="company-info">
                    <span className="company-name">{job.company?.name || 'Unknown Company'}</span>
                    <span className="posted-date">Posted: {formatDate(job.createdAt)}</span>
                  </div>
                </div>
                <div className="approval-badge pending">
                  Pending Approval
                </div>
              </div>

              <div className="job-content">
                <div className="job-details-grid">
                  <div className="detail-item">
                    <strong>Type:</strong> {job.jobType}
                  </div>
                  <div className="detail-item">
                    <strong>Location:</strong> {job.location}
                  </div>
                  {job.salary && (
                    <div className="detail-item">
                      <strong>Salary:</strong> {job.salary}
                    </div>
                  )}
                  {job.experience && (
                    <div className="detail-item">
                      <strong>Experience:</strong> {job.experience}
                    </div>
                  )}
                </div>

                <div className="job-description">
                  <h4>Job Description</h4>
                  <p>{job.description}</p>
                </div>

                <div className="job-requirements">
                  <h4>Requirements</h4>
                  <p>{job.requirements}</p>
                </div>

                {job.skills && job.skills.length > 0 && (
                  <div className="job-skills">
                    <h4>Skills Required</h4>
                    <div className="skills-list">
                      {job.skills.map((skill, index) => (
                        <span key={index} className="skill-tag">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}

                {job.applicationDeadline && (
                  <div className="deadline-info">
                    <strong>Application Deadline:</strong> {formatDate(job.applicationDeadline)}
                  </div>
                )}
              </div>

              <div className="review-section">
                <div className="review-notes">
                  <label htmlFor={`notes-${job._id}`}>Review Notes (required for rejection)</label>
                  <textarea
                    id={`notes-${job._id}`}
                    value={reviewNotes[job._id] || ''}
                    onChange={(e) => handleNotesChange(job._id, e.target.value)}
                    placeholder="Add any comments or reasons for approval/rejection..."
                    rows="3"
                  />
                </div>

                <div className="review-actions">
                  <button
                    onClick={() => handleApprove(job._id)}
                    disabled={actionLoading[job._id]}
                    className="action-btn approve-btn"
                  >
                    {actionLoading[job._id] ? 'Approving...' : 'Approve Job'}
                  </button>
                  <button
                    onClick={() => handleReject(job._id)}
                    disabled={actionLoading[job._id]}
                    className="action-btn reject-btn"
                  >
                    {actionLoading[job._id] ? 'Rejecting...' : 'Reject Job'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VerifyCompanies;
