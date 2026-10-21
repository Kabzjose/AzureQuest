import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, CheckCircle, XCircle, BookOpen, ExternalLink } from 'lucide-react';
import { flashcards as flashcardsApi } from '../lib/api';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import type { FlashcardState } from '@azurequest/shared';

function FlipCard({ card, onResult }: { card: FlashcardState; onResult: (correct: boolean) => void }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="space-y-4">
      {/* Card */}
      <div
        className="perspective-1000 cursor-pointer"
        onClick={() => setFlipped(f => !f)}
        onKeyDown={e => e.key === 'Enter' || e.key === ' ' ? setFlipped(f => !f) : undefined}
        tabIndex={0}
        role="button"
        aria-label={flipped ? 'Card back — click to flip to front' : 'Card front — click to reveal answer'}
        aria-pressed={flipped}
      >
        <div className={`transform-style-3d transition-transform duration-500 ${flipped ? 'rotate-y-180' : ''}`}>
          {/* Front */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 min-h-[220px] flex flex-col items-center justify-center text-center backface-hidden">
            <div className="text-xs text-gray-500 mb-4 uppercase tracking-wider">
              Box {card.box} · Tap to reveal
            </div>
            <h2 className="text-xl font-bold text-gray-100 mb-2">{card.conceptName}</h2>
            <p className="text-sm text-gray-400">What does this Azure concept do, and how does it work?</p>
          </div>
          {/* Back */}
          <div className="absolute inset-0 bg-gray-900 border border-brand-700 rounded-2xl p-8 min-h-[220px] flex flex-col gap-4 backface-hidden rotate-y-180 overflow-y-auto">
            <div className="text-xs text-gray-500 uppercase tracking-wider">Answer</div>
            <p className="text-sm text-gray-200 leading-relaxed">{card.conceptSummary}</p>
            <div className="bg-gray-800 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">East African analogy</p>
              <p className="text-sm text-gray-300 italic">{card.analogyBase}</p>
            </div>
            <a
              href={card.learnUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300"
              onClick={e => e.stopPropagation()}
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              Microsoft Learn
            </a>
          </div>
        </div>
      </div>

      {/* Result buttons — only shown after flipping */}
      {flipped && (
        <div className="flex gap-3 animate-consequence-reveal">
          <button
            onClick={() => onResult(false)}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-900/30 border border-red-700 hover:bg-red-900/50 text-red-400 font-medium rounded-xl transition-colors"
          >
            <XCircle className="h-5 w-5" aria-hidden="true" />
            Missed it
          </button>
          <button
            onClick={() => onResult(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-brand-900/30 border border-brand-700 hover:bg-brand-900/50 text-brand-400 font-medium rounded-xl transition-colors"
          >
            <CheckCircle className="h-5 w-5" aria-hidden="true" />
            Got it!
          </button>
        </div>
      )}
    </div>
  );
}

export default function RevisePage() {
  const qc = useQueryClient();
  const [sessionIndex, setSessionIndex] = useState(0);
  const [sessionResults, setSessionResults] = useState<boolean[]>([]);
  const [sessionDone, setSessionDone] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['flashcards-due'],
    queryFn: () => flashcardsApi.due(),
  });

  const { mutate: reviewCard } = useMutation({
    mutationFn: ({ conceptId, correct }: { conceptId: string; correct: boolean }) =>
      flashcardsApi.review(conceptId, correct),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['flashcards-due'] });
    },
  });

  const cards = data?.flashcards ?? [];
  const currentCard = cards[sessionIndex];

  function handleResult(correct: boolean) {
    if (!currentCard) return;
    reviewCard({ conceptId: currentCard.conceptId, correct });
    const newResults = [...sessionResults, correct];
    setSessionResults(newResults);
    if (sessionIndex < cards.length - 1) {
      setSessionIndex(i => i + 1);
    } else {
      setSessionDone(true);
    }
  }

  function handleRestart() {
    setSessionIndex(0);
    setSessionResults([]);
    setSessionDone(false);
    refetch();
  }

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Could not load flashcards" retry={() => refetch()} />;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <RefreshCw className="h-5 w-5 text-brand-400" aria-hidden="true" />
        <h1 className="text-2xl font-bold text-gray-100">Revise</h1>
      </div>

      {cards.length === 0 && !sessionDone ? (
        <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-2xl">
          <CheckCircle className="h-12 w-12 text-brand-500 mx-auto mb-4" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-gray-200 mb-2">All caught up!</h2>
          <p className="text-gray-400 text-sm mb-4">No flashcards are due right now. Keep practising scenarios and new ones will appear here when you miss answers.</p>
          <a href="/scenarios" className="text-brand-400 hover:text-brand-300 text-sm underline">
            Browse scenarios →
          </a>
        </div>
      ) : sessionDone ? (
        <div className="text-center py-10 bg-gray-900 border border-gray-800 rounded-2xl space-y-4">
          <h2 className="text-xl font-bold text-gray-100">Session complete!</h2>
          <div className="flex justify-center gap-8 text-sm">
            <div>
              <p className="text-2xl font-bold text-brand-400">{sessionResults.filter(Boolean).length}</p>
              <p className="text-gray-400">Got it</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-400">{sessionResults.filter(r => !r).length}</p>
              <p className="text-gray-400">Missed</p>
            </div>
          </div>
          <p className="text-xs text-gray-500">Cards you missed have been moved back to Box 1 and will appear tomorrow.</p>
          <button
            onClick={handleRestart}
            className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-medium rounded-xl transition-colors"
          >
            Review again
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{sessionIndex + 1} of {cards.length} due cards</span>
            <span>Leitner Box {currentCard?.box ?? 1}</span>
          </div>
          {currentCard && (
            <FlipCard key={currentCard.conceptId} card={currentCard} onResult={handleResult} />
          )}
        </>
      )}
    </div>
  );
}
