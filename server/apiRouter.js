import { Router } from 'express';
import {
  getDb,
  saveDb,
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  STAFF_MEMBERS,
  isComplaintOverdue,
  getActionTitle,
} from './db.js';

export const apiRouter = Router();

export const VALID_WORKFLOW_STATUSES = [
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

// Helper to enrich complaint with duration calculations and pending SLA status
export function enrichComplaintTimings(complaint) {
  const history = complaint.activityHistory || complaint.statusHistory || [];
  const stages = complaint.stageTimestamps || {};

  const findTimeMs = (statusName) => {
    const key = statusName.toLowerCase();
    for (const [k, v] of Object.entries(stages)) {
      if (k.toLowerCase().includes(key) && v) {
        return new Date(v).getTime();
      }
    }
    const item = history.find((h) => (h.newStatus || h.status || '').toLowerCase() === key);
    if (item) {
      return item.time || (item.timestamp ? new Date(item.timestamp).getTime() : null);
    }
    return null;
  };

  const submittedMs = complaint.createdAt || findTimeMs('submitted');
  const receivedMs = findTimeMs('received');
  const reviewMs = findTimeMs('under review');
  const assignedMs = findTimeMs('assigned');
  const inProgressMs = findTimeMs('in progress');
  const workCompletedMs = findTimeMs('work completed');
  const finalVerificationMs = findTimeMs('final verification');
  const resolvedMs = complaint.resolvedAt || findTimeMs('resolved');

  // 1. Time between complaint submission and HOD review
  const timeToReviewMs = (reviewMs && submittedMs) ? Math.max(0, reviewMs - submittedMs) : null;
  // 2. Time taken for staff assignment
  const timeToAssignMs = (assignedMs && submittedMs) ? Math.max(0, assignedMs - submittedMs) : null;
  // 3. Time spent in repair (between in progress and work completed / resolved)
  const repairEndMs = workCompletedMs || resolvedMs;
  const timeInRepairMs = (repairEndMs && inProgressMs) ? Math.max(0, repairEndMs - inProgressMs) : null;
  // 4. Time taken for verification
  const verifyEndMs = resolvedMs || finalVerificationMs;
  const timeToVerifyMs = (verifyEndMs && workCompletedMs) ? Math.max(0, verifyEndMs - workCompletedMs) : null;
  // 5. Total complaint resolution time
  const totalResolutionTimeMs = (resolvedMs && submittedMs) ? Math.max(0, resolvedMs - submittedMs) : null;

  // 6. How long the complaint has been pending at its current stage
  const isPending = !['Resolved', 'Closed', 'Rejected'].includes(complaint.status);
  const lastActionMs = complaint.updatedAt || (history.length > 0 ? (history[history.length - 1].time || new Date(history[history.length - 1].timestamp).getTime()) : submittedMs);
  const pendingDurationMs = isPending ? Math.max(0, Date.now() - (lastActionMs || submittedMs || Date.now())) : null;

  const isOverdue = isComplaintOverdue(complaint);

  return {
    ...complaint,
    isOverdue,
    timingMetrics: {
      timeToReviewMs,
      timeToAssignMs,
      timeInRepairMs,
      timeToVerifyMs,
      totalResolutionTimeMs,
      pendingDurationMs,
    },
    pendingDetails: isPending ? {
      enteredAt: lastActionMs ? new Date(lastActionMs).toISOString() : new Date().toISOString(),
      enteredAtMs: lastActionMs || Date.now(),
      pendingDurationMs,
      hoursPending: Math.floor((pendingDurationMs || 0) / (3600 * 1000)),
      responsibleDepartment: complaint.assignedDepartment || complaint.department || 'Campus Department',
      responsibleStaff: complaint.assignedTo || 'Unassigned (Awaiting Desk)',
      isOverdue,
    } : null,
  };
}

// Defined category groups
export const HOSTEL_MESS_CATEGORIES = [
  'Hostel-related issues',
  'Mess and food-related issues',
  'Food quality',
  'Food hygiene',
  'Mess timing',
  'Drinking water in hostel',
  'Hostel room maintenance',
  'Washroom cleaning in hostel',
  'Electricity in hostel',
  'Water supply in hostel',
  'Wi-Fi in hostel',
  'Other hostel-related issues',
];

export const INFRASTRUCTURE_CATEGORIES = [
  'Electrical problems',
  'Water supply',
  'Cleaning and sanitation',
  'Internet and Wi-Fi',
  'Campus Infrastructure',
  'Building repairs',
  'Campus roads & pathways',
  'Air Conditioning & Ventilation',
];

export const ACADEMIC_CLASSROOM_CATEGORIES = [
  'Classroom-related issues',
  'Furniture and classroom maintenance',
  'Smart projector / AV equipment',
  'Laboratory equipment',
];

// Authentication Middleware
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(403).json({ error: 'Session expired or invalid token' });
  }

  req.user = payload;
  next();
}

