import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart2,
  BrainCircuit,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  Globe2,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { auth as authApi } from '../lib/api';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

const features = [
  {
    icon: BrainCircuit,
    title: 'Practice with context',
    description: 'Work through realistic decisions instead of memorising disconnected definitions.',
  },
  {
    icon: BarChart2,
    title: 'Know where you stand',
    description: 'Track readiness by AZ-900 domain and focus your next study session.',
  },
  {
    icon: MessageCircle,
    title: 'Learn from every answer',
    description: 'Get clear explanations and practical analogies when a concept feels unclear.',
  },
];

function FeatureRow({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-brand-300 ring-1 ring-white/10">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-slate-400">{description}</p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { setAuth, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  async function handleAuthSubmit(event: React.FormEvent) {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    if (authMode === 'register' && password !== confirmPassword) {
      setAuthError('Passwords do not match.');
      setAuthLoading(false);
      return;
    }
    try {
      const fn = authMode === 'login' ? authApi.login : authApi.register;
      const { accessToken, user } = await fn({ email, password });
      setAuth(user, accessToken);
      navigate('/dashboard');
    } catch (error: unknown) {
      setAuthError(error instanceof Error ? error.message : 'Authentication failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleGuestStart() {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const { accessToken, user } = await authApi.guest();
      setAuth(user, accessToken);
      navigate('/dashboard');
    } catch (error: unknown) {
      setAuthError(error instanceof Error ? error.message : 'Could not start guest mode. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  }

  function openAuth(mode: 'login' | 'register') {
    setAuthMode(mode);
    setAuthError(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/2 top-[-18rem] h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="absolute bottom-[-14rem] right-[-8rem] h-[30rem] w-[30rem] rounded-full bg-orange-500/10 blur-3xl" />
      </div>

      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5 text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-slate-950 shadow-lg shadow-brand-500/20">
            <Zap className="h-5 w-5 fill-current" aria-hidden="true" />
          </span>
          <span className="text-lg font-bold tracking-tight">Azure<span className="text-brand-400">Quest</span></span>
        </Link>
        <div className="flex items-center gap-5">
          <Link to="/about" className="text-sm font-medium text-slate-400 transition hover:text-white">
            About the method
          </Link>
          {isAuthenticated && (
            <Link to="/dashboard" className="text-sm font-semibold text-brand-300 transition hover:text-brand-200">
              Dashboard
            </Link>
          )}
        </div>
      </nav>

      <section className="relative z-10 mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-10 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20 lg:pt-20">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-400/20 bg-brand-400/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-brand-300">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            AZ-900 practice, made practical
          </div>
          <h1 className="max-w-3xl text-5xl font-bold leading-[1.02] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
            Build the instinct to make the
            <span className="bg-gradient-to-r from-brand-300 via-brand-400 to-orange-300 bg-clip-text text-transparent"> right cloud decision.</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-slate-400">
            AzureQuest turns AZ-900 preparation into short, realistic scenarios. Choose an approach, see the trade-offs, and understand the Azure concept behind it.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={() => openAuth('register')}
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-3.5 font-semibold text-slate-950 shadow-xl shadow-brand-500/20 transition hover:bg-brand-400"
            >
              Create your free account
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => openAuth('login')}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-5 py-3.5 font-semibold text-white transition hover:border-white/30 hover:bg-white/[0.08]"
            >
              Sign in
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={handleGuestStart}
              disabled={authLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-orange-300/30 bg-orange-300/10 px-5 py-3.5 font-semibold text-orange-200 transition hover:border-orange-200/50 hover:bg-orange-300/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Continue as guest
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <p className="mt-3 text-sm text-slate-500">
            No account needed to try the scenarios.
          </p>
          {authError && !authMode && <p role="alert" className="mt-2 text-sm text-red-300">{authError}</p>}
          <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
            <Check className="h-3.5 w-3.5 text-brand-400" aria-hidden="true" />
            Guest progress is available now; create an account to keep your learning history
          </p>

          <div className="mt-14 grid max-w-xl grid-cols-3 gap-5 border-t border-white/10 pt-6">
            <div><p className="text-2xl font-bold text-white">7+</p><p className="mt-1 text-xs text-slate-500">decision scenarios</p></div>
            <div><p className="text-2xl font-bold text-white">3</p><p className="mt-1 text-xs text-slate-500">AZ-900 domains</p></div>
            <div><p className="text-2xl font-bold text-white">100%</p><p className="mt-1 text-xs text-slate-500">human-verified grading</p></div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-brand-500/20 to-orange-500/10 blur-2xl" />
          {!authMode ? (
            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-900/90 p-7 shadow-2xl shadow-black/30">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-300">Your study loop</p>
                  <h2 className="mt-2 text-2xl font-bold text-white">Learn by doing.</h2>
                </div>
                <div className="rounded-2xl bg-orange-400/10 p-3 text-orange-300"><Globe2 className="h-6 w-6" aria-hidden="true" /></div>
              </div>
              <div className="space-y-5">
                {features.map(feature => <FeatureRow key={feature.title} {...feature} />)}
              </div>
              <div className="mt-8 rounded-2xl border border-brand-400/15 bg-brand-400/[0.06] p-4">
                <p className="text-sm leading-6 text-slate-300">
                  “The best answer is not always the most powerful one. It is the one that fits the business.”
                </p>
                <p className="mt-2 text-xs font-medium text-brand-300">— AzureQuest principle</p>
              </div>
              <button type="button" onClick={() => openAuth('login')} className="mt-6 text-sm font-medium text-slate-400 transition hover:text-white">
                Already have an account? <span className="text-brand-300">Sign in</span>
              </button>
            </div>
          ) : (
            <div className="relative rounded-[1.75rem] border border-white/10 bg-slate-900/95 p-7 shadow-2xl shadow-black/30">
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-300">Welcome back</p>
                <h2 className="mt-2 text-2xl font-bold text-white">{authMode === 'login' ? 'Sign in to continue' : 'Create your learner profile'}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {authMode === 'login' ? 'Pick up your learning journey where you left off.' : 'Save every challenge, score, and revision session in one place.'}
                </p>
              </div>
              <div className="mb-5 flex rounded-xl bg-white/[0.05] p-1">
                {(['login', 'register'] as const).map(mode => (
                  <button key={mode} type="button" onClick={() => openAuth(mode)} className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${authMode === mode ? 'bg-brand-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}>
                    {mode === 'login' ? 'Sign in' : 'Register'}
                  </button>
                ))}
              </div>
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <label className="block text-sm font-medium text-slate-300">
                  Email
                  <input id="email" type="email" value={email} onChange={event => setEmail(event.target.value)} required autoComplete="email" placeholder="you@example.com" className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20" />
                </label>
                <label className="block text-sm font-medium text-slate-300">
                  Password
                  <span className="relative mt-2 block">
                    <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} required minLength={8} autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} placeholder="At least 8 characters" className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-3 pr-11 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20" />
                    <button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 transition hover:text-brand-300">
                      {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                    </button>
                  </span>
                </label>
                {authMode === 'register' && (
                  <label className="block text-sm font-medium text-slate-300">
                    Confirm password
                    <span className="relative mt-2 block">
                      <input id="confirm-password" type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} required minLength={8} autoComplete="new-password" placeholder="Repeat your password" className={`w-full rounded-xl border bg-slate-950 px-3.5 py-3 pr-11 text-sm text-white outline-none transition placeholder:text-slate-600 focus:ring-2 ${confirmPassword && confirmPassword !== password ? 'border-red-400/60 focus:border-red-400 focus:ring-red-400/20' : 'border-white/10 focus:border-brand-400 focus:ring-brand-400/20'}`} />
                      <button type="button" onClick={() => setShowConfirmPassword(value => !value)} aria-label={showConfirmPassword ? 'Hide confirmed password' : 'Show confirmed password'} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 transition hover:text-brand-300">
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                      </button>
                    </span>
                    {confirmPassword && confirmPassword !== password && <span className="mt-1.5 block text-xs font-normal text-red-300">Passwords do not match.</span>}
                  </label>
                )}
                {authError && <p role="alert" className="text-sm text-red-300">{authError}</p>}
                <button type="submit" disabled={authLoading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3.5 font-semibold text-slate-950 transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-60">
                  {authLoading ? <LoadingSpinner size="sm" /> : authMode === 'login' ? 'Sign in' : 'Create account'}
                </button>
              </form>
              <button type="button" onClick={() => { setAuthMode(null); setAuthError(null); }} className="mt-5 w-full text-center text-sm text-slate-500 transition hover:text-white">
                Back to how AzureQuest works
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="relative z-10 border-t border-white/10 bg-slate-900/40">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-8 md:grid-cols-3">
          {features.map(feature => (
            <div key={feature.title} className="flex gap-4">
              <feature.icon className="mt-1 h-5 w-5 shrink-0 text-brand-400" aria-hidden="true" />
              <div><h3 className="font-semibold text-white">{feature.title}</h3><p className="mt-1 text-sm leading-6 text-slate-400">{feature.description}</p></div>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 px-5 py-6 text-center text-xs text-slate-600">
        <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Unofficial study tool. Not affiliated with Microsoft.</span>
        <span className="mx-2">·</span>
        <Link to="/about" className="transition hover:text-slate-300">Learn more</Link>
      </footer>
    </main>
  );
}
