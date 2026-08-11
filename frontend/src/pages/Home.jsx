import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  Camera,
  CloudOff,
  Gauge,
  HeartPulse,
  Layers,
  MapPin,
  ScanLine,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CountUp from "../components/CountUp";
import useScrollReveal from "../hooks/useScrollReveal";
import { getBreeds, getHealth } from "../services/api";
import { Badge, Button, Card, CardBody } from "../components/ui";

const FEATURES = [
  {
    icon: ScanLine,
    title: "Photo identification",
    body: "Upload a picture and get the breed, its confidence, and the runners-up the model also considered.",
  },
  {
    icon: Camera,
    title: "Live camera scanning",
    body: "Point a device camera at an animal and read the breed as it frames — no shutter, no upload step.",
  },
  {
    icon: HeartPulse,
    title: "Husbandry guidance",
    body: "Milk yield, climate fit, feed and the diseases each breed is prone to, for Indian conditions.",
  },
  {
    icon: Layers,
    title: "Crossbreed reading",
    body: "When the top two predictions are close, the split is shown instead of forcing a single label.",
  },
  {
    icon: MapPin,
    title: "Breed map",
    body: "See where your identifications happened and which breeds cluster in which regions.",
  },
  {
    icon: Gauge,
    title: "Honest confidence",
    body: "Low-confidence results say so. A weak guess is labelled weak rather than dressed up as an answer.",
  },
];

const STEPS = [
  { title: "Capture", body: "Take a side-on photo in daylight, or open the live scanner." },
  { title: "Identify", body: "The model returns the breed with a confidence score and alternatives." },
  { title: "Act", body: "Read the care guide for that breed, then keep the scan in your history." },
];

function Section({ id, children, className = "" }) {
  const [ref, visible] = useScrollReveal();
  return (
    <section id={id} ref={ref} className={`section reveal-section ${visible ? "reveal-visible" : ""} ${className}`.trim()}>
      {children}
    </section>
  );
}

export default function Home() {
  const [breedCount, setBreedCount] = useState(null);
  const [modelLoaded, setModelLoaded] = useState(null);

  // Everything quantitative on this page comes from the backend. If it is
  // unreachable the figure is omitted rather than replaced with a guess.
  useEffect(() => {
    let cancelled = false;

    getBreeds()
      .then((data) => !cancelled && data?.count && setBreedCount(data.count))
      .catch(() => {});

    getHealth()
      .then((data) => !cancelled && setModelLoaded(Boolean(data?.model_loaded)))
      .catch(() => !cancelled && setModelLoaded(false));

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="marketing">
      <Navbar />

      <section className="hero">
        <div className="container">
          <span className="hero__badge">
            <Sparkles size={15} aria-hidden="true" />
            Indian cattle &amp; buffalo breed recognition
          </span>

          <h1 className="text-display">
            Know the breed.
            <br />
            <span className="text-gradient">Know the care.</span>
          </h1>

          <p className="hero__lede">
            Identify Indian cattle and buffalo from a photo or a live camera feed, then get
            husbandry guidance written for the breed in front of you — milk yield, climate fit,
            feed and disease risk.
          </p>

          <div className="hero__cta">
            <Button to="/signup" variant="primary" size="xl" iconRight={ArrowRight}>
              Get started free
            </Button>
            <Button to="/camera" variant="secondary" size="xl" icon={Camera}>
              Try the live scanner
            </Button>
          </div>

          <div className="row row--wrap" style={{ justifyContent: "center", marginTop: "var(--space-8)" }}>
            {breedCount && (
              <Badge tone="brand" size="lg">
                <CountUp value={breedCount} /> breeds recognised
              </Badge>
            )}
            {modelLoaded !== null && (
              <Badge tone={modelLoaded ? "success" : "warning"} size="lg" dot pulse={modelLoaded}>
                {modelLoaded ? "Model online" : "Model not loaded"}
              </Badge>
            )}
          </div>
        </div>
      </section>

      <Section id="features">
        <div className="container">
          <div className="section__head">
            <h2 className="section__title">Everything you need to work a mixed herd</h2>
            <p className="section__lede">
              Built around one thing: telling you what animal you are looking at, and what it needs.
            </p>
          </div>

          <div className="grid grid--3">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <Card key={title} className="feature-card" interactive>
                <CardBody>
                  <span className="feature-card__icon">
                    <Icon size={22} aria-hidden="true" />
                  </span>
                  <h3 className="feature-card__title">{title}</h3>
                  <p className="feature-card__body">{body}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </Section>

      <Section id="how">
        <div className="container">
          <div className="section__head">
            <h2 className="section__title">Three steps, start to answer</h2>
          </div>

          <div className="grid grid--3 steps">
            {STEPS.map((step, index) => (
              <Card key={step.title}>
                <CardBody>
                  <span className="step__num">{index + 1}</span>
                  <h3 className="feature-card__title">{step.title}</h3>
                  <p className="feature-card__body">{step.body}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </Section>

      <Section id="accuracy">
        <div className="container container--narrow">
          <div className="section__head">
            <h2 className="section__title">Where it is honest about its limits</h2>
          </div>

          <div className="stack stack--4">
            <Card>
              <CardBody>
                <div className="row row--start">
                  <span className="feature-card__icon" style={{ marginBottom: 0 }}>
                    <ShieldCheck size={20} aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="feature-card__title">No model, no guess</h3>
                    <p className="feature-card__body">
                      If no trained model is loaded, prediction returns an error explaining that —
                      it never invents a breed to fill the gap.
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="row row--start">
                  <span className="feature-card__icon" style={{ marginBottom: 0 }}>
                    <Gauge size={20} aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="feature-card__title">Hard pairs stay hard</h3>
                    <p className="feature-card__body">
                      Some breeds are genuinely difficult to separate from one photo — Sahiwal
                      against Red Sindhi, or Cattle Bargur against Buffalo Bargur. Confidence is
                      reported per prediction so you can see when the model is unsure.
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="row row--start">
                  <span className="feature-card__icon" style={{ marginBottom: 0 }}>
                    <CloudOff size={20} aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="feature-card__title">Degrades cleanly</h3>
                    <p className="feature-card__body">
                      Without a database it keeps working in memory. Without an assistant key it
                      falls back to built-in guidance. Each part fails on its own.
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </Section>

      <section className="section">
        <div className="container">
          <div className="cta-band">
            <h2 className="cta-band__title">Start identifying in under a minute</h2>
            <p className="cta-band__lede">
              Create a free account and your scans, herd and history stay tied to it.
            </p>
            <div className="row" style={{ justifyContent: "center" }}>
              <Button to="/signup" variant="primary" size="lg" iconRight={ArrowRight}>
                Create account
              </Button>
              <Button to="/login" variant="secondary" size="lg">
                Sign in
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