// 1. Login endpoint
apiRouter.post('/auth/login', (req, res) => {
  const { identifier, password, expectedRole } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Email or College ID and password are required' });
  }

  const db = getDb();
  const searchId = identifier.trim().toLowerCase();

  const user = db.users.find(
    (u) =>
      u.email.toLowerCase() === searchId ||
      (u.collegeId && u.collegeId.toLowerCase() === searchId)
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials. User not found.' });
  }

  const isValidPassword = verifyPassword(password, user.passwordHash, user.salt);
  if (!isValidPassword) {
    return res.status(401).json({ error: 'Invalid credentials. Incorrect password.' });
  }

  // If a specific role portal was chosen, check if user has that role
  const normalizeRole = (r) => (r === 'coordinator' ? 'hod' : r);
  if (expectedRole && normalizeRole(user.role) !== normalizeRole(expectedRole)) {
    const roleLabels = {
      student: 'Student',
      hod: 'HOD',
      coordinator: 'HOD',
      admin: 'Infrastructure Admin',
      hostel_mess: 'Hostel / Mess Staff',
    };
    return res.status(403).json({
      error: `Access denied. This account is registered as "${roleLabels[user.role] || user.role}", not "${roleLabels[expectedRole]}". Please use the correct login card.`,
    });
  }

  const token = generateToken(user);

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      collegeId: user.collegeId,
      name: user.name,
      role: user.role,
      assignedBlock: user.assignedBlock || null,
      assignedDepartment: user.assignedDepartment || null,
      title: user.title || null,
      department: user.department || null,
      hostel: user.hostel || null,
      phone: user.phone || null,
    },
  });
});

// 2. Get current authenticated user
apiRouter.get('/auth/me', authenticateToken, (req, res) => {
  const db = getDb();
  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      collegeId: user.collegeId,
      name: user.name,
      role: user.role,
      assignedBlock: user.assignedBlock || null,
      assignedDepartment: user.assignedDepartment || null,
      title: user.title || null,
      department: user.department || null,
      hostel: user.hostel || null,
      phone: user.phone || null,
    },
  });
});

// 3. Register student (Students only, privileged roles cannot self-register)
apiRouter.post('/auth/register-student', (req, res) => {
  const { name, email, collegeId, password, department, hostel, phone } = req.body;
  if (!name || !email || !collegeId || !password) {
    return res.status(400).json({ error: 'Name, email, college ID, and password are required' });
  }

  const db = getDb();
  const emailExists = db.users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (emailExists) {
    return res.status(400).json({ error: 'An account with this email already exists' });
  }

  const idExists = db.users.some(
    (u) => u.collegeId && u.collegeId.toLowerCase() === collegeId.trim().toLowerCase()
  );
  if (idExists) {
    return res.status(400).json({ error: 'An account with this College ID already exists' });
  }

  const { hash, salt } = hashPassword(password);
  const newUser = {
    id: `user-stu-${Date.now()}`,
    email: email.trim().toLowerCase(),
    collegeId: collegeId.trim().toUpperCase(),
    passwordHash: hash,
    salt,
    name: name.trim(),
    role: 'student',
    department: department ? department.trim() : 'General',
    hostel: hostel ? hostel.trim() : '',
    phone: phone ? phone.trim() : '',
    createdAt: Date.now(),
  };

  db.users.push(newUser);
  saveDb(db);

  const token = generateToken(newUser);
  res.status(201).json({
    token,
    user: {
      id: newUser.id,
      email: newUser.email,
      collegeId: newUser.collegeId,
      name: newUser.name,
      role: newUser.role,
      department: newUser.department,
      hostel: newUser.hostel,
      phone: newUser.phone,
    },
  });
});

