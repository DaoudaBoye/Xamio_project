/**
 * Xamio — _shared.jsx
 * Tokens, icônes, helpers et atomes partagés
 * Importé par MeetingDetail.jsx et CompteRenduSection.jsx
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════════
   TOKENS
═══════════════════════════════════════════════════════════ */
export const T = {
  bg1:'var(--color-background-secondary)',
  bg2:'var(--color-background-tertiary)',
  bg3:'var(--color-background-elevated)',
  bd0:'var(--color-border)',
  bd1:'var(--color-border-medium)',
  bd2:'var(--color-border-strong)',
  t1:'var(--color-text-primary)',
  t2:'var(--color-text-secondary)',
  t3:'var(--color-text-muted)',
  acc:'var(--color-warning)',
  acc2:'var(--color-warning)',
  accm:'var(--color-warning-bg)',
  accb:'var(--color-warning-border)',
  dan:'var(--color-danger)',
  danb:'var(--color-danger-bg)',
  danr:'var(--color-danger-border)',
  suc:'var(--color-success)',
  sucb:'var(--color-success-bg)',
  sucr:'var(--color-success-border)',
  pur:'var(--color-purple)',
  purb:'var(--color-purple-bg)',
  purr:'var(--color-purple-border)',
  acc2c:'var(--color-accent)',
  acc2b:'var(--color-accent-bg)',
  acc2r:'var(--color-accent-border)',
  sdrop:'var(--shadow-dropdown)',
  smod:'var(--shadow-modal)',
  status:{
    planifiee:{ label:'À venir',   fg:'var(--color-accent)', bg:'var(--color-accent-bg)', dot:'var(--color-accent)', border:'var(--color-accent-border)' },
    imminente:{ label:'Imminente', fg:'var(--color-warning)',bg:'var(--color-warning-bg)',dot:'var(--color-warning)',border:'var(--color-warning-border)' },
    en_cours: { label:'En cours',  fg:'var(--color-warning)',bg:'var(--color-warning-bg)',dot:'var(--color-warning)',border:'var(--color-warning-border)' },
    terminee: { label:'Terminée',  fg:'var(--color-success)',bg:'var(--color-success-bg)',dot:'var(--color-success)',border:'var(--color-success-border)' },
    annulee:  { label:'Annulée',   fg:'var(--color-danger)', bg:'var(--color-danger-bg)', dot:'var(--color-danger)', border:'var(--color-danger-border)' },
    reportee: { label:'Reportée',  fg:'var(--color-purple)', bg:'var(--color-purple-bg)', dot:'var(--color-purple)', border:'var(--color-purple-border)' },
  },
  inv:{
    accepte:   { label:'Accepté',   fg:'var(--color-success)',bg:'var(--color-success-bg)',border:'var(--color-success-border)',dot:'var(--color-success)' },
    refuse:    { label:'Refusé',    fg:'var(--color-danger)', bg:'var(--color-danger-bg)', border:'var(--color-danger-border)', dot:'var(--color-danger)' },
    en_attente:{ label:'En attente',fg:'var(--color-warning)',bg:'var(--color-warning-bg)',border:'var(--color-warning-border)',dot:'var(--color-warning)' },
    externe:   { label:'Externe',   fg:'var(--color-text-muted)',bg:'var(--color-background-elevated)',border:'var(--color-border)',dot:'var(--color-border-medium)' },
  },
  part:{
    present: { label:'Présent', fg:'var(--color-success)',bg:'var(--color-success-bg)',border:'var(--color-success-border)' },
    confirme:{ label:'Confirmé',fg:'var(--color-accent)', bg:'var(--color-accent-bg)', border:'var(--color-accent-border)' },
    invite:  { label:'Invité',  fg:'var(--color-text-muted)',bg:'var(--color-background-elevated)',border:'var(--color-border)' },
    refuse:  { label:'Refusé',  fg:'var(--color-danger)', bg:'var(--color-danger-bg)', border:'var(--color-danger-border)' },
    externe: { label:'Externe', fg:'var(--color-purple)', bg:'var(--color-purple-bg)', border:'var(--color-purple-border)' },
  },
  r6:'var(--radius-medium)', r8:'var(--radius-large)', r10:'10px',
  r12:'var(--radius-xlarge)', r14:'14px', r16:'16px', r20:'20px',
};

