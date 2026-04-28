/**
 * Xamio — MeetingDetail.jsx  v11
 */

import React, {
  useState, useCallback, useEffect, useRef, useMemo,
} from 'react';
import { useParams, useNavigate }  from 'react-router-dom';
import { useMeetings }             from '../../../context/MeetingsContext';
import { useNotif }                from '../../../context/NotifContext';
import { usePermissions }          from '../../../hooks/usePermissions';
import { generateCRWord }          from './generateCRWord';
import { useAuth } from '../../../context/AuthContext';


import {
  T, Ic,
  fmtDate, fmtDateLong, agendaText, participantLabel,
  getInvSt, getPartSt, isExternal,
  useHover, useOutsideClick,
  Avatar, StatusPill,
  PrimaryBtn, GhostBtn, IconBtn,
  Field, FormLabel,
  Modal, ModalFooter,
  Card, DropBtn,
} from './_shared';

import MeetingCR from './MeetingCR';
import CRView    from './CRView';

/* ═══════════════════════════════════════════════════════════
   GLOBAL STYLES
═══════════════════════════════════════════════════════════ */
function useStyles() {
  useEffect(() => {
    const id = 'xmd-v8-styles';
    if (document.getElementById(id)) return;
    const s = document.createElement('style');
    s.id = id;
    s.textContent = `
      @keyframes xmd-up   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
      @keyframes xmd-pulse{ 0%,100%{opacity:1} 50%{opacity:.35} }
      @keyframes xmd-mbg  { from{opacity:0} to{opacity:1} }
      @keyframes xmd-mbox { from{opacity:0;transform:translateY(14px) scale(.97)} to{opacity:1;transform:none} }
      @keyframes xmd-pop  { from{opacity:0;transform:scale(.94) translateY(-6px)} to{opacity:1;transform:none} }
      @keyframes xmd-spin { to{transform:rotate(360deg)} }

      .xmd-page { animation: xmd-up .3s cubic-bezier(.22,1,.36,1); }
      .xmd-s1   { animation: xmd-up .32s cubic-bezier(.22,1,.36,1) both; animation-delay:0ms; }
      .xmd-s2   { animation: xmd-up .32s cubic-bezier(.22,1,.36,1) both; animation-delay:60ms; }
      .xmd-s3   { animation: xmd-up .32s cubic-bezier(.22,1,.36,1) both; animation-delay:120ms; }
      .xmd-s4   { animation: xmd-up .32s cubic-bezier(.22,1,.36,1) both; animation-delay:180ms; }

      .xmd-layout { display:grid; grid-template-columns:1fr 288px; gap:16px; align-items:start; }
      .xmd-sidebar { display:flex; flex-direction:column; gap:10px; position:sticky; top:20px; }
      @media(max-width:880px){
        .xmd-layout { grid-template-columns:1fr; }
        .xmd-sidebar { position:static; order:-1; }
      }

      .xmd-sb::-webkit-scrollbar { width:4px; }
      .xmd-sb::-webkit-scrollbar-track { background:transparent; }
      .xmd-sb::-webkit-scrollbar-thumb { background:var(--color-border-medium); border-radius:99px; }

      .xmd-row:hover             { background:var(--color-background-tertiary)!important; }
      .xmd-side-btn:hover        { border-color:var(--color-border-medium)!important; background:var(--color-background-tertiary)!important; color:var(--color-text-primary)!important; }
      .xmd-side-btn-danger:hover { background:var(--color-danger-bg)!important; border-color:var(--color-danger-border)!important; color:var(--color-danger)!important; }
      .xmd-agenda-item:hover     { background:var(--color-background-tertiary)!important; }
      .xmd-nav-back:hover        { color:var(--color-text-primary)!important; }
      .xmd-participant-row:hover { background:var(--color-background-tertiary)!important; }

      .xmd-doc-dl:hover {
        background: var(--color-purple-bg, #F5F3FF) !important;
        border-color: var(--color-purple-border, #C4B5FD) !important;
      }
    `;
    document.head.appendChild(s);
  }, []);
}

/* ═══════════════════════════════════════════════════════════
   HELPER — normalise un CR brut en objet compatible CRView
═══════════════════════════════════════════════════════════ */
function normalizeCR(data, meetingId) {
  if (!data) return null;
  // L'API peut renvoyer "actions" ou "tasks" selon les endpoints
  const rawActions = Array.isArray(data.actions) ? data.actions :
                     Array.isArray(data.tasks)   ? data.tasks   : [];
  return {
    meetingId:     String(meetingId),
    summary:       data.summary       ?? '',
    decisions:     (Array.isArray(data.decisions) ? data.decisions : []).map(d =>
      typeof d === 'string' ? d : (d.text ?? d.dec_intitule ?? '')
    ),
    actions:       rawActions.map(a =>
      typeof a === 'string'
        ? { title: a, assignee: null, due: null }
        : {
            title:    a.title    ?? a.text ?? a.action_texte ?? '',
            assignee: a.assignee ?? null,
            due:      a.due      ?? a.action_echeance ?? null,
          }
    ),
    generatedByAI: data.generated_by_ai ?? data.generatedByAI ?? false,
    has_file:      data.has_file      ?? false,
    createdAt:     data.created_at    ?? data.createdAt ?? null,
  };
}

