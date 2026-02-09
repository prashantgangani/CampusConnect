import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../../services/authService';
import './Register.css';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: ''
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const roles = [
    {
      value: 'student',
      label: 'Student',
      description: 'Looking for internships & placements',
      icon: '🎓'
    },
    {
      value: 'mentor',
      label: 'Mentor',
      description: 'Faculty guiding students',
      icon: '👨‍🏫'
    },
    {
      value: 'placement',
      label: 'Placement Cell',
      description: 'Managing campus placements',
      icon: '📋'
    },
    {
      value: 'company',
      label: 'Recruiter',
      description: 'Hiring from campuses',
      icon: '💼'
    }
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRoleSelect = (role) => {
    setFormData({
      ...formData,
      role: role
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      setMessage({ text: 'Passwords do not match!', type: 'error' });
      return;
    }

    // Validate password length
    if (formData.password.length < 8) {
      setMessage({ text: 'Password must be at least 8 characters', type: 'error' });
      return;
    }

    // Validate role selection
    if (!formData.role) {
      setMessage({ text: 'Please select your role', type: 'error' });
      return;
    }

    setLoading(true);

    try {
      // Create data object without confirmPassword
      const { confirmPassword, ...registrationData } = formData;
      
      console.log('Sending registration data:', registrationData);
      const response = await registerUser(registrationData);
      console.log('Registration response:', response);
      
      // Auto-login: Save token and user data
      if (response.token && response.user) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        // Show success message
        setMessage({ 
          text: 'Registration successful! Redirecting to dashboard...', 
          type: 'success' 
        });
        
        // Clear form
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: ''
        });

        // Redirect to appropriate dashboard based on role
        setTimeout(() => {
          const dashboardPath = `/${response.user.role}/dashboard`;
          console.log('Navigating to:', dashboardPath);
          navigate(dashboardPath, { replace: true });
        }, 1000);
      } else {
        // Fallback: If no token (shouldn't happen), redirect to login
        setMessage({ 
          text: 'Registration successful! Please login to continue.', 
          type: 'success' 
        });
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      // More detailed error handling
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.error) {
        errorMessage = error.error;
      }
      
      setMessage({ text: errorMessage, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      {/* Left Panel */}
      <div className="register-left-panel">
        <div className="panel-content">
          <div className="logo">
            <div className="logo-icon">🎓</div>
            <span className="logo-text">
              Campus<span className="logo-highlight">Connect</span>
            </span>
          </div>

          <h1 className="panel-title">Start Your Journey</h1>
          <p className="panel-description">
            Join thousands of students, mentors, and recruiters already using CampusConnect to streamline the placement process.
          </p>

          <div className="feature-list">
            <div className="feature-item">
              <span className="feature-check">✓</span>
              Single-click applications to multiple companies
            </div>
            <div className="feature-item">
              <span className="feature-check">✓</span>
              AI-powered job matching based on your skills
            </div>
            <div className="feature-item">
              <span className="feature-check">✓</span>
              Real-time tracking of all applications
            </div>
            <div className="feature-item">
              <span className="feature-check">✓</span>
              Automated interview scheduling
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Register Form */}
      <div className="register-right-panel">
        <div className="register-card">
        <div className="register-header">
          <a href="/" className="back-link">← Back to home</a>
          <h1>Create your account</h1>
          <p>Already have an account? <a href="/login" className="signin-link">Sign in</a></p>
        </div>
          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}
        <form onSubmit={handleSubmit} className="register-form">
          {/* Role Selection */}
          <div className="form-section">
            <label className="section-label">I am a...</label>
            <div className="role-grid">
              {roles.map((role) => (
                <div
                  key={role.value}
                  className={`role-card ${formData.role === role.value ? 'selected' : ''}`}
                  onClick={() => handleRoleSelect(role.value)}
                >
                  <div className="role-icon">{role.icon}</div>
                  <div className="role-label">{role.label}</div>
                  <div className="role-description">{role.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Full Name */}
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              required
            />
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@college.edu"
                required
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a strong password"
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            <small className="password-hint">Must be at least 8 characters</small>
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
              />
            </div>
          </div>

          {/* Terms */}
          <p className="terms-text">
            By creating an account, you agree to our{' '}
            <a href="/terms" className="terms-link">Terms of Service</a> and{' '}
            <a href="/privacy" className="terms-link">Privacy Policy</a>.
          </p>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="register-button"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
    </div>
  );
};

export default Register;
