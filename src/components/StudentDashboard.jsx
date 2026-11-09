import { useState, useMemo } from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  ChevronRight,
  ShieldCheck,
  Building2,
  Sparkles,
  MessageSquare,
  Home,
  XCircle,
  Paperclip,
} from 'lucide-react';
import { formatIST } from '../utils/timeFormat';

export const STUDENT_CATEGORIES = [
  'Classroom-related issues',
  'Electrical problems',
  'Water supply',
  'Cleaning and sanitation',
  'Furniture and classroom maintenance',
  'Internet and Wi-Fi',
  'Hostel-related issues',
  'Mess and food-related issues',
  'Other complaints',
];

export function StudentDashboard({
  user,
  complaints,
  onOpenSubmitModal,
  onSelectComplaint,
}) {
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  // Stats
  const totalCount = complaints.length;
  const pendingCount = complaints.filter((c) =>
    ['Submitted', 'Pending', 'Under Review'].includes(c.status)
  ).length;
  const inProgressCount = complaints.filter((c) =>
    ['Assigned', 'In Progress'].includes(c.status)
  ).length;
  const resolvedCount = complaints.filter((c) =>
    ['Resolved', 'Closed'].includes(c.status)
  ).length;
  const rejectedCount = complaints.filter((c) => c.status === 'Rejected').length;
  const overdueCount = complaints.filter((c) => c.isOverdue).length;

  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      const matchQuery = `${c.title} ${c.id} ${c.category} ${c.location} ${c.description}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchStatus =
        filterStatus === 'All' ||
        (filterStatus === 'Pending' && ['Submitted', 'Pending', 'Under Review'].includes(c.status)) ||
        (filterStatus === 'In Progress' && ['Assigned', 'In Progress'].includes(c.status)) ||
        c.status === filterStatus;
      const matchCat = filterCategory === 'All' || c.category === filterCategory;
      return matchQuery && matchStatus && matchCat;
    });
  }, [complaints, searchQuery, filterStatus, filterCategory]);

  const currentDate = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="role-dashboard student-dashboard-view">
      {/* Welcome Row */}
      <section className="welcome-row">
        <div>
          <p className="eyebrow">{currentDate}</p>
          <h1>
            Good day, {user.name} <span>✦</span>
          </h1>
          <p className="welcome-copy">
            Student Portal · {user.department || 'Undergraduate'} · Roll No: <strong>{user.collegeId}</strong>
            {user.hostel && <> · {user.hostel}</>}
          </p>
        </div>
        <button className="primary-button" onClick={onOpenSubmitModal}>
          <Plus size={18} /> Submit New Complaint
        </button>
      </section>

      {/* Statistics Cards */}
      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-top">
            <span className="stat-icon plum">
              <FileText size={18} />
            </span>
            <span className="trend neutral">{pendingCount} in queue</span>
          </div>
          <strong>{totalCount}</strong>
          <span>Total Lodged Issues</span>
          <div className="mini-bars">
            <i /><i /><i /><i /><i /><i /><i />
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-top">
            <span className="stat-icon yellow">
              <Clock size={18} />
            </span>
            <span className="trend up">{inProgressCount} active</span>
          </div>
          <strong>{pendingCount + inProgressCount}</strong>
          <span>Pending & In Progress</span>
          <div className="mini-bars yellow-bars">
            <i /><i /><i /><i /><i /><i /><i />
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-top">
            <span className="stat-icon green">
              <CheckCircle2 size={18} />
            </span>
            <span className="trend up">
              {totalCount > 0 ? `${Math.round((resolvedCount / totalCount) * 100)}%` : '100%'}
            </span>
          </div>
          <strong>{resolvedCount}</strong>
          <span>Resolved Issues</span>
          <div className="progress-line">
            <i style={{ width: totalCount > 0 ? `${(resolvedCount / totalCount) * 100}%` : '0%' }} />
          </div>
        </article>
      </section>

      {/* Overdue alert if any */}
      {overdueCount > 0 && (
        <section className="overdue-banner">
          <AlertTriangle size={18} />
          <div>
            <strong>Attention: {overdueCount} of your complaints have exceeded the 48-hour SLA.</strong>
            <span>
              The system has flagged them as overdue for prioritized administrative action.
            </span>
          </div>
        </section>
      )}

      {/* Main Content Grid: Complaints List + Campus Updates Rail */}
      <section className="content-grid">
        <div className="complaint-section">
          <div className="section-heading">
            <div>
              <h2>My Submitted Complaints</h2>
              <p>Track your issues through review, assignment, execution, and final resolution.</p>
            </div>
            <span className="live-label">
              <i /> Live Sync
            </span>
          </div>

          {/* Filter Bar */}
          <div className="filter-row">
            {['All', 'Pending', 'In Progress', 'Resolved', 'Rejected'].map((statusOption) => (
              <button
                key={statusOption}
                className={filterStatus === statusOption ? 'selected' : ''}
                onClick={() => setFilterStatus(statusOption)}
              >
                {statusOption}
              </button>
            ))}

            <select
              className="category-filter-select"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              {STUDENT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <div className="filter-search">
              <Search size={15} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search issues..."
              />
            </div>
          </div>

          {/* Complaints List */}
          <div className="complaints-list">
            {filteredComplaints.length > 0 ? (
              filteredComplaints.map((c) => (
                <article
                  key={c.id}
                  className="complaint-row"
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectComplaint(c)}
                  onKeyDown={(e) => e.key === 'Enter' && onSelectComplaint(c)}
                >
                  <div className="complaint-main">
                    <div className={`status-dot ${c.status.toLowerCase().replace(' ', '-')}`} />
                    <div>
                      <div className="complaint-title">
                        <h3>{c.title}</h3>
                        <span className={`urgency ${c.priority?.toLowerCase() || 'medium'}`}>
                          {c.priority || 'Medium'}
                        </span>
                        {c.isOverdue && <span className="overdue-chip">OVERDUE</span>}
                      </div>
                      <div className="complaint-meta">
                        <span>{c.id}</span>
                        <i />
                        <span>{c.category}</span>
                        <i />
                        <span>{c.location}</span>
                        <i />
                        <span>Lodged: {formatIST(c.createdAt)}</span>
                        {c.assignedTo && (
                          <>
                            <i />
                            <span>Staff: {c.assignedTo}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="complaint-end">
                    <span className={`status-pill ${c.status.toLowerCase().replace(' ', '-')}`}>
                      {c.status}
                    </span>
                    <button
                      className="view-details"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectComplaint(c);
                      }}
                    >
                      View Details & Workflow <ChevronRight size={14} />
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-state">
                <Search size={24} />
                <strong>No complaints found</strong>
                <span>
                  {complaints.length === 0
                    ? 'You have not submitted any complaints yet. Click "Submit New Complaint" above.'
                    : 'Try adjusting your search terms or filters.'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Rail Updates */}
        <aside className="right-rail">
          <div className="rail-heading">
            <h2>Campus Announcements</h2>
            <button className="more-button">•••</button>
          </div>

          <div className="update-card">
            <div className="update-tag">
              <span /> Facilities Desk
            </div>
            <h3>Water Tank Cleaning & Pressure Testing</h3>
            <p>Maintenance scheduled for Academic Block A & Girls Hostel on Saturday 10 AM to 2 PM.</p>
            <small>Notice issued today</small>
          </div>

          <div className="update-card lavender">
            <div className="update-tag">
              <span /> Mess Committee
            </div>
            <h3>Special Festive Dining Menu</h3>
            <p>Student mess committee approved weekend special dietary additions and fresh fruit bar.</p>
            <small>Updated yesterday</small>
          </div>

          <div className="help-card">
            <div className="help-illustration">
              <ShieldCheck size={22} />
            </div>
            <div>
              <strong>Quick Resolution Guarantee</strong>
              <p>Standard complaints are addressed within 48 hours. Urgent issues are flagged to HOD & Wardens.</p>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
