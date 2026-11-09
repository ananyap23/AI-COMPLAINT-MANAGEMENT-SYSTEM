import express from 'express';
import cors from 'cors';
import { apiRouter } from '../server/apiRouter.js';
import { getDb } from '../server/db.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', apiRouter);

const server = app.listen(5099, async () => {
  console.log('Testing CampusBridge Complaint Management System on port 5099...\n');
  const baseUrl = 'http://localhost:5099/api';

  try {
    let passed = 0;
    let failed = 0;

    function assert(condition, message) {
      if (condition) {
        console.log(`  ✓ ${message}`);
        passed++;
      } else {
        console.error(`  ✗ FAIL: ${message}`);
        failed++;
      }
    }

    console.log('--- TEST SUITE 1: 4-ROLE AUTHENTICATION & LOGIN ---');

    // 1. Student Login
    const stuRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'student@campus.edu', password: 'student123', expectedRole: 'student' }),
    });
    const stuData = await stuRes.json();
    assert(stuRes.status === 200 && stuData.token, 'Student can log in with registered email and password');
    assert(stuData.user.role === 'student' && stuData.user.name === 'Ananya Pandey', 'Student user profile retrieved accurately');

    // 2. Role mismatch prevention
    const roleMismatchRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'student@campus.edu', password: 'student123', expectedRole: 'admin' }),
    });
    assert(roleMismatchRes.status === 403, 'Logging in with student credentials into Admin portal is blocked with 403 Forbidden');

    // 3. HOD Login
    const hodRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'HOD-IT-001', password: 'hod123', expectedRole: 'hod' }),
    });
    const hodData = await hodRes.json();
    assert(hodRes.status === 200 && hodData.token, 'HOD can log in using College ID (HOD-IT-001)');
    assert(hodData.user.assignedBlock === 'Academic Block A', 'HOD has assigned block "Academic Block A"');

    // 4. Admin (Infrastructure) Login
    const admRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'admin.infra@campus.edu', password: 'admin123', expectedRole: 'admin' }),
    });
    const admData = await admRes.json();
    assert(admRes.status === 200 && admData.token, 'Infrastructure Admin logs in successfully');
    assert(admData.user.role === 'admin', 'Admin role verified in JWT token');

    // 5. Hostel & Mess Login
    const hmRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'hostel.mess@campus.edu', password: 'hostel123', expectedRole: 'hostel_mess' }),
    });
    const hmData = await hmRes.json();
    assert(hmRes.status === 200 && hmData.token, 'Hostel & Mess staff logs in successfully');
    assert(hmData.user.role === 'hostel_mess', 'Hostel/Mess role verified in JWT token');

    console.log('\n--- TEST SUITE 2: ROLE-BASED ACCESS CONTROL & ISOLATION ---');

    // Student 1 (Ananya) complaints
    const stuComplaintsRes = await fetch(`${baseUrl}/complaints`, {
      headers: { Authorization: `Bearer ${stuData.token}` },
    });
    const stuComplaints = (await stuComplaintsRes.json()).complaints;
    assert(stuComplaints.every((c) => c.studentId === stuData.user.id), 'Student only sees their own complaints');

    // HOD Block isolation
    const hodComplaintsRes = await fetch(`${baseUrl}/complaints`, {
      headers: { Authorization: `Bearer ${hodData.token}` },
    });
    const hodComplaints = (await hodComplaintsRes.json()).complaints;
    assert(
      hodComplaints.every((c) => c.block === 'Academic Block A' || c.department === 'Information Technology'),
      'HOD only sees complaints belonging to their assigned block / department (Academic Block A)'
    );
    assert(
      !hodComplaints.some((c) => c.block === 'Academic Block B'),
      'Complaints belonging to other blocks (Block B) are strictly invisible to Block A HOD'
    );

    // Admin Infrastructure isolation
    const admComplaintsRes = await fetch(`${baseUrl}/complaints`, {
      headers: { Authorization: `Bearer ${admData.token}` },
    });
    const admComplaints = (await admComplaintsRes.json()).complaints;
    assert(
      admComplaints.every((c) => c.targetScope === 'admin' || ['Electrical problems', 'Water supply', 'Cleaning and sanitation', 'Internet and Wi-Fi'].includes(c.category)),
      'Admin only receives infrastructure complaints across campus'
    );

    // Hostel & Mess isolation
    const hmComplaintsRes = await fetch(`${baseUrl}/complaints`, {
      headers: { Authorization: `Bearer ${hmData.token}` },
    });
    const hmComplaints = (await hmComplaintsRes.json()).complaints;
    assert(
      hmComplaints.every((c) => c.targetScope === 'hostel_mess' || c.category.includes('Hostel') || c.category.includes('Mess')),
      'Hostel/Mess staff only sees residential and dining complaints'
    );

    console.log('\n--- TEST SUITE 3: COMPLAINT SUBMISSION, ROUTING & UNIQUE ID ---');

    // Student submits complaint
    const newSubmitRes = await fetch(`${baseUrl}/complaints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${stuData.token}`,
      },
      body: JSON.stringify({
        title: 'Ceiling projector lamp blinking',
        description: 'Projector in room 304 keeps turning off during classes',
        category: 'Classroom-related issues',
        subcategory: 'AV Equipment',
        block: 'Academic Block A',
        location: 'Academic Block A · Room 304',
        priority: 'High',
        attachment: 'projector_error.jpg',
      }),
    });
    const submitText = await newSubmitRes.text();
    let newSubmitData = {};
    try {
      newSubmitData = JSON.parse(submitText);
    } catch {
      console.error('Failed to parse response as JSON. Status:', newSubmitRes.status, 'Body:', submitText);
      throw new Error(`POST /complaints returned non-JSON: ${submitText}`);
    }
    assert(newSubmitRes.status === 201 && newSubmitData.complaint, 'Student can submit new complaint');
    assert(newSubmitData.complaint.id.startsWith('CMP-2026-'), 'Unique complaint ID generated (e.g. CMP-2026-0009)');
    assert(newSubmitData.complaint.targetScope === 'hod' || newSubmitData.complaint.targetScope === 'coordinator', 'Classroom issue routed to hod target scope');
    assert(newSubmitData.complaint.status === 'Submitted', 'Initial status set to "Submitted"');

    console.log('\n--- TEST SUITE 4: STAFF ASSIGNMENT & WORKFLOW PROGRESSION ---');

    // HOD assigns staff
    const assignRes = await fetch(`${baseUrl}/complaints/${newSubmitData.complaint.id}/assign`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hodData.token}`,
      },
      body: JSON.stringify({
        staffName: 'Vikas Chauhan (System Administrator)',
        priority: 'High',
        remarks: 'Check HDMI and lamp hour counter',
      }),
    });
    const assignData = await assignRes.json();
    assert(assignRes.status === 200, 'HOD can assign staff member to complaint');
    assert(assignData.complaint.assignedTo === 'Vikas Chauhan (System Administrator)', 'Assigned staff persisted');
    assert(assignData.complaint.status === 'Assigned', 'Status automatically advanced to "Assigned"');

    // HOD updates status to In Progress
    const inProgRes = await fetch(`${baseUrl}/complaints/${newSubmitData.complaint.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hodData.token}`,
      },
      body: JSON.stringify({
        status: 'In Progress',
        remarks: 'Technician on site with replacement projector bulb',
      }),
    });
    assert(inProgRes.status === 200, 'Status updated to In Progress');

    console.log('\n--- TEST SUITE 5: RESOLUTION REMARKS & STUDENT FEEDBACK ---');

    // Attempting resolution without remarks should fail
    const resolveNoRemarks = await fetch(`${baseUrl}/complaints/${newSubmitData.complaint.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hodData.token}`,
      },
      body: JSON.stringify({
        status: 'Resolved',
        remarks: '',
      }),
    });
    assert(resolveNoRemarks.status === 400, 'Marking as Resolved without resolution remarks is rejected (400 Bad Request)');

    // Resolving with remarks succeeds
    const resolveRes = await fetch(`${baseUrl}/complaints/${newSubmitData.complaint.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hodData.token}`,
      },
      body: JSON.stringify({
        status: 'Resolved',
        remarks: 'New projector lamp installed and color calibrated. Checked with faculty.',
      }),
    });
    const resolveData = await resolveRes.json();
    assert(resolveRes.status === 200, 'Complaint successfully resolved with resolution remarks');
    assert(resolveData.complaint.status === 'Resolved', 'Status verified as Resolved');

    // Student submits rating and feedback
    const feedbackRes = await fetch(`${baseUrl}/complaints/${newSubmitData.complaint.id}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${stuData.token}`,
      },
      body: JSON.stringify({
        rating: 5,
        comment: 'Super fast fix before afternoon lecture! Thank you team.',
      }),
    });
    const feedbackData = await feedbackRes.json();
    assert(feedbackRes.status === 200, 'Student can submit star rating and feedback comment on resolved complaint');
    assert(feedbackData.complaint.feedback?.rating === 5, 'Feedback rating 5 stars saved');

    console.log('\n--- TEST SUITE 6: REJECTION REASON HANDLING ---');

    // Submit another complaint to test rejection
    const invalidSubmitRes = await fetch(`${baseUrl}/complaints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${stuData.token}`,
      },
      body: JSON.stringify({
        title: 'Personal laptop fan making noise in hostel',
        description: 'My private gaming laptop fan is loud',
        category: 'Hostel-related issues',
        block: 'Gargi Hostel',
        location: 'Room 304',
      }),
    });
    const invalidComplaint = (await invalidSubmitRes.json()).complaint;

    // Rejecting without reason should fail
    const rejectNoReason = await fetch(`${baseUrl}/complaints/${invalidComplaint.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hmData.token}`,
      },
      body: JSON.stringify({
        status: 'Rejected',
        rejectionReason: '',
      }),
    });
    assert(rejectNoReason.status === 400, 'Rejecting a complaint without a rejection reason is rejected (400 Bad Request)');

    // Rejecting with reason succeeds
    const rejectRes = await fetch(`${baseUrl}/complaints/${invalidComplaint.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hmData.token}`,
      },
      body: JSON.stringify({
        status: 'Rejected',
        rejectionReason: 'Personal electronic devices must be serviced at manufacturer centers; hostel facilities desk only services campus college fixtures.',
      }),
    });
    const rejectData = await rejectRes.json();
    assert(rejectRes.status === 200, 'Hostel desk can reject complaint with mandatory explanation');
    assert(rejectData.complaint.rejectionReason.includes('Personal electronic devices'), 'Rejection reason stored for student visibility');

    console.log('\n--- TEST SUITE 7: OVERDUE SLA DETECTION ---');
    const statsRes = await fetch(`${baseUrl}/stats`, {
      headers: { Authorization: `Bearer ${admData.token}` },
    });
    const statsData = await statsRes.json();
    assert(statsData.overdue >= 1, `Overdue SLA detector correctly identified ${statsData.overdue} overdue complaint(s) > 48h`);

    console.log(`\n========================================`);
    console.log(`ALL VERIFICATION TESTS COMPLETED: ${passed} passed, ${failed} failed`);
    console.log(`========================================\n`);

    server.close();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution error:', err);
    server.close();
    process.exit(1);
  }
});
