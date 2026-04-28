import React, { useState } from 'react';
import { SectionHeader, Badge, Button } from '../../../components/ui/index';
import { useNotif } from '../../../context/NotifContext';

const INITIAL = [
  { id: 'n1',  read: false, type: 'reminder',    icon: '🔔', title: 'Rappel réunion',            body: 'Sprint planning — Module IA dans 1 heure.',                     time: 'il y a 30 min', category: 'reminder'  },
  { id: 'n2',  read: false, type: 'document',    icon: '📄', title: 'Document partagé',          body: 'F. Ndiaye a partagé "Roadmap 2025 — détaillée.xlsx" avec vous.',  time: 'il y a 2h',     category: 'document'  },
  { id: 'n3',  read: true,  type: 'task',        icon: '✅', title: 'Tâche terminée',            body: '"Auth JWT + 2FA" marquée comme terminée par Backend dev.',         time: 'il y a 4h',     category: 'task'      },
  { id: 'n4',  read: true,  type: 'appointment', icon: '🗓', title: 'Nouveau rendez-vous',        body: 'RDV "Démo produit — CBAO" ajouté le 26 mars à 11h00.',            time: 'hier',          category: 'appointment'},
  { id: 'n5',  read: false, type: 'ai',          icon: '🤖', title: 'Résumé IA disponible',      body: 'Le résumé de la réunion "Réunion de board" est prêt à consulter.', time: 'hier',          category: 'ai'        },
  { id: 'n6',  read: true,  type: 'user',        icon: '👤', title: 'Nouvel utilisateur',        body: 'M. Sow a rejoint l\'espace de travail XAMIO.',                     time: 'avant-hier',    category: 'user'      },
  { id: 'n7',  read: false, type: 'reminder',    icon: '🔔', title: 'Rappel rendez-vous',        body: 'RDV "Réunion partenariat — Orange Money" demain à 15h30.',         time: 'avant-hier',    category: 'reminder'  },
  { id: 'n8',  read: true,  type: 'system',      icon: '⚙',  title: 'Mise à jour système',       body: 'XAMIO v1.0.2 déployé. Nouvelles fonctionnalités disponibles.',     time: 'il y a 3 jours', category: 'system'   },
];

const CATEGORIES = [
  { key: 'all',         label: 'Toutes'         },
  { key: 'reminder',    label: 'Rappels'         },
  { key: 'document',    label: 'Documents'       },
  { key: 'task',        label: 'Tâches'          },
  { key: 'appointment', label: 'Rendez-vous'     },
  { key: 'ai',          label: 'IA'              },
  { key: 'system',      label: 'Système'         },
];

const TYPE_COLOR = {
  reminder: 'ochre', document: 'slate', task: 'sage',
  appointment: 'sage', ai: 'plum', user: 'ochre', system: 'muted',
};

export default function NotificationsPage() {
  const { addToast } = useNotif();
  const [notifs, setNotifs] = useState(INITIAL);
  const [filter, setFilter] = useState('all');
  const [onlyUnread, setOnlyUnread] = useState(false);

  const unreadCount = notifs.filter(n => !n.read).length;

  const visible = notifs.filter(n => {
    const catOk  = filter === 'all' || n.category === filter;
    const readOk = !onlyUnread || !n.read;
    return catOk && readOk;
  });

  const markAllRead = () => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    addToast('Toutes les notifications marquées comme lues.', 'success');
  };

  const markRead = (id) => setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const deleteNotif = (id) => setNotifs(prev => prev.filter(n => n.id !== id));
  const clearAll = () => { setNotifs([]); addToast('Notifications effacées.', 'info'); };

  return (
    <div className="animate-enter">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 22, fontWeight: 600, letterSpacing: '-.01em' }}>
            Notifications
          </h2>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 3 }}>
            {unreadCount > 0 ? `${unreadCount} non lues` : 'Tout est à jour'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead}>Tout marquer lu</Button>
          )}
          {notifs.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAll}>Tout effacer</Button>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {CATEGORIES.map(c => (
          <button key={c.key} onClick={() => setFilter(c.key)}
            style={{ padding: '5px 13px', borderRadius: 20, border: '1px solid', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all var(--transition-normal)', background: filter === c.key ? 'var(--color-accent-bg)' : 'transparent', borderColor: filter === c.key ? 'var(--color-accent-border)' : 'var(--color-border)', color: filter === c.key ? 'var(--color-accent)' : 'var(--color-text-muted)', letterSpacing: '.03em' }}>
            {c.label}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Non lues uniquement</span>
          <button
            onClick={() => setOnlyUnread(v => !v)}
            style={{ width: 36, height: 20, borderRadius: 10, background: onlyUnread ? 'var(--color-accent)' : 'var(--color-background-elevated)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background var(--transition-normal)' }}
          >
            <span style={{ position: 'absolute', top: 2, left: onlyUnread ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left var(--transition-normal)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
          </button>
        </div>
      </div>

      {/* Notification list */}
      {visible.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>🔔</p>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 16, color: 'var(--color-text-secondary)' }}>Aucune notification.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {visible.map(n => {
            const color = TYPE_COLOR[n.type] || 'muted';
            return (
              <div key={n.id}
                style={{ display: 'flex', gap: 14, padding: '14px 16px', background: n.read ? 'transparent' : `var(--${color}-dim)`, border: `1px solid ${n.read ? 'var(--color-border)' : `var(--${color}-border)`}`, borderRadius: 10, alignItems: 'flex-start', transition: 'all var(--transition-normal)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-background-tertiary)'}
                onMouseLeave={e => e.currentTarget.style.background = n.read ? 'transparent' : `var(--${color}-dim)`}
              >
                {/* Icon */}
                <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--color-background-tertiary)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                  {n.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <p style={{ fontSize: 13, fontWeight: n.read ? 400 : 600, color: 'var(--color-text-primary)' }}>{n.title}</p>
                    {!n.read && <span style={{ width: 7, height: 7, borderRadius: '50%', background: `var(--${color})`, flexShrink: 0 }} />}
                    <Badge label={CATEGORIES.find(c => c.key === n.category)?.label || n.category} color={color} />
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: 4 }}>{n.body}</p>
                  <p style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--mono)' }}>{n.time}</p>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                  {!n.read && (
                    <button onClick={() => markRead(n.id)} title="Marquer lu"
                      style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 6, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-text-muted)', transition: 'all var(--transition-normal)' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--sage-border)'; e.currentTarget.style.color = 'var(--sage)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  )}
                  <button onClick={() => deleteNotif(n.id)} title="Supprimer"
                    style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 6, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-text-muted)', transition: 'all var(--transition-normal)' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--clay-border)'; e.currentTarget.style.color = 'var(--clay)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
