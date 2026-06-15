import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function ManageEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/employees').then(res => {
      setEmployees(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleDrop = async (id, name) => {
    if (!window.confirm(`Are you sure you want to completely remove ${name}? This will delete all their leave history and data. This action cannot be undone.`)) return;
    try {
      await api.delete(`/admin/employees/${id}`);
      setEmployees(employees.filter(e => e.id !== id));
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to remove employee');
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Employee Directory</h1>
        <p className="page-subtitle">View all employees and their leave balances</p>
      </div>
      
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Employee Name</th>
              <th>Department</th>
              <th>Casual Leave</th>
              <th>Sick Leave</th>
              <th>Earned Leave</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => {
              const casual = emp.balances.find(b => b.leave_type === 'Casual Leave')?.remaining || 0;
              const sick = emp.balances.find(b => b.leave_type === 'Sick Leave')?.remaining || 0;
              const earned = emp.balances.find(b => b.leave_type === 'Earned Leave')?.remaining || 0;
              return (
                <tr key={emp.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="emp-avatar" style={{ width: '36px', height: '36px', fontSize: '14px' }}>
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <strong>{emp.name}</strong>
                        <div className="sub-text">{emp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ background: 'var(--gray-100)', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>
                      {emp.department}
                    </span>
                  </td>
                  <td><strong>{casual}</strong> days</td>
                  <td><strong>{sick}</strong> days</td>
                  <td><strong>{earned}</strong> days</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn-danger-sm" onClick={() => handleDrop(emp.id, emp.name)}>
                      Remove
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
