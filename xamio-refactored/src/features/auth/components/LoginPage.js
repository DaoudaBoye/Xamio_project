import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useNotif } from '../../../context/NotifContext';
import XamioLogo from '../../../components/ui/XamioLogo';

const FEATURES = [
  { label: "Résumés de réunions générés par l'IA" },
  { label: 'Kanban de tâches avec rappels SMS' },
  { label: 'Ateliers, rendez-vous & agenda centralisés' },
  { label: 'Support dédié · Tarification en FCFA' },
];

const STATS = [
  { v: '7',    l: 'modules' },
  { v: '3',    l: 'plans' },
  { v: 'FCFA', l: 'tarification' },
];

/* ── Global CSS ── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .xp { font-family: 'DM Sans', sans-serif; -webkit-font-smoothing: antialiased; }
  .xp h1, .xp h2, .xp .g { font-family: 'Geist', sans-serif; }

  @keyframes xspin { to { transform: rotate(360deg); } }
  @keyframes xin   { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  @keyframes xrow  { from { opacity:0; transform:translateX(-6px); } to { opacity:1; transform:translateX(0); } }

  .xform { animation: xin .4s ease both; }

  .xinput {
    height: clamp(36px, 5vh, 42px);
    border-radius: 8px;
    padding: 0 12px;
    font-size: clamp(12px, 1.5vh, 14px);
    font-family: 'DM Sans', sans-serif;
    width: 100%;
    outline: none;
    transition: border-color .15s, background .15s, box-shadow .15s;
  }
  .xinput:focus {
    box-shadow: 0 0 0 3px rgba(0,120,255,.1);
  }

  .xcta {
    position: relative; overflow: hidden;
    transition: opacity .15s, transform .1s;
  }
  .xcta:not(:disabled):hover { opacity: .9; }
  .xcta:not(:disabled):active { transform: scale(.99); }
  .xcta::after {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(105deg, transparent 38%, rgba(255,255,255,.14) 50%, transparent 62%);
    transform: translateX(-100%);
    transition: transform .55s;
  }
  .xcta:not(:disabled):hover::after { transform: translateX(110%); }

  .xoauth {
    transition: background .15s, border-color .15s;
  }
  .xoauth:hover {
    background: var(--color-background-tertiary) !important;
    border-color: var(--color-accent) !important;
  }

  .xlink {
    color: var(--color-accent);
    cursor: pointer;
    font-weight: 500;
    border-bottom: 1.5px solid transparent;
    transition: border-color .15s;
    display: inline;
  }
  .xlink:hover { border-bottom-color: var(--color-accent); }

  .xfeat {
    display: flex; align-items: center; gap: 10px;
    animation: xrow .4s ease both;
  }

  .xleft-bg {
    background-image:
      radial-gradient(ellipse 90% 55% at -5% 105%, rgba(0,120,255,.055) 0%, transparent 60%),
      radial-gradient(ellipse 55% 35% at 105% -5%, rgba(0,120,255,.04) 0%, transparent 55%);
  }
`;

/* ── Hook breakpoints ── */
function useBreakpoint() {
  const [bp, setBp] = useState(() => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
    return w < 640 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop';
  });
  useEffect(() => {
    const fn = () => {
      const w = window.innerWidth;
      setBp(w < 640 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop');
    };
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return bp;
}

/* ── Field ── */
function Field({ id, label, type, val, set, error, placeholder }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label htmlFor={id} style={{
        fontFamily: 'Geist, sans-serif',
        fontSize: 11, fontWeight: 600,
        letterSpacing: '.07em', textTransform: 'uppercase',
        color: 'var(--color-text-muted)',
      }}>
        {label}
      </label>
      <input
        id={id} type={type} value={val}
        className="xinput"
        onChange={e => set(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        placeholder={placeholder}
        autoComplete={type === 'email' ? 'email' : 'current-password'}
        style={{
          background: focus ? 'var(--color-background)' : 'var(--color-background-secondary)',
          border: `1.5px solid ${error ? 'var(--color-danger)' : focus ? 'var(--color-accent)' : 'var(--color-border)'}`,
          color: 'var(--color-text-primary)',
        }}
      />
      {error && (
        <span style={{ fontSize: 11, color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M6 3.5v3M6 8.2h.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          {error}
        </span>
      )}
    </div>
  );
}

/* ── Google / Microsoft icons ── */
const GoogleIcon = () => (
  <svg width="15" height="15" viewBox="0 0 48 48" fill="none">
    <path d="M43.6 20H24v8h11.3C33.9 33.4 29.4 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C33.9 6.7 29.2 5 24 5 12.4 5 3 14.4 3 26s9.4 21 21 21c10.5 0 20-7.6 20-21 0-1.4-.2-2.7-.4-4z" fill="#FFC107"/>
    <path d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3 0 5.7 1.1 7.8 2.9l5.7-5.7C33.9 6.7 29.2 5 24 5c-7.7 0-14.4 4.4-17.7 10.7z" fill="#FF3D00"/>
    <path d="M24 47c5.1 0 9.8-1.7 13.4-4.5l-6.2-5.2C29.4 38.7 26.8 39.5 24 39.5c-5.4 0-9.9-3.6-11.3-8.5l-6.5 5C9.5 42.5 16.2 47 24 47z" fill="#4CAF50"/>
    <path d="M43.6 20H24v8h11.3c-.7 2-2 3.8-3.7 5l6.2 5.2C41.4 34.9 44 30.2 44 25c0-1.4-.2-2.7-.4-4z" fill="#1976D2"/>
  </svg>
);
const MicrosoftIcon = () => (
  <svg width="15" height="15" viewBox="0 0 48 48">
    <rect x="2"  y="2"  width="21" height="21" fill="#F25022"/>
    <rect x="25" y="2"  width="21" height="21" fill="#7FBA00"/>
    <rect x="2"  y="25" width="21" height="21" fill="#00A4EF"/>
    <rect x="25" y="25" width="21" height="21" fill="#FFB900"/>
  </svg>
);

/* ── TopBanner (tablet / mobile) ── */
function TopBanner({ bp }) {
  const isMobile = bp === 'mobile';
  return (
    <div style={{
      background: 'var(--color-background-secondary)',
      borderBottom: '1px solid var(--color-border)',
      padding: isMobile ? '20px 20px 18px' : '24px 40px 20px',
    }}>
      <XamioLogo variant="full" height={24} />
      <p style={{ fontFamily: 'Geist, monospace', fontSize: 10, color: 'var(--color-accent)', letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 600, marginTop: 14, marginBottom: 10 }}>
        Du wolof XAM · Savoir
      </p>
      <h1 className="g" style={{ fontSize: isMobile ? 22 : 26, fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-.04em', lineHeight: 1.15, marginBottom: 16 }}>
        Gérez votre entreprise.{' '}
        <span style={{ color: 'var(--color-accent)' }}>Simplifiez tout.</span>
      </h1>
      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
        {STATS.map(({ v, l }) => (
          <div key={l}>
            <div className="g" style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-.03em', lineHeight: 1 }}>{v}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── LeftPanel ── */
function LeftPanel() {
  return (
    <div
      className="xleft-bg"
      style={{
        flex: 1,
        minWidth: 290,
        maxWidth: 420,
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        padding: 'clamp(16px, 3.2vh, 40px) clamp(24px, 3.5vw, 48px)',
        background: 'var(--color-background-secondary)',
        borderRight: '1px solid var(--color-border)',
      }}
    >
      <div style={{ flexShrink: 0 }}>
        <XamioLogo variant="full" height={26} />
      </div>

      <div style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 'clamp(6px, 1.4vh, 16px)',
      }}>
        <p style={{
          fontFamily: 'Geist, monospace',
          fontSize: 10, fontWeight: 600,
          letterSpacing: '.12em', textTransform: 'uppercase',
          color: 'var(--color-accent)',
          flexShrink: 0,
        }}>
          Du wolof XAM · Savoir
        </p>

        <h1 className="g" style={{
          fontSize: 'clamp(22px, 3vh, 34px)',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          letterSpacing: '-.04em',
          lineHeight: 1.1,
          flexShrink: 0,
        }}>
          Gérez votre<br />entreprise.<br />
          <span style={{ color: 'var(--color-accent)' }}>Simplifiez tout.</span>
        </h1>

        <p style={{
          fontSize: 'clamp(11.5px, 1.4vh, 13.5px)',
          color: 'var(--color-text-secondary)',
          lineHeight: 1.65,
          maxWidth: 310,
          flexShrink: 1,
        }}>
          Réunions, tâches, documents, rendez-vous et ateliers — centralisés dans un seul outil pensé pour les entreprises africaines.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(5px, 1vh, 13px)', flexShrink: 0 }}>
          {FEATURES.map((f, i) => (
            <div key={f.label} className="xfeat" style={{ animationDelay: `${i * 55}ms` }}>
              <div style={{
                width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                background: 'var(--color-accent-bg, rgba(0,120,255,.08))',
                border: '1px solid var(--color-accent-border, rgba(0,120,255,.18))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                  <polyline points="1.5,5 3.8,7.5 8.5,2" stroke="var(--color-accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span style={{ fontSize: 'clamp(11px, 1.3vh, 13px)', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        flexShrink: 0,
        display: 'flex',
        gap: 36,
        paddingTop: 'clamp(8px, 1.4vh, 20px)',
        borderTop: '1px solid var(--color-border)',
      }}>
        {STATS.map(({ v, l }) => (
          <div key={l}>
            <div className="g" style={{
              fontSize: 'clamp(17px, 2vh, 24px)',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              letterSpacing: '-.03em',
              lineHeight: 1,
            }}>{v}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 3 }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginTop: 'clamp(6px, 1.1vh, 14px)',
        paddingTop: 'clamp(6px, 1.1vh, 12px)',
        borderTop: '1px solid var(--color-border)',
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
       <p style={{ fontSize: 11, color: 'var(--color-text-disabled)', letterSpacing: '.03em' }}>
            © 2026 XAMIO · Un produit de <strong>Technosus</strong>
          </p>
      </div>
    </div>
  );
}

/* ── FormPanel ── */
function FormPanel({ bp, email, setEmail, pass, setPass, loading, err, submit, addToast }) {
  const isMobile  = bp === 'mobile';
  const isTablet  = bp === 'tablet';
  const isDesktop = bp === 'desktop';

  return (
    <div style={{
      flex: isDesktop ? 1 : undefined,
      width: isDesktop ? undefined : '100%',
      /* Sur desktop : hauteur fixée à 100vh, pas de scroll */
      height: isDesktop ? '100vh' : 'auto',
      overflow: isDesktop ? 'hidden' : 'visible',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      /* Padding fluide sur desktop */
      padding: isMobile
        ? '32px 20px 52px'
        : isTablet
        ? '36px 40px 52px'
        : 'clamp(16px, 3vh, 52px) clamp(24px, 3.5vw, 44px)',
      background: 'var(--color-background)',
    }}>
      <div
        className={isDesktop ? 'xform' : ''}
        style={{
          width: '100%',
          maxWidth: isMobile ? '100%' : isTablet ? 460 : 360,
          display: 'flex',
          flexDirection: 'column',
          /* gap fluide entre les sections du formulaire */
          gap: isDesktop ? 'clamp(8px, 1.8vh, 22px)' : undefined,
        }}
      >
        {/* Header */}
        <div>
          <h2 className="g" style={{
            fontSize: isDesktop ? 'clamp(17px, 2.4vh, 22px)' : 22,
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            letterSpacing: '-.03em',
            marginBottom: 4,
          }}>
            Se connecter
          </h2>
          <p style={{ fontSize: 13.5, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
            Accédez à votre espace de travail.
          </p>
        </div>

        {/* Champs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: isDesktop ? 'clamp(8px, 1.5vh, 18px)' : 18 }}>
          <Field id="email" label="Email" type="email"
            val={email} set={setEmail} error={err.email}
            placeholder="votre@entreprise.com" />

          <div>
            <Field id="pass" label="Mot de passe" type="password"
              val={pass} set={setPass} error={err.pass}
              placeholder="••••••••" />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
              <button type="button" style={{
                fontSize: 12, color: 'var(--color-accent)',
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif', padding: 0, fontWeight: 500,
              }}>
                Mot de passe oublié ?
              </button>
            </div>
          </div>
        </div>

        {/* Bouton submit */}
        <button
          type="button"
          onClick={submit}
          disabled={loading}
          className="xcta g"
          style={{
            height: isDesktop ? 'clamp(36px, 4.8vh, 44px)' : 44,
            background: 'var(--color-accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: isDesktop ? 'clamp(12px, 1.6vh, 14px)' : 14,
            fontWeight: 600,
            letterSpacing: '.01em',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            opacity: loading ? .6 : 1,
          }}
        >
          {loading && (
            <span style={{
              width: 13, height: 13,
              border: '2px solid rgba(255,255,255,.3)',
              borderTopColor: '#fff',
              borderRadius: '50%',
              display: 'inline-block',
              animation: 'xspin .65s linear infinite',
            }} />
          )}
          {loading ? 'Connexion en cours…' : 'Continuer →'}
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)', whiteSpace: 'nowrap', letterSpacing: '.03em' }}>ou continuer avec</span>
          <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
        </div>

        {/* SSO */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { name: 'Google',    Icon: GoogleIcon },
            { name: 'Microsoft', Icon: MicrosoftIcon },
          ].map(({ name, Icon }) => (
            <button key={name} type="button"
              className="xoauth"
              onClick={() => addToast(`SSO ${name} — bientôt disponible.`, 'info')}
              style={{
                height: isDesktop ? 'clamp(34px, 4.5vh, 42px)' : 42,
                background: 'var(--color-background-secondary)',
                border: '1.5px solid var(--color-border)',
                borderRadius: 8,
                fontSize: 13, fontWeight: 500,
                color: 'var(--color-text-secondary)',
                fontFamily: 'DM Sans, sans-serif',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <Icon /> {name}
            </button>
          ))}
        </div>

        {/* Signup */}
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
          Pas encore de compte ?{' '}
          <span className="xlink" onClick={() => addToast('Inscription — bientôt disponible.', 'info')}>
            Créer un espace de travail
          </span>
        </p>

        {/* Footer */}
        <p style={{ fontSize: 11, color: 'var(--color-text-disabled)', textAlign: 'center', letterSpacing: '.03em' }}>
          © 2025 XAMIO · Version 1.0
        </p>
      </div>
    </div>
  );
}

/* ── Main ── */
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [pass,  setPass]  = useState('');
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState({});

  const { login }    = useAuth();
  const { addToast } = useNotif();
  const navigate     = useNavigate();
  const bp           = useBreakpoint();

  const submit = async e => {
    if (e && e.preventDefault) e.preventDefault();
    const er = {};
    if (!email.includes('@')) er.email = 'Adresse e-mail invalide';
    if (pass.length < 4)      er.pass  = 'Mot de passe trop court';
    if (Object.keys(er).length) { setErr(er); return; }
    setErr({}); setLoading(true);
    try {
      await login(email, pass);
      addToast('Connexion réussie — bienvenue sur XAMIO.', 'success');
      navigate('/');
    } catch (ex) {
      addToast(ex.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const formProps = { bp, email, setEmail, pass, setPass, loading, err, submit, addToast };

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div className="xp" style={{
        minHeight: '100vh',
        height: bp === 'desktop' ? '100vh' : 'auto',
        display: 'flex',
        flexDirection: bp === 'desktop' ? 'row' : 'column',
        background: 'var(--color-background)',
        overflow: 'hidden',
      }}>
        {bp === 'desktop'
          ? <><LeftPanel /><FormPanel {...formProps} /></>
          : <><TopBanner bp={bp} /><FormPanel {...formProps} /></>
        }
      </div>
    </>
  );
}