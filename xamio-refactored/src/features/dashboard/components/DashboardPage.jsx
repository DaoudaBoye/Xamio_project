import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth }        from '../../../context/AuthContext';
import { useNotif }       from '../../../context/NotifContext';
import { useMeetings }    from '../../../context/MeetingsContext';
import { useSidebar }     from '../../../context/SidebarContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { initialTasks }   from '../../../data/mockData';
import { CreateMeetingModal } from '../../meetings/components/CreateMeetingModal';

import { DashboardStyles } from './DashboardStyles';
import { KpiGrid }         from './KpiGrid';
import { AlertBanner }     from './AlertBanner';
import { MeetingsList }    from './MeetingsList';
import { TaskProgress }    from './TaskProgress';
import { RightPanel }      from './RightPanel';
import { GreetingHeader }  from './GreetingHeader';
import { EmployeeView }    from './EmployeeView';
import { getGreeting, getTemporalAlerts, safeNum, buildTaskCounts } from './dashboard.utils';

// ── Helper fetch avec gestion 401 ─────────────────────────────
function handleUnauthorized() {
  localStorage.removeItem('xamio_token');
  localStorage.removeItem('xamio_user');
  window.dispatchEvent(new Event('xamio:logout'));
  window.location.href = '/login';
}

export default function DashboardPage() {
  const { user }                      = useAuth();
  const { addToast }                  = useNotif();
  const navigate                      = useNavigate();
  const { meetings, loading, create } = useMeetings();
  const { isMobile }                  = useSidebar();
  const perms                         = usePermissions();

  const [appts, setAppts]             = useState([]);
  const [createModal, setCreateModal] = useState(false);

  // ── Fetch RDV avec gestion 401 ─────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('xamio_token');
    if (!token) return;

    fetch('/api/rendez-vous', {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
      .then(r => {
        if (r.status === 401) {
          handleUnauthorized();
          return null;
        }
        return r.json();
      })
      .then(data => { if (data?.success) setAppts(data.data || []); })
      .catch(err => console.error('[Dashboard] RDVs:', err.message));
  }, []);

  const {
    peutCreerReunion, peutCreerTache, peutGererRDV,
    isAdmin, isManager, isDirecteur, isAssistant,
  } = perms;

  const isEmployeOnly = !isAdmin && !isManager && !isDirecteur && !isAssistant;

  const greeting     = useMemo(() => getGreeting(user?.name), [user?.name]);
  const taskCounts   = useMemo(() => buildTaskCounts(initialTasks), []);
  const pending      = useMemo(() => safeNum(appts.filter(a => a.rdv_statut === 'planifie').length), [appts]);
  const confirmed    = useMemo(() => safeNum(appts.filter(a => a.rdv_statut === 'confirme').length), [appts]);
  const nextAppt     = useMemo(() => appts[0] ?? null, [appts]);
  const alerts       = useMemo(() => getTemporalAlerts({
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
  const upcomingCount  = useMemo(() => safeNum(meetings.filter(m => m.status === 'planifiee' || m.status === 'imminente').length), [meetings]);
  const doneMtgs       = useMemo(() => safeNum(meetings.filter(m => m.status === 'terminee').length), [meetings]);
  const hasInProgress  = useMemo(() => meetings.some(m => m.status === 'en_cours'), [meetings]);

  const openCreate   = useCallback(() => setCreateModal(true),  []);
  const closeCreate  = useCallback(() => setCreateModal(false), []);
  const handleCreate = useCallback((res) => {
    create(res);
    const nb = safeNum(res?.reunion?.participant_reunions?.length ?? res?.participants?.length);
    addToast(`Réunion planifiée${nb > 0 ? ` · 🔔 ${nb} participant(s) notifié(s)` : ''}`, 'success');
  }, [create, addToast]);

  const quickActions = useMemo(() => [
    peutCreerReunion && { label: 'Nouvelle réunion',      icon: '📅', action: openCreate },
    peutCreerTache   && { label: 'Ajouter une tâche',     icon: '✅', action: () => navigate('/tasks') },
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
          tasks={initialTasks}
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
              <TaskProgress taskCounts={taskCounts} canCreate={peutCreerTache} navigate={navigate} />
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
    </>
  );
}