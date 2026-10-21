/**
 * Provider-agnostic LLM client interface.
 * Implementations are selected by LLM_PROVIDER env var.
 */

export interface LLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LLMOptions {
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
}

export interface LLMClient {
  complete(system: string, messages: LLMMessage[], opts?: LLMOptions): Promise<string>;
}

// ─── Mock Client (offline dev / tests) ────────────────────────────────────

export class MockLLMClient implements LLMClient {
  async complete(_system: string, messages: LLMMessage[], _opts?: LLMOptions): Promise<string> {
    // Return a deterministic mock response that matches the explain schema
    return JSON.stringify({
      technicalReason: 'This is a mock explanation for testing purposes.',
      analogy: 'Think of it like a matatu — it illustrates the concept in a familiar East African context.',
      tradeOff: 'The trade-off is between control and convenience.',
      followUpQuestion: 'Can you think of another real-world scenario where this applies?',
      conceptsToRevise: [],
    });
  }
}

// ─── OpenAI Client ────────────────────────────────────────────────────────

export class OpenAILLMClient implements LLMClient {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey;
    this.model = model;
  }

  async complete(system: string, messages: LLMMessage[], opts?: LLMOptions): Promise<string> {
    const timeoutMs = opts?.timeoutMs ?? 10_000;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: opts?.maxTokens ?? 1024,
          temperature: opts?.temperature ?? 0.3,
          messages: [{ role: 'system', content: system }, ...messages],
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- External API response
      const data = await response.json() as any;
      return data.choices[0].message.content as string;
    } finally {
      clearTimeout(timeout);
    }
  }
}

// ─── Google Gemini Client ────────────────────────────────────────────────

export class GeminiLLMClient implements LLMClient {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey;
    this.model = model;
  }

  async complete(system: string, messages: LLMMessage[], opts?: LLMOptions): Promise<string> {
    const timeoutMs = opts?.timeoutMs ?? 10_000;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    // Convert to Gemini's content format
    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system }] },
          contents,
          generationConfig: {
            maxOutputTokens: opts?.maxTokens ?? 1024,
            temperature: opts?.temperature ?? 0.3,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- External API response
      const data = await response.json() as any;
      return data.candidates[0].content.parts[0].text as string;
    } finally {
      clearTimeout(timeout);
    }
  }
}

// ─── Factory ─────────────────────────────────────────────────────────────

export function createLLMClient(): LLMClient {
  const provider = process.env.LLM_PROVIDER ?? 'mock';
  const apiKey = process.env.LLM_API_KEY ?? '';
  const model = process.env.LLM_MODEL ?? '';

  switch (provider) {
    case 'openai':
      return new OpenAILLMClient(apiKey, model || 'gpt-4o-mini');
    case 'google':
    case 'gemini':
      return new GeminiLLMClient(apiKey, model || 'gemini-1.5-flash');
    case 'mock':
    default:
      return new MockLLMClient();
  }
}

// Singleton
export const llmClient = createLLMClient();