// Helper: Check if user has permission to view a specific complaint
function canUserAccessComplaint(user, complaint) {
  if (user.role === 'student') {
    return complaint.studentId === user.id;
  }
  if (user.role === 'hod' || user.role === 'coordinator') {
    // HOD can only see complaints within their assigned block or department
    const matchesBlock = user.assignedBlock && complaint.block && complaint.block.toLowerCase().includes(user.assignedBlock.toLowerCase());
    const matchesDept = user.assignedDepartment && complaint.department && complaint.department.toLowerCase().includes(user.assignedDepartment.toLowerCase());
    return Boolean(matchesBlock || matchesDept);
  }
  if (user.role === 'admin') {
    // Admin sees all infrastructure complaints across campus
    return complaint.targetScope === 'admin' || INFRASTRUCTURE_CATEGORIES.includes(complaint.category);
  }
  if (user.role === 'hostel_mess') {
    // Hostel/Mess sees ONLY hostel and mess complaints
    return complaint.targetScope === 'hostel_mess' || HOSTEL_MESS_CATEGORIES.includes(complaint.category);
  }
  return false;
}

// 4. Get complaints (Server-side role filtering enforced!)
apiRouter.get('/complaints', authenticateToken, (req, res) => {
  const db = getDb();
  const user = req.user;

  let authorizedComplaints = [];

  if (user.role === 'student') {
    // Students only view their own complaints
    authorizedComplaints = db.complaints.filter((c) => c.studentId === user.id);
  } else if (user.role === 'hod' || user.role === 'coordinator') {
    // HOD sees complaints related to assigned block or department only
    authorizedComplaints = db.complaints.filter((c) => canUserAccessComplaint(user, c));
  } else if (user.role === 'admin') {
    // Infrastructure admin sees all infrastructure complaints across campus
    authorizedComplaints = db.complaints.filter((c) => canUserAccessComplaint(user, c));
  } else if (user.role === 'hostel_mess') {
    // Hostel/Mess staff sees only hostel and mess complaints
    authorizedComplaints = db.complaints.filter((c) => canUserAccessComplaint(user, c));
  }

  // Enrich with overdue indicator and automatic timing calculations
  const enriched = authorizedComplaints.map(enrichComplaintTimings);

  // Sort newest first
  enriched.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  res.json({ complaints: enriched });
});

// 5. Submit complaint (Students only)
apiRouter.post('/complaints', authenticateToken, (req, res) => {
  const user = req.user;
  if (user.role !== 'student') {
    return res.status(403).json({ error: 'Only registered students can submit new complaints' });
  }

  const { title, description, category, subcategory, block, location, roomNumber, priority, attachment } = req.body;

  if (!title || !description || !category || !location) {
    return res.status(400).json({ error: 'Title, description, category, and location are required' });
  }

  const db = getDb();

  // Generate unique complaint ID (CMP-2026-XXXX)
  const highestNumber = db.complaints.reduce((max, c) => {
    const match = c.id && c.id.match(/CMP-2026-(\d+)/);
    return match ? Math.max(max, parseInt(match[1], 10)) : max;
  }, 10);
  const nextId = `CMP-2026-${String(highestNumber + 1).padStart(4, '0')}`;

  // Smart Routing Logic based on category and location
  let targetScope = 'admin';
  let defaultDept = 'Campus Infrastructure & Estate';

  if (HOSTEL_MESS_CATEGORIES.includes(category) || (block && block.toLowerCase().includes('hostel')) || (location && location.toLowerCase().includes('mess'))) {
    targetScope = 'hostel_mess';
    defaultDept = 'Hostel & Mess Management';
  } else if (ACADEMIC_CLASSROOM_CATEGORIES.includes(category)) {
    targetScope = 'hod';
    defaultDept = user.department || 'Academic Department';
  } else if (INFRASTRUCTURE_CATEGORIES.includes(category)) {
    targetScope = 'admin';
    defaultDept = 'Campus Infrastructure & Estate';
  }

  // Derive department if block mentions it
  let complaintDept = defaultDept;
  if (block && block.includes('Block A')) {
    complaintDept = 'Information Technology';
  } else if (block && block.includes('Block B')) {
    complaintDept = 'Mechanical Engineering';
  }

  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();

  const initialActivity = {
    id: `act-${nowMs}-${Math.random().toString(36).substring(2, 7)}`,
    complaintId: nextId,
    previousStatus: null,
    newStatus: 'Submitted',
    action: 'Complaint Submitted',
    performedBy: `${user.name} (Student)`,
    department: complaintDept,
    timestamp: nowIso,
    time: nowMs,
    remarks: 'Complaint lodged by student through portal',
  };

  const newComplaint = {
    id: nextId,
    studentId: user.id,
    studentName: user.name,
    studentEmail: user.email,
    studentCollegeId: user.collegeId,
    title: title.trim(),
    description: description.trim(),
    category: category.trim(),
    subcategory: subcategory ? subcategory.trim() : '',
    targetScope,
    block: block ? block.trim() : (location.includes('Hostel') ? 'Hostel Complex' : 'Academic Block A'),
    location: location.trim(),
    roomNumber: roomNumber ? roomNumber.trim() : '',
    department: complaintDept,
    priority: priority || 'Medium',
    status: 'Submitted',
    assignedTo: null,
    assignedDepartment: defaultDept,
    attachment: attachment || null,
    createdAt: nowMs,
    createdAtIso: nowIso,
    updatedAt: nowMs,
    stageTimestamps: {
      submittedAt: nowIso,
    },
    activityHistory: [initialActivity],
    statusHistory: [initialActivity],
  };

  db.complaints.unshift(newComplaint);
  saveDb(db);

  res.status(201).json({
    complaint: enrichComplaintTimings(newComplaint),
    message: 'Complaint submitted successfully and routed to responsible department.',
  });
});

