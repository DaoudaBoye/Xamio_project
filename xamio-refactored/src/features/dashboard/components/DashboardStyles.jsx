import { useEffect } from 'react';

const CSS = `
  /* ═══════════════════════════════════════════
     DASHBOARD DESIGN SYSTEM v3
     Inspiré par Linear / Stripe / Vercel
  ═══════════════════════════════════════════ */
  :root {
    /* Brand */
    --c-brand:        #E8540A;
    --c-brand-hover:  #D14508;
    --c-brand-muted:  #FEF0E8;
    --c-brand-ring:   rgba(232,84,10,.15);

    /* Neutrals */
    --c-bg:           #F7F6F4;
    --c-surface:      #FFFFFF;
    --c-surface-2:    #F2F1EF;
    --c-surface-3:    #ECEAE7;

    /* Borders */
    --c-border:       rgba(16,15,10,.09);
    --c-border-md:    rgba(16,15,10,.14);
    --c-border-strong:rgba(16,15,10,.22);

    /* Text */
    --c-t1: #111109;
    --c-t2: #5C5B55;
    --c-t3: #9B9890;
    --c-t4: #C4C2BC;

    /* Semantic */
    --c-green:      #1B8F4C;  --c-green-bg:   #EDFAF3;  --c-green-border: #B8EDD3;  --c-green-text:  #0E6836;
    --c-amber:      #CC7D0A;  --c-amber-bg:   #FEF7E7;  --c-amber-border: #FAE1AC;  --c-amber-text:  #865110;
    --c-red:        #C42E2E;  --c-red-bg:     #FEF1F1;  --c-red-border:   #F9C8C8;  --c-red-text:    #8B1C1C;
    --c-blue:       #1A64CB;  --c-blue-bg:    #EDF4FE;  --c-blue-border:  #BAD5FB;  --c-blue-text:   #0D4B9F;
    --c-purple:     #6D4EE8;  --c-purple-bg:  #F2EFFD;  --c-purple-border:#D4C9F8;  --c-purple-text: #4933C4;
    --c-gray:       #9B9890;  --c-gray-bg:    #F4F3F1;  --c-gray-border:  #D9D7D2;  --c-gray-text:   #5C5B55;

    /* Shadows */
    --shadow-xs:  0 1px 2px rgba(16,15,10,.05);
    --shadow-sm:  0 1px 3px rgba(16,15,10,.07), 0 1px 2px rgba(16,15,10,.04);
    --shadow-md:  0 4px 12px rgba(16,15,10,.08), 0 1px 3px rgba(16,15,10,.05);
    --shadow-focus: 0 0 0 3px var(--c-brand-ring);

    /* Radius */
    --r-sm: 6px;
    --r-md: 8px;
    --r-lg: 10px;
    --r-xl: 14px;

    /* Spacing scale (4px base) */
    --sp-1: 4px;   --sp-2: 8px;   --sp-3: 12px;
    --sp-4: 16px;  --sp-5: 20px;  --sp-6: 24px;
    --sp-8: 32px;

    /* Motion */
    --ease-out:    cubic-bezier(.2,0,.2,1);
    --ease-spring: cubic-bezier(.34,1.56,.64,1);
    --dur-fast:    120ms;
    --dur-base:    180ms;
    --dur-slow:    260ms;
  }

  /* ═══════════════════════════════════════════
     DARK MODE OVERRIDES
  ═══════════════════════════════════════════ */
  [data-theme="dark"] {
    --c-bg:           #0F0F0E;
    --c-surface:      #1A1917;
    --c-surface-2:    #222120;
    --c-surface-3:    #2A2927;

    --c-border:       rgba(255,255,255,.08);
    --c-border-md:    rgba(255,255,255,.13);
    --c-border-strong:rgba(255,255,255,.20);

    --c-t1: #F2F1EE;
    --c-t2: #A8A6A0;
    --c-t3: #6B6965;
    --c-t4: #3E3D3B;

    --c-brand:        #F26522;
    --c-brand-hover:  #E8540A;
    --c-brand-muted:  rgba(232,84,10,.12);
    --c-brand-ring:   rgba(232,84,10,.20);

    --c-green:   #2ECC71; --c-green-bg:  rgba(46,204,113,.10);  --c-green-border: rgba(46,204,113,.22);  --c-green-text:  #2ECC71;
    --c-amber:   #F59E0B; --c-amber-bg:  rgba(245,158,11,.10);  --c-amber-border: rgba(245,158,11,.22);  --c-amber-text:  #F59E0B;
    --c-red:     #F87171; --c-red-bg:    rgba(248,113,113,.10); --c-red-border:   rgba(248,113,113,.22); --c-red-text:    #F87171;
    --c-blue:    #60A5FA; --c-blue-bg:   rgba(96,165,250,.10);  --c-blue-border:  rgba(96,165,250,.22);  --c-blue-text:   #60A5FA;
    --c-purple:  #A78BFA; --c-purple-bg: rgba(167,139,250,.10); --c-purple-border:rgba(167,139,250,.22); --c-purple-text: #A78BFA;
    --c-gray:    #6B6965; --c-gray-bg:   rgba(107,105,101,.10); --c-gray-border:  rgba(107,105,101,.22); --c-gray-text:   #A8A6A0;

    --shadow-xs: 0 1px 2px rgba(0,0,0,.3);
    --shadow-sm: 0 1px 3px rgba(0,0,0,.4), 0 1px 2px rgba(0,0,0,.3);
    --shadow-md: 0 4px 12px rgba(0,0,0,.5), 0 1px 3px rgba(0,0,0,.3);
  }

  /* ── Page layout ── */
  .db-page {
    width: 100%;
    max-width: 1140px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
    padding-bottom: var(--sp-8);
  }

  .db-layout {
    display: grid;
    grid-template-columns: minmax(0,1fr) 256px;
    gap: var(--sp-4);
    align-items: start;
  }
  @media (max-width: 900px) {
    .db-layout { grid-template-columns: 1fr; }
  }

  .db-left {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
    min-width: 0;
  }

  /* ── Section header ── */
  .db-sh {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--sp-2);
  }
  .db-sh-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .08em;
    text-transform: uppercase;
    color: var(--c-t3);
  }
  .db-sh-action {
    font-size: 12px;
    color: var(--c-t3);
    background: none;
    border: none;
    cursor: pointer;
    padding: var(--sp-1) var(--sp-2);
    border-radius: var(--r-sm);
    font-family: inherit;
    transition: color var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out);
  }
  .db-sh-action:hover {
    color: var(--c-t1);
    background: var(--c-surface-2);
  }

  /* ── Card ── */
  .db-card {
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    border-radius: var(--r-xl);
    box-shadow: var(--shadow-xs);
    overflow: hidden;
  }

  /* ── KPI grid ── */
  .db-kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--sp-3);
  }
  @media (max-width: 800px) {
    .db-kpi-grid { grid-template-columns: repeat(2, 1fr); }
  }

  /* ── KPI Card ── */
  .db-kpi {
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    border-radius: var(--r-lg);
    padding: 10px 14px 10px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    box-shadow: var(--shadow-xs);
    transition:
      box-shadow var(--dur-base) var(--ease-out),
      transform  var(--dur-base) var(--ease-out),
      border-color var(--dur-fast) var(--ease-out);
    will-change: transform;
  }
  .db-kpi::before {
    content: '';
    position: absolute;
    top: 0; left: 0;
    width: 3px;
    height: 100%;
    background: var(--kpi-accent, var(--c-brand));
    border-radius: var(--r-lg) 0 0 var(--r-lg);
  }
  .db-kpi:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    border-color: var(--c-border-md);
  }
  .db-kpi:active { transform: translateY(0); box-shadow: var(--shadow-xs); }

  .db-kpi-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .07em;
    text-transform: uppercase;
    color: var(--c-t3);
    margin-bottom: 4px;
  }
  .db-kpi-value {
    font-size: 24px;
    font-weight: 700;
    color: var(--c-t1);
    letter-spacing: -.04em;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    margin-bottom: 2px;
  }
  .db-kpi-sub {
    font-size: 11px;
    color: var(--c-t3);
    line-height: 1.4;
    margin-bottom: 6px;
  }
  .db-kpi-sub.ok { color: var(--c-green); font-weight: 600; }

  .db-kpi-trend {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 10px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: var(--r-sm);
  }
  .db-kpi-trend.up   { background: var(--c-green-bg);  color: var(--c-green-text); }
  .db-kpi-trend.down { background: var(--c-red-bg);    color: var(--c-red-text);   }
  .db-kpi-trend.flat { background: var(--c-gray-bg);   color: var(--c-gray-text);  }

  /* ── Urgent dot ── */
  .db-dot-urgent {
    position: absolute;
    top: 10px; right: 10px;
    width: 7px; height: 7px;
  }
  .db-dot-urgent::before {
    content: '';
    position: absolute; inset: 0;
    border-radius: 50%;
    background: var(--c-red);
    animation: db-ping 2s ease-out infinite;
  }
  .db-dot-urgent::after {
    content: '';
    position: absolute; inset: 0;
    border-radius: 50%;
    background: var(--c-red);
  }

  /* ── Alert banner ── */
  .db-alert-wrap {
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    border-radius: var(--r-lg);
    overflow: hidden;
    box-shadow: var(--shadow-xs);
  }
  .db-alert-row {
    width: 100%;
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    padding: 9px var(--sp-4);
    border: none;
    cursor: pointer;
    font-family: inherit;
    text-align: left;
    transition: filter var(--dur-fast) var(--ease-out);
  }
  .db-alert-row:hover { filter: brightness(.97); }
  .db-alert-row + .db-alert-row { border-top: 1px solid; }

  .db-alert-row.danger {
    background: var(--c-red-bg);
    border-top-color: var(--c-red-border) !important;
  }
  .db-alert-row.warn {
    background: var(--c-amber-bg);
    border-top-color: var(--c-amber-border) !important;
  }

  /* ── Pulse dot ── */
  .db-pulse-dot {
    position: relative;
    width: 7px; height: 7px;
    flex-shrink: 0;
    border-radius: 50%;
  }
  .db-pulse-dot.animate::before {
    content: '';
    position: absolute; inset: 0;
    border-radius: 50%;
    background: inherit;
    animation: db-ping 2s ease-out infinite;
  }

  /* ── Meeting rows ── */
  .db-meeting-row {
    display: flex;
    align-items: stretch;
    border-bottom: 1px solid var(--c-border);
    cursor: pointer;
    min-height: 48px;
    transition: background var(--dur-fast) var(--ease-out);
  }
  .db-meeting-row:last-child { border-bottom: none; }
  .db-meeting-row:hover { background: var(--c-surface-2); }
  .db-meeting-row.imminent { border-left: 3px solid var(--c-amber); }

  .db-meeting-date {
    width: 46px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--sp-1) 0;
    border-right: 1px solid var(--c-border);
  }
  .db-meeting-date.today { background: var(--c-brand-muted); }
  .db-meeting-day {
    font-size: 15px;
    font-weight: 700;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    color: var(--c-t1);
  }
  .db-meeting-day.today { color: var(--c-brand); }
  .db-meeting-month {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: .07em;
    margin-top: 2px;
    color: var(--c-t3);
  }
  .db-meeting-month.today { color: var(--c-brand); }

  .db-meeting-body {
    flex: 1;
    padding: var(--sp-2) var(--sp-3);
    min-width: 0;
  }
  .db-meeting-title {
    font-size: 12.5px;
    font-weight: 600;
    color: var(--c-t1);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 2px;
  }
  .db-meeting-meta {
    font-size: 11px;
    color: var(--c-t3);
    font-family: monospace;
  }
  .db-meeting-badge {
    padding: 0 var(--sp-3);
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  /* ── Status badge ── */
  .db-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 10.5px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: var(--r-sm);
    white-space: nowrap;
    border: 1px solid;
  }
  .db-badge .dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .db-badge .dot.pulse { animation: db-soft-pulse 2s ease-in-out infinite; }

  /* ── Progress bar ── */
  .db-progress-track {
    height: 5px;
    background: var(--c-surface-3);
    border-radius: 99px;
    overflow: hidden;
  }
  .db-progress-fill {
    height: 100%;
    border-radius: 99px;
    transition: width .6s var(--ease-out);
    animation: db-bar-enter .6s var(--ease-out) .15s both;
  }

  /* ── Quick action button ── */
  .db-qa-btn {
    width: 100%;
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    padding: 0 var(--sp-3);
    min-height: 38px;
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--c-border);
    cursor: pointer;
    font-size: 12px;
    color: var(--c-t2);
    font-family: inherit;
    text-align: left;
    font-weight: 500;
    transition: background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out);
  }
  .db-qa-btn:last-child { border-bottom: none; }
  .db-qa-btn:hover { background: var(--c-surface-2); color: var(--c-t1); }

  .db-qa-icon {
    width: 24px; height: 24px;
    border-radius: var(--r-sm);
    border: 1px solid var(--c-border);
    background: var(--c-surface-2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    flex-shrink: 0;
    transition: background var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out);
  }
  .db-qa-btn:hover .db-qa-icon {
    background: var(--c-surface-3);
    border-color: var(--c-border-md);
  }

  /* ── Primary button ── */
  .db-btn-primary {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-2);
    padding: 0 var(--sp-3);
    height: 32px;
    border-radius: var(--r-md);
    background: var(--c-brand);
    color: #fff;
    border: none;
    font-size: 12.5px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    box-shadow: 0 1px 3px var(--c-brand-ring), inset 0 1px 0 rgba(255,255,255,.12);
    transition: background var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out);
  }
  .db-btn-primary:hover  { background: var(--c-brand-hover); }
  .db-btn-primary:active { transform: scale(.97); }
  .db-btn-primary:focus-visible { outline: none; box-shadow: var(--shadow-focus); }

  /* ── Ghost button ── */
  .db-btn-ghost {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-2);
    padding: 0 var(--sp-2);
    height: 28px;
    border-radius: var(--r-sm);
    background: transparent;
    color: var(--c-t2);
    border: 1px solid var(--c-border);
    font-size: 11.5px;
    font-weight: 500;
    cursor: pointer;
    font-family: inherit;
    transition: background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out);
  }
  .db-btn-ghost:hover { background: var(--c-surface-2); color: var(--c-t1); border-color: var(--c-border-md); }

  /* ── Empty state ── */
  .db-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--sp-6) var(--sp-5);
    gap: var(--sp-2);
    text-align: center;
  }
  .db-empty-icon {
    width: 36px; height: 36px;
    border-radius: var(--r-lg);
    background: var(--c-surface-2);
    border: 1px solid var(--c-border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    margin-bottom: var(--sp-2);
  }

  /* ── Appointment card ── */
  .db-appt-time {
    font-size: 28px;
    font-weight: 700;
    color: var(--c-t1);
    letter-spacing: -.04em;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    font-family: monospace;
  }

  /* ── Animations ── */
  @keyframes db-fade-up {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: none; }
  }
  @keyframes db-ping {
    0%   { transform: scale(1); opacity: .6; }
    100% { transform: scale(2.4); opacity: 0; }
  }
  @keyframes db-soft-pulse {
    0%, 100% { opacity: 1;   }
    50%       { opacity: .35; }
  }
  @keyframes db-bar-enter {
    from { width: 0; }
  }

  .db-fade-in {
    animation: db-fade-up var(--dur-slow) var(--ease-out) both;
  }

  /* ── Right panel scrollbar ── */
  .db-right-panel {
    position: sticky;
    top: 16px;
    max-height: calc(100vh - 48px);
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--c-border) transparent;
    display: flex;
    flex-direction: column;
    gap: var(--sp-3);
  }
  .db-right-panel::-webkit-scrollbar { width: 4px; }
  .db-right-panel::-webkit-scrollbar-track { background: transparent; }
  .db-right-panel::-webkit-scrollbar-thumb { background: var(--c-border); border-radius: 2px; }

  /* ── Task stat cells ── */
  .db-task-stats {
    display: flex;
    margin-top: var(--sp-3);
    border-top: 1px solid var(--c-border);
    padding-top: var(--sp-2);
  }
  .db-task-stat {
    flex: 1;
    text-align: center;
    border-right: 1px solid var(--c-border);
    padding: 0 var(--sp-2);
  }
  .db-task-stat:last-child { border-right: none; }
`;

export function DashboardStyles() {
  useEffect(() => {
    if (document.getElementById('db-styles-v3')) return;
    const el = document.createElement('style');
    el.id = 'db-styles-v3';
    el.textContent = CSS;
    document.head.appendChild(el);
    return () => { /* leave styles for perf */ };
  }, []);
  return null;
}