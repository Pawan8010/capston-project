import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import LanguageToggle from "../components/LanguageToggle";
import { useLanguage } from "../context/LanguageContext";
import { loginWithEmailAndPassword, signInWithGoogle } from "../services/auth";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [gloading, setGloading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { t } = useLanguage();

  const cleanError = (message) => (
    message || "Sign in failed."
  ).replace("Firebase: ", "").replace(/\(.*\)/, "").trim();

  const onChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

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

  const handleGoogle = async () => {
    setError("");
    setGloading(true);
    try {
      await signInWithGoogle();
      navigate("/dashboard");
    } catch (err) {
      setError(cleanError(err.message || "Google sign-in failed."));
    } finally {
      setGloading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-language-shell">
        <LanguageToggle />
      </div>

      <div className="auth-card">
        <div className="auth-brand-block">
          <div className="auth-brand-mark">
            <span>AI</span>
          </div>
          <h1 className="auth-title">
            {t("welcome_back")} <span className="gradient-text">LivestockAI</span>
          </h1>
          <p className="auth-subtitle">{t("sign_in_desc")}</p>
        </div>

        <button
          onClick={handleGoogle}
          disabled={gloading || loading}
          className="btn btn-ghost w-full"
          style={{ marginBottom: "1.25rem", padding: "0.75rem", border: "1.5px solid var(--border)" }}
        >
          {gloading ? (
            <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> {t("signing_in")}</>
          ) : (
            <><ShieldCheck size={17} /> {t("continue_google")}</>
          )}
        </button>

        <div className="auth-divider">
          <div />
          <span>{t("or_sign_email")}</span>
          <div />
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="form-group">
            <label className="form-label">{t("email_address")}</label>
            <div className="input-icon-wrap">
              <span className="input-icon"><Mail size={16} /></span>
              <input
                className="input"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={onChange}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t("password")}</label>
            <div className="input-icon-wrap">
              <span className="input-icon"><Lock size={16} /></span>
              <input
                className="input"
                type={showPass ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={onChange}
                required
                autoComplete="current-password"
                style={{ paddingRight: "2.5rem" }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="input-eye-button"
                aria-label={showPass ? "Hide password" : "Show password"}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && <div className="alert alert-error">Error: {error}</div>}

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
            style={{ padding: "0.85rem", marginTop: "0.25rem" }}
          >
            {loading ? (
              <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> {t("signing_in")}</>
            ) : (
              <>{t("login")} <ArrowRight size={16} /></>
            )}
          </button>
        </form>

        <div className="auth-footer-text">
          {t("no_account")}{" "}
          <Link to="/signup">{t("create_one")} -&gt;</Link>
        </div>
      </div>
    </div>
  );
}
