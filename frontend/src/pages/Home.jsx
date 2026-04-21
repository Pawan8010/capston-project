import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

const FEATURES = [
  { icon: "🧬", color: "icon-green",  title: "AI Breed Detection",      desc: "MobileNetV2-powered deep learning identifies 5 cattle breeds with high accuracy." },
  { icon: "📊", color: "icon-blue",   title: "Crossbreed Breakdown",    desc: "Get a percentage composition of all breed contributors in your livestock." },
  { icon: "⚡", color: "icon-amber",  title: "Instant Results",         desc: "Upload a photo and receive detailed breed analysis in seconds." },
  { icon: "📂", color: "icon-purple", title: "History & Export",        desc: "Save all analyses, review past results, and download JSON reports." },
];

const BREEDS = [
  { name: "Gir",        origin: "Gujarat, India",         milk: "6–8 L/day",   badge: "badge-green" },
  { name: "Holstein",   origin: "Netherlands / Germany",  milk: "22–30 L/day", badge: "badge-blue" },
  { name: "Jersey",     origin: "Jersey Island",          milk: "14–16 L/day", badge: "badge-amber" },
  { name: "Red Sindhi", origin: "Sindh, Pakistan",        milk: "10–15 L/day", badge: "badge-red" },
  { name: "Sahiwal",    origin: "Punjab, India/Pakistan", milk: "10–16 L/day", badge: "badge-purple" },
];

const STATS = [
  { value: "94.2%",  label: "Model Accuracy" },
  { value: "5",      label: "Breed Classes" },
  { value: "<2s",    label: "Analysis Time" },
  { value: "10MB",   label: "Max Image Size" },
];

export default function Home() {
  return (
    <div className="page bg-mesh">
      <Navbar />

      {/* Hero */}
      <section className="section container" style={{ paddingTop: "6rem", paddingBottom: "5rem" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center" }}>
          <div className="hero-badge anim-fadeup">
            <span className="pulse-dot" />
            AI-Powered Livestock Intelligence
          </div>
          <h1 className="anim-fadeup anim-delay-1">
            Identify Cattle Breeds<br />with <span className="gradient-text">AI Precision</span>
          </h1>
          <p className="anim-fadeup anim-delay-2" style={{ fontSize: "1.1rem", margin: "1.25rem 0 2.5rem", color: "var(--slate-300)", lineHeight: 1.8 }}>
            Upload a livestock photo and our deep-learning model instantly classifies
            the breed, shows confidence levels, and provides a detailed crossbreed composition.
          </p>
          <div className="hero-cta anim-fadeup anim-delay-3" style={{ justifyContent: "center" }}>
            <Link to="/upload" className="btn btn-primary btn-lg">
              🔬 Start Analysis
            </Link>
            <Link to="/signup" className="btn btn-outline btn-lg">
              Create Free Account
            </Link>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid-4 anim-fadeup anim-delay-4" style={{ maxWidth: 800, margin: "4rem auto 0" }}>
          {STATS.map((s) => (
            <div key={s.label} className="card text-center card-hover" style={{ padding: "1.25rem" }}>
              <div className="stat-value gradient-text">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="section container">
        <div className="text-center section-header" style={{ marginBottom: "3rem" }}>
          <span className="badge badge-green badge-lg" style={{ marginBottom: "1rem" }}>Features</span>
          <h2>Everything You Need for<br /><span className="gradient-text">Livestock Analysis</span></h2>
        </div>
        <div className="grid-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="card card-hover">
              <div className={`feature-icon ${f.color}`}>{f.icon}</div>
              <h3 style={{ marginBottom: "0.5rem" }}>{f.title}</h3>
              <p style={{ fontSize: "0.9rem", lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Breeds */}
      <section className="section container">
        <div className="text-center section-header" style={{ marginBottom: "3rem" }}>
          <span className="badge badge-amber badge-lg" style={{ marginBottom: "1rem" }}>Breed Database</span>
          <h2>Supported <span className="gradient-text">Cattle Breeds</span></h2>
        </div>
        <div className="grid-3" style={{ maxWidth: 900, margin: "0 auto" }}>
          {BREEDS.map((b) => (
            <div key={b.name} className="card card-hover" style={{ textAlign: "center" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🐄</div>
              <h3 style={{ marginBottom: "0.25rem" }}>{b.name}</h3>
              <p style={{ fontSize: "0.8rem", marginBottom: "0.75rem" }}>📍 {b.origin}</p>
              <span className={`badge ${b.badge}`}>🥛 {b.milk}</span>
            </div>
          ))}
          <div className="card card-hover" style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🔬</div>
            <p style={{ fontSize: "0.85rem", color: "var(--slate-400)" }}>More breeds coming soon</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section container" style={{ paddingBottom: "6rem" }}>
        <div className="card text-center" style={{ maxWidth: 700, margin: "0 auto", padding: "3.5rem 2rem", background: "linear-gradient(135deg, rgba(34,197,94,0.08), rgba(59,130,246,0.06))", border: "1px solid rgba(34,197,94,0.2)" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🚀</div>
          <h2 style={{ marginBottom: "1rem" }}>Ready to Analyse Your <span className="gradient-text">Livestock?</span></h2>
          <p style={{ marginBottom: "2rem" }}>Join farmers and researchers using AI to understand their cattle better.</p>
          <Link to="/upload" className="btn btn-primary btn-lg">Get Started Free →</Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "1.5rem", textAlign: "center" }}>
        <p style={{ fontSize: "0.8rem", color: "var(--slate-500)" }}>
          © 2025 LivestockAI — AI-Powered Cattle Breed Classification
        </p>
      </footer>
    </div>
  );
}
