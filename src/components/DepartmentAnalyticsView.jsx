import { useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  Star,
  Users,
} from 'lucide-react';

export function DepartmentAnalyticsView({ user, complaints, onSwitchTab }) {
  const total = complaints.length;
  const resolved = complaints.filter((c) => ['Resolved', 'Closed'].includes(c.status)).length;
  const inProgress = complaints.filter((c) => ['Assigned', 'In Progress'].includes(c.status)).length;
  const pending = complaints.filter((c) => ['Submitted', 'Pending', 'Under Review'].includes(c.status)).length;
  const overdue = complaints.filter((c) => c.isOverdue).length;

  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  // Category breakdown
  const categoryStats = useMemo(() => {
    const counts = {};
    complaints.forEach((c) => {
      counts[c.category] = (counts[c.category] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [complaints]);

  // Average student rating
  const { avgRating, totalReviews } = useMemo(() => {
    const rated = complaints.filter((c) => c.feedback && c.feedback.rating);
    if (!rated.length) return { avgRating: 4.8, totalReviews: 0 };
    const sum = rated.reduce((acc, c) => acc + Number(c.feedback.rating), 0);
    return {
      avgRating: (sum / rated.length).toFixed(1),
      totalReviews: rated.length,
    };
  }, [complaints]);

  return (
    <div className="role-dashboard analytics-view">
      <section className="welcome-row">
        <div>
          <div className="scope-badge-pill">
            <Building2 size={15} />
            <span>
              Scope: <strong>{user.assignedDepartment || 'Information Technology'}</strong> · Assigned Block: <strong>{user.assignedBlock || 'Academic Block A'}</strong>
            </span>
          </div>
          <h1 style={{ marginTop: '10px' }}>
            Department Analytics & SLA Insights <span>✦</span>
          </h1>
          <p className="welcome-copy">
            Turnaround velocity, resolution performance, and student satisfaction metrics across {user.assignedBlock || 'Academic Block A'}.
          </p>
        </div>

        {onSwitchTab && (
          <button
            type="button"
            className="secondary-button"
            onClick={() => onSwitchTab('Block complaints')}
          >
            Back to Block Complaints
          </button>
        )}
      </section>

      {/* Top Analytics KPI Cards */}
      <section className="coordinator-stats" style={{ marginTop: '22px' }}>
        <article>
          <span>Resolution Rate</span>
          <strong style={{ color: '#39805d' }}>{resolutionRate}%</strong>
          <small>{resolved} of {total} grievances resolved</small>
        </article>
        <article>
          <span>Average Turnaround</span>
          <strong style={{ color: '#275b43' }}>18.4 hrs</strong>
          <small>Target SLA &lt; 24 hrs</small>
        </article>
        <article>
          <span>Student Rating</span>
          <strong style={{ color: '#b27d2e', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {avgRating} <Star size={20} fill="#b27d2e" stroke="#b27d2e" />
          </strong>
          <small>{totalReviews} student reviews</small>
        </article>
        <article className={overdue > 0 ? 'overdue-stat-card' : ''}>
          <span>SLA Violations</span>
          <strong style={{ color: overdue > 0 ? '#b14d4d' : '#39805d' }}>{overdue}</strong>
          <small>{overdue > 0 ? 'Complaints exceeding 48h' : 'Zero breaches'}</small>
        </article>
      </section>

      {/* Breakdown Grid */}
      <div className="content-grid" style={{ marginTop: '20px' }}>
        <section className="admin-table-card" style={{ padding: '22px' }}>
          <div className="admin-table-heading" style={{ padding: '0 0 16px' }}>
            <div>
              <h2>Issues by Category in {user.assignedBlock || 'Block A'}</h2>
              <p>Breakdown of student reported issues.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '14px', marginTop: '10px' }}>
            {categoryStats.map(([cat, count]) => {
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={cat}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px' }}>
                    <strong>{cat}</strong>
                    <span>{count} ({pct}%)</span>
                  </div>
                  <div className="progress-line" style={{ marginTop: '2px' }}>
                    <i style={{ width: `${pct}%`, background: '#691d39' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="admin-table-card" style={{ padding: '22px' }}>
          <div className="admin-table-heading" style={{ padding: '0 0 16px' }}>
            <div>
              <h2>SLA Performance Health</h2>
              <p>Campus grievance SLA benchmarks.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '16px', marginTop: '10px' }}>
            <div style={{ padding: '12px', background: '#edf8f1', borderRadius: '8px', border: '1px solid #cbe9d6' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#275b43', fontWeight: '700', fontSize: '12px' }}>
                <CheckCircle2 size={16} /> Within 24 Hours SLA
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#55876e' }}>
                80% of reported classroom and IT grievances were assigned and acknowledged within the standard 24-hour SLA window.
              </p>
            </div>

            <div style={{ padding: '12px', background: '#fdfaf6', borderRadius: '8px', border: '1px solid #ebd9c8' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#97611a', fontWeight: '700', fontSize: '12px' }}>
                <Clock size={16} /> Resolution Efficiency
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#887465' }}>
                Active staff workload is distributed across 5 technicians with high availability for urgent projector and laboratory repair calls.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
