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
      <div className="verify-companies-container min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center px-6 py-10">
        <div className="rounded-2xl bg-slate-900/80 border border-slate-700 px-8 py-6 text-slate-200 font-semibold shadow-lg">
          Loading pending jobs...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="verify-companies-container min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white px-6 py-8">
        <div className="verify-companies-header bg-slate-800 rounded-2xl shadow-lg p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="header-content">
            <h1 className="text-3xl font-bold text-white">Verify Companies</h1>
            <p className="text-slate-300">Review and approve job postings from companies</p>
          </div>
          <button
            onClick={() => navigate('/placement/dashboard')}
            className="back-btn rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-white font-semibold transition hover:bg-slate-600"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-red-500 bg-red-950/70 p-6 text-red-100 shadow-lg">
          <h3 className="text-xl font-bold">Error Loading Jobs</h3>
          <p className="mt-2 text-red-100">{error}</p>
          <p className="mt-2 text-sm text-red-200">
            Please check your connection, or try refreshing the page.
          </p>
          <button
            onClick={fetchPendingJobs}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-white font-semibold transition hover:bg-red-500"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="verify-companies-container min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white px-6 py-8">
      <div className="verify-companies-header bg-slate-800 rounded-2xl shadow-lg p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="header-content">
          <h1 className="text-3xl font-bold text-white">Verify Companies</h1>
          <p className="text-slate-300">Review and approve job postings from companies</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={fetchPendingJobs}
            className="back-btn rounded-lg border border-emerald-500/60 bg-emerald-600 px-4 py-2 text-white font-semibold transition hover:bg-emerald-500"
          >
            🔄 Refresh Jobs
          </button>
          <button
            onClick={() => navigate('/placement/dashboard')}
            className="back-btn rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-white font-semibold transition hover:bg-slate-600"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      {message.text && (
        <div
          className={`mt-6 rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg ${
            message.type === 'success'
              ? 'border-emerald-500/50 bg-emerald-900/40 text-emerald-100'
              : 'border-red-500/60 bg-red-950/70 text-red-100'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="mt-6 rounded-xl border border-blue-500/30 bg-slate-900 p-4 text-slate-200 shadow-lg">
        <div className="text-sm font-bold">🔐 Debug Info</div>
        <div className="mt-2 text-sm">
          <span className="font-semibold">Current Role:</span>{' '}
          {JSON.parse(localStorage.getItem('user') || '{}').role || 'Not set'}
        </div>
        <div className="text-sm">
          <span className="font-semibold">Token Present:</span>{' '}
          {localStorage.getItem('token') ? '✅ Yes' : '❌ No'}
        </div>
      </div>

      <div className="jobs-summary mt-6">
        <div className="summary-card bg-slate-800 rounded-2xl shadow-lg p-8 text-center transition hover:-translate-y-1">
          <h3 className="text-5xl font-bold text-amber-400">{jobs.length}</h3>
          <p className="mt-2 text-slate-300 font-medium">Pending Approvals</p>
        </div>
      </div>

      <div className="pending-jobs-list mt-6">
        {jobs.length === 0 ? (
          <div className="no-jobs bg-slate-800 rounded-2xl shadow-lg py-16 text-center">
            <div className="text-5xl">📭</div>
            <h3 className="mt-4 text-xl font-bold text-white">No pending jobs</h3>
            <p className="mt-2 text-slate-400">All job postings have been reviewed.</p>
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
