import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import mentorService from '../../services/mentorService';
import './MentorProfile.css';

const MentorProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [placementEmail, setPlacementEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [placementResults, setPlacementResults] = useState([]);
  const [showPlacementDropdown, setShowPlacementDropdown] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await mentorService.getProfile();
      setProfile(response.profile || null);
    } catch (error) {
      setMessage({
        text: error?.message || 'Failed to load mentor profile',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSearchPlacementCells = async (value) => {
    const query = value.trim();
    if (query.length < 3) {
      setPlacementResults([]);
      setShowPlacementDropdown(false);
      return;
    }

    try {
      setSearching(true);
      const response = await mentorService.searchPlacementCells(query);
      setPlacementResults(response.placementCells || []);
      setShowPlacementDropdown(true);
    } catch {
      setPlacementResults([]);
      setShowPlacementDropdown(false);
    } finally {
      setSearching(false);
    }
  };

  const handleAssignPlacementCell = async () => {
    const email = placementEmail.trim();

    if (!email) {
      setMessage({ text: 'Please enter placement cell email', type: 'error' });
      return;
    }

    try {
      setAssigning(true);
      const response = await mentorService.assignPlacementCell(email);
      setProfile(response.profile || null);
      setMessage({
        text: response.message || 'Placement cell selected successfully',
        type: 'success'
      });
      setPlacementEmail('');
      setPlacementResults([]);
      setShowPlacementDropdown(false);
    } catch (error) {
      setMessage({
        text: error?.message || 'Failed to assign placement cell',
        type: 'error'
      });
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="mentor-profile-root">
        <div className="mentor-profile-shell">
          <p className="mentor-profile-loading">Loading mentor profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mentor-profile-root">
      <header className="mentor-profile-topbar">
        <div className="mentor-profile-brand">
          <span className="mentor-profile-brand-icon">🎓</span>
          <span className="mentor-profile-brand-text">
            <span className="mentor-profile-campus">Campus</span>
            <span className="mentor-profile-connect">Connect</span>
          </span>
        </div>
        <button type="button" className="mentor-profile-back" onClick={() => navigate('/mentor/dashboard')}>
          Back to Dashboard
        </button>
      </header>

      <div className="mentor-profile-shell">
        <div className="mentor-profile-title-row">
          <h1>Mentor Profile</h1>
          <p>View your registered details and map your placement cell.</p>
        </div>

        {message.text && (
          <div className={`mentor-profile-message ${message.type}`}>
            {message.text}
          </div>
        )}

        <section className="mentor-profile-card">
          <h2>Your Details</h2>
          <div className="mentor-profile-grid">
            <div className="mentor-profile-item">
              <span>Name</span>
              <strong>{profile?.name || '-'}</strong>
            </div>
            <div className="mentor-profile-item">
              <span>Email</span>
              <strong>{profile?.email || '-'}</strong>
            </div>
            <div className="mentor-profile-item">
              <span>Role</span>
              <strong>{profile?.role || 'mentor'}</strong>
            </div>
            <div className="mentor-profile-item">
              <span>Institution</span>
              <strong>{profile?.institution || '-'}</strong>
            </div>
            <div className="mentor-profile-item">
              <span>Department</span>
              <strong>{profile?.department || '-'}</strong>
            </div>
            <div className="mentor-profile-item">
              <span>College</span>
              <strong>{profile?.college || '-'}</strong>
            </div>
          </div>
        </section>

        <section className="mentor-profile-card mentor-profile-assignment">
          <h2>Placement Cell Selection</h2>
          <p>Select placement cell by registered Gmail ID.</p>

          {profile?.placementCell ? (
            <div className="mentor-profile-assigned-box">
              <h3>Currently Selected Placement Cell</h3>
              <p><strong>Name:</strong> {profile.placementCell.name || '-'}</p>
              <p><strong>Email:</strong> {profile.placementCell.email || profile.placementCellEmail || '-'}</p>
              <p><strong>Institution:</strong> {profile.placementCell.institution || '-'}</p>
            </div>
          ) : (
            <div className="mentor-profile-assigned-box empty">
              No placement cell selected yet.
            </div>
          )}

          <div className="mentor-profile-select-row">
            <input
              type="email"
              value={placementEmail}
              onChange={(event) => {
                const value = event.target.value;
                setPlacementEmail(value);
                handleSearchPlacementCells(value);
              }}
              placeholder="Enter placement cell registered Gmail"
            />
            <button
              type="button"
              onClick={handleAssignPlacementCell}
              disabled={assigning}
            >
              {assigning ? 'Saving...' : 'Select Placement Cell'}
            </button>
          </div>

          {searching && <p className="mentor-search-note">Searching...</p>}

          {showPlacementDropdown && placementResults.length > 0 && (
            <div className="mentor-placement-dropdown">
              {placementResults.map((placementCell) => (
                <button
                  key={placementCell._id}
                  type="button"
                  className="mentor-placement-option"
                  onClick={() => {
                    setPlacementEmail(placementCell.email || '');
                    setShowPlacementDropdown(false);
                  }}
                >
                  <span>{placementCell.name}</span>
                  <small>{placementCell.email}</small>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default MentorProfile;
