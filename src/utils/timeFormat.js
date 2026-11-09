/**
 * timeFormat.js
 * 
 * Centralized Date, Time, and Duration utilities for CampusBRIDGE.
 * Converts UTC server timestamps to Indian Standard Time (IST, UTC+5:30)
 * in the format: DD MMM YYYY, hh:mm AM/PM (e.g. 30 Oct 2026, 09:15 AM).
 */

/**
 * Format any timestamp or date into Indian Standard Time (IST):
 * Format: DD MMM YYYY, hh:mm AM/PM
 * Example: "30 Oct 2026, 09:15 AM"
 */
export function formatIST(dateInput) {
  if (!dateInput) return 'N/A';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return 'N/A';

  try {
    const formatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const parts = formatter.formatToParts(d);
    const partMap = {};
    for (const p of parts) {
      partMap[p.type] = p.value;
    }

    const day = partMap.day || '';
    const month = partMap.month || '';
    const year = partMap.year || '';
    const hour = partMap.hour || '';
    const minute = partMap.minute || '';
    const period = (partMap.dayPeriod || '').toUpperCase() || (d.getUTCHours() >= 6 ? 'PM' : 'AM');

    return `${day} ${month} ${year}, ${hour}:${minute} ${period}`;
  } catch {
    return d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  }
}

/**
 * Format milliseconds into a human readable duration:
 * e.g. "2 days 4 hrs", "1 hr 25 mins", "42 mins", "< 1 min"
 */
