import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Zap, BookOpen, BarChart2, MessageCircle, Shield, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { auth as authApi } from '../lib/api';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

function FeatureCard({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex gap-4">
      <div className="shrink-0 p-2 bg-brand-900/50 rounded-lg h-fit">
        <Icon className="h-5 w-5 text-brand-400" aria-hidden="true" />
      </div>
      <div>
        <h3 className="font-semibold text-gray-100 mb-1">{title}</h3>
        <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { setAuth, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState<'login' | 'register' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  if (isAuthenticated) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  async function handleGuest() {
    setIsLoading(true);
    setError(null);
    try {
      const { accessToken, user } = await authApi.guest();
      setAuth(user, accessToken);
      navigate('/dashboard');
    } catch {
      setError('Could not start guest session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      const fn = showAuth === 'login' ? authApi.login : authApi.register;
      const { accessToken, user } = await fn({ email, password });
      setAuth(user, accessToken);
      navigate('/dashboard');
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Hero */}
      <div className="max-w-5xl mx-auto px-4 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-900/40 text-brand-400 text-sm px-3 py-1 rounded-full mb-6">
          <Zap className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Unofficial AZ-900 Study Tool</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-balance leading-tight">
          Learn Azure by{' '}
          <span className="text-brand-400">making decisions</span>,<br />
          not memorising definitions
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-3 text-balance">
          AzureQuest gives you realistic East African business scenarios — a Kenyan university
          under registration-week load, a SACCO securing member data — and asks: what would
          <em> you</em> decide?
        </p>
        <p className="text-sm text-gray-500 mb-10 italic">
          "Most AZ-900 tools test what you remember. AzureQuest tests whether you can decide,
          then explains in terms a Kenyan learner already knows."
        </p>

        {/* CTA buttons */}
        {!showAuth ? (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleGuest}
              disabled={isLoading}
              className="w-full sm:w-auto px-6 py-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? <LoadingSpinner size="sm" /> : <Zap className="h-4 w-4" aria-hidden="true" />}
              Start as guest — instant access
            </button>
            <button
              onClick={() => setShowAuth('login')}
              className="w-full sm:w-auto px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold rounded-xl transition-colors flex items-center gap-2"
            >
              Sign in <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              onClick={() => setShowAuth('register')}
              className="w-full sm:w-auto px-6 py-3 border border-gray-700 hover:border-gray-600 text-gray-300 font-semibold rounded-xl transition-colors"
            >
              Create account
            </button>
          </div>
        ) : (
          <div className="max-w-sm mx-auto bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setShowAuth('login')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${showAuth === 'login' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
              >
                Sign in
              </button>
              <button
                onClick={() => setShowAuth('register')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${showAuth === 'register' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
              >
                Register
              </button>
            </div>
            <form onSubmit={handleAuthSubmit} className="flex flex-col gap-3">
              <div>
                <label htmlFor="email" className="block text-sm text-gray-400 mb-1">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm text-gray-400 mb-1">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete={showAuth === 'login' ? 'current-password' : 'new-password'}
                  minLength={8}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="••••••••"
                />
              </div>
              {authError && <p role="alert" className="text-red-400 text-sm">{authError}</p>}
              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {authLoading ? <LoadingSpinner size="sm" /> : (showAuth === 'login' ? 'Sign in' : 'Create account')}
              </button>
            </form>
            <button
              onClick={() => { setShowAuth(null); setAuthError(null); }}
              className="mt-3 w-full text-xs text-gray-500 hover:text-gray-400"
            >
              ← Back
            </button>
          </div>
        )}

        {error && <p role="alert" className="mt-4 text-red-400 text-sm">{error}</p>}
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-4 pb-16">
        <h2 className="text-center text-xl font-semibold text-gray-300 mb-6">How it works</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <FeatureCard
            icon={BookOpen}
            title="Real scenarios, not flashcard trivia"
            description="7 original East African business scenarios covering all 3 AZ-900 domains. You make architecture decisions, see the consequences, and understand why."
          />
          <FeatureCard
            icon={BarChart2}
            title="Readiness estimate by domain"
            description="Recency-weighted accuracy scores per domain with AZ-900 exam weights shown. Clear disclaimer: this is a practice estimate, not a pass prediction."
          />
          <FeatureCard
            icon={MessageCircle}
            title="AI tutor explains in analogies"
            description="Confused? Ask 'Why did I get this wrong?' and get a technical reason + an East African analogy (matatus, M-Pesa, SACCOs). Available in English and Kiswahili."
          />
          <FeatureCard
            icon={Shield}
            title="Grading you can trust"
            description="Every answer key is human-verified and stored in the database. AI never decides correctness — it only explains. Grading is deterministic and transparent."
          />
        </div>
      </div>

      {/* Disclaimer footer */}
      <div className="border-t border-gray-800 py-6 text-center">
        <p className="text-xs text-gray-600 px-4">
          Unofficial study tool. Not affiliated with or endorsed by Microsoft. ·{' '}
          <Link to="/about" className="hover:text-gray-400 underline">Learn more</Link>
        </p>
      </div>
    </div>
  );
}
