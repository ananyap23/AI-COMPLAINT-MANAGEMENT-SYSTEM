import { useEffect, useMemo, useRef, useState } from 'react'
import { BarChart3, Bell, BookOpen, Building2, ChevronDown, ChevronRight, CircleHelp, FileText, Home, LayoutDashboard, Menu, MessageSquare, Plus, Search, Settings, ShieldCheck, Sparkles, Users, X } from 'lucide-react'
import './App.css'

const complaints = [
  { id: 'ST-2048', title: 'Power backup failed in Hostel C', category: 'Hostel', status: 'In review', urgency: 'High', date: 'Today, 09:42 AM', location: 'Girls Hostel · Block C' },
  { id: 'ST-2041', title: 'Mess menu needs better vegetarian options', category: 'Mess & food', status: 'Resolved', urgency: 'Low', date: 'Yesterday, 04:18 PM', location: 'Main Cafeteria' },
  { id: 'ST-2028', title: 'Street light near library gate keeps flickering', category: 'Infrastructure', status: 'Assigned', urgency: 'Medium', date: '18 Aug, 11:06 AM', location: 'North Gate Road' },
  { id: 'ST-2019', title: 'Late entry request for exam week approved', category: 'Transport', status: 'Closed', urgency: 'Low', date: '16 Aug, 08:53 PM', location: 'Security Gate · Main Entry' },
]
const navItems = [
  { label: 'Overview', icon: LayoutDashboard }, { label: 'My complaints', icon: FileText },
  { label: 'Messages', icon: MessageSquare, count: 2 }, { label: 'Campus guide', icon: BookOpen },
]

const coordinatorNavItems = [
  { label: 'Dashboard', icon: LayoutDashboard }, { label: 'All complaints', icon: FileText },
  { label: 'Assignments', icon: Users }, { label: 'Messages', icon: MessageSquare, count: 6 },
  { label: 'Analytics', icon: BarChart3 },
]

const complaintStatuses = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Closed']

function normalizeStatus(status) {
  return status === 'In review' ? 'Under Review' : status
}

function statusHistoryFor(complaint) {
  return complaint.statusHistory || []
}

function mockAIAnalysis(complaint) {
  const category = complaint.category || 'Infrastructure'
  const department = category === 'Hostel' ? 'Hostel Office' : category === 'Mess & food' ? 'Mess Committee' : category === 'Faculty' ? 'Academic Affairs' : category === 'Transport' ? 'Transport Desk' : category === 'Safety' ? 'Student Safety Cell' : 'Facilities Team'
  const priority = complaint.urgency || 'Medium'
  return { category, department, priority, confidence: priority === 'High' || priority === 'Critical' ? 94 : 88, similarComplaints: priority === 'High' ? 7 : 3, status: 'complete' }
}

function hydrateComplaint(complaint, index = 0) {
  const createdAt = complaint.createdAt || Date.now() - index * 24 * 60 * 60 * 1000
  const currentIndex = Math.max(0, complaintStatuses.indexOf(normalizeStatus(complaint.status)))
  const statusHistory = complaint.statusHistory || complaintStatuses.slice(0, currentIndex + 1).map((status, statusIndex) => ({
    status,
    time: createdAt + statusIndex * 60 * 60 * 1000,
    detail: status === 'Assigned' ? 'Facilities Department' : status === 'In Progress' ? 'Technician assigned' : status === 'Resolved' ? 'Issue marked fixed' : status === 'Closed' ? 'Student confirmation pending' : '',
  }))
  return { ...complaint, createdAt, statusHistory, aiAnalysis: complaint.aiAnalysis || mockAIAnalysis(complaint) }
}

function formatRelativeTime(timestamp) {
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000))
  if (elapsedSeconds < 60) return 'Just now'
  const elapsedMinutes = Math.floor(elapsedSeconds / 60)
  if (elapsedMinutes < 60) return `${elapsedMinutes} min ago`
  const elapsedHours = Math.floor(elapsedMinutes / 60)
  if (elapsedHours < 24) return `${elapsedHours} hr ago`
  const elapsedDays = Math.floor(elapsedHours / 24)
  return `${elapsedDays} day${elapsedDays === 1 ? '' : 's'} ago`
}

