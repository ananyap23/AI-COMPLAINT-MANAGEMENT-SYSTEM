import { useState, useEffect, useMemo } from 'react';
import {
  X,
  ShieldCheck,
  Clock,
  User,
  MapPin,
  Tag,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Star,
  Users,
  MessageSquare,
  ArrowRight,
  Send,
  Building,
  RotateCcw,
  Check,
  Hourglass,
  Calendar,
  Sparkles,
  ClipboardCheck,
  Wrench,
  Eye,
  FileCheck2,
} from 'lucide-react';
import { api } from '../services/api';
import {
  formatIST,
  formatDuration,
  calculateComplaintMetrics,
  WORKFLOW_STAGES,
} from '../utils/timeFormat';

export function ComplaintActionModal({ complaint, currentUser, onClose, onUpdated }) {
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'history' | 'action'
  const [status, setStatus] = useState(complaint.status || 'Submitted');
  const [priority, setPriority] = useState(complaint.priority || 'Medium');
  const [assignedStaff, setAssignedStaff] = useState(complaint.assignedTo || '');
  const [remarks, setRemarks] = useState('');
  const [rejectionReason, setRejectionReason] = useState(complaint.rejectionReason || '');
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Student Feedback state
  const [feedbackRating, setFeedbackRating] = useState(complaint.feedback?.rating || 5);
  const [feedbackComment, setFeedbackComment] = useState(complaint.feedback?.comment || '');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Reassignment state
  const [showReassign, setShowReassign] = useState(false);
  const [reassignDept, setReassignDept] = useState('Campus Infrastructure & Estate');
  const [reassignTargetScope, setReassignTargetScope] = useState('admin');
  const [reassignReason, setReassignReason] = useState('');

  const isStudent = currentUser?.role === 'student';
  const isPrivileged = !isStudent;

  // Compute timing metrics & 8-stage progress tracker
  const metrics = useMemo(() => calculateComplaintMetrics(complaint), [complaint]);

  const activities = useMemo(() => {
    return complaint.activityHistory || complaint.statusHistory || [];
  }, [complaint]);

  useEffect(() => {
    if (isPrivileged) {
      api.getStaff()
        .then((staff) => setStaffList(staff))
        .catch(() => {});
    }
  }, [isPrivileged]);

  async function handleStatusUpdate(e) {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (status === 'Rejected' && !rejectionReason.trim()) {
      setError('Please provide a mandatory rejection reason explaining why this issue cannot be processed.');
      return;
    }

    if (status === 'Resolved' && !remarks.trim()) {
      setError('Please provide resolution remarks explaining the action taken to fix this issue.');
      return;
    }

    try {
      setLoading(true);
      const updated = await api.updateComplaintStatus(complaint.id, {
        status,
        remarks: remarks.trim() || undefined,
        rejectionReason: status === 'Rejected' ? rejectionReason.trim() : undefined,
        priority,
      });
      setSuccessMsg(`Status successfully updated to "${status}". Actual server timestamp recorded in IST.`);
      onUpdated(updated);
    } catch (err) {
      setError(err.message || 'Failed to update status.');
    } finally {
      setLoading(false);
    }
  }

  // Quick 1-click stage progression
  async function handleQuickAdvance(targetStatus, defaultRemark) {
    setError('');
    setSuccessMsg('');
    try {
      setLoading(true);
      const updated = await api.updateComplaintStatus(complaint.id, {
        status: targetStatus,
        remarks: defaultRemark || `Advanced to ${targetStatus} by ${currentUser?.name || 'Department Officer'}`,
        priority: complaint.priority,
      });
      setStatus(targetStatus);
      setSuccessMsg(`Workflow successfully advanced to "${targetStatus}". Actual server timestamp recorded.`);
      onUpdated(updated);
    } catch (err) {
      setError(err.message || `Failed to advance to ${targetStatus}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleAssignStaff(e) {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!assignedStaff.trim()) {
      setError('Please choose or enter a staff member name.');
      return;
    }

    try {
      setLoading(true);
      const updated = await api.assignStaff(complaint.id, {
        staffName: assignedStaff,
        priority,
        remarks: remarks.trim() || `Assigned to ${assignedStaff.trim()} by ${currentUser?.name || 'Officer'}`,
      });
      setSuccessMsg(`Staff ${assignedStaff} assigned successfully. Recorded in Activity History.`);
      setStatus(updated.status);
      onUpdated(updated);
    } catch (err) {
      setError(err.message || 'Failed to assign staff.');
    } finally {
      setLoading(false);
    }
  }

  async function handleReassignSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    try {
      setLoading(true);
      const updated = await api.reassignComplaint(complaint.id, {
        targetScope: reassignTargetScope,
        department: reassignDept,
        reason: reassignReason.trim(),
      });
      setSuccessMsg('Complaint routed/escalated to new department.');
      setShowReassign(false);
      onUpdated(updated);
    } catch (err) {
      setError(err.message || 'Failed to reassign complaint.');
    } finally {
      setLoading(false);
    }
  }

  async function handleFeedbackSubmit(e) {
    e.preventDefault();
    try {
      setSubmittingFeedback(true);
      const updated = await api.submitFeedback(complaint.id, {
        rating: feedbackRating,
        comment: feedbackComment,
      });
      setSuccessMsg('Your feedback has been recorded. Thank you!');
      onUpdated(updated);
    } catch (err) {
      setError(err.message || 'Failed to submit feedback.');
    } finally {
      setSubmittingFeedback(false);
    }
  }

  const allStatuses = [
    'Submitted',
    'Received',
    'Under Review',
    'Assigned',
    'In Progress',
    'Work Completed',
    'Final Verification',
    'Resolved',
    'Rejected',
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal complaint-action-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <div className="modal-tags-row">
              <span className="complaint-id-badge">{complaint.id}</span>
              <span className={`status-pill ${complaint.status.toLowerCase().replace(/\s+/g, '-')}`}>
                {complaint.status}
              </span>
              {metrics.isOverdue && (
                <span className="overdue-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <AlertTriangle size={12} /> OVERDUE (&gt; 48h)
                </span>
              )}
            </div>
            <h2>{complaint.title}</h2>
          </div>
          <button type="button" className="close-button" onClick={onClose} aria-label="Close modal">
            <X size={19} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="modal-tab-bar">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'details' ? 'tab-btn-active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Details & Overview
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'history' ? 'tab-btn-active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Activity Timeline ({activities.length})
          </button>
          {isPrivileged && (
            <button
              type="button"
              className={`tab-btn ${activeTab === 'action' ? 'tab-btn-active' : ''}`}
              onClick={() => setActiveTab('action')}
            >
              Take Action / Update
            </button>
          )}
        </div>

        {/* Alerts */}
        {error && (
          <div className="modal-alert-error" role="alert">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="modal-alert-success" role="alert">
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 1: DETAILS & OVERVIEW                                */}
        {/* ======================================================== */}
        {activeTab === 'details' && (
          <div className="tab-pane">
            {/* Rejection notice if rejected */}
            {complaint.status === 'Rejected' && (
              <div className="rejection-callout">
                <div className="callout-header">
                  <XCircle size={18} />
                  <strong>Complaint Rejected by Department</strong>
                </div>
                <p>
                  <strong>Reason:</strong> {complaint.rejectionReason || 'No specific rejection details provided.'}
                </p>
                {metrics.rejectedAtIST && (
                  <small style={{ display: 'block', marginTop: '6px', color: '#b91c1c' }}>
                    Rejected on {metrics.rejectedAtIST}
                  </small>
                )}
              </div>
            )}

            {/* Resolution notice if resolved */}
            {complaint.status === 'Resolved' && (
              <div className="resolution-callout">
                <div className="callout-header">
                  <CheckCircle2 size={18} />
                  <strong>Issue Resolved Successfully</strong>
                </div>
                <p>
                  <strong>Resolution Remarks:</strong>{' '}
                  {complaint.resolutionRemarks || 'Issue verified and marked completed.'}
                </p>
                {metrics.resolvedAtIST && (
                  <small style={{ display: 'block', marginTop: '6px', color: '#047857' }}>
                    Resolved on {metrics.resolvedAtIST}
                  </small>
                )}
              </div>
            )}

            {/* Details Grid */}
            <div className="modal-meta-grid">
              <div className="meta-cell">
                <span>Category</span>
                <strong>{complaint.category}</strong>
                {complaint.subcategory && <small>{complaint.subcategory}</small>}
              </div>

              <div className="meta-cell">
                <span>Location / Block</span>
                <strong>{complaint.location}</strong>
                {complaint.roomNumber && <small>Room: {complaint.roomNumber}</small>}
              </div>

              <div className="meta-cell">
                <span>Priority Level</span>
                <span className={`urgency ${complaint.priority?.toLowerCase() || 'medium'}`}>
                  {complaint.priority || 'Medium'}
                </span>
              </div>

              <div className="meta-cell">
                <span>Assigned Staff</span>
                <strong>{complaint.assignedTo || 'Unassigned'}</strong>
                <small>{complaint.assignedDepartment || 'Pending Desk'}</small>
              </div>

              <div className="meta-cell">
                <span>Submitted By</span>
                <strong>{complaint.studentName}</strong>
                <small>{complaint.studentCollegeId} · {complaint.studentEmail}</small>
              </div>

              <div className="meta-cell">
                <span>Date Lodged (IST)</span>
                <strong>{metrics.submittedAtIST}</strong>
                {complaint.updatedAt && (
                  <small>Updated: {formatIST(complaint.updatedAt)}</small>
                )}
              </div>
            </div>

            {/* Pending Status Card (when unresolved/pending) */}
            {metrics.isPending && (
              <div className={`pending-status-card ${metrics.isOverdue ? 'overdue-alert-card' : ''}`}>
                <div className="pending-card-top">
                  <div className="pending-indicator-wrap">
                    <span className={`pending-pulse-dot ${metrics.isOverdue ? 'overdue-dot' : ''}`}></span>
                    <div>
                      <strong>
                        Pending Stage: <span className="highlight-status">{complaint.status}</span>
                      </strong>
                      <p className="pending-subtext">
                        Waiting for action since <strong>{metrics.enteredCurrentStageIST}</strong>
                      </p>
                    </div>
                  </div>
                  {metrics.isOverdue ? (
                    <div className="sla-badge sla-overdue">
                      <AlertTriangle size={14} />
                      <span>SLA Breached (&gt; 48h)</span>
                    </div>
                  ) : (
                    <div className="sla-badge sla-active">
                      <Clock size={14} />
                      <span>Within 48h SLA</span>
                    </div>
                  )}
                </div>

                <div className="pending-meta-grid">
                  <div className="pending-meta-item">
                    <span>Pending Duration</span>
                    <strong>{metrics.pendingDuration || 'Just now'} ({metrics.hoursPending} hrs)</strong>
                  </div>
                  <div className="pending-meta-item">
                    <span>Responsible Department</span>
                    <strong>{metrics.responsibleDepartment}</strong>
                  </div>
                  <div className="pending-meta-item">
                    <span>Assigned Staff / Officer</span>
                    <strong>{metrics.responsibleStaff}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Automatic Workflow Time Calculations Panel */}
            <div className="workflow-metrics-card">
              <div className="metrics-card-header">
                <Clock size={16} />
                <h4>Automatic Workflow Timing Calculations</h4>
                <span className="timing-chip">Real-time Telemetry (IST)</span>
              </div>
              <div className="timing-metrics-grid">
                <div className="timing-metric-box">
                  <span className="metric-label">Submission → Review</span>
                  <strong className="metric-val">
                    {metrics.timeToReview || (metrics.reviewAtIST ? 'Completed' : 'Pending Review')}
                  </strong>
                  <small>{metrics.reviewAtIST ? `Reviewed ${metrics.reviewAtIST}` : 'Awaiting review'}</small>
                </div>
                <div className="timing-metric-box">
                  <span className="metric-label">Staff Assignment</span>
                  <strong className="metric-val">
                    {metrics.timeToAssign || (metrics.assignedAtIST ? 'Assigned' : 'Pending Allocation')}
                  </strong>
                  <small>{metrics.assignedAtIST ? `Assigned ${metrics.assignedAtIST}` : 'Awaiting staff'}</small>
                </div>
                <div className="timing-metric-box">
                  <span className="metric-label">Time Spent in Repair</span>
                  <strong className="metric-val">
                    {metrics.timeInRepair || (complaint.status === 'In Progress' ? 'Work Active' : 'Pending Repair')}
                  </strong>
                  <small>{metrics.workCompletedAtIST ? `Done ${metrics.workCompletedAtIST}` : 'Remediation window'}</small>
                </div>
                <div className="timing-metric-box">
                  <span className="metric-label">Verification Time</span>
                  <strong className="metric-val">
                    {metrics.timeToVerify || (metrics.finalVerificationAtIST ? 'Verified' : 'Pending Audit')}
                  </strong>
                  <small>{metrics.finalVerificationAtIST ? `Verified ${metrics.finalVerificationAtIST}` : 'Final inspection'}</small>
                </div>
                <div className="timing-metric-box highlight-box">
                  <span className="metric-label">Total Resolution Time</span>
                  <strong className="metric-val">
                    {metrics.totalResolutionTime || (metrics.isPending ? `${metrics.pendingDuration} (Active)` : 'N/A')}
                  </strong>
                  <small>{metrics.resolvedAtIST ? `Closed ${metrics.resolvedAtIST}` : 'End-to-end duration'}</small>
                </div>
              </div>
            </div>

            {/* Description Block */}
            <div className="modal-description-box">
              <span>Full Description</span>
              <p>{complaint.description}</p>
            </div>

            {/* Optional Attachment */}
            {complaint.attachment && (
              <div className="modal-attachment-box">
                <span>Attached File / Photo:</span>
                <strong>📎 {complaint.attachment}</strong>
              </div>
            )}

            {/* Student Feedback Section (Visible only when Resolved) */}
            {complaint.status === 'Resolved' && (
              <div className="student-feedback-card">
                <div className="feedback-card-heading">
                  <Star size={18} className="star-icon" />
                  <strong>Student Resolution Feedback</strong>
                </div>
                {complaint.feedback ? (
                  <div className="feedback-display">
                    <div className="star-rating-row">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`star-char ${star <= complaint.feedback.rating ? 'star-filled' : ''}`}
                        >
                          ★
                        </span>
                      ))}
                      <span>({complaint.feedback.rating} / 5 Stars)</span>
                    </div>
                    {complaint.feedback.comment && (
                      <p className="feedback-comment">"{complaint.feedback.comment}"</p>
                    )}
                    <small>Submitted on {formatIST(complaint.feedback.submittedAt || complaint.feedback.submittedAtIso)}</small>
                  </div>
                ) : isStudent ? (
                  <form className="feedback-form" onSubmit={handleFeedbackSubmit}>
                    <p>How satisfied are you with the resolution of this issue?</p>
                    <div className="rating-selector">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          type="button"
                          className={`rating-btn ${feedbackRating === val ? 'rating-btn-selected' : ''}`}
                          onClick={() => setFeedbackRating(val)}
                        >
                          {val} ★
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      placeholder="Add any remarks or confirmation regarding the resolution..."
                      rows={2}
                    />
                    <button type="submit" className="primary-button" disabled={submittingFeedback}>
                      {submittingFeedback ? 'Submitting...' : 'Submit Resolution Feedback'}
                    </button>
                  </form>
                ) : (
                  <p className="no-feedback-yet">Student has not provided resolution feedback yet.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: ACTIVITY TIMELINE (8-STAGE TRACKER & AUDIT TRAIL) */}
        {/* ======================================================== */}
        {activeTab === 'history' && (
          <div className="tab-pane">
            {/* 8-Stage Workflow Progress Stepper */}
            <div className="workflow-stepper-card">
              <div className="stepper-header">
                <h4>8-Stage Workflow Lifecycle</h4>
                <span>Independent timestamps per action</span>
              </div>

              <div className="stages-stepper-grid">
                {metrics.stageProgress.map((st, idx) => (
                  <div
                    key={st.id}
                    className={`stepper-step ${st.isCompleted ? 'step-completed' : ''} ${st.isCurrent ? 'step-current' : ''}`}
                  >
                    <div className="step-circle">
                      {st.isCompleted ? (
                        <Check size={14} />
                      ) : st.isCurrent ? (
                        <span className="step-pulse-ring"></span>
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>
                    <div className="step-content">
                      <span className="step-title">{st.label}</span>
                      {st.timestamp ? (
                        <strong className="step-time-badge">{st.timestamp}</strong>
                      ) : (
                        <span className="step-pending-label">
                          {st.isCurrent ? '● Active Now' : 'Pending'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Permanent Immutable Activity Audit Trail */}
            <h4 style={{ margin: '24px 0 12px', font: '700 14px Manrope', color: 'var(--ink)' }}>
              Permanent Activity History Records ({activities.length})
            </h4>

            <div className="activity-records-trail">
              {activities.length > 0 ? (
                activities.map((act, idx) => {
                  const actTime = act.timestamp || act.time;
                  const prevAct = idx > 0 ? activities[idx - 1] : null;
                  const prevTimeMs = prevAct ? (prevAct.time || new Date(prevAct.timestamp).getTime()) : null;
                  const currTimeMs = act.time || new Date(act.timestamp).getTime();
                  const diffMs = (prevTimeMs && currTimeMs) ? Math.max(0, currTimeMs - prevTimeMs) : null;

                  return (
                    <div key={act.id || idx} className="activity-record-node">
                      <div className="activity-node-marker">
                        <CheckCircle2 size={16} />
                      </div>

                      <div className="activity-record-card">
                        <div className="record-header-row">
                          <div className="record-title-wrap">
                            <span className="record-action-title">
                              {act.action || act.status}
                            </span>
                            <span className={`status-pill ${(act.newStatus || act.status).toLowerCase().replace(/\s+/g, '-')}`}>
                              {act.newStatus || act.status}
                            </span>
                          </div>

                          {/* EXACT DATE & TIME BESIDE EVERY ACTIVITY IN IST */}
                          <div className="record-timestamp-box">
                            <Calendar size={13} />
                            <strong>{formatIST(actTime)}</strong>
                          </div>
                        </div>

                        <div className="record-meta-strip">
                          <span>
                            <strong>Performed By:</strong> {act.performedBy || act.actor || 'System'}
                          </span>
                          {act.department && (
                            <span>
                              <strong>Dept:</strong> {act.department}
                            </span>
                          )}
                          {diffMs !== null && diffMs > 0 && (
                            <span className="record-interval-pill">
                              +{formatDuration(diffMs)} from previous step
                            </span>
                          )}
                        </div>

                        {act.remarks && (
                          <p className="record-remarks">
                            "{act.remarks}"
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p>No activity records logged yet.</p>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: PRIVILEGED ACTIONS (HOD, Admin, Hostel/Mess)      */}
        {/* ======================================================== */}
        {activeTab === 'action' && isPrivileged && (
          <div className="tab-pane">
            <div className="action-sections-stack">
              {/* Quick 1-Click Stage Advance Bar */}
              <div className="action-section-card quick-advance-strip">
                <div className="action-card-header">
                  <Sparkles size={17} style={{ color: '#0284c7' }} />
                  <h3>Quick Workflow Progression</h3>
                </div>
                <p>Advance this complaint to its next logical workflow milestone with actual server timestamps.</p>

                <div className="quick-buttons-row">
                  {complaint.status === 'Submitted' && (
                    <button
                      type="button"
                      className="quick-stage-btn"
                      disabled={loading}
                      onClick={() => handleQuickAdvance('Received', 'Complaint officially received and acknowledged by department desk')}
                    >
                      <ClipboardCheck size={14} /> 1. Mark Complaint Received
                    </button>
                  )}

                  {['Submitted', 'Received'].includes(complaint.status) && (
                    <button
                      type="button"
                      className="quick-stage-btn"
                      disabled={loading}
                      onClick={() => handleQuickAdvance('Under Review', 'Department commenced technical and administrative review')}
                    >
                      <Eye size={14} /> 2. Start Under Review
                    </button>
                  )}

                  {['Submitted', 'Received', 'Under Review'].includes(complaint.status) && (
                    <button
                      type="button"
                      className="quick-stage-btn"
                      disabled={loading}
                      onClick={() => {
                        const defaultTechnician = staffList[0]?.name || 'Department Technician';
                        setAssignedStaff(defaultTechnician);
                      }}
                    >
                      <Users size={14} /> 3. Allocate Staff Member ↓
                    </button>
                  )}

                  {complaint.status === 'Assigned' && (
                    <button
                      type="button"
                      className="quick-stage-btn primary-stage-btn"
                      disabled={loading}
                      onClick={() => handleQuickAdvance('In Progress', 'Assigned staff initiated physical repair work on site')}
                    >
                      <Wrench size={14} /> 4. Begin Work In Progress
                    </button>
                  )}

                  {complaint.status === 'In Progress' && (
                    <button
                      type="button"
                      className="quick-stage-btn primary-stage-btn"
                      disabled={loading}
                      onClick={() => handleQuickAdvance('Work Completed', 'On-ground repairs completed; ready for final inspection')}
                    >
                      <CheckCircle2 size={14} /> 5. Mark Work Completed
                    </button>
                  )}

                  {complaint.status === 'Work Completed' && (
                    <button
                      type="button"
                      className="quick-stage-btn"
                      disabled={loading}
                      onClick={() => handleQuickAdvance('Final Verification', 'Supervisory inspection conducted on site')}
                    >
                      <FileCheck2 size={14} /> 6. Perform Final Verification
                    </button>
                  )}

                  {['Work Completed', 'Final Verification', 'In Progress', 'Assigned'].includes(complaint.status) && (
                    <button
                      type="button"
                      className="quick-stage-btn success-stage-btn"
                      disabled={loading}
                      onClick={() => {
                        setStatus('Resolved');
                        setRemarks(remarks || 'Remediation completed and verified operational.');
                      }}
                    >
                      <Check size={14} /> 7. Prepare Resolution Details ↓
                    </button>
                  )}
                </div>
              </div>

              {/* Section 1: Staff Assignment */}
              <form className="action-section-card" onSubmit={handleAssignStaff}>
                <div className="action-card-header">
                  <Users size={17} />
                  <h3>Assign Responsible Staff</h3>
                </div>
                <p>Delegate this complaint to on-ground technicians, faculty, wardens, or supervisors.</p>

                <div className="form-row-2">
                  <div className="form-field">
                    <label>Select Staff Member</label>
                    <select
                      value={assignedStaff}
                      onChange={(e) => setAssignedStaff(e.target.value)}
                    >
                      <option value="">-- Choose from Staff & Faculty Pool --</option>
                      {staffList.filter((s) => s.roleType === 'teacher').length > 0 && (
                        <optgroup label="Department Teachers & Faculty">
                          {staffList
                            .filter((s) => s.roleType === 'teacher')
                            .map((stf) => (
                              <option key={stf.id} value={`${stf.name} (${stf.designation})`}>
                                {stf.name} — {stf.designation} [{stf.department}]
                              </option>
                            ))}
                        </optgroup>
                      )}
                      {staffList.filter((s) => s.roleType === 'staff' || (!s.roleType && s.department !== 'Infrastructure')).length > 0 && (
                        <optgroup label="Department Coordinators & Staff">
                          {staffList
                            .filter((s) => s.roleType === 'staff' || (!s.roleType && s.department !== 'Infrastructure'))
                            .map((stf) => (
                              <option key={stf.id} value={`${stf.name} (${stf.designation})`}>
                                {stf.name} — {stf.designation} [{stf.department}]
                              </option>
                            ))}
                        </optgroup>
                      )}
                      {staffList.filter((s) => s.department === 'Infrastructure').length > 0 && (
                        <optgroup label="Campus Infrastructure Technicians">
                          {staffList
                            .filter((s) => s.department === 'Infrastructure')
                            .map((stf) => (
                              <option key={stf.id} value={`${stf.name} (${stf.designation})`}>
                                {stf.name} — {stf.designation} [{stf.department}]
                              </option>
                            ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Or Type Custom Staff Name</label>
                    <input
                      type="text"
                      value={assignedStaff}
                      onChange={(e) => setAssignedStaff(e.target.value)}
                      placeholder="e.g. Ramesh Pal (Senior Electrician)"
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-field">
                    <label>Adjust Priority</label>
                    <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                      <option>Critical</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Assignment Note (Optional)</label>
                    <input
                      type="text"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="e.g. Visit site before 2 PM"
                    />
                  </div>
                </div>

                <button type="submit" className="primary-button" disabled={loading}>
                  {loading ? 'Assigning...' : 'Save Staff Assignment & Record Timestamp'}
                </button>
              </form>

              {/* Section 2: Status & Resolution Workflow */}
              <form className="action-section-card" onSubmit={handleStatusUpdate}>
                <div className="action-card-header">
                  <ShieldCheck size={17} />
                  <h3>Update Status & Record Milestone</h3>
                </div>
                <p>Advance the lifecycle of this complaint or mark it resolved/rejected.</p>

                <div className="form-field">
                  <label>Next Status State</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)}>
                    {allStatuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {status === 'Rejected' && (
                  <div className="form-field mandatory-field">
                    <label>
                      <span>Reason for Rejection * (Mandatory for student visibility)</span>
                    </label>
                    <textarea
                      required
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Explain clearly why this request cannot be fulfilled (e.g. invalid location, duplicate submission, outside campus authority, etc.)..."
                      rows={3}
                    />
                  </div>
                )}

                {status === 'Resolved' && (
                  <div className="form-field mandatory-field">
                    <label>
                      <span>Resolution Remarks * (Mandatory work completion report)</span>
                    </label>
                    <textarea
                      required
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Detail the work carried out (e.g. replaced capacitor on phase 2, cleaned water cooler filters, fixed bench in room 101)..."
                      rows={3}
                    />
                  </div>
                )}

                {status !== 'Rejected' && status !== 'Resolved' && (
                  <div className="form-field">
                    <label>Internal Milestone Remarks (Optional)</label>
                    <input
                      type="text"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="e.g. Parts ordered from vendor; technician on site."
                    />
                  </div>
                )}

                <button type="submit" className="primary-button" disabled={loading}>
                  {loading ? 'Updating...' : `Confirm & Set Status to "${status}"`}
                </button>
              </form>

              {/* Section 3: Reassignment / Escalation */}
              <div className="action-section-card secondary-card">
                <div className="action-card-header">
                  <RotateCcw size={17} />
                  <h3>Cross-Department Reassignment / Escalation</h3>
                </div>
                <p>If this complaint involves multiple units or was routed mistakenly, reassign it.</p>

                {!showReassign ? (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setShowReassign(true)}
                  >
                    Open Reassignment Dialog
                  </button>
                ) : (
                  <form onSubmit={handleReassignSubmit}>
                    <div className="form-row-2">
                      <div className="form-field">
                        <label>Target Department Scope</label>
                        <select
                          value={reassignTargetScope}
                          onChange={(e) => {
                            setReassignTargetScope(e.target.value);
                            setReassignDept(
                              e.target.value === 'admin'
                                ? 'Campus Infrastructure & Estate'
                                : e.target.value === 'hostel_mess'
                                ? 'Hostel & Mess Management'
                                : 'Academic Department'
                            );
                          }}
                        >
                          <option value="admin">Admin / Campus Infrastructure</option>
                          <option value="hostel_mess">Hostel / Mess Department</option>
                          <option value="hod">HOD / Academic Department</option>
                        </select>
                      </div>
                      <div className="form-field">
                        <label>Department Name</label>
                        <input
                          type="text"
                          value={reassignDept}
                          onChange={(e) => setReassignDept(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-field">
                      <label>Reason for Reassignment</label>
                      <input
                        type="text"
                        value={reassignReason}
                        onChange={(e) => setReassignReason(e.target.value)}
                        placeholder="e.g. Civil wall seepage caused electrical tripping"
                      />
                    </div>

                    <div className="modal-actions">
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => setShowReassign(false)}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="primary-button" disabled={loading}>
                        {loading ? 'Reassigning...' : 'Reassign Complaint'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="modal-actions" style={{ marginTop: '20px' }}>
          <button type="button" className="secondary-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