/* ═══════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════ */
export const fmtDate     = str => { if(!str)return'—'; const[y,m,d]=str.toString().split('T')[0].split('-'); return`${d}/${m}/${y}`; };
export const fmtDateLong = str => { if(!str)return'—'; return new Date(str).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}); };
export const initials    = (n='') => n.split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase();
export const hashColor   = (s='') => { let h=0; for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))&0xffffffff; return['#2E70D9','#E07B2A','#3D9A6F','#7B60C8','#B0443A','#2A8FA8','#C85070','#4A8C4A'][Math.abs(h)%8]; };
export const agendaText       = it => !it?'':typeof it==='string'?it:it.text||it.poj_intitule||'';
export const participantLabel = p  => !p ?'':typeof p ==='string'?p :p.nom||p.ext_nom||p.email||p.ext_email||p.contact_nom||'';
export const getInvSt  = p => { if(typeof p==='object'&&p.type==='external')return'externe'; return(typeof p==='object'?p.part_statut_invitation:null)||'en_attente'; };
export const getPartSt = p => { if(typeof p==='object'&&p.type==='external')return'externe'; return(typeof p==='object'?p.part_statut:null)||'invite'; };
export const isExternal= p => typeof p==='object'&&p.type==='external';
export const fmtSize   = b => b<1024*1024?`${(b/1024).toFixed(0)} Ko`:`${(b/(1024*1024)).toFixed(1)} Mo`;
export const estimateDuration = (bytes,ext) => { const kbps={mp3:128,wav:1411,m4a:128,ogg:80,webm:32}[ext]||128; const m=(bytes*8)/(kbps*1000*60); if(m<1)return'< 1 min'; if(m<60)return`~${Math.round(m)} min`; return`~${Math.floor(m/60)}h${Math.round(m%60).toString().padStart(2,'0')}`; };

/* ═══════════════════════════════════════════════════════════
   HOOKS
═══════════════════════════════════════════════════════════ */
export function useHover(){ const[h,s]=useState(false); return[h,{onMouseEnter:()=>s(true),onMouseLeave:()=>s(false)}]; }
export function useOutsideClick(ref,cb){
  useEffect(()=>{
    const fn=e=>{if(ref.current&&!ref.current.contains(e.target))cb();};
    document.addEventListener('mousedown',fn);
    return()=>document.removeEventListener('mousedown',fn);
  },[ref,cb]);
}