export function formatDuration(ms) {
  if (ms === null || ms === undefined || isNaN(ms)) return null;
  if (ms < 0) return '0 mins';

  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0) {
    return hours > 0 ? `${days}d ${hours}h` : `${days} day${days > 1 ? 's' : ''}`;
  }
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours} hr${hours > 1 ? 's' : ''}`;
  }
  if (minutes > 0) {
    return `${minutes} min${minutes !== 1 ? 's' : ''}`;
  }
  return '< 1 min';
}

/**
 * Standard 8-Stage Workflow Definitions
 */
export const WORKFLOW_STAGES = [
  { id: 'submitted', key: 'Submitted', label: 'Complaint Submitted', desc: 'Grievance lodged by student through portal' },
  { id: 'received', key: 'Received', label: 'Complaint Received', desc: 'Acknowledged and registered by department' },
  { id: 'under_review', key: 'Under Review', label: 'Under Review', desc: 'Technical & administrative evaluation in progress' },
  { id: 'assigned', key: 'Assigned', label: 'Staff Assigned', desc: 'Designated caretaker / technician allocated' },
  { id: 'in_progress', key: 'In Progress', label: 'Work In Progress', desc: 'Remediation and on-site repair work underway' },
  { id: 'work_completed', key: 'Work Completed', label: 'Work Completed', desc: 'Technician completed repair and testing' },
  { id: 'final_verification', key: 'Final Verification', label: 'Final Verification', desc: 'Supervisory quality check and sign-off' },
  { id: 'resolved', key: 'Resolved', label: 'Complaint Resolved', desc: 'Officially resolved and closed' },
];

/**
 * Calculate all complaint timing metrics, pending status, and stage progressions
 */
export function calculateComplaintMetrics(complaint) {
  if (!complaint) return {};

  const history = complaint.activityHistory || complaint.statusHistory || [];
  const stages = complaint.stageTimestamps || {};

  // Helper to extract timestamp (in ms) for any status name
  const getStageMs = (stageName) => {
    const s = stageName.toLowerCase();
    for (const [k, v] of Object.entries(stages)) {
      if (k.toLowerCase().includes(s.replace(/\s+/g, '')) && v) {
        return new Date(v).getTime();
      }
    }
    const item = history.find((h) => (h.newStatus || h.status || '').toLowerCase() === s);
    if (item) {
      return item.time || (item.timestamp ? new Date(item.timestamp).getTime() : null);
    }
    return null;
  };

  const submittedMs = complaint.createdAt || getStageMs('submitted');
  const receivedMs = getStageMs('received');
  const reviewMs = getStageMs('under review');
  const assignedMs = getStageMs('assigned');
  const inProgressMs = getStageMs('in progress');
  const workCompletedMs = getStageMs('work completed');
  const finalVerificationMs = getStageMs('final verification');
  const resolvedMs = complaint.resolvedAt || getStageMs('resolved');
  const rejectedMs = complaint.rejectedAt || getStageMs('rejected');

  // Automatic Time Calculations
  // 1. Time between complaint submission and HOD review
  const timeToReviewMs = (reviewMs && submittedMs) ? Math.max(0, reviewMs - submittedMs) : null;
  // 2. Time taken for staff assignment
  const timeToAssignMs = (assignedMs && submittedMs) ? Math.max(0, assignedMs - submittedMs) : null;
  // 3. Time spent in repair (In Progress -> Work Completed or Resolved)
  const repairEndMs = workCompletedMs || resolvedMs;
  const timeInRepairMs = (repairEndMs && inProgressMs) ? Math.max(0, repairEndMs - inProgressMs) : null;
  // 4. Time taken for verification (Work Completed -> Verification/Resolved)
  const verifyEndMs = resolvedMs || finalVerificationMs;
  const timeToVerifyMs = (verifyEndMs && workCompletedMs) ? Math.max(0, verifyEndMs - workCompletedMs) : null;
  // 5. Total complaint resolution time (Submitted -> Resolved)
  const totalResolutionTimeMs = (resolvedMs && submittedMs) ? Math.max(0, resolvedMs - submittedMs) : null;

  // 6. Pending Status Calculations
  const isResolved = complaint.status === 'Resolved' || complaint.status === 'Closed';
  const isRejected = complaint.status === 'Rejected';
  const isPending = !isResolved && !isRejected;

  const lastActivity = history.length > 0 ? history[history.length - 1] : null;
  const lastActionMs = complaint.updatedAt || (lastActivity ? (lastActivity.time || new Date(lastActivity.timestamp).getTime()) : submittedMs);
  const pendingDurationMs = isPending ? Math.max(0, Date.now() - (lastActionMs || submittedMs || Date.now())) : null;

  // Overdue SLA detection (> 48 hours from submission while still unresolved)
  const ageFromSubmissionMs = submittedMs ? Math.max(0, Date.now() - submittedMs) : 0;
  const isOverdue = isPending && ageFromSubmissionMs > 48 * 3600 * 1000;

  // Responsible party
  const responsibleDepartment = complaint.assignedDepartment || complaint.department || 'Responsible Department';
  const responsibleStaff = complaint.assignedTo || 'Unassigned (Awaiting Department Review)';

  // Build 8-Stage Tracker status
  const currentStatusIdx = WORKFLOW_STAGES.findIndex(
    (st) => st.key.toLowerCase() === (complaint.status || '').toLowerCase()
  );

  const stageProgress = WORKFLOW_STAGES.map((st, idx) => {
    const stageTimestampMs = getStageMs(st.key);
    const isCompleted = isResolved
      ? Boolean(stageTimestampMs) || idx <= currentStatusIdx
      : Boolean(stageTimestampMs) || idx < currentStatusIdx;
    const isCurrent = !isResolved && !isRejected && (st.key.toLowerCase() === (complaint.status || '').toLowerCase());
    
    return {
      ...st,
      timestamp: stageTimestampMs ? formatIST(stageTimestampMs) : null,
      timestampMs: stageTimestampMs,
      isCompleted,
      isCurrent,
      isPending: !isCompleted && !isCurrent,
    };
  });

  return {
    submittedAtIST: formatIST(submittedMs),
    receivedAtIST: receivedMs ? formatIST(receivedMs) : null,
    reviewAtIST: reviewMs ? formatIST(reviewMs) : null,
    assignedAtIST: assignedMs ? formatIST(assignedMs) : null,
    inProgressAtIST: inProgressMs ? formatIST(inProgressMs) : null,
    workCompletedAtIST: workCompletedMs ? formatIST(workCompletedMs) : null,
    finalVerificationAtIST: finalVerificationMs ? formatIST(finalVerificationMs) : null,
    resolvedAtIST: resolvedMs ? formatIST(resolvedMs) : null,
    rejectedAtIST: rejectedMs ? formatIST(rejectedMs) : null,

    // Formatted duration intervals
    timeToReview: formatDuration(timeToReviewMs),
    timeToAssign: formatDuration(timeToAssignMs),
    timeInRepair: formatDuration(timeInRepairMs),
    timeToVerify: formatDuration(timeToVerifyMs),
    totalResolutionTime: formatDuration(totalResolutionTimeMs),
    pendingDuration: formatDuration(pendingDurationMs),

    // Raw ms
    timeToReviewMs,
    timeToAssignMs,
    timeInRepairMs,
    timeToVerifyMs,
    totalResolutionTimeMs,
    pendingDurationMs,

    // Pending metadata
    isPending,
    isOverdue,
    hoursPending: pendingDurationMs ? Math.floor(pendingDurationMs / (3600 * 1000)) : 0,
    enteredCurrentStageIST: lastActionMs ? formatIST(lastActionMs) : formatIST(submittedMs),
    responsibleDepartment,
    responsibleStaff,

    // Full 8-stage progress tracker array
    stageProgress,
  };
}
