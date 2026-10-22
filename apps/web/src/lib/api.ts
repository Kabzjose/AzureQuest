/**
 * API client for AzureQuest.
 *
 * All requests go to VITE_API_URL/api/* (or /api/* via Vite proxy in dev).
 * The access token is stored in memory (Zustand store) only — never in localStorage.
 * The refresh token is an httpOnly cookie managed automatically by the browser.
 */

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Token is stored in memory to avoid XSS via localStorage
let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const url = `${BASE_URL}/api${path}`;
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',  // include httpOnly refresh cookie
  });

  if (!response.ok) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Unknown API error shape
    const body = await response.json().catch(() => ({})) as any;
    throw new ApiError(
      body?.error?.code ?? 'UNKNOWN',
      body?.error?.message ?? `HTTP ${response.status}`,
      response.status,
    );
  }

  return response.json() as Promise<T>;
}

// ─── Auth ─────────────────────────────────────────────────────────────────

import type { GuestAuthResponse, RegisterBody, LoginBody } from '@azurequest/shared';

export const auth = {
  guest: () => request<GuestAuthResponse>('/auth/guest', { method: 'POST' }),
  register: (body: RegisterBody) => request<GuestAuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: LoginBody) => request<GuestAuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  refresh: () => request<GuestAuthResponse>('/auth/refresh', { method: 'POST' }),
  logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),
};

// ─── Health ───────────────────────────────────────────────────────────────

export const health = {
  check: () => request<{ status: string; db: string; latencyMs: number }>('/health'),
};

// ─── Scenarios ────────────────────────────────────────────────────────────

import type { ScenarioPublic, Domain } from '@azurequest/shared';

export const scenarios = {
  list: (params?: { domain?: Domain; difficulty?: number }) => {
    const qs = new URLSearchParams();
    if (params?.domain) qs.set('domain', params.domain);
    if (params?.difficulty) qs.set('difficulty', String(params.difficulty));
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return request<{ scenarios: ScenarioPublic[] }>(`/scenarios${query}`);
  },
  get: (id: string) => request<{ scenario: ScenarioPublic }>(`/scenarios/${id}`),
};

// ─── Concepts ────────────────────────────────────────────────────────────

export const concepts = {
  list: () => request<{ concepts: unknown[] }>('/concepts'),
};

// ─── Attempts ────────────────────────────────────────────────────────────

import type { GradeResult, SubmitDecisionBody } from '@azurequest/shared';

export const attempts = {
  create: (scenarioId: string) =>
    request<{ attempt: { id: string } }>('/attempts', { method: 'POST', body: JSON.stringify({ scenarioId }) }),
  submitDecision: (attemptId: string, body: SubmitDecisionBody) =>
    request<{ gradeResult: GradeResult }>(`/attempts/${attemptId}/decisions`, { method: 'POST', body: JSON.stringify(body) }),
  complete: (attemptId: string) =>
    request<{ attempt: unknown }>(`/attempts/${attemptId}/complete`, { method: 'POST' }),
};

// ─── Progress ────────────────────────────────────────────────────────────

import type { Readiness, MisconceptionStat, NextActivity } from '@azurequest/shared';

export const progress = {
  readiness: () => request<{ readiness: Readiness }>('/progress/readiness'),
  misconceptions: () => request<{ misconceptions: MisconceptionStat[] }>('/progress/misconceptions'),
  next: () => request<{ next: NextActivity | null }>('/progress/next'),
};

// ─── Flashcards ────────────────────────────────────────────────────────────

import type { FlashcardState } from '@azurequest/shared';

export const flashcards = {
  due: () => request<{ flashcards: FlashcardState[] }>('/flashcards/due'),
  review: (conceptId: string, correct: boolean) =>
    request<{ flashcard: FlashcardState }>(`/flashcards/${conceptId}/review`, {
      method: 'POST',
      body: JSON.stringify({ correct }),
    }),
};

// ─── Tutor ────────────────────────────────────────────────────────────────

import type { ExplainBody, TutorExplanation, ChatBody, PracticeBody } from '@azurequest/shared';

export const tutor = {
  explain: (body: ExplainBody) =>
    request<{ explanation: TutorExplanation }>('/tutor/explain', { method: 'POST', body: JSON.stringify(body) }),
  chat: (body: ChatBody) =>
    request<{ reply: string; aiGenerated: boolean }>('/tutor/chat', { method: 'POST', body: JSON.stringify(body) }),
  practice: (body: PracticeBody) =>
    request<{ scenario: unknown }>('/tutor/practice', { method: 'POST', body: JSON.stringify(body) }),
};
