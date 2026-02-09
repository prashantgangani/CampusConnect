import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import jobService from '../../services/jobService';
import { useDataRefresh } from '../../hooks/useDataRefresh';
import { NOTIFICATION_EVENTS } from '../../services/notificationService';
import './ManageJobs.css';

const ManageJobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected

  const fetchJobs = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      console.log('Fetching jobs for company...');
      const response = await jobService.getJobsByCompany();
      console.log('Jobs response:', response);
      setJobs(response.jobs || []);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      const errorMsg = err?.message || 'Failed to load jobs';
      setError(errorMsg);
      setMessage({ text: errorMsg, type: 'error' });
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Auto-refresh when jobs are approved, rejected, or deleted from other sources
  useDataRefresh(
    fetchJobs,
    [
      NOTIFICATION_EVENTS.JOB_APPROVED,
      NOTIFICATION_EVENTS.JOB_REJECTED,
      NOTIFICATION_EVENTS.JOB_DELETED,
      NOTIFICATION_EVENTS.JOB_CREATED
    ],
    500
  );

  const handleEditJob = (jobId) => {
    // TODO: Navigate to edit job page
    console.log('Edit job:', jobId);
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) {
      return;
    }

    try {
      await jobService.deleteJob(jobId);
      setMessage({ text: 'Job deleted successfully', type: 'success' });
      fetchJobs(); // Refresh the list
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch {
      setMessage({ text: 'Failed to delete job', type: 'error' });
    }
  };

  const handleViewApplicants = (jobId) => {
    // TODO: Navigate to applicants page for this job
    console.log('View applicants for job:', jobId);
  };

  const filteredJobs = jobs.filter(job => {
    if (filter === 'all') return true;
    return job.approvalStatus === filter;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="manage-jobs-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div className="loading">Loading jobs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="manage-jobs-container">
        <div className="manage-jobs-header">
          <div className="header-content">
            <h1>Manage Jobs</h1>
            <p>View and manage your job postings</p>
          </div>
          <button
            onClick={() => navigate('/company/dashboard')}
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
            Please check your connection, or try refresh the page.
          </p>
          <button
            onClick={fetchJobs}
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
    <div className="manage-jobs-container">
      <div className="manage-jobs-header">
        <div className="header-content">
          <h1>Manage Jobs</h1>
          <p>View and manage your job postings</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={fetchJobs}
            className="back-btn"
            style={{ backgroundColor: '#10b981', color: 'white', borderColor: '#059669' }}
          >
            🔄 Refresh Jobs
          </button>
          <button
            onClick={() => navigate('/company/dashboard')}
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

      <div className="jobs-controls">
        <div className="filter-controls">
          <label>Filter by status:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Jobs</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <button
          onClick={() => navigate('/company/post-job')}
          className="post-new-btn"
        >
          Post New Job
        </button>
      </div>

      <div className="jobs-list">
        {filteredJobs.length === 0 ? (
          <div className="no-jobs">
            <h3>No jobs found</h3>
            <p>You haven't posted any jobs yet.</p>
            <button
              onClick={() => navigate('/company/post-job')}
              className="post-first-btn"
            >
              Post Your First Job
            </button>
          </div>
        ) : (
          filteredJobs.map(job => (
            <div key={job._id} className="job-card">
              <div className="job-header">
                <div className="job-title-section">
                  <h3>{job.title}</h3>
                  <span className={`status-badge ${job.approvalStatus}`}>
                    {job.approvalStatus}
                  </span>
                </div>
                <div className="job-meta">
                  <span className="job-type">{job.jobType}</span>
                  <span className="job-location">{job.location}</span>
                  <span className="job-date">Posted: {formatDate(job.createdAt)}</span>
                </div>
              </div>

              <div className="job-content">
                <p className="job-description">
                  {job.description.length > 150
                    ? `${job.description.substring(0, 150)}...`
                    : job.description
                  }
                </p>

                <div className="job-details">
                  {job.salary && <span className="detail-item">💰 {job.salary}</span>}
                  {job.experience && <span className="detail-item">📅 {job.experience}</span>}
                  {job.applicationDeadline && (
                    <span className="detail-item">
                      ⏰ Deadline: {formatDate(job.applicationDeadline)}
                    </span>
                  )}
                </div>

              {job.approvalStatus === 'rejected' && job.reviewNotes && (
                <div className="review-feedback">
                  <h4>Rejection Reason:</h4>
                  <p>{job.reviewNotes}</p>
                  {job.reviewDate && (
                    <small>Reviewed on: {formatDate(job.reviewDate)}</small>
                  )}
                </div>
              )}

              {job.approvalStatus === 'pending' && (
                <div className="pending-notice">
                  <p>⏳ This job is pending approval from placement office.</p>
                </div>
              )}
              </div>

              <div className="job-actions">
                <button
                  onClick={() => handleViewApplicants(job._id)}
                  className="action-btn view-btn"
                >
                  View Applicants
                </button>
                <button
                  onClick={() => handleEditJob(job._id)}
                  className="action-btn edit-btn"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteJob(job._id)}
                  className="action-btn delete-btn"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ManageJobs;