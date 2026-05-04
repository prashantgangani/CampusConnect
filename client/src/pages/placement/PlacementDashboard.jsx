import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import placementService from '../../services/placementService';
import notificationApiService from '../../services/notificationApiService';
import PlacementProfileModal from '../../components/placement/PlacementProfileModal';
import StatCard from '../../components/placement/StatCard';
import ActionCard from '../../components/placement/ActionCard';
import './Dashboard.css';

const defaultAnalytics = {
  yearWise: [],
  companyWise: [],
  companyOptions: [],
  summary: {
    totalStudents: 0,
    placedStudents: 0,
    unplacedStudents: 0,
    placementRate: 0,
    averageSalaryLabel: 'N/A',
    minimumSalaryLabel: 'N/A',
    maximumSalaryLabel: 'N/A'
  }
};

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
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(defaultAnalytics);
  const [analyticsFilters, setAnalyticsFilters] = useState({
    year: '',
    companyId: ''
  });
  const [analyticsGraphType, setAnalyticsGraphType] = useState('placedVsUnplaced');

  const [reportOpen, setReportOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportForm, setReportForm] = useState({
    title: 'Placement Summary Report',
    reportType: 'placement-summary',
    reportFormat: 'pdf',
    year: '',
    companyId: '',
    includeYearTrend: true,
    includeCompanyBreakdown: true
  });

  const chartRef = useRef(null);
  const notificationPanelRef = useRef(null);

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
    } catch (loadError) {
      setError(loadError?.message || 'Unable to load placement dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAnalytics = useCallback(async (filters = {}) => {
    try {
      setAnalyticsLoading(true);
      const response = await placementService.getAnalytics(filters);
      setAnalyticsData({
        yearWise: response?.yearWise || [],
        companyWise: response?.companyWise || [],
        companyOptions: response?.companyOptions || [],
        summary: response?.summary || defaultAnalytics.summary
      });
    } catch (analyticsError) {
      setToast({ type: 'error', text: analyticsError?.message || 'Failed to load analytics.' });
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      setNotificationsLoading(true);
      const response = await notificationApiService.getMyNotifications(20);
      setNotifications(Array.isArray(response?.data) ? response.data : []);
      setUnreadNotificationCount(Number(response?.unreadCount) || 0);
    } catch (notificationError) {
      console.error('Error fetching placement notifications:', notificationError);
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlacementData();
  }, [loadPlacementData]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [fetchNotifications]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!notificationPanelRef.current?.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    };

    if (isNotificationOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isNotificationOpen]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const openProfileModal = async () => {
    try {
      setProfileLoading(true);
      const response = await placementService.getProfile();
      setProfile(response.profile);
      setProfileModalOpen(true);
    } catch (profileError) {
      setToast({ type: 'error', text: profileError?.message || 'Failed to load profile.' });
    } finally {
      setProfileLoading(false);
    }
  };

  const closeProfileModal = () => {
    setProfileModalOpen(false);
  };

  const handleSaveProfile = async (updatedProfile) => {
    try {
      setProfileSaving(true);
      const response = await placementService.updateProfile(updatedProfile);
      setProfile(response.profile);
      setToast({ type: 'success', text: 'Profile updated successfully.' });
      setProfileModalOpen(false);
    } catch (saveError) {
      setToast({ type: 'error', text: saveError?.message || 'Failed to save profile.' });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleVerifyCompanies = () => {
    navigate('/placement/verify-companies');
  };

  const handleManageJobs = () => {
    navigate('/placement/verify-companies');
  };

  const handleViewAnalytics = async () => {
    setAnalyticsOpen(true);
    await loadAnalytics(analyticsFilters);
  };

  const handleGenerateReports = async () => {
    setReportOpen(true);
    if (!analyticsData.companyOptions.length) {
      await loadAnalytics({});
    }
  };

  const handleToggleNotifications = async () => {
    const nextOpen = !isNotificationOpen;
    setIsNotificationOpen(nextOpen);

    if (nextOpen) {
      await fetchNotifications();
    }
  };

  const getNotificationIcon = (type) => {
    const iconMap = {
      job: '💼',
      selection: '🎉',
      report: '🧾',
      application: '📩',
      profile: '👤',
      quiz: '📝',
      system: '🔔'
    };

    return iconMap[type] || '🔔';
  };

  const formatNotificationTime = (timestamp) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const handleMarkNotificationRead = async (notificationId, isRead) => {
    try {
      if (isRead) return;

      await notificationApiService.markAsRead(notificationId);

      setNotifications((prev) => prev.map((notification) => (
        notification._id === notificationId
          ? { ...notification, isRead: true, readAt: new Date().toISOString() }
          : notification
      )));
      setUnreadNotificationCount((prev) => Math.max(0, prev - 1));
    } catch (notificationError) {
      console.error('Error marking placement notification read:', notificationError);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await notificationApiService.markAllAsRead();
      setNotifications((prev) => prev.map((notification) => ({
        ...notification,
        isRead: true,
        readAt: new Date().toISOString()
      })));
      setUnreadNotificationCount(0);
    } catch (notificationError) {
      console.error('Error marking all placement notifications read:', notificationError);
    }
  };

  const renderNotificationBell = () => (
    <div className="placement-notification-wrapper" ref={notificationPanelRef}>
      <button
        type="button"
        className="placement-notification-bell"
        onClick={handleToggleNotifications}
        aria-label="Open notifications"
      >
        <span>🔔</span>
        {unreadNotificationCount > 0 && (
          <span className="placement-notification-count">
            {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
          </span>
        )}
      </button>

      {isNotificationOpen && (
        <div className="placement-notification-dropdown" role="menu" aria-label="Notification history">
          <div className="placement-notification-dropdown-header">
            <h4>Notifications</h4>
            <button
              type="button"
              className="placement-notification-action-link"
              onClick={handleMarkAllNotificationsRead}
              disabled={unreadNotificationCount === 0}
            >
              Mark all read
            </button>
          </div>

          <div className="placement-notification-dropdown-list">
            {notificationsLoading ? (
              <p className="notification-empty">Loading notifications...</p>
            ) : notifications.length === 0 ? (
              <p className="notification-empty">No notifications yet.</p>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification._id}
                  type="button"
                  className={`placement-notification-item ${notification.isRead ? '' : 'unread'}`}
                  onClick={() => handleMarkNotificationRead(notification._id, notification.isRead)}
                >
                  <span className="placement-notification-item-icon">{getNotificationIcon(notification.type)}</span>
                  <span className="placement-notification-item-content">
                    <span className="placement-notification-item-title">{notification.title}</span>
                    <span className="placement-notification-item-message">{notification.message}</span>
                    <span className="placement-notification-item-time">{formatNotificationTime(notification.createdAt)}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );

  const handleApproveCompany = async (companyId) => {
    try {
      setApprovingCompanyId(companyId);
      const response = await placementService.approveCompany(companyId);
      setToast({ type: 'success', text: response.message || 'Company approved successfully.' });
      await loadPlacementData();
    } catch (approveError) {
      setToast({ type: 'error', text: approveError?.message || 'Failed to approve company.' });
    } finally {
      setApprovingCompanyId('');
    }
  };

  const handleAnalyticsFilterChange = async (event) => {
    const { name, value } = event.target;
    const nextFilters = { ...analyticsFilters, [name]: value };
    setAnalyticsFilters(nextFilters);
    await loadAnalytics(nextFilters);
  };

  const yearOptions = useMemo(() => {
    const years = analyticsData.yearWise.map((item) => item.year).filter(Boolean);
    return years.sort((a, b) => b - a);
  }, [analyticsData.yearWise]);

  const handleReportFieldChange = (event) => {
    const { name, value, type, checked } = event.target;
    setReportForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleGenerateReport = async () => {
    try {
      setReportLoading(true);
      const response = await placementService.getReportData({
        title: reportForm.title,
        reportType: reportForm.reportType,
        year: reportForm.year || undefined,
        companyId: reportForm.companyId || undefined
      });

      const summary = response?.summary || defaultAnalytics.summary;
      const yearWise = Array.isArray(response?.yearWise) ? response.yearWise : [];
      const companyWise = Array.isArray(response?.companyWise) ? response.companyWise : [];
      const studentDetails = Array.isArray(response?.studentDetails) ? response.studentDetails : [];
      const reportMeta = response?.report || {};

      await fetchNotifications();

      if (reportForm.reportFormat === 'excel') {
        const XLSX = await import('xlsx');

        const summaryRows = [
          { Metric: 'Total Students', Value: summary.totalStudents || 0 },
          { Metric: 'Placed Students', Value: summary.placedStudents || 0 },
          { Metric: 'Unplaced Students', Value: summary.unplacedStudents || 0 },
          { Metric: 'Placement Rate', Value: `${summary.placementRate || 0}%` },
          { Metric: 'Average Salary/Stipend', Value: summary.averageSalaryLabel || 'N/A' },
          { Metric: 'Minimum Salary/Stipend', Value: summary.minimumSalaryLabel || 'N/A' },
          { Metric: 'Maximum Salary/Stipend', Value: summary.maximumSalaryLabel || 'N/A' }
        ];

        const studentRows = studentDetails.map((student) => ({
          'Student Name': student.name || '',
          Email: student.email || '',
          Phone: student.phone || '',
          Institution: student.institution || '',
          Department: student.department || '',
          CGPA: student.cgpa ?? '',
          'Profile Completion (%)': student.profileCompletion ?? '',
          'Placement Status': student.placementStatus || 'Not Placed',
          Company: student.companyName || '',
          'Job Title': student.jobTitle || '',
          'Salary/Stipend': student.salaryOrStipend || ''
        }));

        const yearRows = yearWise.map((item) => ({
          Year: item.year,
          'Placed Students': item.placedStudents || 0,
          'Unplaced Students': item.unplacedStudents || 0,
          'Total Students': item.totalStudents || 0
        }));

        const companyRows = companyWise.map((item) => ({
          Company: item.companyName || '',
          'Placed Students': item.placedStudents || 0,
          'Average Salary/Stipend': item.averageSalaryLabel || 'N/A'
        }));

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summaryRows), 'Summary');
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(studentRows), 'Student Details');

        if (reportForm.includeYearTrend && yearRows.length > 0) {
          XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(yearRows), 'Year Trend');
        }

        if (reportForm.includeCompanyBreakdown && companyRows.length > 0) {
          XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(companyRows), 'Company Breakdown');
        }

        const safeTitle = (reportMeta.title || 'Placement_Report').replace(/[^a-zA-Z0-9_-]/g, '_');
        XLSX.writeFile(workbook, `${safeTitle}.xlsx`);

        setToast({ type: 'success', text: 'Excel report generated successfully.' });
        setReportOpen(false);
        return;
      }

      const [{ jsPDF }, autoTableModule] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable')
      ]);

      const autoTable = autoTableModule.default;
      const doc = new jsPDF();

      doc.setFontSize(18);
      doc.text(reportMeta.title || 'Placement Summary Report', 14, 18);

      doc.setFontSize(11);
      doc.text(`Generated: ${new Date(reportMeta.generatedAt || Date.now()).toLocaleString()}`, 14, 26);
      doc.text(`Year Filter: ${reportForm.year || 'All Years'}`, 14, 32);
      doc.text(
        `Company Filter: ${reportForm.companyId
          ? (analyticsData.companyOptions.find((item) => String(item.id) === String(reportForm.companyId))?.name || 'Selected Company')
          : 'All Companies'}`,
        14,
        38
      );

      autoTable(doc, {
        startY: 44,
        head: [['Metric', 'Value']],
        body: [
          ['Total Students', String(summary.totalStudents || 0)],
          ['Placed Students', String(summary.placedStudents || 0)],
          ['Unplaced Students', String(summary.unplacedStudents || 0)],
          ['Placement Rate', `${summary.placementRate || 0}%`],
          ['Average Salary/Stipend', summary.averageSalaryLabel || 'N/A'],
          ['Minimum Salary/Stipend', summary.minimumSalaryLabel || 'N/A'],
          ['Maximum Salary/Stipend', summary.maximumSalaryLabel || 'N/A']
        ],
        theme: 'grid',
        styles: { fontSize: 10 }
      });

      let nextStartY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 8 : 90;

      if (reportForm.includeYearTrend && yearWise.length > 0) {
        autoTable(doc, {
          startY: nextStartY,
          head: [['Year', 'Placed Students', 'Unplaced Students', 'Total Students']],
          body: yearWise.map((item) => [
            String(item.year),
            String(item.placedStudents || 0),
            String(item.unplacedStudents || 0),
            String(item.totalStudents || 0)
          ]),
          theme: 'striped',
          styles: { fontSize: 10 }
        });
        nextStartY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 8 : nextStartY + 40;
      }

      if (reportForm.includeCompanyBreakdown && companyWise.length > 0) {
        autoTable(doc, {
          startY: nextStartY,
          head: [['Company', 'Placed Students', 'Average Salary/Stipend']],
          body: companyWise.map((item) => [
            item.companyName || 'Company',
            String(item.placedStudents || 0),
            item.averageSalaryLabel || 'N/A'
          ]),
          theme: 'striped',
          styles: { fontSize: 10 }
        });
      }

      // Capture the chart area and embed into PDF if requested
      if (reportForm.includeYearTrend) {
        try {
          const html2canvasModule = await import('html2canvas');
          const html2canvas = html2canvasModule.default || html2canvasModule;

          // Create or clone a chart DOM node so capture works even if analytics modal is closed
          let tempEl = null;
          if (chartRef?.current) {
            tempEl = chartRef.current.cloneNode(true);
          } else {
            // build a full chart clone (including axis ticks and year labels)
            tempEl = document.createElement('div');
            tempEl.className = 'placement-year-graph';

            const chartMain = document.createElement('div');
            chartMain.className = 'placement-chart-main';

            // legend
            const legend = document.createElement('div');
            legend.className = 'placement-chart-legend';
            const primSpan = document.createElement('span');
            const primDot = document.createElement('i');
            primDot.className = `legend-dot ${chartMeta.primaryClassName}`;
            primSpan.appendChild(primDot);
            primSpan.appendChild(document.createTextNode(chartMeta.primaryLabel));
            legend.appendChild(primSpan);
            if (chartMeta.showSecondary) {
              const secSpan = document.createElement('span');
              const secDot = document.createElement('i');
              secDot.className = `legend-dot ${chartMeta.secondaryClassName}`;
              secSpan.appendChild(secDot);
              secSpan.appendChild(document.createTextNode(chartMeta.secondaryLabel));
              legend.appendChild(secSpan);
            }

            chartMain.appendChild(legend);

            const plotRow = document.createElement('div');
            plotRow.className = 'placement-plot-row';

            // Y axis ticks
            const yAxis = document.createElement('div');
            yAxis.className = 'placement-chart-axis-y';
            (chartTicks || []).forEach((tick) => {
              const span = document.createElement('span');
              span.textContent = `${tick}${chartMeta.tickSuffix || ''}`;
              yAxis.appendChild(span);
            });
            plotRow.appendChild(yAxis);

            // grid and bars
            const grid = document.createElement('div');
            grid.className = 'placement-chart-grid-and-bars';

            const barsRow = document.createElement('div');
            barsRow.className = 'placement-year-bars-row';
            (chartSeries || []).forEach((item) => {
              const wrap = document.createElement('div');
              wrap.className = 'placement-year-bar-wrap';
              const bars = document.createElement('div');
              bars.className = 'placement-year-bars';

              const p = document.createElement('span');
              p.className = chartMeta.primaryClassName;
              const pH = Math.round(((item.primaryValue || 0) / Math.max(1, chartTop)) * 100);
              p.style.height = `${pH}%`;
              bars.appendChild(p);

              if (chartMeta.showSecondary) {
                const s = document.createElement('span');
                s.className = chartMeta.secondaryClassName;
                const sH = Math.round(((item.secondaryValue || 0) / Math.max(1, chartTop)) * 100);
                s.style.height = `${sH}%`;
                bars.appendChild(s);
              }

              wrap.appendChild(bars);
              barsRow.appendChild(wrap);
            });

            // year labels row
            const yearRow = document.createElement('div');
            yearRow.className = 'placement-year-axis-row';
            (chartSeries || []).forEach((item) => {
              const small = document.createElement('small');
              small.textContent = String(item.year);
              yearRow.appendChild(small);
            });

            grid.appendChild(barsRow);
            plotRow.appendChild(grid);

            // put year labels outside the dashed grid so they appear below the axis line
            chartMain.appendChild(yearRow);
            chartMain.appendChild(plotRow);

            // put year labels outside the dashed grid so they appear below the axis line
            chartMain.appendChild(yearRow);

            const xLabel = document.createElement('div');
            xLabel.className = 'chart-x-label';
            xLabel.textContent = 'X axis';
            chartMain.appendChild(xLabel);

            tempEl.appendChild(chartMain);
          }

          // position off-screen for capture
          tempEl.style.position = 'fixed';
          tempEl.style.left = '-20000px';
          tempEl.style.top = '0';
          tempEl.style.background = 'transparent';
          document.body.appendChild(tempEl);

          // expand width so all bars are visible
          tempEl.style.width = `${tempEl.scrollWidth || Math.max(600, (chartSeries || []).length * 60)}px`;

          const canvas = await html2canvas(tempEl, { backgroundColor: null, scale: 2 });

          // remove temp element
          document.body.removeChild(tempEl);

          const imgData = canvas.toDataURL('image/png');
          const pageWidth = doc.internal.pageSize.getWidth();
          const margin = 14;
          const imgWidth = pageWidth - margin * 2;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;

          if (nextStartY + imgHeight > doc.internal.pageSize.getHeight() - 20) {
            doc.addPage();
            nextStartY = 14;
          }

          doc.addImage(imgData, 'PNG', margin, nextStartY, imgWidth, imgHeight);
          nextStartY += imgHeight + 8;
        } catch (captureErr) {
          // ignore capture errors but continue saving PDF
        }
      }

      const safeTitle = (reportMeta.title || 'Placement_Report').replace(/[^a-zA-Z0-9_-]/g, '_');
      doc.save(`${safeTitle}.pdf`);

      setToast({ type: 'success', text: 'PDF report generated successfully.' });
      setReportOpen(false);
    } catch (reportError) {
      setToast({ type: 'error', text: reportError?.message || 'Failed to generate report file.' });
    } finally {
      setReportLoading(false);
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

  const analyticsCompanyOptions = useMemo(() => {
    if (analyticsData.companyOptions.length) return analyticsData.companyOptions;
    return recentCompanies.map((company) => ({
      id: company._id,
      name: company.name
    }));
  }, [analyticsData.companyOptions, recentCompanies]);

  const getJobStatusLabel = (job) => {
    if (job.status === 'expired') return 'Closed';
    if (job.approvalStatus === 'pending') return 'Pending';
    return 'Active';
  };

  const getCompanyStatusClass = (status) => {
    if (status === 'verified') return 'placement-status verified';
    if (status === 'pending') return 'placement-status pending';
    if (status === 'rejected') return 'placement-status rejected';
    return 'placement-status unverified';
  };

  const getCompanyStatusLabel = (status) => {
    if (status === 'rejected') return 'Rejected';
    if (status === 'verified') return 'Verified';
    if (status === 'pending') return 'Pending';
    return 'Unverified';
  };

  const chartSeries = useMemo(() => {
    return (analyticsData.yearWise || []).map((item) => {
      const placed = Number(item.placedStudents || 0);
      const unplaced = Number(item.unplacedStudents || 0);
      const total = Number(item.totalStudents || placed + unplaced);
      const placementRate = total > 0 ? Math.round((placed / total) * 100) : 0;

      if (analyticsGraphType === 'totalVsPlaced') {
        return {
          year: item.year,
          primaryValue: total,
          secondaryValue: placed
        };
      }

      if (analyticsGraphType === 'placementRateTrend') {
        return {
          year: item.year,
          primaryValue: placementRate,
          secondaryValue: null
        };
      }

      return {
        year: item.year,
        primaryValue: placed,
        secondaryValue: unplaced
      };
    });
  }, [analyticsData.yearWise, analyticsGraphType]);

  const maxGraphValue = useMemo(() => {
    return chartSeries.reduce((maxValue, item) => {
      const candidateMax = Math.max(item.primaryValue || 0, item.secondaryValue || 0, 1);
      return Math.max(maxValue, candidateMax);
    }, 1);
  }, [chartSeries]);

  const chartMeta = useMemo(() => {
    if (analyticsGraphType === 'totalVsPlaced') {
      return {
        yAxisLabel: 'Students Count',
        primaryLabel: 'Total Students',
        secondaryLabel: 'Placed Students',
        primaryClassName: 'primary-total',
        secondaryClassName: 'secondary-placed',
        showSecondary: true,
        tickSuffix: ''
      };
    }

    if (analyticsGraphType === 'placementRateTrend') {
      return {
        yAxisLabel: 'Placement Rate',
        primaryLabel: 'Placement Rate',
        secondaryLabel: '',
        primaryClassName: 'primary-rate',
        secondaryClassName: '',
        showSecondary: false,
        tickSuffix: '%'
      };
    }

    return {
      yAxisLabel: 'Students Count',
      primaryLabel: 'Placed',
      secondaryLabel: 'Unplaced',
      primaryClassName: 'primary-placed',
      secondaryClassName: 'secondary-unplaced',
      showSecondary: true,
      tickSuffix: ''
    };
  }, [analyticsGraphType]);

  const chartTicks = useMemo(() => {
    // Compute a "topTick" to normalize bar heights and produce human-friendly ticks
    if (chartMeta.tickSuffix === '%') {
      return [100, 75, 50, 25, 0];
    }

    const rawMax = Math.max(...chartSeries.map((s) => Math.max(s.primaryValue || 0, s.secondaryValue || 0)), 0);
    // ensure at least 4 steps so ticks show 4..0 for small values
    const top = Math.max(4, Math.ceil(rawMax));
    const ticks = [];
    for (let i = top; i >= 0; i -= 1) ticks.push(i);
    return ticks;
  }, [chartSeries, chartMeta.tickSuffix]);

  const chartTop = useMemo(() => {
    if (chartMeta.tickSuffix === '%') return 100;
    const rawMax = Math.max(...chartSeries.map((s) => Math.max(s.primaryValue || 0, s.secondaryValue || 0)), 0);
    return Math.max(4, Math.ceil(rawMax));
  }, [chartSeries, chartMeta.tickSuffix]);

  return (
    <div className="placement-dashboard-shell text-white">
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
            <span className="logo-text font-bold text-white">
              <span className="logo-campus">Campus</span>
              <span className="logo-connect">Connect</span>
            </span>
          </div>

          <div className="placement-nav-search-wrap">
            <input
              type="text"
              placeholder="Search companies, jobs..."
              className="placement-nav-search text-slate-100 placeholder:text-slate-300"
            />
          </div>

          <div className="placement-nav-right">
            {renderNotificationBell()}
            <button
              type="button"
              onClick={openProfileModal}
              className="profile-btn text-slate-100 font-semibold"
              disabled={profileLoading}
            >
              {profileLoading ? 'Loading…' : user.name || 'Placement'}
            </button>
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

          <PlacementProfileModal
            isOpen={profileModalOpen}
            onClose={closeProfileModal}
            profile={profile}
            onSave={handleSaveProfile}
            saving={profileSaving}
          />

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
                              {getCompanyStatusLabel(company.verificationStatus)}
                            </span>
                            <button
                              type="button"
                              className="approve-btn"
                              onClick={() => handleApproveCompany(company._id)}
                              disabled={
                                approvingCompanyId === company._id
                                || company.verificationStatus === 'verified'
                                || company.verificationStatus === 'rejected'
                              }
                            >
                              {company.verificationStatus === 'rejected'
                                ? 'Rejected'
                                : approvingCompanyId === company._id
                                  ? 'Approving...'
                                  : 'Approve'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </div>

      {analyticsOpen && (
        <div className="placement-modal-overlay" role="dialog" aria-modal="true">
          <div className="placement-modal placement-analytics-modal">
            <div className="placement-modal-header">
              <h3>Placement Analytics</h3>
              <button
                type="button"
                className="placement-modal-close"
                onClick={() => setAnalyticsOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="placement-analytics-filters">
              <div className="placement-modal-field">
                <label htmlFor="analyticsYear">Year</label>
                <select id="analyticsYear" name="year" value={analyticsFilters.year} onChange={handleAnalyticsFilterChange}>
                  <option value="">All Years</option>
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div className="placement-modal-field">
                <label htmlFor="analyticsCompany">Company</label>
                <select
                  id="analyticsCompany"
                  name="companyId"
                  value={analyticsFilters.companyId}
                  onChange={handleAnalyticsFilterChange}
                >
                  <option value="">All Companies</option>
                  {analyticsCompanyOptions.map((company) => (
                    <option key={company.id} value={company.id}>{company.name}</option>
                  ))}
                </select>
              </div>

              <div className="placement-modal-field">
                <label htmlFor="analyticsGraphType">Graph Type</label>
                <select
                  id="analyticsGraphType"
                  name="analyticsGraphType"
                  value={analyticsGraphType}
                  onChange={(event) => setAnalyticsGraphType(event.target.value)}
                >
                  <option value="placedVsUnplaced">Placed vs Unplaced</option>
                  <option value="totalVsPlaced">Total Students vs Placed Students</option>
                  <option value="placementRateTrend">Placement Rate Trend</option>
                </select>
              </div>
            </div>

            <div className="placement-filter-runtime-hint">
              Filters apply instantly in real time when you change Year or Company.
            </div>

            {analyticsLoading ? (
              <p className="placement-loading">Loading analytics...</p>
            ) : (
              <>
                <div className="placement-analytics-summary">
                  <div className="placement-summary-tile">
                    <span>Total Students</span>
                    <strong>{analyticsData.summary.totalStudents || 0}</strong>
                  </div>
                  <div className="placement-summary-tile">
                    <span>Placed Students</span>
                    <strong>{analyticsData.summary.placedStudents || 0}</strong>
                  </div>
                  <div className="placement-summary-tile">
                    <span>Unplaced Students</span>
                    <strong>{analyticsData.summary.unplacedStudents || 0}</strong>
                  </div>
                  <div className="placement-summary-tile">
                    <span>Placement Rate</span>
                    <strong>{analyticsData.summary.placementRate || 0}%</strong>
                  </div>
                </div>

                <div className="placement-salary-row">
                  <div className="placement-salary-pill">Avg: {analyticsData.summary.averageSalaryLabel}</div>
                  <div className="placement-salary-pill">Min: {analyticsData.summary.minimumSalaryLabel}</div>
                  <div className="placement-salary-pill">Max: {analyticsData.summary.maximumSalaryLabel}</div>
                </div>

                <div className="placement-year-graph" ref={chartRef}>
                  {chartSeries.length === 0 ? (
                    <p className="empty-text">No year-wise data found for selected filters.</p>
                  ) : (
                    <>
                      <div className="placement-chart-main">
                        <div className="placement-chart-legend">
                          <span><i className={`legend-dot ${chartMeta.primaryClassName}`} />{chartMeta.primaryLabel}</span>
                          {chartMeta.showSecondary && (
                            <span><i className={`legend-dot ${chartMeta.secondaryClassName}`} />{chartMeta.secondaryLabel}</span>
                          )}
                        </div>
                        <div className="placement-plot-row">
                          <div className="placement-chart-axis-y">
                            {chartTicks.map((tick, index) => (
                              <span key={`${tick}-${index}`}>{`${tick}${chartMeta.tickSuffix}`}</span>
                            ))}
                          </div>
                          <div className="placement-chart-grid-and-bars">
                              <div className="placement-year-bars-row">
                                {chartSeries.map((item) => {
                                const primaryHeight = Math.round(((item.primaryValue || 0) / chartTop) * 100);
                                const secondaryHeight = Math.round(((item.secondaryValue || 0) / chartTop) * 100);

                                return (
                                  <div key={item.year} className="placement-year-bar-wrap">
                                    <div className="placement-year-bars">
                                      <span
                                        className={chartMeta.primaryClassName}
                                        style={{ height: `${primaryHeight}%` }}
                                        title={`${chartMeta.primaryLabel}: ${item.primaryValue || 0}${chartMeta.tickSuffix}`}
                                      />
                                      {chartMeta.showSecondary && (
                                        <span
                                          className={chartMeta.secondaryClassName}
                                          style={{ height: `${secondaryHeight}%` }}
                                          title={`${chartMeta.secondaryLabel}: ${item.secondaryValue || 0}${chartMeta.tickSuffix}`}
                                        />
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                              </div>
                          </div>
                          <div className="placement-year-axis-row">
                            {chartSeries.map((item) => (
                              <small key={`year-label-${item.year}`}>{item.year}</small>
                            ))}
                          </div>
                        </div>
                        <div className="chart-x-label">X axis</div>
                      </div>
                    </>
                  )}
                </div>

                <div className="placement-analytics-table-wrap">
                  <h4>Company-wise Placement & Salary/Stipend</h4>
                  {analyticsData.companyWise.length === 0 ? (
                    <p className="empty-text">No company-wise data available.</p>
                  ) : (
                    <table className="placement-analytics-table">
                      <thead>
                        <tr>
                          <th>Company</th>
                          <th>Placed Students</th>
                          <th>Average Salary/Stipend</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analyticsData.companyWise.map((row) => (
                          <tr key={row.companyId}>
                            <td>{row.companyName}</td>
                            <td>{row.placedStudents || 0}</td>
                            <td>{row.averageSalaryLabel || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {reportOpen && (
        <div className="placement-modal-overlay" role="dialog" aria-modal="true">
          <div className="placement-modal placement-report-modal">
            <div className="placement-modal-header">
              <h3>Generate Placement Report</h3>
              <button
                type="button"
                className="placement-modal-close"
                onClick={() => setReportOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="placement-modal-form">
              <div className="placement-modal-field">
                <label htmlFor="reportTitle">Report Title</label>
                <input
                  id="reportTitle"
                  name="title"
                  type="text"
                  value={reportForm.title}
                  onChange={handleReportFieldChange}
                  placeholder="Placement Summary Report"
                />
              </div>

              <div className="placement-modal-field">
                <label htmlFor="reportType">Report Type</label>
                <select id="reportType" name="reportType" value={reportForm.reportType} onChange={handleReportFieldChange}>
                  <option value="placement-summary">Placement Summary</option>
                  <option value="salary-summary">Salary/Stipend Summary</option>
                  <option value="company-performance">Company-wise Performance</option>
                </select>
              </div>

              <div className="placement-modal-field">
                <label htmlFor="reportFormat">Report Format</label>
                <select id="reportFormat" name="reportFormat" value={reportForm.reportFormat} onChange={handleReportFieldChange}>
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel (.xlsx)</option>
                </select>
              </div>

              <div className="placement-report-grid">
                <div className="placement-modal-field">
                  <label htmlFor="reportYear">Year Filter</label>
                  <select id="reportYear" name="year" value={reportForm.year} onChange={handleReportFieldChange}>
                    <option value="">All Years</option>
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <div className="placement-modal-field">
                  <label htmlFor="reportCompany">Company Filter</label>
                  <select id="reportCompany" name="companyId" value={reportForm.companyId} onChange={handleReportFieldChange}>
                    <option value="">All Companies</option>
                    {analyticsCompanyOptions.map((company) => (
                      <option key={company.id} value={company.id}>{company.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="placement-checkbox-row">
                <label className="placement-checkbox-item">
                  <input
                    type="checkbox"
                    name="includeYearTrend"
                    checked={reportForm.includeYearTrend}
                    onChange={handleReportFieldChange}
                  />
                  Include year-wise placed vs unplaced trend
                </label>
                <label className="placement-checkbox-item">
                  <input
                    type="checkbox"
                    name="includeCompanyBreakdown"
                    checked={reportForm.includeCompanyBreakdown}
                    onChange={handleReportFieldChange}
                  />
                  Include company-wise salary/stipend breakdown
                </label>
              </div>

              <div className="placement-modal-actions">
                <button type="button" className="placement-modal-cancel" onClick={() => setReportOpen(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="placement-modal-save"
                  onClick={handleGenerateReport}
                  disabled={reportLoading}
                >
                  {reportLoading
                    ? `Generating ${reportForm.reportFormat === 'excel' ? 'Excel' : 'PDF'}...`
                    : `Generate ${reportForm.reportFormat === 'excel' ? 'Excel' : 'PDF'} Report`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlacementDashboard;
