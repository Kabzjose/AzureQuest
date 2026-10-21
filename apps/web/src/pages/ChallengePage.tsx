import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import {
  CheckCircle, XCircle, ChevronRight, MessageCircle, BookMarked,
  AlertCircle, CheckSquare, Square, Info
} from 'lucide-react';
import { scenarios as scenariosApi, attempts as attemptsApi, tutor as tutorApi } from '../lib/api';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { TutorDrawer } from '../components/ui/TutorDrawer';
import type { DecisionPublic, OptionPublic, GradeResult, Language } from '@azurequest/shared';

// ─── Option Button ─────────────────────────────────────────────────────────

function OptionButton({
  option,
  selected,
  submitted,
  result,
  onToggle,
}: {
  option: OptionPublic;
  selected: boolean;
  submitted: boolean;
  result?: GradeResult['optionResults'][number];
  onToggle: (id: string) => void;
}) {
  const isCorrect = result?.isCorrect;
  const wasSelected = result?.wasSelected;

  let borderClass = 'border-gray-700 hover:border-gray-500';
  let bg = 'bg-gray-900 hover:bg-gray-800';
  if (submitted) {
    if (isCorrect) { borderClass = 'border-brand-500'; bg = 'bg-brand-900/20'; }
    if (wasSelected && !isCorrect) { borderClass = 'border-red-500'; bg = 'bg-red-900/20'; }
  } else if (selected) {
    borderClass = 'border-brand-500'; bg = 'bg-brand-900/20';
  }

  return (
    <button
      onClick={() => !submitted && onToggle(option.id)}
      disabled={submitted}
      aria-pressed={selected}
      className={`w-full text-left p-4 rounded-xl border transition-all ${borderClass} ${bg} disabled:cursor-default`}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          {submitted ? (
            isCorrect ? (
              <CheckCircle className="h-5 w-5 text-brand-400" aria-hidden="true" />
            ) : wasSelected ? (
              <XCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
            ) : (
              <AlertCircle className="h-5 w-5 text-gray-600" aria-hidden="true" />
            )
          ) : selected ? (
            <CheckSquare className="h-5 w-5 text-brand-400" aria-hidden="true" />
          ) : (
            <Square className="h-5 w-5 text-gray-600" aria-hidden="true" />
          )}
        </div>
        <div className="flex-1">
          <p className={`text-sm leading-relaxed ${submitted && isCorrect ? 'text-brand-300' : submitted && wasSelected ? 'text-red-300' : 'text-gray-200'}`}>
            {option.label}
          </p>
          {submitted && result && (
            <p className="mt-2 text-xs text-gray-400 leading-relaxed">{result.feedback}</p>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Consequence Reveal ────────────────────────────────────────────────────

function ConsequenceReveal({ consequence }: { consequence: string }) {
  return (
    <div className="animate-consequence-reveal bg-gray-800 border border-gray-700 rounded-xl p-4 mt-4">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">What happens next →</p>
      <p className="text-sm text-gray-200 leading-relaxed">{consequence}</p>
    </div>
  );
}

// ─── Main Challenge Page ────────────────────────────────────────────────────

export default function ChallengePage() {
  const { id: scenarioId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [currentDecisionIndex, setCurrentDecisionIndex] = useState(0);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [reasoning, setReasoning] = useState('');
  const [gradeResult, setGradeResult] = useState<GradeResult | null>(null);
  const [tutorOpen, setTutorOpen] = useState(false);
  const [tutorLanguage, setTutorLanguage] = useState<Language>('en');
  const [allDone, setAllDone] = useState(false);

  // Load scenario
  const { data: scenarioData, isLoading: scenarioLoading, error: scenarioError } = useQuery({
    queryKey: ['scenario', scenarioId],
    queryFn: () => scenariosApi.get(scenarioId!),
    enabled: !!scenarioId,
  });

  const scenario = scenarioData?.scenario;
  const decision = scenario?.decisions[currentDecisionIndex] as DecisionPublic | undefined;

  // Create attempt on mount (once)
  const { mutate: createAttempt } = useMutation({
    mutationFn: () => attemptsApi.create(scenarioId!),
    onSuccess: (data) => setAttemptId(data.attempt.id),
  });

  if (!attemptId && scenario && !allDone) {
    createAttempt();
  }

  // Submit decision
  const { mutate: submitDecision, isPending: submitting } = useMutation({
    mutationFn: () =>
      attemptsApi.submitDecision(attemptId!, {
        decisionId: decision!.id,
        selectedOptionIds,
        optionalReasoning: reasoning || undefined,
      }),
    onSuccess: (data) => setGradeResult(data.gradeResult),
  });

  const handleToggleOption = useCallback((id: string) => {
    if (!decision) return;
    if (decision.type === 'single') {
      setSelectedOptionIds([id]);
    } else {
      setSelectedOptionIds(prev =>
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      );
    }
  }, [decision]);

  const handleSubmit = useCallback(() => {
    if (selectedOptionIds.length === 0 || !attemptId || !decision) return;
    submitDecision();
  }, [selectedOptionIds, attemptId, decision, submitDecision]);

  async function handleNext() {
    const decisions = scenario?.decisions ?? [];
    if (currentDecisionIndex < decisions.length - 1) {
      setCurrentDecisionIndex(i => i + 1);
      setSelectedOptionIds([]);
      setReasoning('');
      setGradeResult(null);
      setTutorOpen(false);
    } else {
      // Complete the attempt and go to results
      if (attemptId) {
        await attemptsApi.complete(attemptId);
        navigate(`/results/${attemptId}`);
      }
    }
  }

  // ── Consequence from selected options ──────────────────────────────────
  const selectedConsequences = gradeResult?.optionResults
    .filter(r => r.wasSelected)
    .map(r => r.consequence)
    ?? [];

  if (scenarioLoading) return <LoadingSpinner />;
  if (scenarioError || !scenario) return <ErrorMessage message="Scenario not found" />;

  const isLastDecision = currentDecisionIndex === (scenario.decisions.length - 1);

  return (
    <div className="min-h-0 flex flex-col gap-6 lg:grid lg:grid-cols-5 lg:gap-6">
      {/* ── Left panel: Story ─────────────────────────────────────────────── */}
      <aside className="lg:col-span-2 space-y-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-gray-500 px-2 py-0.5 bg-gray-800 rounded-full">{scenario.context}</span>
            <span className="text-xs text-gray-600">Difficulty {scenario.difficulty}/3</span>
          </div>
          <h1 className="text-xl font-bold text-gray-100 mb-3">{scenario.title}</h1>
          <div className="prose prose-sm prose-invert max-w-none text-gray-400 leading-relaxed">
            <ReactMarkdown>{scenario.story}</ReactMarkdown>
          </div>
        </div>

        {/* Requirements checklist */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-gray-300 mb-2">Requirements</h2>
          <ul className="space-y-1.5" aria-label="Scenario requirements">
            {scenario.requirements.map((req, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                <CheckCircle className="h-3.5 w-3.5 text-brand-500 shrink-0 mt-0.5" aria-hidden="true" />
                {req}
              </li>
            ))}
          </ul>
        </div>

        {/* Decision progress */}
        <div className="flex items-center gap-2">
          {scenario.decisions.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i < currentDecisionIndex ? 'bg-brand-500' :
                i === currentDecisionIndex ? 'bg-brand-400' :
                'bg-gray-800'
              }`}
              aria-label={`Decision ${i + 1} of ${scenario.decisions.length}`}
            />
          ))}
        </div>
      </aside>

      {/* ── Right panel: Decision ──────────────────────────────────────────── */}
      <div className="lg:col-span-3 space-y-4">
        {decision && (
          <>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">
                  Decision {currentDecisionIndex + 1} of {scenario.decisions.length}
                </span>
                <span className="text-xs text-gray-600">
                  {decision.type === 'multi' ? 'Select all that apply' : 'Select one'}
                </span>
              </div>
              <h2 className="text-base font-semibold text-gray-100 mb-4 leading-snug">
                {decision.prompt}
              </h2>

              {/* Options */}
              <div className="space-y-2.5" role="group" aria-label="Answer options">
                {decision.options.map(opt => {
                  const result = gradeResult?.optionResults.find(r => r.optionId === opt.id);
                  return (
                    <OptionButton
                      key={opt.id}
                      option={opt}
                      selected={selectedOptionIds.includes(opt.id)}
                      submitted={!!gradeResult}
                      result={result}
                      onToggle={handleToggleOption}
                    />
                  );
                })}
              </div>

              {/* Optional reasoning */}
              {!gradeResult && (
                <div className="mt-4">
                  <label htmlFor="reasoning" className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Info className="h-3 w-3" aria-hidden="true" />
                    Explain your choice (optional — ungraded, AI may comment on it)
                  </label>
                  <textarea
                    id="reasoning"
                    value={reasoning}
                    onChange={e => setReasoning(e.target.value)}
                    maxLength={2000}
                    rows={2}
                    placeholder="Why did you choose this? (optional)"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-gray-600"
                  />
                </div>
              )}

              {/* Submit / results */}
              {!gradeResult ? (
                <button
                  onClick={handleSubmit}
                  disabled={selectedOptionIds.length === 0 || submitting}
                  className="mt-4 w-full py-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? <LoadingSpinner size="sm" /> : 'Submit answer'}
                </button>
              ) : (
                <div className="mt-4 space-y-3">
                  {/* Score badge */}
                  <div className={`flex items-center gap-2 text-sm font-medium ${gradeResult.isCorrect ? 'text-brand-400' : 'text-red-400'}`}>
                    {gradeResult.isCorrect
                      ? <><CheckCircle className="h-5 w-5" aria-hidden="true" /> Correct!</>
                      : <><XCircle className="h-5 w-5" aria-hidden="true" /> {Math.round(gradeResult.partialScore * 100)}% — see feedback below</>
                    }
                  </div>

                  {/* Concepts to revise */}
                  {gradeResult.conceptsToRevise.length > 0 && (
                    <div className="text-xs text-gray-400 flex items-center gap-1.5">
                      <BookMarked className="h-3.5 w-3.5 text-accent-500" aria-hidden="true" />
                      Added to Revise:{' '}
                      {gradeResult.conceptsToRevise.map(c => (
                        <a key={c.id} href={c.learnUrl} target="_blank" rel="noopener noreferrer" className="underline text-accent-400 hover:text-accent-300">
                          {c.name}
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2 flex-wrap">
                    {!gradeResult.isCorrect && (
                      <button
                        onClick={() => setTutorOpen(true)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-accent-600/20 border border-accent-600/40 hover:bg-accent-600/30 text-accent-400 text-sm rounded-lg transition-colors"
                      >
                        <MessageCircle className="h-4 w-4" aria-hidden="true" />
                        Why did I get this wrong?
                      </button>
                    )}
                    <button
                      onClick={handleNext}
                      className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium rounded-lg transition-colors ml-auto"
                    >
                      {isLastDecision ? 'See results' : 'Next decision'}
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Consequence reveal (animated) */}
            {gradeResult && selectedConsequences.length > 0 && (
              <ConsequenceReveal consequence={selectedConsequences.join(' ')} />
            )}
          </>
        )}
      </div>

      {/* ── Tutor Drawer ───────────────────────────────────────────────────── */}
      {gradeResult && decision && (
        <TutorDrawer
          open={tutorOpen}
          onClose={() => setTutorOpen(false)}
          scenarioId={scenarioId!}
          decisionId={decision.id}
          selectedOptionIds={selectedOptionIds}
          language={tutorLanguage}
          onLanguageChange={setTutorLanguage}
        />
      )}
    </div>
  );
}
