import React, { useEffect, useMemo, useState } from 'react';

const DEPARTMENTS = ['IT', 'CE', 'EC', 'ME', 'EE', 'Civil', 'Other'];

const PlacementProfileModal = ({ isOpen, onClose, profile, onSave, saving }) => {
  const [form, setForm] = useState({
    name: profile?.name || '',
    email: profile?.email || '',
    department: profile?.department || '',
    college: profile?.college || '',
    institution: profile?.institution || ''
  });

  const canSave = useMemo(() => {
    return Boolean(form.name?.trim() && form.college?.trim());
  }, [form]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!canSave) return;
    onSave({
      name: form.name.trim(),
      department: form.department.trim(),
      college: form.college.trim(),
      institution: form.institution.trim()
    });
  };

  useEffect(() => {
    setForm({
      name: profile?.name || '',
      email: profile?.email || '',
      department: profile?.department || '',
      college: profile?.college || '',
      institution: profile?.institution || ''
    });
  }, [profile]);

  if (!isOpen) return null;

  return (
    <div className="placement-modal-overlay">
      <div className="placement-modal">
        <div className="placement-modal-header">
          <h3>Placement Profile</h3>
          <button type="button" className="placement-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="placement-modal-form">
          <div className="placement-modal-field">
            <label>Name</label>
            <input value={form.name} onChange={handleChange('name')} placeholder="Your full name" />
          </div>

          <div className="placement-modal-field">
            <label>Email (readonly)</label>
            <input value={form.email} readOnly />
          </div>

          <div className="placement-modal-field">
            <label>Department</label>
            <select value={form.department} onChange={handleChange('department')}>
              <option value="">Select department</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div className="placement-modal-field">
            <label>College Name</label>
            <input value={form.college} onChange={handleChange('college')} placeholder="Your college name" />
          </div>

          <div className="placement-modal-field">
            <label>Institution (optional)</label>
            <input value={form.institution} onChange={handleChange('institution')} placeholder="Your institution" />
          </div>

          <div className="placement-modal-actions">
            <button type="button" className="placement-modal-cancel" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="placement-modal-save" disabled={!canSave || saving}>
              {saving ? 'Saving…' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlacementProfileModal;