/* ═══════════════════════════════════════════════════════════
   ICONS
═══════════════════════════════════════════════════════════ */
export const Ic = {
  back:     ()=><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><polyline points="9,2 4,7 9,12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  cal:      ()=><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M5 1v3M11 1v3M2 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  clk:      ()=><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M8 5v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  loc:      ()=><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M8 1.5a4.5 4.5 0 014.5 4.5c0 3-4.5 8.5-4.5 8.5S3.5 9 3.5 6A4.5 4.5 0 018 1.5z" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.3"/></svg>,
  user:     ()=><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5.5" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M2 14c0-3.31 2.69-6 6-6s6 2.69 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  users:    ()=><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.4"/><path d="M1 14c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="11.5" cy="5" r="2" stroke="currentColor" strokeWidth="1.3"/><path d="M13.5 13c0-2-.9-3.76-2.26-5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  edit:     ()=><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M11 2l3 3-8 8H3v-3L11 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  trash:    ()=><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M3 5h10M6 5V3h4v2M5 5l.5 8h5L11 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  check:    ()=><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  doc:      ()=><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M4 2h6l3 3v9H4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M10 2v3h3M6 8h5M6 11h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  warn:     ()=><svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 2L14.5 13H1.5L8 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M8 7v3M8 11.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  lightning:()=><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M9 1L3 9h5l-1 6 6-8H8l1-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  postpone: ()=><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M8 5v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  share:    ()=><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><circle cx="12" cy="3" r="1.8" stroke="currentColor" strokeWidth="1.4"/><circle cx="12" cy="13" r="1.8" stroke="currentColor" strokeWidth="1.4"/><circle cx="4" cy="8" r="1.8" stroke="currentColor" strokeWidth="1.4"/><path d="M10.3 4l-4.6 3M10.3 12l-4.6-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  link:     ()=><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M7 9a3.5 3.5 0 005 0l2-2a3.5 3.5 0 00-5-5L7.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M9 7a3.5 3.5 0 00-5 0L2 9a3.5 3.5 0 005 5l1.5-1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  dots:     ()=><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="3" cy="8" r="1.4" fill="currentColor"/><circle cx="8" cy="8" r="1.4" fill="currentColor"/><circle cx="13" cy="8" r="1.4" fill="currentColor"/></svg>,
  close:    ()=><svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  activity: ()=><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M1 8h2l2-5 2 10 2-7 2 4 2-2h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  ai:       ()=><svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4"/><circle cx="8" cy="8" r="1.8" fill="currentColor"/><path d="M8 4.5v1.5M8 10v1.5M4.5 8H6M10 8h1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  spark:    ()=><svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M9 1L3 9h5l-1 6 6-8H8l1-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  notes:    ()=><svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M4 2h6l3 3v9H4z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M10 2v3h3M6 8h5M6 11h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  upload:   ()=><svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 11v2h10v-2M8 3v7M5.5 5.5L8 3l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  spin:     ()=><svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{animation:'xmd-spin .8s linear infinite'}}><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="20 18" strokeLinecap="round"/></svg>,
  copy:     ()=><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="8" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M3 11V3a1 1 0 011-1h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  save:     ()=><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M3 14V4l3-2h5l2 2v10H3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M6 14V9h4v5M6 2v4h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  dec:      ()=><svg width="9" height="9" viewBox="0 0 10 10" fill="none"><polyline points="2,5 4,7 8,3" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  act:      ()=><svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  susp:     ()=><svg width="10" height="10" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M8 5.5v3M8 10.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  info:     ()=><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4"/><path d="M8 7v5M8 5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  plus:     ()=><svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  word:     ()=><svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M4 2h6l3 3v9H4z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M10 2v3h3M5.5 8l1 4 1.5-3 1.5 3 1-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  chevron:  ()=><svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  mic:      ()=><svg width="12" height="12" viewBox="0 0 16 16" fill="none"><rect x="5" y="1" width="6" height="9" rx="3" stroke="currentColor" strokeWidth="1.5"/><path d="M3 8a5 5 0 0010 0M8 13v2M6 15h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  task:     ()=><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M5 8l2.5 2.5L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

