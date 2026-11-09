import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Users,
  ChevronRight,
  ShieldCheck,
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  BarChart3,
  Calendar,
  FileText,
} from 'lucide-react';
import { formatIST } from '../utils/timeFormat';

export function CoordinatorDashboardView({
  user,
  complaints,
  onSelectComplaint,
  onSwitchTab,
}) {
  const [query, setQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [sortOrder, setSortOrder] = useState('Newest');

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

  const categories = useMemo(() => {
    return ['All', ...new Set(complaints.map((c) => c.category).filter(Boolean))];
  }, [complaints]);

  const visibleComplaints = useMemo(() => {
    return complaints
      .filter((c) => {
        const text = `${c.title} ${c.id} ${c.location} ${c.studentName || ''} ${c.description}`.toLowerCase();
        const matchesQuery = text.includes(query.toLowerCase());
        const matchesCat = filterCategory === 'All' || c.category === filterCategory;
        const matchesStatus =
          filterStatus === 'All' ||
          (filterStatus === 'Pending' && ['Submitted', 'Pending', 'Under Review'].includes(c.status)) ||
          (filterStatus === 'In Progress' && ['Assigned', 'In Progress'].includes(c.status)) ||
          c.status === filterStatus;
        const matchesPriority = filterPriority === 'All' || c.priority === filterPriority;
        return matchesQuery && matchesCat && matchesStatus && matchesPriority;
      })
      .sort((a, b) => {
        if (sortOrder === 'Oldest') return (a.createdAt || 0) - (b.createdAt || 0);
        if (sortOrder === 'Highest Priority') {
          const map = { Critical: 4, High: 3, Medium: 2, Low: 1 };
          return (map[b.priority] || 0) - (map[a.priority] || 0);
        }
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
  }, [complaints, query, filterCategory, filterStatus, filterPriority, sortOrder]);

  return (
    <div className="role-dashboard coordinator-dashboard-view">
      {/* Intro & Scope Badge */}
      <section className="welcome-row">
        <div>
          <div className="scope-badge-pill">
            <Building2 size={15} />
            <span>
              Authorized Departmental Scope: <strong>{user.assignedDepartment || 'Information Technology'}</strong> · Assigned Block: <strong>{user.assignedBlock || 'Academic Block A'}</strong>
            </span>
          </div>
          <h1 style={{ marginTop: '10px' }}>
            HOD Console <span>✦</span>
          </h1>
          <p className="welcome-copy">
            Welcome, {user.name} ({user.title || 'HOD'}). Review and action student complaints exclusively within your assigned block and academic department.
          </p>
        </div>

        {onSwitchTab && (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="secondary-button"
              onClick={() => onSwitchTab('Block complaints')}
            >
              <FileText size={15} /> Open Block Complaints ({total})
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={() => onSwitchTab('Staff assignments')}
            >
              <Users size={15} /> Staff & Self-Assignments
            </button>
          </div>
        )}
      </section>

      {/* Coordinator Stats Grid */}
      <section className="coordinator-stats">
        <article>
          <span>Total Complaints</span>
          <strong>{total}</strong>
          <small>In {user.assignedBlock || 'Academic Block A'}</small>
        </article>
        <article>
          <span>Pending Review</span>
          <strong style={{ color: '#b27d2e' }}>{pending}</strong>
          <small>Awaiting HOD / Staff action</small>
        </article>
        <article>
          <span>In Progress</span>
          <strong style={{ color: '#76549b' }}>{inProgress}</strong>
          <small>Active staff repairs</small>
        </article>
        <article>
          <span>Resolved</span>
          <strong style={{ color: '#39805d' }}>{resolved}</strong>
          <small>Completed issues</small>
        </article>
        <article className={overdue > 0 ? 'overdue-stat-card' : ''}>
          <span>Overdue (&gt; 48h)</span>
          <strong style={{ color: overdue > 0 ? '#b14d4d' : '#9a9296' }}>{overdue}</strong>
          <small>{overdue > 0 ? 'Exceeded SLA turnaround' : 'All within SLA'}</small>
        </article>
      </section>

      {/* Main Table Card */}
      <section className="admin-table-card">
        <div className="admin-table-heading">
          <div>
            <h2>Block & Department Grievances Table</h2>
            <p>
              Search, filter, assign departmental staff, update progress, and record final resolutions.
            </p>
          </div>
          <span className="live-label">
            <i /> Block Guard: {user.assignedBlock || 'Block A'}
          </span>
        </div>

        {/* Filter Toolbar */}
        <div className="admin-filters">
          <div className="admin-search">
            <Search size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by ID, title, student name, room..."
            />
          </div>

          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'All' ? 'All Categories' : c}
              </option>
            ))}
          </select>

          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="All">All Statuses</option>
            <option value="Pending">Pending (Submitted/Review)</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Rejected">Rejected</option>
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
          </select>
        </div>

        {/* Table View */}
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Complaint ID & Title</th>
                <th>Student Details</th>
                <th>Category & Location</th>
                <th>Priority</th>
                <th>Assigned Staff</th>
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
                      <strong>{c.studentName || 'Student'}</strong>
                      <small>{c.studentCollegeId || c.studentEmail || 'N/A'}</small>
                    </td>
                    <td>
                      <strong>{c.category}</strong>
                      <small>{c.location}</small>
                    </td>
                    <td>
                      <span className={`urgency ${c.priority?.toLowerCase() || 'medium'}`}>
                        {c.priority || 'Medium'}
                      </span>
                    </td>
                    <td>
                      <strong>{c.assignedTo || 'Unassigned'}</strong>
                      <small>{c.assignedDepartment || 'Pending'}</small>
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
                        Action <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <Search size={24} />
                      <strong>No complaints match your criteria</strong>
                      <span>
                        {complaints.length === 0
                          ? `No complaints filed for ${user.assignedBlock || 'your block'} yet.`
                          : 'Try modifying filters or search query.'}
                      </span>
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
