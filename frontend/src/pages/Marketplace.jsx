import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Tag, MapPin, CheckCircle2, ShoppingBag, ArrowRight, TrendingUp } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

const LISTINGS = [
  { id: 1, breed: "Gir", price: "₹85,000", location: "Rajkot, Gujarat", milk: "12L/day", age: "3 yrs", verified: true, image: "🐄" },
  { id: 2, breed: "Holstein", price: "₹1,20,000", location: "Ludhiana, Punjab", milk: "28L/day", age: "4 yrs", verified: true, image: "🐂" },
  { id: 3, breed: "Sahiwal", price: "₹75,000", location: "Rohtak, Haryana", milk: "15L/day", age: "5 yrs", verified: true, image: "🐄" },
  { id: 4, breed: "Jersey", price: "₹95,000", location: "Pune, Maharashtra", milk: "18L/day", age: "2 yrs", verified: true, image: "🐂" },
];

export default function Marketplace() {
  const { t } = useLanguage();

  return (
    <div className="home-page">
      <Navbar />
      
      <main className="main-content" style={{ marginLeft: 0, paddingTop: "8rem" }}>
        <div className="container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem" }}>
          
          <div className="flex justify-between items-end mb-10 anim-fadeup">
            <div>
              <div className="hero-badge" style={{ marginBottom: "0.75rem" }}>
                <TrendingUp size={14} /> Live Market Prices
              </div>
              <h1 className="hero-title" style={{ fontSize: "2.8rem", marginBottom: "0.5rem" }}>
                {t("marketplace")}
              </h1>
              <p className="text-muted">Buy and sell AI-verified livestock with confidence.</p>
            </div>
            <div className="flex gap-3">
              <button className="btn btn-outline">My Listings</button>
              <button className="btn btn-primary btn-glow">List Animal</button>
            </div>
          </div>

          {/* Market Ticker */}
          <div className="card card-glass mb-8 anim-fadeup" style={{ padding: "1rem", overflow: "hidden", whiteSpace: "nowrap" }}>
            <div className="flex gap-8 items-center">
              <div className="flex items-center gap-2">
                <span className="badge badge-green">UP</span>
                <span className="text-sm font-bold">Gir: ₹82k - ₹95k</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge badge-red">DOWN</span>
                <span className="text-sm font-bold">Jersey: ₹90k - ₹110k</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge badge-blue">STABLE</span>
                <span className="text-sm font-bold">Holstein: ₹1.2L - ₹1.5L</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge badge-green">UP</span>
                <span className="text-sm font-bold">Sahiwal: ₹70k - ₹85k</span>
              </div>
            </div>
          </div>

          <div className="grid-4 mb-12">
            {LISTINGS.map((l, i) => (
              <div key={l.id} className="card anim-fadeup" style={{ padding: 0, overflow: "hidden", animationDelay: `${i * 0.1}s` }}>
                <div style={{ height: "160px", background: "var(--bg-700)", display: "flex", alignItems: "center", justifyIn: "center", fontSize: "4rem" }}>
                  {l.image}
                </div>
                <div style={{ padding: "1.25rem" }}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-muted uppercase tracking-wider">{l.breed}</span>
                    <div className="flex items-center gap-1 text-green-400 text-xs font-bold">
                      <CheckCircle2 size={12} /> AI VERIFIED
                    </div>
                  </div>
                  <h3 className="stat-value" style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>{l.price}</h3>
                  
                  <div className="flex flex-direction-column gap-2 mb-4">
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <MapPin size={12} /> {l.location}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <ShoppingBag size={12} /> Yield: {l.milk}
                    </div>
                  </div>

                  <button className="btn btn-ghost w-full">View Details <ArrowRight size={14} /></button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
