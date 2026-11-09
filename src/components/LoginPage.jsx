import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  GraduationCap,
  Users,
  Wrench,
  Utensils,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ChevronRight,
  AlertTriangle,
  Building2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  UserCheck,
  X,
  Sun,
  Moon,
  BarChart3,
  Info,
  Check,
} from 'lucide-react';
import { api } from '../services/api';

export const ROLES = [
  {
    id: 'student',
    title: 'Student Portal',
    badge: 'STUDENTS & SCHOLARS',
    icon: GraduationCap,
    desc: 'Lodge complaints, monitor real-time progress, view rejection reasons, and rate resolutions.',
    demoEmail: 'student@campus.edu',
    demoId: 'STU-2026-001',
    demoPass: 'student123',
    demoName: 'Ananya Pandey (IT · 3rd Year)',
    colorClass: 'role-student',
    accentColor: '#38bdf8',
  },
  {
    id: 'hod',
    title: 'HOD Portal',
    badge: 'HEAD OF DEPARTMENT',
    icon: Users,
    desc: 'Review departmental & block complaints, assign departmental staff, update progress, and review analytics.',
    demoEmail: 'hod.it@campus.edu',
    demoId: 'HOD-IT-001',
    demoPass: 'hod123',
    demoName: 'Dr. Piyush Bhushan (HOD · IT Dept)',
    colorClass: 'role-hod',
    accentColor: '#c084fc',
  },
  {
    id: 'admin',
    title: 'Admin (Infrastructure)',
    badge: 'CAMPUS ESTATE & INFRA',
    icon: Wrench,
    desc: 'Campus-wide oversight of electrical, water, civil repairs, internet, and maintenance staff.',
    demoEmail: 'admin.infra@campus.edu',
    demoId: 'ADM-INFRA-001',
    demoPass: 'admin123',
    demoName: 'Rajesh Sharma (Estate Director)',
    colorClass: 'role-admin',
    accentColor: '#fb923c',
  },
  {
    id: 'hostel_mess',
    title: 'Hostel / Mess Dept',
    badge: 'RESIDENTIAL LIFE & DINING',
    icon: Utensils,
    desc: 'Hostel utilities, room maintenance, washroom hygiene, mess timings, and dining quality control.',
    demoEmail: 'hostel.mess@campus.edu',
    demoId: 'HM-MESS-001',
    demoPass: 'hostel123',
    demoName: 'Sunita Verma (Chief Warden)',
    colorClass: 'role-hostel',
    accentColor: '#34d399',
  },
];

