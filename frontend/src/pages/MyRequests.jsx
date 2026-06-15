import { useState, useEffect } from 'react';
import api from '../api/axios';
import StatusBadge from '../components/StatusBadge';

export default function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/leave/my-requests');
      setRequests(res.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this leave request?')) return;
    try {
      await api.put(`/leave/cancel/${id}`);
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.detail || 'Cannot cancel this request');
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>My Leave Requests</h1>
        <p className="page-subtitle">Track all your submitted requests</p>
      </div>

      {requests.length === 0 ? (
        <div className="empty-state">
          No requests yet. <a href="/employee/apply">Apply for leave →</a>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Leave Type</th>
                <th>From</th>
                <th>To</th>
                <th>Days</th>
                <th>Applied On</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(r => (
                <tr key={r.id}>
                  <td><strong>{r.leave_type}</strong></td>
                  <td>{r.start_date}</td>
                  <td>{r.end_date}</td>
                  <td><strong>{r.total_days}</strong></td>
                  <td>{r.applied_on}</td>
                  <td>
                    <StatusBadge status={r.status} />
                    {r.admin_comment && (
                      <div className="admin-comment">💬 {r.admin_comment}</div>
                    )}
                  </td>
                  <td>
                    {r.status === 'pending' && (
                      <button className="btn-danger-sm" onClick={() => handleCancel(r.id)}>
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
