import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import jobService from '../../services/jobService';
import '../student/Dashboard.css';
import './CompanyApplicants.css';

const CompanyApplicants = () => {
  const navigate = useNavigate();
  const [approvedApplicants, setApprovedApplicants] = useState([]);
  const [passedApplicants, setPassedApplicants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const [selectedProfile, setSelectedProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const loadApplicants = async () => {
    setLoading(true);
    setError(null);
    try {
      const applicantsData = await jobService.getCompanyApprovedApplicants();

      const pendingList = applicantsData.pendingApplicants || applicantsData.data || [];
      const passedList = applicantsData.passedApplicants || [];

      setApprovedApplicants(Array.isArray(pendingList) ? pendingList : []);
      setPassedApplicants(Array.isArray(passedList) ? passedList : []);
    } catch (err) {
      setError(err.message || 'Failed to load applicants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplicants();
  }, []);

  const handleViewProfile = async (studentId) => {
    setProfileLoading(true);
    setProfileError(null);
    try {
      const data = await jobService.getStudentProfileForCompany(studentId);
      setSelectedProfile(data.data);
      setShowProfileModal(true);
    } catch (err) {
      setProfileError(err.message || 'Failed to load student profile');
    } finally {
      setProfileLoading(false);
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

  const handleRejectApplicant = async (applicationId) => {
    if (!applicationId) return;

    const confirmed = window.confirm('Are you sure you want to reject this applicant?');
    if (!confirmed) return;

    try {
      setActionLoadingId(applicationId);
      await jobService.rejectCompanyApplicant(applicationId);
      setApprovedApplicants((prev) => prev.filter((app) => app._id !== applicationId));
      setPassedApplicants((prev) => prev.filter((app) => app._id !== applicationId));
      setMessage({ type: 'success', text: 'Applicant rejected.' });
    } catch (err) {
      setError(err.message || 'Failed to reject applicant');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReassignApplicant = async (applicationId) => {
    if (!applicationId) return;

    try {
      setActionLoadingId(applicationId);
      await jobService.reassignCompanyApplicant(applicationId);
      setMessage({ type: 'success', text: 'Applicant reassigned to company quiz round.' });
      await loadApplicants();
    } catch (err) {
      setError(err.message || 'Failed to reassign applicant');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleMarkIneligible = async (applicationId) => {
    if (!applicationId) return;

    const confirmed = window.confirm('Mark this applicant as ineligible for this job?');
    if (!confirmed) return;

    try {
      setActionLoadingId(applicationId);
      await jobService.rejectCompanyApplicant(applicationId);
      setApprovedApplicants((prev) => prev.filter((app) => app._id !== applicationId));
      setPassedApplicants((prev) => prev.filter((app) => app._id !== applicationId));
      setMessage({ type: 'success', text: 'Applicant marked ineligible.' });
    } catch (err) {
      setError(err.message || 'Failed to mark ineligible');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleHireApplicant = async (applicationId) => {
    if (!applicationId) return;

    const confirmed = window.confirm('Approve this passed student as hired?');
    if (!confirmed) return;

    try {
      setActionLoadingId(applicationId);
      await jobService.hireCompanyApplicant(applicationId);
      setPassedApplicants((prev) => prev.filter((app) => app._id !== applicationId));
      setMessage({ type: 'success', text: 'Student approved as hired.' });
    } catch (err) {
      setError(err.message || 'Failed to approve applicant');
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
          <button className="back-btn" onClick={() => navigate('/company/dashboard')}>← Back to Dashboard</button>
        </div>
      </div>

      <div className="welcome-section">
        <h1>View Applicants</h1>
        <p>Track applicants and approve final hires after assessments.</p>
      </div>

      <div className="dashboard-main">
        <div className="full-width-section">
          {message?.text && (
            <div className={`applicants-message ${message.type}`}>{message.text}</div>
          )}

          {loading ? (
            <div className="applicants-card">
              <p>Loading applicants...</p>
            </div>
          ) : (
            <>
              <div className="applicants-card quiz-redirect-card">
                <h3 className="applicants-title">Company Applicant Quiz</h3>
               
                <ul className="quiz-redirect-points">
                  <li>Select a job and set quiz deadline.</li>
                  <li>Configure passing percentage and time limit.</li>
                  <li>Add questions and correct answers in one place.</li>
                </ul>
                <button
                  type="button"
                  className="hire-btn-small quiz-redirect-button"
                  onClick={() => navigate('/company/applicant-quiz-upload')}
                >
                  Go to Quiz Upload Page
                </button>
              </div>

              {error && (
                <div className="applicants-card">
                  <p className="applicants-error">{error}</p>
                </div>
              )}

              <div className="applicants-card">
                <h3 className="applicants-title">Applicant Pool ({approvedApplicants.length})</h3>
                {approvedApplicants.length === 0 ? (
                  <p className="applicants-muted">No applicants in pending pool right now.</p>
                ) : (
                  <ul className="approved-list">
                    {approvedApplicants.map((app) => (
                      <li key={app._id} className="approved-item">
                        <div>
                          <div className="approved-job-title">{app.jobId?.title || 'Job title not found'}</div>
                          <div className="approved-subline">{app.studentId?.name || 'Unknown student'} • {app.studentId?.email || ''}</div>
                          <div className="approved-subline">Applied on: {new Date(app.appliedAt).toLocaleDateString()}</div>
                          <div className="approved-subline">Status: {app.status?.replaceAll('_', ' ')}</div>
                        </div>
                        <div className="approved-actions">
                          <button
                            onClick={() => handleViewProfile(app.studentId?._id || app.studentId)}
                            className="profile-btn-small"
                            disabled={profileLoading}
                          >
                            {profileLoading ? 'Loading...' : 'See Profile'}
                          </button>
                          <button
                            onClick={() => handleReassignApplicant(app._id)}
                            className="profile-btn-small"
                            disabled={actionLoadingId === app._id}
                          >
                            {actionLoadingId === app._id ? 'Reassigning...' : 'Reassign'}
                          </button>
                          <button
                            onClick={() => handleMarkIneligible(app._id)}
                            className="reject-btn-small"
                            disabled={actionLoadingId === app._id}
                          >
                            {actionLoadingId === app._id ? 'Processing...' : 'Ineligible'}
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

              <div className="applicants-card passed-applicants-card">
                <h3 className="applicants-title">Students Passed Company Quiz (After Deadline) ({passedApplicants.length})</h3>
                {passedApplicants.length === 0 ? (
                  <p className="applicants-muted">No passed students are available for company approval yet.</p>
                ) : (
                  <ul className="approved-list">
                    {passedApplicants.map((app) => (
                      <li key={app._id} className="approved-item">
                        <div>
                          <div className="approved-job-title">{app.jobId?.title || 'Job title not found'}</div>
                          <div className="approved-subline">{app.studentId?.name || 'Unknown student'} • {app.studentId?.email || ''}</div>
                          <div className="approved-subline">Company Quiz Score: {app.companyQuizScore ?? 'N/A'}%</div>
                        </div>
                        <div className="approved-actions">
                          <button
                            onClick={() => handleViewProfile(app.studentId?._id || app.studentId)}
                            className="profile-btn-small"
                            disabled={profileLoading}
                          >
                            {profileLoading ? 'Loading...' : 'See Profile'}
                          </button>
                          <button
                            onClick={() => handleReassignApplicant(app._id)}
                            className="profile-btn-small"
                            disabled={actionLoadingId === app._id}
                          >
                            {actionLoadingId === app._id ? 'Reassigning...' : 'Reassign'}
                          </button>
                          <button
                            onClick={() => handleMarkIneligible(app._id)}
                            className="reject-btn-small"
                            disabled={actionLoadingId === app._id}
                          >
                            {actionLoadingId === app._id ? 'Processing...' : 'Ineligible'}
                          </button>
                          <button
                            onClick={() => handleHireApplicant(app._id)}
                            className="hire-btn-small"
                            disabled={actionLoadingId === app._id}
                          >
                            {actionLoadingId === app._id ? 'Approving...' : 'Approve'}
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

export default CompanyApplicants;
