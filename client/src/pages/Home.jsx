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

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="features-container">
          <div className="features-header">
            <span className="features-badge">⚡ Powerful Features</span>
            <h2 className="features-title">
              Everything You Need to <span className="highlight-text">Streamline Placements</span>
            </h2>
            <p className="features-description">
              From application to offer letter, manage the entire placement journey with our<br />
              comprehensive suite of tools.
            </p>
          </div>

          <div className="features-grid">
            {/* Feature 1 */}
            <div className="feature-card">
              <div className="feature-icon-wrapper" style={{background: '#E0E7FF'}}>
                <span className="feature-icon">📄</span>
              </div>
              <h3 className="feature-card-title">Digital Profile Management</h3>
              <p className="feature-card-description">
                Students maintain one unified profile with resume, cover letter, and skills—updated once, used everywhere.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="feature-card">
              <div className="feature-icon-wrapper" style={{background: '#CCFBF1'}}>
                <span className="feature-icon">🎯</span>
              </div>
              <h3 className="feature-card-title">Smart Job Matching</h3>
              <p className="feature-card-description">
                AI-powered recommendations surface the best-fit roles based on skills, preferences, and eligibility.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="feature-card">
              <div className="feature-icon-wrapper" style={{background: '#D1FAE5'}}>
                <span className="feature-icon">👨‍🏫</span>
              </div>
              <h3 className="feature-card-title">Mentor Approvals</h3>
              <p className="feature-card-description">
                Faculty mentors receive automated approval requests and can review applications instantly.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="feature-card">
              <div className="feature-icon-wrapper" style={{background: '#DBEAFE'}}>
                <span className="feature-icon">📅</span>
              </div>
              <h3 className="feature-card-title">Interview Scheduling</h3>
              <p className="feature-card-description">
                Calendars sync with academic timetables—no more scheduling conflicts or missed interviews.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="feature-card">
              <div className="feature-icon-wrapper" style={{background: '#FEF3C7'}}>
                <span className="feature-icon">📊</span>
              </div>
              <h3 className="feature-card-title">Real-Time Analytics</h3>
              <p className="feature-card-description">
                Live dashboards show placement rates, pending applications, and upcoming interviews at a glance.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="feature-card">
              <div className="feature-icon-wrapper" style={{background: '#E0E7FF'}}>
                <span className="feature-icon">🔔</span>
              </div>
              <h3 className="feature-card-title">Smart Notifications</h3>
              <p className="feature-card-description">
                Never miss a deadline with automated alerts for new openings, status changes, and deadlines.
              </p>
            </div>

            {/* Feature 7 */}
            <div className="feature-card">
              <div className="feature-icon-wrapper" style={{background: '#FCE7F3'}}>
                <span className="feature-icon">🛡️</span>
              </div>
              <h3 className="feature-card-title">Role-Based Access</h3>
              <p className="feature-card-description">
                Employers view only relevant candidate info—strict data privacy with role-based permissions.
              </p>
            </div>

            {/* Feature 8 */}
            <div className="feature-card">
              <div className="feature-icon-wrapper" style={{background: '#CCFBF1'}}>
                <span className="feature-icon">🏆</span>
              </div>
              <h3 className="feature-card-title">Certificate Generation</h3>
              <p className="feature-card-description">
                Automatic completion certificates generated after supervisor feedback—instant verification.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works-section">
        <div className="how-it-works-container">
          <div className="how-it-works-header">
            <span className="how-it-works-badge">🔑 Simple Process</span>
            <h2 className="how-it-works-title">
              Your Path to <span className="highlight-text">Success</span>
            </h2>
            <p className="how-it-works-description">
              Five simple steps from profile creation to career launch. We've simplified every step of the<br />
              journey.
            </p>
          </div>

          <div className="steps-grid">
            {/* Step 1 */}
            <div className="step-card">
              <div className="step-number-wrapper" style={{background: '#3B82F6'}}>
                <span className="step-number">01</span>
                <div className="step-icon-wrapper">
                  <span className="step-icon">👤</span>
                </div>
              </div>
              <h3 className="step-title">Create Your Profile</h3>
              <p className="step-description">
                Students build a comprehensive digital profile with resume, skills, and preferences—once and for all.
              </p>
            </div>

            {/* Step 2 */}
            <div className="step-card">
              <div className="step-number-wrapper" style={{background: '#14B8A6'}}>
                <span className="step-number">02</span>
                <div className="step-icon-wrapper">
                  <span className="step-icon">🔍</span>
                </div>
              </div>
              <h3 className="step-title">Discover Opportunities</h3>
              <p className="step-description">
                Browse curated internships and placements matched to your skills. AI recommendations highlight best fits.
              </p>
            </div>

            {/* Step 3 */}
            <div className="step-card">
              <div className="step-number-wrapper" style={{background: '#0EA5E9'}}>
                <span className="step-number">03</span>
                <div className="step-icon-wrapper">
                  <span className="step-icon">✈️</span>
                </div>
              </div>
              <h3 className="step-title">Apply with One Click</h3>
              <p className="step-description">
                Submit applications instantly. Mentors receive approval requests automatically—no more chasing signatures.
              </p>
            </div>

            {/* Step 4 */}
            <div className="step-card">
              <div className="step-number-wrapper" style={{background: '#22C55E'}}>
                <span className="step-number">04</span>
                <div className="step-icon-wrapper">
                  <span className="step-icon">✅</span>
                </div>
              </div>
              <h3 className="step-title">Track & Interview</h3>
              <p className="step-description">
                Monitor application status in real-time. Interview schedules sync with your academic calendar.
              </p>
            </div>

            {/* Step 5 */}
            <div className="step-card">
              <div className="step-number-wrapper" style={{background: '#F59E0B'}}>
                <span className="step-number">05</span>
                <div className="step-icon-wrapper">
                  <span className="step-icon">🎖️</span>
                </div>
              </div>
              <h3 className="step-title">Get Certified</h3>
              <p className="step-description">
                Complete training, receive supervisor feedback, and get verified certificates—all in one place.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Colleges Section */}
      <section id="colleges" className="for-colleges-section">
        <div className="for-colleges-container">
          <div className="for-colleges-header">
            <span className="for-colleges-badge">👥 For Everyone</span>
            <h2 className="for-colleges-title">
              Built for <span className="highlight-text-blue">Every</span> <span className="highlight-text-teal">Role</span>
            </h2>
            <p className="for-colleges-description">
              Whether you're a student seeking opportunities or a placement officer managing<br />
              hundreds of applications—we've got you covered.
            </p>
          </div>

          <div className="roles-grid">
            {/* For Students */}
            <div className="role-card">
              <div className="role-icon-wrapper" style={{background: '#3B82F6'}}>
                <span className="role-icon">🎓</span>
              </div>
              <h3 className="role-title">For Students</h3>
              <p className="role-description">
                One profile, endless opportunities. Apply with a click, track progress, and land your dream role.
              </p>
              <ul className="role-features">
                <li>Unified digital profile</li>
                <li>AI-matched recommendations</li>
                <li>Real-time application tracking</li>
                <li>Interview calendar sync</li>
              </ul>
              <button className="role-button">Student Portal →</button>
            </div>

            {/* For Placement Cell */}
            <div className="role-card">
              <div className="role-icon-wrapper" style={{background: '#14B8A6'}}>
                <span className="role-icon">👥</span>
              </div>
              <h3 className="role-title">For Placement Cell</h3>
              <p className="role-description">
                Replace spreadsheets with dashboards. Post openings, track placements, and generate reports instantly.
              </p>
              <ul className="role-features">
                <li>Centralized job posting</li>
                <li>Live placement analytics</li>
                <li>Automated notifications</li>
                <li>Certificate generation</li>
              </ul>
              <button className="role-button">Admin Portal →</button>
            </div>

            {/* For Mentors */}
            <div className="role-card">
              <div className="role-icon-wrapper" style={{background: '#0EA5E9'}}>
                <span className="role-icon">🏢</span>
              </div>
              <h3 className="role-title">For Mentors</h3>
              <p className="role-description">
                Streamlined approvals and student tracking. Support your mentees without the paperwork.
              </p>
              <ul className="role-features">
                <li>Quick approval workflow</li>
                <li>Student progress tracking</li>
                <li>Feedback management</li>
                <li>Communication tools</li>
              </ul>
              <button className="role-button">Mentor Portal →</button>
            </div>

            {/* For Recruiters */}
            <div className="role-card">
              <div className="role-icon-wrapper" style={{background: '#22C55E'}}>
                <span className="role-icon">💼</span>
              </div>
              <h3 className="role-title">For Recruiters</h3>
              <p className="role-description">
                Access verified talent pools. Post requirements, shortlist candidates, and hire efficiently.
              </p>
              <ul className="role-features">
                <li>Verified student profiles</li>
                <li>Skill-based filtering</li>
                <li>Interview scheduling</li>
                <li>Offer management</li>
              </ul>
              <button className="role-button">Recruiter Portal →</button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="cta-section">
        <div className="cta-container">
          <span className="cta-badge">✨ Free for Educational Institutions</span>
          <h2 className="cta-title">
            Ready to Transform Your <span className="highlight-text-teal">Placement Process</span>?
          </h2>
          <p className="cta-description">
            Join 100+ colleges already using CampusConnect to streamline placements,<br />
            boost success rates, and launch student careers faster than ever.
          </p>
          <div className="cta-buttons-section">
            <button className="btn-cta-primary" onClick={() => navigate('/register')}>
              Get Started Free →
            </button>
          </div>
          <div className="cta-features">
            <div className="cta-feature-item">
              <span className="cta-feature-icon">ⓘ</span>
              <span>No Credit Card Required</span>
            </div>
            <div className="cta-feature-item">
              <span className="cta-feature-icon">ⓘ</span>
              <span>GDPR Compliant</span>
            </div>
            <div className="cta-feature-item">
              <span className="cta-feature-icon">ⓘ</span>
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-content">
            {/* Left Column - About */}
            <div className="footer-about">
              <div className="footer-logo">
                <div className="logo-icon">🎓</div>
                <span className="logo-text1">
                  Campus<span className="logo-highlight1">Connect</span>
                </span>
              </div>
              <p className="footer-description">
                Transforming campus placements with technology. From internship to career, we make the journey seamless.
              </p>
              <div className="footer-contact">
                <div className="contact-item">
                  <span className="contact-icon">✉</span>
                  <span>hello@campusconnect.edu</span>
                </div>
                <div className="contact-item">
                  <span className="contact-icon">📞</span>
                  <span>+1 (234) 567-890</span>
                </div>
                <div className="contact-item">
                  <span className="contact-icon">📍</span>
                  <span>Innovation Hub, Tech Park</span>
                </div>
              </div>
            </div>

            {/* Product Column */}
            <div className="footer-column">
              <h4 className="footer-column-title">Product</h4>
              <ul className="footer-links">
                <li><a href="#features">Features</a></li>
                <li><a href="#pricing">Pricing</a></li>
                <li><a href="#integrations">Integrations</a></li>
                <li><a href="#changelog">Changelog</a></li>
              </ul>
            </div>

            {/* Company Column */}
            <div className="footer-column">
              <h4 className="footer-column-title">Company</h4>
              <ul className="footer-links">
                <li><a href="#about">About Us</a></li>
                <li><a href="#careers">Careers</a></li>
                <li><a href="#blog">Blog</a></li>
                <li><a href="#press">Press Kit</a></li>
              </ul>
            </div>

            {/* Resources Column */}
            <div className="footer-column">
              <h4 className="footer-column-title">Resources</h4>
              <ul className="footer-links">
                <li><a href="#docs">Documentation</a></li>
                <li><a href="#help">Help Center</a></li>
                <li><a href="#api">API Reference</a></li>
                <li><a href="#status">Status</a></li>
              </ul>
            </div>

            {/* Legal Column */}
            <div className="footer-column">
              <h4 className="footer-column-title">Legal</h4>
              <ul className="footer-links">
                <li><a href="#privacy">Privacy Policy</a></li>
                <li><a href="#terms">Terms of Service</a></li>
                <li><a href="#cookie">Cookie Policy</a></li>
                <li><a href="#data">Data Processing</a></li>
              </ul>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="footer-bottom">
            <p className="footer-copyright">© 2026 CampusConnect. All rights reserved.</p>
            <div className="footer-social">
              <a href="#linkedin" className="social-link" aria-label="LinkedIn">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
              <a href="#twitter" className="social-link" aria-label="Twitter">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
                </svg>
              </a>
              <a href="#github" className="social-link" aria-label="GitHub">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