/* ═══════════════════════════════════════════════════════════
   RIBBON ICONS (Word editor)
═══════════════════════════════════════════════════════════ */
export const I = {
  save:    <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M3 14V4l3-2h5l2 2v10H3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M6 14V9h4v5M6 2v4h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
  undo:    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 7V3M3 7h4M3 7a6 6 0 106 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  redo:    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M13 7V3M13 7H9M13 7a6 6 0 10-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  print:   <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 5V2h8v3M2 5h12v6H2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M4 8h8M4 11h5v3H4z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
  paste:   <svg width="22" height="22" viewBox="0 0 16 16" fill="none"><rect x="4" y="4" width="9" height="11" rx="1" fill="#e8f0fe" stroke="#4a90d9" strokeWidth="1.1"/><path d="M6 4V3a1 1 0 011-1h2a1 1 0 011 1v1M6 7h5M6 9.5h5M6 12h3" stroke="#4a90d9" strokeWidth="1" strokeLinecap="round"/></svg>,
  cut:     <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="5" cy="12" r="2" stroke="currentColor" strokeWidth="1.3"/><circle cx="11" cy="12" r="2" stroke="currentColor" strokeWidth="1.3"/><path d="M5 10L8 7l3-4M11 10L8 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  copy:    <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="8" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M3 11V3a1 1 0 011-1h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  format:  <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 3h7v2H3zM3 7h5M3 11h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M11 8l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  ul:      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="3" cy="5" r="1.2" fill="currentColor"/><circle cx="3" cy="9" r="1.2" fill="currentColor"/><circle cx="3" cy="13" r="1.2" fill="currentColor"/><path d="M6 5h8M6 9h8M6 13h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  ol:      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 3.5h2v4M2 7.5h2M2 10.5c0-1 2-1 2 0s-2 1-2 2h2M6 4h8M6 9h8M6 13h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  outdent: <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M6 8h8M2 12h12M7 6l-3 2 3 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  indent:  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h8M2 12h12M6 6l3 2-3 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  spacing: <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 4h8M4 8h8M4 12h8M2 4v2M2 12v-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  border:  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="1" stroke="currentColor" strokeWidth="1.4"/><path d="M2 8h12M8 2v12" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2"/></svg>,
  alL:     <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h8M2 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  alC:     <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M4 8h8M3 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  alR:     <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M6 8h8M4 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  alJ:     <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  shading: <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="8" rx="1" fill="#FFD666" stroke="currentColor" strokeWidth="1.2"/><path d="M2 13h12" stroke="#FFD666" strokeWidth="3" strokeLinecap="round"/></svg>,
  clear:   <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 13L13 3M6 3h7v7M9 7l4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  find:    <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4"/><path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  replace: <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="5.5" cy="5.5" r="3" stroke="currentColor" strokeWidth="1.3"/><path d="M7.5 7.5l1 1M10 10l4 4M3 9l2 2 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
  select:  <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="1" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 2"/><path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  table:   <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2 7h12M9 2v12M2 11h12" stroke="currentColor" strokeWidth="1.2"/></svg>,
  img:     <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><circle cx="5.5" cy="6.5" r="1" fill="currentColor"/><path d="M2 11l3.5-3 3 3 2-2 3 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  link:    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M7 9a3 3 0 004 0l2-2a3 3 0 00-4-4L7.5 4.5M9 7a3 3 0 00-4 0L3 9a3 3 0 004 4l1.5-1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  quote:   <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 7c0-2 1.5-3 3-3v2c-1 0-1.5.5-1.5 1.5V9H6v3H3V7zM9 7c0-2 1.5-3 3-3v2c-1 0-1.5.5-1.5 1.5V9H12v3H9V7z" fill="currentColor" opacity=".6"/></svg>,
  code:    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M5 4L1 8l4 4M11 4l4 4-4 4M9 3l-2 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  hr:      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  spin:    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{animation:'xmd-spin .8s linear infinite'}}><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="20 18" strokeLinecap="round"/></svg>,
  trash:   <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 5h10M6 5V3h4v2M5 5l.5 8h5L11 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  spark:   <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M9 1L3 9h5l-1 6 6-8H8l1-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  word:    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 2h6l3 3v9H4z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M10 2v3h3M5.5 8l1 4 1.5-3 1.5 3 1-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

/* ═══════════════════════════════════════════════════════════
   ATOMS
═══════════════════════════════════════════════════════════ */
export function Avatar({name='',size=24,external=false}){
  const c=external?T.pur:hashColor(name);
  return <span style={{width:size,height:size,borderRadius:'50%',background:c+'1A',border:`1.5px solid ${c}35`,display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:size*.37,fontWeight:700,color:c,flexShrink:0,lineHeight:1,fontFamily:'var(--font-sans)'}}>{external?'↗':initials(name)}</span>;
}

export function StatusPill({statusKey,size='sm'}){
  const c=T.status[statusKey]||T.status.planifiee;
  const live=statusKey==='en_cours';
  return <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:size==='md'?'5px 13px':'2px 9px',borderRadius:T.r20,background:c.bg,fontSize:size==='md'?12:10.5,fontWeight:600,color:c.fg,border:`1px solid ${c.border}`,whiteSpace:'nowrap'}}><span style={{width:size==='md'?6:5,height:size==='md'?6:5,borderRadius:'50%',background:c.dot,flexShrink:0,animation:live?'xmd-pulse 1.8s ease infinite':'none'}}/>{c.label}</span>;
}

