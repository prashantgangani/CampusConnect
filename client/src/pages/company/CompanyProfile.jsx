import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../student/Dashboard.css';

const CompanyProfile = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [profile, setProfile] = useState({
    companyName: '',
    email: '',
    phone: '',
    website: '',
    description: '',
    location: '',
    industry: '',
    employees: ''
  });

  useEffect(() => {
    // Initialize with user data from localStorage
    if (user.email) {
      setProfile(prev => ({
        ...prev,
        email: user.email,
        companyName: user.companyName || ''
      }));
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    try {
      console.log('Saving profile:', profile);
      // API call would go here
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Failed to save profile');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="student-dashboard">
      <div className="dashboard-header">
        <div className="header-left">
          <div className="logo-section">
            <span className="logo-icon">🏢</span>
            <span className="logo-text">
              <span className="logo-campus">Campus</span>
              <span className="logo-connect">Connect</span>
            </span>
          </div>
        </div>

        <div className="header-right">
          <div className="notification-bell">🔔</div>
          <div className="user-menu">
            <span className="user-name">{user.companyName || 'Company'}</span>
            <button className="btn-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-main">
        <div className="profile-container">
          <div className="profile-header">
            <h1>Company Profile</h1>
            <p>Manage your company information</p>
          </div>

          <form className="profile-form">
            <div className="form-section">
              <h2>Basic Information</h2>
              
              <div className="form-group">
                <label htmlFor="companyName">Company Name</label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  value={profile.companyName}
                  onChange={handleInputChange}
                  placeholder="Enter company name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={profile.email}
                  onChange={handleInputChange}
                  placeholder="Enter email"
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={profile.phone}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="form-group">
                <label htmlFor="website">Website</label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={profile.website}
                  onChange={handleInputChange}
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <div className="form-section">
              <h2>Company Details</h2>

              <div className="form-group">
                <label htmlFor="location">Location</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={profile.location}
                  onChange={handleInputChange}
                  placeholder="Enter city or address"
                />
              </div>

              <div className="form-group">
                <label htmlFor="industry">Industry</label>
                <select
                  id="industry"
                  name="industry"
                  value={profile.industry}
                  onChange={handleInputChange}
                >
                  <option value="">Select Industry</option>
                  <option value="technology">Technology</option>
                  <option value="finance">Finance</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="retail">Retail</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="employees">Number of Employees</label>
                <select
                  id="employees"
                  name="employees"
                  value={profile.employees}
                  onChange={handleInputChange}
                >
                  <option value="">Select Range</option>
                  <option value="1-50">1-50</option>
                  <option value="51-200">51-200</option>
                  <option value="201-500">201-500</option>
                  <option value="501-1000">501-1000</option>
                  <option value="1000+">1000+</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="description">About Company</label>
                <textarea
                  id="description"
                  name="description"
                  value={profile.description}
                  onChange={handleInputChange}
                  placeholder="Tell us about your company"
                  rows="5"
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-save"
                onClick={handleSaveProfile}
              >
                Save Changes
              </button>
              <button
                type="button"
                className="btn-cancel"
                onClick={() => navigate('/company/dashboard')}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        .profile-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 40px 20px;
        }

        .profile-header {
          margin-bottom: 40px;
          border-bottom: 2px solid #1e293b;
          padding-bottom: 20px;
        }

        .profile-header h1 {
          color: white;
          font-size: 32px;
          margin-bottom: 8px;
        }

        .profile-header p {
          color: #cbd5e1;
          font-size: 16px;
        }

        .profile-form {
          background: #1e293b;
          border-radius: 12px;
          padding: 30px;
        }

        .form-section {
          margin-bottom: 30px;
        }

        .form-section h2 {
          color: white;
          font-size: 18px;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 1px solid #334155;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          color: #e2e8f0;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #334155;
          border-radius: 6px;
          background: #0f172a;
          color: white;
          font-size: 14px;
          font-family: inherit;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #14b8a6;
          box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
        }

        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #334155;
        }

        .btn-save,
        .btn-cancel {
          padding: 10px 24px;
          border-radius: 6px;
          border: none;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-save {
          background: #14b8a6;
          color: white;
        }

        .btn-save:hover {
          background: #0d9488;
        }

        .btn-cancel {
          background: #334155;
          color: white;
        }

        .btn-cancel:hover {
          background: #475569;
        }
      `}</style>
    </div>
  );
};

export default CompanyProfile;
