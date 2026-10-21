import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { TrendingUp, BookOpen, RefreshCw, AlertTriangle, ChevronRight, Info, UserPlus } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { progress as progressApi } from '../lib/api';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import type { Domain, ReadinessLabel } from '@azurequest/shared';

const DOMAIN_LABELS: Record<Domain, string> = {
  'cloud-concepts': 'Cloud Concepts',
  'architecture-services': 'Architecture & Services',
  'management-governance': 'Management & Governance',
};

function ReadinessGauge({ overall, label }: { overall: number | null; label: ReadinessLabel }) {
  const pct = overall ?? 0;
  const colour =
    label === 'Looking strong' ? 'text-brand-400' :
    label === 'Almost there' ? 'text-yellow-400' :
    label === 'Not enough data' ? 'text-gray-500' :
    'text-red-400';

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col items-center gap-3">
      <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Readiness Estimate</h2>
      <div className="relative w-32 h-32 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r="50" fill="none" stroke="#1f2937" strokeWidth="12" />
          <circle
            cx="60" cy="60" r="50" fill="none"
            stroke={label === 'Looking strong' ? '#22c55e' : label === 'Almost there' ? '#eab308' : '#6b7280'}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 50}`}
            strokeDashoffset={`${2 * Math.PI * 50 * (1 - pct / 100)}`}
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <div className="absolute text-center">
          <span className={`text-2xl font-bold ${colour}`}>
            {overall !== null ? `${Math.round(pct)}%` : '—'}
          </span>
        </div>
      </div>
      <p className={`font-semibold ${colour}`}>{label}</p>
      <p className="text-xs text-gray-500 text-center max-w-xs">
        This is a practice-based estimate, not a prediction of your official exam result.
      </p>
    </div>
  );
}

function DomainBar({ domain, score, answeredCount, weight }: {
  domain: Domain;
  score: number | null;
  answeredCount: number;
  weight: { min: number; max: number };
}) {
  const pct = score !== null ? Math.round(score * 100) : null;
  const colour = pct === null ? 'bg-gray-700' : pct >= 75 ? 'bg-brand-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-sm text-gray-300">{DOMAIN_LABELS[domain]}</span>
        <span className="text-xs text-gray-500">{weight.min}–{weight.max}% of exam</span>
      </div>
      <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden" role="progressbar" aria-valuenow={pct ?? 0} aria-valuemin={0} aria-valuemax={100} aria-label={DOMAIN_LABELS[domain]}>
        <div className={`h-full rounded-full transition-all duration-700 ${colour}`} style={{ width: pct !== null ? `${pct}%` : '0%' }} />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-gray-500">{answeredCount} answered</span>
        <span className="text-xs text-gray-400 font-medium">{pct !== null ? `${pct}%` : 'Not enough data'}</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: readinessData, isLoading: readinessLoading, error: readinessError, refetch: refetchReadiness } = useQuery({
    queryKey: ['readiness'],
    queryFn: () => progressApi.readiness(),
  });

  const { data: misconceptionsData } = useQuery({
    queryKey: ['misconceptions'],
    queryFn: () => progressApi.misconceptions(),
  });

  const { data: nextData } = useQuery({
    queryKey: ['next'],
    queryFn: () => progressApi.next(),
  });

  const readiness = readinessData?.readiness;
  const misconceptions = misconceptionsData?.misconceptions ?? [];
  const topMisconception = misconceptions.find(m => m.count >= 2);
  const next = nextData?.next;

  const greeting = user?.isGuest ? 'Welcome, Guest!' : `Welcome back${user?.email ? `, ${user.email.split('@')[0]}` : ''}!`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">{greeting}</h1>
        <p className="text-gray-400 text-sm mt-1">Your AZ-900 learning progress</p>
      </div>

      {/* Guest upgrade prompt */}
      {user?.isGuest && (
        <div className="bg-accent-600/10 border border-accent-600/30 rounded-xl p-4 flex items-start gap-3">
          <UserPlus className="h-5 w-5 text-accent-500 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-accent-400">Save your progress permanently</p>
            <p className="text-xs text-gray-400 mt-1">Guest sessions expire. Create an account to keep all your scores, flashcards, and history.</p>
          </div>
          <Link
            to="/dashboard"
            className="ml-auto shrink-0 px-3 py-1.5 bg-accent-600 hover:bg-accent-500 text-white text-xs font-medium rounded-lg transition-colors"
          >
            Upgrade
          </Link>
        </div>
      )}

      {/* Misconception alert */}
      {topMisconception && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-yellow-400">
              You've confused <strong>{topMisconception.conceptNameA}</strong> and <strong>{topMisconception.conceptNameB}</strong> in {topMisconception.count} challenges.
            </p>
            <p className="text-xs text-gray-400 mt-1">Let's clear it up with a targeted practice scenario.</p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Readiness gauge */}
        {readinessLoading ? (
          <LoadingSpinner />
        ) : readinessError ? (
          <ErrorMessage message="Could not load readiness data" retry={refetchReadiness} />
        ) : readiness ? (
          <ReadinessGauge overall={readiness.overall} label={readiness.label} />
        ) : null}

        {/* Domain bars + Next activity */}
        <div className="space-y-4">
          {readiness && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
              <h2 className="font-semibold text-gray-200 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-brand-400" aria-hidden="true" />
                Domain Scores
              </h2>
              {readiness.domains.map(d => (
                <DomainBar
                  key={d.domain}
                  domain={d.domain}
                  score={d.score}
                  answeredCount={d.answeredCount}
                  weight={d.weight}
                />
              ))}
            </div>
          )}

          {/* Next recommended activity */}
          {next && (
            <div className="bg-brand-900/20 border border-brand-800/40 rounded-xl p-4">
              <p className="text-xs text-brand-400 font-medium uppercase tracking-wider mb-2">Recommended next</p>
              <p className="text-sm text-gray-200 font-medium">{next.label}</p>
              {next.type === 'scenario' && next.scenarioId && (
                <Link
                  to={`/scenarios/${next.scenarioId}`}
                  className="mt-3 flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300"
                >
                  <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                  Start scenario
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              )}
              {next.type === 'flashcard' && (
                <Link
                  to="/revise"
                  className="mt-3 flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  Go to Revise
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="flex flex-wrap gap-3">
        <Link to="/scenarios" className="flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl text-sm text-gray-300 hover:text-gray-100 transition-colors">
          <BookOpen className="h-4 w-4 text-brand-400" aria-hidden="true" />
          Browse all scenarios
        </Link>
        <Link to="/revise" className="flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl text-sm text-gray-300 hover:text-gray-100 transition-colors">
          <RefreshCw className="h-4 w-4 text-brand-400" aria-hidden="true" />
          Flashcard revision
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 text-xs text-gray-600 bg-gray-900/50 rounded-lg p-3">
        <Info className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
        <p>Exam domain weights (Cloud Concepts 25–30%, Architecture & Services 35–40%, Management & Governance 30–35%) are from the public AZ-900 skills outline on Microsoft Learn. Verified October 2024.</p>
      </div>
    </div>
  );
}
