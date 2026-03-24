import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import applicationService from '../../services/applicationService';
import './Dashboard.css';

const CompanyQuizRound = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState([]);
  const [error, setError] = useState(null);

  const loadCompanyQuizzes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await applicationService.getStudentCompanyQuizzes();
      if (response?.success) {
        setQuizzes(response.data || []);
      } else {
        setError(response?.message || 'Failed to load company quizzes');
      }
    } catch (err) {
      setError(err.message || 'Failed to load company quizzes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanyQuizzes();
  }, []);

  const formatDate = (value) => {
    if (!value) return 'N/A';
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  const handleTakeQuiz = (applicationId) => {
    if (!applicationId) return;
    navigate(`/student/quiz-notice/${applicationId}`);
  };

  return (
    <div className="student-dashboard">
      <div className="dashboard-header">
        <div className="header-left">
          <div className="logo-section">
            <span className="logo-icon">🎓</span>
            <span className="logo-text"><span className="logo-campus">Campus</span><span className="logo-connect">Connect</span></span>
          </div>
        </div>
        <div className="header-right">
          <button className="profile-btn" onClick={() => navigate('/student/dashboard')}>Back to Dashboard</button>
        </div>
      </div>

      <div className="welcome-section">
        <h1>Company Quiz Round</h1>
        <p>Quizzes posted by companies for you after mentor approval.</p>
      </div>

      <div className="dashboard-main">
        <div className="full-width-section">
          {loading && <p>Loading company quiz assignments...</p>}
          {error && <p className="applicants-error">{error}</p>}

          {!loading && !error && quizzes.length === 0 && (
            <div className="empty-state">
              <p>No company quiz assignments available right now.</p>
            </div>
          )}

          {!loading && !error && quizzes.length > 0 && (
            <div className="applications-list">
              {quizzes.map((item) => {
                const isExpired = item.endTime ? new Date(item.endTime) < new Date() : false;
                const isUpcoming = item.startTime ? new Date(item.startTime) > new Date() : false;
                const getStatusDisplay = () => {
                  if (item.status === 'company_quiz_passed') {
                    return { badge: 'Passed', class: 'status-success', icon: '✅' };
                  } else if (item.status === 'company_quiz_failed') {
                    return { badge: 'Failed', class: 'status-failure', icon: '❌' };
                  } else if (isExpired) {
                    return { badge: 'Quiz Expired', class: 'status-warning', icon: '⏰' };
                  } else if (isUpcoming) {
                    return { badge: 'Not Started Yet', class: 'status-info', icon: '⌛' };
                  } else {
                    return { badge: 'Pending', class: 'status-warning', icon: '⏳' };
                  }
                };
                const statusDisplay = getStatusDisplay();
                return (
                  <div key={item.applicationId || item.jobId} className="application-item" style={{
                    background: '#111827',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '1px solid #1f2937',
                    transition: 'all 0.3s ease'
                  }}>
                    <div className="app-info" style={{ padding: '20px 24px' }}>
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                        <div className="app-icon" style={{ fontSize: '36px', minWidth: '50px', textAlign: 'center' }}>🏢</div>
                        <div className="app-details" style={{ flex: 1 }}>
                          <h4 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '600', color: '#f8fafc' }}>
                            {item.companyName}
                          </h4>
                          <p style={{ margin: '0 0 12px', fontSize: '14px', color: '#cbd5e1', fontWeight: '500' }}>
                            {item.jobTitle}
                          </p>
                          <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#94a3b8', lineHeight: '1.5' }}>
                            {item.quizDescription || 'Hello student, please take this quiz to move forward in the selection process.'}
                          </p>
                          <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '16px',
                            fontSize: '13px',
                            color: '#cbd5e1',
                            marginTop: '12px',
                            paddingTop: '12px',
                            borderTop: '1px solid #1f2937'
                          }}>
                            <div>
                              <span style={{ color: '#60a5fa', fontWeight: '600' }}>📅 Starts: </span>
                              {item.startTime ? new Date(item.startTime).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : 'N/A'}
                            </div>
                            <div>
                              <span style={{ color: '#60a5fa', fontWeight: '600' }}>⏱️ Ends: </span>
                              {item.endTime ? new Date(item.endTime).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : 'N/A'}
                            </div>
                            <div>
                              <span style={{ color: '#60a5fa', fontWeight: '600' }}>📤 Uploaded: </span>
                              {item.uploadedAt ? new Date(item.uploadedAt).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric'
                              }) : 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="app-status" style={{
                      padding: '16px 24px',
                      background: '#1f2937',
                      borderTop: '1px solid #1f2937',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <span className={`status-badge ${statusDisplay.class}`} style={{ fontSize: '14px' }}>
                        {statusDisplay.icon} {statusDisplay.badge}
                      </span>
                      {item.isWithinWindow && !isExpired && !isUpcoming && item.status === 'company_quiz_pending' ? (
                        <button className="apply-btn" onClick={() => handleTakeQuiz(item.applicationId)}>
                          Take Company Quiz →
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyQuizRound;
