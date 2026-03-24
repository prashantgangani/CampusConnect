import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import jobService from '../../services/jobService';
import { useDataRefresh } from '../../hooks/useDataRefresh';
import { NOTIFICATION_EVENTS } from '../../services/notificationService';
import '../student/Dashboard.css';
import './ManageJobs.css';

const ManageJobs = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
  const [placementCells, setPlacementCells] = useState([]);
  const [editingJob, setEditingJob] = useState(null);
  const [selectedPlacementCellIds, setSelectedPlacementCellIds] = useState([]);
  const [savingEdit, setSavingEdit] = useState(false);

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

  useEffect(() => {
    const fetchPlacementCells = async () => {
      try {
        const response = await jobService.getPlacementCells();
        setPlacementCells(response.placementCells || []);
      } catch (err) {
        console.error('Failed to fetch placement cells:', err);
      }
    };

    fetchPlacementCells();
  }, []);

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

  const handleEditJob = (job) => {
    setEditingJob(job);
    setSelectedPlacementCellIds((job.allowedPlacementCells || []).map((cell) => String(cell._id || cell)));
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
    navigate('/company/applicants', { state: { jobId } });
  };

  const togglePlacementCellSelection = (cellId) => {
    setSelectedPlacementCellIds((prev) => (
      prev.includes(cellId)
        ? prev.filter((id) => id !== cellId)
        : [...prev, cellId]
    ));
  };

  const handleSaveJobPlacementCells = async () => {
    if (!editingJob?._id) return;

    try {
      setSavingEdit(true);
      await jobService.updateJob(editingJob._id, {
        allowedPlacementCells: selectedPlacementCellIds
      });

      await fetchJobs();
      setMessage({ text: 'Placement cells updated for the job', type: 'success' });
      setEditingJob(null);
      setSelectedPlacementCellIds([]);
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (err) {
      setMessage({
        text: err?.message || 'Failed to update placement cells',
        type: 'error'
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const filteredJobs = jobs.filter(job => {
    if (filter === 'all') return true;
    return job.approvalStatus === filter;
  });

  const stats = {
    total: jobs.length,
    approved: jobs.filter((job) => job.approvalStatus === 'approved').length,
    pending: jobs.filter((job) => job.approvalStatus === 'pending').length,
    rejected: jobs.filter((job) => job.approvalStatus === 'rejected').length
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="manage-jobs-theme-root">
        <div className="manage-jobs-loading">Loading jobs...</div>
      </div>
    );
  }

  return (
    <div className="manage-jobs-theme-root">
      <div className="dashboard-header">
        <div className="header-left">
          <div className="logo-section">
            <span className="logo-icon">🏢</span>
            <span className="logo-text">
              <span className="logo-campus">Campus</span>
              <span className="logo-connect">Connect</span>
            </span>
          </div>
        </div>

        <div className="header-right">
          <button
            onClick={fetchJobs}
            className="profile-btn"
          >
            🔄 Refresh Jobs
          </button>
          <button
            onClick={() => navigate('/company/dashboard')}
            className="profile-btn"
          >
            Back to Dashboard
          </button>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="welcome-section">
        <h1>Manage Jobs, {user.name || 'Company'} 👋</h1>
        <p>Track approval status, update postings, and manage openings in one place.</p>
      </div>

      {message.text && (
        <div className={`manage-jobs-message ${message.type}`}>
          {message.text}
        </div>
      )}

      {error && (
        <div className="manage-jobs-error-card">
          <h3>Error Loading Jobs</h3>
          <p>{error}</p>
          <p className="manage-jobs-error-hint">Please check your connection and try again.</p>
          <button onClick={fetchJobs} className="manage-jobs-retry-btn">Retry</button>
        </div>
      )}

      <div className="stats-wrapper">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}>📋</div>
            <div className="stat-content">
              <div className="stat-number">{stats.total}</div>
              <div className="stat-label">Total Jobs</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#d1fae5', color: '#059669' }}>✅</div>
            <div className="stat-content">
              <div className="stat-number">{stats.approved}</div>
              <div className="stat-label">Approved</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>⏳</div>
            <div className="stat-content">
              <div className="stat-number">{stats.pending}</div>
              <div className="stat-label">Pending</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#fee2e2', color: '#b91c1c' }}>⚠️</div>
            <div className="stat-content">
              <div className="stat-number">{stats.rejected}</div>
              <div className="stat-label">Rejected</div>
            </div>
          </div>
        </div>
      </div>

      <div className="manage-jobs-content-wrap">
        <div className="jobs-controls">
          <div className="filter-controls">
            <label>Filter by status</label>
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
            + Post New Job
          </button>
        </div>

        <div className="jobs-list">
          {filteredJobs.length === 0 ? (
            <div className="no-jobs">
              <h3>No jobs found</h3>
              <p>You haven't posted any jobs in this filter yet.</p>
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

                  <div className="job-placement-scope">
                    <strong>Placement Cells:</strong>
                    {(job.allowedPlacementCells || []).length > 0 ? (
                      <div className="job-placement-badges">
                        {job.allowedPlacementCells.map((cell) => (
                          <span key={cell._id || cell} className="job-placement-badge">
                            {cell.name || cell.email || 'Placement Cell'}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="job-placement-open">Open to all placement cells</span>
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
                    onClick={() => handleEditJob(job)}
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

      {editingJob && (
        <div className="manage-jobs-modal-overlay">
          <div className="manage-jobs-modal">
            <div className="manage-jobs-modal-header">
              <h3>Edit Placement Cells</h3>
              <button
                type="button"
                className="manage-jobs-modal-close"
                onClick={() => {
                  if (savingEdit) return;
                  setEditingJob(null);
                  setSelectedPlacementCellIds([]);
                }}
              >
                ×
              </button>
            </div>

            <p className="manage-jobs-modal-subtitle">
              Job: <strong>{editingJob.title}</strong>
            </p>
            <p className="manage-jobs-modal-note">
              Selected placement cells can route this job to mentors/students mapped to those placement cells.
            </p>

            <div className="manage-jobs-placement-list">
              {placementCells.length === 0 ? (
                <p className="manage-jobs-modal-empty">No placement cells found.</p>
              ) : (
                placementCells.map((cell) => {
                  const cellId = String(cell._id);
                  const isChecked = selectedPlacementCellIds.includes(cellId);
                  return (
                    <label key={cellId} className="manage-jobs-placement-item">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => togglePlacementCellSelection(cellId)}
                        disabled={savingEdit}
                      />
                      <span className="manage-jobs-placement-name">{cell.name}</span>
                      <small>{cell.email}</small>
                    </label>
                  );
                })
              )}
            </div>

            <div className="manage-jobs-modal-actions">
              <button
                type="button"
                className="manage-jobs-modal-cancel"
                onClick={() => {
                  if (savingEdit) return;
                  setEditingJob(null);
                  setSelectedPlacementCellIds([]);
                }}
                disabled={savingEdit}
              >
                Cancel
              </button>
              <button
                type="button"
                className="manage-jobs-modal-save"
                onClick={handleSaveJobPlacementCells}
                disabled={savingEdit}
              >
                {savingEdit ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageJobs;