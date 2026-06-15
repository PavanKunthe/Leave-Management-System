import { useState, useEffect } from 'react';
import api from '../api/axios';

const DEPARTMENTS = ['Engineering', 'HR', 'Finance', 'Marketing', 'Sales', 'Operations', 'General'];

export default function Register() {
  const navigate = (path) => { window.location.href = path; };
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '', department: 'Engineering', role: 'employee'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!/^[A-Za-z\s]{2,50}$/.test(form.name)) {
      setError('Name must be 2-50 characters and contain only letters and spaces');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    if (!/(?=.*[A-Za-z])(?=.*\d)/.test(form.password)) {
      setError('Password must contain at least one letter and one number');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      window.location.href = '/login';
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-split-image">
        <div className="auth-split-text">
          <div className="badge">Join Us Today</div>
          <h1>Empower Your Work Life.</h1>
          <p>Create an account to track your holidays, manage sickness, and easily stay coordinated with your team.</p>
        </div>
      </div>
      <div className="auth-split-form">
        <div className="auth-card" style={{ maxWidth: '600px' }}>
        <div className="auth-logo">🏢</div>
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Join the leave management system</p>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" placeholder="Your Name"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} 
              minLength={2} maxLength={50} pattern="^[A-Za-z\s]+$" title="Only letters and spaces allowed" required />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" placeholder="you@company.com"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} 
              pattern="[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$" title="Enter a valid email" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="Min 8 chars, 1 letter, 1 number"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              minLength={8} required />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input type="password" placeholder="Confirm your password"
              value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
              minLength={8} required />
          </div>
          <div className="form-group">
            <label>Department</label>
            <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>
              {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <button type="submit" className="btn-primary btn-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <p className="auth-footer">
          Already have an account? <a href="/login">Sign in</a>
        </p>
      </div>
      </div>
    </div>
  );
}
