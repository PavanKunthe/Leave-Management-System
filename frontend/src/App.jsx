import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import Login             from './pages/Login';
import Register          from './pages/Register';
import EmployeeDashboard from './pages/EmployeeDashboard';
import ApplyLeave        from './pages/ApplyLeave';
import MyRequests        from './pages/MyRequests';
import AdminDashboard    from './pages/AdminDashboard';
import ManageRequests    from './pages/ManageRequests';
import ManageEmployees   from './pages/ManageEmployees';

function RedirectHome() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"         element={<RedirectHome />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Employee Routes */}
          <Route path="/employee/dashboard" element={
            <ProtectedRoute><Layout><EmployeeDashboard /></Layout></ProtectedRoute>
          } />
          <Route path="/employee/apply" element={
            <ProtectedRoute><Layout><ApplyLeave /></Layout></ProtectedRoute>
          } />
          <Route path="/employee/requests" element={
            <ProtectedRoute><Layout><MyRequests /></Layout></ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute requiredRole="admin"><Layout><AdminDashboard /></Layout></ProtectedRoute>
          } />
          <Route path="/admin/requests" element={
            <ProtectedRoute requiredRole="admin"><Layout><ManageRequests /></Layout></ProtectedRoute>
          } />
          <Route path="/admin/employees" element={
            <ProtectedRoute requiredRole="admin"><Layout><ManageEmployees /></Layout></ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
