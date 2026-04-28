import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useNotif } from "../../../context/NotifContext";

// ─── DESIGN TOKENS — Light mode ───────────────────────────────────────────────
const T = {
  // Fonds
  bgPage:    "#f3f4f6",
  bgWhite:   "#ffffff",
  bgField:   "#f9fafb",
  bgFieldFoc:"#ffffff",

  // Bleu (panneau gauche + accents)
  blue900:   "#0b3fa8",
  blue700:   "#1255CC",
  blue600:   "#1a6de8",
  blue400:   "#4FA3F7",
  blueText:  "#7EC0FA",

  // Orange
  orange:    "#FF6A00",
  amber:     "#FFB300",

  // Textes
  textPrimary:   "#111827",
  textSecondary: "#6b7280",
  textMuted:     "#9ca3af",
  textLight:     "#d1d5db",

  // Bordures
  border:    "#e5e7eb",
  borderMid: "#d1d5db",

  // État
  error:   "#ef4444",
  success: "#10b981",

  // Typo
  fontDisplay: "'DM Serif Display', serif",
  fontUI:      "'Syne', sans-serif",
  fontMono:    "'JetBrains Mono', monospace",
};

const BP = { mobile: 560, tablet: 900 };

// ─── LOGO SVG INLINE ──────────────────────────────────────────────────────────
function XamioLogo({ height = 36, onDark = false }) {
  const w = Math.round(height * (560 / 180));
  const textColor = onDark ? "#FFFFFF" : "#111827";
  return (
    <svg
      viewBox="0 0 560 180"
      width={w}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="XAMIO"
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
        <polygon points="0,0 28,0 72,72 44,72"          fill="url(#lg-blue)" />
        <polygon points="0,144 28,144 72,72 44,72"       fill="url(#lg-blue)"   opacity="0.8" />
        <polygon points="144,0 116,0 72,72 100,72"       fill="url(#lg-orange)" />
        <polygon points="144,144 116,144 72,72 100,72"   fill="url(#lg-orange)" opacity="0.8" />
        <polygon points="72,58 85,72 72,86 59,72"        fill="white" fillOpacity="0.12" />
      </g>
      <text
        x="210" y="108"
        fontFamily="'Trebuchet MS','Franklin Gothic Medium','Arial Black',sans-serif"
        fontWeight="800" fontSize="72"
        fill={textColor}
        letterSpacing="-1"
      >
        XAMIO
      </text>
    </svg>
  );
}

// ─── BACKGROUND (grille subtile) ──────────────────────────────────────────────
function Background() {
  return (
    <svg
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
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
}

// ─── ICONS ────────────────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 23 23" style={{ flexShrink: 0 }}>
      <path fill="#f35325" d="M1 1h10v10H1z" />
      <path fill="#81bc06" d="M12 1h10v10H12z" />
      <path fill="#05a6f0" d="M1 12h10v10H1z" />
      <path fill="#ffba08" d="M12 12h10v10H12z" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
      <path d="M2 5h6M5 2l3 3-3 3" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ animation: "xmSpin 0.75s linear infinite" }}>
      <circle cx="7" cy="7" r="5.5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.8" />
      <path d="M7 1.5a5.5 5.5 0 0 1 5.5 5.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// ─── FIELD ────────────────────────────────────────────────────────────────────
function Field({ label, type, placeholder, value, onChange, rightSlot, error, autoComplete }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
        <label style={{
          fontFamily: T.fontUI,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: focused ? T.blue700 : T.textSecondary,
          transition: "color 0.2s",
        }}>
          {label}
        </label>
        {rightSlot}
      </div>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
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
          boxShadow: focused ? `0 0 0 3px rgba(18,85,204,0.10)` : "none",
        }}
      />
      {error && (
        <p style={{ fontFamily: T.fontUI, fontSize: 11, color: T.error, marginTop: 5, letterSpacing: "0.04em" }}>
          {error}
        </p>
      )}
    </div>
  );
}

