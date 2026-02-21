import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './StudentProfile.css';

const StudentProfile = () => {
  const navigate = useNavigate();
  const resumeInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [mentorEmail, setMentorEmail] = useState('');
  const [mentorSearchResults, setMentorSearchResults] = useState([]);
  const [showMentorDropdown, setShowMentorDropdown] = useState(false);
  const [searchingMentors, setSearchingMentors] = useState(false);
  const [requestingMentor, setRequestingMentor] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phone: '',
    institution: '',
    department: '',
    cgpa: '',
    tenthMarks: '',
    twelfthMarks: '',
    skills: [],
    mentor: null,
    mentorRequested: null,
    mentorRequestStatus: 'none',
    links: {
      linkedin: '',
      github: '',
      portfolio: '',
      leetcode: '',
      codechef: '',
      codeforces: '',
      hackerrank: '',
      other: ''
    }
  });
  
  const [newSkill, setNewSkill] = useState('');
  const [resumePreview, setResumePreview] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');

    if (action === 'edit') {
      setIsEditing(true);
    }

    if (action === 'upload') {
      setTimeout(() => {
        resumeInputRef.current?.click();
      }, 200);
    }

    if (action === 'skills') {
      setTimeout(() => {
        const skillInput = document.querySelector('.quick-skill-input');
        skillInput?.focus();
      }, 200);
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/student/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const data = response.data.data;
        setProfileData({
          ...data,
          links: {
            linkedin: '',
            github: '',
            portfolio: '',
            leetcode: '',
            codechef: '',
            codeforces: '',
            hackerrank: '',
            other: '',
            ...(data.links || {})
          }
        });
        if (response.data.data.resume) {
          setResumePreview(response.data.data.resume);
        }
      }
    } catch (error) {
      if (error.response?.status === 404) {
        // Profile doesn't exist yet, that's ok
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setProfileData(prev => ({
          ...prev,
          fullName: user.name || '',
          email: user.email || '',
          institution: user.institution || ''
        }));
      } else {
        console.error('Error fetching profile:', error);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('links.')) {
      const linkName = name.split('.')[1];
      setProfileData(prev => ({
        ...prev,
        links: {
          ...prev.links,
          [linkName]: value
        }
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const persistProfile = async (overrides = {}) => {
    const token = localStorage.getItem('token');
    const payload = {
      ...profileData,
      ...overrides,
      resume: overrides.resume !== undefined ? overrides.resume : resumePreview
    };

    const response = await axios.put('http://localhost:5000/api/student/profile', payload, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data.success) {
      const saved = response.data.data;
      setProfileData(prev => ({
        ...prev,
        ...saved,
        links: {
          linkedin: '',
          github: '',
          portfolio: '',
          leetcode: '',
          codechef: '',
          codeforces: '',
          hackerrank: '',
          other: '',
          ...(saved.links || {})
        }
      }));

      if (saved.resume) {
        setResumePreview(saved.resume);
      }
    }

    return response;
  };

  const handleAddSkill = async () => {
    const skill = newSkill.trim();
    if (!skill || profileData.skills.includes(skill)) return;

    const updatedSkills = [...profileData.skills, skill];
    setProfileData(prev => ({ ...prev, skills: updatedSkills }));
    setNewSkill('');

    try {
      await persistProfile({ skills: updatedSkills });
      setMessage({ text: 'Skill added successfully', type: 'success' });
    } catch (error) {
      console.error('Error adding skill:', error);
      setMessage({ text: 'Failed to add skill', type: 'error' });
      setProfileData(prev => ({
        ...prev,
        skills: prev.skills.filter((s) => s !== skill)
      }));
    }
  };

  const handleRemoveSkill = async (skillToRemove) => {
    const updatedSkills = profileData.skills.filter((skill) => skill !== skillToRemove);
    setProfileData(prev => ({ ...prev, skills: updatedSkills }));

    try {
      await persistProfile({ skills: updatedSkills });
      setMessage({ text: 'Skill removed successfully', type: 'success' });
    } catch (error) {
      console.error('Error removing skill:', error);
      setMessage({ text: 'Failed to remove skill', type: 'error' });
      setProfileData(prev => ({
        ...prev,
        skills: [...prev.skills, skillToRemove]
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setMessage({ text: 'Please upload PDF or Word document only', type: 'error' });
        return;
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ text: 'File size should be less than 5MB', type: 'error' });
        return;
      }
      
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const nextResume = {
          fileName: file.name,
          fileType: file.type,
          fileData: reader.result,
          uploadedAt: new Date().toISOString()
        };
        setResumePreview(nextResume);

        try {
          await persistProfile({ resume: nextResume });
          setMessage({ text: 'Resume uploaded successfully', type: 'success' });
        } catch (error) {
          console.error('Error uploading resume:', error);
          setMessage({ text: 'Failed to upload resume', type: 'error' });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await persistProfile();

      if (response.data.success) {
        setMessage({ text: 'Profile updated successfully!', type: 'success' });
        setProfileData(response.data.data);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ 
        text: error.response?.data?.message || 'Failed to update profile', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResume = async () => {
    if (!window.confirm('Are you sure you want to delete your resume?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete('http://localhost:5000/api/student/profile/resume', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setResumePreview(null);
      await persistProfile({ resume: null });
      setMessage({ text: 'Resume deleted successfully', type: 'success' });
    } catch (error) {
      console.error('Error deleting resume:', error);
      setMessage({ text: 'Failed to delete resume', type: 'error' });
    }
  };

  const handleViewResume = () => {
    if (!resumePreview?.fileData) return;
    window.open(resumePreview.fileData, '_blank', 'noopener,noreferrer');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleRequestMentor = async () => {
    const email = mentorEmail.trim();
    if (!email) {
      setMessage({ text: 'Mentor email is required', type: 'error' });
      return;
    }

    try {
      setRequestingMentor(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/student/request-mentor',
        { mentorEmail: email },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setMessage({ text: response.data.message || 'Mentor request sent!', type: 'success' });
        setProfileData(prev => ({ ...prev, ...response.data.data }));
        setMentorEmail('');
        setMentorSearchResults([]);
        setShowMentorDropdown(false);
      }
    } catch (error) {
      console.error('Error requesting mentor:', error);
      setMessage({
        text: error.response?.data?.message || 'Failed to request mentor',
        type: 'error'
      });
    } finally {
      setRequestingMentor(false);
    }
  };

  const handleMentorSearch = async (query) => {
    setMentorEmail(query);

    if (query.length < 3) {
      setMentorSearchResults([]);
      setShowMentorDropdown(false);
      return;
    }

    try {
      setSearchingMentors(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/student/search-mentors?q=${encodeURIComponent(query)}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setMentorSearchResults(response.data.mentors || []);
        setShowMentorDropdown(true);
      }
    } catch (error) {
      console.error('Error searching mentors:', error);
      setMentorSearchResults([]);
    } finally {
      setSearchingMentors(false);
    }
  };

  const handleSelectMentor = (mentor) => {
    setMentorEmail(mentor.email);
    setShowMentorDropdown(false);
    setMentorSearchResults([]);
  };

  const renderMentorStatus = () => {
    const status = profileData.mentorRequestStatus || 'none';

    if (status === 'verified' && profileData.mentor) {
      return (
        <div className="mentor-box mentor-verified">
          <p className="mentor-label">✅ Assigned Mentor</p>
          <p className="mentor-value-success">
            {profileData.mentor.name || 'Mentor'} ({profileData.mentor.email || ''})
          </p>
        </div>
      );
    }

    if (status === 'pending' && profileData.mentorRequested) {
      return (
        <div className="mentor-box mentor-pending">
          <p className="mentor-label">⏳ Request Pending</p>
          <p className="mentor-value-warning">
            Waiting for {profileData.mentorRequested.name || profileData.mentorRequested.email || 'mentor'} to verify
          </p>
          <button
            type="button"
            className="mentor-refresh-btn"
            onClick={fetchProfile}
            title="Refresh status"
          >
            🔄 Refresh
          </button>
        </div>
      );
    }

    if (status === 'rejected') {
      return (
        <div className="mentor-box mentor-rejected">
          <p className="mentor-label">❌ Request Rejected</p>
          <p className="mentor-value-error">Request another mentor below</p>
        </div>
      );
    }

    return (
      <div className="mentor-box">
        <p className="mentor-label">⚙ Assigned Mentor</p>
        <p className="mentor-value">⦿ No mentor selected — required!</p>
      </div>
    );
  };

  const canRequestMentor = !profileData.mentor && profileData.mentorRequestStatus !== 'pending';

  const profileCompletion = profileData.profileCompletion || 0;

  return (
    <div className="student-profile-container">
      <header className="profile-topbar">
        <div className="brand">
          <span className="brand-icon">🎓</span>
          <span className="brand-campus">Campus</span><span className="brand-connect">Connect</span>
        </div>
        <div className="topbar-actions">
          <button className="top-btn" onClick={() => navigate('/student/dashboard')}>Dashboard</button>
          <button className="top-btn logout" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <div className="profile-content-wrap">
        <h1 className="page-title">My Profile</h1>

        <input
          ref={resumeInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {message.text && (
          <div className={`profile-message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="profile-summary-grid">
          <div className="summary-card profile-main-card">
            <div className="profile-avatar">👤</div>
            <h3 className="profile-name">{profileData.fullName || user.name || 'Student Name'}</h3>
            <p className="profile-meta">{profileData.department || 'No department'}</p>
            <p className="profile-meta muted">{profileData.institution || user.institution || 'charusat'}</p>

            {renderMentorStatus()}

            {canRequestMentor && (
              <div className="mentor-request-box">
                <div className="mentor-search-wrapper">
                  <input
                    type="text"
                    className="mentor-email-input"
                    value={mentorEmail}
                    onChange={(e) => handleMentorSearch(e.target.value)}
                    onFocus={() => mentorSearchResults.length > 0 && setShowMentorDropdown(true)}
                    placeholder="Type mentor email (min 3 chars)"
                    disabled={requestingMentor}
                  />
                  {searchingMentors && <div className="mentor-search-loading">Searching...</div>}
                  {showMentorDropdown && mentorSearchResults.length > 0 && (
                    <div className="mentor-dropdown">
                      {mentorSearchResults.map((mentor) => (
                        <div
                          key={mentor._id}
                          className="mentor-dropdown-item"
                          onClick={() => handleSelectMentor(mentor)}
                        >
                          <div className="mentor-dropdown-name">{mentor.name}</div>
                          <div className="mentor-dropdown-email">{mentor.email}</div>
                          {mentor.institution && (
                            <div className="mentor-dropdown-institution">{mentor.institution}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="mentor-request-btn"
                  onClick={handleRequestMentor}
                  disabled={requestingMentor || mentorEmail.length < 3}
                >
                  {requestingMentor ? 'Requesting...' : 'Request Mentor'}
                </button>
              </div>
            )}

            <p className="profile-email">✉ {profileData.email || user.email || 'No email'}</p>

            <div className="profile-progress-row">
              <span>Profile</span>
              <span>{profileCompletion}%</span>
            </div>
            <div className="profile-progress-bar">
              <div className="profile-progress-fill" style={{ width: `${profileCompletion}%` }}></div>
            </div>

            <button className="primary-btn" onClick={() => setIsEditing(true)}>
              Edit Profile
            </button>
          </div>

          <div className="summary-right-column">
            <div className="summary-card">
              <h3 className="card-title">Skills</h3>
              <div className="quick-skill-row">
                <input
                  type="text"
                  className="quick-skill-input"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                  placeholder="Add skill quickly"
                />
                <button type="button" className="quick-skill-btn" onClick={handleAddSkill}>Add</button>
              </div>
              {profileData.skills && profileData.skills.length > 0 ? (
                <div className="skills-chip-list">
                  {profileData.skills.map((skill, index) => (
                    <span key={index} className="skill-chip">{skill}</span>
                  ))}
                </div>
              ) : (
                <p className="empty-note">No skills added yet. Edit your profile to add skills.</p>
              )}
            </div>

            <div className="summary-card">
              <h3 className="card-title">📄 Resume / CV</h3>
              {resumePreview ? (
                <div className="resume-row">
                  <div>
                    <p className="resume-name">{resumePreview.fileName || 'Resume uploaded'}</p>
                    <p className="resume-sub">{resumePreview.fileType?.includes('pdf') ? 'PDF' : 'DOC / DOCX'}</p>
                  </div>
                  <div className="resume-actions">
                    <button type="button" className="mini-btn" onClick={handleViewResume}>View</button>
                    <button type="button" className="mini-btn danger" onClick={handleDeleteResume}>Delete</button>
                  </div>
                </div>
              ) : (
                <div className="resume-empty-box">
                  <div className="resume-upload-icon">⇪</div>
                  <p className="resume-empty-title">No resume uploaded yet</p>
                  <p className="resume-empty-sub">PDF or DOC, max 5MB</p>
                </div>
              )}

              <button className="primary-btn full" onClick={() => resumeInputRef.current?.click()}>
                {resumePreview ? 'Replace Resume' : 'Upload Resume'}
              </button>
            </div>
          </div>
        </div>

        {isEditing && (
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-section">
              <h2 className="section-title">Personal Information</h2>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="fullName">Full Name *</label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={profileData.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleInputChange}
                    placeholder="+91 9876543210"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="institution">College / Institution</label>
                  <input
                    type="text"
                    id="institution"
                    name="institution"
                    value={profileData.institution}
                    onChange={handleInputChange}
                    placeholder="Enter your college name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="department">Department</label>
                  <input
                    type="text"
                    id="department"
                    name="department"
                    value={profileData.department}
                    onChange={handleInputChange}
                    placeholder="e.g., Computer Science"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h2 className="section-title">Academic Information</h2>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="cgpa">CGPA / SGPA</label>
                  <input
                    type="number"
                    id="cgpa"
                    name="cgpa"
                    value={profileData.cgpa || ''}
                    onChange={handleInputChange}
                    placeholder="8.5"
                    step="0.01"
                    min="0"
                    max="10"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="tenthMarks">10th Marks (%)</label>
                  <input
                    type="number"
                    id="tenthMarks"
                    name="tenthMarks"
                    value={profileData.tenthMarks || ''}
                    onChange={handleInputChange}
                    placeholder="85"
                    step="0.01"
                    min="0"
                    max="100"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="twelfthMarks">12th Marks (%)</label>
                  <input
                    type="number"
                    id="twelfthMarks"
                    name="twelfthMarks"
                    value={profileData.twelfthMarks || ''}
                    onChange={handleInputChange}
                    placeholder="90"
                    step="0.01"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h2 className="section-title">Skills</h2>
              <div className="skills-input-container">
                <input
                  type="text"
                  className="skill-input"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                  placeholder="Add a skill (e.g., React, Python)"
                />
                <button type="button" onClick={handleAddSkill} className="btn-add-skill">
                  + Add
                </button>
              </div>
              <div className="skills-list">
                {profileData.skills && profileData.skills.map((skill, index) => (
                  <div key={index} className="skill-tag">
                    {skill}
                    <button type="button" onClick={() => handleRemoveSkill(skill)} className="btn-remove-skill">
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-section">
              <h2 className="section-title">Social & Coding Profiles</h2>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="linkedin">LinkedIn</label>
                  <input
                    type="url"
                    id="linkedin"
                    name="links.linkedin"
                    value={profileData.links.linkedin}
                    onChange={handleInputChange}
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="github">GitHub</label>
                  <input
                    type="url"
                    id="github"
                    name="links.github"
                    value={profileData.links.github}
                    onChange={handleInputChange}
                    placeholder="https://github.com/yourusername"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="portfolio">Portfolio</label>
                  <input
                    type="url"
                    id="portfolio"
                    name="links.portfolio"
                    value={profileData.links.portfolio}
                    onChange={handleInputChange}
                    placeholder="https://yourportfolio.com"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="leetcode">LeetCode</label>
                  <input
                    type="url"
                    id="leetcode"
                    name="links.leetcode"
                    value={profileData.links.leetcode}
                    onChange={handleInputChange}
                    placeholder="https://leetcode.com/username"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="codechef">CodeChef</label>
                  <input
                    type="url"
                    id="codechef"
                    name="links.codechef"
                    value={profileData.links.codechef}
                    onChange={handleInputChange}
                    placeholder="https://codechef.com/users/username"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="codeforces">Codeforces</label>
                  <input
                    type="url"
                    id="codeforces"
                    name="links.codeforces"
                    value={profileData.links.codeforces}
                    onChange={handleInputChange}
                    placeholder="https://codeforces.com/profile/username"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="hackerrank">HackerRank</label>
                  <input
                    type="url"
                    id="hackerrank"
                    name="links.hackerrank"
                    value={profileData.links.hackerrank}
                    onChange={handleInputChange}
                    placeholder="https://hackerrank.com/username"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="other">Other Link</label>
                  <input
                    type="url"
                    id="other"
                    name="links.other"
                    value={profileData.links.other}
                    onChange={handleInputChange}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => setIsEditing(false)} className="btn-cancel">
                Cancel
              </button>
              <button type="submit" className="btn-save" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default StudentProfile;
