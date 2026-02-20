const SuggestJobModal = ({
  isOpen,
  job,
  students,
  selectedStudentId,
  onSelectStudent,
  onClose,
  onConfirm,
  loading
}) => {
  if (!isOpen || !job) return null;

  return (
    <div className="mentor-modal-overlay" onClick={onClose}>
      <div className="mentor-modal" onClick={(event) => event.stopPropagation()}>
        <h3>Suggest Job</h3>
        <p className="mentor-modal-job">{job.title}</p>

        <label htmlFor="student-select">Select Student</label>
        <select
          id="student-select"
          className="mentor-modal-select"
          value={selectedStudentId}
          onChange={(event) => onSelectStudent(event.target.value)}
        >
          <option value="">Choose a student</option>
          {students.map((student) => (
            <option key={student._id} value={student._id}>
              {student.name} ({student.email})
            </option>
          ))}
        </select>

        <div className="mentor-modal-actions">
          <button type="button" className="mentor-modal-cancel" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="button" className="mentor-modal-confirm" onClick={onConfirm} disabled={loading}>
            {loading ? 'Suggesting...' : 'Confirm Suggestion'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuggestJobModal;