function App() {
  const [role, setRole] = useState('student')
  const [activeNav, setActiveNav] = useState('Overview')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All complaints')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showAllNotifications, setShowAllNotifications] = useState(false)
  const notificationRef = useRef(null)
  const [notifications, setNotifications] = useState(() => {
    const now = Date.now()
    return [
      { id: 'updated-2048', type: 'Complaint Update', title: 'Complaint Updated', message: 'CMP-2026-0012 is under review', createdAt: now - 10 * 60 * 1000, unread: true },
      { id: 'resolved-0008', type: 'Complaint Resolved', title: 'Complaint Resolved', message: 'CMP-2026-0008 has been resolved', createdAt: now - 2 * 60 * 60 * 1000, unread: true },
      { id: 'response-0005', type: 'Response Required', title: 'Response Required', message: 'Please respond to CMP-2026-0005', createdAt: now - 24 * 60 * 60 * 1000, unread: true },
      { id: 'campus-update', type: 'New Campus Update', title: 'New Campus Update', message: 'Water supply maintenance is scheduled for Block B', createdAt: now - 26 * 60 * 60 * 1000, unread: false },
      { id: 'announcement', type: 'Important Announcement', title: 'Important Announcement', message: 'Mid-semester examination forms are now open', createdAt: now - 48 * 60 * 60 * 1000, unread: false },
    ]
  })
  const [showModal, setShowModal] = useState(false)
  const [submittedComplaint, setSubmittedComplaint] = useState(null)
  const [aiAnalyzingId, setAiAnalyzingId] = useState(null)
  const [selectedComplaintId, setSelectedComplaintId] = useState(null)
  const [coordinatorComplaintId, setCoordinatorComplaintId] = useState(null)
  const [coordinatorFilters, setCoordinatorFilters] = useState({ query: '', category: 'All Categories', status: 'All Status', priority: 'All Priority', sort: 'Newest' })
  const [showSupport, setShowSupport] = useState(false)
  const [supportMessages, setSupportMessages] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('campusVoiceSupportMessages') || '[]').map((message) => ({ ...message, createdAt: message.createdAt || Date.now() }))
    } catch {
      return []
    }
  })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [complaintList, setComplaintList] = useState(() => {
    try {
      const savedComplaints = JSON.parse(localStorage.getItem('campusVoiceComplaints') || 'null')
      return (savedComplaints || complaints).map(hydrateComplaint)
    } catch {
      return complaints.map(hydrateComplaint)
    }
  })
  const [, setClock] = useState(Date.now())
  const currentDate = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(new Date())
  const unreadNotificationCount = notifications.filter((notification) => notification.unread).length
  useEffect(() => {
    localStorage.setItem('campusVoiceSupportMessages', JSON.stringify(supportMessages))
  }, [supportMessages])
  useEffect(() => {
    localStorage.setItem('campusVoiceComplaints', JSON.stringify(complaintList))
  }, [complaintList])
  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 60 * 1000)
    return () => window.clearInterval(timer)
  }, [])
  useEffect(() => {
    if (!aiAnalyzingId) return undefined
    const timer = window.setTimeout(() => {
      setComplaintList((currentComplaints) => currentComplaints.map((complaint) => complaint.id === aiAnalyzingId ? { ...complaint, aiAnalysis: mockAIAnalysis(complaint) } : complaint))
      setAiAnalyzingId(null)
    }, 1800)
    return () => window.clearTimeout(timer)
  }, [aiAnalyzingId])
  useEffect(() => {
    function handleOutsideClick(event) {
      if (showNotifications && !notificationRef.current?.contains(event.target)) setShowNotifications(false)
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [showNotifications])
  const filteredComplaints = useMemo(() => complaintList.filter((complaint) => {
    const matchesQuery = `${complaint.title} ${complaint.category} ${complaint.id}`.toLowerCase().includes(query.toLowerCase())
    const matchesFilter = filter === 'All complaints' || (filter === 'In review' && normalizeStatus(complaint.status) === 'Under Review') || complaint.status === filter
    return matchesQuery && matchesFilter
  }), [complaintList, filter, query])

  function handleComplaintSubmit(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const title = formData.get('title').trim()
    const description = formData.get('description').trim()
    const location = formData.get('location').trim()
    const nextNumber = complaintList.reduce((highest, complaint) => {
      const number = Number(complaint.id.match(/CMP-2026-(\d+)/)?.[1] || 0)
      return Math.max(highest, number)
    }, 11) + 1
    const nextComplaint = {
      id: `CMP-2026-${String(nextNumber).padStart(4, '0')}`,
      title,
      description,
      category: formData.get('category'),
      status: 'Submitted',
      urgency: formData.get('priority'),
      date: 'Just now',
      location,
      attachment: formData.get('attachment')?.name || '',
      createdAt: Date.now(),
      statusHistory: [{ status: 'Submitted', time: Date.now() }],
      aiAnalysis: { status: 'analyzing' },
    }
    setComplaintList((currentComplaints) => [nextComplaint, ...currentComplaints])
    setSubmittedComplaint(nextComplaint)
    setAiAnalyzingId(nextComplaint.id)
  }

  function handleStatusChange(status) {
    setComplaintList((currentComplaints) => currentComplaints.map((complaint) => complaint.id === selectedComplaintId ? {
      ...complaint,
      status,
      statusHistory: [...statusHistoryFor(complaint), { status, time: Date.now() }].filter((event, index, events) => events.findIndex((item) => item.status === event.status) === index),
    } : complaint))
  }

  function switchRole() {
    const nextRole = role === 'student' ? 'coordinator' : 'student'
    setRole(nextRole)
    setActiveNav(nextRole === 'coordinator' ? 'Dashboard' : 'Overview')
    setSelectedComplaintId(null)
    setCoordinatorComplaintId(null)
  }

  function markNotificationRead(notificationId) {
    setNotifications((currentNotifications) => currentNotifications.map((notification) => notification.id === notificationId ? { ...notification, unread: false } : notification))
  }

  function markAllNotificationsRead() {
    setNotifications((currentNotifications) => currentNotifications.map((notification) => ({ ...notification, unread: false })))
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="brand-lockup"><div className="brand-mark"><ShieldCheck size={21} strokeWidth={2.5} /></div><div><strong>Campus</strong><span>BRIDGE</span></div></div>
        <div className="sidebar-label">Workspace</div>
        <nav className="primary-nav">{(role === 'coordinator' ? coordinatorNavItems : navItems).map(({ label, icon: Icon, count }) => <button key={label} className={`nav-item ${activeNav === label ? 'active' : ''}`} onClick={() => { setActiveNav(label); setSidebarOpen(false) }}><Icon size={18} /><span>{label}</span>{role === 'student' && label === 'My complaints' ? <b>{complaintList.length}</b> : count && <b>{count}</b>}</button>)}</nav>
        <div className="sidebar-label support-label">Support</div>
        <nav className="primary-nav"><button className={`nav-item ${activeNav === 'Help center' ? 'active' : ''}`} onClick={() => { setActiveNav('Help center'); setShowSupport(true); setSidebarOpen(false) }}><CircleHelp size={18} /><span>Help center</span></button><button className={`nav-item ${activeNav === 'Settings' ? 'active' : ''}`} onClick={() => { setActiveNav('Settings'); setSidebarOpen(false) }}><Settings size={18} /><span>Settings</span></button></nav>
        <div className="sidebar-footer"><div className="campus-card"><div className="campus-icon"><Building2 size={18} /></div><div><strong>Riverside Tech Campus</strong><span>{role === 'coordinator' ? 'Admin console' : 'Student hub'}</span></div><ChevronRight size={16} /></div><div className="profile-row"><div className="avatar">{role === 'coordinator' ? 'PB' : 'AP'}</div><div><strong>{role === 'coordinator' ? 'Piyush Bhushan' : 'Ananya Pandey'}</strong><span>{role === 'coordinator' ? 'HOD · IT Department' : 'Student · IT'}</span></div><ChevronDown size={16} /></div><button className="role-switcher" onClick={switchRole}>{role === 'coordinator' ? 'Switch to Student view' : 'Switch to HOD view'}</button></div>
      </aside>
      <main className="main-content">
        <header className="topbar"><button className="mobile-menu" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle navigation"><Menu size={21} /></button><div className="breadcrumb"><span>Student hub</span><ChevronRight size={15} /><strong>{showAllNotifications ? 'Notifications' : activeNav}</strong></div><div className="top-actions"><div className="search-box"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search complaints..." /><kbd>⌘ K</kbd></div><div className="notification-wrap" ref={notificationRef}><button className="icon-button" onClick={() => setShowNotifications(!showNotifications)} aria-label="Show notifications"><Bell size={19} />{unreadNotificationCount > 0 && <b className="notification-badge">{unreadNotificationCount}</b>}</button>{showNotifications && <div className="notification-panel"><div className="notification-panel-header"><strong>Notifications</strong>{unreadNotificationCount > 0 && <button onClick={markAllNotificationsRead}>Mark all read</button>}</div>{notifications.length ? <div className="notification-list">{notifications.map((notification) => <button className={`notification-item ${notification.unread ? 'unread' : ''} ${notification.type.toLowerCase().replaceAll(' ', '-')}`} key={notification.id} onClick={() => markNotificationRead(notification.id)}><span className="notification-type-dot" /><span className="notification-copy"><strong>{notification.title}</strong><span>{notification.message}</span><small>{formatRelativeTime(notification.createdAt)}</small></span>{notification.unread && <i className="notification-unread-dot" />}</button>)}</div> : <div className="notification-empty"><Bell size={24} /><strong>No new notifications</strong><span>You're all caught up!</span></div>}<button className="view-all-notifications" onClick={() => { setShowNotifications(false); setShowAllNotifications(true) }}>View all notifications <ChevronRight size={15} /></button></div>}</div><button className="avatar top-avatar">AP</button></div></header>
        <div className="page-content">
          {showAllNotifications ? <NotificationPage notifications={notifications} onBack={() => setShowAllNotifications(false)} onRead={markNotificationRead} onMarkAll={markAllNotificationsRead} /> : activeNav === 'Settings' ? <SettingsPage /> : role === 'coordinator' ? <CoordinatorDashboard complaints={complaintList} activeNav={activeNav} filters={coordinatorFilters} setFilters={setCoordinatorFilters} selectedId={coordinatorComplaintId} setSelectedId={setCoordinatorComplaintId} onUpdateComplaint={(updatedComplaint) => setComplaintList((currentComplaints) => currentComplaints.map((complaint) => complaint.id === updatedComplaint.id ? updatedComplaint : complaint))} /> : activeNav === 'Overview' ? <>
          <section className="welcome-row"><div><p className="eyebrow">{currentDate}</p><h1>Good morning, Ananya <span>✦</span></h1><p className="welcome-copy">Here is your live campus pulse for today.</p></div><button className="primary-button" onClick={() => setShowModal(true)}><Plus size={18} /> Raise an issue</button></section>
          <section className="stats-grid"><article className="stat-card"><div className="stat-top"><span className="stat-icon plum"><FileText size={18} /></span><span className="trend up">+2 this month</span></div><strong>{complaintList.length}</strong><span>My complaints</span><div className="mini-bars"><i /><i /><i /><i /><i /><i /><i /></div></article><article className="stat-card"><div className="stat-top"><span className="stat-icon yellow"><MessageSquare size={18} /></span><span className="trend neutral">1 awaiting you</span></div><strong>2</strong><span>Need your response</span><div className="mini-bars yellow-bars"><i /><i /><i /><i /><i /><i /><i /></div></article><article className="stat-card"><div className="stat-top"><span className="stat-icon green"><ShieldCheck size={18} /></span><span className="trend up">92% this month</span></div><strong>86%</strong><span>Resolved on time</span><div className="progress-line"><i /></div></article></section>
          <section className="insight-banner"><div className="sparkle-icon"><Sparkles size={20} /></div><div><strong>Campus insight</strong><p>Top issue this week: <b>Hostel utilities</b>. 17 similar reports were grouped and shared with the facilities desk.</p></div><button>View insights <ChevronRight size={16} /></button></section>
          <section className="content-grid"><div className="complaint-section"><div className="section-heading"><div><h2>Recent requests</h2><p>Follow the latest updates from your campus services.</p></div><button className="text-button" onClick={() => setActiveNav('My complaints')}>View all <ChevronRight size={16} /></button></div><div className="filter-row">{['All complaints', 'Submitted', 'In review', 'Assigned', 'Resolved'].map((option) => <button key={option} className={filter === option ? 'selected' : ''} onClick={() => setFilter(option)}>{option}</button>)}<div className="filter-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by keyword" /></div></div><div className="complaints-list">{filteredComplaints.map((complaint) => <ComplaintRow key={complaint.id} complaint={complaint} onSelect={() => { setSelectedComplaintId(complaint.id); setActiveNav('My complaints') }} />)}{!filteredComplaints.length && <div className="empty-state"><Search size={22} /><strong>No complaints found</strong><span>Try another keyword or filter.</span></div>}</div></div><aside className="right-rail"><div className="rail-heading"><h2>Campus updates</h2><button className="more-button">•••</button></div><div className="update-card"><div className="update-tag"><span /> Facilities</div><h3>Water supply maintenance · Block B</h3><p>Scheduled maintenance will run from 2:00 PM to 4:30 PM today.</p><small>Posted 1 hr ago</small></div><div className="update-card lavender"><div className="update-tag"><span /> Student affairs</div><h3>Share your voice in the mess survey</h3><p>Help us improve campus dining. The survey closes this Friday.</p><small>Posted yesterday</small></div><button className="all-updates">See all campus updates <ChevronRight size={16} /></button><div className="help-card"><div className="help-illustration"><Home size={23} /></div><div><strong>Need to talk?</strong><p>Our student support team is here for you.</p><button>Contact support</button></div></div></aside></section>
          </> : activeNav === 'My complaints' ? <ComplaintsPage complaints={complaintList} query={query} setQuery={setQuery} filter={filter} setFilter={setFilter} selectedComplaintId={selectedComplaintId} setSelectedComplaintId={setSelectedComplaintId} onStatusChange={handleStatusChange} /> : activeNav === 'Messages' ? <MessagesPage messages={supportMessages} onReply={() => setShowSupport(true)} /> : <GuidePage onContact={() => setShowSupport(true)} />}
        </div>
      </main>
      {showModal && <div className="modal-backdrop" onClick={() => setShowModal(false)}><form className="modal" onSubmit={handleComplaintSubmit} onClick={(event) => event.stopPropagation()}>{submittedComplaint ? <div className="submission-success"><div className="sparkle-icon"><ShieldCheck size={20} /></div><p className="eyebrow">Complaint submitted successfully!</p><h2>{submittedComplaint.title}</h2><p><strong>Complaint ID:</strong> {submittedComplaint.id}</p><p><strong>Status:</strong> {submittedComplaint.status}</p><button type="button" className="primary-button" onClick={() => { setShowModal(false); setSubmittedComplaint(null); setActiveNav('My complaints'); setFilter('All complaints'); setQuery('') }}>View my complaints <ChevronRight size={16} /></button></div> : <><div className="modal-header"><div><p className="eyebrow">New submission</p><h2>Submit a Complaint</h2></div><button type="button" className="close-button" onClick={() => setShowModal(false)}><X size={19} /></button></div><label>Complaint Title<input name="title" required placeholder="Enter a short title" autoFocus /></label><label>Description<textarea name="description" required placeholder="Describe your complaint..." /></label><label>Category<select name="category" required defaultValue=""><option value="" disabled>Select Category</option><option>Hostel</option><option>Mess & food</option><option>Faculty</option><option>Infrastructure</option><option>Ragging</option><option>Harassment</option><option>Other</option></select></label><label>Location<input name="location" required placeholder="e.g. Vikram Hostel, Block B" /></label><label>Priority<select name="priority" defaultValue="Low"><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></label><label>Attach File<input name="attachment" type="file" /></label><div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="primary-button">Submit Complaint <ChevronRight size={16} /></button></div></>}</form></div>}
      {showSupport && <SupportModal onClose={() => setShowSupport(false)} onSent={(message) => { setSupportMessages((currentMessages) => [message, ...currentMessages]); setActiveNav('Messages') }} />}
    </div>
  )
}

function ComplaintRow({ complaint, onSelect }) {
  return <article className="complaint-row" onClick={onSelect} role={onSelect ? 'button' : undefined} tabIndex={onSelect ? 0 : undefined} onKeyDown={(event) => event.key === 'Enter' && onSelect?.()}><div className="complaint-main"><div className={`status-dot ${normalizeStatus(complaint.status).toLowerCase().replace(' ', '-')}`} /><div><div className="complaint-title"><h3>{complaint.title}</h3><span className={`urgency ${complaint.urgency.toLowerCase()}`}>{complaint.urgency}</span></div><div className="complaint-meta"><span>{complaint.id}</span><i /><span>{complaint.category}</span><i /><span>{complaint.location}</span></div></div></div><div className="complaint-end"><span className={`status-pill ${normalizeStatus(complaint.status).toLowerCase().replace(' ', '-')}`}>{normalizeStatus(complaint.status)}</span><span className="complaint-date">{complaint.createdAt ? formatRelativeTime(complaint.createdAt) : complaint.date}</span><button className="view-details" onClick={(event) => { event.stopPropagation(); onSelect?.() }}>View details <ChevronRight size={14} /></button></div></article>
}

function PageIntro({ eyebrow, title, description, action }) {
  return <section className="page-intro"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="welcome-copy">{description}</p></div>{action}</section>
}

function NotificationPage({ notifications, onBack, onRead, onMarkAll }) {
  const unreadCount = notifications.filter((notification) => notification.unread).length
  return <><button className="back-button" onClick={onBack}><ChevronRight size={16} className="back-chevron" /> Back to dashboard</button><PageIntro eyebrow="Stay informed" title="Notifications" description="Updates about your complaints and campus activity." action={unreadCount > 0 ? <button className="text-button" onClick={onMarkAll}>Mark all as read</button> : null} />{notifications.length ? <div className="notification-page-list">{notifications.map((notification) => <button className={`notification-page-item ${notification.unread ? 'unread' : ''} ${notification.type.toLowerCase().replaceAll(' ', '-')}`} key={notification.id} onClick={() => onRead(notification.id)}><span className="notification-type-dot" /><span className="notification-copy"><strong>{notification.title}</strong><span>{notification.message}</span><small>{formatRelativeTime(notification.createdAt)}</small></span>{notification.unread && <i className="notification-unread-dot" />}</button>)}</div> : <div className="notification-empty notification-page-empty"><Bell size={28} /><strong>No new notifications</strong><span>You're all caught up!</span></div>}</>
}

function CoordinatorDashboard({ complaints, activeNav, filters, setFilters, selectedId, setSelectedId, onUpdateComplaint }) {
  const visibleComplaints = complaints.filter((complaint) => {
    const text = `${complaint.title} ${complaint.id} ${complaint.location}`.toLowerCase()
    return text.includes(filters.query.toLowerCase()) && (filters.category === 'All Categories' || complaint.category === filters.category) && (filters.status === 'All Status' || normalizeStatus(complaint.status) === filters.status) && (filters.priority === 'All Priority' || complaint.urgency === filters.priority)
  }).sort((first, second) => filters.sort === 'Oldest' ? first.createdAt - second.createdAt : second.createdAt - first.createdAt)
  const selectedComplaint = complaints.find((complaint) => complaint.id === selectedId)
  const pending = complaints.filter((complaint) => ['Submitted', 'Under Review'].includes(normalizeStatus(complaint.status))).length
  const inProgress = complaints.filter((complaint) => normalizeStatus(complaint.status) === 'In Progress').length
  const resolved = complaints.filter((complaint) => ['Resolved', 'Closed'].includes(normalizeStatus(complaint.status))).length

  if (activeNav === 'Assignments') return <><PageIntro eyebrow="Coordinator workspace" title="Assignments" description="Departments currently responsible for student complaints." /><div className="assignment-grid">{['Facilities Department', 'Hostel Office', 'Mess Committee'].map((department) => <article className="assignment-card" key={department}><div className="assignment-icon"><Users size={19} /></div><div><strong>{department}</strong><span>{complaints.filter((complaint) => complaint.category === (department === 'Hostel Office' ? 'Hostel' : department === 'Mess Committee' ? 'Mess & food' : 'Infrastructure')).length} active complaints</span></div><ChevronRight size={16} /></article>)}</div></>
  if (activeNav === 'Analytics') return <><PageIntro eyebrow="Coordinator workspace" title="Analytics" description="A quick view of complaint volume and resolution health." /><div className="analytics-grid"><article className="analytics-card"><span>Total complaints</span><strong>{complaints.length}</strong><div className="analytics-bar"><i style={{ width: '78%' }} /></div></article><article className="analytics-card"><span>Resolved or closed</span><strong>{resolved}</strong><div className="analytics-bar green-bar"><i style={{ width: `${Math.max(12, (resolved / Math.max(complaints.length, 1)) * 100)}%` }} /></div></article><article className="analytics-card"><span>Awaiting action</span><strong>{pending + inProgress}</strong><div className="analytics-bar orange-bar"><i style={{ width: '42%' }} /></div></article></div></>
  return <><PageIntro eyebrow="Coordinator workspace" title={activeNav === 'All complaints' ? 'All complaints' : 'Coordinator dashboard'} description="Review, assign and move campus complaints forward." /><section className="coordinator-stats"><article><span>Total complaints</span><strong>{complaints.length + 120}</strong><small>Across all departments</small></article><article><span>Pending</span><strong>{pending + 17}</strong><small>Need coordinator review</small></article><article><span>In progress</span><strong>{inProgress + 31}</strong><small>Currently being handled</small></article><article><span>Resolved</span><strong>{resolved + 70}</strong><small>Resolved this cycle</small></article></section><section className="admin-table-card"><div className="admin-table-heading"><div><h2>All complaints</h2><p>Search and manage every student submission.</p></div><span className="live-label"><i /> Live queue</span></div><div className="admin-filters"><div className="admin-search"><Search size={16} /><input value={filters.query} onChange={(event) => setFilters({ ...filters, query: event.target.value })} placeholder="Search complaints..." /></div><select value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })}><option>All Categories</option>{[...new Set(complaints.map((complaint) => complaint.category))].map((category) => <option key={category}>{category}</option>)}</select><select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option>All Status</option>{complaintStatuses.map((status) => <option key={status}>{status}</option>)}</select><select value={filters.priority} onChange={(event) => setFilters({ ...filters, priority: event.target.value })}><option>All Priority</option>{['Low', 'Medium', 'High', 'Critical'].map((priority) => <option key={priority}>{priority}</option>)}</select><select value={filters.sort} onChange={(event) => setFilters({ ...filters, sort: event.target.value })}><option>Newest</option><option>Oldest</option></select></div><div className="admin-table-wrap"><table><thead><tr><th>Complaint</th><th>Student</th><th>Category</th><th>Priority</th><th>Status</th><th>Action</th></tr></thead><tbody>{visibleComplaints.map((complaint) => <tr key={complaint.id}><td><strong>{complaint.title}</strong><small>{complaint.id}</small></td><td>{complaint.name || 'Ananya Pandey'}</td><td>{complaint.category}</td><td><span className={`urgency ${complaint.urgency.toLowerCase()}`}>{complaint.urgency}</span></td><td><span className={`status-pill ${normalizeStatus(complaint.status).toLowerCase().replace(' ', '-')}`}>{normalizeStatus(complaint.status)}</span></td><td><button className="table-view" onClick={() => setSelectedId(complaint.id)}>View <ChevronRight size={14} /></button></td></tr>)}</tbody></table>{!visibleComplaints.length && <div className="empty-state"><Search size={22} /><strong>No complaints match</strong><span>Try changing the filters.</span></div>}</div></section>{selectedComplaint && <CoordinatorComplaintModal complaint={selectedComplaint} onClose={() => setSelectedId(null)} onSave={onUpdateComplaint} />}</>
}

function CoordinatorComplaintModal({ complaint, onClose, onSave }) {
  const [status, setStatus] = useState(normalizeStatus(complaint.status))
  const [department, setDepartment] = useState(complaint.department || 'Facilities')
  function saveChanges() {
    onSave({ ...complaint, status, department, statusHistory: [...statusHistoryFor(complaint), ...(status !== normalizeStatus(complaint.status) ? [{ status, time: Date.now() }] : [])] })
    onClose()
  }
  return <div className="modal-backdrop" onClick={onClose}><div className="modal coordinator-modal" onClick={(event) => event.stopPropagation()}><div className="modal-header"><div><p className="eyebrow">Coordinator review</p><h2>{complaint.title}</h2><small>{complaint.id}</small></div><button className="close-button" onClick={onClose}><X size={19} /></button></div><div className="coordinator-detail-grid"><div><span>Student</span><strong>{complaint.name || 'Ananya Pandey'}</strong></div><div><span>Category</span><strong>{complaint.category}</strong></div><div><span>Priority</span><strong>{complaint.urgency}</strong></div><div><span>Location</span><strong>{complaint.location}</strong></div></div><div className="description-block"><span>Description</span><p>{complaint.description || 'No description was provided for this complaint.'}</p></div><AIAnalysisPanel analysis={complaint.aiAnalysis || mockAIAnalysis(complaint)} /><label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}>{complaintStatuses.map((option) => <option key={option}>{option}</option>)}</select></label><label>Assigned Department<select value={department} onChange={(event) => setDepartment(event.target.value)}>{['Facilities', 'Hostel Office', 'Mess Committee', 'IT Support', 'Student Affairs'].map((option) => <option key={option}>{option}</option>)}</select></label><div className="modal-actions"><button className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" onClick={saveChanges}>Update status <ChevronRight size={16} /></button></div></div></div>
}

