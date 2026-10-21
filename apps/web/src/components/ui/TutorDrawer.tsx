import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { X, Globe, MessageCircle, Loader2 } from 'lucide-react';
import { tutor as tutorApi } from '../../lib/api';
import type { Language } from '@azurequest/shared';

interface TutorDrawerProps {
  open: boolean;
  onClose: () => void;
  scenarioId: string;
  decisionId: string;
  selectedOptionIds: string[];
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

function AiBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-accent-600/20 text-accent-400 border border-accent-600/30">
      AI-generated
    </span>
  );
}

export function TutorDrawer({
  open, onClose, scenarioId, decisionId, selectedOptionIds, language, onLanguageChange,
}: TutorDrawerProps) {
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);

  const { data: explainData, isLoading: explainLoading, error: explainError } = useQuery({
    queryKey: ['tutor-explain', decisionId, selectedOptionIds, language],
    queryFn: () => tutorApi.explain({ scenarioId, decisionId, selectedOptionIds, language }),
    enabled: open,
    staleTime: Infinity,  // explanations are deterministic; cache forever per session
  });

  const { mutate: sendChat, isPending: chatLoading } = useMutation({
    mutationFn: (msg: string) =>
      tutorApi.chat({
        scenarioId,
        messages: [...chatHistory, { role: 'user', content: msg }],
        language,
      }),
    onSuccess: (data, msg) => {
      setChatHistory(prev => [
        ...prev,
        { role: 'user', content: msg },
        { role: 'assistant', content: data.reply },
      ]);
      setChatInput('');
    },
  });

  const explanation = explainData?.explanation;

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} aria-hidden="true" />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-label="AI Tutor"
        aria-modal="true"
        className="fixed right-0 top-0 h-full w-full sm:w-[480px] bg-gray-900 border-l border-gray-800 z-50 flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-accent-400" aria-hidden="true" />
            <h2 className="font-semibold text-gray-100">AI Tutor</h2>
            <AiBadge />
          </div>
          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <button
              onClick={() => onLanguageChange(language === 'en' ? 'sw' : 'en')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
              title={language === 'en' ? 'Switch to Kiswahili' : 'Switch to English'}
            >
              <Globe className="h-3.5 w-3.5" aria-hidden="true" />
              {language === 'en' ? 'Kiswahili' : 'English'}
            </button>
            <button
              onClick={onClose}
              aria-label="Close tutor"
              className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-gray-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Explanation */}
          {explainLoading && (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-800 rounded animate-pulse" style={{ width: `${70 + i * 7}%` }} />
              ))}
            </div>
          )}

          {explainError && (
            <div className="text-red-400 text-sm">
              Could not load explanation. Showing static feedback from the answer key.
            </div>
          )}

          {explanation && (
            <div className="space-y-4">
              <section>
                <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Technical Reason</h3>
                <p className="text-sm text-gray-200 leading-relaxed">{explanation.technicalReason}</p>
              </section>
              <section>
                <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">East African Analogy</h3>
                <p className="text-sm text-gray-200 leading-relaxed italic border-l-2 border-accent-500 pl-3">
                  {explanation.analogy}
                </p>
              </section>
              <section>
                <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">The Trade-off</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{explanation.tradeOff}</p>
              </section>
              {explanation.followUpQuestion && (
                <section className="bg-gray-800 rounded-xl p-3">
                  <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Check Your Understanding 🤔</h3>
                  <p className="text-sm text-gray-200">{explanation.followUpQuestion}</p>
                </section>
              )}
              {explanation.conceptsToRevise.length > 0 && (
                <section>
                  <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Concepts to Revise</h3>
                  <ul className="space-y-1">
                    {explanation.conceptsToRevise.map(c => (
                      <li key={c.id}>
                        <a href={c.learnUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-accent-400 hover:text-accent-300 underline">
                          {c.name} → Microsoft Learn
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}

          {/* Chat history */}
          {chatHistory.length > 0 && (
            <div className="border-t border-gray-800 pt-4 space-y-3">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Follow-up chat</p>
              {chatHistory.map((m, i) => (
                <div key={i} className={`text-sm rounded-xl px-3 py-2 leading-relaxed ${
                  m.role === 'user' ? 'bg-brand-900/30 text-brand-200 ml-6' : 'bg-gray-800 text-gray-200 mr-6'
                }`}>
                  {m.content}
                </div>
              ))}
              {chatLoading && <div className="flex items-center gap-2 text-gray-500 text-sm"><Loader2 className="h-4 w-4 animate-spin" />Thinking…</div>}
            </div>
          )}
        </div>

        {/* Chat input */}
        <div className="px-5 py-4 border-t border-gray-800">
          <p className="text-xs text-gray-600 mb-2 flex items-center gap-1">
            <AiBadge /> · Ask a follow-up question about this concept
          </p>
          <form
            onSubmit={e => { e.preventDefault(); if (chatInput.trim()) sendChat(chatInput.trim()); }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="e.g. What's the difference between App Service and AKS?"
              maxLength={500}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-gray-600"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || chatLoading}
              className="px-3 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white rounded-lg transition-colors"
              aria-label="Send message"
            >
              <MessageCircle className="h-4 w-4" />
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