/* ═══════════════════════════════════════════════════════════
   DROPDOWN ACTIONS
═══════════════════════════════════════════════════════════ */
function ActionDropdown({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOutsideClick(ref, useCallback(() => setOpen(false), []));
  if (!items?.length) return null;
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <IconBtn onClick={() => setOpen(o => !o)} active={open} title="Plus d'actions">
        <Ic.dots />
      </IconBtn>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 38, zIndex: 300,
          background: T.bg1, border: `1px solid ${T.bd1}`,
          borderRadius: T.r10, padding: 5, minWidth: 220,
          boxShadow: T.sdrop, animation: 'xmd-pop .14s cubic-bezier(.22,1,.36,1)',
        }}>
          {items.map((it, i) =>
            it.sep
              ? <div key={i} style={{ height: 1, background: T.bd0, margin: '4px 0' }} />
              : <DropBtn key={i} {...it} onClick={() => { setOpen(false); it.fn(); }} />
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SIDEBAR ATOMS
═══════════════════════════════════════════════════════════ */
function SideMeta({ icon, label, value, mono, highlight }) {
  return (
    <div style={{
      display: 'flex', gap: 10, alignItems: 'flex-start',
      padding: '8px 0', borderBottom: `1px solid ${T.bd0}`,
    }}>
      <span style={{ color: T.t3, lineHeight: 0, flexShrink: 0, marginTop: 2 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 10, color: T.t3, fontWeight: 600,
          letterSpacing: '.07em', margin: '0 0 3px', textTransform: 'uppercase',
        }}>{label}</p>
        <p style={{
          fontSize: 12.5, lineHeight: 1.45, margin: 0, wordBreak: 'break-word',
          color: highlight ? T.acc : T.t1,
          fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
          fontWeight: highlight ? 600 : 400,
        }}>{value || '—'}</p>
      </div>
    </div>
  );
}

function SideBtn({ icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={danger ? 'xmd-side-btn xmd-side-btn-danger' : 'xmd-side-btn'}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 9,
        padding: '8px 11px', borderRadius: T.r8,
        border: `1px solid ${danger ? T.danr : T.bd0}`,
        background: danger ? T.danb : 'transparent',
        color: danger ? T.dan : T.t2,
        fontSize: 12.5, fontWeight: 450, cursor: 'pointer',
        fontFamily: 'var(--font-sans)', textAlign: 'left', transition: 'all .13s',
      }}
    >
      <span style={{ lineHeight: 0, flexShrink: 0, opacity: .85 }}>{icon}</span>
      {label}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════
   BANNER
═══════════════════════════════════════════════════════════ */
function Banner({ icon, title, subtitle, fg, bg, border }) {
  return (
    <div style={{
      padding: '12px 16px', borderRadius: T.r12, marginBottom: 14,
      background: bg, border: `1px solid ${border}`,
      display: 'flex', gap: 11, alignItems: 'flex-start',
    }}>
      <span style={{ color: fg, lineHeight: 0, flexShrink: 0, marginTop: 2 }}>{icon}</span>
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: fg, margin: '0 0 2px' }}>{title}</p>
        {subtitle && (
          <p style={{ fontSize: 12, color: T.t3, margin: 0, lineHeight: 1.55 }}>{subtitle}</p>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   AGENDA
═══════════════════════════════════════════════════════════ */
function AgendaItem({ index, text }) {
  return (
    <div className="xmd-agenda-item" style={{
      display: 'flex', gap: 12, alignItems: 'flex-start',
      padding: '10px 8px', borderBottom: `1px solid ${T.bd0}`,
      borderRadius: T.r6, transition: 'background .12s',
    }}>
      <span style={{
        width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 1,
        background: T.accm, border: `1px solid ${T.accb}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9.5, fontWeight: 700, color: T.acc,
      }}>{index}</span>
      <p style={{ fontSize: 13, color: T.t2, lineHeight: 1.6, margin: 0, flex: 1 }}>{text}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PARTICIPANTS
═══════════════════════════════════════════════════════════ */
function InvPill({ statusKey }) {
  const c = T.inv[statusKey] || T.inv.en_attente;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 7px', borderRadius: T.r20,
      background: c.bg, border: `1px solid ${c.border}`,
      fontSize: 10, fontWeight: 600, color: c.fg, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 4, height: 4, borderRadius: '50%', background: c.dot }} />
      {c.label}
    </span>
  );
}

function ParticipantRow({ p }) {
  const ext    = isExternal(p);
  const name   = participantLabel(p);
  const email  = typeof p === 'object' ? (p.ext_email  || p.part_email || p.email || '') : '';
  const phone  = typeof p === 'object' ? (p.ext_telephone || '') : '';
  const invSt  = getInvSt(p);
  const partSt = getPartSt(p);
  const partC  = T.part[partSt] || T.part.invite;

  return (
    <div className="xmd-participant-row" style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 6px', borderBottom: `1px solid ${T.bd0}`,
      borderRadius: T.r6, transition: 'background .12s',
    }}>
      <Avatar name={name || email} size={28} external={ext} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <p style={{
            fontSize: 12.5, fontWeight: 500, color: T.t1, margin: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{name || email}</p>
          {ext && (
            <span style={{
              flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 3,
              padding: '1px 6px', borderRadius: T.r20,
              background: T.purb, border: `1px solid ${T.purr}`,
              fontSize: 9, fontWeight: 700, color: T.pur,
            }}>↗ Externe</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {!ext && (
            <span style={{
              padding: '1px 6px', borderRadius: T.r20,
              background: partC.bg, border: `1px solid ${partC.border}`,
              fontSize: 9.5, fontWeight: 600, color: partC.fg,
            }}>{partC.label}</span>
          )}
          {email && (
            <span style={{
              fontSize: 10, color: T.t3, fontFamily: 'var(--font-mono)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{email}</span>
          )}
          {phone && (
            <span style={{ fontSize: 10, color: T.t3, fontFamily: 'var(--font-mono)' }}>
              · {phone}
            </span>
          )}
        </div>
      </div>
      <InvPill statusKey={invSt} />
    </div>
  );
}

function ProgressRing({ value, size = 44, stroke = 3.5, color }) {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const off  = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.bd0} strokeWidth={stroke} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset .6s cubic-bezier(.22,1,.36,1)' }}
      />
    </svg>
  );
}

function ParticipantsCard({ participants, organizer }) {
  const [filter, setFilter] = useState('all');
  if (!participants?.length && !organizer) return null;

  const count    = v => v === 'all' ? participants.length : participants.filter(p => getInvSt(p) === v).length;
  const nbExt    = participants.filter(p => isExternal(p)).length;
  const total    = participants.length;
  const pctAcc   = total > 0 ? Math.round(count('accepte') / total * 100) : 0;
  const filtered = filter === 'all' ? participants : filter === 'externe'
    ? participants.filter(isExternal)
    : participants.filter(p => getInvSt(p) === filter);

  const tabs = [
    { v: 'all',        l: 'Tous',      n: total               },
    { v: 'accepte',    l: 'Acceptés',  n: count('accepte')    },
    { v: 'en_attente', l: 'Attente',   n: count('en_attente') },
    { v: 'externe',    l: 'Externes',  n: nbExt               },
    { v: 'refuse',     l: 'Refusés',   n: count('refuse')     },
  ].filter(t => t.n > 0 || t.v === 'all');

  return (
    <Card title={`Participants · ${total}`} icon={<Ic.users />} className="xmd-s2" noPad>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '12px 16px 10px', borderBottom: `1px solid ${T.bd0}`,
      }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <ProgressRing value={pctAcc} size={48} stroke={4} color="var(--color-success)" />
          <span style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, color: T.t1,
          }}>{pctAcc}%</span>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 11.5, fontWeight: 600, color: T.t1, margin: '0 0 4px' }}>
            {count('accepte')} / {total} accepté{count('accepte') !== 1 ? 's' : ''}
            {nbExt > 0 && (
              <span style={{ fontSize: 10, fontWeight: 400, color: T.pur, marginLeft: 8 }}>
                · {nbExt} externe{nbExt > 1 ? 's' : ''}
              </span>
            )}
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { key: 'accepte',    color: 'var(--color-success)' },
              { key: 'en_attente', color: 'var(--color-warning)' },
              { key: 'refuse',     color: 'var(--color-danger)'  },
            ].map(({ key, color }) => count(key) > 0 && (
              <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, color: T.t3 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
                {count(key)} {T.inv[key].label.toLowerCase()}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex', gap: 0, background: T.bg3,
        borderBottom: `1px solid ${T.bd0}`, overflowX: 'auto',
      }}>
        {tabs.map(({ v, l, n }) => {
          const active = filter === v;
          return (
            <button key={v} onClick={() => setFilter(v)} style={{
              flex: 1, padding: '6px 4px', border: 'none',
              borderBottom: `2px solid ${active ? T.acc : 'transparent'}`,
              background: 'transparent',
              color: active ? T.acc : T.t3,
              fontSize: 10.5, fontWeight: active ? 700 : 400,
              cursor: 'pointer', fontFamily: 'var(--font-sans)',
              transition: 'all .13s', whiteSpace: 'nowrap',
            }}>
              {l}{n > 0 && <span style={{ marginLeft: 3, opacity: .7 }}>({n})</span>}
            </button>
          );
        })}
      </div>

      <div style={{ padding: '6px 10px 10px' }}>
        {/* ── Organisateur en tête avec badge distinct ── */}
        {filter === 'all' && organizer && (
          <div className="xmd-participant-row" style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 6px', borderBottom: `1px solid ${T.bd0}`,
            borderRadius: T.r6, background: T.accm,
          }}>
            <Avatar name={organizer.name || organizer.email} size={28} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <p style={{
                  fontSize: 12.5, fontWeight: 600, color: T.t1, margin: 0,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{organizer.name || organizer.email}</p>
                <span style={{
                  flexShrink: 0, display: 'inline-flex', alignItems: 'center',
                  padding: '1px 6px', borderRadius: T.r20,
                  background: T.accb, border: `1px solid ${T.acc}`,
                  fontSize: 9, fontWeight: 700, color: T.acc,
                }}>★ Organisateur</span>
              </div>
              {organizer.email && (
                <span style={{
                  fontSize: 10, color: T.t3, fontFamily: 'var(--font-mono)',
                }}>{organizer.email}</span>
              )}
            </div>
            {/* Badge présence confirmée pour l'organisateur */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '2px 7px', borderRadius: T.r20,
              background: 'var(--color-success-bg, #F0FDF4)',
              border: '1px solid var(--color-success-border, #BBF7D0)',
              fontSize: 10, fontWeight: 600, color: 'var(--color-success)',
              whiteSpace: 'nowrap',
            }}>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--color-success)' }} />
              Présent
            </span>
          </div>
        )}

        {filtered.length === 0
          ? <p style={{ fontSize: 12.5, color: T.t3, fontStyle: 'italic', padding: '10px 0', textAlign: 'center' }}>
              Aucun participant.
            </p>
          : filtered.map((p, i) => (
              <ParticipantRow key={p?.part_id || p?.id || i} p={p} />
            ))
        }
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════
   ACTIVITY FEED
═══════════════════════════════════════════════════════════ */
function buildActivity(meeting) {
  const ev = [];
  if (meeting.created_at || meeting.createdAt)
    ev.push({ date: meeting.created_at || meeting.createdAt, label: 'Réunion planifiée', icon: <Ic.cal />, color: 'var(--color-accent)' });
  if (meeting.status === 'reportee' && meeting.postponedTo)
    ev.push({ date: meeting.postponedTo.date, label: `Reportée au ${fmtDate(meeting.postponedTo.date)}`, icon: <Ic.postpone />, color: 'var(--color-purple)', note: meeting.postponeReason });
  if (meeting.status === 'annulee')
    ev.push({ date: meeting.updated_at, label: 'Réunion annulée', icon: <Ic.warn />, color: 'var(--color-danger)', note: meeting.cancelReason });
  if (meeting.status === 'terminee')
    ev.push({ date: meeting.updated_at, label: 'Réunion terminée', icon: <Ic.check />, color: 'var(--color-success)' });
  if (meeting.minutes?.addedAt)
    ev.push({ date: meeting.minutes.addedAt, label: meeting.minutes.generatedByAI ? 'CR généré par IA' : 'CR ajouté', icon: <Ic.doc />, color: 'var(--color-purple)' });
  return ev.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function ActivityFeed({ meeting }) {
  const events = buildActivity(meeting);
  if (!events.length) return null;
  return (
    <Card title="Activité" icon={<Ic.activity />} className="xmd-s4" collapsible>
      <div style={{ position: 'relative', paddingLeft: 4 }}>
        <div style={{ position: 'absolute', left: 11, top: 6, bottom: 6, width: 1, background: T.bd0 }} />
        {events.map((ev, i) => (
          <div key={i} style={{
            display: 'flex', gap: 14, alignItems: 'flex-start',
            marginBottom: i < events.length - 1 ? 16 : 0,
          }}>
            <span style={{
              width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 1,
              background: ev.color + '16', border: `1.5px solid ${ev.color}35`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1, position: 'relative', color: ev.color, lineHeight: 0,
            }}>{ev.icon}</span>
            <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
              <p style={{ fontSize: 12.5, fontWeight: 500, color: T.t1, margin: 0 }}>{ev.label}</p>
              {ev.note && (
                <p style={{ fontSize: 11.5, color: T.t3, margin: '2px 0 0', lineHeight: 1.4 }}>{ev.note}</p>
              )}
              <p style={{ fontSize: 10.5, color: T.t3, margin: '3px 0 0', fontFamily: 'var(--font-mono)' }}>
                {ev.date ? new Date(ev.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════
   EDIT MODAL
═══════════════════════════════════════════════════════════ */
function EditModal({ open, onClose, meeting, onSave }) {
  const [form, setForm] = useState({
    title:        meeting?.title     || '',
    date:         meeting?.date      || '',
    time:         meeting?.time      || '',
    location:     meeting?.location  || '',
    duration:     meeting?.duration  || 60,
    organizer:    meeting?.organizer || '',
    participants: Array.isArray(meeting?.participants)
      ? meeting.participants.map(participantLabel).join(', ') : '',
    agenda: Array.isArray(meeting?.agenda)
      ? meeting.agenda.map(agendaText).join('\n') : '',
  });

  const save = () => {
    if (!form.title.trim() || !form.date) return;
    onSave({
      title:        form.title.trim(),
      date:         form.date,
      time:         form.time,
      location:     form.location.trim(),
      duration:     Number(form.duration) || 60,
      organizer:    form.organizer.trim(),
      participants: form.participants.split(',').map(p => p.trim()).filter(Boolean),
      agenda:       form.agenda.split('\n').map(a => a.trim()).filter(Boolean),
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Modifier la réunion" width={560}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <FormLabel required>Titre</FormLabel>
          <Field value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Titre de la réunion" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <FormLabel required>Date</FormLabel>
            <Field type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div>
            <FormLabel>Heure</FormLabel>
            <Field type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <FormLabel>Lieu</FormLabel>
            <Field value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Salle, visio…" />
          </div>
          <div>
            <FormLabel>Durée (min)</FormLabel>
            <Field type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} min={5} />
          </div>
        </div>
        <div>
          <FormLabel>Organisateur</FormLabel>
          <Field value={form.organizer} onChange={e => setForm(f => ({ ...f, organizer: e.target.value }))} />
        </div>
        <div>
          <FormLabel hint="séparés par virgule">Participants</FormLabel>
          <Field value={form.participants} onChange={e => setForm(f => ({ ...f, participants: e.target.value }))} />
        </div>
        <div>
          <FormLabel hint="un point par ligne">Ordre du jour</FormLabel>
          <Field as="textarea" value={form.agenda} onChange={e => setForm(f => ({ ...f, agenda: e.target.value }))} rows={4} style={{ resize: 'vertical', lineHeight: 1.7 }} />
        </div>
        <ModalFooter onCancel={onClose} onConfirm={save} cancelLabel="Annuler" confirmLabel="Enregistrer" />
      </div>
    </Modal>
  );
}

/* ═══════════════════════════════════════════════════════════
   NOT FOUND
═══════════════════════════════════════════════════════════ */
function NotFound({ onBack }) {
  return (
    <div style={{ textAlign: 'center', padding: '80px 24px', maxWidth: 400, margin: '0 auto' }}>
      <div style={{
        width: 56, height: 56, borderRadius: T.r12, margin: '0 auto 20px',
        background: T.danb, border: `1px solid ${T.danr}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.dan,
      }}><Ic.warn /></div>
      <p style={{ fontSize: 16, fontWeight: 700, color: T.t1, marginBottom: 8, fontFamily: 'var(--font-sans)' }}>
        Réunion introuvable
      </p>
      <p style={{ fontSize: 13, color: T.t3, marginBottom: 24, lineHeight: 1.6 }}>
        Cet identifiant ne correspond à aucune réunion enregistrée.
      </p>
      <GhostBtn onClick={onBack}><Ic.back /> Retour aux réunions</GhostBtn>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MEETING DETAIL — export default
═══════════════════════════════════════════════════════════ */
export default function MeetingDetail() {
  useStyles();

  const { id }       = useParams();
  const navigate     = useNavigate();
  const { addToast } = useNotif();
  const { meetings, cancel, postpone, reschedule, addMinutes, markDone, update } = useMeetings();
  const { isAdmin, peutRedigerCR, peutVoirToutesTaches } = usePermissions();
  const { user } = useAuth();

  /* ── State ── */
  const [cancelModal,   setCancelModal]   = useState(false);
  const [postponeModal, setPostponeModal] = useState(false);
  const [editModal,     setEditModal]     = useState(false);
  const [showCREditor,  setShowCREditor]  = useState(false);
  const [cancelReason,  setCancelReason]  = useState('');
  const [postponeForm,  setPostponeForm]  = useState({ date: '', time: '', reason: '' });
  const [copied,        setCopied]        = useState(false);
  const [localCR,       setLocalCR]       = useState(null);
  const [crLoading,     setCrLoading]     = useState(true);
  const [wordLoading,   setWordLoading]   = useState(false);

  /* ── Données dérivées ── */
  const meeting = useMemo(
    () => meetings.find(m => String(m.id) === String(id)),
    [meetings, id],
  );

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const fetchCR = useCallback(async (showLoader = false) => {
  if (!id) return;

  const token = localStorage.getItem('xamio_token');
  if (!token) return;

  if (showLoader) setCrLoading(true);

  try {
    const res = await fetch(`${API_BASE}/reunions/${id}/compte-rendu`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    // 🔒 401 / 403 ≠ logout
    if (res.status === 401 || res.status === 403) {
      setLocalCR(null);
      return;
    }

    if (!res.ok) {
      setLocalCR(null);
      return;
    }

    const json = await res.json();
    const data = json?.data;

    setLocalCR(data ? normalizeCR(data, id) : null);

  } catch (err) {
    console.error('Erreur fetch CR:', err);
    setLocalCR(null);
  } finally {
    if (showLoader) setCrLoading(false);
  }
}, [id]);

// ← Polling moins agressif : 60s au lieu de 10s
useEffect(() => {
  const interval = setInterval(fetchCR, 60_000);
  return () => clearInterval(interval);
}, [fetchCR]);

  useEffect(() => { fetchCR(true); }, [fetchCR]);


  /* ── CR effectif ── */
  const cr = useMemo(() => {
    const raw = localCR;
    if (!raw) return null;
    const decisions = Array.isArray(raw.decisions) ? raw.decisions : [];
    const actions   = Array.isArray(raw.actions)   ? raw.actions   : [];
    return {
      ...raw,
      decisions: decisions.map(d =>
        typeof d === 'string' ? d : (d.text ?? d.dec_intitule ?? '')
      ),
      actions: actions.map(a =>
        typeof a === 'string' ? { title: a } : a
      ),
    };
  }, [localCR]);

  const visibleActions = useMemo(() => {
  if (!cr?.actions) return [];
  if (peutVoirToutesTaches) return cr.actions;
  return cr.actions.filter(a =>
    a.user_id === user?.id ||
    a.assignee === user?.name ||
    a.assignee === (user?.prenom + ' ' + user?.nom).trim()
  );
}, [cr, peutVoirToutesTaches, user]);

const crFiltered = useMemo(() => {
  if (!cr) return null;
  return { ...cr, actions: visibleActions };
}, [cr, visibleActions]);

  /* ── Statuts ── */
  const isEnCours    = meeting?.status === 'en_cours';
  const isPostponed  = meeting?.status === 'reportee';
  const isCancelled  = meeting?.status === 'annulee';
  const isDone       = meeting?.status === 'terminee';
  const hasCR        = !crLoading && !!cr;
  const canAddCR     = isDone || isEnCours;


  const peutModifier = !isCancelled && !isDone;
  const peutAnnuler  = !isCancelled && (!isDone || isAdmin);
  const participants = (meeting?.participant_reunions || meeting?.participants || [])
    .filter(p => {
      // Exclure l'organisateur de la liste des participants pour éviter le doublon
      if (!meeting?.organizer_id) return true;
      return String(p.user_id) !== String(meeting.organizer_id);
    });

  // ✅ Organisateur affiché séparément comme premier participant virtuel
  const organizerEntry = meeting?.organizer ? {
    _isOrganizer:  true,
    name:          meeting.organizer,
    email:         meeting.organizer_email || '',
    part_statut:   'organisateur',
    part_statut_invitation: 'accepte',
    user_id:       meeting.organizer_id || null,
  } : null;

  /* ── Titre du card éditeur CR ── */
  const crEditorTitle = !hasCR
    ? 'Générer le compte rendu'
    : cr?.has_file
      ? 'Analyser le compte rendu importé'
      : 'Mettre à jour le compte rendu';

  /* ── Handlers ── */
  const handleCancel = useCallback(async () => {
    if (!meeting) return;
    try {
      await cancel(meeting.id, cancelReason);
      addToast('Réunion annulée.', 'warning');
    } catch (e) {
      addToast(e?.message || "Erreur lors de l'annulation.", 'error');
    } finally {
      setCancelModal(false);
      setCancelReason('');
    }
  }, [meeting, cancelReason, cancel, addToast]);

  const handlePostpone = useCallback(async () => {
    if (!meeting) return;
    if (!postponeForm.date) { addToast('Date requise.', 'error'); return; }
    try {
      await postpone(meeting.id, postponeForm.date, postponeForm.time, postponeForm.reason);
      addToast('Réunion reportée.', 'info');
    } catch (e) {
      addToast(e?.message || 'Erreur lors du report.', 'error');
    } finally {
      setPostponeModal(false);
      setPostponeForm({ date: '', time: '', reason: '' });
    }
  }, [meeting, postponeForm, postpone, addToast]);

  const handleMarkDone = useCallback(async () => {
    if (!meeting) return;
    try {
      if (isPostponed) {
        await reschedule(meeting.id);
        addToast('Créneau confirmé.', 'success');
      } else {
        await markDone(meeting.id);
        addToast('Réunion terminée.', 'success');
      }
    } catch (e) {
      addToast(e?.message || 'Erreur.', 'error');
    }
  }, [meeting, isPostponed, reschedule, markDone, addToast]);

  const handleEdit = useCallback(data => {
    if (!meeting) return;
    update(meeting.id, data);
    addToast('Réunion modifiée.', 'success');
    setEditModal(false);
  }, [meeting, update, addToast]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      addToast('Lien copié !', 'success');
      setTimeout(() => setCopied(false), 2200);
    });
  }, [addToast]);

  /* ── Téléchargement Word du CR existant ── */
  const handleDownloadWord = useCallback(async () => {
    if (!cr || !meeting) return;
    setWordLoading(true);
    try {
      const blob     = await generateCRWord(cr, meeting);
      const url      = URL.createObjectURL(blob);
      const filename = `CR_${(meeting.title || 'reunion').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.docx`;
      const a        = document.createElement('a');
      a.href         = url;
      a.download     = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      addToast('Fichier Word téléchargé.', 'success');
    } catch (e) {
      addToast('Erreur lors de la génération Word.', 'error');
      console.error(e);
    } finally {
      setWordLoading(false);
    }
  }, [cr, meeting, addToast]);

  /* ── Après sauvegarde CR ── */
  const handleCRSaved = useCallback(async (result) => {
    const immediateDecisions = Array.isArray(result.decisions) ? result.decisions : [];
    const immediateTasks = Array.isArray(result.tasks) ? result.tasks :
                           Array.isArray(result.actions) ? result.actions : [];

    const immediateCR = {
      meetingId:     String(meeting?.id),
      summary:       result.summary ?? '',
      decisions:     immediateDecisions,
      // ✅ Mapper tasks → actions, en gérant les deux formats possibles
      actions:       immediateTasks
        .filter(t => {
          const title = typeof t === 'string' ? t : (t.title ?? t.text ?? '');
          return title.trim() !== '';
        })
        .map(t =>
          typeof t === 'string'
            ? { title: t, assignee: null, due: null }
            : {
                title:    t.title    ?? t.text ?? '',
                // assignee peut être un nom (string) ou null
                assignee: t.assignee ?? null,
                due:      t.due      ?? null,
              }
        ),
      generatedByAI: true,
      has_file:      result.has_file ?? false,
      createdAt:     new Date().toISOString(),
    };

    setCrLoading(false);
    setLocalCR(immediateCR);
    setShowCREditor(false);
    addToast('Compte rendu enregistré.', 'success');

    // Refetch après 2s pour synchroniser avec la BDD
    setTimeout(async () => {
      try {
        const token = localStorage.getItem('xamio_token');
        const res = await fetch(`/api/reunions/${meeting?.id}/compte-rendu`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        });
        if (res.ok) {
          const { data } = await res.json();
          if (data) {
            const refreshed = normalizeCR(data, meeting?.id);
            // ✅ Si le backend a bien sauvegardé des actions, on utilise sa version
            // Sinon on garde l'état local (cas des tâches sans user_id ignorées par le backend)
            setLocalCR(prev => {
              const hasLocalActions = prev?.actions?.length > 0;
              const hasRemoteActions = refreshed?.actions?.length > 0;
              if (hasLocalActions && !hasRemoteActions) return prev;
              return refreshed;
            });
          }
        }
      } catch { /* non bloquant */ }
    }, 2000);
  }, [meeting, addToast]);

  if (!meeting) return <NotFound onBack={() => navigate('/meetings')} />;

  /* ── Actions dropdown ── */
  const secondaryActions = [
    ...(peutModifier ? [{ icon: <Ic.edit />,     label: 'Modifier la réunion', fn: () => setEditModal(true)     }] : []),
    ...(peutModifier ? [{ icon: <Ic.postpone />, label: 'Reporter',             fn: () => setPostponeModal(true) }] : []),
    { icon: <Ic.link  />, label: copied ? 'Lien copié !' : 'Copier le lien', fn: handleCopyLink },
    { icon: <Ic.share />, label: 'Partager aux participants', fn: () => addToast('Partagé !', 'success') },
    ...(hasCR ? [{ icon: <Ic.doc />, label: wordLoading ? 'Génération…' : 'Télécharger en Word', fn: handleDownloadWord }] : []),
    ...(peutAnnuler ? [
      { sep: true },
      { icon: <Ic.trash />, label: 'Annuler la réunion', fn: () => setCancelModal(true), danger: true },
    ] : []),
  ];

  const primaryAction = isPostponed
    ? <PrimaryBtn small onClick={handleMarkDone}><Ic.check /> Confirmer le créneau</PrimaryBtn>
    : null;

  /* ═══════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════ */
  return (
    <div className="xmd-page" style={{ fontFamily: 'var(--font-sans)', maxWidth: '100%', overflowX: 'hidden' }}>

      {/* ── Navigation ── */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 20 }}>
        <button
          className="xmd-nav-back"
          onClick={() => navigate('/meetings')}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'none', border: 'none', cursor: 'pointer',
            color: T.t3, fontSize: 12.5, padding: 0,
            fontFamily: 'var(--font-sans)', transition: 'color .13s',
          }}
        >
          <Ic.back /> Réunions
        </button>
        <span style={{ color: T.bd1 }}>/</span>
        <span style={{
          fontSize: 12.5, color: T.t3,
          maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{meeting.title}</span>
      </nav>

      {/* ── Header carte ── */}
      <div className="xmd-s1" style={{
        marginBottom: 16, padding: '20px 24px',
        background: T.bg1, border: `1px solid ${T.bd0}`,
        borderRadius: T.r16, position: 'relative', overflow: 'hidden',
      }}>
        {isEnCours && (
          <div style={{
            position: 'absolute', left: 0, top: 0, width: 3, height: '100%',
            background: T.acc, animation: 'xmd-pulse 2s ease infinite',
          }} />
        )}
        <div style={{
          display: 'flex', alignItems: 'flex-start',
          justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 11, flexWrap: 'wrap' }}>
              <StatusPill statusKey={meeting.status} size="md" />
              {hasCR && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '3px 10px', borderRadius: T.r20,
                  background: T.purb, border: `1px solid ${T.purr}`,
                  fontSize: 11, fontWeight: 600, color: T.pur,
                }}><Ic.doc /> CR disponible</span>
              )}
            </div>
            <h1 style={{
              fontSize: 22, fontWeight: 700, letterSpacing: '-.5px',
              lineHeight: 1.25, margin: '0 0 12px', color: isCancelled ? T.t3 : T.t1,
              textDecoration: isCancelled ? 'line-through' : 'none',
              opacity: isCancelled ? .5 : 1, fontFamily: 'var(--font-sans)',
            }}>{meeting.title}</h1>
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: T.t3, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-mono)' }}>
                <Ic.cal /> {fmtDateLong(meeting.date)}
              </span>
              {meeting.time && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-mono)' }}>
                  <Ic.clk /> {meeting.time}
                  {meeting.duration && (
                    <span style={{ opacity: .6, fontFamily: 'var(--font-sans)' }}>· {meeting.duration} min</span>
                  )}
                </span>
              )}
              {meeting.location && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Ic.loc /> {meeting.location}
                </span>
              )}
              {meeting.organizer && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Avatar name={meeting.organizer} size={16} />
                  {meeting.organizer}
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexShrink: 0 }}>
            {hasCR && !isCancelled && (
              <GhostBtn small onClick={handleDownloadWord} disabled={wordLoading}>
                <Ic.doc /> {wordLoading ? 'Génération…' : 'Word'}
              </GhostBtn>
            )}
            {!isCancelled && peutRedigerCR && (
              <>
            {primaryAction}
            <ActionDropdown items={secondaryActions} />
          </>
        )}
          </div>
        </div>
      </div>

      {/* ── Bannières contextuelles ── */}
      {isEnCours && (
        <Banner icon={<Ic.lightning />} title="Réunion en cours" fg={T.acc} bg={T.accm} border={T.accb} />
      )}
      {isPostponed && meeting.postponedTo && (
        <Banner
          icon={<Ic.postpone />}
          title={`Reportée au ${fmtDate(meeting.postponedTo.date)}${meeting.postponedTo.time ? ` à ${meeting.postponedTo.time}` : ''}`}
          subtitle={meeting.postponeReason ? `Motif : ${meeting.postponeReason}` : undefined}
          fg={T.pur} bg={T.purb} border={T.purr}
        />
      )}
      {isCancelled && (
        <Banner
          icon={<Ic.warn />} title="Réunion annulée"
          subtitle={meeting.cancelReason ? `Motif : ${meeting.cancelReason}` : undefined}
          fg={T.dan} bg={T.danb} border={T.danr}
        />
      )}

      {/* ── Layout 2 colonnes ── */}
      <div className="xmd-layout">

        {/* ── Colonne principale ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>

          {/* Ordre du jour */}
          <Card title="Ordre du jour" icon={<Ic.doc />} className="xmd-s2">
            {!meeting.agenda?.length
              ? <p style={{ fontSize: 13, color: T.t3, fontStyle: 'italic', margin: 0 }}>
                  Aucun point d'ordre du jour défini.
                </p>
              : meeting.agenda.map((it, i) => (
                  <AgendaItem key={it.id || i} index={i + 1} text={agendaText(it)} />
                ))
            }
          </Card>

          {/* Skeleton pendant le chargement du CR */}
          {crLoading && (
            <div style={{
              padding: '20px 20px', borderRadius: T.r14,
              background: T.bg1, border: `1px solid ${T.bd0}`,
            }}>
              {[80, 60, 90, 50].map((w, i) => (
                <div key={i} style={{
                  height: 12, borderRadius: 6, marginBottom: 10,
                  width: `${w}%`, background: T.bd0,
                  animation: 'xmd-pulse 1.4s ease infinite',
                  animationDelay: `${i * 0.1}s`,
                }} />
              ))}
            </div>
          )}

          {/* CR existant — toujours visible si disponible */}
          {(hasCR || localCR) && cr && (
            <CRView
              cr={crFiltered}
              onEdit={peutRedigerCR ? () => setShowCREditor(true) : undefined}
              onAnalyze={peutRedigerCR ? () => setShowCREditor(true) : undefined}
              onDownloadWord={handleDownloadWord}
              wordLoading={wordLoading}
              meetingId={meeting.id}
            />
          )}

          {/* ── Éditeur CR ──
              Affiché uniquement quand l'utilisateur clique "Modifier" ou "Analyser"
              (showCREditor = true), ou quand il n'y a pas encore de CR (!hasCR).
              PAS de || cr?.has_file ici pour éviter l'affichage automatique. */}
          {!crLoading && canAddCR && peutRedigerCR && (!hasCR || showCREditor) && (
            <div className="xmd-s3">
              <Card
                title={crEditorTitle}
                icon={<Ic.ai />}
                accent={T.pur}
              >
                {/* Bouton "Annuler" : visible seulement en mode Modifier (pas en mode Analyser) */}
                {hasCR && showCREditor && !cr?.has_file && (
                  <div style={{ marginBottom: 12 }}>
                    <GhostBtn small onClick={() => setShowCREditor(false)}>
                      ← Annuler la modification
                    </GhostBtn>
                  </div>
                )}
                {/* En mode Analyser (has_file = true), on peut aussi annuler */}
                {hasCR && showCREditor && cr?.has_file && (
                  <div style={{ marginBottom: 12 }}>
                    <GhostBtn small onClick={() => setShowCREditor(false)}>
                      ← Annuler
                    </GhostBtn>
                  </div>
                )}
                <MeetingCR
                  meeting={meeting}
                  onSaved={handleCRSaved}
                  hasExistingFile={!!cr?.has_file}
                />
              </Card>
            </div>
          )}

          {/* Placeholder avant la réunion */}
          {!canAddCR && !isCancelled && (
            <div className="xmd-s4" style={{
              padding: '14px 16px',
              background: T.bg1, border: `1px solid ${T.bd0}`,
              borderRadius: T.r14, display: 'flex', alignItems: 'center', gap: 13,
            }}>
              <span style={{
                width: 34, height: 34, borderRadius: T.r8, flexShrink: 0,
                background: T.purb, border: `1px solid ${T.purr}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: T.pur, lineHeight: 0,
              }}><Ic.ai /></span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: T.t1, marginBottom: 3 }}>
                  Compte rendu IA disponible après la réunion
                </p>
                <p style={{ fontSize: 12, color: T.t3, margin: 0, lineHeight: 1.55 }}>
                  Marquez la réunion comme terminée pour activer la génération.
                </p>
              </div>
            </div>
          )}

          <ActivityFeed meeting={meeting} />
        </div>

        {/* ── Sidebar ── */}
        <div className="xmd-sidebar">

          <Card title="Informations" icon={<Ic.cal />} className="xmd-s1">
            <SideMeta icon={<Ic.cal  />} label="Date"          value={fmtDateLong(meeting.date)} />
            <SideMeta icon={<Ic.clk  />} label="Heure & durée" value={`${meeting.time || '—'} · ${meeting.duration || 60} min`} mono highlight={isEnCours} />
            <SideMeta icon={<Ic.loc  />} label="Lieu"          value={meeting.location} />
            <SideMeta icon={<Ic.user />} label="Organisateur"  value={meeting.organizer} />
          </Card>

          <ParticipantsCard
            participants={participants}
            organizer={organizerEntry}
          />

          {!isCancelled && peutRedigerCR && (
            <Card title="Actions rapides" icon={<Ic.lightning />} className="xmd-s3" collapsible>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {peutModifier && (
                  <SideBtn icon={<Ic.edit />}     label="Modifier la réunion" onClick={() => setEditModal(true)} />
                )}
                {peutModifier && (
                  <SideBtn icon={<Ic.postpone />} label="Reporter"             onClick={() => setPostponeModal(true)} />
                )}
                {!isDone && !isPostponed && (
                  <SideBtn icon={<Ic.check />} label="Marquer comme terminée" onClick={handleMarkDone} />
                )}
                {isPostponed && (
                  <SideBtn icon={<Ic.check />} label="Confirmer le créneau"   onClick={handleMarkDone} />
                )}
                <SideBtn
                  icon={<Ic.link />}
                  label={copied ? 'Lien copié !' : 'Copier le lien'}
                  onClick={handleCopyLink}
                />
                {hasCR && (
                  <SideBtn
                    icon={<Ic.doc />}
                    label={wordLoading ? 'Génération…' : 'Télécharger en Word'}
                    onClick={handleDownloadWord}
                  />
                )}
                {peutAnnuler && (
                  <>
                    <div style={{ height: 1, background: T.bd0, margin: '2px 0' }} />
                    <SideBtn
                      icon={<Ic.trash />}
                      label="Annuler la réunion"
                      onClick={() => setCancelModal(true)}
                      danger
                    />
                  </>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      <EditModal
        open={editModal}
        onClose={() => setEditModal(false)}
        meeting={meeting}
        onSave={handleEdit}
      />

      <Modal open={cancelModal} onClose={() => setCancelModal(false)} title="Annuler la réunion" width={460}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          <div style={{ padding: '11px 13px', borderRadius: T.r10, background: T.danb, border: `1px solid ${T.danr}` }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: T.dan, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Ic.warn /> {meeting.title}
            </p>
            <p style={{ fontSize: 12, color: T.t3, lineHeight: 1.6, margin: 0 }}>
              Action irréversible. Un email sera envoyé à tous les participants.
            </p>
          </div>
          <div>
            <FormLabel>Motif d'annulation</FormLabel>
            <Field
              as="textarea"
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="Raison (facultatif)…"
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>
          <ModalFooter
            onCancel={() => setCancelModal(false)}
            onConfirm={handleCancel}
            cancelLabel="Conserver"
            confirmLabel="Annuler la réunion"
            danger
          />
        </div>
      </Modal>

      <Modal open={postponeModal} onClose={() => setPostponeModal(false)} title="Reporter la réunion" width={480}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          <div style={{ padding: '11px 13px', borderRadius: T.r10, background: T.accm, border: `1px solid ${T.accb}` }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: T.acc, margin: 0 }}>{meeting.title}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <FormLabel required>Nouvelle date</FormLabel>
              <Field
                type="date"
                value={postponeForm.date}
                onChange={e => setPostponeForm(f => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div>
              <FormLabel>Nouvel horaire</FormLabel>
              <Field
                type="time"
                value={postponeForm.time}
                onChange={e => setPostponeForm(f => ({ ...f, time: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <FormLabel>Motif du report</FormLabel>
            <Field
              as="textarea"
              value={postponeForm.reason}
              onChange={e => setPostponeForm(f => ({ ...f, reason: e.target.value }))}
              placeholder="Raison (facultatif)…"
              rows={2}
              style={{ resize: 'vertical' }}
            />
          </div>
          <ModalFooter
            onCancel={() => setPostponeModal(false)}
            onConfirm={handlePostpone}
            cancelLabel="Annuler"
            confirmLabel="Valider le report"
          />
        </div>
      </Modal>
    </div>
  );
}