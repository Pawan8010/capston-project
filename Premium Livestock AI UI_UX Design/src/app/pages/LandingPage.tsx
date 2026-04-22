import React from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import {
  Brain,
  Camera,
  Activity,
  TrendingUp,
  Shield,
  Wifi,
  Users,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import ThemeToggle from '../components/ThemeToggle';
import LanguageToggle from '../components/LanguageToggle';

const features = [
  {
    icon: Brain,
    title: 'AI Detection',
    description: 'Advanced AI to identify livestock breeds with 98% accuracy',
    color: 'from-green-500 to-green-600',
  },
  {
    icon: Activity,
    title: 'Health Insights',
    description: 'Early disease detection and health monitoring',
    color: 'from-blue-500 to-blue-600',
  },
  {
    icon: Wifi,
    title: 'Offline Mode',
    description: 'Works seamlessly without internet connection',
    color: 'from-orange-500 to-orange-600',
  },
  {
    icon: Camera,
    title: 'Real-Time Analysis',
    description: 'Instant breed recognition using your camera',
    color: 'from-purple-500 to-purple-600',
  },
];

const stats = [
  { value: '98%', label: 'Accuracy' },
  { value: '50K+', label: 'Users' },
  { value: '2M+', label: 'Predictions' },
  { value: '150+', label: 'Breeds' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <span className="text-xl">🐄</span>
            </div>
            <h1 className="text-xl text-[var(--foreground)]">Livestock AI</h1>
          </div>
          <div className="flex items-center gap-4">
            <LanguageToggle />
            <ThemeToggle />
            <Link to="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link to="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-block px-4 py-2 bg-gradient-to-r from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-800/20 text-green-600 dark:text-green-400 rounded-full text-sm mb-6 border border-green-200 dark:border-green-800"
            >
              <span className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                AI-Powered Livestock Intelligence
              </span>
            </motion.div>
            <h1 className="text-5xl lg:text-6xl mb-6 text-[var(--foreground)] leading-tight">
              Smart Breed & Health <span className="bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">Recognition System</span>
            </h1>
            <p className="text-xl text-[var(--muted-foreground)] mb-8 leading-relaxed">
              Identify breeds, detect diseases, and optimize livestock care with cutting-edge AI technology.
              Perfect for farmers and veterinarians.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/signup">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="lg" icon={<ArrowRight className="w-5 h-5" />}>
                    Get Started Free
                  </Button>
                </motion.div>
              </Link>
              <Link to="/app/upload">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="lg" variant="outline" icon={<Camera className="w-5 h-5" />}>
                    Upload Image
                  </Button>
                </motion.div>
              </Link>
            </div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-12 flex items-center gap-6 text-sm text-[var(--muted-foreground)]"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span>Free 14-day trial</span>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <Card glass className="p-8 relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-green-500/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
              
              <div className="relative z-10">
                <div className="aspect-video bg-gradient-to-br from-green-400 via-green-500 to-blue-500 rounded-2xl flex items-center justify-center text-white text-6xl shadow-2xl shadow-green-500/30">
                  🐄
                </div>
                <div className="mt-6 space-y-3">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10 rounded-xl border border-green-200 dark:border-green-800"
                  >
                    <span className="text-sm font-medium">Breed Detected</span>
                    <span className="text-green-600 dark:text-green-400 font-semibold">Holstein Friesian</span>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 rounded-xl border border-blue-200 dark:border-blue-800"
                  >
                    <span className="text-sm font-medium">Confidence</span>
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">96.5%</span>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10 rounded-xl border border-green-200 dark:border-green-800"
                  >
                    <span className="text-sm font-medium">Health Status</span>
                    <span className="text-green-600 dark:text-green-400 flex items-center gap-2 font-semibold">
                      <CheckCircle className="w-5 h-5" /> Healthy
                    </span>
                  </motion.div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card glass className="text-center">
                <h3 className="text-4xl text-green-600 dark:text-green-400 mb-2">{stat.value}</h3>
                <p className="text-[var(--muted-foreground)]">{stat.label}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl mb-4 text-[var(--foreground)]">Powerful Features</h2>
          <p className="text-xl text-[var(--muted-foreground)]">Everything you need to manage your livestock</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card hover className="h-full">
                  <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center text-white mb-4`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg mb-2 text-[var(--foreground)]">{feature.title}</h3>
                  <p className="text-sm text-[var(--muted-foreground)]">{feature.description}</p>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <Card glass className="text-center p-12">
          <h2 className="text-4xl mb-4 text-[var(--foreground)]">Ready to get started?</h2>
          <p className="text-xl text-[var(--muted-foreground)] mb-8">
            Join thousands of farmers using AI to optimize their livestock management
          </p>
          <Link to="/signup">
            <Button size="lg" icon={<ArrowRight className="w-5 h-5" />}>
              Start Free Today
            </Button>
          </Link>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-[var(--muted-foreground)]">
              © 2026 Livestock AI. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-[var(--muted-foreground)]">
              <a href="#" className="hover:text-[var(--primary)]">Privacy</a>
              <a href="#" className="hover:text-[var(--primary)]">Terms</a>
              <a href="#" className="hover:text-[var(--primary)]">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}