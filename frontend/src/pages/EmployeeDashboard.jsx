import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [balance, setBalance] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [balRes, reqRes] = await Promise.all([
          api.get('/leave/balance'),
          api.get('/leave/my-requests'),
        ]);
        setBalance(balRes.data);
        setRecent(reqRes.data.slice(0, 3));
      } catch {}
      setLoading(false);
    };
    fetchData();
  }, []);

  const statusColor = {
    pending: '#f59e0b', approved: '#10b981',
    rejected: '#ef4444', cancelled: '#6b7280'
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Welcome back, {user?.name}! 👋</h1>
        <p className="page-subtitle">Here's your leave summary</p>
      </div>

      <div className="cards-grid">
        {balance.map(b => (
          <div className="balance-card" key={b.id}>
            <div className="balance-title">{b.leave_type}</div>
            <div className="balance-numbers">
              <span className="balance-remaining">{b.remaining}</span>
              <span className="balance-total"> / {b.max_days} days</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${Math.round((b.used_days / b.max_days) * 100)}%` }}
              />
            </div>
            <div className="balance-used">{b.used_days} used · {b.remaining} remaining</div>
          </div>
        ))}
      </div>

      <div className="section">
        <h2 className="section-title">Recent Requests</h2>
        {recent.length === 0 ? (
          <div className="empty-state">
            No leave requests yet. <a href="/employee/apply">Apply now →</a>
          </div>
        ) : (
          <div className="request-list">
            {recent.map(r => (
              <div className="request-row" key={r.id}>
                <div>
                  <strong>{r.leave_type}</strong>
                  <div className="request-dates">{r.start_date} → {r.end_date} ({r.total_days} days)</div>
                  {r.reason && <div className="request-reason">{r.reason}</div>}
                </div>
                <span className="status-badge" style={{
                  background: statusColor[r.status] + '20',
                  color: statusColor[r.status],
                  border: `1px solid ${statusColor[r.status]}`
                }}>
                  {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
