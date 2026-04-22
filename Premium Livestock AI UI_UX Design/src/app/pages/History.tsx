import React, { useState } from 'react';
import { Link } from 'react-router';
import { Search, Calendar, Download, Camera } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';

export default function History() {
  const { predictions } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredPredictions = predictions.filter((p) => {
    const matchesSearch = p.breed.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || p.status.toLowerCase() === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const downloadAllReports = () => {
    const csvContent = [
      ['ID', 'Date', 'Time', 'Breed', 'Confidence', 'Status', 'Body Condition', 'Coat Quality'].join(','),
      ...predictions.map((p) =>
        [
          p.id,
          p.date,
          p.time,
          p.breed,
          p.confidence.toFixed(1),
          p.status,
          p.health.bodyCondition,
          p.health.coatQuality,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `livestock-ai-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl mb-2 text-[var(--foreground)]">Prediction History</h2>
          <p className="text-[var(--muted-foreground)]">View and manage all your livestock predictions</p>
        </div>
        {predictions.length > 0 && (
          <Button icon={<Download className="w-5 h-5" />} onClick={downloadAllReports}>
            Export All
          </Button>
        )}
      </div>

      {predictions.length > 0 ? (
        <>
          {/* Filters */}
          <Card>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by breed..."
                  icon={<Search className="w-5 h-5" />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--input-background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                >
                  <option value="all">All Status</option>
                  <option value="healthy">Healthy</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                </select>
                <button className="px-4 py-3 rounded-xl border border-[var(--border)] hover:bg-[var(--muted)] transition-colors">
                  <Calendar className="w-5 h-5" />
                </button>
                <div className="flex gap-1 p-1 bg-[var(--muted)] rounded-xl">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      viewMode === 'grid' ? 'bg-white dark:bg-gray-800 shadow' : ''
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      viewMode === 'list' ? 'bg-white dark:bg-gray-800 shadow' : ''
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* Results */}
          {viewMode === 'grid' ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPredictions.map((prediction, index) => (
                <motion.div
                  key={prediction.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Link to={`/app/result/${prediction.id}`}>
                    <Card hover className="cursor-pointer">
                      {typeof prediction.image === 'string' && prediction.image.startsWith('data:') ? (
                        <img
                          src={prediction.image}
                          alt={prediction.breed}
                          className="w-full aspect-video object-cover rounded-xl mb-4"
                        />
                      ) : (
                        <div className="aspect-video bg-gradient-to-br from-green-400 to-blue-500 rounded-xl flex items-center justify-center text-6xl mb-4">
                          {prediction.image}
                        </div>
                      )}
                      <h4 className="text-lg mb-2 text-[var(--foreground)]">{prediction.breed}</h4>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-[var(--muted-foreground)]">Confidence</span>
                        <span className="text-green-600 dark:text-green-400">{prediction.confidence.toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[var(--muted-foreground)]">
                          {prediction.date} {prediction.time}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            prediction.status === 'Healthy'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                              : prediction.status === 'Warning'
                              ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                          }`}
                        >
                          {prediction.status}
                        </span>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPredictions.map((prediction, index) => (
                <motion.div
                  key={prediction.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Link to={`/app/result/${prediction.id}`}>
                    <Card hover className="cursor-pointer">
                      <div className="flex items-center gap-4">
                        {typeof prediction.image === 'string' && prediction.image.startsWith('data:') ? (
                          <img
                            src={prediction.image}
                            alt={prediction.breed}
                            className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl flex items-center justify-center text-4xl flex-shrink-0">
                            {prediction.image}
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className="text-lg mb-1 text-[var(--foreground)]">{prediction.breed}</h4>
                          <p className="text-sm text-[var(--muted-foreground)]">
                            {prediction.date} at {prediction.time}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-[var(--muted-foreground)] mb-1">Confidence</p>
                          <p className="text-lg text-green-600 dark:text-green-400">{prediction.confidence.toFixed(1)}%</p>
                        </div>
                        <span
                          className={`px-3 py-2 rounded-full text-sm ${
                            prediction.status === 'Healthy'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                              : prediction.status === 'Warning'
                              ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                          }`}
                        >
                          {prediction.status}
                        </span>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          {filteredPredictions.length === 0 && (
            <Card className="p-12 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl mb-2 text-[var(--foreground)]">No results found</h3>
              <p className="text-[var(--muted-foreground)]">Try adjusting your search or filters</p>
            </Card>
          )}
        </>
      ) : (
        <Card className="p-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl mb-2 text-[var(--foreground)]">No predictions yet</h3>
          <p className="text-[var(--muted-foreground)] mb-6">Upload your first livestock image to get started</p>
          <Link to="/app/upload">
            <Button icon={<Camera className="w-5 h-5" />}>Upload Image</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
