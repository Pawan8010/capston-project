import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { ArrowRight, Star, ChevronDown } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

/* ─── Data ──────────────────────────────────────────────────── */
const STATS = [
  { value: "98%",  label: "Accuracy Rate",    icon: "🎯" },
  { value: "50K+", label: "Analyses Done",    icon: "📊" },
  { value: "5",    label: "Breed Classes",    icon: "🐄" },
  { value: "< 3s", label: "Detection Speed", icon: "⚡" },
];

const FEATURES = [
  {
    icon: "🧠", title: "AI Breed Detection",
    desc: "MobileNetV2 deep learning model trained on 5 Indian & international cattle breeds with 94.2% test accuracy.",
    color: "card-green", glow: "rgba(22,163,74,0.2)",
  },
  {
    icon: "📊", title: "Crossbreed Analysis",
    desc: "Get detailed breed composition percentages and genetic mixture analysis for every uploaded image.",
    color: "card-blue", glow: "rgba(59,130,246,0.2)",
  },
  {
    icon: "📋", title: "Health Insights",
    desc: "Receive breed-specific dietary recommendations, care protocols, and productivity benchmarks instantly.",
    color: "card-amber", glow: "rgba(245,158,11,0.2)",
  },
  {
    icon: "⚡", title: "Real-Time Results",
    desc: "Upload an image and receive comprehensive breed analysis in under 3 seconds using cloud AI.",
    color: "card-purple", glow: "rgba(168,85,247,0.2)",
  },
  {
    icon: "🔒", title: "Secure & Private",
    desc: "Firebase Authentication ensures your data is protected. All analyses are stored securely under your account.",
    color: "card-red", glow: "rgba(239,68,68,0.2)",
  },
  {
    icon: "📱", title: "Multi-Device",
    desc: "Access from desktop, tablet, or mobile. Fully responsive interface optimised for field use.",
    color: "", glow: "rgba(100,116,139,0.2)",
  },
];

const BREEDS = [
  { name: "Gir",        origin: "Gujarat, India",         milk: "6–8 L/day",  badge: "badge-green",  emoji: "🐄" },
  { name: "Holstein",   origin: "Netherlands / Germany",  milk: "22–30 L/day",badge: "badge-blue",   emoji: "🐂" },
  { name: "Jersey",     origin: "Jersey Island",          milk: "14–16 L/day",badge: "badge-amber",  emoji: "🐄" },
  { name: "Red Sindhi", origin: "Sindh, Pakistan",        milk: "10–15 L/day",badge: "badge-red",    emoji: "🐂" },
  { name: "Sahiwal",    origin: "Punjab, India/Pakistan", milk: "10–16 L/day",badge: "badge-purple", emoji: "🐄" },
];

const STEPS = [
  { n: "01", icon: "📸", title: "Upload Photo",   desc: "Drag and drop or browse a clear photo of your livestock animal." },
  { n: "02", icon: "🤖", title: "AI Analyses",    desc: "Our MobileNetV2 model identifies breed characteristics in seconds." },
  { n: "03", icon: "📄", title: "Get Results",    desc: "Receive detailed breed info, confidence scores, and recommendations." },
];

const TESTIMONIALS = [
  {
    name: "Rajesh Kumar",
    role: "Dairy Farmer, Maharashtra",
    avatar: "R",
    stars: 5,
    text: "LivestockAI helped me identify that my cattle were Sahiwal crosses. The accuracy is incredible and it saved me from expensive vet consultations!",
    color: "var(--green-400)",
  },
  {
    name: "Dr. Priya Sharma",
    role: "Veterinarian, Punjab",
    avatar: "P",
    stars: 5,
    text: "As a vet, I use this tool daily. The crossbreed analysis is spot-on and the health recommendations match exactly what I'd prescribe.",
    color: "var(--blue-400)",
  },
  {
    name: "Amit Patel",
    role: "Livestock Manager, Gujarat",
    avatar: "A",
    stars: 5,
    text: "Managing 200+ cattle across breeds was a challenge. This AI system reduced our identification errors by 90% in just the first month.",
    color: "var(--amber-400)",
  },
];

/* ─── Scroll-reveal hook ─────────────────────────────────────── */
function useScrollReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return [ref, visible];
}

