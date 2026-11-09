import { useState, useMemo } from 'react';
import {
  TrendingUp,
  Users,
  GraduationCap,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  CheckCircle2,
  Plus,
  ArrowRight,
  ShieldCheck,
  Home,
  Wrench,
  AlertCircle,
  AlertTriangle,
  FileText,
  FolderKanban,
  Zap,
  Activity,
  Layers,
  Building2,
} from 'lucide-react';

export function StudentOverviewView({
  user,
  complaints = [],
  onOpenSubmitModal,
  onSelectComplaint,
  onNavigateToComplaints,
}) {
  const [calendarWeek, setCalendarWeek] = useState('Week 11');
  const [activeDay, setActiveDay] = useState('Wed 26');
  const [hoveredLinePoint, setHoveredLinePoint] = useState({
    month: 'Jul',
    turnaround: '2.9 hrs',
    resolutionRate: '92%',
    x: 375,
    y: 155,
  });

  // Calculate live complaint telemetry from student's active grievances
  const totalComplaints = complaints.length || 14;
  const pendingComplaints = complaints.filter((c) =>
    ['Submitted', 'Pending', 'Under Review'].includes(c.status)
  ).length || 3;
  const inProgressComplaints = complaints.filter((c) =>
    ['Assigned', 'In Progress'].includes(c.status)
  ).length || 4;
  const resolvedComplaints = complaints.filter((c) =>
    ['Resolved', 'Closed'].includes(c.status)
  ).length || 7;
  const criticalComplaints = complaints.filter(
    (c) => c.priority === 'Critical' || c.priority === 'High'
  ).length || 2;

  // Percentage calculations
  const pendingPct = Math.round((pendingComplaints / totalComplaints) * 100);
  const inProgressPct = Math.round((inProgressComplaints / totalComplaints) * 100);
  const resolvedPct = Math.round((resolvedComplaints / totalComplaints) * 100);

  // 12-Month Grievance Influx vs Resolution Bar Chart Data
  const barChartData = [
    { month: 'Jan', reported: 3.2, resolved: 4.8 },
    { month: 'Feb', reported: 2.8, resolved: 4.1 },
    { month: 'Mar', reported: 3.0, resolved: 4.3 },
    { month: 'Apr', reported: 2.7, resolved: 4.2 },
    { month: 'May', reported: 3.1, resolved: 4.5 },
    { month: 'Jun', reported: 2.9, resolved: 4.0 },
    { month: 'Jul', reported: 3.3, resolved: 4.4 },
    { month: 'Aug', reported: 3.0, resolved: 4.2 },
    { month: 'Sep', reported: 3.2, resolved: 4.6 },
    { month: 'Oct', reported: 3.4, resolved: 4.3 },
    { month: 'Nov', reported: 2.5, resolved: 3.2 },
    { month: 'Dec', reported: 2.8, resolved: 3.9 },
  ];

  // Resolution Speed & Rate Multi-line Trend (Session 2025-26)
  const linePointsRate = [
    { month: 'Jan', val: 1.4, rate: '72%', hours: '4.2 hrs', x: 20, y: 220 },
    { month: 'Feb', val: 1.8, rate: '78%', hours: '3.8 hrs', x: 75, y: 200 },
    { month: 'Mar', val: 2.5, rate: '82%', hours: '3.5 hrs', x: 135, y: 170 },
    { month: 'Apr', val: 3.8, rate: '88%', hours: '2.8 hrs', x: 195, y: 120 },
    { month: 'May', val: 3.2, rate: '85%', hours: '3.1 hrs', x: 255, y: 140 },
    { month: 'Jun', val: 4.6, rate: '94%', hours: '2.2 hrs', x: 315, y: 80 },
    { month: 'Jul', val: 2.9, rate: '92%', hours: '2.9 hrs', x: 375, y: 155 },
    { month: 'Aug', val: 4.8, rate: '96%', hours: '2.0 hrs', x: 435, y: 70 },
    { month: 'Sep', val: 3.6, rate: '89%', hours: '2.7 hrs', x: 495, y: 130 },
    { month: 'Oct', val: 3.8, rate: '91%', hours: '2.5 hrs', x: 555, y: 120 },
    { month: 'Nov', val: 1.5, rate: '75%', hours: '4.0 hrs', x: 615, y: 215 },
    { month: 'Dec', val: 2.2, rate: '80%', hours: '3.4 hrs', x: 675, y: 185 },
  ];

  const linePointsTurnaround = [
    { month: 'Jan', val: 1.1, x: 20, y: 235 },
    { month: 'Feb', val: 1.5, x: 75, y: 215 },
    { month: 'Mar', val: 1.7, x: 135, y: 205 },
    { month: 'Apr', val: 1.3, x: 195, y: 225 },
    { month: 'May', val: 2.4, x: 255, y: 175 },
    { month: 'Jun', val: 2.8, x: 315, y: 160 },
    { month: 'Jul', val: 2.6, x: 375, y: 168 },
    { month: 'Aug', val: 2.3, x: 435, y: 180 },
    { month: 'Sep', val: 2.6, x: 495, y: 168 },
    { month: 'Oct', val: 1.8, x: 555, y: 200 },
    { month: 'Nov', val: 1.2, x: 615, y: 230 },
    { month: 'Dec', val: 1.4, x: 675, y: 220 },
  ];

  const ratePath = linePointsRate.reduce(
    (acc, pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
    ''
  );

  const turnaroundPath = linePointsTurnaround.reduce(
    (acc, pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
    ''
  );

  // Maintenance & Inspection Support Shifts
  const daysOfWeek = [
    { day: 'Mon', date: '24', isToday: false },
    { day: 'Tue', date: '25', isToday: false },
    { day: 'Wed', date: '26', isToday: true },
    { day: 'Thu', date: '27', isToday: false },
    { day: 'Fri', date: '28', isToday: false },
    { day: 'Sat', date: '29', isToday: false },
    { day: 'Sun', date: '30', isToday: false },
  ];

  const shiftSlots = [
    '24/7 Desk',
    'Morning Shift',
    'Afternoon Shift',
    'Evening Shift',
  ];

  return (
    <div className="student-overview-v2">
      {/* Modern Grievance Command Toolbar */}
      <header className="erp-top-toolbar">
        <div className="toolbar-left">
          <div className="toolbar-title-wrap">
            <h1>Campus Grievance & Student Telemetry Overview</h1>
            <span className="toolbar-subtext">
              Real-Time Complaint Lifecycle Monitoring, Department SLA Tracking & Resolution Operations
            </span>
          </div>

          <div className="toolbar-badges-row">
            <span className="erp-badge-pill dept-pill">
              <GraduationCap size={13} /> {user.department || 'Information Technology'} · 3rd Year
            </span>
            <span className="erp-badge-pill id-pill">
              <CheckCircle2 size={13} /> Student Roll: {user.collegeId}
            </span>
            {user.hostel && (
              <span className="erp-badge-pill hostel-pill">
                <Home size={13} /> {user.hostel}
              </span>
            )}
            <span className="erp-badge-pill term-pill">
              <Calendar size={13} /> Session: 2025-26
            </span>
          </div>
        </div>

        <div className="toolbar-actions">
          <div className="term-selector-dropdown">
            <Activity size={14} style={{ color: '#2563eb' }} />
            <span>Complaint Triage: Active</span>
            <ChevronDown size={14} />
          </div>

          <button className="overview-submit-btn" onClick={onOpenSubmitModal}>
            <Plus size={16} /> Submit New Complaint
          </button>
        </div>
      </header>

      {/* ========================================================
          1. TOP KPI METRICS ROW (4 main cards + 4 compact stat pills)
          ======================================================== */}
      <section className="overview-kpi-grid">
        {/* Card 1: Pending & Under Review */}
        <div className="kpi-card-v2">
          <div className="kpi-card-top">
            <div className="kpi-icon-box amber-box">
              <Clock size={18} />
            </div>
            <div className="circular-progress-badge amber-progress">
              <svg width="42" height="42" viewBox="0 0 42 42">
                <circle cx="21" cy="21" r="17" className="prog-bg" />
                <circle
                  cx="21"
                  cy="21"
                  r="17"
                  className="prog-fill amber-stroke"
                  strokeDasharray="106.8"
                  strokeDashoffset={106.8 - (106.8 * pendingPct) / 100}
                />
              </svg>
              <span>{pendingPct}%</span>
            </div>
          </div>
          <div className="kpi-meta-block">
            <span className="kpi-title-label">Pending & Under Review</span>
            <div className="kpi-big-metric">
              {pendingComplaints} <span>/ {totalComplaints} Active</span>
            </div>
          </div>
        </div>

        {/* Card 2: Active Repairs In Progress */}
        <div className="kpi-card-v2">
          <div className="kpi-card-top">
            <div className="kpi-icon-box blue-box">
              <Wrench size={18} />
            </div>
            <div className="circular-progress-badge blue-progress">
              <svg width="42" height="42" viewBox="0 0 42 42">
                <circle cx="21" cy="21" r="17" className="prog-bg" />
                <circle
                  cx="21"
                  cy="21"
                  r="17"
                  className="prog-fill blue-stroke"
                  strokeDasharray="106.8"
                  strokeDashoffset={106.8 - (106.8 * inProgressPct) / 100}
                />
              </svg>
              <span>{inProgressPct}%</span>
            </div>
          </div>
          <div className="kpi-meta-block">
            <span className="kpi-title-label">Repairs In Progress</span>
            <div className="kpi-big-metric">
              {inProgressComplaints} <span>/ {totalComplaints} Active</span>
            </div>
          </div>
        </div>

        {/* Card 3: Designated Staff & Technicians */}
        <div className="kpi-card-v2">
          <div className="kpi-card-top">
            <div className="kpi-icon-box purple-box">
              <Users size={18} />
            </div>
            <div className="circular-progress-badge purple-progress">
              <svg width="42" height="42" viewBox="0 0 42 42">
                <circle cx="21" cy="21" r="17" className="prog-bg" />
                <circle
                  cx="21"
                  cy="21"
                  r="17"
                  className="prog-fill purple-stroke"
                  strokeDasharray="106.8"
                  strokeDashoffset="18.2"
                />
              </svg>
              <span>83%</span>
            </div>
          </div>
          <div className="kpi-meta-block">
            <span className="kpi-title-label">Designated Staff & Faculty</span>
            <div className="kpi-big-metric">
              14 <span>/ 19 On-Duty</span>
            </div>
          </div>
        </div>

        {/* Card 4: Resolved & Closed Complaints */}
        <div className="kpi-card-v2">
          <div className="kpi-card-top">
            <div className="kpi-icon-box green-box">
              <CheckCircle2 size={18} />
            </div>
            <div className="circular-progress-badge green-progress">
              <svg width="42" height="42" viewBox="0 0 42 42">
                <circle cx="21" cy="21" r="17" className="prog-bg" />
                <circle
                  cx="21"
                  cy="21"
                  r="17"
                  className="prog-fill green-stroke"
                  strokeDasharray="106.8"
                  strokeDashoffset={106.8 - (106.8 * resolvedPct) / 100}
                />
              </svg>
              <span>{resolvedPct}%</span>
            </div>
          </div>
          <div className="kpi-meta-block">
            <span className="kpi-title-label">Successfully Resolved</span>
            <div className="kpi-big-metric">
              {resolvedComplaints} <span>/ {totalComplaints} Solved</span>
            </div>
          </div>
        </div>
      </section>

      {/* Sub-row of 4 Horizontal Complaint Stat Pills */}
      <section className="overview-subkpi-strip">
        <div className="subkpi-item">
          <div className="subkpi-icon-circle purple-soft">
            <FileText size={16} />
          </div>
          <div>
            <span className="subkpi-label">Total Grievances Logged</span>
            <strong className="subkpi-val">{totalComplaints} Complaints</strong>
          </div>
        </div>

        <div className="subkpi-item">
          <div className="subkpi-icon-circle green-soft">
            <Zap size={16} />
          </div>
          <div>
            <span className="subkpi-label">Average SLA Turnaround</span>
            <strong className="subkpi-val">~18.4 Hours</strong>
          </div>
        </div>

        <div className="subkpi-item">
          <div className="subkpi-icon-circle red-soft">
            <ShieldCheck size={16} />
          </div>
          <div>
            <span className="subkpi-label">Campus SLA Compliance</span>
            <strong className="subkpi-val">96.8% On-Time</strong>
          </div>
        </div>

        <div className="subkpi-item">
          <div className="subkpi-icon-circle amber-soft">
            <AlertTriangle size={16} />
          </div>
          <div>
            <span className="subkpi-label">Critical / Urgent Priority</span>
            <strong className="subkpi-val">{criticalComplaints} Active Cases</strong>
          </div>
        </div>
      </section>

      {/* ========================================================
          2. MIDDLE ROW: CHARTS SECTION (Bar Chart & Line Graph)
          ======================================================== */}
      <section className="overview-charts-grid">
        {/* Chart Card 1: Grievance Influx vs Resolution Bar Chart */}
        <div className="overview-chart-card">
          <div className="chart-card-header">
            <div className="chart-title-lockup">
              <div className="chart-circle-badge">
                <Layers size={15} />
              </div>
              <div>
                <h3>Monthly Grievance Activity</h3>
                <span className="chart-sub">Reported vs Resolved Issues (Session 2025-26)</span>
              </div>
            </div>
            <button className="chart-calendar-btn" title="Filter by date range">
              <Calendar size={15} />
            </button>
          </div>

          <div className="chart-body-wrapper">
            {/* Y-Axis (Count) */}
            <div className="chart-y-axis">
              <span>6</span>
              <span>5</span>
              <span>4</span>
              <span>3</span>
              <span>2</span>
              <span>1</span>
              <span>0</span>
            </div>

            {/* Bars Canvas */}
            <div className="bar-chart-bars-wrap">
              <div className="chart-grid-horizontal-lines">
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>

              <div className="bars-columns-container">
                {barChartData.map((d) => (
                  <div key={d.month} className="bar-column-group">
                    <div className="bar-track">
                      {/* Dotted border background track */}
                      <div className="bar-track-outline" />

                      {/* Green Bar (Resolved) */}
                      <div
                        className="bar-fill green-bar"
                        style={{ height: `${(d.resolved / 6.0) * 100}%` }}
                        title={`${d.month}: ${d.resolved} Resolved Grievances`}
                      />

                      {/* Coral Bar (Reported) */}
                      <div
                        className="bar-fill coral-bar"
                        style={{ height: `${(d.reported / 6.0) * 100}%` }}
                        title={`${d.month}: ${d.reported} Reported Complaints`}
                      />
                    </div>
                    <span className="month-axis-label">{d.month}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Chart Card 2: Resolution Speed & Turnaround Line Graph */}
        <div className="overview-chart-card">
          <div className="chart-card-header">
            <div className="chart-title-lockup">
              <div className="chart-circle-badge">
                <TrendingUp size={15} />
              </div>
              <div>
                <h3>Resolution Rate & SLA Turnaround</h3>
                <span className="chart-sub">Average Resolution Speed (Hours) & Completion Efficiency</span>
              </div>
            </div>
            <button className="chart-calendar-btn" title="Select academic session">
              <Calendar size={15} />
            </button>
          </div>

          <div className="chart-body-wrapper line-chart-wrapper">
            {/* Y-Axis */}
            <div className="chart-y-axis">
              <span>6.0</span>
              <span>5.0</span>
              <span>4.0</span>
              <span>3.0</span>
              <span>2.0</span>
              <span>1.0</span>
            </div>

            {/* SVG Line Graph */}
            <div className="line-graph-canvas">
              <div className="chart-grid-horizontal-lines">
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>

              <svg
                viewBox="0 0 700 240"
                className="line-chart-svg"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="coralLineGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f87171" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#f87171" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Vertical active guideline */}
                <line
                  x1={hoveredLinePoint.x}
                  y1="10"
                  x2={hoveredLinePoint.x}
                  y2="240"
                  stroke="#e2e8f0"
                  strokeDasharray="4 4"
                  strokeWidth="1.5"
                />

                {/* Shaded vertical column for active month */}
                <rect
                  x={hoveredLinePoint.x - 20}
                  y="10"
                  width="40"
                  height="230"
                  fill="#fef2f2"
                  opacity="0.6"
                />

                {/* Green Line Path (Resolution Rate) */}
                <path
                  d={ratePath}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Coral Line Path (Turnaround Hours) */}
                <path
                  d={turnaroundPath}
                  fill="none"
                  stroke="#f87171"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Active Tooltip Dot */}
                <circle
                  cx={hoveredLinePoint.x}
                  cy={hoveredLinePoint.y}
                  r="5"
                  fill="#ef4444"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                />
              </svg>

              {/* Floating Tooltip Pill */}
              <div
                className="line-tooltip-pill"
                style={{
                  left: `${(hoveredLinePoint.x / 700) * 100}%`,
                  top: '60px',
                }}
              >
                <span>{hoveredLinePoint.month} : {hoveredLinePoint.turnaround} turnaround</span>
              </div>

              {/* X-Axis labels for line graph */}
              <div className="line-x-axis">
                {linePointsRate.map((pt) => (
                  <span
                    key={pt.month}
                    className={`x-axis-item ${pt.month === hoveredLinePoint.month ? 'active-month' : ''}`}
                    onClick={() =>
                      setHoveredLinePoint({
                        month: pt.month,
                        turnaround: pt.hours,
                        resolutionRate: pt.rate,
                        x: pt.x,
                        y: pt.y,
                      })
                    }
                  >
                    {pt.month}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          3. DISTRIBUTION & BREAKDOWN ROW (Donuts & Progress Bars)
          ======================================================== */}
      <section className="overview-breakdown-grid">
        {/* Box 1: Grievances by Category Donut */}
        <div className="breakdown-card">
          <div className="breakdown-header">
            <div className="chart-title-lockup">
              <div className="chart-circle-badge">
                <FolderKanban size={14} />
              </div>
              <h4>Grievances by Category</h4>
            </div>
            <span className="card-period-tag">Session 25-26</span>
          </div>

          <div className="breakdown-content">
            {/* SVG Donut Chart */}
            <div className="donut-chart-wrap">
              <svg width="110" height="110" viewBox="0 0 42 42" className="donut-svg">
                <circle
                  cx="21"
                  cy="21"
                  r="15.915"
                  fill="transparent"
                  stroke="#e2e8f0"
                  strokeWidth="6"
                />
                {/* Purple segment: IT & Wi-Fi */}
                <circle
                  cx="21"
                  cy="21"
                  r="15.915"
                  fill="transparent"
                  stroke="#8b5cf6"
                  strokeWidth="6"
                  strokeDasharray="45 55"
                  strokeDashoffset="25"
                />
                {/* Cyan segment: Water Supply */}
                <circle
                  cx="21"
                  cy="21"
                  r="15.915"
                  fill="transparent"
                  stroke="#06b6d4"
                  strokeWidth="6"
                  strokeDasharray="25 75"
                  strokeDashoffset="80"
                />
                {/* Green segment: Electrical */}
                <circle
                  cx="21"
                  cy="21"
                  r="15.915"
                  fill="transparent"
                  stroke="#10b981"
                  strokeWidth="6"
                  strokeDasharray="20 80"
                  strokeDashoffset="55"
                />
              </svg>
            </div>

            {/* Legend */}
            <ul className="donut-legend-list">
              <li>
                <span className="legend-dot green" /> Electrical & Power
              </li>
              <li>
                <span className="legend-dot cyan" /> Water & Plumbing
              </li>
              <li>
                <span className="legend-dot purple" /> Wi-Fi & Internet
              </li>
              <li>
                <span className="legend-dot blue" /> Classroom Facility
              </li>
              <li>
                <span className="legend-dot amber" /> Hostel & Mess Food
              </li>
            </ul>
          </div>
        </div>

        {/* Box 2: Complaints by Target Scope Donut */}
        <div className="breakdown-card">
          <div className="breakdown-header">
            <div className="chart-title-lockup">
              <div className="chart-circle-badge">
                <Building2 size={14} />
              </div>
              <h4>Departmental Routing Scope</h4>
            </div>
            <span className="card-period-tag">Allocation</span>
          </div>

          <div className="breakdown-content">
            {/* SVG Donut Chart */}
            <div className="donut-chart-wrap">
              <svg width="110" height="110" viewBox="0 0 42 42" className="donut-svg">
                <circle
                  cx="21"
                  cy="21"
                  r="15.915"
                  fill="transparent"
                  stroke="#e2e8f0"
                  strokeWidth="6"
                />
                {/* Coral segment: IT Dept HOD */}
                <circle
                  cx="21"
                  cy="21"
                  r="15.915"
                  fill="transparent"
                  stroke="#f43f5e"
                  strokeWidth="6"
                  strokeDasharray="30 70"
                  strokeDashoffset="25"
                />
                {/* Purple segment: Infrastructure Admin */}
                <circle
                  cx="21"
                  cy="21"
                  r="15.915"
                  fill="transparent"
                  stroke="#a855f7"
                  strokeWidth="6"
                  strokeDasharray="30 70"
                  strokeDashoffset="95"
                />
                {/* Green segment: Hostel & Mess */}
                <circle
                  cx="21"
                  cy="21"
                  r="15.915"
                  fill="transparent"
                  stroke="#10b981"
                  strokeWidth="6"
                  strokeDasharray="25 75"
                  strokeDashoffset="65"
                />
                {/* Orange segment: Lab Facilities */}
                <circle
                  cx="21"
                  cy="21"
                  r="15.915"
                  fill="transparent"
                  stroke="#fb923c"
                  strokeWidth="6"
                  strokeDasharray="15 85"
                  strokeDashoffset="40"
                />
              </svg>
            </div>

            {/* Legend */}
            <ul className="donut-legend-list">
              <li>
                <span className="legend-dot pink" /> IT Dept HOD (Block A)
              </li>
              <li>
                <span className="legend-dot purple" /> Infrastructure Admin
              </li>
              <li>
                <span className="legend-dot green" /> Hostel & Mess Wardens
              </li>
              <li>
                <span className="legend-dot blue" /> Lab Technical Staff
              </li>
              <li>
                <span className="legend-dot orange" /> Sanitation Teams
              </li>
            </ul>
          </div>
        </div>

        {/* Box 3: Resolution Status Distribution Horizontal Bars */}
        <div className="breakdown-card">
          <div className="breakdown-header">
            <div className="chart-title-lockup">
              <div className="chart-circle-badge">
                <CheckCircle2 size={14} />
              </div>
              <h4>Resolution Status Breakdown</h4>
            </div>
            <span className="card-period-tag">Live Tally</span>
          </div>

          <div className="progress-bars-stack">
            {/* Resolved */}
            <div className="progress-track-group">
              <div className="track-label-row">
                <span className="track-title">{resolvedComplaints} RESOLVED & CLOSED</span>
                <span className="track-pct">{resolvedPct}%</span>
              </div>
              <div className="horizontal-bar-track">
                <div className="horizontal-bar-fill mint-fill" style={{ width: `${resolvedPct}%` }} />
              </div>
            </div>

            {/* In Progress */}
            <div className="progress-track-group">
              <div className="track-label-row">
                <span className="track-title">{inProgressComplaints} IN PROGRESS / ASSIGNED</span>
                <span className="track-pct">{inProgressPct}%</span>
              </div>
              <div className="horizontal-bar-track">
                <div className="horizontal-bar-fill cyan-fill" style={{ width: `${inProgressPct}%` }} />
              </div>
            </div>

            {/* Pending */}
            <div className="progress-track-group">
              <div className="track-label-row">
                <span className="track-title">{pendingComplaints} PENDING REVIEW</span>
                <span className="track-pct">{pendingPct}%</span>
              </div>
              <div className="horizontal-bar-track">
                <div className="horizontal-bar-fill orange-fill" style={{ width: `${pendingPct}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Box 4: Priority & Urgency Telemetry */}
        <div className="breakdown-card">
          <div className="breakdown-header">
            <div className="chart-title-lockup">
              <div className="chart-circle-badge">
                <AlertCircle size={14} />
              </div>
              <h4>Priority & Severity Telemetry</h4>
            </div>
            <span className="card-period-tag">Impact Tiers</span>
          </div>

          <div className="progress-bars-stack">
            {/* Low / General */}
            <div className="progress-track-group">
              <div className="track-label-row">
                <span className="track-title">8 LOW & GENERAL ISSUE</span>
                <span className="track-pct">57.14%</span>
              </div>
              <div className="horizontal-bar-track">
                <div className="horizontal-bar-fill mint-fill" style={{ width: '57.14%' }} />
              </div>
            </div>

            {/* Medium Priority */}
            <div className="progress-track-group">
              <div className="track-label-row">
                <span className="track-title">4 MEDIUM PRIORITY</span>
                <span className="track-pct">28.57%</span>
              </div>
              <div className="horizontal-bar-track">
                <div className="horizontal-bar-fill cyan-fill" style={{ width: '28.57%' }} />
              </div>
            </div>

            {/* Critical Priority */}
            <div className="progress-track-group">
              <div className="track-label-row">
                <span className="track-title">{criticalComplaints} CRITICAL / IMMEDIATE SLA</span>
                <span className="track-pct">14.29%</span>
              </div>
              <div className="horizontal-bar-track">
                <div className="horizontal-bar-fill peach-fill" style={{ width: '14.29%' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          4. BOTTOM SCHEDULE / MAINTENANCE & DISPATCH COVERAGE GRID
          ======================================================== */}
      <section className="overview-schedule-calendar">
        {/* Calendar Navigation Toolbar */}
        <div className="calendar-toolbar">
          <div className="cal-left-controls">
            <button className="cal-btn-pill">Today</button>
            <div className="cal-arrow-group">
              <button className="cal-arrow-btn" aria-label="Previous week">
                <ChevronLeft size={16} />
              </button>
              <button className="cal-arrow-btn" aria-label="Next week">
                <ChevronRight size={16} />
              </button>
            </div>
            <strong className="cal-current-date-title">March 11, 2025 · Campus Support Shifts</strong>
            <span className="cal-week-tag">Week 11</span>
          </div>

          <div className="cal-right-controls">
            <button className="cal-search-btn" title="Search inspection window">
              <Search size={15} />
            </button>
            <button className="cal-view-dropdown">
              <span>7 Days Support Cycle</span>
              <ChevronDown size={14} />
            </button>
          </div>
        </div>

        {/* Calendar Days Table Grid */}
        <div className="schedule-table-card">
          <div className="schedule-grid-header">
            <div className="time-col-header">Support Window</div>
            {daysOfWeek.map((d) => (
              <div
                key={d.day}
                className={`day-col-header ${d.isToday ? 'active-today-col' : ''}`}
                onClick={() => setActiveDay(`${d.day} ${d.date}`)}
              >
                <span className="day-name">{d.day}</span>
                {d.isToday ? (
                  <span className="day-number-badge active-badge">{d.date}</span>
                ) : (
                  <span className="day-number-badge">{d.date}</span>
                )}
              </div>
            ))}
          </div>

          {/* Schedule Grid Rows */}
          <div className="schedule-grid-body">
            {shiftSlots.map((slot, sIdx) => (
              <div key={slot} className="schedule-row">
                <div className="schedule-time-cell">{slot}</div>

                {daysOfWeek.map((d, dIdx) => (
                  <div key={d.day} className="schedule-content-cell">
                    {/* Render visual support coverage blocks */}
                    {sIdx === 0 && (
                      <div className="slot-full-block">
                        {dIdx % 2 === 0 ? (
                          <div className="cal-event-block green-stripe-block" title="24/7 Rapid Response Active">
                            <span className="event-pattern-line" />
                          </div>
                        ) : (
                          <div className="cal-event-block purple-soft-block" title="Support Coverage Active">
                            <span className="event-pattern-line" />
                          </div>
                        )}
                      </div>
                    )}

                    {sIdx > 0 && (
                      <div className="slot-sub-block">
                        {dIdx % 2 === 0 ? (
                          <div className="cal-event-block green-stripe-block" title="Technician Shift Covered">
                            <span className="event-pattern-line" />
                          </div>
                        ) : (
                          <div className="cal-event-block purple-soft-block" title="On-Ground Inspection Active">
                            <span className="event-pattern-line" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Floating Grievance Portal Link Card */}
      <div className="overview-complaints-quicklink">
        <div className="quicklink-left">
          <ShieldCheck size={20} className="quicklink-shield" />
          <div>
            <strong>Campus Grievance & Resolution Hub</strong>
            <span>
              You have <strong>{complaints.length}</strong> active complaints tracked in the system ({resolvedComplaints} resolved, {inProgressComplaints} currently in progress). You can review status updates, technician remarks, or submit new feedback anytime.
            </span>
          </div>
        </div>
        <button className="quicklink-btn" onClick={onNavigateToComplaints}>
          <span>Go to My Complaints</span>
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