function ComplaintsPage({ complaints, query, setQuery, filter, setFilter, selectedComplaintId, setSelectedComplaintId, onStatusChange }) {
  const visibleComplaints = complaints.filter((complaint) => `${complaint.title} ${complaint.category} ${complaint.id}`.toLowerCase().includes(query.toLowerCase()) && (filter === 'All complaints' || (filter === 'In review' && normalizeStatus(complaint.status) === 'Under Review') || complaint.status === filter))
  const selectedComplaint = complaints.find((complaint) => complaint.id === selectedComplaintId)
  if (selectedComplaint) return <ComplaintDetail complaint={selectedComplaint} onBack={() => setSelectedComplaintId(null)} onStatusChange={onStatusChange} />
  return <><PageIntro eyebrow="Your activity" title="My complaints" description="Every issue you have raised, in one place." /><div className="full-page-toolbar"><div className="filter-row">{['All complaints', 'Submitted', 'In review', 'Assigned', 'Resolved'].map((option) => <button key={option} className={filter === option ? 'selected' : ''} onClick={() => setFilter(option)}>{option}</button>)} </div><div className="page-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your complaints" /></div></div><div className="complaint-page-list"><div className="list-summary"><strong>{visibleComplaints.length} complaints</strong><span>Sorted by most recent</span></div>{visibleComplaints.map((complaint) => <ComplaintRow key={complaint.id} complaint={complaint} onSelect={() => setSelectedComplaintId(complaint.id)} />)}{!visibleComplaints.length && <div className="empty-state"><Search size={22} /><strong>No complaints found</strong><span>Try another keyword or filter.</span></div>}</div></>
}

