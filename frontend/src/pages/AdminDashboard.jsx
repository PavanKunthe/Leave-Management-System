import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/admin/dashboard').then(res => setData(res.data)).catch(() => {});
  }, []);

  if (!data) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p className="page-subtitle">Company-wide leave overview</p>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-pending" onClick={() => navigate('/admin/requests')} style={{cursor: 'pointer'}}>
          <div className="stat-icon">⏳</div>
          <div className="stat-number">{data.pending}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card stat-approved" onClick={() => navigate('/admin/requests')} style={{cursor: 'pointer'}}>
          <div className="stat-icon">✅</div>
          <div className="stat-number">{data.approved}</div>
          <div className="stat-label">Approved</div>
        </div>
        <div className="stat-card stat-rejected" onClick={() => navigate('/admin/requests')} style={{cursor: 'pointer'}}>
          <div className="stat-icon">❌</div>
          <div className="stat-number">{data.rejected}</div>
          <div className="stat-label">Rejected</div>
        </div>
        <div className="stat-card stat-total" onClick={() => navigate('/admin/employees')} style={{cursor: 'pointer'}}>
          <div className="stat-icon">👥</div>
          <div className="stat-number">{data.total_employees}</div>
          <div className="stat-label">Employees</div>
        </div>
      </div>

      {/* On Leave Today */}
      <div className="section">
        <h2 className="section-title">
          🟢 On Leave Today
          <span className="count-badge">{data.on_leave_count}</span>
        </h2>
        {data.on_leave_today.length === 0 ? (
          <div className="empty-state">Everyone is in office today! 🎉</div>
        ) : (
          <div className="on-leave-grid">
            {data.on_leave_today.map((emp, i) => (
              <div className="on-leave-card" key={i}>
                <div className="emp-avatar">{emp.name.charAt(0).toUpperCase()}</div>
                <div>
                  <div className="emp-name">{emp.name}</div>
                  <div className="emp-dept">{emp.department}</div>
                  <div className="emp-leave-type">{emp.leave_type}</div>
                  <div className="emp-until">Returns: {emp.end_date}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
