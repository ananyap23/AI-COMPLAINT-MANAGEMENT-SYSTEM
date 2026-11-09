import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  FileText,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
  Utensils,
  GraduationCap,
  X,
  UserCheck,
  ArrowLeftRight,
  ArrowRight,
  CheckCircle2,
  LogIn,
} from 'lucide-react';
import './App.css';

import { api } from './services/api';
import { formatIST } from './utils/timeFormat';
import { LoginPage, ROLES } from './components/LoginPage';
import { StudentDashboard } from './components/StudentDashboard';
import { StudentOverviewView } from './components/StudentOverviewView';
import { StudentComplaintModal } from './components/StudentComplaintModal';
import { CoordinatorDashboardView } from './components/CoordinatorDashboardView';
import { BlockComplaintsView } from './components/BlockComplaintsView';
import { StaffAssignmentsView } from './components/StaffAssignmentsView';
import { DepartmentAnalyticsView } from './components/DepartmentAnalyticsView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { HostelMessDashboardView } from './components/HostelMessDashboardView';
import { ComplaintActionModal } from './components/ComplaintActionModal';

// Navigation configurations for each role
const studentNavItems = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'My complaints', icon: FileText },
  { label: 'Messages', icon: MessageSquare, count: 2 },
  { label: 'Campus guide', icon: BookOpen },
];

const hodNavItems = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Block complaints', icon: FileText },
  { label: 'Staff assignments', icon: Users },
  { label: 'Messages', icon: MessageSquare, count: 4 },
  { label: 'Analytics', icon: BarChart3 },
];

const adminNavItems = [
  { label: 'Infra dashboard', icon: LayoutDashboard },
  { label: 'All infrastructure', icon: Wrench },
  { label: 'Technician pool', icon: Users },
  { label: 'Messages', icon: MessageSquare, count: 3 },
  { label: 'Campus analytics', icon: BarChart3 },
];

const hostelMessNavItems = [
  { label: 'Hostel desk', icon: LayoutDashboard },
  { label: 'Dining & rooms', icon: Utensils },
  { label: 'Warden assignments', icon: Users },
  { label: 'Messages', icon: MessageSquare, count: 1 },
  { label: 'Health & hygiene', icon: BarChart3 },
];

