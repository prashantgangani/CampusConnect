const formatDate = (value) => {
  if (!value) return 'No deadline';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'No deadline';
  return parsed.toLocaleDateString();
};

const getStatusClass = (status) => {
  if (status === 'active') return 'mentor-status mentor-status-active';
  if (status === 'expired') return 'mentor-status mentor-status-expired';
  return 'mentor-status mentor-status-pending';
};

const JobCard = ({
  job,
  onSuggest,
  disabled,
  isRecentlySuggested,
  animate
}) => {
  const deadlinePassed = job?.applicationDeadline && new Date(job.applicationDeadline) < new Date();

  return (
    <div
      className={`mentor-job-card bg-[#0f172a] border border-slate-700 hover:shadow-xl rounded-xl transition-all ${
        isRecentlySuggested ? 'mentor-job-card-recent' : ''
      } ${animate ? 'mentor-card-animate' : ''}`}
    >
      <div className="mentor-job-card-top">
        <span className="mentor-company-name">{job.company?.name || 'Company'}</span>
        <span className={getStatusClass(job.status)}>{job.status || 'pending'}</span>
      </div>

      <h3 className="mentor-job-title">{job.title}</h3>

      <div className="mentor-job-meta">
        <p><strong>Location:</strong> {job.location || 'Not specified'}</p>
        <p><strong>Deadline:</strong> {formatDate(job.applicationDeadline)}</p>
      </div>

      {deadlinePassed && <p className="mentor-job-warning">This job deadline has passed.</p>}

      <button
        type="button"
        className="mentor-suggest-btn"
        onClick={() => onSuggest(job)}
        disabled={disabled}
      >
        Suggest to Student ⭐
      </button>
    </div>
  );
};

export default JobCard;
