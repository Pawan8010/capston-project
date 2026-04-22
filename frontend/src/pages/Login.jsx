import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginWithEmailAndPassword, signInWithGoogle } from "../services/auth";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm]           = useState({ email: "", password: "" });
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [gloading, setGloading]   = useState(false);
  const [showPass, setShowPass]   = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await loginWithEmailAndPassword(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message.replace("Firebase: ", "").replace(/\(.*\)/, "").trim());
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setError(""); setGloading(true);
    try {
      await signInWithGoogle();
      navigate("/dashboard");
    } catch (err) {
      setError(err.message.replace("Firebase: ", "").replace(/\(.*\)/, "").trim());
    } finally { setGloading(false); }
  };

  return (
    <div className="auth-page">
      {/* Background orbs */}
      <div className="orb orb-green" style={{ width:500,height:500,top:-150,left:"50%",transform:"translateX(-60%)",opacity:0.3 }} />
      <div className="orb orb-blue"  style={{ width:300,height:300,bottom:0,right:0,opacity:0.2 }} />

      <div className="auth-card anim-fadeup" style={{ position:"relative", zIndex:1 }}>
        {/* Brand */}
        <div style={{ textAlign:"center", marginBottom:"2rem" }}>
          <div style={{ width:60,height:60,background:"linear-gradient(135deg,var(--green-600),var(--green-400))", borderRadius:"var(--radius-lg)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"2rem", margin:"0 auto 1rem", boxShadow:"var(--shadow-green)" }}>
            🐄
          </div>
          <h1 style={{ fontSize:"1.6rem", marginBottom:"0.3rem" }}>
            Welcome back to <span className="gradient-text">LivestockAI</span>
          </h1>
          <p style={{ fontSize:"0.875rem", color:"var(--slate-400)" }}>
            Sign in to your account to continue
          </p>
        </div>

        {/* Google */}
        <button
          onClick={handleGoogle}
          disabled={gloading || loading}
          className="btn btn-ghost w-full"
          style={{ marginBottom:"1.25rem", padding:"0.75rem", border:"1.5px solid var(--border)" }}
        >
          {gloading ? (
            <><span className="spinner" style={{ width:16,height:16,borderWidth:2 }} /> Signing in…</>
          ) : (
            <><span style={{ fontSize:"1.1rem" }}>🔐</span> Continue with Google</>
          )}
        </button>

        {/* Divider */}
        <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"1.25rem" }}>
          <div style={{ flex:1,height:1,background:"var(--border)" }} />
          <span style={{ fontSize:"0.75rem", color:"var(--slate-500)" }}>or sign in with email</span>
          <div style={{ flex:1,height:1,background:"var(--border)" }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <div className="input-icon-wrap">
              <span className="input-icon"><Mail size={16} /></span>
              <input
                className="input"
                type="email" name="email" placeholder="you@example.com"
                value={form.email} onChange={onChange} required autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-icon-wrap">
              <span className="input-icon"><Lock size={16} /></span>
              <input
                className="input"
                type={showPass ? "text" : "password"} name="password" placeholder="••••••••"
                value={form.password} onChange={onChange} required autoComplete="current-password"
                style={{ paddingRight:"2.5rem" }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{ position:"absolute", right:"0.85rem", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"var(--slate-500)", cursor:"pointer", display:"flex" }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && <div className="alert alert-error">⚠️ {error}</div>}

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
            style={{ padding:"0.85rem", marginTop:"0.25rem" }}
          >
            {loading
              ? <><span className="spinner" style={{ width:16,height:16,borderWidth:2 }} /> Signing in…</>
              : <>Sign In <ArrowRight size={16} /></>
            }
          </button>
        </form>

        <div style={{ textAlign:"center", marginTop:"1.5rem", fontSize:"0.875rem", color:"var(--slate-400)" }}>
          Don't have an account?{" "}
          <Link to="/signup" style={{ color:"var(--green-400)", fontWeight:600 }}>Create one →</Link>
        </div>
      </div>
    </div>
  );
}
