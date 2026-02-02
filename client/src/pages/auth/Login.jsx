import { useState } from 'react';
import { loginUser } from '../../services/authService';
import './Login.css';

const Login = () => {
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
      
      // Save token in localStorage
      localStorage.setItem('token', response.token);
      
      // Save user data in localStorage
      localStorage.setItem('user', JSON.stringify(response.user));
      
      setMessage({ text: 'Login successful! Redirecting...', type: 'success' });
      
      // Redirect based on role after a short delay
      setTimeout(() => {
        window.location.href = `/${response.user.role}/dashboard`;
      }, 1500);
    } catch (error) {
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

          <h1 className="panel-title">Welcome Back!</h1>
          <p className="panel-description">
            Sign in to access your dashboard, track applications, and continue your journey towards a successful career.
          </p>

          <div className="stats-row">
            <div className="stat-box">
              <h3>50K+</h3>
              <p>Students Placed</p>
            </div>
            <div className="stat-box">
              <h3>2.5K+</h3>
              <p>Companies</p>
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
