import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerWithEmailAndPassword, signInWithGoogle } from "../services/auth";
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2 } from "lucide-react";

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm]         = useState({ name:"", email:"", password:"", confirm:"" });
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [gloading, setGloading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const strength = form.password.length >= 8 ? "strong" : form.password.length >= 6 ? "medium" : form.password.length > 0 ? "weak" : "";
  const strengthColor = { strong:"var(--green-400)", medium:"var(--amber-400)", weak:"var(--red-400)" }[strength];
  const strengthWidth = { strong:"100%", medium:"60%", weak:"30%", "":"0%" }[strength];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) { setError("Passwords do not match."); return; }
    if (form.password.length < 6)       { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      await registerWithEmailAndPassword(form.email, form.password, form.name);
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
      <div className="orb orb-green" style={{ width:500,height:500,top:-100,right:-100,opacity:0.25 }} />
      <div className="orb orb-blue"  style={{ width:300,height:300,bottom:0,left:0,opacity:0.2 }} />

      <div className="auth-card anim-fadeup" style={{ position:"relative", zIndex:1 }}>
        {/* Brand */}
        <div style={{ textAlign:"center", marginBottom:"2rem" }}>
          <div style={{ width:56,height:56,background:"linear-gradient(135deg,var(--green-600),var(--green-400))", borderRadius:"var(--radius-lg)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.8rem", margin:"0 auto 1rem", boxShadow:"var(--shadow-green)" }}>
            🐄
          </div>
          <h1 style={{ fontSize:"1.5rem", marginBottom:"0.3rem" }}>
            Join <span className="gradient-text">LivestockAI</span>
          </h1>
          <p style={{ fontSize:"0.875rem", color:"var(--slate-400)" }}>
            Create a free account to start analysing
          </p>
        </div>

        {/* Google */}
        <button
          onClick={handleGoogle}
          disabled={gloading || loading}
          className="btn btn-ghost w-full"
          style={{ marginBottom:"1.25rem", padding:"0.75rem", border:"1.5px solid var(--border)" }}
        >
          {gloading
            ? <><span className="spinner" style={{ width:16,height:16,borderWidth:2 }} /> Signing up…</>
            : <><span style={{ fontSize:"1.1rem" }}>🔐</span> Continue with Google</>
          }
        </button>

        {/* Divider */}
        <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"1.25rem" }}>
          <div style={{ flex:1,height:1,background:"var(--border)" }} />
          <span style={{ fontSize:"0.75rem", color:"var(--slate-500)" }}>or create with email</span>
          <div style={{ flex:1,height:1,background:"var(--border)" }} />
        </div>

        <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:"0.85rem" }}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div className="input-icon-wrap">
              <span className="input-icon"><User size={15} /></span>
              <input className="input" type="text" name="name" placeholder="Your full name"
                value={form.name} onChange={onChange} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email address</label>
            <div className="input-icon-wrap">
              <span className="input-icon"><Mail size={15} /></span>
              <input className="input" type="email" name="email" placeholder="you@example.com"
                value={form.email} onChange={onChange} required autoComplete="email" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-icon-wrap">
              <span className="input-icon"><Lock size={15} /></span>
              <input className="input" type={showPass ? "text" : "password"} name="password"
                placeholder="Min. 6 characters" value={form.password} onChange={onChange}
                required style={{ paddingRight:"2.5rem" }} />
              <button type="button" onClick={() => setShowPass(!showPass)}
                style={{ position:"absolute",right:"0.85rem",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"var(--slate-500)",cursor:"pointer",display:"flex" }}>
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {/* Strength bar */}
            {strength && (
              <div style={{ marginTop:"0.35rem" }}>
                <div style={{ height:3,background:"var(--bg-700)",borderRadius:"999px",overflow:"hidden" }}>
                  <div style={{ height:"100%",width:strengthWidth,background:strengthColor,borderRadius:"999px",transition:"width 0.3s" }} />
                </div>
                <span style={{ fontSize:"0.68rem",color:strengthColor,fontWeight:600,marginTop:"0.2rem",display:"block" }}>
                  {strength.charAt(0).toUpperCase()+strength.slice(1)} password
                </span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div className="input-icon-wrap">
              <span className="input-icon">
                {form.confirm && form.confirm === form.password
                  ? <CheckCircle2 size={15} color="var(--green-400)" />
                  : <Lock size={15} />}
              </span>
              <input className="input" type="password" name="confirm" placeholder="Repeat password"
                value={form.confirm} onChange={onChange} required />
            </div>
          </div>

          {error && <div className="alert alert-error">⚠️ {error}</div>}

          <button type="submit" className="btn btn-primary w-full"
            disabled={loading} style={{ padding:"0.85rem", marginTop:"0.25rem" }}>
            {loading
              ? <><span className="spinner" style={{ width:16,height:16,borderWidth:2 }} /> Creating account…</>
              : <>Create Account <ArrowRight size={16} /></>
            }
          </button>
        </form>

        <div style={{ textAlign:"center", marginTop:"1.5rem", fontSize:"0.875rem", color:"var(--slate-400)" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color:"var(--green-400)", fontWeight:600 }}>Sign in →</Link>
        </div>
      </div>
    </div>
  );
}
