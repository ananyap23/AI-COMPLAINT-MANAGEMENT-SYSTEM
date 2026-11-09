import { useState, useMemo, useEffect } from 'react';
import {
  Utensils,
  Search,
  Filter,
  Users,
  ChevronRight,
  ShieldCheck,
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Home,
  Coffee,
  Sparkles,
  Droplet,
  Zap,
  Activity,
  BarChart3,
  Calendar,
  Phone,
  Mail,
  Check,
  ArrowRight,
  MessageSquare,
  FileText,
  UserCheck,
} from 'lucide-react';
import { api } from '../services/api';
import { formatIST } from '../utils/timeFormat';

export const HOSTEL_MESS_FILTER_CATEGORIES = [
  'All',
  'Hostel-related issues',
  'Mess and food-related issues',
  'Food quality',
  'Food hygiene',
  'Mess timing',
  'Drinking water',
  'Hostel room maintenance',
  'Washroom cleaning',
  'Electricity in hostel',
  'Water supply in hostel',
  'Wi-Fi in hostel',
  'Other hostel-related issues',
];

export function HostelMessDashboardView({
  user,
  complaints = [],
  activeNav = 'Hostel desk',
  onSwitchTab,
  onSelectComplaint,
  onComplaintUpdated,
}) {
  // Common search and filters
  const [query, setQuery] = useState('');
  const [filterHostel, setFilterHostel] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [sortOrder, setSortOrder] = useState('Newest');

  // Warden staff states
  const [assigningId, setAssigningId] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [priorityForModal, setPriorityForModal] = useState('High');
  const [remarksForModal, setRemarksForModal] = useState('');
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);

  // Messages states
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastCategory, setBroadcastCategory] = useState('Mess Update');
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);
  const [selectedFacilityFilter, setSelectedFacilityFilter] = useState('All');

  // Dedicated Warden & Residential Staff Roster
  const wardenStaffRoster = [
    {
      id: 'hm-stf-1',
      name: 'Sunita Verma',
      designation: 'Chief Warden & Residential Director',
      department: 'Hostel & Mess Management',
      category: 'Executive Oversight',
      email: 'hostel.mess@campus.edu',
      phone: '+91 98765 33001',
      dutyHours: '08:00 AM - 08:00 PM',
      shift: 'Day Shift (On Call)',
      status: 'On Duty',
      experience: '12 Years',
      responsibilities: 'Overall residential governance, emergency escalations, mess food vendor quality audits, discipline.',
    },
    {
      id: 'hm-stf-2',
      name: 'Rameshwar Prasad',
      designation: 'Senior Caretaker (Vikram & Tagore Hostels)',
      department: 'Hostel Management',
      category: 'Room Maintenance',
      email: 'rameshwar.p@campus.edu',
      phone: '+91 98765 33002',
      dutyHours: '07:00 AM - 03:00 PM',
      shift: 'Morning Shift',
      status: 'On Duty',
      experience: '9 Years',
      responsibilities: 'Room allotments, key registers, furniture repairs, corridor lighting, door lock replacements.',
    },
    {
      id: 'hm-stf-3',
      name: 'Meenakshi Sundaram',
      designation: 'Food Safety & Dining Quality Supervisor',
      department: 'Mess Management',
      category: 'Food Quality',
      email: 'meenakshi.s@campus.edu',
      phone: '+91 98765 33003',
      dutyHours: '06:30 AM - 09:30 PM',
      shift: 'Meal Inspection Hours',
      status: 'On Duty',
      experience: '8 Years',
      responsibilities: 'Daily raw material inspection, steam kitchen hygiene, student dietary complaints, menu adherence.',
    },
    {
      id: 'hm-stf-4',
      name: 'Dilip Sen',
      designation: 'Residential Electrician & Plumbing Specialist',
      department: 'Hostel Utilities',
      category: 'Water & Electricity',
      email: 'dilip.sen@campus.edu',
      phone: '+91 98765 33004',
      dutyHours: '09:00 AM - 06:00 PM',
      shift: 'General Duty',
      status: 'On Duty',
      experience: '11 Years',
      responsibilities: 'Water heater (geyser) repairs, water cooler maintenance, motor pumps, room switchboards.',
    },
    {
      id: 'hm-stf-5',
      name: 'Savitri Devi',
      designation: 'Hostel Housekeeping & Sanitation Head',
      department: 'Sanitation',
      category: 'Hygiene & Cleanliness',
      email: 'savitri.d@campus.edu',
      phone: '+91 98765 33005',
      dutyHours: '06:00 AM - 02:00 PM',
      shift: 'Early Morning Sanitation',
      status: 'On Duty',
      experience: '7 Years',
      responsibilities: 'Daily washroom disinfection, garbage clearance, dining hall mopping, pest control coordination.',
    },
  ];

  // Official Hostel Notices list
  const [hostelNotices, setHostelNotices] = useState([
    {
      id: 'notif-hm-1',
      title: 'Hostel Overhead Water Tank Disinfection Schedule',
      category: 'Water Supply Advisory',
      date: 'Today, 10:30 AM',
      author: 'Sunita Verma (Chief Warden)',
      priority: 'Important',
      body: 'Quarterly chemical cleaning and UV sterilization of overhead tanks in Gargi & Vikram hostels is scheduled this Saturday between 9:00 AM and 1:00 PM. Alternate ground reservoir supply will remain active for essential needs.',
    },
    {
      id: 'notif-hm-2',
      title: 'Monthly Mess Menu Revisions (Based on Student Feedback)',
      category: 'Dining Committee',
      date: 'Yesterday, 04:15 PM',
      author: 'Meenakshi Sundaram (Food Safety Officer)',
      priority: 'Update',
      body: 'Following the Student Mess Committee review meeting, breakfast menu has been upgraded to include high-protein options and fresh seasonal fruit. Weekend dinner timings extended by 30 minutes.',
    },
    {
      id: 'notif-hm-3',
      title: 'Electrical Safety Advisory · High-Wattage Rods Restricted',
      category: 'Safety Compliance',
      date: '28 Oct 2026',
      author: 'Dilip Sen (Residential Utilities)',
      priority: 'Urgent',
      body: 'Residents are reminded that immersion heating rods cause severe circuit breaker trips and fire hazards. Solar geysers are operational 24/7 in all wings. Unregistered appliances found during routine inspection will be confiscated.',
    },
  ]);

  // Overall Stats
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

  const hostels = useMemo(() => {
    return ['All', 'Gargi Hostel', 'Vikram Hostel', 'Tagore Hostel', 'Main Dining Hall / Mess'];
  }, []);

  // Filtered complaints for default queue
  const visibleComplaints = useMemo(() => {
    return complaints
      .filter((c) => {
        const text = `${c.title} ${c.id} ${c.location} ${c.block || ''} ${c.category} ${c.roomNumber || ''} ${c.description}`.toLowerCase();
        const matchesQuery = text.includes(query.toLowerCase());
        const matchesHostel =
          filterHostel === 'All' ||
          (c.block && c.block.toLowerCase().includes(filterHostel.toLowerCase())) ||
          (c.location && c.location.toLowerCase().includes(filterHostel.toLowerCase()));
        const matchesCat =
          filterCategory === 'All' ||
          c.category === filterCategory ||
          c.subcategory === filterCategory;
        const matchesStatus =
          filterStatus === 'All' ||
          (filterStatus === 'Pending' && ['Submitted', 'Pending', 'Under Review'].includes(c.status)) ||
          (filterStatus === 'In Progress' && ['Assigned', 'In Progress'].includes(c.status)) ||
          c.status === filterStatus;
        const matchesPriority = filterPriority === 'All' || c.priority === filterPriority;
        return matchesQuery && matchesHostel && matchesCat && matchesStatus && matchesPriority;
      })
      .sort((a, b) => {
        if (sortOrder === 'Oldest') return (a.createdAt || 0) - (b.createdAt || 0);
        if (sortOrder === 'Highest Priority') {
          const map = { Critical: 4, High: 3, Medium: 2, Low: 1 };
          return (map[b.priority] || 0) - (map[a.priority] || 0);
        }
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
  }, [complaints, query, filterHostel, filterCategory, filterStatus, filterPriority, sortOrder]);

  // Urgent Complaints (Critical, High, or Overdue)
  const urgentComplaints = useMemo(() => {
    return complaints.filter(
      (c) =>
        c.isOverdue ||
        c.priority === 'Critical' ||
        (c.priority === 'High' && c.status !== 'Resolved' && c.status !== 'Closed')
    );
  }, [complaints]);

  // Unassigned Complaints for Warden Assignments view
  const unassignedComplaints = useMemo(() => {
    return complaints.filter(
      (c) =>
        (!c.assignedTo || c.assignedTo === 'Unassigned' || c.status === 'Submitted' || c.status === 'Pending') &&
        c.status !== 'Resolved' &&
        c.status !== 'Closed' &&
        c.status !== 'Rejected'
    );
  }, [complaints]);

  // Handle live staff assignment
  async function handleConfirmAssign(complaintId) {
    if (!selectedStaff) {
      setActionError('Please select a staff member or caretaker from the roster.');
      return;
    }
    const staffObj = wardenStaffRoster.find((s) => s.name === selectedStaff);
    try {
      const updated = await api.assignStaff(complaintId, {
        staffName: selectedStaff,
        department: staffObj?.department || 'Hostel & Mess Management',
        priority: priorityForModal,
        remarks: remarksForModal || `Assigned to ${selectedStaff} by Chief Warden`,
      });
      if (onComplaintUpdated) onComplaintUpdated(updated);
      setActionSuccess(`Assigned ${complaintId} to ${selectedStaff} successfully!`);
      setAssigningId(null);
      setSelectedStaff('');
      setRemarksForModal('');
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      setActionError(err.message || 'Failed to assign staff member.');
    }
  }

  // Handle broadcast post
  function handlePostBroadcast(e) {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) return;
    const newNotice = {
      id: `notif-hm-${Date.now()}`,
      title: broadcastTitle,
      category: broadcastCategory,
      date: 'Just now',
      author: `${user.name} (Hostel Office)`,
      priority: 'Broadcast',
      body: broadcastMessage,
    };
    setHostelNotices([newNotice, ...hostelNotices]);
    setBroadcastTitle('');
    setBroadcastMessage('');
    setBroadcastSuccess(true);
    setTimeout(() => setBroadcastSuccess(false), 4000);
  }

  // ========================================================
  // SUB-VIEW 2: DINING & ROOMS (FACILITIES REGISTRY)
  // ========================================================
  if (activeNav === 'Dining & rooms') {
    const facilities = [
      {
        id: 'fac-1',
        name: 'Central Dining Hall & Kitchen',
        type: 'Dining & Food Services',
        capacity: '1,200 Meals per Session',
        supervisor: 'Meenakshi Sundaram',
        status: 'Operational',
        rating: '4.8 / 5.0',
        breakfastStatus: 'Passed (96% hygiene)',
        lunchStatus: 'Passed (94% hygiene)',
        dinnerStatus: 'Scheduled · 7:30 PM',
        openIssues: complaints.filter(
          (c) =>
            c.category?.toLowerCase().includes('food') ||
            c.category?.toLowerCase().includes('mess')
        ).length,
      },
      {
        id: 'fac-2',
        name: 'Gargi Girls Hostel (Blocks A, B, C)',
        type: 'Residential Wing',
        capacity: '450 Residents · Rooms 101 - 420',
        supervisor: 'Sunita Verma',
        status: 'Operational',
        rating: '4.7 / 5.0',
        breakfastStatus: 'RO Water Active',
        lunchStatus: 'Inverter Backup Operational',
        dinnerStatus: 'Wi-Fi Mesh Online',
        openIssues: complaints.filter(
          (c) => c.block?.includes('Gargi') || c.location?.includes('Gargi')
        ).length,
      },
      {
        id: 'fac-3',
        name: 'Vikram Boys Hostel (Wings 1 & 2)',
        type: 'Residential Wing',
        capacity: '600 Residents · Rooms 101 - 512',
        supervisor: 'Rameshwar Prasad',
        status: 'Operational',
        rating: '4.6 / 5.0',
        breakfastStatus: 'Solar Geysers Active',
        lunchStatus: 'Washroom Shift 2 Complete',
        dinnerStatus: 'Water Tank Full',
        openIssues: complaints.filter(
          (c) => c.block?.includes('Vikram') || c.location?.includes('Vikram')
        ).length,
      },
      {
        id: 'fac-4',
        name: 'Tagore Postgraduate Scholars Hostel',
        type: 'Single Occupancy Living',
        capacity: '280 Scholars · Single Rooms',
        supervisor: 'Rameshwar Prasad',
        status: 'Operational',
        rating: '4.9 / 5.0',
        breakfastStatus: 'Study Hall AC Online',
        lunchStatus: 'Fiber LAN Active',
        dinnerStatus: 'Night Access Enabled',
        openIssues: complaints.filter(
          (c) => c.block?.includes('Tagore') || c.location?.includes('Tagore')
        ).length,
      },
    ];

    const facilityComplaints = complaints.filter((c) => {
      if (selectedFacilityFilter === 'All') return true;
      return (
        (c.block && c.block.toLowerCase().includes(selectedFacilityFilter.toLowerCase())) ||
        (c.location && c.location.toLowerCase().includes(selectedFacilityFilter.toLowerCase())) ||
        (c.category && c.category.toLowerCase().includes(selectedFacilityFilter.toLowerCase()))
      );
    });

    return (
      <div className="role-dashboard hostel-facilities-view">
        <section className="welcome-row">
          <div>
            <div className="scope-badge-pill hostel-pill">
              <Utensils size={15} />
              <span>Campus Facilities Audit · Residential Infrastructure & Dining Halls</span>
            </div>
            <h1 style={{ marginTop: '10px' }}>
              Hostel & Dining Facility Registry <span>✦</span>
            </h1>
            <p className="welcome-copy">
              Real-time monitoring of campus residential blocks, central dining hall meal inspections, RO water purity, and student room upkeep.
            </p>
          </div>
        </section>

        {/* 4 Facility Overview Cards */}
        <div className="infra-category-strip" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginTop: '20px' }}>
          {facilities.map((fac) => (
            <div
              key={fac.id}
              className="infra-health-card"
              style={{
                cursor: 'pointer',
                border: selectedFacilityFilter === fac.name.split(' ')[0] ? '2px solid #059669' : '1px solid var(--line)',
              }}
              onClick={() =>
                setSelectedFacilityFilter((prev) =>
                  prev === fac.name.split(' ')[0] ? 'All' : fac.name.split(' ')[0]
                )
              }
            >
              <div className="health-card-top">
                <div className="health-icon-box" style={{ background: '#ecfdf5', color: '#059669' }}>
                  <Building2 size={20} />
                </div>
                <span className="health-status-badge normal">{fac.status}</span>
              </div>
              <h3 style={{ fontSize: '14px', marginTop: '6px' }}>{fac.name}</h3>
              <p style={{ fontSize: '11px', color: '#64748b' }}>{fac.capacity}</p>

              <div style={{ marginTop: '10px', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>
                  <strong>Supervisor:</strong> {fac.supervisor}
                </div>
                <div>
                  <strong>Inspection:</strong> <span style={{ color: '#059669' }}>{fac.breakfastStatus}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
                  <span>Active Issues:</span>
                  <strong style={{ color: fac.openIssues > 0 ? '#b91c1c' : '#059669' }}>
                    {fac.openIssues} reports
                  </strong>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Facility Specific Complaints Queue */}
        <section className="admin-table-card" style={{ marginTop: '24px' }}>
          <div className="admin-table-heading">
            <div>
              <h2>Facility Inspection & Maintenance Log</h2>
              <p>
                Showing residential and mess records for: <strong>{selectedFacilityFilter === 'All' ? 'All Hostels & Dining Hall' : selectedFacilityFilter}</strong>
              </p>
            </div>
            {selectedFacilityFilter !== 'All' && (
              <button
                type="button"
                className="table-action-btn"
                onClick={() => setSelectedFacilityFilter('All')}
              >
                Clear Facility Filter
              </button>
            )}
          </div>

          <div className="admin-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Facility / Hostel</th>
                  <th>Room / Location</th>
                  <th>Issue Details</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Assigned Person</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {facilityComplaints.length > 0 ? (
                  facilityComplaints.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <strong>{c.block || 'Hostel Block'}</strong>
                        <small>{c.id}</small>
                      </td>
                      <td>
                        <strong>{c.roomNumber || 'Common Area'}</strong>
                        <small>{c.location}</small>
                      </td>
                      <td>
                        <strong>{c.title}</strong>
                        <small style={{ color: '#64748b' }}>{c.description?.slice(0, 50)}...</small>
                      </td>
                      <td>
                        <strong>{c.category}</strong>
                      </td>
                      <td>
                        <span className={`urgency ${c.priority?.toLowerCase() || 'medium'}`}>
                          {c.priority}
                        </span>
                      </td>
                      <td>
                        <strong>{c.assignedTo || 'Unassigned'}</strong>
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
                          Review <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state">
                        <CheckCircle2 size={24} style={{ color: '#059669' }} />
                        <strong>All living spaces and dining halls verified operational</strong>
                        <span>No unresolved facility maintenance issues reported in this sector.</span>
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
  // SUB-VIEW 3: WARDEN ASSIGNMENTS (STAFF ROSTER & QUEUE)
  // ========================================================
  if (activeNav === 'Warden assignments') {
    return (
      <div className="role-dashboard warden-assignments-view">
        <section className="welcome-row">
          <div>
            <div className="scope-badge-pill hostel-pill">
              <Users size={15} />
              <span>Staff Roster & Duty Allocation · Residential Wardens & Caretakers</span>
            </div>
            <h1 style={{ marginTop: '10px' }}>
              Warden & Staff Duty Console <span>✦</span>
            </h1>
            <p className="welcome-copy">
              Manage on-duty residential caretakers, food quality supervisors, sanitation heads, and direct grievance allocation.
            </p>
          </div>
        </section>

        {/* Action success alert */}
        {actionSuccess && (
          <div className="action-success-banner" style={{ marginTop: '16px' }}>
            <CheckCircle2 size={16} />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Action error alert */}
        {actionError && (
          <div className="action-error-banner" style={{ marginTop: '16px' }}>
            <AlertTriangle size={16} />
            <span>{actionError}</span>
          </div>
        )}

        {/* 5 Warden & Staff Cards */}
        <h2 style={{ font: '800 17px Manrope', color: 'var(--ink)', margin: '24px 0 14px' }}>
          Active Residential Wardens & Operations Personnel ({wardenStaffRoster.length})
        </h2>

        <div className="staff-cards-grid">
          {wardenStaffRoster.map((stf) => {
            const assignedTasks = complaints.filter(
              (c) =>
                c.assignedTo?.toLowerCase().includes(stf.name.toLowerCase()) &&
                c.status !== 'Resolved' &&
                c.status !== 'Closed'
            );
            return (
              <div key={stf.id} className="staff-member-card">
                <div className="staff-card-top">
                  <div className="staff-avatar-circle" style={{ background: '#ecfdf5', color: '#059669' }}>
                    <Users size={20} />
                  </div>
                  <div className="staff-title-wrap">
                    <h3>{stf.name}</h3>
                    <span className="staff-desig-pill">{stf.designation}</span>
                  </div>
                  <span className="availability-chip available" style={{ marginLeft: 'auto' }}>
                    ● {stf.status}
                  </span>
                </div>

                <div className="staff-meta-grid" style={{ margin: '14px 0', fontSize: '11px' }}>
                  <div className="staff-meta-item">
                    <Mail size={13} />
                    <span>{stf.email}</span>
                  </div>
                  <div className="staff-meta-item">
                    <Phone size={13} />
                    <span>{stf.phone}</span>
                  </div>
                  <div className="staff-meta-item">
                    <Clock size={13} />
                    <span>{stf.dutyHours}</span>
                  </div>
                  <div className="staff-meta-item">
                    <Sparkles size={13} />
                    <span>{stf.shift}</span>
                  </div>
                </div>

                <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 12px', lineHeight: '1.45' }}>
                  <strong>Focus:</strong> {stf.responsibilities}
                </p>

                <div className="staff-active-tasks-box">
                  <span className="task-header-label">
                    Active Assigned Complaints ({assignedTasks.length}):
                  </span>
                  {assignedTasks.length > 0 ? (
                    <div className="staff-task-pills">
                      {assignedTasks.map((t) => (
                        <div
                          key={t.id}
                          className="staff-task-item"
                          onClick={() => onSelectComplaint(t)}
                        >
                          <strong>{t.id}</strong>
                          <span>{t.title}</span>
                          <span className={`status-pill mini ${t.status.toLowerCase().replace(' ', '-')}`}>
                            {t.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-tasks-text">No pending complaints currently assigned.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Unassigned Hostel Complaints Queue */}
        <section className="staff-queue-card" style={{ marginTop: '28px' }}>
          <div className="queue-header">
            <div>
              <h2>Unassigned Hostel & Mess Complaints Queue ({unassignedComplaints.length})</h2>
              <p>Directly allocate incoming student complaints to designated wardens, food supervisors, or maintenance staff.</p>
            </div>
          </div>

          {unassignedComplaints.length > 0 ? (
            <div className="unassigned-grid">
              {unassignedComplaints.map((c) => (
                <div key={c.id} className="unassigned-task-card">
                  <div className="task-top">
                    <div>
                      <span className="task-id">{c.id}</span>
                      <span className={`urgency ${c.priority?.toLowerCase() || 'medium'}`}>
                        {c.priority}
                      </span>
                    </div>
                    <span className="task-time">{c.block || 'Hostel'}</span>
                  </div>

                  <h3>{c.title}</h3>
                  <p className="task-desc">{c.description}</p>

                  <div className="task-meta-row">
                    <div>
                      <strong>Location:</strong> {c.location} {c.roomNumber ? `· Room ${c.roomNumber}` : ''}
                    </div>
                    <div>
                      <strong>Category:</strong> {c.category}
                    </div>
                  </div>

                  {assigningId === c.id ? (
                    <div className="quick-assign-box">
                      <label>Select Staff Member:</label>
                      <select
                        value={selectedStaff}
                        onChange={(e) => setSelectedStaff(e.target.value)}
                      >
                        <option value="">-- Choose Warden / Personnel --</option>
                        {wardenStaffRoster.map((s) => (
                          <option key={s.id} value={s.name}>
                            {s.name} ({s.designation})
                          </option>
                        ))}
                      </select>

                      <label style={{ marginTop: '8px' }}>Priority Level:</label>
                      <select
                        value={priorityForModal}
                        onChange={(e) => setPriorityForModal(e.target.value)}
                      >
                        <option value="Critical">Critical (Immediate)</option>
                        <option value="High">High (&lt; 24h)</option>
                        <option value="Medium">Medium (Standard)</option>
                        <option value="Low">Low (Scheduled)</option>
                      </select>

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
                          onClick={() => handleConfirmAssign(c.id)}
                        >
                          Assign Now
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="task-actions-row">
                      <button
                        type="button"
                        className="self-assign-btn"
                        style={{ background: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' }}
                        onClick={() => {
                          setAssigningId(c.id);
                          setSelectedStaff(user.name);
                        }}
                      >
                        <UserCheck size={14} /> Self-Assign (Chief Warden)
                      </button>
                      <button
                        type="button"
                        className="table-action-btn"
                        onClick={() => setAssigningId(c.id)}
                      >
                        Assign Staff <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-queue-notice">
              <CheckCircle2 size={24} style={{ color: '#059669' }} />
              <div>
                <strong>All Hostel & Mess Complaints Assigned</strong>
                <p>There are no pending unassigned complaints in residential or dining queues.</p>
              </div>
            </div>
          )}
        </section>
      </div>
    );
  }

  // ========================================================
  // SUB-VIEW 4: MESSAGES (CIRCULARS & COMMUNICATIONS)
  // ========================================================
  if (activeNav === 'Messages') {
    return (
      <div className="role-dashboard hostel-messages-view">
        <section className="welcome-row">
          <div>
            <div className="scope-badge-pill hostel-pill">
              <MessageSquare size={15} />
              <span>Notice Board & Broadcast Center · Residential Life Alerts</span>
            </div>
            <h1 style={{ marginTop: '10px' }}>
              Hostel & Mess Communications Desk <span>✦</span>
            </h1>
            <p className="welcome-copy">
              Publish official dining committee circulars, water maintenance alerts, room inspection guidelines, and review resident inquiries.
            </p>
          </div>
        </section>

        {broadcastSuccess && (
          <div className="action-success-banner" style={{ marginTop: '16px' }}>
            <CheckCircle2 size={16} />
            <span>Official circular broadcasted to all hostel residents!</span>
          </div>
        )}

        <div className="content-grid" style={{ marginTop: '24px' }}>
          {/* Left Column: Official Notices Feed */}
          <div>
            <div className="section-heading">
              <div>
                <h2>Active Circulars & Residential Advisories ({hostelNotices.length})</h2>
                <p>Broadcasted directly to student hostel dashboards and dining hall boards.</p>
              </div>
            </div>

            <div className="message-list" style={{ marginTop: '16px' }}>
              {hostelNotices.map((n) => (
                <div key={n.id} className="message-card" style={{ borderLeft: '4px solid #059669' }}>
                  <div className="message-avatar" style={{ background: '#ecfdf5', color: '#059669' }}>
                    <Building2 size={20} />
                  </div>
                  <div className="message-copy">
                    <div className="message-top">
                      <strong>{n.author}</strong>
                      <span>{n.date}</span>
                    </div>
                    <h3>{n.title}</h3>
                    <p>{n.body}</p>
                    <div className="message-tags">
                      <span className="message-tag" style={{ background: '#ecfdf5', color: '#047857' }}>
                        {n.category}
                      </span>
                      <span className="message-tag secondary">{n.priority}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Compose New Broadcast */}
          <div className="right-rail">
            <div className="rail-heading">
              <h2>Post Official Circular</h2>
            </div>
            <p style={{ fontSize: '11px', color: '#64748b', margin: '4px 0 16px' }}>
              Send an instant broadcast to Gargi, Vikram, Tagore hostels and Central Mess residents.
            </p>

            <form onSubmit={handlePostBroadcast} className="admin-table-card" style={{ padding: '18px' }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', marginBottom: '5px' }}>
                  Notice Title *
                </label>
                <input
                  type="text"
                  required
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="e.g. Water Heater Inspection Schedule"
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: '6px', fontSize: '12px' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', marginBottom: '5px' }}>
                  Notice Category
                </label>
                <select
                  value={broadcastCategory}
                  onChange={(e) => setBroadcastCategory(e.target.value)}
                  style={{ width: '100%', padding: '9px', border: '1px solid var(--line)', borderRadius: '6px', fontSize: '12px' }}
                >
                  <option value="Mess & Dining Advisory">Mess & Dining Advisory</option>
                  <option value="Water Supply Advisory">Water Supply Advisory</option>
                  <option value="Hostel Maintenance">Hostel Maintenance</option>
                  <option value="Safety & Security Notice">Safety & Security Notice</option>
                  <option value="General Hostel Circular">General Hostel Circular</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', marginBottom: '5px' }}>
                  Notice Content *
                </label>
                <textarea
                  required
                  rows={4}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Provide detailed instructions or timings for residents..."
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: '6px', fontSize: '12px', resize: 'vertical' }}
                />
              </div>

              <button
                type="submit"
                className="primary-button"
                style={{ width: '100%', justifyContent: 'center', background: '#059669' }}
              >
                Broadcast Notice to Residents
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ========================================================
  // SUB-VIEW 5: HEALTH & HYGIENE (SANITAITON & FOOD ANALYTICS)
  // ========================================================
  if (activeNav === 'Health & hygiene') {
    const foodComplaintsCount = complaints.filter((c) =>
      c.category?.toLowerCase().includes('food') || c.category?.toLowerCase().includes('mess')
    ).length;
    const waterComplaintsCount = complaints.filter((c) =>
      c.category?.toLowerCase().includes('water')
    ).length;
    const washroomComplaintsCount = complaints.filter((c) =>
      c.category?.toLowerCase().includes('washroom') || c.category?.toLowerCase().includes('clean')
    ).length;
    const electricityComplaintsCount = complaints.filter((c) =>
      c.category?.toLowerCase().includes('electric') || c.category?.toLowerCase().includes('power')
    ).length;

    return (
      <div className="role-dashboard hostel-health-analytics-view">
        <section className="welcome-row">
          <div>
            <div className="scope-badge-pill hostel-pill">
              <BarChart3 size={15} />
              <span>Quality Assurance & Compliance · Food Safety & Sanitation</span>
            </div>
            <h1 style={{ marginTop: '10px' }}>
              Hostel Health, Hygiene & Mess Analytics <span>✦</span>
            </h1>
            <p className="welcome-copy">
              Daily food safety ratings, drinking water TDS records, washroom sanitation index, and resolution SLA tracking.
            </p>
          </div>
        </section>

        {/* 4 Health Metrics Cards */}
        <div className="overview-kpi-grid" style={{ marginTop: '20px' }}>
          <div className="kpi-card-v2">
            <div className="kpi-card-top">
              <div className="kpi-icon-box green-box">
                <Utensils size={20} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#16a34a' }}>94.8% Score</span>
            </div>
            <div className="kpi-meta-block">
              <span className="kpi-title-label">Food Quality & Hygiene Index</span>
              <div className="kpi-big-metric">
                94.8% <span>compliant</span>
              </div>
            </div>
            <p style={{ fontSize: '11px', color: '#64748b', margin: '8px 0 0' }}>
              Based on FSSAI compliance and 140+ student meal audit reviews.
            </p>
          </div>

          <div className="kpi-card-v2">
            <div className="kpi-card-top">
              <div className="kpi-icon-box blue-box">
                <Droplet size={20} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#0284c7' }}>WHO Standard</span>
            </div>
            <div className="kpi-meta-block">
              <span className="kpi-title-label">Drinking Water Quality</span>
              <div className="kpi-big-metric">
                118 <span>ppm TDS</span>
              </div>
            </div>
            <p style={{ fontSize: '11px', color: '#64748b', margin: '8px 0 0' }}>
              All 12 RO filtration units in Gargi, Vikram, and Tagore tested safe.
            </p>
          </div>

          <div className="kpi-card-v2">
            <div className="kpi-card-top">
              <div className="kpi-icon-box purple-box">
                <Sparkles size={20} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#9333ea' }}>Twice Daily</span>
            </div>
            <div className="kpi-meta-block">
              <span className="kpi-title-label">Washroom Sanitation Audit</span>
              <div className="kpi-big-metric">
                92.4% <span>on schedule</span>
              </div>
            </div>
            <p style={{ fontSize: '11px', color: '#64748b', margin: '8px 0 0' }}>
              Morning and evening housekeeping shifts completed across all wings.
            </p>
          </div>

          <div className="kpi-card-v2">
            <div className="kpi-card-top">
              <div className="kpi-icon-box amber-box">
                <Clock size={20} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#d97706' }}>Target: 24h</span>
            </div>
            <div className="kpi-meta-block">
              <span className="kpi-title-label">Avg Hostel Issue Resolution</span>
              <div className="kpi-big-metric">
                18.4 <span>hrs</span>
              </div>
            </div>
            <p style={{ fontSize: '11px', color: '#64748b', margin: '8px 0 0' }}>
              91% of residential complaints addressed within 24-hour SLA.
            </p>
          </div>
        </div>

        {/* Complaints Breakdown by Category */}
        <div className="overview-charts-grid" style={{ marginTop: '24px' }}>
          <div className="overview-chart-card">
            <div className="chart-card-header">
              <div className="chart-title-lockup">
                <div className="chart-circle-badge">
                  <BarChart3 size={15} />
                </div>
                <div>
                  <h3>Residential Complaints by Category</h3>
                  <span className="chart-sub">Distribution of open reports across living & dining areas</span>
                </div>
              </div>
            </div>

            <div className="progress-bars-stack" style={{ marginTop: '16px' }}>
              <div>
                <div className="track-label-row">
                  <span>Mess & Food Quality Issues</span>
                  <span className="track-pct">{foodComplaintsCount} reports</span>
                </div>
                <div className="horizontal-bar-track">
                  <div className="horizontal-bar-fill mint-fill" style={{ width: `${Math.min(100, (foodComplaintsCount / Math.max(1, total)) * 100)}%` }} />
                </div>
              </div>

              <div>
                <div className="track-label-row">
                  <span>Water Supply & RO Purifiers</span>
                  <span className="track-pct">{waterComplaintsCount} reports</span>
                </div>
                <div className="horizontal-bar-track">
                  <div className="horizontal-bar-fill cyan-fill" style={{ width: `${Math.min(100, (waterComplaintsCount / Math.max(1, total)) * 100)}%` }} />
                </div>
              </div>

              <div>
                <div className="track-label-row">
                  <span>Washroom Cleaning & Hygiene</span>
                  <span className="track-pct">{washroomComplaintsCount} reports</span>
                </div>
                <div className="horizontal-bar-track">
                  <div className="horizontal-bar-fill orange-fill" style={{ width: `${Math.min(100, (washroomComplaintsCount / Math.max(1, total)) * 100)}%` }} />
                </div>
              </div>

              <div>
                <div className="track-label-row">
                  <span>Hostel Room Electrical & Fans</span>
                  <span className="track-pct">{electricityComplaintsCount} reports</span>
                </div>
                <div className="horizontal-bar-track">
                  <div className="horizontal-bar-fill peach-fill" style={{ width: `${Math.min(100, (electricityComplaintsCount / Math.max(1, total)) * 100)}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Student Ratings Breakdown */}
          <div className="overview-chart-card">
            <div className="chart-card-header">
              <div className="chart-title-lockup">
                <div className="chart-circle-badge">
                  <Sparkles size={15} />
                </div>
                <div>
                  <h3>Student Feedback & Dining Ratings</h3>
                  <span className="chart-sub">Direct resolution satisfaction scores submitted by residents</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '16px' }}>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: '#15803d', fontWeight: '700' }}>Overall Satisfaction</span>
                <div style={{ font: '800 32px Manrope', color: '#166534', margin: '4px 0' }}>4.8 ★</div>
                <span style={{ fontSize: '10px', color: '#166534' }}>94% Positive Reviews</span>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: '#475569', fontWeight: '700' }}>SLA Compliance</span>
                <div style={{ font: '800 32px Manrope', color: '#0f172a', margin: '4px 0' }}>91.2%</div>
                <span style={{ fontSize: '10px', color: '#64748b' }}>Resolved within 24h</span>
              </div>
            </div>

            <div style={{ marginTop: '18px', padding: '12px 14px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', fontSize: '11px', color: '#0369a1' }}>
              <strong>Quality Assurance Certification:</strong> Central Kitchen audited and approved by Riverside Campus Hygiene Inspection Board on 25 Oct 2026.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ========================================================
  // SUB-VIEW 1: HOSTEL DESK (DEFAULT OVERVIEW OPERATIONS)
  // ========================================================
  return (
    <div className="role-dashboard hostel-dashboard-view">
      {/* Intro Header */}
      <section className="welcome-row">
        <div>
          <div className="scope-badge-pill hostel-pill">
            <Utensils size={15} />
            <span>
              Residential Life & Dining Services · Warden/Officer: <strong>{user.name}</strong>
            </span>
          </div>
          <h1 style={{ marginTop: '10px' }}>
            Hostel & Mess Operations Console <span>✦</span>
          </h1>
          <p className="welcome-copy">
            Dedicated oversight of student dining hygiene, meal quality, water supply, room maintenance, and hostel utilities.
          </p>
        </div>
      </section>

      {/* 5-Metric Strip */}
      <section className="coordinator-stats">
        <article>
          <span>Hostel/Mess Issues</span>
          <strong>{total}</strong>
          <small>Residential reports</small>
        </article>
        <article>
          <span>Pending Review</span>
          <strong style={{ color: '#b27d2e' }}>{pending}</strong>
          <small>Needs warden review</small>
        </article>
        <article>
          <span>In Progress</span>
          <strong style={{ color: '#76549b' }}>{inProgress}</strong>
          <small>Mess/hostel work active</small>
        </article>
        <article>
          <span>Resolved</span>
          <strong style={{ color: '#39805d' }}>{resolved}</strong>
          <small>Completed & closed</small>
        </article>
        <article className={overdue > 0 ? 'overdue-stat-card' : ''}>
          <span>Overdue (&gt; 48h)</span>
          <strong style={{ color: overdue > 0 ? '#b14d4d' : '#9a9296' }}>{overdue}</strong>
          <small>{overdue > 0 ? 'Exceeded hostel SLA' : 'Zero overdue items'}</small>
        </article>
      </section>

      {/* Urgent Attention Alert Banner */}
      {urgentComplaints.length > 0 && (
        <div className="overdue-banner" style={{ background: '#fffbeb', borderColor: '#fde68a', color: '#92400e', marginBottom: '20px' }}>
          <AlertTriangle size={18} style={{ color: '#d97706', flexShrink: 0 }} />
          <div>
            <strong>Attention: {urgentComplaints.length} High-Priority / Overdue Residential Complaints</strong>
            <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#b45309' }}>
              Ensure water, electrical, and mess quality reports are acknowledged and resolved promptly to uphold campus living standards.
            </p>
          </div>
        </div>
      )}

      {/* Hostel/Mess Table Card */}
      <section className="admin-table-card">
        <div className="admin-table-heading">
          <div>
            <h2>Hostel & Mess Complaints Queue</h2>
            <p>
              Filter by hostel block, mess facility, issue category, and priority to assign wardens and resolve complaints.
            </p>
          </div>
          <span className="live-label">
            <i /> Warden Desk Active
          </span>
        </div>

        {/* Filters */}
        <div className="admin-filters">
          <div className="admin-search">
            <Search size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by ID, room, hostel, menu item..."
            />
          </div>

          <select value={filterHostel} onChange={(e) => setFilterHostel(e.target.value)}>
            {hostels.map((h) => (
              <option key={h} value={h}>
                {h === 'All' ? 'All Hostels & Mess' : h}
              </option>
            ))}
          </select>

          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            {HOSTEL_MESS_FILTER_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c === 'All' ? 'All Categories' : c}
              </option>
            ))}
          </select>

          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
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

        {/* Table */}
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Complaint ID & Title</th>
                <th>Hostel / Mess Facility</th>
                <th>Room Number</th>
                <th>Category</th>
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
                      <strong>{c.block || 'Hostel Area'}</strong>
                      <small>{c.location}</small>
                    </td>
                    <td>
                      <strong>{c.roomNumber || 'Common Area'}</strong>
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
                      <small>{c.assignedDepartment || 'Hostel Desk'}</small>
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
                  <td colSpan={8}>
                    <div className="empty-state">
                      <Search size={24} />
                      <strong>No hostel or mess complaints found</strong>
                      <span>All student living spaces and dining halls are operating normally.</span>
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
