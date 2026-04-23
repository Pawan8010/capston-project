import React from "react";
import Sidebar from "../components/Sidebar";
import VoiceAssistant from "../components/VoiceAssistant";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapPin } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

// Fix for default marker icons in Leaflet with Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const BREED_LOCATIONS = [
  { name: "Gir", coords: [21.1702, 71.8311], origin: "Gujarat, India", details: "Known for heat tolerance and rich A2 milk." },
  { name: "Holstein", coords: [52.1326, 5.2913], origin: "Netherlands", details: "World's highest production dairy animals." },
  { name: "Jersey", coords: [49.2144, -2.1312], origin: "Jersey Island, UK", details: "Known for high butterfat content in milk." },
  { name: "Sahiwal", coords: [30.6682, 73.1114], origin: "Punjab, Pakistan", details: "Tick-resistant and highly adapted to heat." },
  { name: "Red Sindhi", coords: [25.3960, 68.3578], origin: "Sindh, Pakistan", details: "Hardy breed suited for extreme drought conditions." },
];

export default function BreedMap() {
  const { t } = useLanguage();
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <h2 className="text-2xl font-bold mb-1">
            🌍 {t("global_breed")} <span className="gradient-text">{t("origins")}</span>
          </h2>
          <p className="text-sm text-gray-500">{t("breed_map_desc")}</p>
        </div>

        <div className="card p-0 overflow-hidden" style={{ height: "calc(100vh - 180px)" }}>
          <MapContainer 
            center={[20.0, 40.0]} 
            zoom={3} 
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>'
              url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
            />
            {BREED_LOCATIONS.map((breed) => (
              <Marker key={breed.name} position={breed.coords}>
                <Popup className="custom-popup">
                  <div className="font-sans">
                    <h3 className="font-bold text-lg mb-1">{breed.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                      <MapPin size={12} /> {breed.origin}
                    </div>
                    <p className="text-sm">{breed.details}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
      <VoiceAssistant />
    </div>
  );
}