function ComplaintDetail({ complaint, onBack, onStatusChange }) {
  const history = statusHistoryFor(complaint)
  return <><button className="back-button" onClick={onBack}><ChevronRight size={16} className="back-chevron" /> Back to my complaints</button><section className="detail-header"><div><p className="eyebrow">Complaint detail</p><h1>{complaint.title}</h1><p className="detail-id">{complaint.id} · {complaint.category} · {complaint.location}</p></div><span className={`urgency ${complaint.urgency.toLowerCase()}`}>{complaint.urgency}</span></section><div className="detail-layout"><section className="timeline-card"><div className="detail-card-heading"><div><h2>Status timeline</h2><p>See what happened to your complaint.</p></div><span className={`status-pill ${normalizeStatus(complaint.status).toLowerCase().replace(' ', '-')}`}>{normalizeStatus(complaint.status)}</span></div><div className="status-timeline">{complaintStatuses.map((status, index) => { const event = history.find((item) => item.status === status); const isCurrent = normalizeStatus(complaint.status) === status; return <div className={`timeline-item ${status.toLowerCase().replace(' ', '-')} ${event ? 'complete' : ''} ${isCurrent ? 'current' : ''}`} key={status}><div className="timeline-marker">{event ? '✓' : index + 1}</div><div className="timeline-content"><strong>{status}</strong>{event ? <><span>{event.detail || 'Status updated'}</span><small>{formatDateTime(event.time)}</small></> : <span>Pending</span>}</div></div> })}</div></section><AIAnalysisPanel analysis={complaint.aiAnalysis || mockAIAnalysis(complaint)} /><aside className="coordinator-card"><div className="detail-card-heading"><div><p className="eyebrow">Coordinator panel</p><h2>Update status</h2></div><Settings size={18} /></div><p>Move this complaint through the workflow as work progresses.</p><label>New status<select value={normalizeStatus(complaint.status)} onChange={(event) => onStatusChange(event.target.value)}>{complaintStatuses.map((status) => <option key={status}>{status}</option>)}</select></label><div className="workflow-actions"><span>Review complaint</span><span>Under Review</span><span>Assign department</span><span>Assigned</span><span>Start work</span><span>In Progress</span><span>Complete work</span><span>Resolved</span><span>Student confirms</span><span>Closed</span></div></aside></div></>
}

