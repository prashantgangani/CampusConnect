const SuggestJobModal = ({
  isOpen,
  job,
  students,
  selectedStudentIds,
  onToggleStudent,
  onClose,
  onConfirm,
  loading
}) => {
  if (!isOpen || !job) return null;

  const toggleSelectAll = () => {
    if (selectedStudentIds.length === students.length) {
      students.forEach((student) => onToggleStudent(student._id));
    } else {
      students.forEach((student) => {
        if (!selectedStudentIds.includes(student._id)) {
          onToggleStudent(student._id);
        }
      });
    }
  };

  const allSelected = students.length > 0 && selectedStudentIds.length === students.length;

  return (
    <div className="mentor-modal-overlay" onClick={onClose}>
      <div className="mentor-modal" onClick={(event) => event.stopPropagation()}>
        <h3>Suggest Job</h3>
        <p className="mentor-modal-job">{job.title}</p>

        <label>Select Students ({selectedStudentIds.length} selected)</label>

        {students.length === 0 ? (
          <p className="mentor-modal-empty">No verified students available. Students must request and be verified first.</p>
        ) : (
          <>
            <div className="mentor-modal-select-all">
              <label>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                />
                <span>Select All</span>
              </label>
            </div>

            <div className="mentor-modal-student-list">
              {students.map((student) => (
                <label key={student._id} className="mentor-modal-student-item">
                  <input
                    type="checkbox"
                    checked={selectedStudentIds.includes(student._id)}
                    onChange={() => onToggleStudent(student._id)}
                  />
                  <span className="mentor-modal-student-name">
                    {student.name}
                  </span>
                  <span className="mentor-modal-student-email">{student.email}</span>
                </label>
              ))}
            </div>
          </>
        )}

        <div className="mentor-modal-actions">
          <button type="button" className="mentor-modal-cancel" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            type="button"
            className="mentor-modal-confirm"
            onClick={onConfirm}
            disabled={loading || selectedStudentIds.length === 0}
          >
            {loading ? 'Suggesting...' : `Suggest to ${selectedStudentIds.length} Student(s)`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuggestJobModal;