// 6. Update complaint status (Authorized roles: coordinator, admin, hostel_mess)
apiRouter.put('/complaints/:id/status', authenticateToken, (req, res) => {
  const user = req.user;
  const { id } = req.params;
  const { status, remarks, rejectionReason, priority } = req.body;

  if (user.role === 'student') {
    return res.status(403).json({ error: 'Students cannot update complaint administrative status' });
  }

  const validStatuses = VALID_WORKFLOW_STATUSES;
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  if (status === 'Rejected' && (!rejectionReason || !rejectionReason.trim())) {
    return res.status(400).json({ error: 'A clear rejection reason is required when rejecting a complaint' });
  }

  if (status === 'Resolved' && (!remarks || !remarks.trim())) {
    return res.status(400).json({ error: 'Resolution remarks are required when marking a complaint as Resolved' });
  }

  const db = getDb();
  const complaint = db.complaints.find((c) => c.id === id);
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  // Server-side authorization check
  if (!canUserAccessComplaint(user, complaint)) {
    return res.status(403).json({ error: 'You are not authorized to update this complaint' });
  }

  // Prevent duplicate activity records for identical action
  const prevStatus = complaint.status;
  const history = complaint.activityHistory || complaint.statusHistory || [];
  const lastActivity = history.length > 0 ? history[history.length - 1] : null;

  if (
    lastActivity &&
    lastActivity.newStatus === status &&
    lastActivity.remarks === (remarks?.trim() || `Status changed to ${status}`)
  ) {
    return res.json({
      complaint: enrichComplaintTimings(complaint),
      message: `Complaint is already at stage "${status}".`,
    });
  }

  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();

  complaint.status = status;
  complaint.updatedAt = nowMs;

  if (priority) {
    complaint.priority = priority;
  }

  if (!complaint.stageTimestamps) {
    complaint.stageTimestamps = {};
  }

  // Generate and store independent stage timestamp
  if (status === 'Received') {
    complaint.stageTimestamps.receivedAt = nowIso;
  } else if (status === 'Under Review') {
    complaint.stageTimestamps.underReviewAt = nowIso;
  } else if (status === 'Assigned') {
    complaint.stageTimestamps.staffAssignedAt = nowIso;
  } else if (status === 'In Progress') {
    complaint.stageTimestamps.workInProgressAt = nowIso;
  } else if (status === 'Work Completed') {
    complaint.stageTimestamps.workCompletedAt = nowIso;
  } else if (status === 'Final Verification') {
    complaint.stageTimestamps.finalVerificationAt = nowIso;
  } else if (status === 'Resolved') {
    complaint.stageTimestamps.resolvedAt = nowIso;
    complaint.resolvedAt = nowMs;
    complaint.resolutionRemarks = remarks.trim();
  } else if (status === 'Rejected') {
    complaint.stageTimestamps.rejectedAt = nowIso;
    complaint.rejectedAt = nowMs;
    complaint.rejectionReason = rejectionReason.trim();
  }

  const activityRecord = {
    id: `act-${nowMs}-${Math.random().toString(36).substring(2, 7)}`,
    complaintId: complaint.id,
    previousStatus: prevStatus,
    newStatus: status,
    action: getActionTitle(status),
    performedBy: `${user.name} (${user.title || user.role})`,
    department: complaint.assignedDepartment || complaint.department || 'Campus Department',
    timestamp: nowIso,
    time: nowMs,
    remarks: status === 'Rejected'
      ? `Rejected: ${rejectionReason.trim()}`
      : status === 'Resolved'
      ? `Resolution: ${remarks.trim()}`
      : remarks?.trim() || `Status updated from ${prevStatus} to ${status}`,
  };

  if (!complaint.activityHistory) complaint.activityHistory = [];
  complaint.activityHistory.push(activityRecord);
  complaint.statusHistory = complaint.activityHistory;

  saveDb(db);

  res.json({
    complaint: enrichComplaintTimings(complaint),
    message: `Complaint status updated to ${status}`,
  });
});