function formatDateTime(timestamp) {
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(timestamp))
}

function AIAnalysisPanel({ analysis }) {
  if (analysis.status === 'analyzing') return <section className="ai-analysis-card ai-loading"><div className="ai-analysis-title"><Sparkles size={18} /><h2>AI is analyzing your complaint...</h2></div><p>Analyzing category...</p><p>Determining priority...</p><p>Finding responsible department...</p><p>Checking similar complaints...</p></section>
  return <section className="ai-analysis-card"><div className="ai-analysis-title"><Sparkles size={18} /><h2>AI Complaint Analysis</h2><span>Analysis completed</span></div><div className="ai-result-row"><span>Category</span><strong>🏢 {analysis.category}</strong></div><div className="ai-result-row"><span>Department</span><strong>🔧 {analysis.department}</strong></div><div className="ai-result-row"><span>Priority</span><strong className={`ai-priority ${analysis.priority.toLowerCase()}`}>● {analysis.priority}</strong></div><div className="ai-confidence"><div><span>AI Confidence</span><strong>{analysis.confidence}%</strong></div><div className="confidence-track"><i style={{ width: `${analysis.confidence}%` }} /></div></div><div className="ai-similar"><span>Similar complaints</span><strong>{analysis.similarComplaints} similar complaints found</strong></div></section>
}

