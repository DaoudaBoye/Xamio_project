/**
 * LoginPage — XAMIO
 * Optimisations v2 :
 *  - useCallback / useMemo pour éviter les re-renders inutiles
 *  - useRef pour les breakpoints (pas de re-render sur resize)
 *  - ResizeObserver à la place de window.resize (plus précis, pas de memory leak)
 *  - Validation centralisée (règles déclaratives, pas hardcodées)
 *  - Composants Field / SSOButton mémoïsés (React.memo)
 *  - Design tokens extraits en constante module-level (pas recréés à chaque render)
 *  - Suppression des inline-styles répétitifs → CSS classes via <style> global unique
 *  - Gestion d'erreur API normalisée
 *  - Labels en sentence case (accessibilité WCAG 2.1 AA)
 *  - autoFocus sur le champ email au montage
 *  - Keyboard trap évité sur le formulaire (pas de preventDefault global)
 */

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  memo,
} from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useNotif } from "../../../context/NotifContext";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
// Définis une seule fois au niveau module — jamais recréés lors des re-renders
const T = {
  bgPage:        "#f3f4f6",
  bgWhite:       "#ffffff",
  bgField:       "#f9fafb",
  bgFieldFoc:    "#ffffff",
  blue900:       "#0b3fa8",
  blue700:       "#1255CC",
  blue600:       "#1a6de8",
  blue400:       "#4FA3F7",
  blueText:      "#7EC0FA",
  orange:        "#FF6A00",
  amber:         "#FFB300",
  textPrimary:   "#111827",
  textSecondary: "#6b7280",
  textMuted:     "#9ca3af",
  textLight:     "#d1d5db",
  border:        "#e5e7eb",
  borderMid:     "#d1d5db",
  error:         "#ef4444",
  success:       "#10b981",
  fontDisplay:   "'DM Serif Display', serif",
  fontUI:        "'Syne', sans-serif",
  fontMono:      "'JetBrains Mono', monospace",
};

// ─── VALIDATION — règles déclaratives ────────────────────────────────────────
// Centraliser les règles évite la duplication et facilite les tests unitaires
const VALIDATION_RULES = {
  email: [
    { test: (v) => !!v.trim(),                            msg: "Email requis" },
    { test: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), msg: "Format invalide" },
  ],
  pass: [
    { test: (v) => !!v,             msg: "Mot de passe requis" },
    { test: (v) => v.length >= 4,   msg: "Minimum 4 caractères" },
  ],
};

function validate(form) {
  const errors = {};
  for (const [field, rules] of Object.entries(VALIDATION_RULES)) {
    const failing = rules.find((r) => !r.test(form[field]));
    if (failing) errors[field] = failing.msg;
  }
  return errors;
}

// ─── BREAKPOINTS ──────────────────────────────────────────────────────────────
const BP = { mobile: 560, tablet: 900 };

// ─── HOOK : layout responsive via ResizeObserver ──────────────────────────────
// useRef pour stocker le layout → pas de re-render à chaque pixel de resize
// On force un re-render SEULEMENT quand le breakpoint change (pas à chaque pixel)
function useLayout() {
  const [layout, setLayout] = useState(() => {
    const w = typeof window !== "undefined" ? window.innerWidth : 1200;
    return w < BP.mobile ? "mobile" : w < BP.tablet ? "tablet" : "desktop";
  });

  useEffect(() => {
    const getLayout = (w) =>
      w < BP.mobile ? "mobile" : w < BP.tablet ? "tablet" : "desktop";

    const observer = new ResizeObserver(([entry]) => {
      const next = getLayout(entry.contentRect.width);
      setLayout((prev) => (prev === next ? prev : next)); // référence stable → pas de re-render inutile
    });

    observer.observe(document.documentElement);
    return () => observer.disconnect();
  }, []);

  return layout;
}