export function PrimaryBtn({children,onClick,danger,small,disabled}){
  const[h,hp]=useHover();
  const bg=danger?(h?'var(--color-danger)':'var(--color-danger-bg)'):'var(--color-warning)';
  const color=danger?(h?'#fff':'var(--color-danger)'):'#fff';
  return <button onClick={onClick} disabled={disabled} {...hp} style={{display:'inline-flex',alignItems:'center',gap:6,padding:small?'6px 14px':'9px 18px',borderRadius:T.r8,border:danger?`1px solid ${T.danr}`:'none',background:disabled?T.bg3:bg,color:disabled?T.t3:color,fontSize:small?12:13,fontWeight:700,cursor:disabled?'not-allowed':'pointer',fontFamily:'var(--font-sans)',transition:'all .15s',whiteSpace:'nowrap',opacity:disabled?.6:1}}>{children}</button>;
}

export function PurpleBtn({children,onClick,disabled,small,loading}){
  const[h,hp]=useHover();
  return <button onClick={onClick} disabled={disabled||loading} {...hp} style={{display:'inline-flex',alignItems:'center',gap:7,padding:small?'6px 14px':'9px 20px',borderRadius:T.r8,border:'none',background:disabled||loading?T.bg3:'var(--color-purple)',color:disabled||loading?T.t3:'#fff',fontSize:small?12:13,fontWeight:700,cursor:disabled||loading?'not-allowed':'pointer',fontFamily:'var(--font-sans)',transition:'all .15s',whiteSpace:'nowrap',transform:h&&!disabled?'translateY(-1px)':'none',opacity:disabled?.5:1}}>{children}</button>;
}

export function GhostBtn({children,onClick,small,active,danger}){
  const[h,hp]=useHover();
  return <button onClick={onClick} {...hp} style={{display:'inline-flex',alignItems:'center',gap:6,padding:small?'5px 12px':'8px 16px',borderRadius:T.r8,border:`1px solid ${danger?T.danr:active||h?T.bd1:T.bd0}`,background:danger?(h?T.danb:'transparent'):active?T.bg3:h?T.bg2:'transparent',fontSize:small?12:13,fontWeight:450,color:danger?T.dan:h||active?T.t1:T.t2,cursor:'pointer',fontFamily:'var(--font-sans)',transition:'all .15s',whiteSpace:'nowrap'}}>{children}</button>;
}

export function SuccessBtn({children,onClick,small,disabled}){
  const[h,hp]=useHover();
  return <button onClick={onClick} disabled={disabled} {...hp} style={{display:'inline-flex',alignItems:'center',gap:6,padding:small?'5px 14px':'8px 18px',borderRadius:T.r8,border:`1px solid ${h?T.suc:T.sucr}`,background:h?T.suc:T.sucb,color:h?'#fff':T.suc,fontSize:small?12:13,fontWeight:700,cursor:disabled?'not-allowed':'pointer',fontFamily:'var(--font-sans)',transition:'all .15s',whiteSpace:'nowrap',opacity:disabled?.5:1}}>{children}</button>;
}

export function IconBtn({children,onClick,active,title,size=30}){
  const[h,hp]=useHover();
  return <button onClick={onClick} title={title} {...hp} style={{width:size,height:size,display:'flex',alignItems:'center',justifyContent:'center',background:active?T.bg3:h?T.bg2:'transparent',border:`1px solid ${active||h?T.bd1:'transparent'}`,borderRadius:T.r6,cursor:'pointer',flexShrink:0,color:active?T.t1:h?T.t2:T.t3,transition:'all .13s'}}>{children}</button>;
}

export function Field({as:As='input',style,...props}){
  const[f,sf]=useState(false);
  return <As {...props} style={{width:'100%',background:T.bg3,border:`1px solid ${f?T.bd2:T.bd0}`,borderRadius:T.r8,padding:As==='textarea'?'9px 13px':'0 13px',height:As==='textarea'?undefined:36,color:T.t1,fontSize:13,lineHeight:1.6,outline:'none',fontFamily:'var(--font-sans)',boxSizing:'border-box',transition:'border-color .15s,box-shadow .15s',boxShadow:f?`0 0 0 3px var(--color-warning-bg)`:'none',caretColor:'var(--color-warning)',...style}} onFocus={()=>sf(true)} onBlur={()=>sf(false)}/>;
}

