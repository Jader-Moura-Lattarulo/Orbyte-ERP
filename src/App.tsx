import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, Outlet } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import Clients from '@/pages/Clients';
import ServiceOrders from '@/pages/ServiceOrders';
import Financial from '@/pages/Financial';
import Agenda from '@/pages/Agenda';
import Inventory from '@/pages/Inventory';
import Technicians from '@/pages/Technicians';
import Login from '@/pages/Login';
import ForgotPassword from '@/pages/ForgotPassword';
import UsersManagement from '@/pages/UsersManagement';
import AdminRoute from '@/components/layout/AdminRoute';

const PrivateRoute = () => {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

const AuthenticatedApp = () => {
  const { isLoadingPublicSettings, authError } = useAuth();

  // Show loading spinner while checking app public settings
  if (isLoadingPublicSettings) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle specific user not registered error
  if (authError && authError.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  // Render the main app with Routes
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/esqueceu-senha" element={<ForgotPassword />} />
      <Route element={<PrivateRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clientes" element={<Clients />} />
          <Route path="/ordens" element={<ServiceOrders />} />
          <Route path="/financeiro" element={<Financial />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/estoque" element={<Inventory />} />
          <Route path="/tecnicos" element={<Technicians />} />
          
          <Route element={<AdminRoute />}>
            <Route path="/usuarios" element={<UsersManagement />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App