function MessageDetailPage({ message, onBack, onReply }) {
  return <>
    <button className="back-button" onClick={onBack}><ChevronRight size={16} className="back-chevron" /> Back to messages</button>
    <section className="message-detail-page">
      <div className="message-detail-header">
        <div>
          <p className="eyebrow">Message details</p>
          <h1>{message.subject}</h1>
        </div>
        <span className="detail-time">{message.createdAt ? formatRelativeTime(message.createdAt) : message.time}</span>
      </div>

      <div className="message-detail-meta">
        <div className="message-detail-sender">
          <div className="message-avatar large"><MessageSquare size={18} /></div>
          <div>
            <strong>{message.sender}</strong>
            <span>CampusBridge support desk</span>
          </div>
        </div>
        <div className="message-detail-tags">
          {message.important && <span className="message-tag">IMPORTANT</span>}
          <span className="message-tag secondary">{message.sender.toUpperCase()}</span>
          {message.unread && <span className="message-tag alert">UNREAD</span>}
        </div>
      </div>

      <div className="message-detail-block large">
        <p><strong>Area affected:</strong> Block C hostel wing</p>
        <p><strong>Issue:</strong> Power backup outage and inverter disruption.</p>
        <p><strong>Action taken:</strong> Technical team inspected the backup system, restored inverter power, and tested corridor lighting and charging points.</p>
        <p><strong>Reference:</strong> Hostel Support Case #HB-2048 / Facility inspection report submitted.</p>
      </div>

      <div className="message-detail-body">
        <p>{message.body}</p>
        <p>Students in the affected wing were advised to keep emergency lights on, avoid overloading extension points, and report any room-level issue to the hostel desk before 8:00 PM. The support team will continue monitoring the system until the next maintenance check.</p>
      </div>

      <div className="message-next-step">
        <strong>Next step</strong>
        <span>{message.nextStep || 'Review this update and reply if you need further assistance.'}</span>
      </div>

      <div className="message-detail-actions">
        <button className="secondary-button" type="button">Mark as read</button>
        <button className="primary-button" onClick={onReply}>Reply to this message <ChevronRight size={16} /></button>
      </div>
    </section>
  </>
}

