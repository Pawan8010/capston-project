import React from 'react';
import { Link } from 'react-router';
import { Upload, History, TrendingUp, AlertCircle, Camera, FileText } from 'lucide-react';
import StatCard from '../components/StatCard';
import Card from '../components/Card';
import Button from '../components/Button';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';

const usageData = [
  { month: 'Jan', predictions: 45 },
  { month: 'Feb', predictions: 52 },
  { month: 'Mar', predictions: 61 },
  { month: 'Apr', predictions: 85 },
];

export default function Dashboard() {
  const { predictions } = useApp();

  const healthAlerts = predictions.filter((p) => p.status === 'Warning' || p.status === 'Critical').length;
  const totalPredictions = predictions.length;
  const avgAccuracy =
    predictions.length > 0
      ? (predictions.reduce((acc, p) => acc + p.confidence, 0) / predictions.length).toFixed(1)
      : 0;

  // Calculate breed distribution
  const breedCounts = predictions.reduce((acc, p) => {
    acc[p.breed] = (acc[p.breed] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const breedData = Object.entries(breedCounts)
    .map(([name, count]) => ({
      name,
      value: count,
      percentage: ((count / totalPredictions) * 100).toFixed(1),
    }))
    .slice(0, 4);

  const colors = ['#16a34a', '#3b82f6', '#f59e0b', '#78350f'];

  const recentPredictions = predictions.slice(0, 4);

  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Uploads"
          value={totalPredictions}
          icon={<Upload className="w-6 h-6" />}
          trend={{ value: 12.5, isPositive: true }}
          color="green"
        />
        <StatCard
          title="Predictions Made"
          value={totalPredictions}
          icon={<TrendingUp className="w-6 h-6" />}
          trend={{ value: 8.2, isPositive: true }}
          color="blue"
        />
        <StatCard
          title="Health Alerts"
          value={healthAlerts}
          icon={<AlertCircle className="w-6 h-6" />}
          trend={{ value: healthAlerts > 0 ? 2.1 : 0, isPositive: false }}
          color="orange"
        />
        <StatCard
          title="Accuracy Rate"
          value={`${avgAccuracy}%`}
          icon={<FileText className="w-6 h-6" />}
          trend={{ value: 1.5, isPositive: true }}
          color="green"
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <h3 className="text-lg mb-4 text-[var(--foreground)]">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/app/upload">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-6 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white cursor-pointer shadow-lg shadow-green-500/30"
            >
              <Camera className="w-8 h-8 mb-3" />
              <h4 className="text-lg mb-1">Upload Image</h4>
              <p className="text-sm text-green-100">Analyze livestock breed</p>
            </motion.div>
          </Link>
          <Link to="/app/history">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-6 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white cursor-pointer shadow-lg shadow-blue-500/30"
            >
              <History className="w-8 h-8 mb-3" />
              <h4 className="text-lg mb-1">View History</h4>
              <p className="text-sm text-blue-100">See past predictions</p>
            </motion.div>
          </Link>
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-6 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white cursor-pointer shadow-lg shadow-orange-500/30"
          >
            <FileText className="w-8 h-8 mb-3" />
            <h4 className="text-lg mb-1">Download Report</h4>
            <p className="text-sm text-orange-100">Export analytics</p>
          </motion.div>
        </div>
      </Card>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg mb-4 text-[var(--foreground)]">Usage Analytics</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={usageData}>
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
              <Line type="monotone" dataKey="predictions" stroke="#16a34a" strokeWidth={3} dot={{ fill: '#16a34a', r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="text-lg mb-4 text-[var(--foreground)]">Breed Distribution</h3>
          {breedData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={breedData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} ${percentage}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {breedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-[var(--muted-foreground)]">
              <p>No data available. Upload images to see breed distribution.</p>
            </div>
          )}
        </Card>
      </div>

      {/* Recent Predictions */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg text-[var(--foreground)]">Recent Predictions</h3>
          <Link to="/app/history">
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </Link>
        </div>
        {recentPredictions.length > 0 ? (
          <div className="space-y-3">
            {recentPredictions.map((prediction) => (
              <Link key={prediction.id} to={`/app/result/${prediction.id}`}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)] hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/10 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white text-xl">
                      {prediction.image}
                    </div>
                    <div>
                      <h4 className="text-[var(--foreground)] mb-1">{prediction.breed}</h4>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        {prediction.date} at {prediction.time}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-[var(--muted-foreground)]">Confidence</p>
                      <p className="text-green-600 dark:text-green-400">{prediction.confidence}%</p>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-sm ${
                        prediction.status === 'Healthy'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                          : prediction.status === 'Warning'
                          ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                      }`}
                    >
                      {prediction.status}
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl mb-2 text-[var(--foreground)]">No predictions yet</h3>
            <p className="text-[var(--muted-foreground)] mb-6">Upload your first livestock image to get started</p>
            <Link to="/app/upload">
              <Button icon={<Camera className="w-5 h-5" />}>Upload Image</Button>
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}
