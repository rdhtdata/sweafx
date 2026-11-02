import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Enquiries } from './pages/Enquiries';
import { Requirements } from './pages/Requirements';
import { CrmSearch } from './pages/CrmSearch';
import { Customers } from './pages/Customers';
import { Transporters } from './pages/Transporters';
import { Fleet } from './pages/Fleet';
import { Compliance } from './pages/Compliance';
import { AuditLogs } from './pages/AuditLogs';
import { Users } from './pages/Users';

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-400 gap-3">
        <div className="w-5 h-5 border-2 border-zinc-700 border-t-zinc-200 rounded-full animate-spin" />
        <span className="text-xs font-medium tracking-wide text-zinc-500">Initializing workspace</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-[#fafafa] text-zinc-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedLayout>
                  <Dashboard />
                </ProtectedLayout>
              }
            />
            <Route
              path="/enquiries"
              element={
                <ProtectedLayout>
                  <Enquiries />
                </ProtectedLayout>
              }
            />
            <Route
              path="/requirements"
              element={
                <ProtectedLayout>
                  <Requirements />
                </ProtectedLayout>
              }
            />
            <Route
              path="/crm-search"
              element={
                <ProtectedLayout>
                  <CrmSearch />
                </ProtectedLayout>
              }
            />
            <Route
              path="/customers"
              element={
                <ProtectedLayout>
                  <Customers />
                </ProtectedLayout>
              }
            />
            <Route
              path="/transporters"
              element={
                <ProtectedLayout>
                  <Transporters />
                </ProtectedLayout>
              }
            />
            <Route
              path="/fleet"
              element={
                <ProtectedLayout>
                  <Fleet />
                </ProtectedLayout>
              }
            />
            <Route
              path="/compliance"
              element={
                <ProtectedLayout>
                  <Compliance />
                </ProtectedLayout>
              }
            />
            <Route
              path="/audit"
              element={
                <ProtectedLayout>
                  <AuditLogs />
                </ProtectedLayout>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedLayout>
                  <Users />
                </ProtectedLayout>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
