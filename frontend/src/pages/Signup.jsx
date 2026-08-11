import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, BarChart3, Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles, User } from "lucide-react";
import LanguageToggle from "../components/LanguageToggle";
import ThemeToggle from "../components/ThemeToggle";
import AuthAside from "../components/layout/AuthAside";
import { useLanguage } from "../context/LanguageContext";
import { registerWithEmailAndPassword, signInWithGoogle } from "../services/auth";
import { Alert, Button, Input, Progress } from "../components/ui";

const cleanError = (message) =>
  (message || "Account creation failed.").replace("Firebase: ", "").replace(/\(.*\)/, "").trim();

/** Length is the only signal available without a strength library; label
 *  it honestly rather than implying a real entropy estimate. */
function strengthOf(password) {
  if (!password) return null;
  if (password.length >= 12) return { label: "Strong", value: 100, tone: "var(--success)" };
  if (password.length >= 8) return { label: "Good", value: 66, tone: "var(--brand)" };
  if (password.length >= 6) return { label: "Weak", value: 38, tone: "var(--warning)" };
  return { label: "Too short", value: 15, tone: "var(--danger)" };
}

export default function Signup() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const strength = strengthOf(form.password);
  const mismatch = form.confirm.length > 0 && form.confirm !== form.password;

  const onChange = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      await registerWithEmailAndPassword(form.email, form.password, form.name);
      navigate("/dashboard");
    } catch (err) {
      setError(cleanError(err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      navigate("/dashboard");
    } catch (err) {
      setError(cleanError(err.message));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="auth">
      <AuthAside
        pitch="Start identifying breeds in minutes."
        sub="Free to create. Your scans, herd records and history stay tied to your account."
        points={[
          { icon: Sparkles, text: "22 Indian cattle and buffalo breeds" },
          { icon: BarChart3, text: "Track every scan with confidence scores" },
          { icon: ShieldCheck, text: "Works offline-tolerant, degrades cleanly" },
        ]}
      />

      <div className="auth__main">
        <div className="auth__form">
          <div className="row row--between" style={{ marginBottom: "var(--space-8)" }}>
            <span className="eyebrow">{t("signup")}</span>
            <div className="row">
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </div>

          {/* "Join" is a fragment in the copy table; the brand completes it. */}
          <h1 className="auth__title">
            {t("join")} <span className="text-gradient">LivestockAI</span>
          </h1>
          <p className="auth__lede">{t("create_free_account")}</p>

          <Button
            variant="secondary"
            size="lg"
            block
            icon={ShieldCheck}
            loading={googleLoading}
            disabled={loading}
            onClick={handleGoogle}
          >
            {t("continue_google")}
          </Button>

          <div className="divider--labelled" style={{ margin: "var(--space-6) 0" }}>
            {t("or_sign_email")}
          </div>

          <form onSubmit={handleSubmit} className="stack stack--4">
            <Input
              label="Full name"
              name="name"
              icon={User}
              placeholder="Your full name"
              value={form.name}
              onChange={onChange}
              required
              autoComplete="name"
            />

            <Input
              label={t("email_address")}
              type="email"
              name="email"
              icon={Mail}
              placeholder="you@example.com"
              value={form.email}
              onChange={onChange}
              required
              autoComplete="email"
            />

            <div>
              <div style={{ position: "relative" }}>
                <Input
                  label={t("password")}
                  type={showPassword ? "text" : "password"}
                  name="password"
                  icon={Lock}
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={onChange}
                  required
                  autoComplete="new-password"
                  style={{ paddingRight: "2.75rem" }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  icon={showPassword ? EyeOff : Eye}
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  style={{ position: "absolute", right: 4, bottom: 4 }}
                />
              </div>

              {strength && (
                <div className="row" style={{ marginTop: "var(--space-2)" }}>
                  <Progress value={strength.value} size="sm" label="Password strength" />
                  <span className="text-xs text-muted" style={{ minWidth: "5.5ch" }}>
                    {strength.label}
                  </span>
                </div>
              )}
            </div>

            <Input
              label="Confirm password"
              type={showPassword ? "text" : "password"}
              name="confirm"
              icon={Lock}
              placeholder="Repeat password"
              value={form.confirm}
              onChange={onChange}
              required
              autoComplete="new-password"
              error={mismatch ? "Passwords do not match." : undefined}
            />

            {error && <Alert tone="danger">{error}</Alert>}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              block
              loading={loading}
              disabled={mismatch}
              iconRight={ArrowRight}
            >
              {t("signup")}
            </Button>
          </form>

          <p className="auth__meta">
            {t("have_account") || "Already have an account?"} <Link to="/login">{t("login")}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