// ─── TEXT BUTTON ──────────────────────────────────────────────────────────────
function TextBtn({ children, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: "none",
        border: "none",
        color: hover ? T.blue400 : T.blue700,
        fontSize: 11,
        fontFamily: T.fontUI,
        fontWeight: 600,
        letterSpacing: "0.08em",
        cursor: "pointer",
        padding: 0,
        transition: "color 0.2s",
      }}
    >
      {children}
    </button>
  );
}

// ─── SSO BUTTON ───────────────────────────────────────────────────────────────
function SSOButton({ icon, label, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? T.bgPage : T.bgWhite,
        border: `1.5px solid ${hover ? T.borderMid : T.border}`,
        borderRadius: 8,
        padding: "11px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        cursor: "pointer",
        fontFamily: T.fontUI,
        fontSize: 12,
        color: hover ? T.textPrimary : T.textSecondary,
        fontWeight: 500,
        transition: "all 0.2s",
        width: "100%",
      }}
    >
      {icon}{label}
    </button>
  );
}

// ─── SUBMIT BUTTON ────────────────────────────────────────────────────────────
function SubmitButton({ loading }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="submit"
      disabled={loading}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: "100%",
        height: 44,
        background: loading
          ? `linear-gradient(135deg,${T.blue700},${T.blue700})`
          : hover
            ? `linear-gradient(135deg,${T.blue400},${T.blue600})`
            : `linear-gradient(135deg,${T.blue600},${T.blue700})`,
        color: "#fff",
        border: "none",
        borderRadius: 8,
        fontFamily: T.fontUI,
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: "0.08em",
        cursor: loading ? "default" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        transition: "background 0.25s, transform 0.15s, box-shadow 0.2s",
        transform: hover && !loading ? "translateY(-1px)" : "none",
        boxShadow: hover && !loading
          ? "0 6px 24px rgba(18,85,204,0.28)"
          : "0 2px 8px rgba(18,85,204,0.15)",
        opacity: loading ? 0.8 : 1,
      }}
    >
      {loading ? <><LoadingSpinner /> Connexion en cours…</> : <>Ouvrir la session <ArrowIcon /></>}
    </button>
  );
}

