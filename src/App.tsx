import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AlertTriangle } from 'lucide-react';
import Sidebar from './components/layout/Sidebar';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import RequestHelpPage from './pages/RequestHelpPage';
import AlertsPage from './pages/AlertsPage';
import LedgerPage from './pages/LedgerPage';
import GroupPage from './pages/GroupPage';
import SettingsPage from './pages/SettingsPage';
import HelpRequestsPage from './pages/HelpRequestsPage';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-zinc-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <Sidebar />
      <main className="ml-64 p-8 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
};

const ConfigGate = ({ children }: { children: React.ReactNode }) => {
  const isConfigured = !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-amber-100">
          <div className="h-16 w-16 bg-amber-50 rounded-full flex items-center justify-center mb-6 mx-auto">
            <AlertTriangle className="h-8 w-8 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 text-center mb-2">Configuration Required</h2>
          <p className="text-zinc-600 text-center mb-8">
            Please set your Supabase credentials in the <strong>Secrets</strong> panel to start using Socialite.
          </p>
          <div className="space-y-4 bg-zinc-50 p-4 rounded-xl border border-zinc-100 font-mono text-sm mb-8">
            <div className="flex justify-between">
              <span className="text-zinc-500">VITE_SUPABASE_URL</span>
              <span className={import.meta.env.VITE_SUPABASE_URL ? "text-emerald-600" : "text-red-500"}>
                {import.meta.env.VITE_SUPABASE_URL ? "✓ Set" : "✗ Missing"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">VITE_SUPABASE_ANON_KEY</span>
              <span className={import.meta.env.VITE_SUPABASE_ANON_KEY ? "text-emerald-600" : "text-red-500"}>
                {import.meta.env.VITE_SUPABASE_ANON_KEY ? "✓ Set" : "✗ Missing"}
              </span>
            </div>
          </div>
          <div className="text-center text-sm text-zinc-500">
            <p>Once set, the app will automatically refresh.</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <ConfigGate>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/group/request-help"
              element={
                <ProtectedRoute>
                  <RequestHelpPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/group"
              element={
                <ProtectedRoute>
                  <GroupPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/group/ledger"
              element={
                <ProtectedRoute>
                  <LedgerPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/group/alerts"
              element={
                <ProtectedRoute>
                  <AlertsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/group/governance"
              element={
                <ProtectedRoute>
                  <HelpRequestsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/group/*"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ConfigGate>
  );
}
