import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Mail, Lock, User } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import { useApp } from '../context/AppContext';
import Alert from '../components/Alert';

export default function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Farmer',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup, isAuthenticated } = useApp();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/app');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      signup(formData.name, formData.email, formData.password, formData.role);
      setLoading(false);
      navigate('/app');
    }, 1000);
  };

  const handleGoogleSignUp = () => {
    setLoading(true);
    setTimeout(() => {
      signup('Demo User', 'demo@livestockai.com', 'demo123', formData.role);
      setLoading(false);
      navigate('/app');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <span className="text-2xl">🐄</span>
            </div>
            <h1 className="text-2xl text-[var(--foreground)]">Livestock AI</h1>
          </Link>
          <h2 className="text-3xl mb-2 text-[var(--foreground)]">Create account</h2>
          <p className="text-[var(--muted-foreground)]">Get started with Livestock AI today</p>
        </div>

        <Card glass>
          {error && (
            <div className="mb-4">
              <Alert type="error" message={error} onClose={() => setError('')} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              type="text"
              label="Full Name"
              placeholder="John Farmer"
              icon={<User className="w-5 h-5" />}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />

            <Input
              type="email"
              label="Email Address"
              placeholder="farmer@example.com"
              icon={<Mail className="w-5 h-5" />}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />

            <Input
              type="password"
              label="Password"
              placeholder="••••••••"
              icon={<Lock className="w-5 h-5" />}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />

            <Input
              type="password"
              label="Confirm Password"
              placeholder="••••••••"
              icon={<Lock className="w-5 h-5" />}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            />

            <div>
              <label className="block mb-2 text-sm text-[var(--foreground)]">Account Type</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'Farmer' })}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.role === 'Farmer'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-[var(--border)] hover:border-green-300'
                  }`}
                >
                  <div className="text-2xl mb-2">👨‍🌾</div>
                  <div className="text-sm">Farmer</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'Veterinarian' })}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.role === 'Veterinarian'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-[var(--border)] hover:border-blue-300'
                  }`}
                >
                  <div className="text-2xl mb-2">👨‍⚕️</div>
                  <div className="text-sm">Veterinarian</div>
                </button>
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 mt-1 rounded border-[var(--border)]" required />
              <span className="text-sm text-[var(--foreground)]">
                I agree to the{' '}
                <a href="#" className="text-[var(--primary)] hover:underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-[var(--primary)] hover:underline">
                  Privacy Policy
                </a>
              </span>
            </label>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--border)]"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-gray-800 text-[var(--muted-foreground)]">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 border-2 border-[var(--border)] rounded-xl hover:bg-[var(--muted)] transition-all disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign up with Google
            </button>
          </form>
        </Card>

        <p className="text-center mt-6 text-sm text-[var(--muted-foreground)]">
          Already have an account?{' '}
          <Link to="/login" className="text-[var(--primary)] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
