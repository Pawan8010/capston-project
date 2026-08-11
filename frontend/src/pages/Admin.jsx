import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Activity, BarChart2, Inbox, ShieldAlert, Users } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import AppShell from "../components/layout/AppShell";
import PageHeader from "../components/layout/PageHeader";
import { useAuth } from "../context/AuthContext";
import { getAdminStats, getAdminUsers } from "../services/api";
import { formatBreed } from "../utils/helpers";
import {
  Alert,
  Avatar,
  Badge,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Skeleton,
  Stat,
  Table,
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

export default function Admin() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    Promise.all([getAdminStats(), getAdminUsers()])
      .then(([statsData, usersData]) => {
        if (cancelled) return;
        setStats(statsData);
        setUsers(Array.isArray(usersData) ? usersData : []);
      })
      .catch((err) => {
        // The role is enforced server-side; a 403 is the authoritative answer.
        if (!cancelled && err?.response?.status === 403) setDenied(true);
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, []);

  if (!currentUser) return <Navigate to="/login" replace />;

  const pieData = Object.entries(stats?.breed_distribution || {})
    .map(([name, value]) => ({ name: formatBreed(name), value }))
    .slice(0, 8);

  const columns = [
    {
      key: "email",
      header: "User",
      render: (row) => (
        <div className="row">
          <Avatar name={row.display_name || row.email} size="sm" />
          <div style={{ minWidth: 0 }}>
            <strong>{row.display_name || row.email?.split("@")[0]}</strong>
            <div className="text-xs text-muted text-truncate">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (row) => (
        <Badge tone={row.role === "admin" ? "brand" : "neutral"}>{row.role || "user"}</Badge>
      ),
    },
    {
      key: "created_at",
      header: "Joined",
      render: (row) => {
        const date = row.created_at ? new Date(row.created_at) : null;
        return (
          <span className="text-sm text-muted">
            {date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString() : "—"}
          </span>
        );
      },
    },
  ];

  return (
    <AppShell title="Admin">
      <PageHeader
        eyebrow="Administration"
        title="System overview"
        subtitle="Usage across every account. Roles are assigned server-side and never accepted from the client."
      />

      {denied ? (
        <Alert tone="danger" icon={ShieldAlert} title="Administrator access required">
          Your account does not have the admin role. Add your email to <code>ADMIN_EMAILS</code> in
          the backend environment and sign in again.
        </Alert>
      ) : (
        <div className="stack stack--6">
          <div className="grid grid--3">
            <Stat label="Registered users" count={stats?.total_users ?? 0} icon={Users} loading={loading} />
            <Stat label="Total predictions" count={stats?.total_predictions ?? 0} icon={BarChart2} loading={loading} />
            <Stat label="Distinct breeds seen" count={pieData.length} icon={Activity} loading={loading} />
          </div>

          <div className="grid grid--2">
            <Card>
              <CardHeader title="Breed distribution" subtitle="Across all accounts" />
              <CardBody>
                {loading ? (
                  <Skeleton height="16rem" />
                ) : pieData.length === 0 ? (
                  <EmptyState icon={Inbox} title="No predictions recorded yet" />
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
              <CardHeader title="Most identified" subtitle="Top breeds by count" />
              <CardBody>
                {loading ? (
                  <Skeleton height="16rem" />
                ) : pieData.length === 0 ? (
                  <EmptyState icon={Inbox} title="Nothing to rank yet" />
                ) : (
                  <div className="stack stack--3">
                    {pieData.map((entry, index) => (
                      <div key={entry.name} className="row row--between">
                        <span className="row text-sm">
                          <span
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: 3,
                              background: SERIES[index % SERIES.length],
                            }}
                            aria-hidden="true"
                          />
                          {entry.name}
                        </span>
                        <Badge tone="neutral">{entry.value}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader title="Users" subtitle={`${users.length} accounts`} />
            <CardBody tight>
              {loading ? (
                <div className="stack stack--3">
                  {Array.from({ length: 4 }, (_, i) => (
                    <Skeleton key={i} height="2.75rem" />
                  ))}
                </div>
              ) : (
                <Table
                  columns={columns}
                  rows={users}
                  keyField="email"
                  empty={<EmptyState icon={Users} title="No users yet" />}
                />
              )}
            </CardBody>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
