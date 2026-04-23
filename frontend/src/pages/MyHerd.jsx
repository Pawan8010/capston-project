import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Plus, Search, Filter, MoreVertical, Heart, Activity, Thermometer, Weight, Calendar } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

const MOCK_HERD = [
  { id: 1, name: "Gauri", breed: "Gir", age: "4 years", weight: "450kg", health: "Excellent", temperature: "38.5°C", status: "Active", image: "🐄" },
  { id: 2, name: "Lakshmi", breed: "Holstein", age: "3 years", weight: "620kg", health: "Good", temperature: "38.7°C", status: "Active", image: "🐂" },
  { id: 3, name: "Nandini", breed: "Sahiwal", age: "5 years", weight: "400kg", health: "Fair", temperature: "39.1°C", status: "Monitoring", image: "🐄" },
  { id: 4, name: "Kapila", breed: "Jersey", age: "2 years", weight: "380kg", health: "Excellent", temperature: "38.4°C", status: "Active", image: "🐂" },
];

export default function MyHerd() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="home-page">
      <Navbar />
      
      <main className="main-content" style={{ marginLeft: 0, paddingTop: "8rem" }}>
        <div className="container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem" }}>
          
          {/* Header Section */}
          <div className="flex justify-between items-center mb-8 anim-fadeup">
            <div>
              <h1 className="hero-title" style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>
                {t("my_herd")}
              </h1>
              <p className="text-muted">{t("digital_barn")} • {MOCK_HERD.length} {t("breeds_detected")}</p>
            </div>
            <button className="btn btn-primary btn-lg btn-glow">
              <Plus size={20} /> {t("add_animal")}
            </button>
          </div>

          {/* Stats Overview */}
          <div className="grid-4 mb-8 anim-fadeup" style={{ animationDelay: "0.1s" }}>
            <div className="card card-green">
              <div className="flex justify-between items-start">
                <div>
                  <div className="stat-label">Average Health</div>
                  <div className="stat-value">94%</div>
                </div>
                <div className="feature-icon" style={{ background: "rgba(22,163,74,0.1)", marginBottom: 0 }}>
                  <Heart size={24} color="var(--green-400)" />
                </div>
              </div>
              <div className="stat-trend up">↑ 2.4% from last month</div>
            </div>
            <div className="card card-blue">
              <div className="flex justify-between items-start">
                <div>
                  <div className="stat-label">Active Scans</div>
                  <div className="stat-value">128</div>
                </div>
                <div className="feature-icon" style={{ background: "rgba(59,130,246,0.1)", marginBottom: 0 }}>
                  <Activity size={24} color="var(--blue-400)" />
                </div>
              </div>
              <div className="stat-trend up">↑ 12 new this week</div>
            </div>
            <div className="card card-amber">
              <div className="flex justify-between items-start">
                <div>
                  <div className="stat-label">Total Weight</div>
                  <div className="stat-value">1.8t</div>
                </div>
                <div className="feature-icon" style={{ background: "rgba(245,158,11,0.1)", marginBottom: 0 }}>
                  <Weight size={24} color="var(--amber-400)" />
                </div>
              </div>
              <div className="stat-trend down">↓ 0.5% (Feed Change)</div>
            </div>
            <div className="card card-purple">
              <div className="flex justify-between items-start">
                <div>
                  <div className="stat-label">Next Checkup</div>
                  <div className="stat-value">Apr 28</div>
                </div>
                <div className="feature-icon" style={{ background: "rgba(168,85,247,0.1)", marginBottom: 0 }}>
                  <Calendar size={24} color="var(--purple-400)" />
                </div>
              </div>
              <div className="stat-trend">3 animals scheduled</div>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="flex gap-3 mb-6 anim-fadeup" style={{ animationDelay: "0.2s" }}>
            <div className="input-icon-wrap" style={{ flex: 1 }}>
              <Search className="input-icon" />
              <input 
                type="text" 
                className="input" 
                placeholder={t("search_breed")} 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="btn btn-ghost">
              <Filter size={18} /> Filter
            </button>
          </div>

          {/* Herd Grid */}
          <div className="grid-3 mb-12">
            {MOCK_HERD.filter(h => h.name.toLowerCase().includes(searchTerm.toLowerCase())).map((animal, i) => (
              <div 
                key={animal.id} 
                className="card anim-fadeup" 
                style={{ animationDelay: `${0.3 + (i * 0.1)}s`, padding: "1.25rem" }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-3 items-center">
                    <div className="sidebar-logo" style={{ width: "50px", height: "50px", fontSize: "1.8rem" }}>
                      {animal.image}
                    </div>
                    <div>
                      <h3 className="font-bold" style={{ fontSize: "1.1rem" }}>{animal.name}</h3>
                      <span className={`badge ${animal.breed === 'Gir' ? 'badge-green' : 'badge-blue'}`}>
                        {animal.breed}
                      </span>
                    </div>
                  </div>
                  <button className="btn btn-ghost" style={{ padding: "0.4rem", borderRadius: "50%" }}>
                    <MoreVertical size={18} />
                  </button>
                </div>

                <div className="grid-2 gap-3 mb-4">
                  <div className="stat-card" style={{ padding: "0.75rem", background: "var(--bg-700)" }}>
                    <div className="flex items-center gap-2 text-xs text-muted mb-1">
                      <Thermometer size={12} /> Temp
                    </div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 700 }}>{animal.temperature}</div>
                  </div>
                  <div className="stat-card" style={{ padding: "0.75rem", background: "var(--bg-700)" }}>
                    <div className="flex items-center gap-2 text-xs text-muted mb-1">
                      <Weight size={12} /> Weight
                    </div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 700 }}>{animal.weight}</div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted">Health Status</span>
                    <span className={animal.health === 'Excellent' ? 'text-green-400' : 'text-amber-400'}>
                      {animal.health}
                    </span>
                  </div>
                  <div className="progress-wrap">
                    <div 
                      className="progress-bar" 
                      style={{ 
                        width: animal.health === 'Excellent' ? '95%' : animal.health === 'Good' ? '80%' : '60%',
                        background: animal.health === 'Excellent' ? 'var(--green-500)' : 'var(--amber-500)'
                      }} 
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-border">
                  <span className="text-xs text-muted">Last scan: 2 days ago</span>
                  <button className="btn btn-primary btn-sm">Details</button>
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
