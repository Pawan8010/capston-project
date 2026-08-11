import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapPin, RefreshCw } from "lucide-react";
import AppShell from "../components/layout/AppShell";
import PageHeader from "../components/layout/PageHeader";
import { getPredictionHistory } from "../services/api";
import { formatBreed } from "../utils/helpers";
import { useLanguage } from "../context/LanguageContext";
import { Alert, Badge, Button, Card, CardBody, CardHeader, EmptyState, Stat } from "../components/ui";

// Leaflet's default icon URLs break under a bundler; point them at the CDN.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

/**
 * Home tract of each breed the model can predict, keyed by class name.
 *
 * These are the breeds actually in the model — an earlier version plotted
 * Holstein in the Netherlands and Jersey in the Channel Islands, neither
 * of which this classifier has ever seen.
 */
const BREED_ORIGINS = {
  Buffalo_Banni: { coords: [23.75, 69.8], region: "Kutch, Gujarat" },
  Buffalo_Bhadawari: { coords: [26.75, 78.9], region: "Bhadawar, UP / MP" },
  Buffalo_Jaffrabadi: { coords: [21.0, 70.8], region: "Gir forest, Gujarat" },
  Buffalo_Mehsana: { coords: [23.6, 72.4], region: "Mehsana, Gujarat" },
  Buffalo_Murrah: { coords: [28.9, 76.6], region: "Rohtak, Haryana" },
  Buffalo_Nagpuri: { coords: [21.15, 79.09], region: "Nagpur, Maharashtra" },
  Buffalo_Nili_Ravi: { coords: [31.3, 74.9], region: "Sutlej–Ravi, Punjab" },
  Buffalo_Surti: { coords: [21.17, 72.83], region: "Surat, Gujarat" },
  Buffalo_Toda: { coords: [11.4, 76.7], region: "Nilgiris, Tamil Nadu" },
  Cattle_Bargur: { coords: [11.6, 77.4], region: "Bargur hills, Tamil Nadu" },
  Cattle_Dangi: { coords: [20.75, 73.7], region: "Dang, Maharashtra" },
  Cattle_Hallikar: { coords: [12.6, 76.9], region: "Mysore, Karnataka" },
  Cattle_Hariana: { coords: [29.15, 76.3], region: "Rohtak–Hisar, Haryana" },
  Cattle_Kangayam: { coords: [11.0, 77.56], region: "Tiruppur, Tamil Nadu" },
  Cattle_Kankrej: { coords: [24.2, 71.8], region: "Banaskantha, Gujarat" },
  Cattle_Kasargod: { coords: [12.5, 75.0], region: "Kasaragod, Kerala" },
  Cattle_Kenkatha: { coords: [25.2, 79.6], region: "Bundelkhand, UP / MP" },
  Cattle_Khillari: { coords: [17.5, 75.3], region: "Solapur, Maharashtra" },
  Cattle_Krishna_Valley: { coords: [16.5, 75.0], region: "Krishna basin, Karnataka" },
  Cattle_Malnad_Gidda: { coords: [13.9, 75.3], region: "Malnad, Karnataka" },
  Cattle_Nagori: { coords: [27.2, 73.7], region: "Nagaur, Rajasthan" },
  Cattle_Nimari: { coords: [21.8, 75.6], region: "Nimar, Madhya Pradesh" },
};

export default function BreedMap() {
  const { t } = useLanguage();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadHistory = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const data = await getPredictionHistory({ limit: 200 });
      setHistory(data.predictions || []);
      setError("");
    } catch {
      setError("Could not load your scans. Breed home tracts are still shown.");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory(true);
    const interval = setInterval(() => loadHistory(false), 15000);
    return () => clearInterval(interval);
  }, []);

  // Only plot breeds the user has actually identified.
  const points = useMemo(() => {
    const counts = new Map();

    history.forEach((row) => {
      const breed = row.primary_breed;
      if (!breed || !BREED_ORIGINS[breed]) return;

      const entry = counts.get(breed) ?? { breed, count: 0, latest: null };
      entry.count += 1;

      const seen = new Date(row.timestamp || row.created_at);
      if (!Number.isNaN(seen.getTime()) && (!entry.latest || seen > entry.latest)) {
        entry.latest = seen;
      }
      counts.set(breed, entry);
    });

    return [...counts.values()]
      .map((entry) => ({ ...entry, ...BREED_ORIGINS[entry.breed] }))
      .sort((a, b) => b.count - a.count);
  }, [history]);

  return (
    <AppShell title={t("breed_map")}>
      <PageHeader
        eyebrow="Geography"
        title="Breed map"
        subtitle="Where the breeds you have identified come from — each marker is a breed's home tract, sized by how often you have seen it."
        actions={
          <Button variant="secondary" icon={RefreshCw} onClick={() => loadHistory(true)}>
            Refresh
          </Button>
        }
      />

      <div className="stack stack--6">
        {error && <Alert tone="warning">{error}</Alert>}

        <div className="grid grid--3">
          <Stat label="Breeds identified" count={points.length} loading={loading} />
          <Stat label="Total scans" count={history.length} loading={loading} />
          <Stat
            label="Most seen"
            value={points[0] ? formatBreed(points[0].breed) : "—"}
            loading={loading}
          />
        </div>

        <Card>
          <CardHeader title="Home tracts" subtitle="Origin region of each breed you have scanned" />
          <CardBody tight>
            {points.length === 0 && !loading ? (
              <EmptyState icon={MapPin} title="Nothing to map yet">
                Identify an animal and its breed's home region appears here.
              </EmptyState>
            ) : (
              <div className="map-frame">
                <MapContainer center={[22.5, 78.9]} zoom={5} scrollWheelZoom={false}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {points.map((point) => (
                    <Marker key={point.breed} position={point.coords}>
                      <Popup>
                        <strong>{formatBreed(point.breed)}</strong>
                        <br />
                        {point.region}
                        <br />
                        {point.count} {point.count === 1 ? "scan" : "scans"}
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            )}
          </CardBody>
        </Card>

        {points.length > 0 && (
          <Card>
            <CardHeader title="Breeds you have seen" />
            <CardBody>
              <div className="stack stack--3">
                {points.map((point) => (
                  <div key={point.breed} className="row row--between">
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: "var(--weight-medium)" }}>
                        {formatBreed(point.breed)}
                      </div>
                      <div className="text-xs text-muted">{point.region}</div>
                    </div>
                    <Badge tone="neutral">{point.count}</Badge>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
