import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import jobService from '../../services/jobService';
import '../student/Dashboard.css';
import './CompanyApplicants.css';

const CompanyInterviews = () => {
  const navigate = useNavigate();
  const [interviewApplicants, setInterviewApplicants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const [selectedProfile, setSelectedProfile] = useState(null);
  const [profileError, setProfileError] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  
  const [selectedJobFilter, setSelectedJobFilter] = useState('');
  const [allJobs, setAllJobs] = useState([]);

  const loadInterviewApplicants = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load applicants
      const applicantsData = await jobService.getCompanyApprovedApplicants();
      const interviewList = applicantsData.interviewApplicants || [];

      setInterviewApplicants(Array.isArray(interviewList) ? interviewList : []);

      // Load jobs for filter
      try {
        const jobsData = await jobService.getJobsByCompany();
        setAllJobs(Array.isArray(jobsData.jobs) ? jobsData.jobs : []);
      } catch (jobErr) {
        console.log('Could not load jobs for filter');
      }
    } catch (err) {
      setError(err.message || 'Failed to load applicants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInterviewApplicants();
  }, []);

  const handleViewProfile = async (studentId) => {
    if (!studentId) return;
    setActionLoadingId(`profile-${studentId}`);
    setProfileError(null);
    setError(null);
    try {
      const response = await jobService.getStudentProfileForCompany(studentId);
      const profileData = response.data || response;
      setSelectedProfile(profileData);
      setShowProfileModal(true);
    } catch (err) {
      console.error('Profile error:', err);
      const errMsg = typeof err === 'string' ? err : (err?.message || 'Failed to load student profile');
      setProfileError(errMsg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleViewResume = async (publicId) => {
    if (!publicId) return;
    try {
      const result = await jobService.getResumeUrl(publicId);

      if (result?.success && result?.url) {
        try {
          const response = await fetch(result.url, {
            headers: {
              Accept: 'application/pdf'
            }
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const blob = await response.blob();
          if (blob.size === 0) {
            throw new Error('Received empty PDF');
          }

          const blobUrl = URL.createObjectURL(blob);
          window.open(blobUrl, '_blank', 'noopener,noreferrer');
          return;
        } catch {
          window.open(result.url, '_blank', 'noopener,noreferrer');
          return;
        }
      }

      setProfileError('Resume URL not found');
    } catch (err) {
      setProfileError(err.message || 'Failed to view resume');
    }
  };

  const closeProfileModal = () => {
    setShowProfileModal(false);
    setSelectedProfile(null);
    setProfileError(null);
  };

  // Filter applicants by job title
  const filteredInterviewApplicants = selectedJobFilter
    ? interviewApplicants.filter((app) => app.jobId?._id === selectedJobFilter)
    : interviewApplicants;

  const handleHireFromInterview = async (applicationId) => {
    if (!applicationId) return;

    const confirmed = window.confirm('Offer this student a position?');
    if (!confirmed) return;

    try {
      setActionLoadingId(applicationId);
      await jobService.hireFromInterview(applicationId);
      setInterviewApplicants((prev) => prev.filter((app) => app._id !== applicationId));
      setMessage({ type: 'success', text: 'Student offered a position.' });
    } catch (err) {
      setError(err.message || 'Failed to hire student');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectApplicant = async (applicationId) => {
    if (!applicationId) return;

    const confirmed = window.confirm('Are you sure you want to reject this applicant? They will see a rejection message.');
    if (!confirmed) return;

    try {
      setActionLoadingId(applicationId);
      await jobService.rejectCompanyApplicant(applicationId);
      setInterviewApplicants((prev) => prev.filter((app) => app._id !== applicationId));
      setMessage({ type: 'success', text: 'Applicant rejected. They have been notified.' });
      setError(null);
    } catch (err) {
      console.error('Reject error:', err);
      const errMsg = typeof err === 'string' ? err : (err?.message || 'Failed to reject applicant');
      setError(errMsg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const socialLinks = selectedProfile?.links
    ? Object.entries(selectedProfile.links).filter(([, value]) => Boolean(value))
    : [];

  return (
    <div className="student-dashboard company-applicants-root">
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
          <button className="back-btn" onClick={() => navigate('/company/applicants')}>Back to Applicants</button>
          <button className="back-btn" onClick={() => navigate('/company/dashboard')}>← Back to Dashboard</button>
        </div>
      </div>

      <div className="welcome-section">
        <h1>Interview Candidates</h1>
        <p>Review and make hiring decisions for interview candidates.</p>
      </div>

      <div className="dashboard-main">
        <div className="full-width-section">
          {message?.text && (
            <div className={`applicants-message ${message.type}`}>{message.text}</div>
          )}

          {loading ? (
            <div className="applicants-card">
              <p>Loading candidates...</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="applicants-card">
                  <p className="applicants-error">{error}</p>
                </div>
              )}

              {/* Job Filter */}
              <div className="applicants-card" style={{ paddingBottom: '12px' }}>
                <label style={{ color: '#e2e8f0', marginBottom: '8px', display: 'block', fontWeight: '600' }}>
                  Filter by Job:
                  <select
                    value={selectedJobFilter}
                    onChange={(e) => setSelectedJobFilter(e.target.value)}
                    style={{
                      marginLeft: '8px',
                      padding: '6px 10px',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      color: '#f1f5f9',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">All Jobs</option>
                    {allJobs.map((job) => (
                      <option key={job._id} value={job._id}>
                        {job.title}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="applicants-card passed-applicants-card">
                <h3 className="applicants-title">Interview Candidates ({filteredInterviewApplicants.length})</h3>
                {filteredInterviewApplicants.length === 0 ? (
                  <p className="applicants-muted">{selectedJobFilter ? 'No candidates in interviews for this job.' : 'No candidates in interviews yet.'}</p>
                ) : (
                  <ul className="approved-list">
                    {filteredInterviewApplicants.map((app) => (
                      <li key={app._id} className="approved-item">
                        <div>
                          <div className="approved-job-title">{app.jobId?.title || 'Job title not found'}</div>
                          <div className="approved-subline">{app.studentId?.name || 'Unknown student'} • {app.studentId?.email || ''}</div>
                          <div className="approved-subline">
                            Quiz Score: {app.companyQuizScore ?? 'N/A'}%
                          </div>
                        </div>
                        <div className="approved-actions">
                          <button
                            onClick={() => handleViewProfile(app.studentId?._id || app.studentId)}
                            className="profile-btn-small"
                            disabled={actionLoadingId === `profile-${app._id}`}
                          >
                            {actionLoadingId === `profile-${app._id}` ? 'Loading...' : 'See Profile'}
                          </button>
                          <button
                            onClick={() => handleHireFromInterview(app._id)}
                            className="hire-btn-small"
                            disabled={actionLoadingId === app._id}
                          >
                            {actionLoadingId === app._id ? 'Processing...' : 'Hire'}
                          </button>
                          <button
                            onClick={() => handleRejectApplicant(app._id)}
                            className="reject-btn-small"
                            disabled={actionLoadingId === app._id}
                          >
                            {actionLoadingId === app._id ? 'Rejecting...' : 'Reject'}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {showProfileModal && selectedProfile && (
        <div className="company-applicants-modal-overlay">
          <div className="company-applicants-modal">
            <div className="company-applicants-modal-head">
              <h2>Student Profile</h2>
              <button onClick={closeProfileModal} className="company-applicants-close">×</button>
            </div>

            {profileError ? (
              <p className="applicants-error">{profileError}</p>
            ) : (
              <div>
                <div className="company-applicants-section">
                  <h3>Personal Information</h3>
                  <div className="company-applicants-grid">
                    <div><strong>Full Name:</strong> {selectedProfile.fullName || 'N/A'}</div>
                    <div><strong>Email:</strong> {selectedProfile.email || 'N/A'}</div>
                    <div><strong>Phone:</strong> {selectedProfile.phone || 'N/A'}</div>
                    <div><strong>Institution:</strong> {selectedProfile.institution || 'N/A'}</div>
                    <div><strong>Department:</strong> {selectedProfile.department || 'N/A'}</div>
                    <div><strong>CGPA:</strong> {selectedProfile.cgpa || 'N/A'}</div>
                  </div>
                </div>

                <div className="company-applicants-section">
                  <h3>Academic Information</h3>
                  <div className="company-applicants-grid">
                    <div><strong>10th Marks:</strong> {selectedProfile.tenthMarks || 'N/A'}%</div>
                    <div><strong>12th Marks:</strong> {selectedProfile.twelfthMarks || 'N/A'}%</div>
                  </div>
                </div>

                <div className="company-applicants-section">
                  <h3>Skills</h3>
                  <div className="company-applicants-skills">
                    {selectedProfile.skills && selectedProfile.skills.length > 0 ? (
                      selectedProfile.skills.map((skill, index) => (
                        <span key={index} className="company-applicants-skill">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span>N/A</span>
                    )}
                  </div>
                </div>

                <div className="company-applicants-section">
                  <h3>Resume</h3>
                  {selectedProfile.resume ? (
                    <button
                      onClick={() => handleViewResume(selectedProfile.resume.publicId || selectedProfile.resume.fileName)}
                      className="company-applicants-resume-btn"
                    >
                      View Resume ({selectedProfile.resume.fileName || 'resume'})
                    </button>
                  ) : (
                    <span>N/A</span>
                  )}
                </div>

                <div className="company-applicants-section">
                  <h3>Social & Coding Profiles</h3>
                  <div className="company-applicants-links">
                    {socialLinks.length > 0 ? (
                      socialLinks.map(([key, value]) => (
                        <div key={key} className="company-applicants-link-row">
                          <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong>
                          <a href={value} target="_blank" rel="noopener noreferrer">
                            {value}
                          </a>
                        </div>
                      ))
                    ) : (
                      <span>N/A</span>
                    )}
                  </div>
                </div>

                <div className="company-applicants-section">
                  <h3>Mentor Information</h3>
                  {selectedProfile.mentor ? (
                    <div>
                      <div><strong>Mentor:</strong> {selectedProfile.mentor.name} ({selectedProfile.mentor.email})</div>
                    </div>
                  ) : selectedProfile.mentorRequested ? (
                    <div>
                      <div><strong>Requested Mentor:</strong> {selectedProfile.mentorRequested.name} ({selectedProfile.mentorRequested.email})</div>
                      <div><strong>Status:</strong> {selectedProfile.mentorRequestStatus}</div>
                    </div>
                  ) : (
                    <span>No mentor assigned</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyInterviews;
