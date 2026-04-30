import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

const AdminRoute = () => {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Check if authenticated AND role is admin
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'admin') {
    // If authenticated but not an admin, send to dashboard
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;
