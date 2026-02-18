import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../../services/authService';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await loginUser(formData);
      console.log('Login response:', response);
      console.log('User data:', response.user);
      
      // The authService already saves token and user to localStorage
      // But let's ensure they're there
      if (!localStorage.getItem('token')) {
        localStorage.setItem('token', response.token);
      }
      if (!localStorage.getItem('user')) {
        localStorage.setItem('user', JSON.stringify(response.user));
      }
      
      const userRole = response.user?.role;
      if (!userRole) {
        throw new Error('User role not found in response');
      }
      
      setMessage({ text: 'Login successful! Redirecting to dashboard...', type: 'success' });
      
      // Redirect based on role using React Router
      setTimeout(() => {
        const dashboardPath = `/${userRole}/dashboard`;
        console.log('Navigating to:', dashboardPath);
        navigate(dashboardPath, { replace: true });
      }, 500);
    } catch (error) {
      console.error('Login error:', error);
      setMessage({ text: error.message || 'Login failed. Please try again.', type: 'error' });
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Left Panel */}
      <div className="login-left-panel">
        <div className="panel-content">
          <div className="logo">
            <div className="logo-icon">🎓</div>
            <span className="logo-text">
              Campus<span className="logo-highlight">Connect</span>
            </span>
          </div>

          <h1 className="panel-title">Welcome Back</h1>
          <p className="panel-description">
            Sign in to access your dashboard and continue your placement journey.
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

      {/* Right Panel - Login Form */}
      <div className="login-right-panel">
        <div className="login-card">
          <a href="/" className="back-link">← Back to home</a>
          
          <div className="login-header">
            <h1>Sign in to your account</h1>
            <p>Don't have an account? <a href="/register" className="signup-link">Sign up free</a></p>
          </div>
          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
    </div>
  );
};

export default Login;