export function LoginPage({
  onLoginSuccess,
  initialRoleId = 'student',
  initialIdentifier,
  initialPassword,
  switchNotice = '',
}) {
  const initialRoleObj = ROLES.find((r) => r.id === initialRoleId) || ROLES[0];
  const [selectedRole, setSelectedRole] = useState(initialRoleObj.id);
  const [identifier, setIdentifier] = useState(initialIdentifier || initialRoleObj.demoId);
  const [password, setPassword] = useState(initialPassword || initialRoleObj.demoPass);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegisteringStudent, setIsRegisteringStudent] = useState(false);
  const [lastAutoFilled, setLastAutoFilled] = useState(initialIdentifier || initialRoleObj.demoId);
  const [activeNotice, setActiveNotice] = useState(switchNotice);
  const [themeMode, setThemeMode] = useState('dark');

  useEffect(() => {
    if (initialRoleId) {
      const target = ROLES.find((r) => r.id === initialRoleId);
      if (target) {
        setSelectedRole(target.id);
        setIdentifier(initialIdentifier || target.demoId);
        setPassword(initialPassword || target.demoPass);
        setLastAutoFilled(initialIdentifier || target.demoId);
      }
    }
    setActiveNotice(switchNotice);
  }, [initialRoleId, initialIdentifier, initialPassword, switchNotice]);

  // Student registration form state
  const [regData, setRegData] = useState({
    name: '',
    email: '',
    collegeId: '',
    password: '',
    department: 'Information Technology',
    hostel: 'Gargi Hostel · Room 101',
    phone: '',
  });

  const activeRoleConfig = ROLES.find((r) => r.id === selectedRole) || ROLES[0];

  function handleRoleCardClick(roleId) {
    setSelectedRole(roleId);
    setError('');
    setIsRegisteringStudent(false);
    const target = ROLES.find((r) => r.id === roleId);
    if (target) {
      setIdentifier(target.demoId);
      setPassword(target.demoPass);
      setLastAutoFilled(target.demoId);
    }
  }

  function fillDemoCredentials(useEmail = false) {
    if (useEmail) {
      setIdentifier(activeRoleConfig.demoEmail);
      setLastAutoFilled(activeRoleConfig.demoEmail);
    } else {
      setIdentifier(activeRoleConfig.demoId);
      setLastAutoFilled(activeRoleConfig.demoId);
    }
    setPassword(activeRoleConfig.demoPass);
    setError('');
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError('');

    if (!identifier.trim() || !password.trim()) {
      setError('Please provide your College ID/email and password.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.login(identifier, password, selectedRole);
      if (onLoginSuccess) {
        onLoginSuccess(res.user);
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please verify your login details.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError('');
    if (!regData.name || !regData.email || !regData.collegeId || !regData.password) {
      setError('Please complete all required registration fields.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.registerStudent(regData);
      if (onLoginSuccess) {
        onLoginSuccess(res.user);
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`login-portal-root navy-theme ${themeMode === 'light' ? 'light-mode-preview' : ''}`}>
      {/* Background Campus Building with Dark Navy Overlay */}
      <div className="login-backdrop-bg" />
      <div className="login-backdrop-overlay" />
      <div className="login-backdrop-glow orb-1" />
      <div className="login-backdrop-glow orb-2" />

      {/* Decorative dot matrix patterns */}
      <div className="dot-matrix dot-matrix-tl" aria-hidden="true" />
      <div className="dot-matrix dot-matrix-bl" aria-hidden="true" />
      <div className="dot-matrix dot-matrix-br" aria-hidden="true" />

      {/* Angled script watermarks matching mockup */}
      <div className="script-watermark script-watermark-top" aria-hidden="true">
        Safer Campus, Better Tomorrow
      </div>
      <div className="script-watermark script-watermark-bottom" aria-hidden="true">
        Your Voice, Our Responsibility
      </div>

      {/* Header bar */}
      <header className="portal-header">
        <div className="portal-container">
          <div className="header-left-cluster">
            <div className="header-dot-icon" aria-hidden="true" />
            <div className="brand-lockup-login">
              <div className="brand-mark">
                <ShieldCheck size={22} strokeWidth={2.5} />
              </div>
              <div>
                <strong>
                  Campus<span className="brand-cyan">BRIDGE</span>
                </strong>
                <small>Central Grievance & Complaint Management System</small>
              </div>
            </div>
          </div>

          <div className="header-right-cluster">
            <div className="header-badge">
              <Building2 size={15} />
              <span>Riverside Tech Campus · Unified Portal</span>
            </div>
            <button
              type="button"
              className="theme-mode-toggle"
              onClick={() => setThemeMode((m) => (m === 'dark' ? 'light' : 'dark'))}
              title={themeMode === 'dark' ? 'Switch to Light preview' : 'Switch to Dark Navy mode'}
              aria-label="Toggle theme mode"
            >
              {themeMode === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main hero & unified login section */}
      <main className="portal-main">
        {/* Floating Side feature badges */}
        <div className="floating-left-badges" aria-hidden="true">
          <div className="float-badge-item">
            <div className="float-badge-icon">
              <ShieldCheck size={18} />
            </div>
            <span>Safe & Transparent</span>
          </div>
          <div className="float-badge-item">
            <div className="float-badge-icon">
              <BarChart3 size={18} />
            </div>
            <span>Real-time Tracking</span>
          </div>
          <div className="float-badge-item">
            <div className="float-badge-icon">
              <Users size={18} />
            </div>
            <span>Faster Resolution</span>
          </div>
        </div>

        <div className="portal-container">
          {/* Top Hero Section */}
          <div className="portal-intro">
            <div className="intro-badge">
              <Sparkles size={13} />
              <span>ROLE-BASED SECURE ACCESS</span>
            </div>
            <h1>
              Campus <span className="gradient-portal">Portal</span> Login
            </h1>
            <p>
              Select your designated role below to enter your customized grievance dashboard with verified
              responsibilities, staff assignment workflows, and resolution tracking.
            </p>
          </div>

          {/* Unified Login Glass Container */}
          <div className="login-form-container unified-login-container">
            {/* Top right floating pill over glass container */}
            <div className="card-top-floating-badge">
              <Building2 size={16} />
              <div className="floating-badge-copy">
                <strong>Clean Campus</strong>
                <span>Happy Students</span>
              </div>
            </div>

            <div className="login-form-card unified-login-card">
              {/* Option Cards INSIDE Login */}
              <div className="login-portal-selector-section">
                <div className="login-section-meta">
                  <div className="section-title-wrap">
                    <span className="section-step-tag">STEP 1 · SWITCH DASHBOARD</span>
                    <h2 className="login-inner-heading">Choose Portal Role</h2>
                  </div>
                  <div className="current-active-chip">
                    <span className="active-green-pulse" />
                    <span>
                      Active: <strong>{activeRoleConfig.title}</strong>
                    </span>
                  </div>
                </div>

                <div className="role-cards-grid role-cards-grid-inside">
                  {ROLES.map((role) => {
                    const Icon = role.icon;
                    const isSelected = selectedRole === role.id;
                    return (
                      <div
                        key={role.id}
                        className={`role-card ${role.colorClass} ${isSelected ? 'role-card-active' : ''}`}
                        onClick={() => handleRoleCardClick(role.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleRoleCardClick(role.id);
                          }
                        }}
                      >
                        <div className="role-card-header">
                          <div className="role-icon-box">
                            <Icon size={20} />
                          </div>
                          <span className="role-pill">{role.badge}</span>
                        </div>
                        <h3>{role.title}</h3>
                        <p>{role.desc}</p>
                        <div className="role-card-footer">
                          {isSelected ? (
                            <span className="role-active-btn filled-active-btn">
                              <CheckCircle2 size={14} /> Active Form
                            </span>
                          ) : (
                            <span className="role-active-btn secondary-select-btn">
                              Select Role <ArrowRight size={13} />
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Divider */}
              <div className="login-card-divider" />

              {/* Credentials & Login Form Section */}
              <div className="login-form-section">
                {activeNotice && (
                  <div className="portal-switch-alert-banner">
                    <Info size={16} className="switch-sparkle-icon" />
                    <div className="switch-alert-text">
                      <strong>Portal Switch Selection</strong>
                      <span>{activeNotice}</span>
                    </div>
                    <button
                      type="button"
                      className="switch-alert-dismiss"
                      onClick={() => setActiveNotice('')}
                      aria-label="Dismiss notice"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                <div className="form-top-indicator">
                  <div className="active-role-chip">
                    <activeRoleConfig.icon size={15} />
                    <span>
                      Logging into: <strong>{activeRoleConfig.title}</strong>
                    </span>
                  </div>

                  <div className="autofill-indicator-group">
                    <button
                      type="button"
                      className="demo-autofill-btn"
                      onClick={() => fillDemoCredentials(false)}
                      title="Auto-fill verified College ID and password"
                    >
                      <UserCheck size={14} />
                      <span>Put ID & Password</span>
                    </button>
                    <button
                      type="button"
                      className="demo-autofill-btn secondary-autofill-btn"
                      onClick={() => fillDemoCredentials(true)}
                      title="Auto-fill verified email and password"
                    >
                      <Mail size={14} />
                      <span>Use Email</span>
                    </button>
                  </div>
                </div>

                {/* Auto-filled status banner */}
                <div className="credentials-sync-banner">
                  <div className="sync-banner-left">
                    <div className="sync-circle-icon">
                      <Check size={15} strokeWidth={3} />
                    </div>
                    <div>
                      <strong>Credentials Applied for {activeRoleConfig.title}</strong>
                      <span className="sync-banner-sub">
                        ID: <code>{activeRoleConfig.demoId}</code> · Pass: <code>{activeRoleConfig.demoPass}</code> ({activeRoleConfig.demoName})
                      </span>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="auth-error-banner" role="alert">
                    <AlertTriangle size={18} />
                    <span>{error}</span>
                  </div>
                )}

                {!isRegisteringStudent ? (
                  /* Regular Sign-in Form */
                  <form className="auth-form" onSubmit={handleLogin}>
                    <div className="form-field">
                      <label htmlFor="identifier-input">
                        <span>College ID or Registered Email</span>
                        <small className="hint-text">Auto-filled on dashboard switch</small>
                      </label>
                      <div className="input-wrap">
                        <Mail size={16} className="input-icon" />
                        <input
                          id="identifier-input"
                          type="text"
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          placeholder="Enter College ID or email"
                          required
                          autoComplete="username"
                        />
                      </div>
                    </div>

                    <div className="form-field">
                      <label htmlFor="password-input">
                        <span>Password</span>
                        <small className="hint-text">Auto-filled on dashboard switch</small>
                      </label>
                      <div className="input-wrap">
                        <Lock size={16} className="input-icon" />
                        <input
                          id="password-input"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          required
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          className="password-toggle-btn"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <button type="submit" className="portal-submit-btn" disabled={loading}>
                      {loading ? (
                        <span className="spinner-text">Authenticating securely...</span>
                      ) : (
                        <>
                          <span>Sign In to {activeRoleConfig.title}</span>
                          <ChevronRight size={17} />
                        </>
                      )}
                    </button>

                    {selectedRole === 'student' && (
                      <div className="switch-auth-mode">
                        <span>New student without an account?</span>{' '}
                        <button
                          type="button"
                          className="link-btn"
                          onClick={() => {
                            setIsRegisteringStudent(true);
                            setError('');
                          }}
                        >
                          Create Student Account
                        </button>
                      </div>
                    )}

                    {selectedRole !== 'student' && (
                      <div className="privileged-role-note">
                        <ShieldCheck size={14} />
                        <span>
                          Role-protected portal. Switching dashboard cards above automatically populates the required ID and password.
                        </span>
                      </div>
                    )}
                  </form>
                ) : (
                  /* Student Registration Form */
                  <form className="auth-form" onSubmit={handleRegister}>
                    <div className="reg-heading">
                      <h3>Register New Student Profile</h3>
                      <p>Enter your student identity details to activate your grievance portal account.</p>
                    </div>

                    <div className="form-row-2">
                      <div className="form-field">
                        <label>Full Name *</label>
                        <input
                          type="text"
                          required
                          value={regData.name}
                          onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                          placeholder="e.g. Sanya Gupta"
                        />
                      </div>
                      <div className="form-field">
                        <label>College Roll / ID *</label>
                        <input
                          type="text"
                          required
                          value={regData.collegeId}
                          onChange={(e) => setRegData({ ...regData, collegeId: e.target.value })}
                          placeholder="e.g. STU-2026-045"
                        />
                      </div>
                    </div>

                    <div className="form-row-2">
                      <div className="form-field">
                        <label>College Email *</label>
                        <input
                          type="email"
                          required
                          value={regData.email}
                          onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                          placeholder="sanya@campus.edu"
                        />
                      </div>
                      <div className="form-field">
                        <label>Password *</label>
                        <input
                          type="password"
                          required
                          value={regData.password}
                          onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                          placeholder="Create a strong password"
                        />
                      </div>
                    </div>

                    <div className="form-row-2">
                      <div className="form-field">
                        <label>Department / Stream</label>
                        <input
                          type="text"
                          value={regData.department}
                          onChange={(e) => setRegData({ ...regData, department: e.target.value })}
                          placeholder="e.g. Computer Science"
                        />
                      </div>
                      <div className="form-field">
                        <label>Hostel & Room (Optional)</label>
                        <input
                          type="text"
                          value={regData.hostel}
                          onChange={(e) => setRegData({ ...regData, hostel: e.target.value })}
                          placeholder="e.g. Gargi Hostel · Room 204"
                        />
                      </div>
                    </div>

                    <button type="submit" className="portal-submit-btn" disabled={loading}>
                      {loading ? 'Creating student profile...' : 'Register and Sign In'}
                    </button>

                    <div className="switch-auth-mode">
                      <span>Already registered?</span>{' '}
                      <button
                        type="button"
                        className="link-btn"
                        onClick={() => {
                          setIsRegisteringStudent(false);
                          setError('');
                        }}
                      >
                        Back to Login
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="portal-footer">
        <div className="portal-container">
          <p>© 2026 Riverside Tech Campus · CampusBridge Grievance Management · Role Protected RBAC</p>
          <div className="footer-links">
            <span>Server Security Verified</span>
            <span>•</span>
            <span>PBKDF2 SHA-512 Password Encryption</span>
            <span>•</span>
            <span>Departmental Scope Enforced</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
