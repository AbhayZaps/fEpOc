import { useRef, useState } from "react";
import "./AuthCard.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Default handler so the component works standalone. Replace by passing
// onSignIn / onSignUp props that call your backend (see usage notes).
const demoSubmit = (payload) =>
  new Promise((resolve) => setTimeout(() => resolve(payload), 900));

/* ---------- icons ---------- */
const svgProps = {
  viewBox: "0 0 24 24",
  width: 16,
  height: 16,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

function UserIcon() {
  return (
    <svg {...svgProps}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M5 20c.8-3.6 3.6-5.4 7-5.4s6.2 1.8 7 5.4" />
    </svg>
  );
}

function EyeIcon({ off }) {
  return (
    <svg {...svgProps}>
      <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" />
      <circle cx="12" cy="12" r="2.8" />
      {off && <path d="M4 4l16 16" />}
    </svg>
  );
}

/* ---------- field primitives ---------- */
function Field({ id, label, type = "text", value, onChange, error, autoComplete, trailing }) {
  return (
    <div className={`field${error ? " field--error" : ""}`}>
      <input
        id={id}
        className="field__input"
        type={type}
        placeholder={label}
        aria-label={label}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {trailing}
      {error && (
        <p id={`${id}-error`} className="field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function PasswordField(props) {
  const [shown, setShown] = useState(false);
  return (
    <Field
      {...props}
      type={shown ? "text" : "password"}
      trailing={
        <button
          type="button"
          className="field__icon field__icon--button"
          onClick={() => setShown((s) => !s)}
          aria-label={shown ? "Hide password" : "Show password"}
          aria-pressed={shown}
        >
          <EyeIcon off={shown} />
        </button>
      }
    />
  );
}

/* ---------- shared submit / validation logic ---------- */
function useAuthForm(validate, submit) {
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  async function handleSubmit(e, values, successText) {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    setNotice(null);
    if (Object.keys(found).length) return;

    setBusy(true);
    try {
      await submit(values);
      setNotice({ type: "ok", text: successText });
    } catch (err) {
      setNotice({ type: "error", text: err?.message || "Something went wrong. Try again." });
    } finally {
      setBusy(false);
    }
  }

  return { errors, busy, notice, handleSubmit };
}

/* ---------- sign in ---------- */
function SignInForm({ onSubmit, onSwitch }) {
  const [v, setV] = useState({ identifier: "", password: "", remember: true });
  const set = (key) => (val) => setV((p) => ({ ...p, [key]: val }));

  const { errors, busy, notice, handleSubmit } = useAuthForm((x) => {
    const e = {};
    if (!x.identifier.trim()) e.identifier = "Enter your username or email.";
    if (!x.password) e.password = "Enter your password.";
    else if (x.password.length < 6) e.password = "Password must be at least 6 characters.";
    return e;
  }, onSubmit);

  return (
    <form noValidate onSubmit={(e) => handleSubmit(e, v, "Signed in.")}>
      <h2 className="pane__title">Sign in</h2>

      <Field
        id="signin-identifier"
        label="Username or email"
        value={v.identifier}
        onChange={set("identifier")}
        error={errors.identifier}
        autoComplete="username"
        trailing={<span className="field__icon"><UserIcon /></span>}
      />
      <PasswordField
        id="signin-password"
        label="Password"
        value={v.password}
        onChange={set("password")}
        error={errors.password}
        autoComplete="current-password"
      />

      <div className="row">
        <label className="check">
          <input
            type="checkbox"
            checked={v.remember}
            onChange={(e) => set("remember")(e.target.checked)}
          />
          <span>Keep me signed in</span>
        </label>
        <a className="link" href="/forgot-password">Forgot password?</a>
      </div>

      {notice && <p className={`notice notice--${notice.type}`} role="status">{notice.text}</p>}

      <button className="btn" type="submit" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </button>

      <p className="switch">
        New to Savion?{" "}
        <button type="button" className="link link--strong" onClick={onSwitch}>
          Create an account
        </button>
      </p>
    </form>
  );
}

/* ---------- sign up ---------- */
function SignUpForm({ onSubmit, onSwitch }) {
  const [v, setV] = useState({ name: "", email: "", password: "", confirm: "", agree: false });
  const set = (key) => (val) => setV((p) => ({ ...p, [key]: val }));

  const { errors, busy, notice, handleSubmit } = useAuthForm((x) => {
    const e = {};
    if (!x.name.trim()) e.name = "Enter your full name.";
    if (!EMAIL_RE.test(x.email)) e.email = "Enter a valid email address.";
    if (x.password.length < 8 || !/[A-Za-z]/.test(x.password) || !/\d/.test(x.password))
      e.password = "Use 8+ characters with a letter and a number.";
    if (x.confirm !== x.password) e.confirm = "Passwords don't match.";
    if (!x.agree) e.agree = "Accept the terms to continue.";
    return e;
  }, onSubmit);

  return (
    <form noValidate onSubmit={(e) => handleSubmit(e, v, "Account created.")}>
      <h2 className="pane__title">Create account</h2>

      <Field id="signup-name" label="Full name" value={v.name} onChange={set("name")}
        error={errors.name} autoComplete="name" />
      <Field id="signup-email" label="Email" type="email" value={v.email} onChange={set("email")}
        error={errors.email} autoComplete="email" />
      <PasswordField id="signup-password" label="Password" value={v.password}
        onChange={set("password")} error={errors.password} autoComplete="new-password" />
      <PasswordField id="signup-confirm" label="Confirm password" value={v.confirm}
        onChange={set("confirm")} error={errors.confirm} autoComplete="new-password" />

      <div className="row row--check">
        <label className="check">
          <input
            type="checkbox"
            checked={v.agree}
            onChange={(e) => set("agree")(e.target.checked)}
            aria-invalid={Boolean(errors.agree)}
          />
          <span>I agree to the terms and privacy policy</span>
        </label>
      </div>
      {errors.agree && <p className="field__error field__error--inline" role="alert">{errors.agree}</p>}

      {notice && <p className={`notice notice--${notice.type}`} role="status">{notice.text}</p>}

      <button className="btn" type="submit" disabled={busy}>
        {busy ? "Creating account…" : "Create account"}
      </button>

      <p className="switch">
        Already on Savion?{" "}
        <button type="button" className="link link--strong" onClick={onSwitch}>
          Sign in
        </button>
      </p>
    </form>
  );
}

/* ---------- the card ---------- */
export default function AuthCard({
  onSignIn = demoSubmit,
  onSignUp = demoSubmit,
  initialMode = "signin",
}) {
  const [mode, setMode] = useState(initialMode);
  const cardRef = useRef(null);

  const switchTo = (next) => {
    setMode(next);
    // Move focus into the form that the blade just revealed.
    setTimeout(() => {
      cardRef.current?.querySelector(`.pane--${next} input`)?.focus({ preventScroll: true });
    }, 650);
  };

  return (
    <main className="auth-stage">
      <div className="auth" data-mode={mode} ref={cardRef}>
        <section className="pane pane--signin" aria-hidden={mode !== "signin"}>
          <SignInForm onSubmit={onSignIn} onSwitch={() => switchTo("signup")} />
        </section>

        <section className="pane pane--signup" aria-hidden={mode !== "signup"}>
          <SignUpForm onSubmit={onSignUp} onSwitch={() => switchTo("signin")} />
        </section>

        {/* One blade that slides across; its text is counter-skewed so it stays upright. */}
        <div className="band" aria-hidden="true">
          <div className="band__inner">
            <div className="welcome welcome--in">
              <span className="welcome__brand">Savion</span>
              <h3 className="welcome__title">Welcome2 <em>LMS.</em></h3>
              <p className="welcome__copy">
                Your boards, your drafts and your people are exactly where you left them.
              </p>
            </div>
            <div className="welcome welcome--up">
              <span className="welcome__brand">Savion</span>
              <h3 className="welcome__title">LMS Start <em>here.</em></h3>
              <p className="welcome__copy">
                Make an account and bring your boards, drafts and people into one place.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
