import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import placementService from '../../services/placementService';
import StatCard from '../../components/placement/StatCard';
import ActionCard from '../../components/placement/ActionCard';
import './Dashboard.css';

const PlacementDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalJobs: 0,
    verifiedCompanies: 0,
    totalPlacements: 0,
    pendingCompanies: 0
  });
  const [recentJobs, setRecentJobs] = useState([]);
  const [recentCompanies, setRecentCompanies] = useState([]);
  const [companySearch, setCompanySearch] = useState('');
  const [approvingCompanyId, setApprovingCompanyId] = useState('');

  const loadPlacementData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [dashboardResponse, jobsResponse, companiesResponse] = await Promise.all([
        placementService.getDashboard(),
        placementService.getRecentJobs(),
        placementService.getRecentCompanies()
      ]);

      setStats(dashboardResponse.stats || {});
      setRecentJobs(jobsResponse.jobs || []);
      setRecentCompanies(companiesResponse.companies || []);
    } catch (error) {
      setError(error?.message || 'Unable to load placement dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlacementData();
  }, [loadPlacementData]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleVerifyCompanies = () => {
    navigate('/placement/verify-companies');
  };

  const handleManageJobs = () => {
    navigate('/placement/verify-companies');
  };

  const handleViewAnalytics = () => {
    setToast({ type: 'success', text: 'Analytics module is available in the trends section below.' });
  };

  const handleGenerateReports = () => {
    setToast({ type: 'success', text: 'Report generation request queued.' });
  };

  const handleApproveCompany = async (companyId) => {
    try {
      setApprovingCompanyId(companyId);
      const response = await placementService.approveCompany(companyId);
      setToast({ type: 'success', text: response.message || 'Company approved successfully.' });
      await loadPlacementData();
    } catch (error) {
      setToast({ type: 'error', text: error?.message || 'Failed to approve company.' });
    } finally {
      setApprovingCompanyId('');
    }
  };

  const filteredCompanies = useMemo(() => {
    const normalized = companySearch.trim().toLowerCase();
    if (!normalized) return recentCompanies;

    return recentCompanies.filter((company) => {
      const companyName = company.name?.toLowerCase() || '';
      const companyEmail = company.email?.toLowerCase() || '';
      return companyName.includes(normalized) || companyEmail.includes(normalized);
    });
  }, [companySearch, recentCompanies]);

  const getJobStatusLabel = (job) => {
    if (job.status === 'expired') return 'Closed';
    if (job.approvalStatus === 'pending') return 'Pending';
    return 'Active';
  };

  const getCompanyStatusClass = (status) => {
    if (status === 'verified') return 'placement-status verified';
    if (status === 'pending') return 'placement-status pending';
    return 'placement-status unverified';
  };

  return (
    <div className="placement-dashboard-shell bg-gradient-to-br from-[#0f172a] via-[#0b1120] to-[#020617] text-white">
      <aside className="placement-sidebar">
        <h3 className="text-white font-bold">Placement Panel</h3>
        <button type="button" className="sidebar-item active text-white font-semibold">Overview</button>
        <button type="button" className="sidebar-item text-slate-100 font-medium" onClick={handleVerifyCompanies}>Company Verification</button>
        <button type="button" className="sidebar-item text-slate-100 font-medium" onClick={handleManageJobs}>Job Queue</button>
      </aside>

      <div className="placement-dashboard-main">
        <div className="placement-navbar bg-[#0f172a]">
          <div className="logo-wrap">
            <span className="logo-icon">🎓</span>
            <span className="logo-text font-bold text-white">CampusConnect</span>
          </div>

          <div className="placement-nav-search-wrap">
            <input
              type="text"
              placeholder="Search companies, jobs..."
              className="placement-nav-search text-slate-100 placeholder:text-slate-300"
            />
          </div>

          <div className="placement-nav-right">
            <span className="notification">🔔</span>
            <button type="button" className="profile-btn text-slate-100 font-semibold">{user.name || 'Placement'}</button>
            <button onClick={handleLogout} className="logout-btn text-slate-100 font-semibold">Logout</button>
          </div>
        </div>

        <div className="placement-dashboard-content">
          <header className="placement-welcome">
            <h1 className="text-white font-extrabold tracking-tight">Welcome back, Placement Cell 👋</h1>
            <p className="text-slate-300 font-medium">Manage students, companies, and placement analytics.</p>
          </header>

          {toast?.text && (
            <div className={`placement-toast font-semibold ${toast.type === 'success' ? 'success' : 'error'}`}>
              {toast.text}
            </div>
          )}

          {error && (
            <div className="placement-error bg-red-950/70 border border-red-500 text-red-100 font-semibold">
              {error}
            </div>
          )}

          {loading ? (
            <div className="placement-loading text-slate-200 font-medium">Loading placement dashboard...</div>
          ) : (
            <>
              <section className="placement-stats-grid">
                <StatCard icon="🎓" label="Total Students" value={stats.totalStudents} />
                <StatCard icon="💼" label="Total Jobs" value={stats.totalJobs} />
                <StatCard icon="🏢" label="Verified Companies" value={stats.verifiedCompanies} />
                <StatCard icon="✅" label="Total Placements" value={stats.totalPlacements} />
              </section>

              <section className="placement-section placement-actions-section">
                <div className="placement-section-head">
                  <h2 className="text-white font-bold">⚡ Quick Actions</h2>
                </div>
                <div className="placement-action-grid">
                  <ActionCard
                    title="Verify Companies"
                    description="Review pending company registrations and approve quickly."
                    onClick={handleVerifyCompanies}
                    badgeText={stats.pendingCompanies > 0 ? `${stats.pendingCompanies} pending` : ''}
                  />
                  <ActionCard
                    title="Manage Jobs"
                    description="Open all pending and active job postings for review."
                    onClick={handleManageJobs}
                  />
                  <ActionCard
                    title="View Analytics"
                    description="Inspect placement trends and progress indicators."
                    onClick={handleViewAnalytics}
                  />
                  <ActionCard
                    title="Generate Reports"
                    description="Create placement-ready summary reports instantly."
                    onClick={handleGenerateReports}
                  />
                </div>
              </section>

              <section className="placement-grid-2">
                <div className="placement-section">
                  <div className="placement-section-head">
                    <h3 className="text-white font-bold">Recent Job Posts</h3>
                  </div>
                  {recentJobs.length === 0 ? (
                    <p className="empty-text text-slate-200">No recent jobs available.</p>
                  ) : (
                    <div className="placement-list">
                      {recentJobs.map((job) => (
                        <div key={job._id} className="placement-list-item">
                          <div>
                            <h4 className="text-white font-semibold">{job.title}</h4>
                            <p className="text-slate-300">{job.company?.name || 'Company'}</p>
                          </div>
                          <span className={`placement-status ${getJobStatusLabel(job).toLowerCase()}`}>
                            {getJobStatusLabel(job)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="placement-section">
                  <div className="placement-section-head companies-head">
                    <h3 className="text-white font-bold">Recent Company Registrations</h3>
                    <input
                      type="text"
                      className="company-search text-slate-100 placeholder:text-slate-300"
                      placeholder="Search companies"
                      value={companySearch}
                      onChange={(event) => setCompanySearch(event.target.value)}
                    />
                  </div>

                  {filteredCompanies.length === 0 ? (
                    <p className="empty-text text-slate-200">No matching companies found.</p>
                  ) : (
                    <div className="placement-list">
                      {filteredCompanies.map((company) => (
                        <div key={company._id} className="placement-list-item company-item">
                          <div>
                            <h4 className="text-white font-semibold">{company.name}</h4>
                            <p className="text-slate-300">{company.email}</p>
                          </div>
                          <div className="company-actions">
                            <span className={getCompanyStatusClass(company.verificationStatus)}>
                              {company.verificationStatus}
                            </span>
                            <button
                              type="button"
                              className="approve-btn"
                              onClick={() => handleApproveCompany(company._id)}
                              disabled={approvingCompanyId === company._id || company.verificationStatus === 'verified'}
                            >
                              {approvingCompanyId === company._id ? 'Approving...' : 'Approve'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              <section className="placement-section placement-chart-section">
                <div className="placement-section-head">
                  <h3 className="text-white font-bold">Placement Trends</h3>
                </div>
                <div className="placement-chart-placeholder">
                  <div className="chart-bars">
                    <span style={{ height: '30%' }} />
                    <span style={{ height: '55%' }} />
                    <span style={{ height: '45%' }} />
                    <span style={{ height: '70%' }} />
                    <span style={{ height: '85%' }} />
                  </div>
                  <p className="text-slate-200 font-medium">Analytics chart placeholder (monthly placements vs targets)</p>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlacementDashboard;
