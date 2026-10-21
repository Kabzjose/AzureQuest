import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BrainCircuit,
  Check,
  ChevronLeft,
  Globe2,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';

const steps = [
  {
    number: '01',
    title: 'Read the situation',
    description: 'Start with a realistic business problem, not a vocabulary list. Understand the constraints before choosing a service.',
    icon: Globe2,
  },
  {
    number: '02',
    title: 'Make the call',
    description: 'Choose the Azure approach that best fits the requirements. Some questions have one answer; others ask you to select all that apply.',
    icon: Target,
  },
  {
    number: '03',
    title: 'Understand the trade-off',
    description: 'See what your decision changes, why the answer key is correct, and which concept deserves another look.',
    icon: BrainCircuit,
  },
];

const principles = [
  'Original scenarios, never copied exam questions',
  'Human-verified answer keys control grading',
  'AI explains answers but never decides correctness',
  'Progress is saved to your account across sessions',
];

export default function AboutPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/3 top-[-18rem] h-[38rem] w-[38rem] rounded-full bg-brand-500/10 blur-3xl" />
        <div className="absolute bottom-[-12rem] right-[-8rem] h-[30rem] w-[30rem] rounded-full bg-orange-500/10 blur-3xl" />
      </div>

      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5 text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-slate-950 shadow-lg shadow-brand-500/20">
            <Zap className="h-5 w-5 fill-current" aria-hidden="true" />
          </span>
          <span className="text-lg font-bold tracking-tight">Azure<span className="text-brand-400">Quest</span></span>
        </Link>
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-white">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Back home
        </Link>
      </nav>

      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-20 pt-12 sm:px-8 sm:pt-20">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-400/20 bg-brand-400/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-brand-300">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            The AzureQuest approach
          </div>
          <h1 className="text-5xl font-bold leading-[1.03] tracking-[-0.04em] text-white sm:text-6xl">
            Learn Azure by
            <span className="bg-gradient-to-r from-brand-300 via-brand-400 to-orange-300 bg-clip-text text-transparent"> thinking like a builder.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-400">
            AzureQuest is a scenario-based AZ-900 learning platform for people who want more than a good memory. It helps you practise the judgement behind cloud architecture decisions, then gives you a clear path to improve.
          </p>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[1.75rem] border border-white/10 bg-slate-900/85 p-7 shadow-2xl shadow-black/20 sm:p-9">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-brand-400/10 p-3 text-brand-300">
                <MessageCircle className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-300">The idea</p>
                <h2 className="mt-2 text-2xl font-bold text-white">Definitions are the beginning, not the finish line.</h2>
              </div>
            </div>
            <p className="mt-7 text-base leading-8 text-slate-400">
              Many study tools ask whether you recognise a definition. AzureQuest asks what you would do when a university registration portal hits a traffic spike, a SACCO needs to protect member data, or a growing team needs guardrails.
            </p>
            <p className="mt-4 border-l-2 border-brand-400 pl-4 text-base italic leading-8 text-slate-300">
              “Most AZ-900 tools test what you remember. AzureQuest tests whether you can decide.”
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-orange-300/15 bg-gradient-to-br from-orange-400/10 to-slate-900/90 p-7 sm:p-9">
            <ShieldCheck className="h-7 w-7 text-orange-300" aria-hidden="true" />
            <h2 className="mt-5 text-xl font-bold text-white">Built for trustworthy practice</h2>
            <ul className="mt-6 space-y-4">
              {principles.map(principle => (
                <li key={principle} className="flex gap-3 text-sm leading-6 text-slate-300">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-brand-400" aria-hidden="true" />
                  {principle}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="relative z-10 border-y border-white/10 bg-slate-900/35">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-300">How it works</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">A short loop that turns answers into understanding.</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {steps.map(({ number, title, description, icon: Icon }) => (
              <article key={number} className="rounded-2xl border border-white/10 bg-slate-900/75 p-6">
                <div className="flex items-center justify-between">
                  <div className="rounded-xl bg-white/[0.06] p-2.5 text-brand-300">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <span className="text-sm font-semibold text-slate-600">{number}</span>
                </div>
                <h3 className="mt-6 text-lg font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-400">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto grid max-w-7xl gap-5 px-5 py-20 sm:px-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-900/75 p-7">
          <h2 className="text-xl font-bold text-white">Sources and methodology</h2>
          <p className="mt-4 text-sm leading-7 text-slate-400">
            Content is aligned with the publicly available{' '}
            <a href="https://learn.microsoft.com/en-us/credentials/certifications/azure-fundamentals/" target="_blank" rel="noopener noreferrer" className="text-brand-300 underline decoration-brand-400/40 underline-offset-4 hover:text-brand-200">
              AZ-900 Azure Fundamentals skills outline
            </a>{' '}
            on Microsoft Learn. Domain weights were verified against the published outline.
          </p>
          <p className="mt-4 text-sm leading-7 text-slate-400">
            Your dashboard readiness estimate is a practice indicator based on verified scenario responses. It is deliberately conservative and is not a prediction of an official exam result.
          </p>
        </div>
        <div className="rounded-2xl border border-yellow-300/15 bg-yellow-400/[0.05] p-7">
          <h2 className="text-xl font-bold text-white">Important disclaimer</h2>
          <p className="mt-4 text-sm leading-7 text-slate-400">
            AzureQuest is an independent study tool. It is not affiliated with, endorsed by, or officially connected to Microsoft. No real exam questions are reproduced.
          </p>
          <p className="mt-4 text-sm leading-7 text-slate-400">
            The AI Tutor provides explanations and analogies only. It does not determine correctness; grading uses the human-verified answer key.
          </p>
        </div>
      </section>

      <section className="relative z-10 border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-5 py-12 sm:px-8 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-300">Ready to practise?</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Make your next cloud decision.</h2>
          </div>
          <Link to="/" className="group inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-3.5 font-semibold text-slate-950 shadow-xl shadow-brand-500/20 transition hover:bg-brand-400">
            Create your free account
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 px-5 py-6 text-center text-xs text-slate-600">
        <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Unofficial study tool. Not affiliated with Microsoft.</span>
        <span className="mx-2">·</span>
        <Link to="/" className="transition hover:text-slate-300">Back to home</Link>
      </footer>
    </main>
  );
}
