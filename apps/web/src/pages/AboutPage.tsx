import { Link } from 'react-router-dom';
import { Shield, BookOpen, Zap, ExternalLink } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 py-12">
      <div className="max-w-3xl mx-auto px-4 space-y-10">
        <div className="text-center">
          <Zap className="h-10 w-10 text-brand-400 mx-auto mb-4" aria-hidden="true" />
          <h1 className="text-3xl font-bold text-gray-100 mb-3">About AzureQuest</h1>
          <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm px-4 py-2 rounded-full">
            <Shield className="h-4 w-4" aria-hidden="true" />
            Unofficial study tool. Not affiliated with or endorsed by Microsoft.
          </div>
        </div>

        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-3">
          <h2 className="text-lg font-semibold text-gray-100">What is AzureQuest?</h2>
          <p className="text-gray-400 leading-relaxed">
            AzureQuest is a scenario-based learning platform for the Microsoft Azure Fundamentals (AZ-900) certification exam, built for learners in East Africa and beyond. Instead of asking "What is Azure App Service?", it gives you realistic business scenarios where you make cloud decisions, see the consequences, and get feedback that explains the reasoning in terms you already understand.
          </p>
          <p className="text-gray-400 leading-relaxed">
            <em>"Most AZ-900 tools test what you remember. AzureQuest tests whether you can decide, then explains in terms a Kenyan learner already knows."</em>
          </p>
        </section>

        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-3">
          <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
            <Shield className="h-5 w-5 text-yellow-400" aria-hidden="true" />
            Important Disclaimer
          </h2>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>• <strong className="text-gray-300">Unofficial:</strong> AzureQuest is an independent study tool. It is not affiliated with, endorsed by, or in any way officially connected to Microsoft Corporation.</li>
            <li>• <strong className="text-gray-300">Original content:</strong> All scenarios, questions, and analogies are original and based only on the publicly available AZ-900 skills outline on Microsoft Learn. No real exam questions are reproduced.</li>
            <li>• <strong className="text-gray-300">No pass guarantee:</strong> The readiness estimate on your dashboard is a practice-based indicator, not a prediction of your official exam result. It is calculated from your performance on original practice scenarios.</li>
            <li>• <strong className="text-gray-300">AI explanations:</strong> The AI Tutor provides explanations and analogies only. It never decides whether your answer is correct — all grading uses human-verified answer keys.</li>
          </ul>
        </section>

        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-3">
          <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-brand-400" aria-hidden="true" />
            Sources and Methodology
          </h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            All content is aligned with the publicly available{' '}
            <a
              href="https://learn.microsoft.com/en-us/credentials/certifications/azure-fundamentals/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-400 underline hover:text-brand-300 inline-flex items-center gap-1"
            >
              AZ-900: Azure Fundamentals skills outline on Microsoft Learn
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>. Domain weights were verified against the official skills outline in October 2024.
          </p>
          <p className="text-sm text-gray-400 leading-relaxed">
            The grading engine uses human-verified answer keys. East African analogies are verified for technical accuracy — where they break down, this is noted explicitly. The AI Tutor is instructed to treat the verified answer key as the source of truth and never contradict it.
          </p>
        </section>

        <div className="text-center">
          <Link to="/" className="text-brand-400 hover:text-brand-300 underline text-sm">← Back to home</Link>
        </div>
      </div>
    </div>
  );
}