export function FormLabel({children,required,hint}){
  return <label style={{display:'block',fontSize:12,fontWeight:500,color:T.t2,marginBottom:5}}>{children}{required&&<span style={{color:T.dan,marginLeft:3}}>*</span>}{hint&&<span style={{color:T.t3,fontWeight:400,marginLeft:6,fontSize:11}}>{hint}</span>}</label>;
}

export function Modal({open,onClose,title,width=520,children}){
  useEffect(()=>{ document.body.style.overflow=open?'hidden':''; return()=>{document.body.style.overflow='';}; },[open]);
  if(!open)return null;
  return <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,.48)',display:'flex',alignItems:'center',justifyContent:'center',padding:16,backdropFilter:'blur(5px)',animation:'xmd-mbg .16s ease'}}><div onClick={e=>e.stopPropagation()} style={{background:T.bg1,border:`1px solid ${T.bd1}`,borderRadius:T.r16,width:'100%',maxWidth:width,maxHeight:'calc(100dvh - 32px)',display:'flex',flexDirection:'column',boxShadow:T.smod,animation:'xmd-mbox .2s cubic-bezier(.22,1,.36,1)'}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',borderBottom:`1px solid ${T.bd0}`,flexShrink:0}}><h2 style={{fontSize:14,fontWeight:600,color:T.t1,margin:0,fontFamily:'var(--font-sans)'}}>{title}</h2><IconBtn onClick={onClose}><Ic.close/></IconBtn></div><div className="xmd-sb" style={{padding:20,overflowY:'auto',flex:1}}>{children}</div></div></div>;
}

export function ModalFooter({onCancel,onConfirm,cancelLabel='Annuler',confirmLabel='Confirmer',danger=false}){
  return <div style={{display:'flex',gap:8,justifyContent:'flex-end',paddingTop:20,borderTop:`1px solid ${T.bd0}`,marginTop:4}}><GhostBtn onClick={onCancel}>{cancelLabel}</GhostBtn><PrimaryBtn onClick={onConfirm} danger={danger}>{confirmLabel}</PrimaryBtn></div>;
}

export function Card({title,icon,accent,action,children,className='',noPad,collapsible}){
  const[collapsed,setCollapsed]=useState(false);
  const ac=accent||T.acc;
  return <div className={className} style={{background:T.bg1,border:`1px solid ${T.bd0}`,borderRadius:T.r14,overflow:'hidden'}}>{(title||action)&&<div onClick={collapsible?()=>setCollapsed(c=>!c):undefined} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderBottom:collapsed?'none':`1px solid ${T.bd0}`,cursor:collapsible?'pointer':'default'}}><div style={{display:'flex',alignItems:'center',gap:8}}>{icon&&<span style={{width:26,height:26,borderRadius:T.r6,flexShrink:0,background:ac+'16',border:`1px solid ${ac}22`,display:'flex',alignItems:'center',justifyContent:'center',color:ac,lineHeight:0}}>{icon}</span>}{title&&<span style={{fontSize:12.5,fontWeight:600,color:T.t1}}>{title}</span>}</div><div style={{display:'flex',alignItems:'center',gap:6}}>{action}{collapsible&&<span style={{color:T.t3,lineHeight:0,transform:collapsed?'rotate(-90deg)':'none',transition:'transform .2s'}}><Ic.chevron/></span>}</div></div>}{!collapsed&&(noPad?children:<div style={{padding:'14px 16px'}}>{children}</div>)}</div>;
}

export function DropBtn({icon,label,danger,onClick}){
  const[h,hp]=useHover();
  return <button onClick={onClick} {...hp} style={{width:'100%',display:'flex',alignItems:'center',gap:9,padding:'7px 10px',borderRadius:T.r6,border:'none',background:h?(danger?T.danb:T.bg3):'transparent',cursor:'pointer',fontSize:12.5,fontWeight:450,color:danger?T.dan:T.t2,fontFamily:'var(--font-sans)',textAlign:'left',transition:'all .1s'}}><span style={{lineHeight:0,opacity:.8,flexShrink:0}}>{icon}</span>{label}</button>;
}