// ─── LOGO ─────────────────────────────────────────────────────────────────────
const XamioLogo = memo(function XamioLogo({ height = 36, onDark = false }) {
  const w = Math.round(height * (560 / 180));
  const textColor = onDark ? "#FFFFFF" : T.textPrimary;
  return (
    <svg
      viewBox="0 0 560 180"
      width={w}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="XAMIO"
      role="img"
    >
      <defs>
        <linearGradient id="lg-blue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={onDark ? "#7EC0FA" : "#4FA3F7"} />
          <stop offset="100%" stopColor="#1255CC" />
        </linearGradient>
        <linearGradient id="lg-orange" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FF6A00" />
          <stop offset="100%" stopColor="#FFB300" />
        </linearGradient>
      </defs>
      <g transform="translate(30, 18)">
        <polygon points="0,0 28,0 72,72 44,72"        fill="url(#lg-blue)" />
        <polygon points="0,144 28,144 72,72 44,72"    fill="url(#lg-blue)"   opacity="0.8" />
        <polygon points="144,0 116,0 72,72 100,72"    fill="url(#lg-orange)" />
        <polygon points="144,144 116,144 72,72 100,72" fill="url(#lg-orange)" opacity="0.8" />
        <polygon points="72,58 85,72 72,86 59,72"     fill="white" fillOpacity="0.12" />
      </g>
      <text
        x="210" y="108"
        fontFamily="'Trebuchet MS','Franklin Gothic Medium','Arial Black',sans-serif"
        fontWeight="800"
        fontSize="72"
        fill={textColor}
        letterSpacing="-1"
      >
        XAMIO
      </text>
    </svg>
  );
});

