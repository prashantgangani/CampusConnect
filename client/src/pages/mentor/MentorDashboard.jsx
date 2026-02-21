import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import jobService from '../../services/jobService';
import mentorService from '../../services/mentorService';
import JobCard from '../../components/mentor/JobCard';
import SuggestJobModal from '../../components/mentor/SuggestJobModal';
import './Dashboard.css';

const MentorDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [jobs, setJobs] = useState([]);
  const [students, setStudents] = useState([]);
  const [recentSuggestions, setRecentSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [animatedJobId, setAnimatedJobId] = useState(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [jobsResponse, studentsResponse, suggestionsResponse] = await Promise.all([
        jobService.getAllJobs(),
        mentorService.getStudents(),
        mentorService.getRecentSuggestions()
      ]);

      setJobs(jobsResponse.jobs || []);
      setStudents(studentsResponse.students || []);
      setRecentSuggestions(suggestionsResponse.suggestions || []);
    } catch (error) {
      setError(error?.message || 'Unable to load mentor dashboard right now.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const stats = useMemo(() => {
    const activeJobs = jobs.filter((job) => job.status === 'active').length;
    const suggestionCount = recentSuggestions.length;

    return {
      jobs: jobs.length,
      activeJobs,
      students: students.length,
      suggestions: suggestionCount
    };
  }, [jobs, students, recentSuggestions]);

  const recentSuggestedJobIds = useMemo(
    () => new Set(recentSuggestions.map((suggestion) => suggestion?.job?._id).filter(Boolean)),
    [recentSuggestions]
  );

  const filteredJobs = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return jobs;

    return jobs.filter((job) => {
      const title = job.title?.toLowerCase() || '';
      const company = job.company?.name?.toLowerCase() || '';
      const location = job.location?.toLowerCase() || '';
      return title.includes(normalized) || company.includes(normalized) || location.includes(normalized);
    });
  }, [jobs, searchTerm]);

  const assignedStudents = useMemo(() => {
    if (!user?.institution) return students;
    const sameInstitution = students.filter((student) => student.institution === user.institution);
    return sameInstitution.length ? sameInstitution : students;
  }, [students, user?.institution]);

  const showToast = (type, text) => {
    setToast({ type, text });
  };

  const openSuggestModal = (job) => {
    setSelectedJob(job);
    setSelectedStudentIds([]);
    setModalOpen(true);
  };

  const closeSuggestModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setSelectedJob(null);
    setSelectedStudentIds([]);
  };

  const toggleStudentSelection = (studentId) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleConfirmSuggestion = async () => {
    if (!selectedJob?._id || selectedStudentIds.length === 0) {
      showToast('error', 'Please select at least one student.');
      return;
    }

    try {
      setSubmitting(true);
      const response = await mentorService.suggestJob({
        jobId: selectedJob._id,
        studentIds: selectedStudentIds
      });

      showToast('success', response.message || 'Suggestion sent successfully.');
      setAnimatedJobId(selectedJob._id);
      await loadDashboardData();
      closeSuggestModal();
      setTimeout(() => setAnimatedJobId(null), 1200);
    } catch (error) {
      showToast('error', error?.message || 'Failed to suggest this job.');
    } finally {
      setSubmitting(false);
    }
  };

  const isExpiredJob = (job) => {
    if (job.status === 'expired') return true;
    if (!job.applicationDeadline) return false;
    return new Date(job.applicationDeadline) < new Date();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="mentor-dashboard-root">
      <div className="mentor-dashboard-header">
        <div className="mentor-logo-wrap">
          <span className="mentor-logo-icon">🎓</span>
          <span className="mentor-logo-text">CampusConnect</span>
        </div>

        <div className="mentor-nav-actions">
          <input
            type="text"
            className="mentor-search-input"
            placeholder="Search jobs, company, location..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <button onClick={() => navigate('/mentor/approvals')} className="mentor-logout-btn">
            Requests
          </button>
          <button onClick={handleLogout} className="mentor-logout-btn">Logout</button>
        </div>
      </div>

      <div className="mentor-welcome-section">
        <h1>Welcome back, Mentor! 👋</h1>
        <p>Manage job suggestions and guide your students with top opportunities.</p>
      </div>

      {toast?.text && (
        <div className={`mentor-toast ${toast.type === 'success' ? 'mentor-toast-success' : 'mentor-toast-error'}`}>
          {toast.text}
        </div>
      )}

      {error && <div className="mentor-error-box">{error}</div>}

      <div className="mentor-dashboard-content">
        {loading ? (
          <div className="mentor-loading">Loading mentor dashboard...</div>
        ) : (
          <>
            <div className="mentor-stats-grid">
              <div className="mentor-stat-card">
                <span className="mentor-stat-label">Total Jobs</span>
                <span className="mentor-stat-value">{stats.jobs}</span>
              </div>
              <div className="mentor-stat-card">
                <span className="mentor-stat-label">Active Jobs</span>
                <span className="mentor-stat-value">{stats.activeJobs}</span>
              </div>
              <div className="mentor-stat-card">
                <span className="mentor-stat-label">Total Students</span>
                <span className="mentor-stat-value">{stats.students}</span>
              </div>
              <div className="mentor-stat-card">
                <span className="mentor-stat-label">Total Suggestions</span>
                <span className="mentor-stat-value">{stats.suggestions}</span>
              </div>
            </div>

            <section className="mentor-main-section">
              <div className="mentor-section-head">
                <h2>All Job Posts</h2>
                <span>{filteredJobs.length} shown</span>
              </div>

              {filteredJobs.length === 0 ? (
                <p className="mentor-empty">No jobs found for your current search.</p>
              ) : (
                <div className="mentor-jobs-grid">
                  {filteredJobs.map((job) => (
                    <JobCard
                      key={job._id}
                      job={job}
                      disabled={isExpiredJob(job)}
                      onSuggest={openSuggestModal}
                      isRecentlySuggested={recentSuggestedJobIds.has(job._id)}
                      animate={animatedJobId === job._id}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="mentor-recent-section">
              <h2>Recent Suggestions</h2>
              {recentSuggestions.length === 0 ? (
                <p className="mentor-empty">No recent suggestions yet.</p>
              ) : (
                <div className="mentor-recent-list">
                  {recentSuggestions.map((suggestion) => (
                    <div key={suggestion._id} className="mentor-recent-item">
                      <strong>{suggestion.job?.title || 'Job'}</strong>
                      <span>
                        Suggested to {suggestion.student?.name || 'Student'} ·{' '}
                        {new Date(suggestion.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <SuggestJobModal
        isOpen={modalOpen}
        job={selectedJob}
        students={assignedStudents}
        selectedStudentIds={selectedStudentIds}
        onToggleStudent={toggleStudentSelection}
        onClose={closeSuggestModal}
        onConfirm={handleConfirmSuggestion}
        loading={submitting}
      />
    </div>
  );
};

export default MentorDashboard;
