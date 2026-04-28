/**
 * Ajoute ce composant dans App.js, après PrivateRoute et PublicRoute.
 * Il redirige vers "/" si l'utilisateur n'a pas la permission.
 *
 * Usage dans les routes :
 *   <Route path="settings" element={
 *     <RoleRoute permission="peutVoirParametres">
 *       <SettingsPage />
 *     </RoleRoute>
 *   } />
 */

import { Navigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';

function RoleRoute({ children, permission }) {
  const perms = usePermissions();

  // Si pas de permission requise → accès libre
  if (!permission) return children;

  // Si permission non accordée → redirection dashboard
  if (!perms[permission]) return <Navigate to="/" replace />;

  return children;
}

/* ── Routes protégées par rôle à remplacer dans App.js ─────────────────────────

<Route index                   element={<DashboardPage />} />
<Route path="agenda"           element={<AgendaPage />} />
<Route path="meetings"         element={<MeetingsPage />} />
<Route path="meetings/:id"     element={<MeetingDetailPage />} />
<Route path="appointments"     element={
  <RoleRoute permission="peutGererRDV"><AppointmentsPage /></RoleRoute>
} />
<Route path="workshops"        element={
  <RoleRoute permission="peutGererAteliers"><WorkshopsPage /></RoleRoute>
} />
<Route path="events"           element={
  <RoleRoute permission="voitEvenements"><EventsPage /></RoleRoute>
} />
<Route path="tasks"            element={<TasksPage />} />
<Route path="documents"        element={<DocumentsPage />} />
<Route path="agenda-directeur" element={
  <RoleRoute permission="voitAgendaDirecteur"><DirecteurAgendaPage /></RoleRoute>
} />
<Route path="notifications"    element={<NotificationsPage />} />
<Route path="settings"         element={
  <RoleRoute permission="peutVoirParametres"><SettingsPage /></RoleRoute>
} />

─────────────────────────────────────────────────────────────────────────────── */