// ─── LEFT PANEL ───────────────────────────────────────────────────────────────
function LeftPanel({ visible }) {
  const features = [
    "Réunions résumées par l'IA",
    "Kanban de tâches + rappels SMS",
    "Agenda centralisé & ateliers",
    "Tarification en FCFA",
  ];

  return (
    <div style={{
      padding: "clamp(28px,3.5vw,48px) clamp(32px,4vw,52px)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      height: "100%",
      overflow: "hidden",
      background: `linear-gradient(160deg, ${T.blue600} 0%, ${T.blue700} 45%, ${T.blue900} 100%)`,
      borderRight: `1px solid rgba(255,255,255,0.08)`,
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(12px)",
      transition: "opacity 0.8s 0.1s cubic-bezier(0.16,1,0.3,1), transform 0.8s 0.1s cubic-bezier(0.16,1,0.3,1)",
      boxSizing: "border-box",
    }}>
      {/* Logo */}
      <div style={{ flexShrink: 0 }}>
        <XamioLogo height={30} onDark={true} />
      </div>

      {/* Corps éditorial */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 20,
        padding: "clamp(14px,2vh,28px) 0",
        minHeight: 0,
      }}>
        <div>
          <p style={{
            fontFamily: T.fontMono,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.2em",
            color: T.amber,
            textTransform: "uppercase",
            marginBottom: 12,
          }}>
            Du wolof XAM · Savoir
          </p>
          <h1 style={{
            fontFamily: T.fontDisplay,
            fontSize: "clamp(22px, 2.4vw, 36px)",
            lineHeight: 1.1,
            color: "#ffffff",
            fontWeight: 400,
            letterSpacing: "-0.02em",
            margin: "0 0 10px 0",
          }}>
            Gérez votre entreprise.<br />
            <em style={{ fontStyle: "italic", color: T.blueText }}>Simplifiez tout.</em>
          </h1>
          <p style={{
            fontFamily: T.fontUI,
            fontSize: 13,
            lineHeight: 1.65,
            color: "rgba(255,255,255,0.75)",
            maxWidth: 290,
          }}>
            Réunions, tâches, documents, rendez-vous — centralisés dans un seul outil
            pensé pour les entreprises africaines.
          </p>
        </div>

        {/* Features */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {features.map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                background: "rgba(255,255,255,0.13)",
                border: "1px solid rgba(255,255,255,0.22)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                  <polyline points="1.5,5 3.8,7.5 8.5,2" stroke={T.blueText} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span style={{ fontFamily: T.fontUI, fontSize: 12.5, color: "rgba(255,255,255,0.78)", lineHeight: 1.4 }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: "flex",
        gap: 0,
        paddingTop: 20,
        borderTop: "1px solid rgba(255,255,255,0.16)",
        flexShrink: 0,
      }}>
        {[
          { val: "99.9%", label: "Disponibilité" },
          { val: "FCFA",  label: "Tarification" },
        ].map((m, i) => (
          <div key={i} style={{ display: "flex", alignItems: "stretch" }}>
            {i > 0 && <div style={{ width: 1, background: "rgba(255,255,255,0.16)", margin: "0 20px", alignSelf: "stretch" }} />}
            <div>
              <div style={{ fontFamily: T.fontDisplay, fontSize: 20, color: "#fff", lineHeight: 1, marginBottom: 4, fontWeight: 400 }}>{m.val}</div>
              <div style={{ fontFamily: T.fontUI, fontSize: 10, letterSpacing: "0.16em", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", fontWeight: 600 }}>{m.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginTop: 16,
        paddingTop: 14,
        borderTop: "1px solid rgba(255,255,255,0.12)",
        flexShrink: 0,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.success, flexShrink: 0 }} />
        <p style={{ fontFamily: T.fontUI, fontSize: 11, color: "rgba(255,255,255,0.45)", letterSpacing: "0.03em" }}>
          © 2026 XAMIO · Un produit de <strong style={{ color: "rgba(255,255,255,0.65)" }}>Technosus</strong>
        </p>
      </div>
    </div>
  );
}

// ─── MAIN LOGIN PAGE ──────────────────────────────────────────────────────────
export default function LoginPage() {
  const [form, setForm]         = useState({ email: "", pass: "" });
  const [errors, setErrors]     = useState({});
  const [loading, setLoading]   = useState(false);
  const [mounted, setMounted]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  const { login }    = useAuth();
  const { addToast } = useNotif();
  const navigate     = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < BP.mobile);
      setIsTablet(window.innerWidth >= BP.mobile && window.innerWidth < BP.tablet);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const showLeftPanel = !isMobile && !isTablet;

  const validate = () => {
    const e = {};
    if (!form.email) e.email = "Email requis";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Format invalide";
    if (!form.pass) e.pass = "Mot de passe requis";
    else if (form.pass.length < 4) e.pass = "Minimum 4 caractères";
    return e;
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      await login(form.email, form.pass);
      addToast("Connexion réussie — bienvenue sur XAMIO.", "success");
      navigate("/");
    } catch (ex) {
      addToast(ex.message || "Identifiants incorrects.", "error");
      setErrors({ global: ex.message || "Identifiants incorrects." });
    } finally {
      setLoading(false);
    }
  };

  const pageStyle = {
    background: T.bgPage,
    height: "100vh",
    display: "grid",
    gridTemplateColumns: showLeftPanel ? "minmax(300px,420px) 1fr" : "1fr",
    fontFamily: T.fontUI,
    position: "relative",
    overflow: "hidden",
  };

  const rightPanelStyle = {
    background: T.bgWhite,
    padding: isMobile
      ? "28px 22px"
      : isTablet
        ? "40px 44px"
        : "clamp(32px,4vh,60px) clamp(36px,3.5vw,56px)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    height: "100%",
    overflowY: "auto",
    opacity: mounted ? 1 : 0,
    transform: mounted ? "translateY(0)" : "translateY(12px)",
    transition: "opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1)",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { height: 100%; overflow: hidden; background: ${T.bgPage}; }
        @keyframes xmSpin { to { transform: rotate(360deg); } }
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-text-fill-color: ${T.textPrimary} !important;
          -webkit-box-shadow: 0 0 0px 1000px ${T.bgField} inset !important;
          transition: background-color 5000s ease-in-out 0s;
          caret-color: ${T.blue700};
        }
        ::selection { background: ${T.blue400}; color: #fff; }
        input::placeholder { color: ${T.textMuted}; font-weight: 400; }
        input { color-scheme: light; }
      `}</style>

      <div style={pageStyle}>
        <Background />

        {/* Panneau gauche — desktop uniquement */}
        {showLeftPanel && <LeftPanel visible={mounted} />}

        {/* Panneau formulaire */}
        <div style={rightPanelStyle}>
          <div style={{ maxWidth: 380, width: "100%", margin: "0 auto" }}>

            {/* Logo mobile/tablet */}
            {(isMobile || isTablet) && (
              <div style={{ marginBottom: 36 }}>
                <XamioLogo height={28} onDark={false} />
              </div>
            )}

            {/* En-tête */}
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontFamily: T.fontDisplay, fontSize: 26, color: T.textPrimary, fontWeight: 400, marginBottom: 6, lineHeight: 1.2 }}>
                Connexion
              </h2>
              <p style={{ fontFamily: T.fontUI, fontSize: 13, color: T.textSecondary }}>
                Accédez à votre espace de travail.
              </p>
            </div>

            {/* Erreur globale */}
            {errors.global && (
              <div style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: 8,
                padding: "12px 16px",
                marginBottom: 18,
                fontFamily: T.fontUI,
                fontSize: 13,
                color: T.error,
              }}>
                {errors.global}
              </div>
            )}

            {/* Formulaire */}
            <form onSubmit={submit} noValidate>
              <Field
                label="Email professionnel"
                type="email"
                placeholder="vous@entreprise.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                error={errors.email}
                autoComplete="email"
              />
              <Field
                label="Mot de passe"
                type={showPass ? "text" : "password"}
                placeholder="••••••••••"
                value={form.pass}
                onChange={e => setForm({ ...form, pass: e.target.value })}
                error={errors.pass}
                autoComplete="current-password"
                rightSlot={
                  <TextBtn onClick={() => setShowPass(v => !v)}>
                    {showPass ? "Masquer" : "Afficher"}
                  </TextBtn>
                }
              />

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: -6, marginBottom: 20 }}>
                <TextBtn>Mot de passe oublié ?</TextBtn>
              </div>

              <SubmitButton loading={loading} />
            </form>

            {/* Séparateur */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "22px 0 16px" }}>
              <div style={{ flex: 1, height: 1, background: T.border }} />
              <span style={{ fontFamily: T.fontUI, fontSize: 11, color: T.textMuted, letterSpacing: "0.12em", fontWeight: 600, textTransform: "uppercase" }}>
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
                style={{
                  color: T.blue700,
                  cursor: "pointer",
                  fontWeight: 600,
                  borderBottom: `1px solid rgba(18,85,204,0.3)`,
                  paddingBottom: 1,
                  transition: "border-color 0.2s",
                }}
                onMouseOver={e => e.currentTarget.style.borderColor = T.blue700}
                onMouseOut={e => e.currentTarget.style.borderColor = "rgba(18,85,204,0.3)"}
                onClick={() => addToast("Inscription — bientôt disponible.", "info")}
              >
                Créer un espace de travail
              </span>
            </p>

            <p style={{ marginTop: 20, textAlign: "center", fontFamily: T.fontUI, fontSize: 11, color: T.textLight, letterSpacing: "0.03em" }}>
              © 2026 XAMIO · Version 1.0.0
            </p>
          </div>
        </div>
      </div>
    </>
  );
}