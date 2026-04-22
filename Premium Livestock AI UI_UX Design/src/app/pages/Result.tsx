import React from 'react';
import { Link, useParams, useNavigate } from 'react-router';
import { Download, Share2, ArrowLeft, CheckCircle, AlertTriangle, TrendingUp, XCircle } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Result() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPrediction } = useApp();

  const prediction = getPrediction(id!);

  if (!prediction) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="p-12 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl mb-2 text-[var(--foreground)]">Prediction Not Found</h2>
          <p className="text-[var(--muted-foreground)] mb-6">The prediction you're looking for doesn't exist</p>
          <Link to="/app/history">
            <Button>Back to History</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const crossbreedData = prediction.crossbreed
    ? [
        { name: prediction.crossbreed.primary.name, value: prediction.crossbreed.primary.percentage, color: '#16a34a' },
        { name: prediction.crossbreed.secondary.name, value: prediction.crossbreed.secondary.percentage, color: '#3b82f6' },
      ]
    : [];

  const recommendations = [
    {
      category: 'Diet',
      icon: '🌾',
      color: 'green',
      items: prediction.recommendations.diet,
    },
    {
      category: 'Care',
      icon: '💊',
      color: 'blue',
      items: prediction.recommendations.care,
    },
    {
      category: 'Productivity',
      icon: '📈',
      color: 'orange',
      items: prediction.recommendations.productivity,
    },
  ];

  const handleDownload = () => {
    const reportContent = `
LIVESTOCK AI - ANALYSIS REPORT
==============================

Date: ${prediction.date} ${prediction.time}
Breed: ${prediction.breed}
Confidence: ${prediction.confidence.toFixed(1)}%
Health Status: ${prediction.status}

CROSSBREED ANALYSIS
-------------------
${prediction.crossbreed?.primary.name}: ${prediction.crossbreed?.primary.percentage}%
${prediction.crossbreed?.secondary.name}: ${prediction.crossbreed?.secondary.percentage}%

HEALTH ASSESSMENT
-----------------
Body Condition: ${prediction.health.bodyCondition}/5
Coat Quality: ${prediction.health.coatQuality}
Diseases: ${prediction.health.diseases.length > 0 ? prediction.health.diseases.join(', ') : 'None detected'}

RECOMMENDATIONS
---------------
Diet:
${prediction.recommendations.diet.map((item) => `- ${item}`).join('\n')}

Care:
${prediction.recommendations.care.map((item) => `- ${item}`).join('\n')}

Productivity:
${prediction.recommendations.productivity.map((item) => `- ${item}`).join('\n')}

BREED INFORMATION
-----------------
Origin: ${prediction.breedInfo.origin}
Primary Use: ${prediction.breedInfo.primaryUse}
Temperament: ${prediction.breedInfo.temperament}
Average Weight: ${prediction.breedInfo.averageWeight}
Milk Fat %: ${prediction.breedInfo.milkFat}
Climate Adaptability: ${prediction.breedInfo.climateAdaptability}
    `;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `livestock-ai-report-${prediction.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Livestock AI - ${prediction.breed}`,
        text: `Breed: ${prediction.breed} (${prediction.confidence.toFixed(1)}% confidence)`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/app/history">
            <Button variant="ghost" icon={<ArrowLeft className="w-5 h-5" />}>
              Back
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl text-[var(--foreground)]">Analysis Results</h2>
            <p className="text-[var(--muted-foreground)]">AI-powered breed and health analysis</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" icon={<Share2 className="w-5 h-5" />} onClick={handleShare}>
            Share
          </Button>
          <Button icon={<Download className="w-5 h-5" />} onClick={handleDownload}>
            Download Report
          </Button>
        </div>
      </div>

      {/* Image and Main Prediction */}
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card glass className="p-0 overflow-hidden relative group">
            {/* Hover effect overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10"></div>
            {typeof prediction.image === 'string' && prediction.image.startsWith('data:') ? (
              <img src={prediction.image} alt={prediction.breed} className="w-full h-full object-cover" />
            ) : (
              <div className="aspect-video bg-gradient-to-br from-green-400 via-green-500 to-blue-500 flex items-center justify-center text-white text-8xl shadow-inner">
                {prediction.image}
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="h-full">
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-3 h-3 bg-green-500 rounded-full"
                  ></motion.div>
                  <span className="text-sm text-[var(--muted-foreground)]">AI Prediction</span>
                </div>
                <h3 className="text-3xl mb-2 text-[var(--foreground)] bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent font-bold">
                  {prediction.breed}
                </h3>
                <p className="text-[var(--muted-foreground)] flex items-center gap-2">
                  <span className="text-xl">📍</span> {prediction.breedInfo.origin}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-[var(--foreground)] font-medium">Confidence Score</span>
                  <motion.span
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-green-600 dark:text-green-400 font-bold text-lg"
                  >
                    {prediction.confidence.toFixed(1)}%
                  </motion.span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden shadow-inner">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${prediction.confidence}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                    className="h-full bg-gradient-to-r from-green-500 via-green-600 to-green-500 rounded-full shadow-lg shadow-green-500/50 relative"
                  >
                    <motion.div
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    ></motion.div>
                  </motion.div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="p-4 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10 rounded-xl border border-green-200 dark:border-green-800"
                >
                  {prediction.status === 'Healthy' ? (
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 mb-2" />
                  ) : prediction.status === 'Warning' ? (
                    <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400 mb-2" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600 dark:text-red-400 mb-2" />
                  )}
                  <p className="text-sm text-[var(--muted-foreground)] mb-1">Health Status</p>
                  <p
                    className={`font-semibold ${
                      prediction.status === 'Healthy'
                        ? 'text-green-600 dark:text-green-400'
                        : prediction.status === 'Warning'
                        ? 'text-orange-600 dark:text-orange-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {prediction.status}
                  </p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 rounded-xl border border-blue-200 dark:border-blue-800"
                >
                  <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2" />
                  <p className="text-sm text-[var(--muted-foreground)] mb-1">Quality Score</p>
                  <p className="text-blue-600 dark:text-blue-400 font-semibold">
                    {prediction.health.bodyCondition >= 4 ? 'Excellent' : prediction.health.bodyCondition >= 3 ? 'Good' : 'Fair'}
                  </p>
                </motion.div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Crossbreed Analysis */}
      {prediction.crossbreed && (
        <Card>
          <h3 className="text-xl mb-4 text-[var(--foreground)]">Crossbreed Analysis</h3>
          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={crossbreedData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name} ${value}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {crossbreedData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              {crossbreedData.map((breed) => (
                <div key={breed.name}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[var(--foreground)]">{breed.name}</span>
                    <span style={{ color: breed.color }}>{breed.value}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${breed.value}%` }}
                      transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: breed.color }}
                    />
                  </div>
                </div>
              ))}
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <p className="text-sm text-[var(--foreground)]">
                  <strong>Analysis:</strong> This is a dominant {prediction.crossbreed.primary.name} breed
                  {prediction.crossbreed.secondary.percentage > 20 && ` with significant ${prediction.crossbreed.secondary.name} characteristics`}. Great for {prediction.breedInfo.primaryUse.toLowerCase()} production.
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Disease Detection */}
      <Card>
        <h3 className="text-xl mb-4 text-[var(--foreground)]">Health Assessment</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div
            className={`p-6 rounded-xl border-2 ${
              prediction.health.diseases.length === 0
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              {prediction.health.diseases.length === 0 ? (
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              )}
              <h4 className="text-lg text-[var(--foreground)]">
                {prediction.health.diseases.length === 0 ? 'No Diseases Detected' : 'Health Alert'}
              </h4>
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">
              {prediction.health.diseases.length === 0
                ? 'Animal appears healthy with no visible signs of common diseases'
                : prediction.health.diseases.join(', ')}
            </p>
          </div>
          <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <h4 className="text-sm text-[var(--muted-foreground)] mb-2">Body Condition</h4>
            <p className="text-2xl mb-1 text-[var(--foreground)]">{prediction.health.bodyCondition}/5</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              {prediction.health.bodyCondition >= 4 ? 'Optimal range' : 'Needs attention'}
            </p>
          </div>
          <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <h4 className="text-sm text-[var(--muted-foreground)] mb-2">Coat Quality</h4>
            <p className="text-2xl mb-1 text-[var(--foreground)]">{prediction.health.coatQuality}</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              {prediction.health.coatQuality === 'Excellent' || prediction.health.coatQuality === 'Good'
                ? 'Shiny and healthy'
                : 'Needs improvement'}
            </p>
          </div>
        </div>
      </Card>

      {/* Smart Recommendations */}
      <Card>
        <h3 className="text-xl mb-6 text-[var(--foreground)]">Smart Recommendations</h3>
        <div className="grid lg:grid-cols-3 gap-6">
          {recommendations.map((rec) => (
            <div key={rec.category} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-2xl">
                  {rec.icon}
                </div>
                <h4 className="text-lg text-[var(--foreground)]">{rec.category}</h4>
              </div>
              <ul className="space-y-3">
                {rec.items.map((item, idx) => (
                  <li key={idx} className="flex gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-[var(--muted-foreground)]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      {/* Additional Info */}
      <Card>
        <h3 className="text-xl mb-4 text-[var(--foreground)]">Breed Information</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-[var(--border)]">
              <span className="text-[var(--muted-foreground)]">Origin</span>
              <span className="text-[var(--foreground)]">{prediction.breedInfo.origin}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[var(--border)]">
              <span className="text-[var(--muted-foreground)]">Primary Use</span>
              <span className="text-[var(--foreground)]">{prediction.breedInfo.primaryUse}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[var(--border)]">
              <span className="text-[var(--muted-foreground)]">Temperament</span>
              <span className="text-[var(--foreground)]">{prediction.breedInfo.temperament}</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-[var(--border)]">
              <span className="text-[var(--muted-foreground)]">Average Weight</span>
              <span className="text-[var(--foreground)]">{prediction.breedInfo.averageWeight}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[var(--border)]">
              <span className="text-[var(--muted-foreground)]">Milk Fat %</span>
              <span className="text-[var(--foreground)]">{prediction.breedInfo.milkFat}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[var(--border)]">
              <span className="text-[var(--muted-foreground)]">Climate Adaptability</span>
              <span className="text-[var(--foreground)]">{prediction.breedInfo.climateAdaptability}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}