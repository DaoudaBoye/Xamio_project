import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth }        from '../../../context/AuthContext';
import { useNotif }       from '../../../context/NotifContext';
import { useMeetings }    from '../../../context/MeetingsContext';
import { useSidebar }     from '../../../context/SidebarContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { CreateMeetingModal } from '../../meetings/components/CreateMeetingModal';
import CreateTacheModal       from '../../tasks/components/CreateTacheModal';

import { DashboardStyles } from './DashboardStyles';
import { KpiGrid }         from './KpiGrid';
import { AlertBanner }     from './AlertBanner';
import { MeetingsList }    from './MeetingsList';
import { TaskProgress }    from './TaskProgress';
import { RightPanel }      from './RightPanel';
import { GreetingHeader }  from './GreetingHeader';
import { EmployeeView }    from './EmployeeView';
import { getGreeting, getTemporalAlerts, safeNum, buildTaskCounts } from './dashboard.utils';

function handleUnauthorized() {
  localStorage.removeItem('xamio_token');
  localStorage.removeItem('xamio_user');
  window.dispatchEvent(new Event('xamio:logout'));
  window.location.href = '/login';
}

function authHeaders() {
  const token = localStorage.getItem('xamio_token');
  return {
    Accept: 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
  };
}

export default function DashboardPage() {
  const { user }                      = useAuth();
  const { addToast }                  = useNotif();
  const navigate                      = useNavigate();
  const { meetings, loading, create } = useMeetings();
  const { isMobile }                  = useSidebar();
  const perms                         = usePermissions();

  const [appts, setAppts]               = useState([]);
  const [tasks, setTasks]               = useState([]);
  const [actions, setActions]           = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [createModal, setCreateModal]   = useState(false);
  const [tacheModal, setTacheModal]     = useState(false);

  // ── Fetch RDV ─────────────────────────────
  // ── Fetch Dashboard (tâches + actions en une requête) ─────────────────────
  useEffect(() => {
    const token = localStorage.getItem('xamio_token');
    if (!token) return;
    setLoadingTasks(true);

    fetch('/api/dashboard', { headers: authHeaders() })
      .then(r => {
        if (r.status === 401) { handleUnauthorized(); return null; }
        return r.json();
      })
      .then(data => {
        if (!data) return;
        if (data.taches)  setTasks(data.taches);
        if (data.actions) setActions(data.actions);
      })
      .catch(err => console.error('[Dashboard]:', err.message))
      .finally(() => setLoadingTasks(false));
  }, []);

  // ── Fetch Tâches + Actions en parallèle ───
  useEffect(() => {
    const token = localStorage.getItem('xamio_token');
    if (!token) return;
    setLoadingTasks(true);

    Promise.all([
      fetch('/api/taches',      { headers: authHeaders() }).then(r => r.status === 401 ? null : r.json()),
      fetch('/api/mes-actions', { headers: authHeaders() }).then(r => r.status === 401 ? null : r.json()),
    ])
      .then(([tachesData, actionsData]) => {
        if (!tachesData && !actionsData) { handleUnauthorized(); return; }
        if (tachesData?.data)  setTasks(tachesData.data);
        if (actionsData?.data) setActions(actionsData.data);
      })
      .catch(err => console.error('[Dashboard] Tâches/Actions:', err.message))
      .finally(() => setLoadingTasks(false));
  }, []);

  const {
    peutCreerReunion, peutCreerTache, peutGererRDV,
    isAdmin, isManager, isDirecteur, isAssistant,
  } = perms;

  const isEmployeOnly = !isAdmin && !isManager && !isDirecteur && !isAssistant;

  const greeting   = useMemo(() => getGreeting(user?.name), [user?.name]);

  // ── taskCounts combine tâches + actions ───
  const taskCounts = useMemo(() => buildTaskCounts({ tasks, actions }), [tasks, actions]);

  const pending    = useMemo(() => safeNum(appts.filter(a => a.rdv_statut === 'planifie').length),  [appts]);
  const confirmed  = useMemo(() => safeNum(appts.filter(a => a.rdv_statut === 'confirme').length),  [appts]);
  const nextAppt   = useMemo(() => appts[0] ?? null, [appts]);
  const alerts     = useMemo(() => getTemporalAlerts({
    upcomingForAlerts: meetings.filter(m => ['planifiee','imminente','en_cours'].includes(m.status)),
    unread: 0,
  }), [meetings]);

  const upcomingMtgs = useMemo(() =>
    meetings
      .filter(m => m.status === 'planifiee' || m.status === 'imminente')
      .sort((a, b) =>
        new Date(`${(a.date||'').split('T')[0]}T${a.time||'00:00'}`) -
        new Date(`${(b.date||'').split('T')[0]}T${b.time||'00:00'}`)
      )
      .slice(0, 6),
    [meetings]
  );

  const upcomingCount = useMemo(() => safeNum(meetings.filter(m => m.status === 'planifiee' || m.status === 'imminente').length), [meetings]);
  const doneMtgs      = useMemo(() => safeNum(meetings.filter(m => m.status === 'terminee').length), [meetings]);
  const hasInProgress = useMemo(() => meetings.some(m => m.status === 'en_cours'), [meetings]);

  const openCreate   = useCallback(() => setCreateModal(true),  []);
  const closeCreate  = useCallback(() => setCreateModal(false), []);
  const handleCreate = useCallback((res) => {
    create(res);
    const nb = safeNum(res?.reunion?.participant_reunions?.length ?? res?.participants?.length);
    addToast(`Réunion planifiée${nb > 0 ? ` · 🔔 ${nb} participant(s) notifié(s)` : ''}`, 'success');
  }, [create, addToast]);

  const handleTacheCreated = useCallback((newTask) => {
    if (newTask) setTasks(prev => [...prev, newTask]);
    setTacheModal(false);
  }, []);

  const quickActions = useMemo(() => [
    peutCreerReunion && { label: 'Nouvelle réunion',      icon: '📅', action: openCreate },
    peutCreerTache   && { label: 'Ajouter une tâche',     icon: '✅', action: () => setTacheModal(true) },
                         { label: 'Uploader un document', icon: '📄', action: () => navigate('/documents') },
    peutGererRDV     && { label: 'Nouveau rendez-vous',   icon: '🗓', action: () => navigate('/appointments') },
  ].filter(Boolean), [peutCreerReunion, peutCreerTache, peutGererRDV, navigate, openCreate]);

  if (isEmployeOnly) {
    return (
      <>
        <DashboardStyles />
        <EmployeeView
          greeting={greeting}
          alerts={alerts}
          meetings={meetings}
          loading={loading}
          tasks={tasks}
          actions={actions}
          navigate={navigate}
        />
      </>
    );
  }

  return (
    <>
      <DashboardStyles />
      <div className="db-page">
        <GreetingHeader greeting={greeting} canCreate={peutCreerReunion} onCreate={openCreate} />

        {alerts.length > 0 && (
          <div className="db-fade-in" style={{ animationDelay: '.05s' }}>
            <AlertBanner alerts={alerts} onNavigate={navigate} />
          </div>
        )}

        <div className="db-fade-in" style={{ animationDelay: '.1s' }}>
          <KpiGrid
            isMobile={isMobile}
            upcomingCount={upcomingCount}
            doneMtgs={doneMtgs}
            loading={loading}
            loadingTasks={loadingTasks}
            taskCounts={taskCounts}
            confirmed={confirmed}
            pending={pending}
            navigate={navigate}
          />
        </div>

        <div className="db-layout">
          <div className="db-left">
            <div className="db-fade-in" style={{ animationDelay: '.15s' }}>
              <MeetingsList
                meetings={upcomingMtgs}
                loading={loading}
                hasInProgress={hasInProgress}
                canCreate={peutCreerReunion}
                onCreateClick={openCreate}
                navigate={navigate}
              />
            </div>
            <div className="db-fade-in" style={{ animationDelay: '.2s' }}>
              <TaskProgress
                taskCounts={taskCounts}
                loading={loadingTasks}
                canCreate={peutCreerTache}
                navigate={navigate}
              />
            </div>
          </div>

          {!isMobile && (
            <div className="db-fade-in" style={{ animationDelay: '.18s' }}>
              <RightPanel
                nextAppt={nextAppt}
                quickActions={quickActions}
                pending={pending}
                peutGererRDV={peutGererRDV}
                navigate={navigate}
                onApptCreated={(newAppt) => {
                  setAppts(prev => [newAppt, ...prev]);
                  addToast('Rendez-vous créé avec succès 🎉', 'success');
                }}
              />
            </div>
          )}
        </div>
      </div>

      {peutCreerReunion && (
        <CreateMeetingModal open={createModal} onClose={closeCreate} onCreate={handleCreate} />
      )}

      {peutCreerTache && (
        <CreateTacheModal
          open={tacheModal}
          onClose={() => setTacheModal(false)}
          onCreated={handleTacheCreated}
        />
      )}
    </>
  );
}