function formatRelativeTime(timestamp) {
  if (!timestamp) return 'Just now';
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (elapsedSeconds < 60) return 'Just now';
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 60) return `${elapsedMinutes} min ago`;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours} hr ago`;
  const elapsedDays = Math.floor(elapsedHours / 24);
  return `${elapsedDays} day${elapsedDays === 1 ? '' : 's'} ago`;
}

function formatDateTime(timestamp) {
  return formatIST(timestamp);
}

function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState(() => api.getUser());
  const [authLoading, setAuthLoading] = useState(false);
  const [pendingLoginConfig, setPendingLoginConfig] = useState(null);

  // App Navigation & UI State
  const [activeNav, setActiveNav] = useState('Overview');
  const [complaintList, setComplaintList] = useState([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [showSwitchDashboardModal, setShowSwitchDashboardModal] = useState(false);
  const [switchingDashboard, setSwitchingDashboard] = useState(false);
  const [switchToast, setSwitchToast] = useState('');

  // Notifications State
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const notificationRef = useRef(null);
  const [notifications, setNotifications] = useState(() => {
    const now = Date.now();
    return [
      {
        id: 'updated-2048',
        type: 'Complaint Update',
        title: 'Complaint Updated',
        message: 'CMP-2026-0001 is now In Progress by Utilities team',
        createdAt: now - 10 * 60 * 1000,
        unread: true,
      },
      {
        id: 'resolved-0005',
        type: 'Complaint Resolved',
        title: 'Complaint Resolved',
        message: 'CMP-2026-0005 armrest repairs in LH 101 completed',
        createdAt: now - 2 * 60 * 60 * 1000,
        unread: true,
      },
      {
        id: 'overdue-alert',
        type: 'Important Announcement',
        title: 'SLA Overdue Notification',
        message: 'Water cooler plumbing issue in Block A flagged as overdue',
        createdAt: now - 24 * 60 * 60 * 1000,
        unread: true,
      },
    ];
  });

  // Support Messages
  const [supportMessages, setSupportMessages] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('campusVoiceSupportMessages') || '[]');
    } catch {
      return [];
    }
  });

  // Listen for 401 unauthorized events from api client
  useEffect(() => {
    function handleUnauthorized() {
      setCurrentUser(null);
    }
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  // Fetch verified user profile on mount if token exists
  useEffect(() => {
    if (api.getToken()) {
      api.getMe()
        .then((user) => {
          setCurrentUser(user);
          // Set initial default active nav based on role
          if (user.role === 'hod' || user.role === 'coordinator') setActiveNav('HOD Dashboard');
          else if (user.role === 'admin') setActiveNav('Infra dashboard');
          else if (user.role === 'hostel_mess') setActiveNav('Hostel desk');
          else setActiveNav('Overview');
        })
        .catch(() => {
          setCurrentUser(null);
        });
    }
  }, []);

  // Fetch complaints from server whenever user is authenticated
  const fetchComplaints = () => {
    if (!currentUser) return;
    setLoadingComplaints(true);
    api.getComplaints()
      .then((data) => {
        setComplaintList(data);
      })
      .catch((err) => {
        console.error('Error fetching complaints:', err);
      })
      .finally(() => {
        setLoadingComplaints(false);
      });
  };

  useEffect(() => {
    if (currentUser) {
      fetchComplaints();
    }
  }, [currentUser]);

  // Persist support messages
  useEffect(() => {
    localStorage.setItem('campusVoiceSupportMessages', JSON.stringify(supportMessages));
  }, [supportMessages]);

  // Close notifications on outside click
  useEffect(() => {
    function handleOutsideClick(event) {
      if (showNotifications && !notificationRef.current?.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showNotifications]);

  function handleLoginSuccess(user) {
    setCurrentUser(user);
    if (user.role === 'hod' || user.role === 'coordinator') setActiveNav('Dashboard');
    else if (user.role === 'admin') setActiveNav('Infra dashboard');
    else if (user.role === 'hostel_mess') setActiveNav('Hostel desk');
    else setActiveNav('Overview');
  }

  function handleSwitchDashboardRole(targetRole) {
    setShowSwitchDashboardModal(false);
    // Direct user to Login screen first with that role's verified ID and password pre-filled
    api.logout();
    setCurrentUser(null);
    setComplaintList([]);
    setSelectedComplaint(null);
    setActiveNav('Overview');
    setPendingLoginConfig({
      roleId: targetRole.id,
      identifier: targetRole.demoId,
      password: targetRole.demoPass,
      notice: `Switching to ${targetRole.title} · Verified credentials (${targetRole.demoId}) are pre-filled below. Review and click "Sign In to Campus System" to enter.`,
    });
  }

  function handleLogout() {
    api.logout();
    setCurrentUser(null);
    setComplaintList([]);
    setSelectedComplaint(null);
    setActiveNav('Overview');
    setPendingLoginConfig(null);
  }

  function markNotificationRead(id) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  }

  function markAllNotificationsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  }

  const unreadCount = notifications.filter((n) => n.unread).length;

  // Determine current navigation items by role
  const navItems = useMemo(() => {
    if (!currentUser) return studentNavItems;
    switch (currentUser.role) {
      case 'hod':
      case 'coordinator':
        return hodNavItems;
      case 'admin':
        return adminNavItems;
      case 'hostel_mess':
        return hostelMessNavItems;
      default:
        return studentNavItems;
    }
  }, [currentUser]);

  // If NOT logged in, show the 4-role Login Portal
  if (!currentUser) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        initialRoleId={pendingLoginConfig?.roleId || 'student'}
        initialIdentifier={pendingLoginConfig?.identifier}
        initialPassword={pendingLoginConfig?.password}
        switchNotice={pendingLoginConfig?.notice}
      />
    );
  }

  // Role Badge Info
  const roleDisplay = {
    student: { label: 'Student', icon: GraduationCap, title: 'Student Hub' },
    hod: { label: 'HOD', icon: Users, title: 'Department HOD Console' },
    coordinator: { label: 'HOD', icon: Users, title: 'Department HOD Console' },
    admin: { label: 'Infrastructure Admin', icon: Wrench, title: 'Estate & Infra Console' },
    hostel_mess: { label: 'Hostel & Mess Staff', icon: Utensils, title: 'Residential & Dining' },
  }[currentUser.role] || { label: 'User', icon: ShieldCheck, title: 'Campus Portal' };

  return (
    <div className="app-shell">
      {/* Sidebar Navigation */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="brand-lockup">
          <div className="brand-mark">
            <ShieldCheck size={21} strokeWidth={2.5} />
          </div>
          <div>
            <strong>Campus</strong>
            <span>BRIDGE</span>
          </div>
        </div>

        <div className="sidebar-label">
          {currentUser.role === 'student'
            ? 'Student Hub'
            : (currentUser.role === 'hod' || currentUser.role === 'coordinator')
            ? 'HOD Department Desk'
            : currentUser.role === 'admin'
            ? 'Infrastructure Desk'
            : 'Hostel & Dining Desk'}
        </div>

        <nav className="primary-nav">
          {navItems.map(({ label, icon: Icon, count }) => (
            <button
              key={label}
              className={`nav-item ${activeNav === label ? 'active' : ''}`}
              onClick={() => {
                setActiveNav(label);
                setShowAllNotifications(false);
                setSidebarOpen(false);
              }}
            >
              <Icon size={18} />
              <span>{label}</span>
              {label.includes('complaint') ? (
                <b>{complaintList.length}</b>
              ) : (
                count && <b>{count}</b>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-label support-label">General</div>
        <nav className="primary-nav">
          <button
            className={`nav-item ${activeNav === 'Campus guide' ? 'active' : ''}`}
            onClick={() => {
              setActiveNav('Campus guide');
              setShowAllNotifications(false);
              setSidebarOpen(false);
            }}
          >
            <BookOpen size={18} />
            <span>Campus directory</span>
          </button>
          <button
            className={`nav-item ${activeNav === 'Help center' ? 'active' : ''}`}
            onClick={() => {
              setActiveNav('Help center');
              setShowSupport(true);
              setSidebarOpen(false);
            }}
          >
            <CircleHelp size={18} />
            <span>Help center</span>
          </button>
          <button
            className={`nav-item ${activeNav === 'Settings' ? 'active' : ''}`}
            onClick={() => {
              setActiveNav('Settings');
              setShowAllNotifications(false);
              setSidebarOpen(false);
            }}
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>
        </nav>

        {/* Sidebar Footer with Active Role and Logout */}
        <div className="sidebar-footer">
          <div className="campus-card">
            <div className="campus-icon">
              <roleDisplay.icon size={18} />
            </div>
            <div>
              <strong>{currentUser.name}</strong>
              <span>{roleDisplay.label}</span>
            </div>
          </div>

          <div className="profile-row">
            <div className="avatar">
              {currentUser.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div>
              <strong>{currentUser.collegeId || currentUser.email}</strong>
              <span>
                {currentUser.assignedBlock
                  ? currentUser.assignedBlock
                  : currentUser.department || 'Riverside Tech'}
              </span>
            </div>
          </div>

          <div className="sidebar-action-buttons">
            <button
              className="sidebar-switch-btn"
              onClick={() => setShowSwitchDashboardModal(true)}
              title="Switch between Student, HOD, Admin, and Hostel dashboards"
            >
              <ArrowLeftRight size={14} />
              <span>Switch Dashboard</span>
            </button>
            <button className="sidebar-logout-btn" onClick={handleLogout} title="Log out of session">
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle navigation"
          >
            <Menu size={21} />
          </button>

          <div className="breadcrumb">
            <span>{roleDisplay.title}</span>
            <ChevronRight size={15} />
            <strong>{showAllNotifications ? 'Notifications' : activeNav}</strong>
          </div>

          <div className="top-actions">
            {/* Quick Switch Dashboard action */}
            <button
              className="topbar-switch-btn"
              onClick={() => setShowSwitchDashboardModal(true)}
              title="Switch between Student, HOD, Admin, and Hostel dashboards"
            >
              <ArrowLeftRight size={14} />
              <span>Switch Dashboard</span>
            </button>

            {/* Role indicator pill in topbar */}
            <div className="topbar-role-badge">
              <roleDisplay.icon size={14} />
              <span>{roleDisplay.label}</span>
            </div>

            {/* Notifications Popover */}
            <div className="notification-wrap" ref={notificationRef}>
              <button
                className="icon-button"
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="Show notifications"
              >
                <Bell size={19} />
                {unreadCount > 0 && <b className="notification-badge">{unreadCount}</b>}
              </button>

              {showNotifications && (
                <div className="notification-panel">
                  <div className="notification-panel-header">
                    <strong>Notifications</strong>
                    {unreadCount > 0 && (
                      <button onClick={markAllNotificationsRead}>Mark all read</button>
                    )}
                  </div>
                  {notifications.length ? (
                    <div className="notification-list">
                      {notifications.map((notification) => (
                        <button
                          className={`notification-item ${notification.unread ? 'unread' : ''}`}
                          key={notification.id}
                          onClick={() => markNotificationRead(notification.id)}
                        >
                          <span className="notification-type-dot" />
                          <span className="notification-copy">
                            <strong>{notification.title}</strong>
                            <span>{notification.message}</span>
                            <small>{formatRelativeTime(notification.createdAt)}</small>
                          </span>
                          {notification.unread && <i className="notification-unread-dot" />}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="notification-empty">
                      <Bell size={24} />
                      <strong>No new notifications</strong>
                      <span>You're all caught up!</span>
                    </div>
                  )}
                  <button
                    className="view-all-notifications"
                    onClick={() => {
                      setShowNotifications(false);
                      setShowAllNotifications(true);
                    }}
                  >
                    View all notifications <ChevronRight size={15} />
                  </button>
                </div>
              )}
            </div>

            <button className="top-logout-link" onClick={handleLogout}>
              <LogOut size={16} />
              <span>Log out</span>
            </button>
          </div>
        </header>

        {/* Dynamic Page Views */}
        <div className="page-content">
          {showAllNotifications ? (
            <NotificationPage
              notifications={notifications}
              onBack={() => setShowAllNotifications(false)}
              onRead={markNotificationRead}
              onMarkAll={markAllNotificationsRead}
            />
          ) : activeNav === 'Settings' ? (
            <SettingsPage currentUser={currentUser} />
          ) : activeNav === 'Campus guide' ? (
            <GuidePage onContact={() => setShowSupport(true)} />
          ) : activeNav === 'Messages' ? (
            <MessagesPage
              messages={supportMessages}
              onReply={() => setShowSupport(true)}
            />
          ) : (
            /* Role Specific Views */
            <>
              {currentUser.role === 'student' && (
                activeNav === 'My complaints' ? (
                  <StudentDashboard
                    user={currentUser}
                    complaints={complaintList}
                    onOpenSubmitModal={() => setShowSubmitModal(true)}
                    onSelectComplaint={(c) => setSelectedComplaint(c)}
                  />
                ) : (
                  <StudentOverviewView
                    user={currentUser}
                    complaints={complaintList}
                    onOpenSubmitModal={() => setShowSubmitModal(true)}
                    onSelectComplaint={(c) => setSelectedComplaint(c)}
                    onNavigateToComplaints={() => setActiveNav('My complaints')}
                  />
                )
              )}

              {(currentUser.role === 'hod' || currentUser.role === 'coordinator') && (
                activeNav === 'Block complaints' || activeNav === 'Department complaints' ? (
                  <BlockComplaintsView
                    user={currentUser}
                    complaints={complaintList}
                    onSelectComplaint={(c) => setSelectedComplaint(c)}
                    onSwitchTab={(tab) => setActiveNav(tab)}
                  />
                ) : activeNav === 'Staff assignments' || activeNav === 'self assignment' ? (
                  <StaffAssignmentsView
                    user={currentUser}
                    complaints={complaintList}
                    onSelectComplaint={(c) => setSelectedComplaint(c)}
                    onComplaintUpdated={(updatedComplaint) => {
                      setComplaintList((prev) =>
                        prev.map((c) => (c.id === updatedComplaint.id ? updatedComplaint : c))
                      );
                      setSelectedComplaint(updatedComplaint);
                    }}
                    onSwitchTab={(tab) => setActiveNav(tab)}
                  />
                ) : activeNav === 'Analytics' ? (
                  <DepartmentAnalyticsView
                    user={currentUser}
                    complaints={complaintList}
                    onSwitchTab={(tab) => setActiveNav(tab)}
                  />
                ) : (
                  <CoordinatorDashboardView
                    user={currentUser}
                    complaints={complaintList}
                    onSelectComplaint={(c) => setSelectedComplaint(c)}
                    onSwitchTab={(tab) => setActiveNav(tab)}
                  />
                )
              )}

              {currentUser.role === 'admin' && (
                <AdminDashboardView
                  user={currentUser}
                  complaints={complaintList}
                  activeNav={activeNav}
                  onSwitchTab={(tab) => setActiveNav(tab)}
                  onSelectComplaint={(c) => setSelectedComplaint(c)}
                  onComplaintUpdated={(updatedComplaint) => {
                    setComplaintList((prev) =>
                      prev.map((c) => (c.id === updatedComplaint.id ? updatedComplaint : c))
                    );
                    setSelectedComplaint(updatedComplaint);
                  }}
                />
              )}

              {currentUser.role === 'hostel_mess' && (
                <HostelMessDashboardView
                  user={currentUser}
                  complaints={complaintList}
                  activeNav={activeNav}
                  onSwitchTab={(tab) => setActiveNav(tab)}
                  onSelectComplaint={(c) => setSelectedComplaint(c)}
                  onComplaintUpdated={(updatedComplaint) => {
                    setComplaintList((prev) =>
                      prev.map((c) => (c.id === updatedComplaint.id ? updatedComplaint : c))
                    );
                    setSelectedComplaint(updatedComplaint);
                  }}
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* Modal 1: Student Complaint Submission */}
      {showSubmitModal && (
        <StudentComplaintModal
          user={currentUser}
          onClose={() => setShowSubmitModal(false)}
          onSubmitted={(newComplaint) => {
            setShowSubmitModal(false);
            setComplaintList((prev) => [newComplaint, ...prev]);
            setSelectedComplaint(newComplaint);
          }}
        />
      )}

      {/* Modal 2: Complaint Details, Assignment, Workflow & Resolution Modal */}
      {selectedComplaint && (
        <ComplaintActionModal
          complaint={selectedComplaint}
          currentUser={currentUser}
          onClose={() => setSelectedComplaint(null)}
          onUpdated={(updatedComplaint) => {
            setComplaintList((prev) =>
              prev.map((c) => (c.id === updatedComplaint.id ? updatedComplaint : c))
            );
            setSelectedComplaint(updatedComplaint);
          }}
        />
      )}

      {/* Modal 3: Support Contact */}
      {showSupport && (
        <SupportModal
          onClose={() => setShowSupport(false)}
          onSent={(message) => {
            setSupportMessages((prev) => [message, ...prev]);
            setActiveNav('Messages');
          }}
        />
      )}

      {/* Switch Dashboard Modal */}
      {showSwitchDashboardModal && (
        <div className="modal-backdrop" onClick={() => setShowSwitchDashboardModal(false)}>
          <div
            className="switch-dashboard-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="switch-modal-header">
              <div>
                <span className="switch-modal-eyebrow">ROLE & DASHBOARD SWITCHER</span>
                <h2>Switch Active Dashboard</h2>
                <p>Select any portal to open the login screen with that role and verified credentials ready.</p>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setShowSwitchDashboardModal(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="switch-roles-grid">
              {ROLES.map((role) => {
                const Icon = role.icon;
                const isCurrent = currentUser?.role === role.id;
                return (
                  <div
                    key={role.id}
                    className={`switch-role-card ${role.colorClass} ${isCurrent ? 'switch-role-current' : ''}`}
                    onClick={() => handleSwitchDashboardRole(role)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSwitchDashboardRole(role);
                      }
                    }}
                  >
                    <div className="switch-role-top">
                      <div className="switch-role-icon">
                        <Icon size={20} />
                      </div>
                      <span className="switch-role-pill">{role.badge}</span>
                    </div>

                    <h3>{role.title}</h3>
                    <p>{role.desc}</p>

                    <div className="switch-role-credentials">
                      <div className="cred-line">
                        <span>ID:</span> <code>{role.demoId}</code>
                      </div>
                      <div className="cred-line">
                        <span>Password:</span> <code>{role.demoPass}</code>
                      </div>
                    </div>

                    <div className="switch-role-action">
                      {isCurrent ? (
                        <span className="current-badge">Currently Active</span>
                      ) : (
                        <button
                          type="button"
                          className="switch-btn-cta"
                        >
                          <LogIn size={13} /> Proceed to Login
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="switch-modal-footer">
              <button
                type="button"
                className="switch-footer-cancel-btn"
                onClick={() => setShowSwitchDashboardModal(false)}
              >
                Stay in Current Dashboard
              </button>
              <button
                type="button"
                className="switch-footer-login-btn"
                onClick={() => {
                  setShowSwitchDashboardModal(false);
                  handleLogout();
                }}
              >
                <LogOut size={13} /> Go to Login Screen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Switch Notification Toast */}
      {switchToast && (
        <div className="switch-toast-notification">
          <CheckCircle2 size={16} />
          <span>{switchToast}</span>
        </div>
      )}
    </div>
  );
}

// ----------------- Supporting Components -----------------

function NotificationPage({ notifications, onBack, onRead, onMarkAll }) {
  const unreadCount = notifications.filter((n) => n.unread).length;
  return (
    <>
      <button className="back-button" onClick={onBack}>
        <ChevronRight size={16} className="back-chevron" /> Back to dashboard
      </button>
      <section className="page-intro">
        <div>
          <p className="eyebrow">Stay informed</p>
          <h1>Notifications</h1>
          <p className="welcome-copy">Updates about your complaints and campus activity.</p>
        </div>
        {unreadCount > 0 && (
          <button className="text-button" onClick={onMarkAll}>
            Mark all as read
          </button>
        )}
      </section>
      {notifications.length ? (
        <div className="notification-page-list">
          {notifications.map((notification) => (
            <button
              className={`notification-page-item ${notification.unread ? 'unread' : ''}`}
              key={notification.id}
              onClick={() => onRead(notification.id)}
            >
              <span className="notification-type-dot" />
              <span className="notification-copy">
                <strong>{notification.title}</strong>
                <span>{notification.message}</span>
                <small>{formatRelativeTime(notification.createdAt)}</small>
              </span>
              {notification.unread && <i className="notification-unread-dot" />}
            </button>
          ))}
        </div>
      ) : (
        <div className="notification-empty notification-page-empty">
          <Bell size={28} />
          <strong>No new notifications</strong>
          <span>You're all caught up!</span>
        </div>
      )}
    </>
  );
}

function MessagesPage({ messages: supportMessages, onReply }) {
  const [openMessage, setOpenMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');

  const defaultMessages = [
    {
      sender: 'Facilities Desk',
      subject: 'Academic Block A Power Calibration Complete',
      body: 'Maintenance on the transformer feeder lines was completed successfully. All laboratory circuits are operating on normal grid power.',
      time: '15 min ago',
      unread: true,
      important: true,
    },
    {
      sender: 'Hostel Warden Office',
      subject: 'Gargi & Vikram Hostel Room Inspection Schedule',
      body: 'Routine quarterly room fixture checkups will occur between 4:00 PM and 6:00 PM this Thursday. Students may report minor maintenance requests directly.',
      time: 'Yesterday',
      unread: true,
      important: true,
    },
    {
      sender: 'Mess Committee',
      subject: 'Weekly Dining Hygiene Inspection Rating: A+',
      body: 'The food safety officer verified water purity levels, dish sanitization temperatures, and cold storage temperatures in Mess 1 & 2.',
      time: '2 days ago',
      unread: false,
      important: false,
    },
  ];

  const messages = [...supportMessages, ...defaultMessages];
  const filteredMessages = messages.filter((m) => {
    const text = `${m.sender} ${m.subject} ${m.body}`.toLowerCase();
    const matchSearch = text.includes(searchTerm.toLowerCase());
    const matchFilter =
      filter === 'All' || (filter === 'Unread' && m.unread) || (filter === 'Important' && m.important);
    return matchSearch && matchFilter;
  });

  return (
    <>
      <section className="page-intro">
        <div>
          <p className="eyebrow">Direct Communications</p>
          <h1>Official Messages & Notices</h1>
          <p className="welcome-copy">Verified dispatches from department heads, estate offices, and mess committees.</p>
        </div>
      </section>

      <div className="message-toolbar">
        <div className="message-search">
          <Search size={15} />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search communications..."
          />
        </div>
      </div>

      <div className="message-list">
        {filteredMessages.map((msg, idx) => (
          <article
            className={`message-card ${msg.unread ? 'unread' : ''}`}
            key={idx}
            onClick={() => setOpenMessage(openMessage === idx ? null : idx)}
          >
            <div className="message-avatar">
              <MessageSquare size={17} />
            </div>
            <div className="message-copy">
              <div className="message-top">
                <strong>{msg.sender}</strong>
                <span>{msg.createdAt ? formatRelativeTime(msg.createdAt) : msg.time}</span>
              </div>
              <h3>{msg.subject}</h3>
              <p>{msg.body}</p>
              {msg.important && <span className="message-tag">OFFICIAL NOTICE</span>}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function SettingsPage({ currentUser }) {
  return (
    <>
      <section className="page-intro">
        <div>
          <p className="eyebrow">Account & Security</p>
          <h1>System Settings & Access Credentials</h1>
          <p className="welcome-copy">Review verified permissions, notification preferences, and session controls.</p>
        </div>
      </section>

      <div className="settings-page-wrap">
        <section className="settings-section">
          <h2>Active Profile Information</h2>
          <div className="settings-list">
            <div className="setting-row">
              <span>
                <strong>Account Name</strong>
                <small>{currentUser?.name}</small>
              </span>
            </div>
            <div className="setting-row">
              <span>
                <strong>System Role</strong>
                <small style={{ textTransform: 'uppercase', fontWeight: 'bold', color: '#691d39' }}>
                  {currentUser?.role === 'coordinator' || currentUser?.role === 'hod' ? 'HOD' : currentUser?.role}
                </small>
              </span>
            </div>
            <div className="setting-row">
              <span>
                <strong>Official Email</strong>
                <small>{currentUser?.email}</small>
              </span>
            </div>
            {currentUser?.assignedBlock && (
              <div className="setting-row">
                <span>
                  <strong>Assigned Block Scope</strong>
                  <small>{currentUser.assignedBlock}</small>
                </span>
              </div>
            )}
            {currentUser?.assignedDepartment && (
              <div className="setting-row">
                <span>
                  <strong>Assigned Department Scope</strong>
                  <small>{currentUser.assignedDepartment}</small>
                </span>
              </div>
            )}
          </div>
        </section>

        <section className="settings-section">
          <h2>Security & RBAC Enforcement</h2>
          <div className="settings-list">
            <div className="setting-row">
              <span>
                <strong>Server-Side Authorization</strong>
                <small>Every API call verifies your signed JWT token and isolates block/complaint data on the server.</small>
              </span>
              <span className="status-pill resolved">Active</span>
            </div>
            <div className="setting-row">
              <span>
                <strong>Password Encryption</strong>
                <small>Passwords stored with cryptographic PBKDF2 SHA-512 hashes with 100,000 rounds and random salt.</small>
              </span>
              <span className="status-pill resolved">Encrypted</span>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function GuidePage({ onContact }) {
  const guideItems = [
    {
      icon: Building2,
      title: 'Hostel & Residential Issues',
      text: 'Report water supply problems, room repairs, washroom cleaning, electricity tripping, and room amenities.',
      meta: 'Hostel Chief Warden Desk · Available Daily',
    },
    {
      icon: Home,
      title: 'Dining & Mess Quality',
      text: 'Submit feedback on meal nutrition, food hygiene, mess timings, drinking water filtration, and special diet requests.',
      meta: 'Mess Committee & Food Inspector Desk',
    },
    {
      icon: BookOpen,
      title: 'Academic & Classroom Facilities',
      text: 'Report smart projectors, audio visual equipment, lab benches, whiteboards, and air conditioning faults in lecture halls.',
      meta: 'HOD & Academic Block Coordinators',
    },
    {
      icon: Wrench,
      title: 'Campus Estate & Infrastructure',
      text: 'Central street lights, walkway paving, building leakage, main transformer power backup, and campus Wi-Fi connectivity.',
      meta: 'Directorate of Campus Infrastructure',
    },
    {
      icon: ShieldCheck,
      title: 'Emergency Safety & Security',
      text: '24x7 helpline for health emergencies, electrical short-circuits, student counseling, and campus safety support.',
      meta: 'Campus Central Control · 24/7 Helpline',
    },
  ];

  return (
    <>
      <section className="page-intro">
        <div>
          <p className="eyebrow">Campus Support Guide</p>
          <h1>Campus Directory & Grievance Routing</h1>
          <p className="welcome-copy">
            Find the right contact point and understand how student issues are routed to responsible officers.
          </p>
        </div>
      </section>

      <div className="guide-grid">
        {guideItems.map(({ icon: Icon, title, text, meta }) => (
          <article className="guide-card" key={title}>
            <div className="guide-icon">
              <Icon size={21} />
            </div>
            <h3>{title}</h3>
            <p>{text}</p>
            <small>{meta}</small>
          </article>
        ))}
      </div>

      <section className="guide-contact">
        <div className="sparkle-icon">
          <CircleHelp size={20} />
        </div>
        <div>
          <strong>Need immediate assistance?</strong>
          <p>Contact the campus centralized grievance helpdesk or send a direct support ticket.</p>
        </div>
        <button className="primary-button" onClick={onContact}>
          Contact Support Desk <ChevronRight size={16} />
        </button>
      </section>
    </>
  );
}

function SupportModal({ onClose, onSent }) {
  const [sent, setSent] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSent({
      sender: 'Grievance Support Desk',
      subject: formData.get('subject'),
      body: formData.get('message'),
      createdAt: Date.now(),
      unread: true,
      important: true,
    });
    setSent(true);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
        {sent ? (
          <div className="support-success">
            <div className="sparkle-icon">
              <ShieldCheck size={20} />
            </div>
            <p className="eyebrow">Message Dispatched</p>
            <h2>Support Ticket Created</h2>
            <p>Your query has been shared with the support supervisor. A response will appear in your Messages tab.</p>
            <button type="button" className="primary-button" onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="modal-header">
              <div>
                <p className="eyebrow">CampusBridge Support</p>
                <h2>Contact Central Support</h2>
              </div>
              <button type="button" className="close-button" onClick={onClose}>
                <X size={19} />
              </button>
            </div>
            <label>
              Subject *
              <input
                name="subject"
                required
                placeholder="e.g. Urgent query regarding complaint CMP-2026-0001"
              />
            </label>
            <label>
              Message Details *
              <textarea
                name="message"
                required
                rows={4}
                placeholder="Explain what assistance you require..."
              />
            </label>
            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="primary-button">
                Send Ticket <ChevronRight size={16} />
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}

export default App;
