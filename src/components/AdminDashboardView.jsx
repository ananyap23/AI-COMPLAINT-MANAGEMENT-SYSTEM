import { useState, useMemo, useEffect } from 'react';
import {
  Wrench,
  Search,
  Filter,
  Users,
  ChevronRight,
  ShieldCheck,
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Droplet,
  Wifi,
  Sparkles,
  Phone,
  Mail,
  ArrowRight,
  BarChart3,
  Activity,
  FileText,
  Layers,
  MessageSquare,
  Calendar,
  UserCheck,
  Check,
} from 'lucide-react';
import { api } from '../services/api';
import { formatIST } from '../utils/timeFormat';

export function AdminDashboardView({
  user,
  complaints = [],
  activeNav = 'Infra dashboard',
  onSwitchTab,
  onSelectComplaint,
  onComplaintUpdated,
}) {
  // Common states
  const [query, setQuery] = useState('');
  const [filterBlock, setFilterBlock] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [sortOrder, setSortOrder] = useState('Newest');

  // Technician pool states
  const [technicianFilter, setTechnicianFilter] = useState('All');
  const [staffList, setStaffList] = useState([]);
  const [assigningId, setAssigningId] = useState(null);
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [priorityForModal, setPriorityForModal] = useState('High');
  const [remarksForModal, setRemarksForModal] = useState('');
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);

  // Default fallback infrastructure technicians if API is slow or offline
  const fallbackTechnicians = [
    { id: 'stf-1', name: 'Sunil Kumar', designation: 'Senior Electrician', department: 'Infrastructure', category: 'Electrical', email: 'sunilkumar@campus.edu', phone: '+91 98765 00001' },
    { id: 'stf-2', name: 'Manoj Yadav', designation: 'Plumbing Supervisor', department: 'Infrastructure', category: 'Water Supply', email: 'manojyadav@campus.edu', phone: '+91 98765 00002' },
    { id: 'stf-3', name: 'Dinesh Verma', designation: 'HVAC & AC Technician', department: 'Infrastructure', category: 'Classroom Maintenance', email: 'dineshverma@campus.edu', phone: '+91 98765 00003' },
    { id: 'stf-4', name: 'Ramesh Pal', designation: 'Campus Civil & Furniture Specialist', department: 'Infrastructure', category: 'Furniture', email: 'rameshpal@campus.edu', phone: '+91 98765 00004' },
    { id: 'stf-5', name: 'Amit Ghosh', designation: 'Network & Wi-Fi Engineer', department: 'Infrastructure', category: 'Internet', email: 'amitghosh@campus.edu', phone: '+91 98765 00005' },
    { id: 'stf-6', name: 'Deepak Lal', designation: 'Sanitation & Cleaning Head', department: 'Infrastructure', category: 'Cleaning', email: 'deepaklal@campus.edu', phone: '+91 98765 00006' },
  ];

  // Fetch technician directory
  useEffect(() => {
    api.getStaff()
      .then((data) => {
        if (data && data.length > 0) {
          const infraOnly = data.filter((s) => s.department === 'Infrastructure');
          setStaffList(infraOnly.length > 0 ? infraOnly : data);
        } else {
          setStaffList(fallbackTechnicians);
        }
      })
      .catch(() => {
        setStaffList(fallbackTechnicians);
      });
  }, []);

  const technicians = staffList.length > 0 ? staffList : fallbackTechnicians;

  // Stats calculation
  const total = complaints.length;
  const pending = complaints.filter((c) =>
    ['Submitted', 'Pending', 'Under Review'].includes(c.status)
  ).length;
  const inProgress = complaints.filter((c) =>
    ['Assigned', 'In Progress'].includes(c.status)
  ).length;
  const resolved = complaints.filter((c) =>
    ['Resolved', 'Closed'].includes(c.status)
  ).length;
  const overdue = complaints.filter((c) => c.isOverdue).length;
  const criticalCount = complaints.filter(
    (c) => c.priority === 'Critical' || c.priority === 'High'
  ).length;

  // Category counts
  const electricalComplaints = complaints.filter((c) => c.category?.toLowerCase().includes('electric'));
  const waterComplaints = complaints.filter((c) => c.category?.toLowerCase().includes('water'));
  const networkComplaints = complaints.filter((c) => c.category?.toLowerCase().includes('internet') || c.category?.toLowerCase().includes('wifi'));
  const furnitureComplaints = complaints.filter((c) => c.category?.toLowerCase().includes('furniture') || c.category?.toLowerCase().includes('classroom'));
  const sanitationComplaints = complaints.filter((c) => c.category?.toLowerCase().includes('cleaning') || c.category?.toLowerCase().includes('sanitation'));

  // Urgent attention queue (Critical, High, or Overdue complaints that need active intervention)
  const urgentComplaints = useMemo(() => {
    return complaints.filter(
      (c) => (c.priority === 'Critical' || c.priority === 'High' || c.isOverdue) && c.status !== 'Resolved' && c.status !== 'Closed'
    );
  }, [complaints]);

  // Unassigned complaints for technician dispatch
  const unassignedComplaints = useMemo(() => {
    return complaints.filter((c) => !c.assignedTo && c.status !== 'Resolved' && c.status !== 'Closed');
  }, [complaints]);

  // Unique blocks & categories
  const blocks = useMemo(() => {
    return ['All', ...new Set(complaints.map((c) => c.block).filter(Boolean))];
  }, [complaints]);

  const categories = useMemo(() => {
    return ['All', ...new Set(complaints.map((c) => c.category).filter(Boolean))];
  }, [complaints]);

  // Filtered complaints for the All Infrastructure table
  const visibleComplaints = useMemo(() => {
    return complaints
      .filter((c) => {
        const text = `${c.title} ${c.id} ${c.location} ${c.block || ''} ${c.category} ${c.studentName || ''} ${c.assignedTo || ''} ${c.description}`.toLowerCase();
        const matchesQuery = text.includes(query.toLowerCase());
        const matchesBlock = filterBlock === 'All' || c.block === filterBlock;
        const matchesCat = filterCategory === 'All' || c.category === filterCategory;
        const matchesStatus =
          filterStatus === 'All' ||
          (filterStatus === 'Pending' && ['Submitted', 'Pending', 'Under Review'].includes(c.status)) ||
          (filterStatus === 'In Progress' && ['Assigned', 'In Progress'].includes(c.status)) ||
          (filterStatus === 'Overdue' && c.isOverdue) ||
          c.status === filterStatus;
        const matchesPriority = filterPriority === 'All' || c.priority === filterPriority;
        return matchesQuery && matchesBlock && matchesCat && matchesStatus && matchesPriority;
      })
      .sort((a, b) => {
        if (sortOrder === 'Oldest') return (a.createdAt || 0) - (b.createdAt || 0);
        if (sortOrder === 'Highest Priority') {
          const map = { Critical: 4, High: 3, Medium: 2, Low: 1 };
          return (map[b.priority] || 0) - (map[a.priority] || 0);
        }
        if (sortOrder === 'SLA Urgency') {
          return (b.isOverdue ? 1 : 0) - (a.isOverdue ? 1 : 0);
        }
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
  }, [complaints, query, filterBlock, filterCategory, filterStatus, filterPriority, sortOrder]);

  // Filtered technicians for Technician Pool view
  const visibleTechnicians = useMemo(() => {
    if (technicianFilter === 'All') return technicians;
    return technicians.filter(
      (t) =>
        t.category?.toLowerCase().includes(technicianFilter.toLowerCase()) ||
        t.designation?.toLowerCase().includes(technicianFilter.toLowerCase())
    );
  }, [technicians, technicianFilter]);

  // Dispatch technician handler
  async function handleDispatchTechnician(complaintId) {
    if (!selectedTechnician) {
      setActionError('Please select a technician to dispatch.');
      return;
    }
    try {
      setActionError(null);
      const updated = await api.assignStaff(complaintId, {
        staffName: selectedTechnician,
        department: 'Infrastructure',
        priority: priorityForModal,
        remarks: remarksForModal || 'Dispatched by Estate & Infrastructure Admin.',
      });
      if (onComplaintUpdated) onComplaintUpdated(updated);
      setAssigningId(null);
      setSelectedTechnician('');
      setRemarksForModal('');
      setActionSuccess(`Technician ${selectedTechnician} successfully dispatched to grievance ${complaintId}.`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      setActionError(err.message || 'Failed to dispatch technician');
    }
  }

  // ========================================================
  // VIEW 1: INFRA DASHBOARD (Executive Incident Control & Telemetry)
  // ========================================================
  if (activeNav === 'Infra dashboard') {
    return (
      <div className="role-dashboard admin-dashboard-view">
        {/* Intro Header */}
        <section className="welcome-row">
          <div>
            <div className="scope-badge-pill admin-pill">
              <Wrench size={15} />
              <span>
                Estate & Infrastructure Incident Control · Administrator: <strong>{user.name}</strong>
              </span>
            </div>
            <h1 style={{ marginTop: '10px' }}>
              Infrastructure Operations & Incident Control <span>✦</span>
            </h1>
            <p className="welcome-copy">
              Executive campus telemetry covering electricity, water supply, HVAC, building maintenance, civil structures, and fiber networking.
            </p>
          </div>

          {onSwitchTab && (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => onSwitchTab('All infrastructure')}
              >
                <FileText size={15} /> All Infrastructure Registry ({total})
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => onSwitchTab('Technician pool')}
              >
                <Users size={15} /> Technician Pool ({technicians.length})
              </button>
            </div>
          )}
        </section>

        {/* 5-Stat KPI Row */}
        <section className="coordinator-stats">
          <article>
            <span>Total Infrastructure</span>
            <strong>{total}</strong>
            <small>Campus-wide grievances</small>
          </article>
          <article>
            <span>Pending Triage</span>
            <strong style={{ color: '#b27d2e' }}>{pending}</strong>
            <small>Awaiting technician dispatch</small>
          </article>
          <article>
            <span>Repairs On-Site</span>
            <strong style={{ color: '#76549b' }}>{inProgress}</strong>
            <small>Staff currently active</small>
          </article>
          <article>
            <span>Verified & Resolved</span>
            <strong style={{ color: '#39805d' }}>{resolved}</strong>
            <small>Fixed and student verified</small>
          </article>
          <article className={overdue > 0 ? 'overdue-stat-card' : ''}>
            <span>Overdue SLA (&gt; 48h)</span>
            <strong style={{ color: overdue > 0 ? '#b14d4d' : '#9a9296' }}>{overdue}</strong>
            <small>{overdue > 0 ? 'Urgent escalation needed' : 'All within SLA target'}</small>
          </article>
        </section>

        {/* Category Operations Grid (5 Detailed Cards) */}
        <section style={{ marginTop: '24px' }}>
          <div className="admin-table-heading" style={{ padding: '0 0 12px' }}>
            <div>
              <h2>Estate Services & Category Health</h2>
              <p>Active workload distribution across key campus infrastructure domains.</p>
            </div>
          </div>

          <div className="infra-category-health-grid">
            {/* Electrical */}
            <div className="infra-health-card">
              <div className="health-card-top">
                <div className="health-icon-box electrical-icon">
                  <Zap size={18} />
                </div>
                <span className="health-status-badge active">
                  {electricalComplaints.filter((c) => c.status !== 'Resolved').length} Active
                </span>
              </div>
              <h3>Electrical & Power</h3>
              <p>Substations, high-voltage transformers, classroom wiring, and laboratory power points.</p>
              <div className="health-stats-row">
                <span>Total: <strong>{electricalComplaints.length}</strong></span>
                <span>Resolved: <strong style={{ color: '#39805d' }}>{electricalComplaints.filter((c) => c.status === 'Resolved').length}</strong></span>
                <span>Tech Lead: <strong>Sunil Kumar</strong></span>
              </div>
            </div>

            {/* Water & Plumbing */}
            <div className="infra-health-card">
              <div className="health-card-top">
                <div className="health-icon-box water-icon">
                  <Droplet size={18} />
                </div>
                <span className="health-status-badge active">
                  {waterComplaints.filter((c) => c.status !== 'Resolved').length} Active
                </span>
              </div>
              <h3>Water Supply & Plumbing</h3>
              <p>Overhead reservoirs, filtration units, pressure pumps, and campus sanitation pipelines.</p>
              <div className="health-stats-row">
                <span>Total: <strong>{waterComplaints.length}</strong></span>
                <span>Resolved: <strong style={{ color: '#39805d' }}>{waterComplaints.filter((c) => c.status === 'Resolved').length}</strong></span>
                <span>Tech Lead: <strong>Manoj Yadav</strong></span>
              </div>
            </div>

            {/* Network & Wi-Fi */}
            <div className="infra-health-card">
              <div className="health-card-top">
                <div className="health-icon-box network-icon">
                  <Wifi size={18} />
                </div>
                <span className="health-status-badge active">
                  {networkComplaints.filter((c) => c.status !== 'Resolved').length} Active
                </span>
              </div>
              <h3>Campus Wi-Fi & Fiber</h3>
              <p>Optical fiber backbone, gigabit edge switches, Wi-Fi access points, and server connectivity.</p>
              <div className="health-stats-row">
                <span>Total: <strong>{networkComplaints.length}</strong></span>
                <span>Resolved: <strong style={{ color: '#39805d' }}>{networkComplaints.filter((c) => c.status === 'Resolved').length}</strong></span>
                <span>Tech Lead: <strong>Amit Ghosh</strong></span>
              </div>
            </div>

            {/* Civil & Furniture */}
            <div className="infra-health-card">
              <div className="health-card-top">
                <div className="health-icon-box civil-icon">
                  <Building2 size={18} />
                </div>
                <span className="health-status-badge normal">
                  {furnitureComplaints.filter((c) => c.status !== 'Resolved').length} Active
                </span>
              </div>
              <h3>Civil, Doors & Furniture</h3>
              <p>Lecture hall benches, doors, acoustic paneling, glass windows, and structural masonry.</p>
              <div className="health-stats-row">
                <span>Total: <strong>{furnitureComplaints.length}</strong></span>
                <span>Resolved: <strong style={{ color: '#39805d' }}>{furnitureComplaints.filter((c) => c.status === 'Resolved').length}</strong></span>
                <span>Tech Lead: <strong>Ramesh Pal</strong></span>
              </div>
            </div>
          </div>
        </section>

        {/* Urgent Escalations Queue */}
        <section className="staff-queue-card" style={{ marginTop: '28px' }}>
          <div className="queue-header">
            <div>
              <h2>
                <AlertTriangle size={18} style={{ color: '#d97706', display: 'inline', marginRight: '6px', verticalAlign: '-3px' }} />
                High Priority & Urgent Attention Queue ({urgentComplaints.length})
              </h2>
              <p>
                Infrastructure grievances flagged as <strong>Critical</strong>, <strong>High Priority</strong>, or exceeding the 48-hour SLA. Immediate dispatch required.
              </p>
            </div>
          </div>

          {urgentComplaints.length > 0 ? (
            <div className="unassigned-grid">
              {urgentComplaints.map((c) => (
                <div key={c.id} className="unassigned-task-card urgent-attention-card">
                  <div className="task-top">
                    <div>
                      <span className="task-id">{c.id}</span>
                      <span className={`urgency ${c.priority?.toLowerCase() || 'high'}`}>
                        {c.priority} Priority
                      </span>
                      {c.isOverdue && <span className="overdue-chip">OVERDUE SLA</span>}
                    </div>
                    <span className="task-time">
                      {new Date(c.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </span>
                  </div>

                  <h3>{c.title}</h3>
                  <p className="task-desc">{c.description}</p>

                  <div className="task-meta-row">
                    <span><strong>Location:</strong> {c.location || c.block}</span>
                    <span><strong>Reporter:</strong> {c.studentName || 'Student'}</span>
                    <span><strong>Assigned:</strong> {c.assignedTo || 'Unassigned'}</span>
                  </div>

                  <div className="task-actions-row">
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => onSelectComplaint(c)}
                    >
                      Inspect & Dispatch <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-queue-notice">
              <CheckCircle2 size={24} style={{ color: '#39805d' }} />
              <div>
                <strong>Zero urgent escalations!</strong>
                <p>All critical and high priority infrastructure issues are currently under control.</p>
              </div>
            </div>
          )}
        </section>

        {/* Live Operational Activity Stream */}
        <section className="admin-table-card" style={{ marginTop: '28px' }}>
          <div className="admin-table-heading">
            <div>
              <h2>Live Estate Incident Activity Log</h2>
              <p>Real-time updates, field visits, and status transitions recorded by campus personnel.</p>
            </div>
            <span className="live-label">
              <i /> Real-Time Telemetry
            </span>
          </div>

          <div className="infra-activity-timeline" style={{ padding: '8px 20px 20px' }}>
            {complaints.slice(0, 5).map((c, idx) => (
              <div key={c.id || idx} className="activity-timeline-item">
                <div className="activity-icon-bullet">
                  {c.status === 'Resolved' ? (
                    <CheckCircle2 size={15} style={{ color: '#16a34a' }} />
                  ) : c.status === 'In Progress' ? (
                    <Wrench size={15} style={{ color: '#7c3aed' }} />
                  ) : (
                    <Clock size={15} style={{ color: '#d97706' }} />
                  )}
                </div>
                <div className="activity-content">
                  <div className="activity-header-line">
                    <strong>{c.id}: {c.title}</strong>
                    <span className={`status-pill mini ${c.status.toLowerCase().replace(' ', '-')}`}>
                      {c.status}
                    </span>
                  </div>
                  <p>
                    Location: <strong>{c.location || c.block}</strong> · Category: {c.category} · Priority: {c.priority}
                  </p>
                  <small>
                    Assigned: {c.assignedTo || 'Pending Allocation'} · Last updated: {new Date(c.updatedAt || c.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </small>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  // ========================================================
  // VIEW 2: ALL INFRASTRUCTURE (Full Complaints Registry & Management Table)
  // ========================================================
  if (activeNav === 'All infrastructure') {
    return (
      <div className="role-dashboard admin-dashboard-view">
        {/* Intro Header */}
        <section className="welcome-row">
          <div>
            <div className="scope-badge-pill admin-pill">
              <Layers size={15} />
              <span>Campus Infrastructure Registry · Database Record View</span>
            </div>
            <h1 style={{ marginTop: '10px' }}>
              All Infrastructure Complaints Registry <span>✦</span>
            </h1>
            <p className="welcome-copy">
              Complete searchable database of campus-wide civil, electrical, plumbing, network, and facility grievances across all campus blocks.
            </p>
          </div>

          {onSwitchTab && (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => onSwitchTab('Infra dashboard')}
              >
                <Activity size={15} /> Infra Dashboard
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => onSwitchTab('Technician pool')}
              >
                <Users size={15} /> Technician Pool ({technicians.length})
              </button>
            </div>
          )}
        </section>

        {/* Status Count Ribbon */}
        <div className="registry-status-ribbon">
          <button
            type="button"
            className={`ribbon-pill ${filterStatus === 'All' ? 'active' : ''}`}
            onClick={() => setFilterStatus('All')}
          >
            All Complaints ({total})
          </button>
          <button
            type="button"
            className={`ribbon-pill ${filterStatus === 'Pending' ? 'active' : ''}`}
            onClick={() => setFilterStatus('Pending')}
          >
            Pending Triage ({pending})
          </button>
          <button
            type="button"
            className={`ribbon-pill ${filterStatus === 'In Progress' ? 'active' : ''}`}
            onClick={() => setFilterStatus('In Progress')}
          >
            In Progress ({inProgress})
          </button>
          <button
            type="button"
            className={`ribbon-pill ${filterStatus === 'Resolved' ? 'active' : ''}`}
            onClick={() => setFilterStatus('Resolved')}
          >
            Resolved ({resolved})
          </button>
          <button
            type="button"
            className={`ribbon-pill overdue ${filterStatus === 'Overdue' ? 'active' : ''}`}
            onClick={() => setFilterStatus('Overdue')}
          >
            Overdue SLA ({overdue})
          </button>
        </div>

        {/* Infrastructure Complaints Table Card */}
        <section className="admin-table-card" style={{ marginTop: '16px' }}>
          <div className="admin-table-heading">
            <div>
              <h2>Complaints Queue & Management Directory</h2>
              <p>Filter by block, category, priority, and date to inspect grievance details or assign technicians.</p>
            </div>
            <span className="live-label">
              Showing {visibleComplaints.length} of {total} grievances
            </span>
          </div>

          {/* Filters Bar */}
          <div className="admin-filters">
            <div className="admin-search">
              <Search size={16} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by ID, title, block, student, technician..."
              />
            </div>

            <select value={filterBlock} onChange={(e) => setFilterBlock(e.target.value)}>
              {blocks.map((b) => (
                <option key={b} value={b}>
                  {b === 'All' ? 'All Campus Blocks' : b}
                </option>
              ))}
            </select>

            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === 'All' ? 'All Categories' : c}
                </option>
              ))}
            </select>

            <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
              <option value="All">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
              <option value="Newest">Newest First</option>
              <option value="Oldest">Oldest First</option>
              <option value="Highest Priority">Highest Priority</option>
              <option value="SLA Urgency">SLA Urgency</option>
            </select>
          </div>

          {/* Table */}
          <div className="admin-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Complaint ID & Issue</th>
                  <th>Block & Location</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Assigned Technician</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleComplaints.length > 0 ? (
                  visibleComplaints.map((c) => (
                    <tr key={c.id} className={c.isOverdue ? 'overdue-row' : ''}>
                      <td>
                        <strong>{c.title}</strong>
                        <div className="table-id-row">
                          <small>{c.id}</small>
                          <span style={{ fontSize: '10px', color: '#64748b' }}>· {formatIST(c.createdAt)}</span>
                          {c.isOverdue && <span className="overdue-chip">OVERDUE</span>}
                        </div>
                      </td>
                      <td>
                        <strong>{c.block || 'Campus'}</strong>
                        <small>{c.location}</small>
                      </td>
                      <td>
                        <strong>{c.category}</strong>
                        {c.subcategory && <small>{c.subcategory}</small>}
                      </td>
                      <td>
                        <span className={`urgency ${c.priority?.toLowerCase() || 'medium'}`}>
                          {c.priority || 'Medium'}
                        </span>
                      </td>
                      <td>
                        <strong>{c.assignedTo || 'Unassigned'}</strong>
                        <small>{c.assignedDepartment || 'Estate Office'}</small>
                      </td>
                      <td>
                        <span className={`status-pill ${c.status.toLowerCase().replace(' ', '-')}`}>
                          {c.status}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="table-action-btn"
                          onClick={() => onSelectComplaint(c)}
                        >
                          Manage <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <Search size={24} />
                        <strong>No infrastructure complaints match your filters</strong>
                        <span>Try clearing keywords or adjusting the block and category selections.</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    );
  }

  // ========================================================
  // VIEW 3: TECHNICIAN POOL (On-Ground Engineering Roster & Dispatch)
  // ========================================================
  if (activeNav === 'Technician pool') {
    return (
      <div className="role-dashboard admin-dashboard-view">
        {/* Intro Header */}
        <section className="welcome-row">
          <div>
            <div className="scope-badge-pill admin-pill">
              <Users size={15} />
              <span>Campus Engineering & Field Workforce Roster</span>
            </div>
            <h1 style={{ marginTop: '10px' }}>
              Technician Pool & Workforce Dispatch <span>✦</span>
            </h1>
            <p className="welcome-copy">
              Manage on-ground technicians, track live repair workloads, and dispatch specialized staff for electricity, plumbing, HVAC, civil, and Wi-Fi issues.
            </p>
          </div>

          {onSwitchTab && (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => onSwitchTab('Infra dashboard')}
              >
                <Activity size={15} /> Infra Dashboard
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => onSwitchTab('All infrastructure')}
              >
                <FileText size={15} /> All Infrastructure ({total})
              </button>
            </div>
          )}
        </section>

        {/* Action success & error banners */}
        {actionSuccess && (
          <div className="action-success-banner" style={{ marginTop: '16px' }}>
            <CheckCircle2 size={16} />
            <span>{actionSuccess}</span>
          </div>
        )}
        {actionError && (
          <div className="action-error-banner" style={{ marginTop: '16px' }}>
            <AlertTriangle size={16} />
            <span>{actionError}</span>
          </div>
        )}

        {/* Technician Top Metrics */}
        <section className="coordinator-stats" style={{ marginTop: '20px' }}>
          <article>
            <span>Total Technicians</span>
            <strong>{technicians.length}</strong>
            <small>Active on-ground staff</small>
          </article>
          <article>
            <span>Available for Dispatch</span>
            <strong style={{ color: '#39805d' }}>
              {technicians.filter((t) => !complaints.some((c) => c.assignedTo && c.assignedTo.includes(t.name))).length}
            </strong>
            <small>Ready for urgent allocation</small>
          </article>
          <article>
            <span>Occupied on Field</span>
            <strong style={{ color: '#76549b' }}>
              {technicians.filter((t) => complaints.some((c) => c.assignedTo && c.assignedTo.includes(t.name))).length}
            </strong>
            <small>Active on repair tasks</small>
          </article>
          <article>
            <span>Unassigned Issues</span>
            <strong style={{ color: unassignedComplaints.length > 0 ? '#b27d2e' : '#39805d' }}>
              {unassignedComplaints.length}
            </strong>
            <small>Awaiting technician assignment</small>
          </article>
        </section>

        {/* SECTION 1: Unassigned Grievance Quick-Dispatch Queue */}
        {unassignedComplaints.length > 0 && (
          <section className="staff-queue-card" style={{ marginTop: '24px' }}>
            <div className="queue-header">
              <div>
                <h2>
                  Unallocated Grievances Awaiting Technician Dispatch ({unassignedComplaints.length})
                </h2>
                <p>
                  Assign these pending infrastructure issues to an available technician from the pool below.
                </p>
              </div>
            </div>

            <div className="unassigned-grid">
              {unassignedComplaints.map((c) => (
                <div key={c.id} className="unassigned-task-card">
                  <div className="task-top">
                    <div>
                      <span className="task-id">{c.id}</span>
                      <span className={`urgency ${c.priority?.toLowerCase() || 'medium'}`}>
                        {c.priority} Priority
                      </span>
                      {c.isOverdue && <span className="overdue-chip">OVERDUE</span>}
                    </div>
                    <span className="task-time">
                      {new Date(c.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </span>
                  </div>

                  <h3>{c.title}</h3>
                  <p className="task-desc">{c.description}</p>

                  <div className="task-meta-row">
                    <span><strong>Location:</strong> {c.location || c.block}</span>
                    <span><strong>Category:</strong> {c.category}</span>
                    <span><strong>Reporter:</strong> {c.studentName || 'Student'}</span>
                  </div>

                  {assigningId === c.id ? (
                    <div className="quick-assign-box">
                      <label>
                        Select Technician to Dispatch:
                        <select
                          value={selectedTechnician}
                          onChange={(e) => setSelectedTechnician(e.target.value)}
                        >
                          <option value="">-- Choose Field Technician --</option>
                          {technicians.map((t) => (
                            <option key={t.id} value={`${t.name} (${t.designation})`}>
                              {t.name} · {t.designation} [{t.category || 'General'}]
                            </option>
                          ))}
                        </select>
                      </label>

                      <label style={{ marginTop: '8px' }}>
                        Priority Level:
                        <select
                          value={priorityForModal}
                          onChange={(e) => setPriorityForModal(e.target.value)}
                        >
                          <option value="Critical">Critical (Immediate Repair)</option>
                          <option value="High">High Priority</option>
                          <option value="Medium">Medium Priority</option>
                          <option value="Low">Low Priority</option>
                        </select>
                      </label>

                      <label style={{ marginTop: '8px' }}>
                        Dispatch Remarks / Instructions:
                        <input
                          placeholder="e.g. Inspect main feeder line and replace damaged connector"
                          value={remarksForModal}
                          onChange={(e) => setRemarksForModal(e.target.value)}
                        />
                      </label>

                      <div className="quick-assign-actions">
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => setAssigningId(null)}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="primary-button"
                          onClick={() => handleDispatchTechnician(c.id)}
                        >
                          Confirm Dispatch
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="task-actions-row">
                      <button
                        type="button"
                        className="primary-button"
                        onClick={() => {
                          setAssigningId(c.id);
                          setSelectedTechnician(technicians[0] ? `${technicians[0].name} (${technicians[0].designation})` : '');
                        }}
                      >
                        <UserCheck size={14} /> Dispatch Technician
                      </button>
                      <button
                        type="button"
                        className="table-action-btn"
                        onClick={() => onSelectComplaint(c)}
                      >
                        Details <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 2: Technician Roster Cards Grid */}
        <section className="staff-roster-section" style={{ marginTop: '28px' }}>
          <div className="admin-table-heading" style={{ padding: '0 0 16px' }}>
            <div>
              <h2>Engineering & Trade Technicians Roster</h2>
              <p>On-ground specialists designated for campus infrastructure maintenance and emergency repairs.</p>
            </div>
          </div>

          {/* Trade Filter Pills */}
          <div className="roster-filter-row" style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`roster-pill-btn ${technicianFilter === 'All' ? 'active' : ''}`}
              onClick={() => setTechnicianFilter('All')}
            >
              All Technicians ({technicians.length})
            </button>
            <button
              type="button"
              className={`roster-pill-btn ${technicianFilter === 'Electrical' ? 'active' : ''}`}
              onClick={() => setTechnicianFilter('Electrical')}
            >
              <Zap size={13} style={{ marginRight: '4px' }} /> Electrical
            </button>
            <button
              type="button"
              className={`roster-pill-btn ${technicianFilter === 'Water' ? 'active' : ''}`}
              onClick={() => setTechnicianFilter('Water')}
            >
              <Droplet size={13} style={{ marginRight: '4px' }} /> Plumbing
            </button>
            <button
              type="button"
              className={`roster-pill-btn ${technicianFilter === 'HVAC' ? 'active' : ''}`}
              onClick={() => setTechnicianFilter('HVAC')}
            >
              <Wrench size={13} style={{ marginRight: '4px' }} /> HVAC & AC
            </button>
            <button
              type="button"
              className={`roster-pill-btn ${technicianFilter === 'Civil' ? 'active' : ''}`}
              onClick={() => setTechnicianFilter('Civil')}
            >
              <Building2 size={13} style={{ marginRight: '4px' }} /> Civil & Furniture
            </button>
            <button
              type="button"
              className={`roster-pill-btn ${technicianFilter === 'Internet' ? 'active' : ''}`}
              onClick={() => setTechnicianFilter('Internet')}
            >
              <Wifi size={13} style={{ marginRight: '4px' }} /> Network & Wi-Fi
            </button>
          </div>

          <div className="staff-cards-grid">
            {visibleTechnicians.map((tech) => {
              const activeTasks = complaints.filter(
                (c) => c.assignedTo && c.assignedTo.toLowerCase().includes(tech.name.toLowerCase())
              );
              const isAvailable = activeTasks.length === 0;

              return (
                <div key={tech.id} className="staff-member-card">
                  <div className="staff-card-top">
                    <div className="staff-avatar" style={{ background: '#ecfdf5', color: '#047857' }}>
                      {tech.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <strong>{tech.name}</strong>
                      <span>{tech.designation}</span>
                      <small>{tech.category || 'Infrastructure'} · Estate Office</small>
                    </div>
                    <span className={`workload-pill ${isAvailable ? 'available' : 'busy'}`}>
                      {isAvailable ? 'Available' : `${activeTasks.length} Active Task${activeTasks.length > 1 ? 's' : ''}`}
                    </span>
                  </div>

                  <div className="staff-contact-row">
                    <span title="Staff Phone">
                      <Phone size={12} /> {tech.phone || '+91 98765 00000'}
                    </span>
                    <span title="Department Email">
                      <Mail size={12} /> {tech.email || `${tech.name.toLowerCase().replace(/[^a-z]/g, '')}@campus.edu`}
                    </span>
                  </div>

                  {/* Assigned tasks preview */}
                  <div className="staff-assigned-tasks">
                    <span className="task-header-label">
                      Assigned Grievances ({activeTasks.length}):
                    </span>
                    {activeTasks.length > 0 ? (
                      <div className="staff-task-pills">
                        {activeTasks.map((task) => (
                          <button
                            key={task.id}
                            type="button"
                            className="staff-task-item"
                            onClick={() => onSelectComplaint(task)}
                            title="Click to view details & update status"
                          >
                            <strong>{task.id}</strong>
                            <span>{task.title}</span>
                            <span className={`status-pill mini ${task.status.toLowerCase().replace(' ', '-')}`}>
                              {task.status}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="no-tasks-text">No active tasks assigned. Ready for field dispatch.</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    );
  }

  // ========================================================
  // VIEW 4: CAMPUS ANALYTICS (Estate Performance Intelligence)
  // ========================================================
  if (activeNav === 'Campus analytics') {
    return (
      <div className="role-dashboard admin-dashboard-view">
        <section className="welcome-row">
          <div>
            <div className="scope-badge-pill admin-pill">
              <BarChart3 size={15} />
              <span>Estate Performance Telemetry & SLA Compliance</span>
            </div>
            <h1 style={{ marginTop: '10px' }}>
              Campus Infrastructure Analytics <span>✦</span>
            </h1>
            <p className="welcome-copy">
              Quantitative analysis of resolution turnaround times, trade bottlenecks, and facility reliability across campus.
            </p>
          </div>
        </section>

        {/* Analytics Top 4 KPIs */}
        <section className="coordinator-stats" style={{ marginTop: '20px' }}>
          <article>
            <span>Average Resolution SLA</span>
            <strong style={{ color: '#39805d' }}>~16.2 hrs</strong>
            <small>Turnaround across all categories</small>
          </article>
          <article>
            <span>On-Time Compliance</span>
            <strong style={{ color: '#2563eb' }}>95.4%</strong>
            <small>Resolved within SLA target</small>
          </article>
          <article>
            <span>First-Time Fix Rate</span>
            <strong style={{ color: '#7c3aed' }}>89.1%</strong>
            <small>Without repeat complaint</small>
          </article>
          <article>
            <span>Monitored Facilities</span>
            <strong style={{ color: '#0f172a' }}>8 Blocks</strong>
            <small>Campus-wide coverage</small>
          </article>
        </section>

        {/* Category Breakdown Table */}
        <section className="admin-table-card" style={{ marginTop: '24px' }}>
          <div className="admin-table-heading">
            <div>
              <h2>Category Resolution Speeds & Workload Distribution</h2>
              <p>Historical volume and turnaround benchmarks for each technical service category.</p>
            </div>
          </div>

          <div className="admin-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Category / Trade</th>
                  <th>Total Issues</th>
                  <th>Resolved</th>
                  <th>In Progress</th>
                  <th>Overdue</th>
                  <th>Avg. Turnaround</th>
                  <th>SLA Adherence</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>⚡ Electrical & Power</strong></td>
                  <td>{electricalComplaints.length}</td>
                  <td>{electricalComplaints.filter((c) => c.status === 'Resolved').length}</td>
                  <td>{electricalComplaints.filter((c) => c.status === 'In Progress').length}</td>
                  <td>{electricalComplaints.filter((c) => c.isOverdue).length}</td>
                  <td>~14.5 hrs</td>
                  <td><span className="status-pill resolved">96.2%</span></td>
                </tr>
                <tr>
                  <td><strong>💧 Water & Plumbing</strong></td>
                  <td>{waterComplaints.length}</td>
                  <td>{waterComplaints.filter((c) => c.status === 'Resolved').length}</td>
                  <td>{waterComplaints.filter((c) => c.status === 'In Progress').length}</td>
                  <td>{waterComplaints.filter((c) => c.isOverdue).length}</td>
                  <td>~18.0 hrs</td>
                  <td><span className="status-pill resolved">94.8%</span></td>
                </tr>
                <tr>
                  <td><strong>🌐 Network & Wi-Fi</strong></td>
                  <td>{networkComplaints.length}</td>
                  <td>{networkComplaints.filter((c) => c.status === 'Resolved').length}</td>
                  <td>{networkComplaints.filter((c) => c.status === 'In Progress').length}</td>
                  <td>{networkComplaints.filter((c) => c.isOverdue).length}</td>
                  <td>~12.2 hrs</td>
                  <td><span className="status-pill resolved">98.1%</span></td>
                </tr>
                <tr>
                  <td><strong>🪑 Civil, Doors & Furniture</strong></td>
                  <td>{furnitureComplaints.length}</td>
                  <td>{furnitureComplaints.filter((c) => c.status === 'Resolved').length}</td>
                  <td>{furnitureComplaints.filter((c) => c.status === 'In Progress').length}</td>
                  <td>{furnitureComplaints.filter((c) => c.isOverdue).length}</td>
                  <td>~22.4 hrs</td>
                  <td><span className="status-pill resolved">92.5%</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    );
  }

  // ========================================================
  // VIEW 5: MESSAGES (Dispatch Log & Notices)
  // ========================================================
  return (
    <div className="role-dashboard admin-dashboard-view">
      <section className="welcome-row">
        <div>
          <div className="scope-badge-pill admin-pill">
            <MessageSquare size={15} />
            <span>Infrastructure Dispatch & Operational Notices</span>
          </div>
          <h1 style={{ marginTop: '10px' }}>
            Estate Communications & Dispatch Notices <span>✦</span>
          </h1>
          <p className="welcome-copy">
            System broadcasts, shift handovers, and emergency maintenance notices for campus infrastructure.
          </p>
        </div>
      </section>

      <div className="admin-table-card" style={{ marginTop: '20px' }}>
        <div className="admin-table-heading">
          <div>
            <h2>Active Operational Dispatches & Announcements</h2>
            <p>Maintenance schedules, preventive inspection alerts, and technical team communications.</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px 20px 24px' }}>
          <div className="unassigned-task-card" style={{ background: '#fdfaff', borderColor: '#d8cde6' }}>
            <div className="task-top">
              <span className="task-id">DISPATCH-INFRA-101</span>
              <span className="urgency high">Scheduled Maintenance</span>
            </div>
            <h3>Quarterly Overhead Reservoir & Water Pump Inspection</h3>
            <p className="task-desc">
              All overhead tanks across Academic Block A and Gargi Hostel will undergo deep hydraulic cleaning on Saturday 6:00 AM. Backup pumps have been tested.
            </p>
            <div className="task-meta-row">
              <span><strong>Supervisor:</strong> Manoj Yadav (Plumbing Supervisor)</span>
              <span><strong>Scope:</strong> Campus Water Supply</span>
            </div>
          </div>

          <div className="unassigned-task-card" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
            <div className="task-top">
              <span className="task-id">DISPATCH-INFRA-102</span>
              <span className="urgency medium">Network Upgrade</span>
            </div>
            <h3>Campus Core Switchboard & Wi-Fi Access Points Servicing</h3>
            <p className="task-desc">
              Core switch stack rebalancing completed for Academic Block A 3rd floor. Latency drops resolved for student Wi-Fi connections.
            </p>
            <div className="task-meta-row">
              <span><strong>Lead Engineer:</strong> Amit Ghosh (Network Engineer)</span>
              <span><strong>Status:</strong> Completed & Verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