// 7. Assign staff to complaint
apiRouter.put('/complaints/:id/assign', authenticateToken, (req, res) => {
  const user = req.user;
  const { id } = req.params;
  const { staffName, department, priority, remarks } = req.body;

  if (user.role === 'student') {
    return res.status(403).json({ error: 'Students cannot assign staff members' });
  }

  if (!staffName || !staffName.trim()) {
    return res.status(400).json({ error: 'Staff member name is required for assignment' });
  }

  const db = getDb();
  const complaint = db.complaints.find((c) => c.id === id);
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  if (!canUserAccessComplaint(user, complaint)) {
    return res.status(403).json({ error: 'You are not authorized to manage this complaint' });
  }

  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const prevStatus = complaint.status;

  complaint.assignedTo = staffName.trim();
  if (department) complaint.assignedDepartment = department.trim();
  if (priority) complaint.priority = priority;
  complaint.updatedAt = nowMs;

  // Advance to Assigned if it was Submitted, Received, or Under Review
  if (['Submitted', 'Received', 'Under Review'].includes(complaint.status)) {
    complaint.status = 'Assigned';
  }

  if (!complaint.stageTimestamps) {
    complaint.stageTimestamps = {};
  }
  complaint.stageTimestamps.staffAssignedAt = nowIso;

  const assignActivity = {
    id: `act-${nowMs}-${Math.random().toString(36).substring(2, 7)}`,
    complaintId: complaint.id,
    previousStatus: prevStatus,
    newStatus: complaint.status,
    action: 'Staff Assigned',
    performedBy: `${user.name} (${user.title || user.role})`,
    department: complaint.assignedDepartment,
    timestamp: nowIso,
    time: nowMs,
    remarks: remarks?.trim() || `Assigned to ${staffName.trim()}`,
  };

  if (!complaint.activityHistory) complaint.activityHistory = [];
  complaint.activityHistory.push(assignActivity);
  complaint.statusHistory = complaint.activityHistory;

  saveDb(db);

  res.json({
    complaint: enrichComplaintTimings(complaint),
    message: `Assigned to ${staffName.trim()}`,
  });
});