function MessagesPage({ messages: supportMessages, onReply }) {
  const [openMessage, setOpenMessage] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('All')
  const defaultMessages = [
    {
      sender: 'Hostel office',
      subject: 'Power backup restored in Block C',
      body: 'The electrical team has restored backup power in Block C after the inverter issue. Students can now use fans, charging points, and corridor lights normally. Please report any remaining outage to the hostel desk immediately.',
      time: '12 min ago',
      unread: true,
      important: true,
      nextStep: 'If any room still has no power, submit a quick complaint with your room number and floor.'
    },
    {
      sender: 'Student affairs',
      subject: 'Mess survey is now live',
      body: 'Your feedback will help us improve meal quality, hygiene, and variety across the week. The survey is open till Friday and takes less than three minutes to complete.',
      time: 'Yesterday',
      unread: true,
      important: true,
      nextStep: 'Share your suggestions on canteen timing, food quality, and vegetarian options.'
    },
    {
      sender: 'Hostel office',
      subject: 'Late entry request approved',
      body: 'Your request for late entry during examination week has been approved with the condition that you sign the register before 10:30 PM.',
      time: '16 Aug',
      unread: false,
      important: false,
      nextStep: 'Carry your student ID and report to the security desk when you return.'
    },
    {
      sender: 'Academic office',
      subject: 'Exam form submission reminder',
      body: 'Semester-end form submission closes on Sunday, 11:59 PM. Students must verify their subject selection and payment status before the deadline.',
      time: '18 Aug',
      unread: false,
      important: false,
      nextStep: 'Visit the academic portal and check your application status before the deadline ends.'
    }
  ]
  const messages = [...supportMessages, ...defaultMessages]
  const filteredMessages = messages.filter((message) => {
    const matchesSearch = `${message.sender} ${message.subject} ${message.body}`.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filter === 'All' || (filter === 'Unread' && message.unread) || (filter === 'Important' && message.important)
    return matchesSearch && matchesFilter
  })
  const selectedMessage = openMessage === null ? null : filteredMessages[openMessage] || messages[openMessage] || null
  const summary = {
    total: messages.length,
    unread: messages.filter((message) => message.unread).length,
    important: messages.filter((message) => message.important).length,
  }

  if (selectedMessage) return <MessageDetailPage message={selectedMessage} onBack={() => setOpenMessage(null)} onReply={onReply} />

  return <><PageIntro eyebrow="Stay connected" title="Messages" description="Updates and replies from campus teams." /><div className="message-toolbar"><div className="message-search"><Search size={15} /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search messages..." /></div><button className="message-filter-button">All <ChevronDown size={14} /></button><button className="message-filter-button subtle">Filters</button></div><div className="message-summary"><span>{summary.total} Messages</span><span>{summary.unread} Unread</span><span>{summary.important} Important</span></div><div className="message-list">{filteredMessages.map((message, index) => <article className={`message-card ${message.unread ? 'unread' : ''} ${openMessage === index ? 'message-open' : ''}`} key={`${message.subject}-${index}`} role="button" tabIndex="0" aria-expanded={openMessage === index} onClick={() => setOpenMessage(index)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setOpenMessage(index) } }}><div className="message-avatar"><MessageSquare size={17} /></div><div className="message-copy"><div className="message-top"><strong>{message.sender}</strong><span>{message.createdAt ? formatRelativeTime(message.createdAt) : message.time}</span></div><h3>{message.subject}</h3><p>{message.body}</p><div className="message-tags">{message.important && <span className="message-tag">IMPORTANT</span>}<span className="message-tag secondary">{message.sender.toUpperCase()}</span></div><div className="message-action-row"><span className="message-action">Open message <ChevronRight size={13} /></span><button className="message-more" type="button" aria-label="More options">•••</button></div></div>{message.unread && <i className="unread-dot" />}</article>)}</div></>
}

function EmailSettingsPage({ onBack }) {
  return <>
    <button className="back-button" onClick={onBack}><ChevronRight size={16} className="back-chevron" /> Back to settings</button>
    <section className="settings-detail-page">
      <div className="settings-detail-header">
        <div>
          <p className="eyebrow">Communication settings</p>
          <h1>Email notifications</h1>
        </div>
      </div>

      <div className="settings-detail-card">
        <div className="settings-detail-row">
          <span>Primary email</span>
          <strong>ananya.pandey@campusbridge.edu</strong>
        </div>
        <div className="settings-detail-row">
          <span>Delivery status</span>
          <strong className="status-good">Enabled</strong>
        </div>
      </div>

      <div className="settings-option-list">
        <label className="setting-row detail-setting-row">
          <span>
            <strong>Complaint status updates</strong>
            <small>Get notified when a complaint is submitted, reassigned, reviewed, or resolved.</small>
          </span>
          <input type="checkbox" defaultChecked />
        </label>
        <label className="setting-row detail-setting-row">
          <span>
            <strong>Weekly summary emails</strong>
            <small>Receive a concise summary of campus notices, guidelines, and important announcements.</small>
          </span>
          <input type="checkbox" defaultChecked />
        </label>
        <label className="setting-row detail-setting-row">
          <span>
            <strong>Urgent alerts</strong>
            <small>Receive immediate emails for hostel, safety, or emergency issues that need quick action.</small>
          </span>
          <input type="checkbox" defaultChecked />
        </label>
        <label className="setting-row detail-setting-row">
          <span>
            <strong>Admin response tracking</strong>
            <small>Receive email reminders when the support team replies to your complaint or request.</small>
          </span>
          <input type="checkbox" defaultChecked />
        </label>
      </div>

      <div className="settings-actions compact-actions">
        <button type="button" className="secondary-button">Manage email address</button>
        <button type="button" className="primary-button">Save changes <ChevronRight size={16} /></button>
      </div>
    </section>
  </>
}

