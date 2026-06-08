import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Layout } from './components/Layout';
import { Toaster } from './components/Toast';
import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';
import { RecordsPage } from './pages/RecordsPage';
import { NewRecordPage } from './pages/NewRecordPage';
import { GlobalRecordsPage } from './pages/GlobalRecordsPage';
import { ParishesPage } from './pages/ParishesPage';
import { UsersPage } from './pages/UsersPage';
import { BooksPage } from './pages/BooksPage';
import { AgeGroupsPage } from './pages/AgeGroupsPage';

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      retry:               1,
      staleTime:           5 * 60 * 1000,   // 5 min — don't re-fetch reference data on every navigation
      gcTime:              10 * 60 * 1000,  // keep in cache 10 min
      refetchOnWindowFocus:false,
      refetchOnMount:      false,           // use cache if data already loaded
    },
  },
});

function RequireAuth() {
  const { session } = useAuth();
  if (!session) return <Navigate to="/" replace />;
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

function RequireAdmin() {
  const { session } = useAuth();
  if (!session)             return <Navigate to="/" replace />;
  if (session.role !== 'admin') return <Navigate to="/records" replace />;
  return <Outlet />;
}

function RedirectIfAuthed() {
  const { session } = useAuth();
  if (session) return <Navigate to={session.role === 'admin' ? '/dashboard' : '/records'} replace />;
  return <LoginPage />;
}

export function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/" element={<RedirectIfAuthed />} />

              <Route element={<RequireAuth />}>
                <Route path="/records"     element={<RecordsPage />} />
                <Route path="/records/new" element={<NewRecordPage />} />

                <Route element={<RequireAdmin />}>
                  <Route path="/dashboard"          element={<Dashboard />} />
                  <Route path="/admin/records"      element={<GlobalRecordsPage />} />
                  <Route path="/admin/parishes"     element={<ParishesPage />} />
                  <Route path="/admin/users"        element={<UsersPage />} />
                  <Route path="/admin/books"        element={<BooksPage />} />
                  <Route path="/admin/age-groups"   element={<AgeGroupsPage />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Toaster />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}