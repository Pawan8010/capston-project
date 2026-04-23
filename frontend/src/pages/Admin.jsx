import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import { getAdminStats, getAdminUsers } from "../services/api";
import { Users, Activity, BarChart2, CheckCircle } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#a855f7"];

export default function Admin() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Basic role guard on frontend, assuming token has role or relying on backend
    Promise.all([getAdminStats(), getAdminUsers()])
      .then(([statsData, usersData]) => {
        setStats(statsData);
        setUsers(usersData);
      })
      .catch((err) => console.error("Admin error:", err))
      .finally(() => setLoading(false));
  }, []);

  if (!currentUser) return <Navigate to="/login" replace />;

  const pieData = Object.entries(stats?.breed_distribution || {}).map(([name, value]) => ({ name, value }));

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <h2 className="text-2xl font-bold mb-1">
            🛡️ Admin <span className="gradient-text">Dashboard</span>
          </h2>
          <p className="text-sm text-gray-500">System-wide statistics and user management</p>
        </div>

        {loading ? (
          <div className="flex justify-center p-12"><span className="spinner" /></div>
        ) : (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="card card-blue p-5">
                <div className="flex justify-between items-center mb-2">
                  <Users className="text-blue-500" />
                  <span className="badge badge-blue">Total</span>
                </div>
                <div className="text-2xl font-bold">{stats?.total_users || 0}</div>
                <div className="text-sm text-gray-500">Registered Users</div>
              </div>
              
              <div className="card card-green p-5">
                <div className="flex justify-between items-center mb-2">
                  <Activity className="text-green-500" />
                  <span className="badge badge-green">Global</span>
                </div>
                <div className="text-2xl font-bold">{stats?.total_predictions || 0}</div>
                <div className="text-sm text-gray-500">Total Predictions</div>
              </div>

              <div className="card card-amber p-5">
                <div className="flex justify-between items-center mb-2">
                  <BarChart2 className="text-amber-500" />
                  <span className="badge badge-amber">Most Common</span>
                </div>
                <div className="text-xl font-bold truncate">
                  {Object.entries(stats?.breed_distribution || {}).sort((a,b)=>b[1]-a[1])[0]?.[0] || "—"}
                </div>
                <div className="text-sm text-gray-500">Top Detected Breed</div>
              </div>

              <div className="card card-purple p-5">
                <div className="flex justify-between items-center mb-2">
                  <CheckCircle className="text-purple-500" />
                  <span className="badge badge-purple">System</span>
                </div>
                <div className="text-2xl font-bold">Online</div>
                <div className="text-sm text-gray-500">API Status</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Breed Distribution Global */}
              <div className="card col-span-1 p-5">
                <h3 className="font-bold text-gray-800 mb-4">Global Breed Distribution</h3>
                <div style={{ height: 250 }}>
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value" label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-gray-400 text-center mt-10">No data</p>
                  )}
                </div>
              </div>

              {/* Users Table */}
              <div className="card col-span-2 p-5 overflow-hidden">
                <h3 className="font-bold text-gray-800 mb-4">Registered Users</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="pb-2 font-semibold text-gray-600">Name</th>
                        <th className="pb-2 font-semibold text-gray-600">Email</th>
                        <th className="pb-2 font-semibold text-gray-600">Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u, i) => (
                        <tr key={u.uid || i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                          <td className="py-3 text-gray-800 font-medium">{u.displayName || "Unknown User"}</td>
                          <td className="py-3 text-gray-500">{u.email}</td>
                          <td className="py-3">
                            <span className={`badge ${u.role === 'admin' ? 'badge-amber' : 'badge-green'}`}>
                              {u.role || 'farmer'}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr><td colSpan="3" className="py-4 text-center text-gray-400">No users found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
