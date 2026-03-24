import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import jobService from '../../services/jobService';
import '../student/Dashboard.css';
import './CompanyReports.css';

const safeSummary = {
  totalJobsPosted: 0,
  activeJobs: 0,
  totalApplications: 0,
  passedAndApplied: 0,
  mentorApproved: 0,
  interviewsScheduled: 0,
  hired: 0
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString();
};

const CompanyReports = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(safeSummary);
  const [jobReports, setJobReports] = useState([]);

  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        setError('');

        const data = await jobService.getCompanyReports();
        setSummary(data.summary || safeSummary);
        setJobReports(Array.isArray(data.jobs) ? data.jobs : []);
      } catch (err) {
        setError(err?.message || 'Unable to load reports right now.');
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  const passRate = useMemo(() => {
    if (!summary.totalApplications) return 0;
    return Math.round((summary.passedAndApplied / summary.totalApplications) * 100);
  }, [summary.passedAndApplied, summary.totalApplications]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="company-reports-root student-dashboard">
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
          <button className="profile-btn" onClick={() => navigate('/company/dashboard')}>Dashboard</button>
          <button className="profile-btn" onClick={() => navigate('/company/manage-jobs')}>Manage Jobs</button>
          <button className="profile-btn" onClick={() => navigate('/company/applicants')}>Applicants</button>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="welcome-section">
        <h1>Company Reports</h1>
        <p>
          {`Hello ${user.name || 'Company'}, here is your hiring performance snapshot.`}
        </p>
      </div>

      {error && (
        <div className="company-reports-message error">{error}</div>
      )}

      <div className="company-reports-content">
        <div className="stats-grid company-reports-summary-grid">
          <div className="stat-card">
            <div className="stat-icon reports-blue">🧾</div>
            <div className="stat-content">
              <div className="stat-number">{summary.totalJobsPosted}</div>
              <div className="stat-label">Jobs Posted</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon reports-green">✅</div>
            <div className="stat-content">
              <div className="stat-number">{summary.passedAndApplied}</div>
              <div className="stat-label">Students Passed & Applied</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon reports-amber">👥</div>
            <div className="stat-content">
              <div className="stat-number">{summary.totalApplications}</div>
              <div className="stat-label">Total Applications</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon reports-purple">📈</div>
            <div className="stat-content">
              <div className="stat-number">{`${passRate}%`}</div>
              <div className="stat-label">Pass Rate</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon reports-cyan">📅</div>
            <div className="stat-content">
              <div className="stat-number">{summary.interviewsScheduled}</div>
              <div className="stat-label">Interviews Scheduled</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon reports-red">🎯</div>
            <div className="stat-content">
              <div className="stat-number">{summary.hired}</div>
              <div className="stat-label">Hired</div>
            </div>
          </div>
        </div>

        <div className="company-reports-table-card">
          <div className="company-reports-table-header">
            <h3>Job-wise Reports</h3>
            <span>{loading ? 'Loading...' : `${jobReports.length} jobs`}</span>
          </div>

          {!loading && !jobReports.length && (
            <div className="company-reports-empty">No jobs found yet. Post a job to see reports here.</div>
          )}

          {!!jobReports.length && (
            <div className="company-reports-table-wrap">
              <table className="company-reports-table">
                <thead>
                  <tr>
                    <th>Job</th>
                    <th>Posted On</th>
                    <th>Applications</th>
                    <th>Passed & Applied</th>
                    <th>Mentor Approved</th>
                    <th>Interviews</th>
                    <th>Hired</th>
                  </tr>
                </thead>
                <tbody>
                  {jobReports.map((job) => (
                    <tr key={job.jobId}>
                      <td>
                        <div className="job-title-cell">{job.title}</div>
                        <div className="job-subtext">{job.location} • {job.jobType}</div>
                      </td>
                      <td>{formatDate(job.postedOn)}</td>
                      <td>{job.totalApplications}</td>
                      <td>{job.passedAndApplied}</td>
                      <td>{job.mentorApproved}</td>
                      <td>{job.interviewsScheduled}</td>
                      <td>{job.hired}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyReports;