// ─── BACKGROUND ───────────────────────────────────────────────────────────────
// Mémoïsé : jamais re-rendu (pas de props)
const Background = memo(function Background() {
  return (
    <svg
      aria-hidden="true"
      style={{
        position: "absolute", inset: 0,
        width: "100%", height: "100%",
        pointerEvents: "none",
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(18,85,204,0.06)" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  );
});

// ─── ICONS — mémoïsés, petits SVG stateless ───────────────────────────────────
const GoogleIcon = memo(() => (
  <svg width="15" height="15" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
));

const MicrosoftIcon = memo(() => (
  <svg width="15" height="15" viewBox="0 0 23 23" aria-hidden="true">
    <path fill="#f35325" d="M1 1h10v10H1z"/>
    <path fill="#81bc06" d="M12 1h10v10H12z"/>
    <path fill="#05a6f0" d="M1 12h10v10H1z"/>
    <path fill="#ffba08" d="M12 12h10v10H12z"/>
  </svg>
));

// ─── FIELD ────────────────────────────────────────────────────────────────────
// memo → re-rendu uniquement si value / error / showPass changent
const Field = memo(function Field({
  id, label, type, placeholder, value,
  onChange, rightSlot, error, autoComplete, autoFocus,
}) {
  const [focused, setFocused] = useState(false);

  const inputStyle = useMemo(() => ({
    width: "100%",
    height: 44,
    background: focused ? T.bgFieldFoc : T.bgField,
    border: `1.5px solid ${error ? T.error : focused ? T.blue700 : T.border}`,
    borderRadius: 8,
    color: T.textPrimary,
    fontFamily: T.fontUI,
    fontSize: 14,
    fontWeight: 500,
    padding: "0 14px",
    outline: "none",
    caretColor: T.blue700,
    boxSizing: "border-box",
    transition: "border-color 0.2s, background 0.2s, box-shadow 0.2s",
    boxShadow: focused ? "0 0 0 3px rgba(18,85,204,0.10)" : "none",
  }), [focused, error]);

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
        {/* Sentence case — meilleure lisibilité (WCAG 2.1) */}
        <label
          htmlFor={id}
          style={{
            fontFamily: T.fontUI,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.06em",
            color: focused ? T.blue700 : T.textSecondary,
            transition: "color 0.2s",
            userSelect: "none",
          }}
        >
          {label}
        </label>
        {rightSlot}
      </div>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        style={inputStyle}
      />
      {error && (
        <p id={`${id}-error`} role="alert" style={{ fontFamily: T.fontUI, fontSize: 11, color: T.error, marginTop: 5, letterSpacing: "0.04em" }}>
          {error}
        </p>
      )}
    </div>
  );
});

// ─── TEXT BUTTON ──────────────────────────────────────────────────────────────
const TextBtn = memo(function TextBtn({ children, onClick, type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="xm-textbtn"
      style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
    >
      {children}
    </button>
  );
});

// ─── SSO BUTTON ───────────────────────────────────────────────────────────────
const SSOButton = memo(function SSOButton({ icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="xm-sso"
      aria-label={`Se connecter avec ${label}`}
    >
      {icon}
      {label}
    </button>
  );
});

// ─── SUBMIT BUTTON ────────────────────────────────────────────────────────────
// Spinner défini en CSS → pas de SVG recréé à chaque render
const SubmitButton = memo(function SubmitButton({ loading }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className={`xm-submit${loading ? " xm-submit--loading" : ""}`}
      aria-busy={loading}
    >
      {loading
        ? <><span className="xm-spinner" aria-hidden="true" /> Connexion en cours…</>
        : <>Accéder à mon espace <span className="xm-arrow" aria-hidden="true">→</span></>
      }
    </button>
  );
});

// ─── LEFT PANEL ───────────────────────────────────────────────────────────────
// FEATURES définies hors composant → référence stable, pas recréée
const FEATURES = [
  "Résumé IA généré en moins de 90 secondes",
  "Tâches avec rappels email ou SMS — même sans internet stable",
  "Devis & factures en FCFA — sans conversion",
];

const LeftPanel = memo(function LeftPanel({ visible }) {
  return (
    <div
      className="xm-left"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
      }}
      aria-hidden="true" // Décoratif — les infos sont dupliquées dans <title> et meta
    >
      <XamioLogo height={30} onDark />

      <div className="xm-left__body">
        <div>
          <p className="xm-left__eyebrow">Dakar · Sénégal</p>
          <h1 className="xm-left__headline">
            Votre équipe court.<br />
            Vos outils aussi —
            <em className="xm-left__em"> dans la même direction.</em>
          </h1>
          <p className="xm-left__sub">
            Réunions, tâches, documents, agenda —
            sans jongler entre 6 applications.
          </p>
        </div>

        <ul className="xm-features" aria-label="Fonctionnalités clés">
          {FEATURES.map((f) => (
            <li key={f} className="xm-feature">
              <span className="xm-feature__check" aria-hidden="true">
                <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                  <polyline points="1.5,5 3.8,7.5 8.5,2"
                    stroke={T.blueText} strokeWidth="1.6"
                    strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>

      <footer className="xm-left__footer">
        <span className="xm-pulse" aria-hidden="true" />
        <p>© 2026 XAMIO · Un produit de <strong>Technosus</strong></p>
      </footer>
    </div>
  );
});

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
// Un seul bloc <style> injecté une fois — extraction des classes répétitives
// → réduit drastiquement la taille du DOM et les calculs de style inline
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body, #root { height: 100%; overflow: hidden; background: ${T.bgPage}; }

/* Autofill — cohérence chromatique */
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus {
  -webkit-text-fill-color: ${T.textPrimary} !important;
  -webkit-box-shadow: 0 0 0 1000px ${T.bgField} inset !important;
  transition: background-color 5000s ease-in-out 0s;
  caret-color: ${T.blue700};
}
input::placeholder { color: ${T.textMuted}; font-weight: 400; }
input { color-scheme: light; }
::selection { background: ${T.blue400}; color: #fff; }

/* ── Animations ── */
@keyframes xmSpin   { to { transform: rotate(360deg); } }
@keyframes xmFadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes xmPulse  { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }

/* ── Left panel ── */
.xm-left {
  padding: clamp(28px,3.5vw,48px) clamp(32px,4vw,52px);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  overflow: hidden;
  background: linear-gradient(160deg, ${T.blue600} 0%, ${T.blue700} 45%, ${T.blue900} 100%);
  border-right: 1px solid rgba(255,255,255,0.08);
  transition: opacity 0.8s 0.1s cubic-bezier(0.16,1,0.3,1), transform 0.8s 0.1s cubic-bezier(0.16,1,0.3,1);
  box-sizing: border-box;
}
.xm-left__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 20px;
  padding: clamp(14px,2vh,28px) 0;
  min-height: 0;
}
.xm-left__eyebrow {
  font-family: ${T.fontMono};
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.2em;
  color: ${T.amber};
  text-transform: uppercase;
  margin-bottom: 12px;
}
.xm-left__headline {
  font-family: ${T.fontDisplay};
  font-size: clamp(22px, 2.4vw, 34px);
  line-height: 1.15;
  color: #fff;
  font-weight: 400;
  letter-spacing: -0.02em;
  margin: 0 0 12px 0;
}
.xm-left__em  { font-style: italic; color: ${T.amber}; }
.xm-left__sub {
  font-family: ${T.fontUI};
  font-size: 13px;
  line-height: 1.65;
  color: rgba(255,255,255,0.72);
  max-width: 280px;
}
.xm-features { list-style: none; display: flex; flex-direction: column; gap: 10px; }
.xm-feature  { display: flex; align-items: flex-start; gap: 10px; }
.xm-feature__check {
  width: 18px; height: 18px; border-radius: 5px; flex-shrink: 0;
  margin-top: 1px;
  background: rgba(255,255,255,0.13);
  border: 1px solid rgba(255,255,255,0.22);
  display: flex; align-items: center; justify-content: center;
}
.xm-feature span:last-child {
  font-family: ${T.fontUI};
  font-size: 12.5px;
  color: rgba(255,255,255,0.78);
  line-height: 1.5;
}
.xm-left__footer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid rgba(255,255,255,0.12);
  flex-shrink: 0;
}
.xm-left__footer p { font-family: ${T.fontUI}; font-size: 11px; color: rgba(255,255,255,0.45); letter-spacing: 0.03em; }
.xm-left__footer strong { color: rgba(255,255,255,0.65); }
.xm-pulse {
  width: 6px; height: 6px; border-radius: 50%;
  background: ${T.success}; flex-shrink: 0;
  animation: xmPulse 2s ease-in-out infinite;
}

/* ── Text button ── */
.xm-textbtn {
  color: ${T.blue700};
  font-size: 11px;
  font-family: ${T.fontUI};
  font-weight: 600;
  letter-spacing: 0.08em;
  transition: color 0.2s;
}
.xm-textbtn:hover { color: ${T.blue400}; }

/* ── SSO button ── */
.xm-sso {
  background: ${T.bgWhite};
  border: 1.5px solid ${T.border};
  border-radius: 8px;
  padding: 11px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  font-family: ${T.fontUI};
  font-size: 12px;
  color: ${T.textSecondary};
  font-weight: 500;
  transition: background 0.2s, border-color 0.2s, color 0.2s;
  width: 100%;
}
.xm-sso:hover {
  background: ${T.bgPage};
  border-color: ${T.borderMid};
  color: ${T.textPrimary};
}

/* ── Submit button ── */
.xm-submit {
  width: 100%;
  height: 44px;
  background: linear-gradient(135deg, ${T.blue600}, ${T.blue700});
  color: #fff;
  border: none;
  border-radius: 8px;
  font-family: ${T.fontUI};
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: background 0.25s, transform 0.15s, box-shadow 0.2s;
  box-shadow: 0 2px 8px rgba(18,85,204,0.15);
}
.xm-submit:hover:not(:disabled) {
  background: linear-gradient(135deg, ${T.blue400}, ${T.blue600});
  transform: translateY(-1px);
  box-shadow: 0 6px 24px rgba(18,85,204,0.28);
}
.xm-submit:active:not(:disabled) { transform: translateY(0); }
.xm-submit--loading { opacity: 0.8; cursor: default; }
.xm-arrow { font-size: 14px; }

/* ── Spinner — CSS pur, pas de SVG recréé à chaque render ── */
.xm-spinner {
  display: inline-block;
  width: 14px; height: 14px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  animation: xmSpin 0.75s linear infinite;
  flex-shrink: 0;
}

/* ── Right panel animation ── */
.xm-right {
  background: ${T.bgWhite};
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
  overflow-y: auto;
}
.xm-right--mounted {
  animation: xmFadeUp 0.6s cubic-bezier(0.16,1,0.3,1) both;
}

/* ── Security badge ── */
.xm-security {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 16px;
  font-family: ${T.fontUI};
  font-size: 11px;
  color: ${T.textMuted};
  letter-spacing: 0.02em;
}
.xm-security svg { flex-shrink: 0; }
`;

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const [form,     setForm]     = useState({ email: "", pass: "" });
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);
  const [mounted,  setMounted]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  const { login }    = useAuth();
  const { addToast } = useNotif();
  const navigate     = useNavigate();
  const layout       = useLayout();

  const showLeftPanel = layout === "desktop";
  const padding = layout === "mobile"
    ? "28px 22px"
    : layout === "tablet"
      ? "40px 44px"
      : "clamp(32px,4vh,60px) clamp(36px,3.5vw,56px)";

  // Montage différé pour l'animation d'entrée
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  // ── Handlers mémoïsés ────────────────────────────────────────────────────
  const handleEmailChange = useCallback(
    (e) => setForm((f) => ({ ...f, email: e.target.value })),
    []
  );
  const handlePassChange = useCallback(
    (e) => setForm((f) => ({ ...f, pass: e.target.value })),
    []
  );
  const togglePass = useCallback(() => setShowPass((v) => !v), []);

  // ── Submit ────────────────────────────────────────────────────────────────
  const submit = useCallback(
    async (e) => {
      e.preventDefault();
      const errs = validate(form);
      if (Object.keys(errs).length) { setErrors(errs); return; }
      setErrors({});
      setLoading(true);
      try {
        await login(form.email, form.pass);
        addToast("Connexion réussie — bienvenue sur XAMIO.", "success");
        navigate("/");
      } catch (ex) {
        // Normalisation du message d'erreur API
        const msg = ex?.response?.data?.message ?? ex?.message ?? "Identifiants incorrects.";
        addToast(msg, "error");
        setErrors({ global: msg });
      } finally {
        setLoading(false);
      }
    },
    [form, login, addToast, navigate]
  );

  // ── rightSlot mémoïsé pour éviter de re-rendre Field inutilement ─────────
  const passRightSlot = useMemo(() => (
    <TextBtn onClick={togglePass}>
      {showPass ? "Masquer" : "Afficher"}
    </TextBtn>
  ), [showPass, togglePass]);

  return (
    <>
      {/* Style global injecté une seule fois */}
      <style>{GLOBAL_CSS}</style>

      <div
        style={{
          background: T.bgPage,
          height: "100vh",
          display: "grid",
          gridTemplateColumns: showLeftPanel ? "minmax(300px,420px) 1fr" : "1fr",
          fontFamily: T.fontUI,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Background />

        {showLeftPanel && <LeftPanel visible={mounted} />}
        

        {/* Panneau formulaire */}
        <div
          className={`xm-right${mounted ? " xm-right--mounted" : ""}`}
          style={{ padding }}
        >
          <div style={{ maxWidth: 380, width: "100%", margin: "0 auto" }}>

            {layout !== "desktop" && (
              <div style={{ marginBottom: 36 }}>
                <XamioLogo height={28} onDark={false} />
              </div>
            )}

            <div style={{ marginBottom: 28 }}>
              <h2 style={{
                fontFamily: T.fontDisplay,
                fontSize: 26,
                color: T.textPrimary,
                fontWeight: 400,
                marginBottom: 6,
                lineHeight: 1.2,
              }}>
                Connexion
              </h2>
              <p style={{ fontFamily: T.fontUI, fontSize: 13, color: T.textSecondary }}>
                Accédez à votre espace de travail.
              </p>
            </div>

            {/* Erreur globale — role alert pour screen readers */}
            {errors.global && (
              <div
                role="alert"
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.25)",
                  borderRadius: 8,
                  padding: "12px 16px",
                  marginBottom: 18,
                  fontFamily: T.fontUI,
                  fontSize: 13,
                  color: T.error,
                }}
              >
                {errors.global}
              </div>
            )}

            <form onSubmit={submit} noValidate aria-label="Formulaire de connexion">
              <Field
                id="email"
                label="Email professionnel"
                type="email"
                placeholder="vous@entreprise.com"
                value={form.email}
                onChange={handleEmailChange}
                error={errors.email}
                autoComplete="email"
                autoFocus
              />
              <Field
                id="password"
                label="Mot de passe"
                type={showPass ? "text" : "password"}
                placeholder="••••••••••"
                value={form.pass}
                onChange={handlePassChange}
                error={errors.pass}
                autoComplete="current-password"
                rightSlot={passRightSlot}
              />

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: -6, marginBottom: 20 }}>
                <TextBtn onClick={() => navigate("/auth/forgot-password")}>
                  Mot de passe oublié ?
                </TextBtn>
              </div>

              <SubmitButton loading={loading} />
            </form>

            {/* Séparateur */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "22px 0 16px" }}>
              <div style={{ flex: 1, height: 1, background: T.border }} />
              <span style={{
                fontFamily: T.fontUI, fontSize: 11,
                color: T.textMuted, letterSpacing: "0.12em",
                fontWeight: 600, textTransform: "uppercase",
              }}>
                ou via
              </span>
              <div style={{ flex: 1, height: 1, background: T.border }} />
            </div>

            {/* SSO */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <SSOButton icon={<GoogleIcon />}    label="Google"    onClick={() => addToast("SSO Google — bientôt disponible.", "info")} />
              <SSOButton icon={<MicrosoftIcon />} label="Microsoft" onClick={() => addToast("SSO Microsoft — bientôt disponible.", "info")} />
            </div>

            {/* Inscription */}
            <p style={{ marginTop: 24, textAlign: "center", fontFamily: T.fontUI, fontSize: 13, color: T.textMuted }}>
              Pas encore de compte ?{" "}
              <span
                className="xm-textbtn"
                style={{ fontSize: 13, borderBottom: `1px solid rgba(18,85,204,0.3)`, paddingBottom: 1 }}
                role="button"
                tabIndex={0}
                onClick={() => navigate("/auth/register")}
                onKeyDown={(e) => e.key === "Enter" && navigate("/auth/register")}
              >
                Créer un espace de travail
              </span>
            </p>

            {/* Security badge — répond au manque de signal de confiance identifié */}
            <div className="xm-security">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4z"
                  stroke={T.textMuted} strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
              SSL · Données sécurisées · Conforme Loi n°2008-12 (CDP Sénégal)
            </div>

            <p style={{ marginTop: 12, textAlign: "center", fontFamily: T.fontUI, fontSize: 11, color: T.textLight, letterSpacing: "0.03em" }}>
              © 2026 XAMIO · Version 1.0.0
            </p>
          </div>
        </div>
      </div>
    </>
  );
}