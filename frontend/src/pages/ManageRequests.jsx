import { useState, useEffect } from 'react';
import api from '../api/axios';
import StatusBadge from '../components/StatusBadge';

export default function ManageRequests() {
  const [pending, setPending] = useState([]);
  const [allReqs, setAllReqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('pending');
  const [rejectModal, setRejectModal] = useState(null);
  const [comment, setComment] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pendRes, allRes] = await Promise.all([
        api.get('/admin/requests'),
        api.get('/admin/all-requests'),
      ]);
      setPending(pendRes.data);
      setAllReqs(allRes.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this leave request?')) return;
    try {
      await api.put(`/admin/approve/${id}`);
      fetchData();
    } catch (err) { alert(err.response?.data?.detail); }
  };

  const handleReject = async () => {
    if (!comment.trim()) return alert('Please enter a rejection reason');
    try {
      await api.put(`/admin/reject/${rejectModal}`, { comment });
      setRejectModal(null);
      setComment('');
      fetchData();
    } catch (err) { alert(err.response?.data?.detail); }
  };

  const displayed = view === 'pending' ? pending : allReqs;

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Leave Requests</h1>
        <div className="view-toggle">
          <button
            className={view === 'pending' ? 'toggle-btn active' : 'toggle-btn'}
            onClick={() => setView('pending')}
          >
            Pending ({pending.length})
          </button>
          <button
            className={view === 'all' ? 'toggle-btn active' : 'toggle-btn'}
            onClick={() => setView('all')}
          >
            All Requests
          </button>
        </div>
      </div>

      {displayed.length === 0 ? (
        <div className="empty-state">No {view === 'pending' ? 'pending' : ''} requests ✅</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Leave Type</th>
                <th>From</th>
                <th>To</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
                {view === 'pending' && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {displayed.map(r => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.employee_name}</strong>
                    <div className="sub-text">{r.employee_email}</div>
                  </td>
                  <td>{r.department}</td>
                  <td>{r.leave_type}</td>
                  <td>{r.start_date}</td>
                  <td>{r.end_date}</td>
                  <td><strong>{r.total_days}</strong></td>
                  <td><span className="reason-text">{r.reason}</span></td>
                  <td>
                    <StatusBadge status={r.status || 'pending'} />
                    {r.admin_comment && (
                      <div className="admin-comment">💬 {r.admin_comment}</div>
                    )}
                  </td>
                  {view === 'pending' && (
                    <td>
                      <div className="action-btns">
                        <button className="btn-approve" onClick={() => handleApprove(r.id)}>
                          ✅ Approve
                        </button>
                        <button className="btn-reject-sm" onClick={() => { setRejectModal(r.id); setComment(''); }}>
                          ❌ Reject
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="modal-overlay" onClick={() => setRejectModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Reject Leave Request</h3>
            <p>Please provide a reason for rejection:</p>
            <textarea
              rows={4} placeholder="Enter rejection reason..."
              value={comment} onChange={e => setComment(e.target.value)}
            />
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setRejectModal(null)}>Cancel</button>
              <button className="btn-danger" onClick={handleReject}>Confirm Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
