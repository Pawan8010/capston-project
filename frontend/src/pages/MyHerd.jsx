import React, { useEffect, useMemo, useState } from "react";
import { Activity, Droplets, Inbox, Search, Sun, Upload as UploadIcon } from "lucide-react";
import AppShell from "../components/layout/AppShell";
import PageHeader from "../components/layout/PageHeader";
import { getBreeds, getPredictionHistory } from "../services/api";
import { useLanguage } from "../context/LanguageContext";
import { formatBreed } from "../utils/helpers";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Input,
  Skeleton,
  Stat,
} from "../components/ui";

/**
 * The herd, derived from what the user has actually identified.
 *
 * The previous version listed invented animals with invented vitals. A
 * register of animals nobody entered is worse than an empty one, so this
 * groups real scans by breed and pulls the care facts from the backend's
 * breed table.
 */
export default function MyHerd() {
  const { t } = useLanguage();
  const [history, setHistory] = useState([]);
  const [breedInfo, setBreedInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;

    Promise.all([getPredictionHistory({ limit: 200 }), getBreeds().catch(() => null)])
      .then(([historyData, breedData]) => {
        if (cancelled) return;
        setHistory(historyData.predictions || []);
        const table = {};
        (breedData?.breeds || []).forEach((breed) => {
          table[breed.name] = breed;
        });
        setBreedInfo(table);
        setError("");
      })
      .catch(() => !cancelled && setError("Could not load your herd."))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, []);

  const groups = useMemo(() => {
    const byBreed = new Map();

    history.forEach((row) => {
      const breed = row.primary_breed;
      if (!breed) return;

      const entry = byBreed.get(breed) ?? { breed, count: 0, confidenceSum: 0, lastSeen: null };
      entry.count += 1;
      entry.confidenceSum += (row.confidence || 0) > 1 ? row.confidence : (row.confidence || 0) * 100;

      const seen = new Date(row.timestamp || row.created_at);
      if (!Number.isNaN(seen.getTime()) && (!entry.lastSeen || seen > entry.lastSeen)) {
        entry.lastSeen = seen;
      }

      byBreed.set(breed, entry);
    });

    return [...byBreed.values()]
      .map((entry) => ({ ...entry, avgConfidence: Math.round(entry.confidenceSum / entry.count) }))
      .sort((a, b) => b.count - a.count);
  }, [history]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return groups;
    return groups.filter((group) => formatBreed(group.breed).toLowerCase().includes(needle));
  }, [groups, query]);

  return (
    <AppShell title={t("my_herd")}>
      <PageHeader
        eyebrow="Your animals"
        title={t("my_herd") || "My herd"}
        subtitle="Breeds you have identified, grouped from your scan history."
        actions={
          <Button to="/upload" variant="primary" icon={UploadIcon}>
            Identify an animal
          </Button>
        }
      />

      <div className="stack stack--6">
        {error && <Alert tone="danger">{error}</Alert>}

        <div className="grid grid--3">
          <Stat label="Distinct breeds" count={groups.length} loading={loading} />
          <Stat label="Total identifications" count={history.length} loading={loading} />
          <Stat
            label="Average confidence"
            count={
              groups.length
                ? Math.round(groups.reduce((sum, g) => sum + g.avgConfidence, 0) / groups.length)
                : 0
            }
            suffix="%"
            loading={loading}
          />
        </div>

        <Input
          icon={Search}
          placeholder={t("search_breed") || "Search breeds"}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search your herd"
        />

        {loading ? (
          <div className="grid grid--3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} height="11rem" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <Card>
            <CardBody>
              <EmptyState
                icon={Inbox}
                title={query ? "No breeds match that search" : "Your herd is empty"}
                action={
                  query ? (
                    <Button variant="secondary" onClick={() => setQuery("")}>
                      Clear search
                    </Button>
                  ) : (
                    <Button to="/upload" variant="primary" icon={UploadIcon}>
                      Identify your first animal
                    </Button>
                  )
                }
              >
                {query
                  ? "Try a different breed name."
                  : "Every animal you identify is grouped here by breed, with its care guidance."}
              </EmptyState>
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid--3">
            {visible.map((group) => {
              const info = breedInfo[group.breed] || {};
              return (
                <Card key={group.breed} interactive>
                  <CardHeader>
                    <div style={{ minWidth: 0 }}>
                      <h3 className="card__title">{formatBreed(group.breed)}</h3>
                      <p className="card__subtitle">
                        {group.count} {group.count === 1 ? "sighting" : "sightings"}
                        {group.lastSeen && ` · last ${group.lastSeen.toLocaleDateString()}`}
                      </p>
                    </div>
                    <Badge tone={group.avgConfidence >= 85 ? "success" : "neutral"}>
                      {group.avgConfidence}%
                    </Badge>
                  </CardHeader>

                  <CardBody>
                    <div className="stack stack--3">
                      {info.milk_yield && (
                        <div className="row text-sm">
                          <Droplets size={15} style={{ color: "var(--brand-text)" }} aria-hidden="true" />
                          <span className="text-muted">Milk</span>
                          <span className="spacer" />
                          <span>{info.milk_yield}</span>
                        </div>
                      )}
                      {info.climate && (
                        <div className="row text-sm">
                          <Sun size={15} style={{ color: "var(--brand-text)" }} aria-hidden="true" />
                          <span className="text-muted">Climate</span>
                          <span className="spacer" />
                          <span className="text-truncate" style={{ maxWidth: "16ch" }}>{info.climate}</span>
                        </div>
                      )}
                      {info.avg_weight_kg && (
                        <div className="row text-sm">
                          <Activity size={15} style={{ color: "var(--brand-text)" }} aria-hidden="true" />
                          <span className="text-muted">Avg weight</span>
                          <span className="spacer" />
                          <span>{info.avg_weight_kg} kg</span>
                        </div>
                      )}
                      {!info.milk_yield && !info.climate && (
                        <p className="text-sm text-muted">No care guidance recorded for this breed.</p>
                      )}
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
