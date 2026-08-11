import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart2,
  Camera,
  Cpu,
  History as HistoryIcon,
  Inbox,
  Star,
  Upload as UploadIcon,
} from "lucide-react";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import AppShell from "../components/layout/AppShell";
import PageHeader from "../components/layout/PageHeader";
import { formatBreed } from "../utils/helpers";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { getUserAnalytics } from "../services/api";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Skeleton,
  Stat,
} from "../components/ui";

const SERIES = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
];

const TOOLTIP_STYLE = {
  background: "var(--surface-raised)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-lg)",
  color: "var(--text)",
  fontSize: "var(--text-sm)",
  boxShadow: "var(--shadow-lg)",
};

const formatConfidence = (value) => {
  if (!value) return "0%";
  return `${Math.round(value > 1 ? value : value * 100)}%`;
};

const formatTime = (value) => {
  if (!value) return "Just now";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Just now"
    : date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
};

export default function Dashboard() {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const data = await getUserAnalytics();
      setAnalytics(data);
      setError("");
    } catch {
      setError("Analytics are unavailable right now. Upload and live scanning still work.");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  // Poll so a scan taken on another device shows up without a refresh.
  useEffect(() => {
    let active = true;
    loadAnalytics(true);
    const interval = setInterval(() => active && loadAnalytics(false), 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [loadAnalytics]);

  const breedDistribution = analytics?.breed_distribution || {};
  const totalScans = analytics?.total_scans || 0;
  const lineData = analytics?.scans_per_day || [];
  const latest = analytics?.latest_predictions || [];
  const averageConfidence = analytics?.average_confidence || 0;
  const topBreed = Object.entries(breedDistribution).sort(([, a], [, b]) => b - a)[0]?.[0];

  const pieData = useMemo(
    () => Object.entries(breedDistribution).map(([name, value]) => ({ name: formatBreed(name), value })),
    [breedDistribution]
  );

  const displayName = currentUser?.displayName || currentUser?.email?.split("@")[0] || "there";

  return (
    <AppShell title={t("dashboard")}>
      <PageHeader
        eyebrow="Overview"
        title={`Welcome back, ${displayName}`}
        subtitle="Your scans, the breeds you see most often, and how confident the model has been."
        actions={
          <>
            <Button to="/upload" variant="primary" icon={UploadIcon}>
              {t("upload")}
            </Button>
            <Button to="/camera" variant="secondary" icon={Camera}>
              Live scan
            </Button>
          </>
        }
      />

      <div className="stack stack--6">
        {error && <Alert tone="warning">{error}</Alert>}

        <div className="grid grid--4">
          <Stat
            label={t("total_analyses")}
            count={totalScans}
            icon={BarChart2}
            loading={loading}
            deltaLabel="Saved prediction records"
          />
          <Stat
            label={t("top_breed")}
            value={topBreed ? formatBreed(topBreed) : "No scans yet"}
            icon={Star}
            loading={loading}
            deltaLabel={topBreed ? "Most frequent result" : "Run your first scan"}
          />
          <Stat
            label={t("avg_confidence")}
            count={averageConfidence ? (averageConfidence > 1 ? averageConfidence : averageConfidence * 100) : 0}
            suffix="%"
            icon={Activity}
            loading={loading}
            deltaLabel="Across saved results"
          />
          <Stat
            label="Live scans"
            count={analytics?.realtime_count || 0}
            icon={Cpu}
            loading={loading}
            deltaLabel={`${analytics?.upload_count || 0} from uploads`}
          />
        </div>

        <div className="grid grid--2">
          <Card>
            <CardHeader title="Breed distribution" subtitle="Every breed you have identified" />
            <CardBody>
              {loading ? (
                <Skeleton height="16rem" />
              ) : pieData.length === 0 ? (
                <EmptyState icon={Inbox} title="No scans yet">
                  Identify your first animal and the breakdown appears here.
                </EmptyState>
              ) : (
                <div style={{ width: "100%", height: "16rem" }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={56}
                        outerRadius={88}
                        paddingAngle={3}
                        stroke="none"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={entry.name} fill={SERIES[index % SERIES.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: "var(--text)" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Scans per day" subtitle="Recent activity" />
            <CardBody>
              {loading ? (
                <Skeleton height="16rem" />
              ) : lineData.length === 0 ? (
                <EmptyState icon={Inbox} title="Nothing to plot yet">
                  Daily counts appear once you have scans on more than one day.
                </EmptyState>
              ) : (
                <div style={{ width: "100%", height: "16rem" }}>
                  <ResponsiveContainer>
                    <LineChart data={lineData} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                      <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="date"
                        stroke="var(--text-muted)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="var(--text-muted)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <RechartsTooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: "var(--text)" }} />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="var(--chart-1)"
                        strokeWidth={2.5}
                        dot={{ r: 3, strokeWidth: 0, fill: "var(--chart-1)" }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader
            title="Recent predictions"
            subtitle="Your latest scans"
            actions={
              <Button to="/history" variant="ghost" size="sm" icon={HistoryIcon}>
                {t("history")}
              </Button>
            }
          />
          <CardBody tight>
            {loading ? (
              <div className="stack stack--3">
                {Array.from({ length: 3 }, (_, i) => (
                  <Skeleton key={i} height="3rem" />
                ))}
              </div>
            ) : latest.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="No predictions yet"
                action={
                  <Button to="/upload" variant="primary" icon={UploadIcon}>
                    Upload an image
                  </Button>
                }
              >
                Your identified animals will be listed here.
              </EmptyState>
            ) : (
              <div className="stack stack--2">
                {latest.slice(0, 6).map((item, index) => (
                  <div
                    key={item.id ?? index}
                    className="row row--between"
                    style={{
                      padding: "var(--space-3)",
                      borderRadius: "var(--radius-lg)",
                      background: "var(--surface-sunken)",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: "var(--weight-semibold)" }}>
                        {formatBreed(item.primary_breed)}
                      </div>
                      <div className="text-xs text-muted">{formatTime(item.timestamp || item.created_at)}</div>
                    </div>
                    <Badge tone={(item.confidence > 85 || item.confidence > 0.85) ? "success" : "neutral"}>
                      {formatConfidence(item.confidence)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}
