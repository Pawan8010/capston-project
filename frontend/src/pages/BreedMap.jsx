import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Activity, Clock3, MapPin, RefreshCw } from "lucide-react";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import { getPredictionHistory } from "../services/api";
import { useLanguage } from "../context/LanguageContext";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const BREED_LOCATIONS = [
  { name: "Gir", key: "Gir", coords: [21.1702, 71.8311], origin: "Gujarat, India", details: "Heat tolerant breed known for rich A2 milk." },
  { name: "Holstein", key: "Holstein", coords: [52.1326, 5.2913], origin: "Netherlands", details: "High production dairy breed." },
  { name: "Jersey", key: "Jersey", coords: [49.2144, -2.1312], origin: "Jersey Island, UK", details: "High butterfat dairy breed." },
  { name: "Sahiwal", key: "Sahiwal", coords: [30.6682, 73.1114], origin: "Punjab region", details: "Heat adapted dual-purpose breed." },
  { name: "Red Sindhi", key: "Red_Sindhi", coords: [25.3960, 68.3578], origin: "Sindh region", details: "Hardy breed suited for dry climates." },
];

const formatTime = (value) => {
  if (!value) return "No realtime scans";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "No realtime scans" : date.toLocaleString();
};

export default function BreedMap() {
  const { t } = useLanguage();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadHistory = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const data = await getPredictionHistory({ limit: 100 });
      setHistory(data.predictions || []);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Live map data is unavailable. Static breed origins are still shown.");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory(true);
    const interval = setInterval(() => loadHistory(false), 7000);
    return () => clearInterval(interval);
  }, []);

  const enrichedBreeds = useMemo(() => {
    const counts = history.reduce((acc, item) => {
      const key = item.primary_breed;
      if (!key) return acc;
      acc[key] = acc[key] || { count: 0, latest: null, realtime: 0 };
      acc[key].count += 1;
      if (item.source === "realtime") acc[key].realtime += 1;
      const timestamp = item.timestamp || item.created_at;
      if (timestamp && (!acc[key].latest || new Date(timestamp) > new Date(acc[key].latest))) {
        acc[key].latest = timestamp;
      }
      return acc;
    }, {});

    return BREED_LOCATIONS.map((breed) => ({
      ...breed,
      count: counts[breed.key]?.count || 0,
      realtime: counts[breed.key]?.realtime || 0,
      latest: counts[breed.key]?.latest,
    }));
  }, [history]);

  const totalRealtime = history.filter((item) => item.source === "realtime").length;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Realtime breed map"
        title="Live Breed Origin Map"
        description="Breed markers update from your saved upload and live camera predictions while preserving the known geographic origin of each breed."
        breadcrumbs={[
          { label: t("dashboard"), to: "/dashboard" },
          { label: t("breed_map") },
        ]}
        actions={(
          <button type="button" className="btn btn-outline" onClick={() => loadHistory(true)}>
            <RefreshCw size={16} className={loading ? "spin" : ""} /> Refresh map
          </button>
        )}
      />

      {error && <div className="alert alert-error workspace-alert">Error: {error}</div>}

      <section className="map-live-grid">
        <div className="workspace-card map-stat-card">
          <Activity size={18} />
          <div>
            <span>Total mapped scans</span>
            <strong>{history.length}</strong>
          </div>
        </div>
        <div className="workspace-card map-stat-card">
          <Clock3 size={18} />
          <div>
            <span>Realtime camera scans</span>
            <strong>{totalRealtime}</strong>
          </div>
        </div>
        <div className="workspace-card map-stat-card">
          <MapPin size={18} />
          <div>
            <span>Active breed regions</span>
            <strong>{enrichedBreeds.filter((breed) => breed.count > 0).length}</strong>
          </div>
        </div>
      </section>

      <section className="map-shell">
        <div className="map-panel">
          <MapContainer
            center={[24, 42]}
            zoom={3}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {enrichedBreeds.map((breed) => (
              <Marker key={breed.name} position={breed.coords}>
                <Popup className="custom-popup">
                  <div className="map-popup">
                    <h3>{breed.name}</h3>
                    <p><MapPin size={12} /> {breed.origin}</p>
                    <span>{breed.details}</span>
                    <div className="map-popup-stats">
                      <strong>{breed.count}</strong> saved scans
                      <br />
                      <strong>{breed.realtime}</strong> realtime scans
                      <br />
                      Latest: {formatTime(breed.latest)}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <aside className="workspace-card map-feed">
          <div className="workspace-card-title">
            <Activity size={18} />
            <span>Live map feed</span>
          </div>
          {history.length === 0 ? (
            <p className="map-feed-empty">Run a live scan or upload an image. Results will appear here automatically.</p>
          ) : (
            history.slice(0, 8).map((item) => (
              <div key={item._id} className="map-feed-row">
                <div>
                  <strong>{(item.primary_breed || "Unknown").replace("_", " ")}</strong>
                  <p>{item.source === "realtime" ? "Realtime scanner" : "Image upload"} · {Math.round((item.confidence || 0) > 1 ? item.confidence : (item.confidence || 0) * 100)}%</p>
                </div>
                <span>{formatTime(item.timestamp).split(",")[0]}</span>
              </div>
            ))
          )}
        </aside>
      </section>
    </AppShell>
  );
}
