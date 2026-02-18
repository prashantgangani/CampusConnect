import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './StudentProfile.css';

const StudentProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [profileData, setProfileData] = useState({
    fullName: '',
    phone: '',
    institution: '',
    department: '',
    cgpa: '',
    tenthMarks: '',
    twelfthMarks: '',
    skills: [],
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
  const [resumeFile, setResumeFile] = useState(null);
  const [resumePreview, setResumePreview] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/student/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setProfileData(response.data.data);
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

  const handleAddSkill = () => {
    if (newSkill.trim() && !profileData.skills.includes(newSkill.trim())) {
      setProfileData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setProfileData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
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
      
      setResumeFile(file);
      
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setResumePreview({
          fileName: file.name,
          fileType: file.type,
          fileData: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const token = localStorage.getItem('token');
      const dataToSend = {
        ...profileData,
        resume: resumePreview
      };

      const response = await axios.put(
        'http://localhost:5000/api/student/profile',
        dataToSend,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setMessage({ text: 'Profile updated successfully!', type: 'success' });
        setProfileData(response.data.data);
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
      
      setResumeFile(null);
      setResumePreview(null);
      setMessage({ text: 'Resume deleted successfully', type: 'success' });
    } catch (error) {
      console.error('Error deleting resume:', error);
      setMessage({ text: 'Failed to delete resume', type: 'error' });
    }
  };

  return (
    <div className="student-profile-container">
      <div className="profile-header">
        <button className="back-btn" onClick={() => navigate('/student/dashboard')}>
          ← Back to Dashboard
        </button>
        <h1>Edit Profile</h1>
        <p className="profile-subtitle">Complete your profile to increase visibility to recruiters</p>
      </div>

      {message.text && (
        <div className={`profile-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="profile-form">
        {/* Personal Information Section */}
        <div className="form-section">
          <h2 className="section-title">👤 Personal Information</h2>
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

        {/* Academic Information Section */}
        <div className="form-section">
          <h2 className="section-title">🎓 Academic Information</h2>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="cgpa">CGPA / SGPA</label>
              <input
                type="number"
                id="cgpa"
                name="cgpa"
                value={profileData.cgpa}
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
                value={profileData.tenthMarks}
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
                value={profileData.twelfthMarks}
                onChange={handleInputChange}
                placeholder="90"
                step="0.01"
                min="0"
                max="100"
              />
            </div>
          </div>
        </div>

        {/* Resume Upload Section */}
        <div className="form-section">
          <h2 className="section-title">📄 Resume</h2>
          <div className="resume-upload-area">
            {resumePreview ? (
              <div className="resume-preview">
                <div className="resume-info">
                  <span className="file-icon">📎</span>
                  <div className="file-details">
                    <p className="file-name">{resumePreview.fileName}</p>
                    <p className="file-meta">
                      {resumePreview.uploadedAt && 
                        `Uploaded on ${new Date(resumePreview.uploadedAt).toLocaleDateString()}`
                      }
                    </p>
                  </div>
                </div>
                <div className="resume-actions">
                  <label htmlFor="resume-upload" className="btn-change-resume">
                    Change
                  </label>
                  <button type="button" onClick={handleDeleteResume} className="btn-delete-resume">
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <label htmlFor="resume-upload" className="upload-label">
                <div className="upload-icon">📤</div>
                <p className="upload-text">Click to upload resume</p>
                <p className="upload-hint">PDF or Word document (Max 5MB)</p>
              </label>
            )}
            <input
              type="file"
              id="resume-upload"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        {/* Skills Section */}
        <div className="form-section">
          <h2 className="section-title">💡 Skills</h2>
          <div className="skills-input-container">
            <input
              type="text"
              className="skill-input"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
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

        {/* Social Links Section */}
        <div className="form-section">
          <h2 className="section-title">🔗 Social & Coding Profiles</h2>
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
              <label htmlFor="portfolio">Portfolio Website</label>
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
                placeholder="https://leetcode.com/yourusername"
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
                placeholder="https://codechef.com/users/yourusername"
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
                placeholder="https://codeforces.com/profile/yourusername"
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
                placeholder="https://hackerrank.com/yourusername"
              />
            </div>
            <div className="form-group">
              <label htmlFor="other">Other Coding Platform</label>
              <input
                type="url"
                id="other"
                name="links.other"
                value={profileData.links.other}
                onChange={handleInputChange}
                placeholder="Any other coding platform URL"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="form-actions">
          <button type="button" onClick={() => navigate('/student/dashboard')} className="btn-cancel">
            Cancel
          </button>
          <button type="submit" className="btn-save" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StudentProfile;
