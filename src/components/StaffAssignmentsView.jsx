import { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserCheck,
  Zap,
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Phone,
  Mail,
  Briefcase,
  ShieldAlert,
  Search,
  GraduationCap,
} from 'lucide-react';
import { api } from '../services/api';

export function StaffAssignmentsView({
  user,
  complaints,
  onSelectComplaint,
  onComplaintUpdated,
  onSwitchTab,
}) {
  const [staffList, setStaffList] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [assigningId, setAssigningId] = useState(null);
  const [selectedStaffForModal, setSelectedStaffForModal] = useState('');
  const [priorityForModal, setPriorityForModal] = useState('High');
  const [remarksForModal, setRemarksForModal] = useState('');
  const [rosterFilter, setRosterFilter] = useState('All');
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Fetch staff directory
  useEffect(() => {
    setLoadingStaff(true);
    api.getStaff()
      .then((data) => {
        setStaffList(data || []);
      })
      .catch((err) => {
        console.error('Failed to load staff list:', err);
      })
      .finally(() => {
        setLoadingStaff(false);
      });
  }, []);

  // Compute staff categories
  const teachersList = useMemo(() => staffList.filter((s) => s.roleType === 'teacher'), [staffList]);
  const deptStaffList = useMemo(
    () => staffList.filter((s) => s.roleType === 'staff' || (!s.roleType && s.department !== 'Infrastructure')),
    [staffList]
  );
  const infraStaffList = useMemo(
    () => staffList.filter((s) => s.department === 'Infrastructure' || s.roleType === 'infrastructure'),
    [staffList]
  );

  const visibleStaff = useMemo(() => {
    if (rosterFilter === 'Teachers') return teachersList;
    if (rosterFilter === 'Staff') return deptStaffList;
    if (rosterFilter === 'Infrastructure') return infraStaffList;
    return staffList;
  }, [rosterFilter, staffList, teachersList, deptStaffList, infraStaffList]);

  // Compute unassigned complaints in this block
  const unassignedComplaints = useMemo(() => {
    return complaints.filter((c) => !c.assignedTo);
  }, [complaints]);

  // Compute complaints assigned to staff
  const assignedComplaints = useMemo(() => {
    return complaints.filter((c) => Boolean(c.assignedTo));
  }, [complaints]);

  // Self-assign complaint to HOD directly
  async function handleSelfAssign(complaint) {
    try {
      setActionError(null);
      const updated = await api.assignStaff(complaint.id, {
        staffName: `${user.name} (HOD)`,
        department: user.assignedDepartment || 'Information Technology',
        priority: complaint.priority || 'High',
        remarks: 'Self-assigned by HOD for immediate oversight and resolution.',
      });
      if (onComplaintUpdated) onComplaintUpdated(updated);
      setActionSuccess(`Successfully self-assigned ${complaint.id} to you (${user.name}).`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      setActionError(err.message || 'Failed to self-assign complaint');
    }
  }

  // Assign to selected staff from quick modal
  async function handleAssignToStaff(complaintId) {
    if (!selectedStaffForModal) {
      setActionError('Please select a staff member to assign.');
      return;
    }
    try {
      setActionError(null);
      const updated = await api.assignStaff(complaintId, {
        staffName: selectedStaffForModal,
        department: user.assignedDepartment || 'Information Technology',
        priority: priorityForModal,
        remarks: remarksForModal || 'Assigned by HOD.',
      });
      if (onComplaintUpdated) onComplaintUpdated(updated);
      setAssigningId(null);
      setSelectedStaffForModal('');
      setRemarksForModal('');
      setActionSuccess(`Grievance ${complaintId} assigned to ${selectedStaffForModal}.`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      setActionError(err.message || 'Failed to assign staff member');
    }
  }

  // Workload mapping per staff member
  const staffWorkload = useMemo(() => {
    const map = {};
    staffList.forEach((s) => {
      map[s.name] = complaints.filter(
        (c) => c.assignedTo && c.assignedTo.toLowerCase().includes(s.name.toLowerCase())
      );
    });

    // Also include HOD self-assignments
    const hodTasks = complaints.filter(
      (c) => c.assignedTo && c.assignedTo.toLowerCase().includes(user.name.toLowerCase())
    );
    if (hodTasks.length > 0) {
      map[`${user.name} (HOD Desk)`] = hodTasks;
    }

    return map;
  }, [staffList, complaints, user.name]);

  return (
    <div className="role-dashboard staff-assignments-view">
      {/* Header Info */}
      <section className="welcome-row">
        <div>
          <div className="scope-badge-pill">
            <Building2 size={15} />
            <span>
              Authorized Scope: <strong>{user.assignedDepartment || 'Information Technology'}</strong> · Assigned Block: <strong>{user.assignedBlock || 'Academic Block A'}</strong>
            </span>
          </div>
          <h1 style={{ marginTop: '10px' }}>
            Staff & Self-Assignment Desk <span>✦</span>
          </h1>
          <p className="welcome-copy">
            Allocate and oversee grievance resolution across your departmental engineers, lab technicians, and facilities staff. You can also self-assign priority grievances to take direct ownership.
          </p>
        </div>

        {onSwitchTab && (
          <button
            type="button"
            className="secondary-button"
            onClick={() => onSwitchTab('Block complaints')}
          >
            View Block Complaints
          </button>
        )}
      </section>

      {/* Action alerts */}
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

      {/* Top Metrics Row */}
      <section className="coordinator-stats" style={{ marginTop: '22px' }}>
        <article>
          <span>Available Staff</span>
          <strong>{staffList.length || 5}</strong>
          <small>Dept. & Facility Technicians</small>
        </article>
        <article>
          <span>Awaiting Assignment</span>
          <strong style={{ color: unassignedComplaints.length > 0 ? '#b27d2e' : '#39805d' }}>
            {unassignedComplaints.length}
          </strong>
          <small>Need staff or self-assignment</small>
        </article>
        <article>
          <span>Active Tasks Assigned</span>
          <strong style={{ color: '#76549b' }}>{assignedComplaints.length}</strong>
          <small>Currently in progress</small>
        </article>
        <article>
          <span>Avg. SLA Turnaround</span>
          <strong style={{ color: '#39805d' }}>~18 hrs</strong>
          <small>Department resolution speed</small>
        </article>
      </section>

      {/* SECTION 1: Unassigned Complaints (Ready for Assignment or Self-Assignment) */}
      <section className="staff-queue-card" style={{ marginTop: '20px' }}>
        <div className="queue-header">
          <div>
            <h2>
              Pending Assignment Queue ({unassignedComplaints.length})
            </h2>
            <p>
              Grievances in {user.assignedBlock || 'Academic Block A'} awaiting staff allocation. Click <strong>Self-Assign</strong> to take personal charge or dispatch to a staff technician.
            </p>
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
                      {c.priority || 'Medium'} Priority
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
                  <span><strong>Location:</strong> {c.location || user.assignedBlock}</span>
                  <span><strong>Student:</strong> {c.studentName} ({c.studentCollegeId || 'ID'})</span>
                </div>

                {assigningId === c.id ? (
                  <div className="quick-assign-box">
                    <label>
                      Select Teacher or Staff Member:
                      <select
                        value={selectedStaffForModal}
                        onChange={(e) => setSelectedStaffForModal(e.target.value)}
                      >
                        <option value="">-- Choose Member --</option>
                        {teachersList.length > 0 && (
                          <optgroup label="Department Teachers & Faculty">
                            {teachersList.map((s) => (
                              <option key={s.id} value={`${s.name} (${s.designation})`}>
                                {s.name} · {s.designation}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        {deptStaffList.length > 0 && (
                          <optgroup label="Department Coordinators & Staff">
                            {deptStaffList.map((s) => (
                              <option key={s.id} value={`${s.name} (${s.designation})`}>
                                {s.name} · {s.designation}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        {infraStaffList.length > 0 && (
                          <optgroup label="Campus Infrastructure Technicians">
                            {infraStaffList.map((s) => (
                              <option key={s.id} value={`${s.name} (${s.designation})`}>
                                {s.name} · {s.designation}
                              </option>
                            ))}
                          </optgroup>
                        )}
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
                      Remarks / Instructions:
                      <input
                        placeholder="e.g. Check projector lamp and HDMI cable connection"
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
                        onClick={() => handleAssignToStaff(c.id)}
                      >
                        Confirm Assignment
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="task-actions-row">
                    <button
                      type="button"
                      className="self-assign-btn"
                      onClick={() => handleSelfAssign(c)}
                      title="Self-assign directly to HOD"
                    >
                      <Zap size={14} /> Self-Assign to Me
                    </button>
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => {
                        setAssigningId(c.id);
                        setSelectedStaffForModal(staffList[0] ? `${staffList[0].name} (${staffList[0].designation})` : '');
                      }}
                    >
                      <UserCheck size={14} /> Assign Staff
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
        ) : (
          <div className="empty-queue-notice">
            <CheckCircle2 size={24} style={{ color: '#39805d' }} />
            <div>
              <strong>All block grievances are assigned!</strong>
              <p>There are no unassigned complaints in {user.assignedBlock || 'your block'} right now.</p>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 2: Department Faculty & Staff Roster & Workload Breakdown */}
      <section className="staff-roster-section" style={{ marginTop: '28px' }}>
        <div className="admin-table-heading" style={{ padding: '0 0 16px' }}>
          <div>
            <h2>Department Staff & Faculty Roster</h2>
            <p>
              Teachers, faculty members, coordinators, and technicians designated for {user.assignedDepartment || 'Information Technology'} & {user.assignedBlock || 'Academic Block A'}.
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="roster-filter-row" style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`roster-pill-btn ${rosterFilter === 'All' ? 'active' : ''}`}
            onClick={() => setRosterFilter('All')}
          >
            All Members ({staffList.length})
          </button>
          <button
            type="button"
            className={`roster-pill-btn ${rosterFilter === 'Teachers' ? 'active' : ''}`}
            onClick={() => setRosterFilter('Teachers')}
          >
            <GraduationCap size={13} style={{ marginRight: '4px' }} /> Teachers & Faculty ({teachersList.length})
          </button>
          <button
            type="button"
            className={`roster-pill-btn ${rosterFilter === 'Staff' ? 'active' : ''}`}
            onClick={() => setRosterFilter('Staff')}
          >
            <Users size={13} style={{ marginRight: '4px' }} /> Department Staff ({deptStaffList.length})
          </button>
          <button
            type="button"
            className={`roster-pill-btn ${rosterFilter === 'Infrastructure' ? 'active' : ''}`}
            onClick={() => setRosterFilter('Infrastructure')}
          >
            <Briefcase size={13} style={{ marginRight: '4px' }} /> Infrastructure ({infraStaffList.length})
          </button>
        </div>

        <div className="staff-cards-grid">
          {visibleStaff.map((staff) => {
            const activeTasks = complaints.filter(
              (c) => c.assignedTo && c.assignedTo.toLowerCase().includes(staff.name.toLowerCase())
            );
            const isAvailable = activeTasks.length === 0;
            const isTeacher = staff.roleType === 'teacher';

            return (
              <div key={staff.id} className={`staff-member-card ${isTeacher ? 'teacher-member-card' : ''}`}>
                <div className="staff-card-top">
                  <div className={`staff-avatar ${isTeacher ? 'teacher-avatar' : ''}`}>
                    {staff.name.replace(/^Dr\.?\s+/i, '').split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <strong>{staff.name}</strong>
                      {isTeacher && (
                        <span className="teacher-tag-badge">
                          <GraduationCap size={11} /> Faculty
                        </span>
                      )}
                    </div>
                    <span>{staff.designation}</span>
                    <small>{staff.department || 'Department Staff'} {staff.block ? `· ${staff.block}` : ''}</small>
                  </div>
                  <span className={`workload-pill ${isAvailable ? 'available' : 'busy'}`}>
                    {isAvailable ? 'Available' : `${activeTasks.length} Active Task${activeTasks.length > 1 ? 's' : ''}`}
                  </span>
                </div>

                <div className="staff-contact-row">
                  <span title="Staff Phone">
                    <Phone size={12} /> {staff.phone || '+91 98765 00000'}
                  </span>
                  <span title="Department Email">
                    <Mail size={12} /> {staff.email || `${staff.name.toLowerCase().replace(/[^a-z]/g, '')}@campus.edu`}
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
                    <p className="no-tasks-text">No active tasks assigned currently.</p>
                  )}
                </div>
              </div>
            );
          })}

          {/* Dr. Piyush Bhushan (HOD Self-Assigned Desk Card) */}
          <div className="staff-member-card hod-desk-card">
            <div className="staff-card-top">
              <div className="staff-avatar hod-avatar">
                HOD
              </div>
              <div>
                <strong>{user.name}</strong>
                <span>Head of Department · Direct Desk</span>
                <small>{user.assignedDepartment || 'Information Technology'}</small>
              </div>
              <span className="workload-pill hod-desk">
                HOD Desk
              </span>
            </div>

            <div className="staff-contact-row">
              <span>
                <Phone size={12} /> {user.phone || '+91 98765 11001'}
              </span>
              <span>
                <Mail size={12} /> {user.email || 'hod.it@campus.edu'}
              </span>
            </div>

            <div className="staff-assigned-tasks">
              <span className="task-header-label">
                Self-Assigned Priority Cases:
              </span>
              {complaints.filter((c) => c.assignedTo && c.assignedTo.includes(user.name)).length > 0 ? (
                <div className="staff-task-pills">
                  {complaints
                    .filter((c) => c.assignedTo && c.assignedTo.includes(user.name))
                    .map((task) => (
                      <button
                        key={task.id}
                        type="button"
                        className="staff-task-item"
                        onClick={() => onSelectComplaint(task)}
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
                <p className="no-tasks-text">
                  No grievances currently self-assigned to HOD. You can self-assign urgent cases from the queue above.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