function SettingsPage() {
  const [selectedSetting, setSelectedSetting] = useState(null)
  const sections = [
    {
      title: 'Notifications',
      items: [
        { label: 'Email notifications', description: 'Receive updates when a complaint changes status, is reassigned, or needs a response.', checked: true, detail: 'email' },
        { label: 'Weekly campus digest', description: 'Get a summary of important announcements, mess updates, maintenance schedules, and events.', checked: true },
        { label: 'Complaint acknowledgment', description: 'Receive confirmation when your complaint is submitted and when the issue is reviewed.', checked: true },
        { label: 'Academic deadline alerts', description: 'Remind me about form submissions, fee notices, and schedule changes from the college office.', checked: true },
      ]
    },
    {
      title: 'Dashboard preferences',
      items: [
        { label: 'Compact complaint list', description: 'Show more complaints on each screen and keep the dashboard easier to scan.', checked: false },
        { label: 'Auto-refresh updates', description: 'Refresh complaint status and support messages automatically every few minutes.', checked: true },
        { label: 'Highlight urgent alerts', description: 'Keep urgent hostel, mess, and safety updates pinned at the top of your dashboard.', checked: true },
      ]
    },
    {
      title: 'Privacy & access',
      items: [
        { label: 'Private profile visibility', description: 'Hide your personal profile card from public campus dashboards and support screens.', checked: false },
        { label: 'Two-step verification', description: 'Require a one-time code when signing in from a new device or browser.', checked: true },
        { label: 'Download my data', description: 'Export your complaint history, notifications, and account activity in one file.', checked: false },
      ]
    }
  ]

  if (selectedSetting === 'email') return <EmailSettingsPage onBack={() => setSelectedSetting(null)} />

  return <>
    <PageIntro eyebrow="Personalize your experience" title="Settings" description="Manage your CampusBridge preferences." />
    <div className="settings-page-wrap">
      {sections.map((section) => (
        <section className="settings-section" key={section.title}>
          <h2>{section.title}</h2>
          <div className="settings-list">
            {section.items.map(({ label, description, checked, detail }) => (
              <button type="button" className="setting-row" key={label} onClick={() => { if (detail === 'email') setSelectedSetting('email') }}>
                <span>
                  <strong>{label}</strong>
                  <small>{description}</small>
                </span>
                <input type="checkbox" defaultChecked={checked} onClick={(event) => event.stopPropagation()} readOnly />
              </button>
            ))}
          </div>
        </section>
      ))}
      <div className="settings-actions">
        <button type="button" className="secondary-button">Reset to defaults</button>
        <button type="button" className="primary-button">Save preferences <ChevronRight size={16} /></button>
      </div>
    </div>
  </>
}

function GuidePage({ onContact }) {
  const guideItems = [
    { icon: Building2, title: 'Hostel & room issues', text: 'Report water supply problems, electricity faults, room cleaning issues, late-entry approvals, and room change requests.', meta: 'Hostel office · 9:00 AM to 5:00 PM' },
    { icon: Home, title: 'Campus amenities', text: 'Check laundry, washroom maintenance, common room access, seminar hall bookings, and classroom facility updates.', meta: 'Main campus · Open daily' },
    { icon: BookOpen, title: 'Academic office', text: 'Get help with attendance questions, internal marks, exam form status, supply notices, and admission documentation.', meta: 'Academic block · Room 204' },
    { icon: ShieldCheck, title: 'Safety & counseling', text: 'Reach out for emergency support, student counseling, harassment reporting, first aid, and safe transport support.', meta: '24/7 support desk' },
    { icon: Search, title: 'Library services', text: 'Check study room availability, book issue returns, digital resource access, printing services, and library timings.', meta: 'Central library · 8:00 AM to 8:00 PM' },
    { icon: Users, title: 'Student services', text: 'Get help with scholarships, transfer certificates, ID cards, fee verification, results queries, and admin forms.', meta: 'Administrative block · Help desk' },
    { icon: MessageSquare, title: 'Mess & food', text: 'Share feedback about menu quality, hygiene, mess timings, canteen cleanliness, and special diet requests.', meta: 'Student cafeteria · 7:30 AM to 10:30 PM' },
    { icon: CircleHelp, title: 'Transport & access', text: 'Find bus routes, shuttle timings, late entry permission, gate entry rules, vehicle passes, and parking guidance.', meta: 'Transport desk · Mon-Sat' }
  ]
  return <><PageIntro eyebrow="Campus support" title="Campus guide" description="The help and service points students use most often." /><div className="guide-grid">{guideItems.map(({ icon: Icon, title, text, meta }) => <article className="guide-card" key={title} role="button" tabIndex="0" onClick={onContact} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onContact() } }}><div className="guide-icon"><Icon size={21} /></div><h3>{title}</h3><p>{text}</p><small>{meta}</small><button type="button" onClick={(event) => { event.stopPropagation(); onContact() }}>Explore guide <ChevronRight size={15} /></button></article>)}</div><section className="guide-contact"><div className="sparkle-icon"><CircleHelp size={20} /></div><div><strong>Need something else?</strong><p>Use the support desk for hostel, fee, transport, academic, or general campus assistance.</p></div><button className="primary-button" onClick={onContact}>Contact support <ChevronRight size={16} /></button></section></>
}

function SupportModal({ onClose, onSent }) {
  const [sent, setSent] = useState(false)
  function handleSubmit(event) { event.preventDefault(); const formData = new FormData(event.currentTarget); onSent({ sender: 'Student support', subject: formData.get('subject'), body: formData.get('message'), createdAt: Date.now(), unread: true }); setSent(true) }
  return <div className="modal-backdrop" onClick={onClose}><form className="modal" onSubmit={handleSubmit} onClick={(event) => event.stopPropagation()}>{sent ? <div className="support-success"><div className="sparkle-icon"><ShieldCheck size={20} /></div><p className="eyebrow">Message sent</p><h2>Support is on the way</h2><p>Your request has been shared with the campus support desk and the team will follow up through Messages.</p><button type="button" className="primary-button" onClick={onClose}>Done</button></div> : <><div className="modal-header"><div><p className="eyebrow">Student support</p><h2>How can we help?</h2></div><button type="button" className="close-button" onClick={onClose}><X size={19} /></button></div><label>Subject<input name="subject" required placeholder="Hostel issue, fee query, transport, exam support..." /></label><label>Message<textarea name="message" required placeholder="Tell us the issue, location, and what you need help with..." /></label><div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button type="submit" className="primary-button">Send message <ChevronRight size={16} /></button></div></>}</form></div>
}

export default App
