import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-content">
            <div className="logo1">
            <div className="logo-icon">🎓</div>
            <span className="logo-text1">
              Campus<span className="logo-highlight1">Connect</span> 
            </span>
            </div>
          
          
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#colleges">For Colleges</a>
            <a href="#contact">Contact</a>
          </div>

          <div className="nav-buttons">
            <button className="btn-signin" onClick={() => navigate('/login')}>
              Sign In
            </button>
            <button className="btn-getstarted" onClick={() => navigate('/register')}>
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="trust-badge">
          <span className="badge-icon">✓</span>
          Trusted by 100+ Colleges Nationwide
        </div>

        <h1 className="hero-title">
          From Classroom to <span className="highlight-text">Career</span>,<br />
          Seamlessly
        </h1>

        <p className="hero-description">
          The all-in-one placement portal that connects students, mentors, and<br />
          recruiters. Streamline internships, track applications, and launch<br />
          careers—all in one place.
        </p>

        <div className="feature-badges">
          <div className="badge">
            <span className="badge-check">✓</span>
            Single-click applications
          </div>
          <div className="badge">
            <span className="badge-check">✓</span>
            AI-powered job matching
          </div>
          <div className="badge">
            <span className="badge-check">✓</span>
            Real-time tracking
          </div>
        </div>

        <div className="cta-buttons">
          <button className="btn-primary" onClick={() => navigate('/register')}>
            Start Your Journey →
          </button>
          <button className="btn-secondary">
            Watch Demo
          </button>
        </div>

        {/* Statistics */}
        <div className="stats-section">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-number">50,000+</div>
            <div className="stat-label">Students Placed</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💼</div>
            <div className="stat-number">2,500+</div>
            <div className="stat-label">Partner Companies</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-number">95%</div>
            <div className="stat-label">Success Rate</div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
