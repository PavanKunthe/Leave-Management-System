import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function ApplyLeave() {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [balance, setBalance] = useState([]);
  const [form, setForm] = useState({ leave_type_id: '', start_date: '', end_date: '', reason: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const [typesRes, balRes] = await Promise.all([
        api.get('/leave/types'),
        api.get('/leave/balance'),
      ]);
      setLeaveTypes(typesRes.data);
      setBalance(balRes.data);
      if (typesRes.data.length > 0)
        setForm(f => ({ ...f, leave_type_id: typesRes.data[0].id }));
    };
    fetchData();
  }, []);

  const selectedBalance = balance.find(
    b => b.leave_type === leaveTypes.find(t => t.id == form.leave_type_id)?.name
  );

  const totalDays = form.start_date && form.end_date
    ? Math.max(0, Math.floor((new Date(form.end_date) - new Date(form.start_date)) / 86400000) + 1)
    : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (totalDays <= 0) {
      setMessage({ type: 'error', text: 'End date must be on or after the start date' });
      return;
    }
    if (selectedBalance && totalDays > selectedBalance.remaining) {
      setMessage({ type: 'error', text: `Insufficient balance! You only have ${selectedBalance.remaining} days left.` });
      return;
    }
    if (form.reason.trim().length < 10) {
      setMessage({ type: 'error', text: 'Reason must be at least 10 characters long' });
      return;
    }
    setLoading(true);
    try {
      await api.post('/leave/apply', {
        ...form,
        leave_type_id: parseInt(form.leave_type_id),
      });
      setMessage({ type: 'success', text: '✅ Leave request submitted successfully!' });
      setForm(f => ({ ...f, start_date: '', end_date: '', reason: '' }));
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to submit request' });
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="page">
      <div className="page-header">
        <h1>Apply for Leave</h1>
        <p className="page-subtitle">Submit a new leave request</p>
      </div>

      <div className="form-card">
        {message && (
          <div className={message.type === 'success' ? 'alert-success' : 'alert-error'}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Leave Type</label>
            <select
              value={form.leave_type_id}
              onChange={e => setForm({ ...form, leave_type_id: e.target.value })}
              required
            >
              {leaveTypes.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            {selectedBalance && (
              <div className="balance-hint">
                ✅ Available: <strong>{selectedBalance.remaining} days</strong>
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Start Date</label>
              <input type="date" min={today} value={form.start_date}
                onChange={e => setForm({ ...form, start_date: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input type="date" min={form.start_date || today} value={form.end_date}
                onChange={e => setForm({ ...form, end_date: e.target.value })} required />
            </div>
          </div>

          {totalDays > 0 && (
            <div className="days-preview">
              📅 Total: <strong>{totalDays} day{totalDays > 1 ? 's' : ''}</strong>
            </div>
          )}

          <div className="form-group">
            <label>Reason</label>
            <textarea
              placeholder="Briefly describe your reason (min 10 characters)..."
              rows={4}
              minLength={10}
              maxLength={200}
              value={form.reason}
              onChange={e => setForm({ ...form, reason: e.target.value })}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Leave Request'}
          </button>
        </form>
      </div>
    </div>
  );
}
