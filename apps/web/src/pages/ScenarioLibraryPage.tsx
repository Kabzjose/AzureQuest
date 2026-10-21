import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BookOpen, Filter, MapPin, BarChart } from 'lucide-react';
import { scenarios as scenariosApi } from '../lib/api';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import type { Domain, ScenarioPublic } from '@azurequest/shared';

const DOMAIN_OPTIONS: { value: Domain | ''; label: string }[] = [
  { value: '', label: 'All domains' },
  { value: 'cloud-concepts', label: 'Cloud Concepts' },
  { value: 'architecture-services', label: 'Architecture & Services' },
  { value: 'management-governance', label: 'Management & Governance' },
];

const DIFFICULTY_LABELS: Record<number, { label: string; colour: string }> = {
  1: { label: 'Beginner', colour: 'text-brand-400 bg-brand-900/30' },
  2: { label: 'Intermediate', colour: 'text-yellow-400 bg-yellow-900/30' },
  3: { label: 'Advanced', colour: 'text-red-400 bg-red-900/30' },
};

const DOMAIN_COLOURS: Record<Domain, string> = {
  'cloud-concepts': 'text-purple-400 bg-purple-900/30',
  'architecture-services': 'text-blue-400 bg-blue-900/30',
  'management-governance': 'text-teal-400 bg-teal-900/30',
};

const DOMAIN_SHORT: Record<Domain, string> = {
  'cloud-concepts': 'Cloud Concepts',
  'architecture-services': 'Arch & Services',
  'management-governance': 'Mgmt & Governance',
};

function ScenarioCard({ scenario }: { scenario: ScenarioPublic }) {
  const diff = DIFFICULTY_LABELS[scenario.difficulty] ?? DIFFICULTY_LABELS[1];
  return (
    <Link
      to={`/scenarios/${scenario.id}`}
      className="group bg-gray-900 border border-gray-800 hover:border-brand-700 rounded-xl p-5 flex flex-col gap-3 transition-all hover:shadow-lg hover:shadow-brand-900/20"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-100 group-hover:text-brand-300 transition-colors leading-snug">
          {scenario.title}
        </h3>
        <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${diff.colour}`}>
          {diff.label}
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <MapPin className="h-3 w-3" aria-hidden="true" />
        {scenario.context}
      </div>

      <div className="flex flex-wrap gap-1.5 mt-auto">
        {(scenario.domains as Domain[]).map(d => (
          <span key={d} className={`text-xs px-2 py-0.5 rounded-full ${DOMAIN_COLOURS[d]}`}>
            {DOMAIN_SHORT[d]}
          </span>
        ))}
        <span className="text-xs text-gray-600 ml-auto">
          {scenario.decisions.length} decision{scenario.decisions.length !== 1 ? 's' : ''}
        </span>
      </div>
    </Link>
  );
}

export default function ScenarioLibraryPage() {
  const [domain, setDomain] = useState<Domain | ''>('');
  const [difficulty, setDifficulty] = useState<number | ''>('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['scenarios', domain, difficulty],
    queryFn: () => scenariosApi.list({
      domain: domain || undefined,
      difficulty: difficulty || undefined,
    }),
  });

  const scenarioList = data?.scenarios ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-brand-400" aria-hidden="true" />
            Scenario Library
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {scenarioList.length} original scenario{scenarioList.length !== 1 ? 's' : ''} aligned to the AZ-900 skills outline
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Scenario filters">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Filter className="h-3.5 w-3.5" aria-hidden="true" />
            Filter:
          </div>
          <select
            value={domain}
            onChange={e => setDomain(e.target.value as Domain | '')}
            aria-label="Filter by domain"
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {DOMAIN_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            value={difficulty}
            onChange={e => setDifficulty(e.target.value ? Number(e.target.value) : '')}
            aria-label="Filter by difficulty"
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All levels</option>
            <option value="1">Beginner</option>
            <option value="2">Intermediate</option>
            <option value="3">Advanced</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message="Could not load scenarios" retry={() => refetch()} />
      ) : scenarioList.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <BarChart className="h-10 w-10 mx-auto mb-3 opacity-40" aria-hidden="true" />
          <p>No scenarios match your filters. Try removing a filter.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {scenarioList.map(s => <ScenarioCard key={s.id} scenario={s} />)}
        </div>
      )}
    </div>
  );
}
