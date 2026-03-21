import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import jobService from '../../services/jobService';
import '../student/Dashboard.css';

const CompanyApplicants = () => {
  const navigate = useNavigate();
  const [approvedApplicants, setApprovedApplicants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    const loadApprovedApplicants = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await jobService.getCompanyApprovedApplicants();
        setApprovedApplicants(data.data || []);
      } catch (err) {
        setError(err.message || 'Failed to load approved applicants');
      } finally {
        setLoading(false);
      }
    };

    loadApprovedApplicants();
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
          // Try to fetch as blob first
          const response = await fetch(result.url, {
            headers: {
              'Accept': 'application/pdf'
            }
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const blob = await response.blob();
          
          // Verify blob is a valid PDF
          if (blob.size === 0) {
            throw new Error('Received empty PDF');
          }

          if (!blob.type.includes('pdf') && !blob.type.includes('octet-stream')) {
            throw new Error('Invalid PDF format');
          }

          const blobUrl = URL.createObjectURL(blob);
          window.open(blobUrl, '_blank', 'noopener,noreferrer');
          return;
        } catch (fetchError) {
          console.warn('Blob fetch failed, trying direct URL:', fetchError);
          // Fallback to direct URL if blob fetch fails
          window.open(result.url, '_blank', 'noopener,noreferrer');
          return;
        }
      } else {
        setProfileError('Resume URL not found');
      }
    } catch (err) {
      setProfileError(err.message || 'Failed to view resume');
    }
  };

  const closeProfileModal = () => {
    setShowProfileModal(false);
    setSelectedProfile(null);
    setProfileError(null);
  };

  return (
    <div className="student-dashboard">
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
        <p>Review and manage job applications that have been approved by mentors.</p>
      </div>

      <div className="dashboard-main">
        <div className="full-width-section">
          {loading ? (
            <div className="section-card">
              <p>Loading approved applicants...</p>
            </div>
          ) : error ? (
            <div className="section-card">
              <p style={{ color: '#f87171' }}>{error}</p>
            </div>
          ) : approvedApplicants.length === 0 ? (
            <div className="section-card">
              <p style={{ color: '#94a3b8' }}>No mentor-approved applicants yet.</p>
            </div>
          ) : (
            <div className="section-card">
              <h3>Approved Applicants ({approvedApplicants.length})</h3>
              <ul className="applications-list" style={{ maxHeight: '600px', overflowY: 'auto', padding: 0, listStyle: 'none' }}>
                {approvedApplicants.map((app) => (
                  <li key={app._id} className="application-item" style={{ marginBottom: '10px', padding: '12px', borderRadius: '10px', border: '1px solid #1f2937', background: 'rgba(17, 24, 39, 0.72)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#f8fafc' }}>{app.jobId?.title || 'Job title not found'}</div>
                        <div style={{ color: '#94a3b8', fontSize: '12px' }}>{app.studentId?.name || 'Unknown student'} • {app.studentId?.email || ''}</div>
                        <div style={{ color: '#94a3b8', fontSize: '12px' }}>Applied on: {new Date(app.appliedAt).toLocaleDateString()}</div>
                      </div>
                      <button 
                        onClick={() => handleViewProfile(app.studentId?._id || app.studentId)} 
                        style={{ background: '#0369a1', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer' }}
                        disabled={profileLoading}
                      >
                        {profileLoading ? 'Loading...' : 'See Profile'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Student Profile Modal */}
      {showProfileModal && selectedProfile && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#1f2937',
            borderRadius: '10px',
            padding: '20px',
            maxWidth: '800px',
            maxHeight: '80vh',
            overflowY: 'auto',
            width: '90%',
            color: '#f8fafc'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>Student Profile</h2>
              <button onClick={closeProfileModal} style={{ background: 'none', border: 'none', color: '#f8fafc', fontSize: '20px', cursor: 'pointer' }}>×</button>
            </div>

            {profileError ? (
              <p style={{ color: '#f87171' }}>{profileError}</p>
            ) : (
              <div>
                {/* Personal Information */}
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ color: '#38bdf8', marginBottom: '10px' }}>Personal Information</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div><strong>Full Name:</strong> {selectedProfile.fullName || 'N/A'}</div>
                    <div><strong>Email:</strong> {selectedProfile.email || 'N/A'}</div>
                    <div><strong>Phone:</strong> {selectedProfile.phone || 'N/A'}</div>
                    <div><strong>Institution:</strong> {selectedProfile.institution || 'N/A'}</div>
                    <div><strong>Department:</strong> {selectedProfile.department || 'N/A'}</div>
                    <div><strong>CGPA:</strong> {selectedProfile.cgpa || 'N/A'}</div>
                  </div>
                </div>

                {/* Academic Information */}
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ color: '#38bdf8', marginBottom: '10px' }}>Academic Information</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div><strong>10th Marks:</strong> {selectedProfile.tenthMarks || 'N/A'}%</div>
                    <div><strong>12th Marks:</strong> {selectedProfile.twelfthMarks || 'N/A'}%</div>
                  </div>
                </div>

                {/* Skills */}
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ color: '#38bdf8', marginBottom: '10px' }}>Skills</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {selectedProfile.skills && selectedProfile.skills.length > 0 ? (
                      selectedProfile.skills.map((skill, index) => (
                        <span key={index} style={{ background: '#374151', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span>N/A</span>
                    )}
                  </div>
                </div>

                {/* Links */}
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ color: '#38bdf8', marginBottom: '10px' }}>Links</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '5px' }}>
                    {selectedProfile.links ? (
                      Object.entries(selectedProfile.links).map(([key, value]) => (
                        value && (
                          <div key={key}>
                            <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong> 
                            <a href={value} target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', marginLeft: '5px' }}>
                              {value}
                            </a>
                          </div>
                        )
                      ))
                    ) : (
                      <span>N/A</span>
                    )}
                  </div>
                </div>

                {/* Resume */}
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ color: '#38bdf8', marginBottom: '10px' }}>Resume</h3>
                  {selectedProfile.resume ? (
                    <button
                      onClick={() => handleViewResume(selectedProfile.resume.publicId || selectedProfile.resume.fileName)}
                      style={{ background: 'none', border: 'none', color: '#38bdf8', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}
                    >
                      View Resume ({selectedProfile.resume.fileName || 'resume'})
                    </button>
                  ) : (
                    <span>N/A</span>
                  )}
                </div>

                {/* Social & Coding Profiles */}
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ color: '#38bdf8', marginBottom: '10px' }}>Social & Coding Profiles</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '5px' }}>
                    {selectedProfile.links ? (
                      <>
                        {selectedProfile.links.github && (
                          <div>
                            <strong>GitHub:</strong> 
                            <a href={selectedProfile.links.github} target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', marginLeft: '5px' }}>
                              {selectedProfile.links.github}
                            </a>
                          </div>
                        )}
                        {selectedProfile.links.linkedin && (
                          <div>
                            <strong>LinkedIn:</strong> 
                            <a href={selectedProfile.links.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', marginLeft: '5px' }}>
                              {selectedProfile.links.linkedin}
                            </a>
                          </div>
                        )}
                        {selectedProfile.links.portfolio && (
                          <div>
                            <strong>Portfolio:</strong> 
                            <a href={selectedProfile.links.portfolio} target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', marginLeft: '5px' }}>
                              {selectedProfile.links.portfolio}
                            </a>
                          </div>
                        )}
                        {selectedProfile.links.leetcode && (
                          <div>
                            <strong>LeetCode:</strong> 
                            <a href={selectedProfile.links.leetcode} target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', marginLeft: '5px' }}>
                              {selectedProfile.links.leetcode}
                            </a>
                          </div>
                        )}
                        {selectedProfile.links.codechef && (
                          <div>
                            <strong>CodeChef:</strong> 
                            <a href={selectedProfile.links.codechef} target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', marginLeft: '5px' }}>
                              {selectedProfile.links.codechef}
                            </a>
                          </div>
                        )}
                        {selectedProfile.links.hackerrank && (
                          <div>
                            <strong>HackerRank:</strong> 
                            <a href={selectedProfile.links.hackerrank} target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', marginLeft: '5px' }}>
                              {selectedProfile.links.hackerrank}
                            </a>
                          </div>
                        )}
                      </>
                    ) : (
                      <span>N/A</span>
                    )}
                  </div>
                </div>

                {/* Mentor Information */}
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ color: '#38bdf8', marginBottom: '10px' }}>Mentor Information</h3>
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