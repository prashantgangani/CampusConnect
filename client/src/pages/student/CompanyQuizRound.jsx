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
                return (
                  <div key={item.applicationId || item.jobId} className="application-item">
                    <div className="app-info">
                      <div className="app-icon">🏢</div>
                      <div className="app-details">
                        <h4>{item.jobTitle || 'Company Job'}</h4>
                        <p>{item.quizTitle || 'Company Applicant Quiz'} ({item.status})</p>
                        <p>{item.quizDescription || 'No description.'}</p>
                        <p>Starts: {formatDate(item.startTime)}</p>
                        <p>Ends: {formatDate(item.endTime)}</p>
                        <p>Uploaded: {formatDate(item.uploadedAt)}</p>
                      </div>
                    </div>

                    <div className="app-status">
                      {item.isWithinWindow && !isExpired && !isUpcoming && item.status === 'company_quiz_pending' ? (
                        <button className="apply-btn" onClick={() => handleTakeQuiz(item.applicationId)}>
                          Take Company Quiz →
                        </button>
                      ) : item.status === 'company_quiz_passed' ? (
                        <span className="status-badge status-success">Passed</span>
                      ) : item.status === 'company_quiz_failed' ? (
                        <span className="status-badge status-failure">Failed</span>
                      ) : isExpired ? (
                        <span className="status-badge status-warning">Quiz Expired</span>
                      ) : isUpcoming ? (
                        <span className="status-badge status-info">Not Started Yet</span>
                      ) : (
                        <span className="status-badge">{item.status}</span>
                      )}
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
