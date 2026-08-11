import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Camera, Eye, EyeOff, HeartPulse, Lock, Mail, ShieldCheck, UserRound } from "lucide-react";
import LanguageToggle from "../components/LanguageToggle";
import ThemeToggle from "../components/ThemeToggle";
import AuthAside from "../components/layout/AuthAside";
import { useLanguage } from "../context/LanguageContext";
import { loginWithEmailAndPassword, signInDemoMode, signInWithGoogle } from "../services/auth";
import { Alert, Button, Input } from "../components/ui";

/** Firebase prefixes its codes and parenthesises the raw error; neither
 *  helps someone who just mistyped a password. */
const cleanError = (message) =>
  (message || "Sign in failed.").replace("Firebase: ", "").replace(/\(.*\)/, "").trim();

export default function Login() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const onChange = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await loginWithEmailAndPassword(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(cleanError(err.message));
    } finally {
      setLoading(false);
    }
  };

  // Local session, no Firebase round-trip. The backend accepts the matching
  // "demo-token" when AUTH_ALLOW_MOCK is on, so the whole app is explorable
  // without any Firebase project configured.
  const handleDemo = async () => {
    setError("");
    setDemoLoading(true);
    try {
      await signInDemoMode();
      navigate("/dashboard");
    } catch (err) {
      setError(cleanError(err.message || "Could not start a demo session."));
    } finally {
      setDemoLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      navigate("/dashboard");
    } catch (err) {
      setError(cleanError(err.message || "Google sign-in failed."));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="auth">
      <AuthAside
        pitch="Know the breed. Know the care."
        sub="Point a camera at an animal and get its breed, then husbandry guidance written for Indian conditions."
        points={[
          { icon: Camera, text: "Photo or live camera identification" },
          { icon: HeartPulse, text: "Breed-specific feed and disease guidance" },
          { icon: ShieldCheck, text: "Your scan history, private to your account" },
        ]}
      />

      <div className="auth__main">
        <div className="auth__form">
          <div className="row row--between" style={{ marginBottom: "var(--space-8)" }}>
            <span className="eyebrow">{t("login")}</span>
            <div className="row">
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </div>

          {/* The copy key is a fragment ("Welcome back to"), so the brand
              name has to follow it or the heading reads as cut off. */}
          <h1 className="auth__title">
            {t("welcome_back")} <span className="text-gradient">LivestockAI</span>
          </h1>
          <p className="auth__lede">{t("sign_in_desc")}</p>

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

            <div style={{ position: "relative" }}>
              <Input
                label={t("password")}
                type={showPassword ? "text" : "password"}
                name="password"
                icon={Lock}
                placeholder="••••••••"
                value={form.password}
                onChange={onChange}
                required
                autoComplete="current-password"
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

            {error && <Alert tone="danger">{error}</Alert>}

            <Button type="submit" variant="primary" size="lg" block loading={loading} iconRight={ArrowRight}>
              {t("login")}
            </Button>
          </form>

          <p className="auth__meta">
            {t("no_account")} <Link to="/signup">{t("create_one")}</Link>
          </p>

          <div className="divider--labelled" style={{ margin: "var(--space-6) 0 var(--space-4)" }}>
            just looking?
          </div>

          <Button
            variant="ghost"
            size="sm"
            block
            icon={UserRound}
            loading={demoLoading}
            disabled={loading || googleLoading}
            onClick={handleDemo}
          >
            Continue as demo user
          </Button>
        </div>
      </div>
    </div>
  );
}
