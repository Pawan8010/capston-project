import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, Eye, EyeOff, Lock, Mail, ShieldCheck, User } from "lucide-react";
import LanguageToggle from "../components/LanguageToggle";
import { useLanguage } from "../context/LanguageContext";
import { registerWithEmailAndPassword, signInWithGoogle } from "../services/auth";

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [gloading, setGloading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { t } = useLanguage();

  const strength = form.password.length >= 8 ? "strong" : form.password.length >= 6 ? "medium" : form.password.length > 0 ? "weak" : "";
  const strengthColor = { strong: "var(--green-400)", medium: "var(--amber-400)", weak: "var(--red-400)" }[strength];
  const strengthWidth = { strong: "100%", medium: "60%", weak: "30%", "": "0%" }[strength];

  const cleanError = (message) => (
    message || "Account creation failed."
  ).replace("Firebase: ", "").replace(/\(.*\)/, "").trim();

  const onChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

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
    setGloading(true);
    try {
      await signInWithGoogle();
      navigate("/dashboard");
    } catch (err) {
      setError(cleanError(err.message));
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
            {t("join")} <span className="gradient-text">LivestockAI</span>
          </h1>
          <p className="auth-subtitle">{t("create_free_account")}</p>
        </div>

        <button
          onClick={handleGoogle}
          disabled={gloading || loading}
          className="btn btn-ghost w-full"
          style={{ marginBottom: "1.25rem", padding: "0.75rem", border: "1.5px solid var(--border)" }}
        >
          {gloading ? (
            <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> {t("signing_up")}</>
          ) : (
            <><ShieldCheck size={17} /> {t("continue_google")}</>
          )}
        </button>

        <div className="auth-divider">
          <div />
          <span>{t("or_create_email")}</span>
          <div />
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          <div className="form-group">
            <label className="form-label">{t("full_name")}</label>
            <div className="input-icon-wrap">
              <span className="input-icon"><User size={15} /></span>
              <input
                className="input"
                type="text"
                name="name"
                placeholder="Your full name"
                value={form.name}
                onChange={onChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t("email_address")}</label>
            <div className="input-icon-wrap">
              <span className="input-icon"><Mail size={15} /></span>
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
              <span className="input-icon"><Lock size={15} /></span>
              <input
                className="input"
                type={showPass ? "text" : "password"}
                name="password"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={onChange}
                required
                style={{ paddingRight: "2.5rem" }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="input-eye-button"
                aria-label={showPass ? "Hide password" : "Show password"}
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {strength && (
              <div style={{ marginTop: "0.35rem" }}>
                <div style={{ height: 3, background: "var(--bg-700)", borderRadius: "999px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: strengthWidth, background: strengthColor, borderRadius: "999px", transition: "width 0.3s" }} />
                </div>
                <span style={{ fontSize: "0.68rem", color: strengthColor, fontWeight: 600, marginTop: "0.2rem", display: "block" }}>
                  {strength.charAt(0).toUpperCase() + strength.slice(1)} password
                </span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">{t("confirm_password")}</label>
            <div className="input-icon-wrap">
              <span className="input-icon">
                {form.confirm && form.confirm === form.password
                  ? <CheckCircle2 size={15} color="var(--green-400)" />
                  : <Lock size={15} />}
              </span>
              <input
                className="input"
                type="password"
                name="confirm"
                placeholder="Repeat password"
                value={form.confirm}
                onChange={onChange}
                required
              />
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
              <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> {t("creating_account")}</>
            ) : (
              <>{t("create_account_btn")} <ArrowRight size={16} /></>
            )}
          </button>
        </form>

        <div className="auth-footer-text">
          {t("already_have_account")}{" "}
          <Link to="/login">{t("sign_in")} -&gt;</Link>
        </div>
      </div>
    </div>
  );
}