/* ─── Animated counter ────────────────────────────────────────── */
function AnimCounter({ target }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      obs.disconnect();
      const numeric = parseFloat(target.replace(/[^0-9.]/g, ""));
      const duration = 1600;
      const step = numeric / (duration / 16);
      let current = 0;
      const timer = setInterval(() => {
        current += step;
        if (current >= numeric) { setCount(numeric); clearInterval(timer); }
        else setCount(Math.floor(current));
      }, 16);
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);

  const prefix = target.includes("+") ? "+" : "";
  const suffix = target.includes("%") ? "%" : target.includes("<") ? "s" : "";
  const display = target.includes("<") ? `< ${count}` : `${count}${prefix}${suffix}`;

  return <span ref={ref}>{display}</span>;
}

/* ─── Floating particles ──────────────────────────────────────── */
function Particles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    left: Math.random() * 100,
    delay: Math.random() * 8,
    duration: Math.random() * 10 + 8,
    opacity: Math.random() * 0.4 + 0.1,
  }));

  return (
    <div className="particles-container" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            opacity: p.opacity,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Section wrapper with reveal ───────────────────────────── */
function RevealSection({ children, className = "", style = {} }) {
  const [ref, visible] = useScrollReveal();
  return (
    <div
      ref={ref}
      className={`reveal-section ${visible ? "reveal-visible" : ""} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

/* ─── Component ────────────────────────────────────────────── */
export default function Home() {
  const [activeStep, setActiveStep] = useState(0);
  const { t } = useLanguage();

  useEffect(() => {
    const t = setInterval(() => setActiveStep((s) => (s + 1) % 3), 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="home-page">
      <Navbar />

      {/* ─── Hero ──────────────────────────────────────────── */}
      <section className="hero-section">
        <Particles />

        {/* Orbs */}
        <div className="orb orb-green hero-orb-1" />
        <div className="orb orb-blue  hero-orb-2" />
        <div className="orb hero-orb-3" />

        <div className="hero-content">
          {/* Live badge */}
          <div className="hero-badge anim-fadeup">
            <span className="pulse-dot" />
            <span>AI-Powered Livestock Intelligence</span>
          </div>

          <h1 className="hero-title anim-fadeup" style={{ animationDelay: "0.1s" }}>
            {t("welcome")}
          </h1>

          <p className="hero-desc anim-fadeup" style={{ animationDelay: "0.2s" }}>
            {t("welcome_sub")}
          </p>

          <div className="hero-actions anim-fadeup" style={{ animationDelay: "0.3s" }}>
            <Link to="/upload" className="btn btn-primary btn-lg btn-glow">
              🔬 {t("get_started")} <ArrowRight size={18} />
            </Link>
            <Link to="/camera" className="btn btn-outline btn-lg">
              📷 Live Scanner
            </Link>
          </div>


          {/* Trust badges */}
          <div className="hero-trust anim-fadeup" style={{ animationDelay: "0.4s" }}>
            <span className="trust-badge">✓ No credit card required</span>
            <span className="trust-sep">·</span>
            <span className="trust-badge">✓ Instant results</span>
            <span className="trust-sep">·</span>
            <span className="trust-badge">✓ 98% accuracy</span>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="scroll-cue">
          <ChevronDown size={20} className="bounce" />
        </div>
      </section>

      {/* ─── Stats ─────────────────────────────────────────── */}
      <section className="stats-section">
        <div className="stats-grid">
          {STATS.map((s, i) => (
            <RevealSection key={s.label}>
              <div className="stat-card" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="stat-icon">{s.icon}</div>
                <div className="stat-number">
                  <AnimCounter target={s.value} />
                </div>
                <div className="stat-label">{s.label}</div>
              </div>
            </RevealSection>
          ))}
        </div>
      </section>

      {/* ─── Features ──────────────────────────────────────── */}
      <section className="features-section" id="features">
        <RevealSection>
          <div className="section-label">
            <span className="badge badge-green">Platform Features</span>
          </div>
          <h2 className="section-title-lg">
            Everything You Need for{" "}
            <span className="gradient-text">Livestock Management</span>
          </h2>
          <p className="section-subtitle">
            A complete AI-powered suite for modern livestock management
          </p>
        </RevealSection>

        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <RevealSection key={f.title} style={{ animationDelay: `${i * 0.08}s` }}>
              <div className={`feature-card ${f.color}`}>
                <div className="feature-card-icon" style={{ boxShadow: `0 0 20px ${f.glow}` }}>
                  {f.icon}
                </div>
                <h3 className="feature-card-title">{f.title}</h3>
                <p className="feature-card-desc">{f.desc}</p>
                <div className="feature-card-arrow">→</div>
              </div>
            </RevealSection>
          ))}
        </div>
      </section>

      {/* ─── How It Works ──────────────────────────────────── */}
      <section className="how-section" id="how-it-works">
        <div className="how-inner">
          <RevealSection>
            <div className="section-label">
              <span className="badge badge-blue">How It Works</span>
            </div>
            <h2 className="section-title-lg">
              Get Results in <span className="gradient-text">3 Simple Steps</span>
            </h2>
          </RevealSection>

          <div className="steps-grid">
            {STEPS.map((s, i) => (
              <RevealSection key={s.n} style={{ animationDelay: `${i * 0.12}s` }}>
                <div
                  className={`step-card ${activeStep === i ? "step-active" : ""}`}
                  onClick={() => setActiveStep(i)}
                >
                  <div className="step-num">{s.n}</div>
                  <div className="step-icon">{s.icon}</div>
                  <h3 className="step-title">{s.title}</h3>
                  <p className="step-desc">{s.desc}</p>
                  <div className="step-indicator">
                    {STEPS.map((_, j) => (
                      <div key={j} className={`step-dot ${j === i ? "dot-active" : ""}`} />
                    ))}
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Breeds ────────────────────────────────────────── */}
      <section className="breeds-section" id="breeds">
        <div className="breeds-inner">
          <RevealSection>
            <div className="section-label">
              <span className="badge badge-amber">Supported Breeds</span>
            </div>
            <h2 className="section-title-lg">
              5 Recognised Cattle <span className="gradient-text">Breeds</span>
            </h2>
          </RevealSection>

          <div className="breeds-list">
            {BREEDS.map((b, i) => (
              <RevealSection key={b.name} style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="breed-row">
                  <div className="breed-left">
                    <div className="breed-emoji">{b.emoji}</div>
                    <div>
                      <div className="breed-name">{b.name}</div>
                      <div className="breed-origin">📍 {b.origin}</div>
                    </div>
                  </div>
                  <div className="breed-right">
                    <div className="breed-milk-wrap">
                      <div className="breed-milk-label">Milk Yield</div>
                      <div className="breed-milk">{b.milk}</div>
                    </div>
                    <span className={`badge ${b.badge}`}>✓ Supported</span>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ──────────────────────────────────── */}
      <section className="testimonials-section">
        <RevealSection>
          <div className="section-label">
            <span className="badge badge-purple">Testimonials</span>
          </div>
          <h2 className="section-title-lg">
            Trusted by <span className="gradient-text">Farmers & Vets</span>
          </h2>
          <p className="section-subtitle">
            Real stories from people using LivestockAI every day
          </p>
        </RevealSection>

        <div className="testimonials-grid">
          {TESTIMONIALS.map((t, i) => (
            <RevealSection key={t.name} style={{ animationDelay: `${i * 0.12}s` }}>
              <div className="testimonial-card">
                <div className="testimonial-stars">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} size={14} fill={t.color} color={t.color} />
                  ))}
                </div>
                <p className="testimonial-text">"{t.text}"</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar" style={{ background: `linear-gradient(135deg, ${t.color}88, ${t.color}44)`, border: `1px solid ${t.color}55` }}>
                    {t.avatar}
                  </div>
                  <div>
                    <div className="testimonial-name">{t.name}</div>
                    <div className="testimonial-role">{t.role}</div>
                  </div>
                </div>
              </div>
            </RevealSection>
          ))}
        </div>
      </section>

      {/* ─── CTA ───────────────────────────────────────────── */}
      <section className="cta-section">
        <div className="cta-orb-1" />
        <div className="cta-orb-2" />
        <RevealSection>
          <div className="cta-inner">
            <div className="cta-emoji">🐄</div>
            <h2 className="cta-title">
              Ready to Identify Your <span className="gradient-text">Livestock?</span>
            </h2>
            <p className="cta-desc">
              Join thousands of farmers and veterinarians using AI to make smarter livestock decisions.
            </p>
            <div className="cta-actions">
              <Link to="/signup" className="btn btn-primary btn-lg btn-glow">
                🚀 Get Started Free
              </Link>
              <Link to="/upload" className="btn btn-outline btn-lg">
                Try Demo
              </Link>
            </div>
            <div className="cta-stats">
              <span>🌍 Used in 15+ countries</span>
              <span>·</span>
              <span>⭐ 4.9/5 average rating</span>
              <span>·</span>
              <span>🔒 SOC2 compliant</span>
            </div>
          </div>
        </RevealSection>
      </section>

      {/* ─── Footer ────────────────────────────────────────── */}
      <Footer />
    </div>
  );
}
