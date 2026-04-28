// App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth }     from './context/AuthContext';
import { NotifProvider }             from './context/NotifContext';
import { ThemeProvider }             from './context/ThemeContext';
import { MeetingsProvider }          from './context/MeetingsContext';
import { SidebarProvider }           from './context/SidebarContext';
import { usePermissions }            from './hooks/usePermissions';
import { RouterLogoutListener }      from './components/RouterLogoutListener'; // ← NOUVEAU

// Layout
import AppLayout from './components/layout/AppLayout';

// Features
import { AIAssistant } from './features/ai';
import { LoginPage }   from './features/auth';

// Pages
import DashboardPage       from './pages/DashboardPage';
import AgendaPage          from './pages/AgendaPage';
import DirecteurAgendaPage from './pages/DirecteurAgendaPage';
import MeetingsPage        from './pages/MeetingsPage';
import MeetingDetailPage   from './pages/MeetingDetailPage';
import EventsPage          from './pages/EventsPage';
import TasksPage           from './pages/TasksPage';
import DocumentsPage       from './pages/DocumentsPage';
import AppointmentsPage    from './pages/AppointmentsPage';
import WorkshopsPage       from './pages/WorkshopsPage';
import NotificationsPage   from './pages/NotificationsPage';
import SettingsPage        from './pages/SettingsPage';
import { useInactivityLogout } from './hooks/useInactivityLogout';

/* ── Guards ───────────────────────────────────────────────────────────── */

function PrivateRoute({ children }) {
  const { isAuth, isLoggingOut } = useAuth();
  useInactivityLogout();

  if (isLoggingOut) return null;
  return isAuth ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { isAuth } = useAuth();
  return isAuth ? <Navigate to="/" replace /> : children;
}

function RoleRoute({ children, permission }) {
  const perms = usePermissions();
  if (!permission) return children;
  if (!perms[permission]) return <Navigate to="/" replace />;
  return children;
}

/* ── App ──────────────────────────────────────────────────────────────── */
export default function App() {
  return (
    <ThemeProvider>
      {/* ✅ BrowserRouter en premier — tout ce qui utilise useNavigate doit être en dessous */}
      <BrowserRouter
        future={{
          v7_startTransition:   true,
          v7_relativeSplatPath: true,
        }}
      >
        {/* ✅ AuthProvider maintenant DANS le Router */}
        <AuthProvider>
          {/* ✅ Écoute xamio:logout et appelle navigate('/login') */}
          <RouterLogoutListener />
          <NotifProvider>
            <MeetingsProvider>
              <SidebarProvider>
                <AIAssistant />

                <Routes>
                  {/* ── Routes publiques ── */}
                  <Route
                    path="/login"
                    element={<PublicRoute><LoginPage /></PublicRoute>}
                  />

                  {/* ── Routes privées ── */}
                  <Route
                    path="/"
                    element={<PrivateRoute><AppLayout /></PrivateRoute>}
                  >
                    <Route index                element={<DashboardPage />} />
                    <Route path="agenda"        element={<AgendaPage />} />
                    <Route path="meetings"      element={<MeetingsPage />} />
                    <Route path="meetings/:id"  element={<MeetingDetailPage />} />
                    <Route path="tasks"         element={<TasksPage />} />
                    <Route path="documents"     element={<DocumentsPage />} />
                    <Route path="notifications" element={<NotificationsPage />} />

                    {/* Manager + Assistante */}
                    <Route path="appointments" element={
                      <RoleRoute permission="peutGererRDV">
                        <AppointmentsPage />
                      </RoleRoute>
                    } />

                    {/* Manager seulement */}
                    <Route path="workshops" element={
                      <RoleRoute permission="peutGererAteliers">
                        <WorkshopsPage />
                      </RoleRoute>
                    } />
                    <Route path="events" element={
                      <RoleRoute permission="voitEvenements">
                        <EventsPage />
                      </RoleRoute>
                    } />

                    {/* Admin + Assistante */}
                    <Route path="agenda-directeur" element={
                      <RoleRoute permission="voitAgendaDirecteur">
                        <DirecteurAgendaPage />
                      </RoleRoute>
                    } />

                    {/* Tout le monde */}
                    <Route path="settings" element={
                      <RoleRoute permission="voitParametres">
                        <SettingsPage />
                      </RoleRoute>
                    } />
                  </Route>

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </SidebarProvider>
            </MeetingsProvider>
          </NotifProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}