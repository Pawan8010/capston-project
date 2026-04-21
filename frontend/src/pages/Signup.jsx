import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerWithEmailAndPassword, signInWithGoogle } from "../services/auth";

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm]       = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) { setError("Passwords do not match."); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      await registerWithEmailAndPassword(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message.replace("Firebase: ", "").replace(/\(.*\)/, "").trim());
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setError(""); setGoogleLoading(true);
    try {
      await signInWithGoogle();
      navigate("/dashboard");
    } catch (err) {
      setError(err.message.replace("Firebase: ", "").replace(/\(.*\)/, "").trim());
    } finally { setGoogleLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card anim-fadeup">
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🐄</div>
          <h1 style={{ fontSize: "1.75rem", marginBottom: "0.25rem" }}>
            Join <span className="gradient-text">LivestockAI</span>
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--slate-400)" }}>
            Create a free account to get started
          </p>
        </div>

        <button
          onClick={handleGoogle}
          disabled={googleLoading || loading}
          className="btn btn-ghost w-full"
          style={{ border: "1.5px solid rgba(255,255,255,0.1)", marginBottom: "1.25rem", padding: "0.7rem", fontSize: "0.9rem" }}
        >
          {googleLoading ? (
            <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Signing up…</>
          ) : (
            <><span style={{ fontSize: "1.1rem" }}>🔐</span> Continue with Google</>
          )}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
          <div className="divider" style={{ flex: 1, margin: 0 }} />
          <span style={{ fontSize: "0.75rem", color: "var(--slate-500)" }}>or create with email</span>
          <div className="divider" style={{ flex: 1, margin: 0 }} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          <div className="form-group">
            <label className="form-label" htmlFor="signup-name">Full Name</label>
            <div className="input-icon-wrap">
              <span className="input-icon">👤</span>
              <input id="signup-name" className="input" type="text" name="name" placeholder="Your name" value={form.name} onChange={onChange} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="signup-email">Email address</label>
            <div className="input-icon-wrap">
              <span className="input-icon">✉️</span>
              <input id="signup-email" className="input" type="email" name="email" placeholder="you@example.com" value={form.email} onChange={onChange} required autoComplete="email" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="signup-password">Password</label>
            <div className="input-icon-wrap">
              <span className="input-icon">🔒</span>
              <input id="signup-password" className="input" type="password" name="password" placeholder="Min. 6 characters" value={form.password} onChange={onChange} required autoComplete="new-password" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="signup-confirm">Confirm Password</label>
            <div className="input-icon-wrap">
              <span className="input-icon">🔒</span>
              <input id="signup-confirm" className="input" type="password" name="confirm" placeholder="Repeat password" value={form.confirm} onChange={onChange} required autoComplete="new-password" />
            </div>
          </div>

          {error && <div className="alert alert-error">⚠️ {error}</div>}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: "0.25rem", padding: "0.85rem" }}>
            {loading ? (
              <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Creating account…</>
            ) : "Create Account →"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.875rem", color: "var(--slate-400)" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--green-400)", fontWeight: 600 }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}
