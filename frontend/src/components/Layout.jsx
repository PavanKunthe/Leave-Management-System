import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [showNotif, setShowNotif] = useState(false);

  const isAdmin = user?.role === 'admin';

  const employeeLinks = [
    { path: '/employee/dashboard', label: '🏠 Dashboard' },
    { path: '/employee/apply',     label: '📝 Apply Leave' },
    { path: '/employee/requests',  label: '📋 My Requests' },
  ];

  const adminLinks = [
    { path: '/admin/dashboard', label: '🏠 Dashboard' },
    { path: '/admin/requests',  label: '📋 Manage Requests' },
    { path: '/admin/employees', label: '👥 Employee Directory' },
  ];

  const links = isAdmin ? adminLinks : employeeLinks;

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications);
      setUnread(res.data.unread_count);
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleNotifClick = async () => {
    setShowNotif(!showNotif);
    if (!showNotif && unread > 0) {
      await api.put('/notifications/read');
      setUnread(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">🏢</span>
          <span className="brand-text">LeaveMS</span>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
          <div>
            <div className="user-name">{user?.name}</div>
            <div className={`user-role-badge ${isAdmin ? 'admin' : 'employee'}`}>
              {isAdmin ? 'Admin' : 'Employee'}
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {links.map(link => (
            <a
              key={link.path}
              href={link.path}
              className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); navigate(link.path); }}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          🚪 Logout
        </button>
      </aside>

      {/* Main content */}
      <div className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-title">
            {links.find(l => l.path === location.pathname)?.label?.split(' ').slice(1).join(' ') || 'Dashboard'}
          </div>
          <div className="topbar-right">
            <div className="notif-wrapper">
              <button className="notif-btn" onClick={handleNotifClick}>
                🔔
                {unread > 0 && <span className="notif-badge">{unread}</span>}
              </button>
              {showNotif && (
                <div className="notif-dropdown">
                  <div className="notif-header">Notifications</div>
                  {notifications.length === 0 ? (
                    <div className="notif-empty">No notifications yet</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`notif-item ${!n.is_read ? 'unread' : ''}`}>
                        <p>{n.message}</p>
                        <span>{new Date(n.created_at).toLocaleDateString()}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <div className="topbar-user">{user?.department}</div>
          </div>
        </header>

        {/* Page content */}
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}