// 8. Reassign or escalate complaint to another department
apiRouter.put('/complaints/:id/reassign', authenticateToken, (req, res) => {
  const user = req.user;
  const { id } = req.params;
  const { targetScope, department, reason } = req.body;

  if (user.role === 'student') {
    return res.status(403).json({ error: 'Students cannot reassign complaints' });
  }

  const db = getDb();
  const complaint = db.complaints.find((c) => c.id === id);
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  if (!canUserAccessComplaint(user, complaint)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();

  if (targetScope) complaint.targetScope = targetScope;
  if (department) complaint.assignedDepartment = department;
  complaint.updatedAt = nowMs;

  const reassignActivity = {
    id: `act-${nowMs}-${Math.random().toString(36).substring(2, 7)}`,
    complaintId: complaint.id,
    previousStatus: complaint.status,
    newStatus: complaint.status,
    action: 'Complaint Reassigned / Escalated',
    performedBy: `${user.name} (${user.role})`,
    department: complaint.assignedDepartment,
    timestamp: nowIso,
    time: nowMs,
    remarks: `Reassigned / Escalated to ${department || targetScope}. Note: ${reason || 'Cross-departmental requirement'}`,
  };

  if (!complaint.activityHistory) complaint.activityHistory = [];
  complaint.activityHistory.push(reassignActivity);
  complaint.statusHistory = complaint.activityHistory;

  saveDb(db);

  res.json({
    complaint: enrichComplaintTimings(complaint),
    message: 'Complaint reassigned successfully',
  });
});

// 9. Submit student feedback after resolution
apiRouter.post('/complaints/:id/feedback', authenticateToken, (req, res) => {
  const user = req.user;
  const { id } = req.params;
  const { rating, comment } = req.body;

  if (user.role !== 'student') {
    return res.status(403).json({ error: 'Only the student who submitted the complaint can submit feedback' });
  }

  const db = getDb();
  const complaint = db.complaints.find((c) => c.id === id);
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  if (complaint.studentId !== user.id) {
    return res.status(403).json({ error: 'You can only provide feedback on your own complaints' });
  }

  if (complaint.status !== 'Resolved' && complaint.status !== 'Closed') {
    return res.status(400).json({ error: 'Feedback can only be provided after a complaint is resolved' });
  }

  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();

  complaint.feedback = {
    rating: Number(rating) || 5,
    comment: (comment || '').trim(),
    submittedAt: nowMs,
    submittedAtIso: nowIso,
  };
  complaint.updatedAt = nowMs;

  const feedbackActivity = {
    id: `act-${nowMs}-${Math.random().toString(36).substring(2, 7)}`,
    complaintId: complaint.id,
    previousStatus: complaint.status,
    newStatus: complaint.status,
    action: 'Student Resolution Feedback Submitted',
    performedBy: `${user.name} (Student)`,
    department: complaint.assignedDepartment || complaint.department || 'Campus Department',
    timestamp: nowIso,
    time: nowMs,
    remarks: `Rated ${complaint.feedback.rating} / 5 Stars. Comment: "${complaint.feedback.comment}"`,
  };

  if (!complaint.activityHistory) complaint.activityHistory = [];
  complaint.activityHistory.push(feedbackActivity);
  complaint.statusHistory = complaint.activityHistory;

  saveDb(db);

  res.json({
    complaint: enrichComplaintTimings(complaint),
    message: 'Thank you for submitting your feedback!',
  });
});

// 10. Get staff directory for assignments
apiRouter.get('/staff', authenticateToken, (req, res) => {
  const user = req.user;
  let relevantStaff = STAFF_MEMBERS;

  if (user.role === 'hod' || user.role === 'coordinator') {
    relevantStaff = STAFF_MEMBERS.filter(
      (s) => s.department === user.assignedDepartment || s.block === user.assignedBlock || s.department === 'Infrastructure'
    );
  } else if (user.role === 'admin') {
    relevantStaff = STAFF_MEMBERS.filter((s) => s.department === 'Infrastructure');
  } else if (user.role === 'hostel_mess') {
    relevantStaff = STAFF_MEMBERS.filter((s) => s.department === 'Hostel/Mess');
  }

  res.json({ staff: relevantStaff });
});

// 11. Role-aware stats endpoint
apiRouter.get('/stats', authenticateToken, (req, res) => {
  const db = getDb();
  const user = req.user;

  let authorized = [];
  if (user.role === 'student') {
    authorized = db.complaints.filter((c) => c.studentId === user.id);
  } else {
    authorized = db.complaints.filter((c) => canUserAccessComplaint(user, c));
  }

  const pending = authorized.filter((c) => ['Submitted', 'Pending', 'Under Review'].includes(c.status)).length;
  const inProgress = authorized.filter((c) => ['Assigned', 'In Progress'].includes(c.status)).length;
  const resolved = authorized.filter((c) => ['Resolved', 'Closed'].includes(c.status)).length;
  const rejected = authorized.filter((c) => c.status === 'Rejected').length;
  const overdue = authorized.filter((c) => isComplaintOverdue(c)).length;

  const categories = {};
  authorized.forEach((c) => {
    categories[c.category] = (categories[c.category] || 0) + 1;
  });

  res.json({
    total: authorized.length,
    pending,
    inProgress,
    resolved,
    rejected,
    overdue,
    categories,
  });
});
