import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', role: 'employee' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      if (res.data.user.role !== form.role) {
        setError(`Access denied: You do not have ${form.role} privileges.`);
        setLoading(false);
        return;
      }
      login(res.data.user, res.data.token);
      navigate(res.data.user.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-split-image">
        <div className="auth-split-text">
          <div className="badge">Welcome back</div>
          <h1>Simplify Your Time Off.</h1>
          <p>Log in to seamlessly request, track, and manage your leave balances across the entire organization.</p>
        </div>
      </div>
      <div className="auth-split-form">
        <div className="auth-card">
        <div className="auth-logo">🏢</div>
        <h1 className="auth-title">Leave Management</h1>
        <p className="auth-subtitle">Sign in to your account</p>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email" placeholder="you@company.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password" placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Login As</label>
            <select
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}
            >
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit" className="btn-primary btn-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Register</Link>
        </p>

        <div className="auth-hint">
          <strong>Demo credentials:</strong><br />
          Admin: admin@company.com / admin123
          </div>
        </div>
      </div>
    </div>
  );
}
