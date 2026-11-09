import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const JWT_SECRET = process.env.JWT_SECRET || 'campus-bridge-secure-key-2026-token-secret-jwt';

// Helper: Password Hashing (PBKDF2 with SHA-512)
export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

export function verifyPassword(password, hash, salt) {
  const verify = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return hash === verify;
}

// Helper: Token Generation & Verification
export function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    collegeId: user.collegeId,
    role: user.role,
    name: user.name,
    assignedBlock: user.assignedBlock || null,
    assignedDepartment: user.assignedDepartment || null,
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64url');
  return `${data}.${signature}`;
}

export function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [data, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64url');
  if (signature !== expectedSig) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// Initial Staff Pool
// Initial Staff Pool & Faculty Directory
export const STAFF_MEMBERS = [
  // IT Department Faculty & Teachers
  { id: 'stf-15', name: 'Dr. Esha Tripathi', designation: 'Professor & Senior Faculty', roleType: 'teacher', department: 'Information Technology', block: 'Academic Block A', email: 'esha.tripathi@campus.edu', phone: '+91 98765 11015' },
  { id: 'stf-16', name: 'Ashish Tripathi', designation: 'Assistant Professor (IT)', roleType: 'teacher', department: 'Information Technology', block: 'Academic Block A', email: 'ashish.tripathi@campus.edu', phone: '+91 98765 11016' },
  { id: 'stf-17', name: 'Swetha Sri', designation: 'Assistant Professor & Lab Mentor', roleType: 'teacher', department: 'Information Technology', block: 'Academic Block A', email: 'swetha.sri@campus.edu', phone: '+91 98765 11017' },
  { id: 'stf-18', name: 'Vatsya Tiwari', designation: 'Assistant Professor & Project In-charge', roleType: 'teacher', department: 'Information Technology', block: 'Academic Block A', email: 'vatsya.tiwari@campus.edu', phone: '+91 98765 11018' },
  { id: 'stf-19', name: 'Shika Verma', designation: 'Assistant Professor & Student Counselor', roleType: 'teacher', department: 'Information Technology', block: 'Academic Block A', email: 'shika.verma@campus.edu', phone: '+91 98765 11019' },
  // Department Coordinators & Technical Staff
  { id: 'stf-12', name: 'Prof. Sneha Sen', designation: 'IT Department Lab In-charge', roleType: 'staff', department: 'Information Technology', block: 'Academic Block A', email: 'profsnehasen@campus.edu', phone: '+91 98765 00000' },
  { id: 'stf-13', name: 'Vikas Chauhan', designation: 'System Administrator', roleType: 'staff', department: 'Information Technology', block: 'Academic Block A', email: 'vikaschauhan@campus.edu', phone: '+91 98765 00000' },
  { id: 'stf-14', name: 'Anita Nair', designation: 'Classroom Facilities Coordinator', roleType: 'staff', department: 'Information Technology', block: 'Academic Block A', email: 'anitanair@campus.edu', phone: '+91 98765 00000' },
  // Campus Infrastructure Technicians
  { id: 'stf-1', name: 'Sunil Kumar', designation: 'Senior Electrician', roleType: 'infrastructure', department: 'Infrastructure', category: 'Electrical', email: 'sunilkumar@campus.edu', phone: '+91 98765 00000' },
  { id: 'stf-2', name: 'Manoj Yadav', designation: 'Plumbing Supervisor', roleType: 'infrastructure', department: 'Infrastructure', category: 'Water Supply', email: 'manojyadav@campus.edu', phone: '+91 98765 00000' },
  { id: 'stf-3', name: 'Dinesh Verma', designation: 'HVAC & AC Technician', roleType: 'infrastructure', department: 'Infrastructure', category: 'Classroom Maintenance', email: 'dineshverma@campus.edu', phone: '+91 98765 00000' },
  { id: 'stf-4', name: 'Ramesh Pal', designation: 'Campus Civil & Furniture Specialist', roleType: 'infrastructure', department: 'Infrastructure', category: 'Furniture', email: 'rameshpal@campus.edu', phone: '+91 98765 00000' },
  { id: 'stf-5', name: 'Amit Ghosh', designation: 'Network & Wi-Fi Engineer', roleType: 'infrastructure', department: 'Infrastructure', category: 'Internet', email: 'amitghosh@campus.edu', phone: '+91 98765 00000' },
  { id: 'stf-6', name: 'Deepak Lal', designation: 'Sanitation & Cleaning Head', roleType: 'infrastructure', department: 'Infrastructure', category: 'Cleaning', email: 'deepaklal@campus.edu', phone: '+91 98765 00000' },
  // Hostel & Mess Staff
  { id: 'stf-7', name: 'Chef Ramlal', designation: 'Head Mess Cook & Supervisor', roleType: 'hostel_mess', department: 'Hostel/Mess', category: 'Mess Food', email: 'chef.ramlal@campus.edu', phone: '+91 98765 00000' },
  { id: 'stf-8', name: 'Kavita Devi', designation: 'Assistant Warden (Gargi Hostel)', roleType: 'hostel_mess', department: 'Hostel/Mess', category: 'Hostel', email: 'kavita.devi@campus.edu', phone: '+91 98765 00000' },
  { id: 'stf-9', name: 'Suresh Singh', designation: 'Assistant Warden (Vikram Hostel)', roleType: 'hostel_mess', department: 'Hostel/Mess', category: 'Hostel', email: 'suresh.singh@campus.edu', phone: '+91 98765 00000' },
  { id: 'stf-10', name: 'Meena Kumari', designation: 'Mess Hygiene & Quality Inspector', roleType: 'hostel_mess', department: 'Hostel/Mess', category: 'Mess Food', email: 'meena.kumari@campus.edu', phone: '+91 98765 00000' },
  { id: 'stf-11', name: 'Pawan Kumar', designation: 'Hostel Utilities & Electrical Technician', roleType: 'hostel_mess', department: 'Hostel/Mess', category: 'Hostel', email: 'pawan.kumar@campus.edu', phone: '+91 98765 00000' },
];

function getInitialDatabase() {
  const studentPw = hashPassword('student123');
  const hodPw = hashPassword('hod123');
  const adminPw = hashPassword('admin123');
  const hmPw = hashPassword('hostel123');

  const now = Date.now();

  const users = [
    {
      id: 'user-stu-1',
      email: 'student@campus.edu',
      collegeId: 'STU-2026-001',
      passwordHash: studentPw.hash,
      salt: studentPw.salt,
      name: 'Ananya Pandey',
      role: 'student',
      department: 'Information Technology',
      hostel: 'Gargi Hostel · Room 304',
      phone: '+91 98765 43210',
      createdAt: now - 30 * 24 * 3600 * 1000,
    },
    {
      id: 'user-stu-2',
      email: 'rahul.sharma@campus.edu',
      collegeId: 'STU-2026-002',
      passwordHash: studentPw.hash,
      salt: studentPw.salt,
      name: 'Rahul Sharma',
      role: 'student',
      department: 'Mechanical Engineering',
      hostel: 'Vikram Hostel · Room 112',
      phone: '+91 98765 43211',
      createdAt: now - 20 * 24 * 3600 * 1000,
    },
    {
      id: 'user-hod-1',
      email: 'hod.it@campus.edu',
      collegeId: 'HOD-IT-001',
      passwordHash: hodPw.hash,
      salt: hodPw.salt,
      name: 'Dr. Piyush Bhushan',
      role: 'hod',
      assignedDepartment: 'Information Technology',
      assignedBlock: 'Academic Block A',
      title: 'HOD · Department of Information Technology',
      phone: '+91 98765 11001',
      createdAt: now - 60 * 24 * 3600 * 1000,
    },
    {
      id: 'user-hod-2',
      email: 'hod.mech@campus.edu',
      collegeId: 'HOD-MECH-001',
      passwordHash: hodPw.hash,
      salt: hodPw.salt,
      name: 'Dr. Arvind Saxena',
      role: 'hod',
      assignedDepartment: 'Mechanical Engineering',
      assignedBlock: 'Academic Block B',
      title: 'HOD · Department of Mechanical Engineering',
      phone: '+91 98765 11002',
      createdAt: now - 60 * 24 * 3600 * 1000,
    },
    {
      id: 'user-adm-1',
      email: 'admin.infra@campus.edu',
      collegeId: 'ADM-INFRA-001',
      passwordHash: adminPw.hash,
      salt: adminPw.salt,
      name: 'Rajesh Sharma',
      role: 'admin',
      assignedDepartment: 'Campus Infrastructure & Estate',
      title: 'Chief Estate & Infrastructure Officer',
      phone: '+91 98765 22001',
      createdAt: now - 90 * 24 * 3600 * 1000,
    },
    {
      id: 'user-hm-1',
      email: 'hostel.mess@campus.edu',
      collegeId: 'HM-MESS-001',
      passwordHash: hmPw.hash,
      salt: hmPw.salt,
      name: 'Sunita Verma',
      role: 'hostel_mess',
      assignedDepartment: 'Hostel & Mess Management',
      title: 'Chief Warden & Food Safety Officer',
      phone: '+91 98765 33001',
      createdAt: now - 90 * 24 * 3600 * 1000,
    },
  ];

  const complaints = [
    {
      id: 'CMP-2026-0001',
      studentId: 'user-stu-1',
      studentName: 'Ananya Pandey',
      studentEmail: 'student@campus.edu',
      studentCollegeId: 'STU-2026-001',
      title: 'Power backup failed in Gargi Hostel Block C',
      description: 'The inverter system in Block C tripped last evening. Ceiling fans and corridor emergency lights went off for over 3 hours during study hours.',
      category: 'Hostel-related issues',
      subcategory: 'Electricity in hostel',
      targetScope: 'hostel_mess', // routed to hostel/mess
      block: 'Gargi Hostel',
      roomNumber: 'Wing C - 3rd Floor',
      location: 'Gargi Hostel · Wing C',
      priority: 'High',
      status: 'In Progress',
      assignedTo: 'Pawan Kumar',
      assignedDepartment: 'Hostel & Mess Management',
      createdAt: now - 18 * 3600 * 1000,
      updatedAt: now - 4 * 3600 * 1000,
      statusHistory: [
        { status: 'Submitted', time: now - 18 * 3600 * 1000, actor: 'Ananya Pandey', remarks: 'Complaint logged' },
        { status: 'Under Review', time: now - 14 * 3600 * 1000, actor: 'Sunita Verma', remarks: 'Hostel office acknowledged issue' },
        { status: 'Assigned', time: now - 10 * 3600 * 1000, actor: 'Sunita Verma', remarks: 'Assigned to Pawan Kumar (Utilities Technician)' },
        { status: 'In Progress', time: now - 4 * 3600 * 1000, actor: 'Pawan Kumar', remarks: 'Testing phase inverter capacitor replacement' },
      ],
    },
    {
      id: 'CMP-2026-0002',
      studentId: 'user-stu-1',
      studentName: 'Ananya Pandey',
      studentEmail: 'student@campus.edu',
      studentCollegeId: 'STU-2026-001',
      title: 'Mess menu food hygiene & quality check',
      description: 'The evening dal was watery and chapattis were undercooked. Mess dining tables also need proper sanitization between meal slots.',
      category: 'Mess and food-related issues',
      subcategory: 'Food hygiene',
      targetScope: 'hostel_mess',
      block: 'Main Dining Complex',
      location: 'Main Cafeteria & Mess 1',
      priority: 'Medium',
      status: 'Under Review',
      assignedTo: null,
      assignedDepartment: 'Hostel & Mess Management',
      createdAt: now - 26 * 3600 * 1000,
      updatedAt: now - 26 * 3600 * 1000,
      statusHistory: [
        { status: 'Submitted', time: now - 26 * 3600 * 1000, actor: 'Ananya Pandey', remarks: 'Complaint logged' },
        { status: 'Under Review', time: now - 20 * 3600 * 1000, actor: 'Sunita Verma', remarks: 'Forwarded to Mess Committee inspection squad' },
      ],
    },
    {
      id: 'CMP-2026-0003',
      studentId: 'user-stu-1',
      studentName: 'Ananya Pandey',
      studentEmail: 'student@campus.edu',
      studentCollegeId: 'STU-2026-001',
      title: 'Street light near library gate keeps flickering',
      description: 'The high-mast LED fixture near the North Library Gate flickers continuously after sunset, causing dark blind spots on the pathway.',
      category: 'Electrical problems',
      subcategory: 'Campus Infrastructure',
      targetScope: 'admin',
      block: 'Central Campus',
      location: 'North Gate Road · Library Pathway',
      priority: 'Medium',
      status: 'Assigned',
      assignedTo: 'Sunil Kumar',
      assignedDepartment: 'Campus Infrastructure & Estate',
      createdAt: now - 42 * 3600 * 1000,
      updatedAt: now - 12 * 3600 * 1000,
      statusHistory: [
        { status: 'Submitted', time: now - 42 * 3600 * 1000, actor: 'Ananya Pandey', remarks: 'Complaint logged' },
        { status: 'Assigned', time: now - 12 * 3600 * 1000, actor: 'Rajesh Sharma', remarks: 'Assigned to Sunil Kumar (Senior Electrician)' },
      ],
    },
    {
      id: 'CMP-2026-0004',
      studentId: 'user-stu-1',
      studentName: 'Ananya Pandey',
      studentEmail: 'student@campus.edu',
      studentCollegeId: 'STU-2026-001',
      title: 'Smart projector & audio in IT Lab 3 not working',
      description: 'The ceiling mount HDMI and overhead audio system in IT Lab 3 has no video output. Faculty presentations are being disrupted.',
      category: 'Classroom-related issues',
      subcategory: 'Lab Equipment',
      targetScope: 'hod',
      block: 'Academic Block A',
      department: 'Information Technology',
      location: 'Academic Block A · Room 302 (IT Lab 3)',
      priority: 'High',
      status: 'In Progress',
      assignedTo: 'Vikas Chauhan',
      assignedDepartment: 'Information Technology',
      createdAt: now - 12 * 3600 * 1000,
      updatedAt: now - 2 * 3600 * 1000,
      statusHistory: [
        { status: 'Submitted', time: now - 12 * 3600 * 1000, actor: 'Ananya Pandey', remarks: 'Complaint logged' },
        { status: 'Under Review', time: now - 8 * 3600 * 1000, actor: 'Dr. Piyush Bhushan', remarks: 'HOD reviewed - urgent for afternoon labs' },
        { status: 'Assigned', time: now - 6 * 3600 * 1000, actor: 'Dr. Piyush Bhushan', remarks: 'Assigned to Vikas Chauhan' },
        { status: 'In Progress', time: now - 2 * 3600 * 1000, actor: 'Vikas Chauhan', remarks: 'Replacing faulty HDMI splitter converter' },
      ],
    },
    {
      id: 'CMP-2026-0005',
      studentId: 'user-stu-1',
      studentName: 'Ananya Pandey',
      studentEmail: 'student@campus.edu',
      studentCollegeId: 'STU-2026-001',
      title: 'Broken benches & loose chair armrests in LH 101',
      description: 'Three desks in row 4 of Lecture Hall 101 have broken armrests and sharp exposed metal screws which can tear clothes or cause injury.',
      category: 'Furniture and classroom maintenance',
      subcategory: 'Furniture',
      targetScope: 'hod',
      block: 'Academic Block A',
      department: 'Information Technology',
      location: 'Academic Block A · Lecture Hall 101',
      priority: 'Medium',
      status: 'Resolved',
      assignedTo: 'Anita Nair',
      assignedDepartment: 'Information Technology',
      createdAt: now - 72 * 3600 * 1000,
      updatedAt: now - 24 * 3600 * 1000,
      resolutionRemarks: 'Carpentry staff repaired armrests and filed down screws. Inspected all rows in LH 101.',
      feedback: { rating: 5, comment: 'Quick repair done before our morning test! Thank you.' },
      statusHistory: [
        { status: 'Submitted', time: now - 72 * 3600 * 1000, actor: 'Ananya Pandey', remarks: 'Complaint logged' },
        { status: 'Assigned', time: now - 60 * 3600 * 1000, actor: 'Dr. Piyush Bhushan', remarks: 'Assigned to Anita Nair' },
        { status: 'In Progress', time: now - 48 * 3600 * 1000, actor: 'Anita Nair', remarks: 'Carpentry work in progress' },
        { status: 'Resolved', time: now - 24 * 3600 * 1000, actor: 'Anita Nair', remarks: 'Repairs completed and safety verified' },
      ],
    },
    {
      id: 'CMP-2026-0006',
      studentId: 'user-stu-1',
      studentName: 'Ananya Pandey',
      studentEmail: 'student@campus.edu',
      studentCollegeId: 'STU-2026-001',
      title: 'Water cooler cooling coil leaking on 2nd floor',
      description: 'The drinking water cooler near the south staircase has a continuous puddle of water leaking onto the corridor tiles, making the floor slippery.',
      category: 'Water supply',
      subcategory: 'Drinking Water & Plumbing',
      targetScope: 'admin',
      block: 'Academic Block A',
      location: 'Academic Block A · Floor 2 Corridor',
      priority: 'High',
      status: 'Submitted', // Submitted > 60 hours ago -> OVERDUE!
      assignedTo: null,
      assignedDepartment: 'Campus Infrastructure & Estate',
      createdAt: now - 64 * 3600 * 1000,
      updatedAt: now - 64 * 3600 * 1000,
      statusHistory: [
        { status: 'Submitted', time: now - 64 * 3600 * 1000, actor: 'Ananya Pandey', remarks: 'Complaint logged' },
      ],
    },
    {
      id: 'CMP-2026-0007',
      studentId: 'user-stu-2',
      studentName: 'Rahul Sharma',
      studentEmail: 'rahul.sharma@campus.edu',
      studentCollegeId: 'STU-2026-002',
      title: 'Lathe machine chuck vibration in Workshop 2',
      description: 'The 3-jaw chuck on Lathe #4 in the Mechanical Workshop has abnormal runout vibration during turning operations.',
      category: 'Classroom-related issues',
      subcategory: 'Workshop Equipment',
      targetScope: 'hod',
      block: 'Academic Block B',
      department: 'Mechanical Engineering',
      location: 'Academic Block B · Ground Floor Workshop',
      priority: 'High',
      status: 'In Progress',
      assignedTo: 'Rajesh Sharma',
      assignedDepartment: 'Mechanical Engineering',
      createdAt: now - 20 * 3600 * 1000,
      updatedAt: now - 6 * 3600 * 1000,
      statusHistory: [
        { status: 'Submitted', time: now - 20 * 3600 * 1000, actor: 'Rahul Sharma', remarks: 'Complaint logged' },
        { status: 'In Progress', time: now - 6 * 3600 * 1000, actor: 'Dr. Arvind Saxena', remarks: 'Machine technician recalibrating chuck spindle' },
      ],
    },
    {
      id: 'CMP-2026-0008',
      studentId: 'user-stu-1',
      studentName: 'Ananya Pandey',
      studentEmail: 'student@campus.edu',
      studentCollegeId: 'STU-2026-001',
      title: 'High-speed campus Wi-Fi access drop in Library Hall',
      description: 'Eduroam / CampusBridge Wi-Fi authenticates but provides zero packet throughput near reference stacks in the central library.',
      category: 'Internet and Wi-Fi',
      subcategory: 'Network',
      targetScope: 'admin',
      block: 'Central Library',
      location: 'Central Library · 1st Floor Stacks',
      priority: 'Low',
      status: 'Resolved',
      assignedTo: 'Amit Ghosh',
      assignedDepartment: 'Campus Infrastructure & Estate',
      createdAt: now - 96 * 3600 * 1000,
      updatedAt: now - 48 * 3600 * 1000,
      resolutionRemarks: 'Rebooted Cisco switch stack and reset channel interference frequency.',
      feedback: { rating: 4, comment: 'Signal is good now, thanks!' },
      statusHistory: [
        { status: 'Submitted', time: now - 96 * 3600 * 1000, actor: 'Ananya Pandey', remarks: 'Complaint logged' },
        { status: 'Assigned', time: now - 80 * 3600 * 1000, actor: 'Rajesh Sharma', remarks: 'Assigned to Amit Ghosh' },
        { status: 'Resolved', time: now - 48 * 3600 * 1000, actor: 'Amit Ghosh', remarks: 'Switch stack reconfigured' },
      ],
    },
  ];

  return { users, complaints };
}

// Helper: Action titles for workflow stages
export function getActionTitle(status) {
  switch (status) {
    case 'Submitted': return 'Complaint Submitted';
    case 'Received': return 'Complaint Received by Department';
    case 'Under Review': return 'Under Review by Department';
    case 'Assigned': return 'Staff Assigned to Complaint';
    case 'In Progress': return 'Work In Progress';
    case 'Work Completed': return 'Work Completed by Staff';
    case 'Final Verification': return 'Final Verification';
    case 'Resolved': return 'Complaint Resolved';
    case 'Rejected': return 'Complaint Rejected';
    default: return `Status updated to ${status}`;
  }
}

// Normalizes and guarantees activity history & stage timestamps for any complaint
export function normalizeComplaintActivities(complaint) {
  if (!complaint) return complaint;

  if (!complaint.stageTimestamps) {
    complaint.stageTimestamps = {};
  }

  // Ensure activityHistory exists
  if (!complaint.activityHistory || !Array.isArray(complaint.activityHistory) || complaint.activityHistory.length === 0) {
    if (complaint.statusHistory && Array.isArray(complaint.statusHistory) && complaint.statusHistory.length > 0) {
      complaint.activityHistory = complaint.statusHistory.map((sh, idx) => {
        const timeMs = sh.time || (sh.timestamp ? new Date(sh.timestamp).getTime() : (complaint.createdAt || Date.now()));
        const timeIso = sh.timestamp || new Date(timeMs).toISOString();
        const prev = idx > 0 ? (complaint.statusHistory[idx - 1].status || null) : null;
        return {
          id: sh.id || `act-${complaint.id}-${idx + 1}`,
          complaintId: complaint.id,
          previousStatus: prev,
          newStatus: sh.status,
          action: sh.action || getActionTitle(sh.status),
          performedBy: sh.actor || sh.performedBy || 'System',
          department: sh.department || complaint.assignedDepartment || complaint.department || 'Campus Department',
          timestamp: timeIso,
          time: timeMs,
          remarks: sh.remarks || '',
        };
      });
    } else {
      const timeMs = complaint.createdAt || Date.now();
      const timeIso = new Date(timeMs).toISOString();
      complaint.activityHistory = [
        {
          id: `act-${complaint.id}-1`,
          complaintId: complaint.id,
          previousStatus: null,
          newStatus: complaint.status || 'Submitted',
          action: getActionTitle(complaint.status || 'Submitted'),
          performedBy: complaint.studentName ? `${complaint.studentName} (Student)` : 'Student',
          department: complaint.assignedDepartment || complaint.department || 'Campus Department',
          timestamp: timeIso,
          time: timeMs,
          remarks: 'Complaint lodged by student through portal',
        },
      ];
    }
  }

  // Backfill stageTimestamps from activities if missing
  complaint.activityHistory.forEach((act) => {
    const iso = act.timestamp || (act.time ? new Date(act.time).toISOString() : new Date().toISOString());
    const s = (act.newStatus || act.status || '').toLowerCase();
    if (s === 'submitted' && !complaint.stageTimestamps.submittedAt) {
      complaint.stageTimestamps.submittedAt = iso;
    } else if (s === 'received' && !complaint.stageTimestamps.receivedAt) {
      complaint.stageTimestamps.receivedAt = iso;
    } else if (s === 'under review' && !complaint.stageTimestamps.underReviewAt) {
      complaint.stageTimestamps.underReviewAt = iso;
    } else if (s === 'assigned' && !complaint.stageTimestamps.staffAssignedAt) {
      complaint.stageTimestamps.staffAssignedAt = iso;
    } else if (s === 'in progress' && !complaint.stageTimestamps.workInProgressAt) {
      complaint.stageTimestamps.workInProgressAt = iso;
    } else if (s === 'work completed' && !complaint.stageTimestamps.workCompletedAt) {
      complaint.stageTimestamps.workCompletedAt = iso;
    } else if (s === 'final verification' && !complaint.stageTimestamps.finalVerificationAt) {
      complaint.stageTimestamps.finalVerificationAt = iso;
    } else if (s === 'resolved' && !complaint.stageTimestamps.resolvedAt) {
      complaint.stageTimestamps.resolvedAt = iso;
    } else if (s === 'rejected' && !complaint.stageTimestamps.rejectedAt) {
      complaint.stageTimestamps.rejectedAt = iso;
    }
  });

  if (!complaint.stageTimestamps.submittedAt && complaint.createdAt) {
    complaint.stageTimestamps.submittedAt = new Date(complaint.createdAt).toISOString();
  }

  // Keep statusHistory in sync with activityHistory
  complaint.statusHistory = complaint.activityHistory;

  return complaint;
}

// Database reading and writing with persistence
export function getDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initialData = getInitialDatabase();
    if (initialData.complaints) {
      initialData.complaints.forEach(normalizeComplaintActivities);
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }
  try {
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    const data = JSON.parse(content);
    if (data.complaints && Array.isArray(data.complaints)) {
      data.complaints.forEach(normalizeComplaintActivities);
    }
    return data;
  } catch {
    const initialData = getInitialDatabase();
    if (initialData.complaints) {
      initialData.complaints.forEach(normalizeComplaintActivities);
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }
}

export function saveDb(data) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (data.complaints && Array.isArray(data.complaints)) {
    data.complaints.forEach(normalizeComplaintActivities);
  }
  const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempFile, DB_FILE);
}

// Helper: Check if complaint is overdue (> 48 hours without being Resolved or Rejected)
export function isComplaintOverdue(complaint) {
  const resolvedStatuses = ['Resolved', 'Closed', 'Rejected'];
  if (resolvedStatuses.includes(complaint.status)) return false;
  const ageMs = Date.now() - (complaint.createdAt || 0);
  return ageMs > 48 * 60 * 60 * 1000;
}

