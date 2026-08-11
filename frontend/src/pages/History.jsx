import React, { useEffect, useMemo, useState } from "react";
import { Inbox, Search, Trash2, Upload as UploadIcon } from "lucide-react";
import AppShell from "../components/layout/AppShell";
import PageHeader from "../components/layout/PageHeader";
import { deletePrediction, getPredictionHistory } from "../services/api";
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
  Modal,
  Progress,
  Skeleton,
  Stat,
  Table,
} from "../components/ui";

const pct = (value) => Math.round((value || 0) > 1 ? value : (value || 0) * 100);

function ConfidenceCell({ value }) {
  const percent = pct(value);
  const band = percent >= 85 ? "high" : percent >= 60 ? "medium" : "low";

  return (
    <div className={`confidence confidence--${band}`} style={{ minWidth: "7rem" }}>
      <div className="row">
        <Progress value={percent} size="sm" />
        <span className="text-sm text-mono" style={{ fontWeight: "var(--weight-semibold)" }}>
          {percent}%
        </span>
      </div>
    </div>
  );
}

export default function History() {
  const { t } = useLanguage();
  const [history, setHistory] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params = {};
    if (search) params.breed = search;
    if (fromDate) params.from_date = fromDate;

    // Debounced so typing in the breed filter does not fire a request per key.
    const timer = setTimeout(() => {
      getPredictionHistory(params)
        .then((data) => {
          if (cancelled) return;
          setHistory(data.predictions || []);
          setTotalCount(data.count || 0);
          setError("");
        })
        .catch(() => {
          if (cancelled) return;
          setHistory([]);
          setTotalCount(0);
          setError("Could not load your history.");
        })
        .finally(() => !cancelled && setLoading(false));
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, fromDate]);

  const confirmDelete = async () => {
    const id = pendingDelete?.id ?? pendingDelete?._id;
    if (!id) return;

    setDeleting(true);
    try {
      await deletePrediction(id);
      setHistory((rows) => rows.filter((row) => row.id !== id && row._id !== id));
      setTotalCount((count) => Math.max(0, count - 1));
      setNotice("Prediction deleted.");
    } catch {
      setNotice("Could not delete that prediction.");
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  };

  const averageConfidence = useMemo(() => {
    if (!history.length) return 0;
    return Math.round(history.reduce((sum, row) => sum + pct(row.confidence), 0) / history.length);
  }, [history]);

  const distinctBreeds = useMemo(
    () => new Set(history.map((row) => row.primary_breed).filter(Boolean)).size,
    [history]
  );

  const columns = [
    {
      key: "primary_breed",
      header: "Breed",
      render: (row) => (
        <div>
          <strong>{formatBreed(row.primary_breed)}</strong>
          {row.secondary_breed && (
            <div className="text-xs text-muted">2nd: {formatBreed(row.secondary_breed)}</div>
          )}
        </div>
      ),
    },
    { key: "confidence", header: "Confidence", render: (row) => <ConfidenceCell value={row.confidence} /> },
    {
      key: "source",
      header: "Source",
      render: (row) => <Badge tone="neutral">{row.source || "upload"}</Badge>,
    },
    {
      key: "timestamp",
      header: "When",
      render: (row) => {
        const raw = row.timestamp || row.created_at;
        const date = raw ? new Date(raw) : null;
        return (
          <span className="text-sm text-muted">
            {date && !Number.isNaN(date.getTime())
              ? date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
              : "—"}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "",
      width: "3rem",
      render: (row) => (
        <Button
          variant="dangerGhost"
          size="sm"
          iconOnly
          icon={Trash2}
          aria-label={`Delete ${formatBreed(row.primary_breed)} prediction`}
          onClick={() => setPendingDelete(row)}
        />
      ),
    },
  ];

  return (
    <AppShell title={t("history")}>
      <PageHeader
        eyebrow="Records"
        title={t("analysis_history") || "Analysis history"}
        subtitle="Every prediction saved to your account, newest first."
        actions={
          <Button to="/upload" variant="primary" icon={UploadIcon}>
            {t("new_analysis")}
          </Button>
        }
      />

      <div className="stack stack--6">
        {notice && <Alert tone="info">{notice}</Alert>}
        {error && <Alert tone="danger">{error}</Alert>}

        <div className="grid grid--4">
          <Stat label={t("total_analyses")} count={totalCount} loading={loading} />
          <Stat label={t("avg_confidence")} count={averageConfidence} suffix="%" loading={loading} />
          <Stat label={t("breeds_found")} count={distinctBreeds} loading={loading} />
          <Stat label={t("showing")} count={history.length} loading={loading} />
        </div>

        <Card>
          <CardHeader title="Filter">
            <div className="grid grid--2" style={{ width: "100%" }}>
              <Input
                label={t("search_breed") || "Breed"}
                icon={Search}
                placeholder="e.g. Murrah"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <Input
                label="From date"
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
              />
            </div>
          </CardHeader>

          <CardBody tight>
            {loading ? (
              <div className="stack stack--3">
                {Array.from({ length: 5 }, (_, i) => (
                  <Skeleton key={i} height="2.75rem" />
                ))}
              </div>
            ) : (
              <Table
                columns={columns}
                rows={history}
                keyField="id"
                empty={
                  <EmptyState
                    icon={Inbox}
                    title={search || fromDate ? "Nothing matches those filters" : "No predictions yet"}
                    action={
                      search || fromDate ? (
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setSearch("");
                            setFromDate("");
                          }}
                        >
                          Clear filters
                        </Button>
                      ) : (
                        <Button to="/upload" variant="primary" icon={UploadIcon}>
                          Upload an image
                        </Button>
                      )
                    }
                  >
                    {search || fromDate
                      ? "Try a different breed or an earlier date."
                      : "Identify an animal and it will be recorded here."}
                  </EmptyState>
                }
              />
            )}
          </CardBody>
        </Card>
      </div>

      <Modal
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title="Delete this prediction?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleting} onClick={confirmDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-body">
          {pendingDelete && (
            <>
              <strong>{formatBreed(pendingDelete.primary_breed)}</strong> will be removed from your
              history. This cannot be undone.
            </>
          )}
        </p>
      </Modal>
    </AppShell>
  );
}
