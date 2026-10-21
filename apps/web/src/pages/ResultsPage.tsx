import { Link } from 'react-router-dom';
import { CheckCircle, XCircle, BookMarked, ArrowRight, Tag, Trophy } from 'lucide-react';
import { useParams } from 'react-router-dom';

// NOTE: In a full implementation this would load attempt results from the API.
// For Phase 5 this is a placeholder results summary using route state.
// The attempt data could be fetched via a dedicated GET /attempts/:id endpoint (future phase).
export default function ResultsPage() {
  const { attemptId } = useParams<{ attemptId: string }>();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center py-8">
        <Trophy className="h-14 w-14 text-brand-400 mx-auto mb-4" aria-hidden="true" />
        <h1 className="text-2xl font-bold text-gray-100 mb-2">Scenario Complete!</h1>
        <p className="text-gray-400">
          Great work finishing this scenario. Your responses have been saved.
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center space-y-4">
        <p className="text-sm text-gray-400">
          Attempt ID: <code className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">{attemptId}</code>
        </p>
        <p className="text-sm text-gray-400">
          Concepts you missed have been added to your <Link to="/revise" className="text-brand-400 underline hover:text-brand-300">Revise</Link> queue with Leitner scheduling.
        </p>
        <p className="text-xs text-gray-600">
          Your domain scores on the Dashboard have been updated with this attempt's results.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-medium rounded-xl transition-colors"
        >
          View Dashboard
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        <Link
          to="/scenarios"
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium rounded-xl transition-colors"
        >
          <BookMarked className="h-4 w-4" aria-hidden="true" />
          More scenarios
        </Link>
        <Link
          to="/revise"
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium rounded-xl transition-colors"
        >
          Revise flashcards
        </Link>
      </div>

      <p className="text-center text-xs text-gray-600">
        Unofficial study tool. Not affiliated with or endorsed by Microsoft.
      </p>
    </div>
  );
}
