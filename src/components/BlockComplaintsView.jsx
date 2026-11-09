import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Users,
  ChevronRight,
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Layers,
  ArrowUpDown,
  UserCheck,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export function BlockComplaintsView({
  user,
  complaints,
  onSelectComplaint,
  onSwitchTab,
}) {
  const [query, setQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterRoom, setFilterRoom] = useState('All');
  const [sortOrder, setSortOrder] = useState('Newest');

  // Block metrics
  const total = complaints.length;
  const pending = complaints.filter((c) =>
    ['Submitted', 'Pending', 'Under Review'].includes(c.status)
  ).length;
  const unassigned = complaints.filter((c) => !c.assignedTo).length;
  const inProgress = complaints.filter((c) =>
    ['Assigned', 'In Progress'].includes(c.status)
  ).length;
  const resolved = complaints.filter((c) =>
    ['Resolved', 'Closed'].includes(c.status)
  ).length;
  const overdue = complaints.filter((c) => c.isOverdue).length;

  // Extract distinct categories & locations in this block
  const categories = useMemo(() => {
    return ['All', ...new Set(complaints.map((c) => c.category).filter(Boolean))];
  }, [complaints]);

  const rooms = useMemo(() => {
    const list = complaints
      .map((c) => c.location || c.roomNumber || '')
      .filter(Boolean);
    return ['All', ...new Set(list)];
  }, [complaints]);

  // Filtered complaints
  const visibleComplaints = useMemo(() => {
    return complaints
      .filter((c) => {
        const text = `${c.title} ${c.id} ${c.location} ${c.studentName || ''} ${c.description} ${c.assignedTo || ''}`.toLowerCase();
        const matchesQuery = text.includes(query.toLowerCase());
        const matchesCat = filterCategory === 'All' || c.category === filterCategory;
        const matchesStatus =
          filterStatus === 'All' ||
          (filterStatus === 'Unassigned' && !c.assignedTo) ||
          (filterStatus === 'Pending' && ['Submitted', 'Pending', 'Under Review'].includes(c.status)) ||
          (filterStatus === 'In Progress' && ['Assigned', 'In Progress'].includes(c.status)) ||
          (filterStatus === 'Overdue' && c.isOverdue) ||
          c.status === filterStatus;
        const matchesPriority = filterPriority === 'All' || c.priority === filterPriority;
        const matchesRoom =
          filterRoom === 'All' ||
          (c.location && c.location.toLowerCase().includes(filterRoom.toLowerCase())) ||
          (c.roomNumber && c.roomNumber.toLowerCase().includes(filterRoom.toLowerCase()));

        return matchesQuery && matchesCat && matchesStatus && matchesPriority && matchesRoom;
      })
      .sort((a, b) => {
        if (sortOrder === 'Oldest') return (a.createdAt || 0) - (b.createdAt || 0);
        if (sortOrder === 'Highest Priority') {
          const map = { Critical: 4, High: 3, Medium: 2, Low: 1 };
          return (map[b.priority] || 0) - (map[a.priority] || 0);
        }
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
  }, [complaints, query, filterCategory, filterStatus, filterPriority, filterRoom, sortOrder]);

  return (
    <div className="role-dashboard block-complaints-view">
      {/* Header Info */}
      <section className="welcome-row">
        <div>
          <div className="scope-badge-pill">
            <Building2 size={15} />
            <span>
              Authorized Departmental Scope: <strong>{user.assignedDepartment || 'Information Technology'}</strong> · Assigned Block: <strong>{user.assignedBlock || 'Academic Block A'}</strong>
            </span>
          </div>
          <h1 style={{ marginTop: '10px' }}>
            Block Complaints Register <span>✦</span>
          </h1>
          <p className="welcome-copy">
            Complete registry of student and faculty grievances filed within <strong>{user.assignedBlock || 'Academic Block A'}</strong>. Review, inspect locations, and assign departmental staff.
          </p>
        </div>

        {onSwitchTab && (
          <button
            type="button"
            className="primary-button"
            onClick={() => onSwitchTab('Staff assignments')}
          >
            <Users size={16} /> Manage Staff Assignments
          </button>
        )}
      </section>

      {/* Block Information Cards */}
      <section className="coordinator-stats" style={{ marginTop: '22px' }}>
        <article>
          <span>Total In Block</span>
          <strong>{total}</strong>
          <small>{user.assignedBlock || 'Academic Block A'}</small>
        </article>
        <article>
          <span>Unassigned</span>
          <strong style={{ color: unassigned > 0 ? '#b27d2e' : '#39805d' }}>
            {unassigned}
          </strong>
          <small>Awaiting staff dispatch</small>
        </article>
        <article>
          <span>Active Repairs</span>
          <strong style={{ color: '#76549b' }}>{inProgress}</strong>
          <small>In Progress / Assigned</small>
        </article>
        <article className={overdue > 0 ? 'overdue-stat-card' : ''}>
          <span>Overdue SLA (&gt;48h)</span>
          <strong style={{ color: overdue > 0 ? '#b14d4d' : '#9a9296' }}>{overdue}</strong>
          <small>{overdue > 0 ? 'Urgent attention required' : 'All within SLA'}</small>
        </article>
      </section>

      {/* Quick Status Filter Tabs */}
      <div className="block-filter-chips">
        <button
          type="button"
          className={`filter-chip ${filterStatus === 'All' ? 'active' : ''}`}
          onClick={() => setFilterStatus('All')}
        >
          All Complaints ({total})
        </button>
        <button
          type="button"
          className={`filter-chip ${filterStatus === 'Unassigned' ? 'active' : ''}`}
          onClick={() => setFilterStatus('Unassigned')}
        >
          ⚠️ Unassigned ({unassigned})
        </button>
        <button
          type="button"
          className={`filter-chip ${filterStatus === 'In Progress' ? 'active' : ''}`}
          onClick={() => setFilterStatus('In Progress')}
        >
          ⚙️ In Progress ({inProgress})
        </button>
        {overdue > 0 && (
          <button
            type="button"
            className={`filter-chip alert ${filterStatus === 'Overdue' ? 'active' : ''}`}
            onClick={() => setFilterStatus('Overdue')}
          >
            🚨 Overdue SLA ({overdue})
          </button>
        )}
        <button
          type="button"
          className={`filter-chip ${filterStatus === 'Resolved' ? 'active' : ''}`}
          onClick={() => setFilterStatus('Resolved')}
        >
          ✓ Resolved ({resolved})
        </button>
      </div>

      {/* Main Table Card */}
      <section className="admin-table-card" style={{ marginTop: '18px' }}>
        <div className="admin-table-heading">
          <div>
            <h2>{user.assignedBlock || 'Academic Block A'} Complaints Table</h2>
            <p>
              Showing {visibleComplaints.length} of {total} grievances matching current filters.
            </p>
          </div>
          <span className="live-label">
            <i /> Block Guard: {user.assignedBlock || 'Academic Block A'}
          </span>
        </div>

        {/* Filter Toolbar */}
        <div className="admin-filters">
          <div className="admin-search">
            <Search size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by ID, title, student, room..."
            />
          </div>

          <select value={filterRoom} onChange={(e) => setFilterRoom(e.target.value)}>
            <option value="All">All Rooms / Labs</option>
            {rooms.filter((r) => r !== 'All').map((r) => (
              <option key={r} value={r}>
                {r}
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
          </select>
        </div>

        {/* Table View */}
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Complaint ID & Title</th>
                <th>Student Details</th>
                <th>Location & Category</th>
                <th>Priority</th>
                <th>Staff Assignment</th>
                <th>Status</th>
                <th>Action</th>
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
                        {c.isOverdue && <span className="overdue-chip">OVERDUE</span>}
                      </div>
                    </td>
                    <td>
                      <strong>{c.studentName || 'Student'}</strong>
                      <small>{c.studentCollegeId || c.studentEmail || 'N/A'}</small>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <MapPin size={12} style={{ color: '#9a9296' }} />
                        <strong>{c.location || c.roomNumber || user.assignedBlock}</strong>
                      </div>
                      <small>{c.category}</small>
                    </td>
                    <td>
                      <span className={`urgency ${c.priority?.toLowerCase() || 'medium'}`}>
                        {c.priority || 'Medium'}
                      </span>
                    </td>
                    <td>
                      {c.assignedTo ? (
                        <>
                          <strong>{c.assignedTo}</strong>
                          <small>{c.assignedDepartment || 'Department Staff'}</small>
                        </>
                      ) : (
                        <span className="unassigned-pill">
                          ⚠️ Needs Assignment
                        </span>
                      )}
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
                      <strong>No block complaints match the selected filters</strong>
                      <span>Modify your search query or reset filters above.</span>
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
