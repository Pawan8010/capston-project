import React from 'react';
import { Users, Database, TrendingUp, Settings, Upload, Activity } from 'lucide-react';
import Card from '../components/Card';
import StatCard from '../components/StatCard';
import Button from '../components/Button';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const userActivityData = [
  { month: 'Jan', users: 1200 },
  { month: 'Feb', users: 1800 },
  { month: 'Mar', users: 2400 },
  { month: 'Apr', users: 3200 },
  { month: 'May', users: 4100 },
  { month: 'Jun', users: 5000 },
];

const modelPerformanceData = [
  { breed: 'Holstein', accuracy: 98.2 },
  { breed: 'Gir', accuracy: 96.5 },
  { breed: 'Jersey', accuracy: 95.8 },
  { breed: 'Sahiwal', accuracy: 94.3 },
  { breed: 'Red Sindhi', accuracy: 93.7 },
];

const recentUsers = [
  { id: 1, name: 'John Farmer', email: 'john@example.com', role: 'Farmer', joined: '2026-04-18', predictions: 45 },
  { id: 2, name: 'Sarah Vet', email: 'sarah@example.com', role: 'Veterinarian', joined: '2026-04-17', predictions: 28 },
  { id: 3, name: 'Mike Dairy', email: 'mike@example.com', role: 'Farmer', joined: '2026-04-16', predictions: 62 },
  { id: 4, name: 'Lisa Ranch', email: 'lisa@example.com', role: 'Farmer', joined: '2026-04-15', predictions: 31 },
];

export default function AdminPanel() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl mb-2 text-[var(--foreground)]">Admin Dashboard</h2>
        <p className="text-[var(--muted-foreground)]">Manage users, datasets, and monitor system performance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value="5,247"
          icon={<Users className="w-6 h-6" />}
          trend={{ value: 18.5, isPositive: true }}
          color="green"
        />
        <StatCard
          title="Predictions Today"
          value="1,432"
          icon={<TrendingUp className="w-6 h-6" />}
          trend={{ value: 12.3, isPositive: true }}
          color="blue"
        />
        <StatCard
          title="Model Accuracy"
          value="96.8%"
          icon={<Activity className="w-6 h-6" />}
          trend={{ value: 2.1, isPositive: true }}
          color="green"
        />
        <StatCard
          title="Dataset Size"
          value="2.4M"
          icon={<Database className="w-6 h-6" />}
          trend={{ value: 5.7, isPositive: true }}
          color="orange"
        />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg mb-4 text-[var(--foreground)]">User Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userActivityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                }}
              />
              <Line type="monotone" dataKey="users" stroke="#16a34a" strokeWidth={3} dot={{ fill: '#16a34a', r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="text-lg mb-4 text-[var(--foreground)]">Model Performance by Breed</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={modelPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="breed" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                }}
              />
              <Bar dataKey="accuracy" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* User Management */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg text-[var(--foreground)]">Recent Users</h3>
          <Button variant="ghost" size="sm">
            View All
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-3 px-4 text-sm text-[var(--muted-foreground)]">User</th>
                <th className="text-left py-3 px-4 text-sm text-[var(--muted-foreground)]">Role</th>
                <th className="text-left py-3 px-4 text-sm text-[var(--muted-foreground)]">Joined</th>
                <th className="text-left py-3 px-4 text-sm text-[var(--muted-foreground)]">Predictions</th>
                <th className="text-left py-3 px-4 text-sm text-[var(--muted-foreground)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((user) => (
                <tr key={user.id} className="border-b border-[var(--border)] hover:bg-[var(--muted)] transition-colors">
                  <td className="py-4 px-4">
                    <div>
                      <p className="text-[var(--foreground)]">{user.name}</p>
                      <p className="text-sm text-[var(--muted-foreground)]">{user.email}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm">
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-[var(--foreground)]">{user.joined}</td>
                  <td className="py-4 px-4 text-[var(--foreground)]">{user.predictions}</td>
                  <td className="py-4 px-4">
                    <Button variant="ghost" size="sm">
                      Manage
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Dataset Management */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg mb-4 text-[var(--foreground)]">Dataset Upload</h3>
          <div className="border-2 border-dashed border-[var(--border)] rounded-xl p-8 text-center hover:border-green-500 transition-colors cursor-pointer">
            <Upload className="w-12 h-12 mx-auto mb-4 text-[var(--muted-foreground)]" />
            <p className="text-[var(--foreground)] mb-2">Upload training data</p>
            <p className="text-sm text-[var(--muted-foreground)]">CSV, JSON, or image datasets</p>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg mb-4 text-[var(--foreground)]">System Settings</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-[var(--muted)] rounded-xl">
              <span className="text-[var(--foreground)]">API Rate Limiting</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
              </label>
            </div>
            <div className="flex items-center justify-between p-3 bg-[var(--muted)] rounded-xl">
              <span className="text-[var(--foreground)]">Auto Backup</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
              </label>
            </div>
            <div className="flex items-center justify-between p-3 bg-[var(--muted)] rounded-xl">
              <span className="text-[var(--foreground)]">Email Notifications</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
              </label>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
