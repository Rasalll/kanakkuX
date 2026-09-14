import { ALLOWED_TOOLS, RawToolCall } from '@/lib/ai/tools';

export interface ChatTurn {
  role: 'user' | 'assistant';
  text: string;
}

const PLACEHOLDER_KEYS = new Set([
  '',
  'YOUR_GEMINI_API_KEY',
  'MY_GEMINI_API_KEY',
  'your_api_key_here',
]);

export function getGeminiApiKey(): string | null {
  const key = (process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || '').trim();
  if (!key || PLACEHOLDER_KEYS.has(key)) return null;
  return key;
}

const GEMINI_API = 'https://generativelanguage.googleapis.com/v1beta';

let resolvedModel: string | null = null;

function preferredModelNames(): string[] {
  const fromEnv = (process.env.GEMINI_MODEL || '').trim();
  return [
    fromEnv,
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-3.1-flash',
    'gemini-3.1-flash-lite',
    'gemini-3-flash-preview',
    'gemini-flash-latest',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
  ].filter((name, i, all) => name && all.indexOf(name) === i);
}

function apiHeaders(key: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'x-goog-api-key': key,
  };
}

function stripModelPrefix(name: string): string {
  return name.replace(/^models\//, '');
}

async function listUsableModels(key: string): Promise<string[]> {
  const res = await fetch(`${GEMINI_API}/models`, { headers: apiHeaders(key) });
  if (!res.ok) return [];
  const body = await res.json();
  const models = Array.isArray(body?.models) ? body.models : [];
  return models
    .filter((m: { name?: string; supportedGenerationMethods?: string[] }) =>
      (m.supportedGenerationMethods || []).includes('generateContent')
    )
    .map((m: { name: string }) => stripModelPrefix(m.name))
    .filter((name: string) => /gemini/i.test(name) && !/embedding|image|tts|computer/i.test(name));
}

function pickModel(available: string[]): string | null {
  const prefs = preferredModelNames();
  for (const pref of prefs) {
    if (available.includes(pref)) return pref;
  }
  const flash = available.find(name => /flash/i.test(name) && !/preview/i.test(name));
  if (flash) return flash;
  return available.find(name => /flash/i.test(name)) || available[0] || null;
}

async function resolveGeminiModel(key: string): Promise<string> {
  if (resolvedModel) return resolvedModel;
  const listed = await listUsableModels(key);
  const picked = pickModel(listed) || preferredModelNames()[0];
  resolvedModel = picked;
  return picked;
}

async function postGenerate(key: string, model: string, prompt: string, jsonMode: boolean): Promise<Response> {
  return fetch(`${GEMINI_API}/models/${model}:generateContent`, {
    method: 'POST',
    headers: apiHeaders(key),
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: jsonMode ? 0.1 : 0.2,
        ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
      },
    }),
  });
}

async function geminiFetch(prompt: string, jsonMode: boolean): Promise<Response> {
  const key = getGeminiApiKey();
  if (!key) throw new Error('missing_key');

  const first = await resolveGeminiModel(key);
  const tryModels = [first, ...preferredModelNames()].filter((n, i, all) => n && all.indexOf(n) === i);

  let last: Response | null = null;
  for (const model of tryModels) {
    const res = await postGenerate(key, model, prompt, jsonMode);
    if (res.ok) {
      resolvedModel = model;
      return res;
    }
    last = res;
    if (res.status === 401 || res.status === 403 || res.status === 429) return res;
    if (res.status === 404) {
      resolvedModel = null;
      continue;
    }
    return res;
  }

  return last!;
}

function throwForGeminiStatus(status: number): never {
  if (status === 429) throw new Error('rate_limited');
  if (status === 401 || status === 403) throw new Error('auth_failed');
  if (status === 404) throw new Error('model_not_found');
  throw new Error('gemini_failed');
}

export function isMockAiEnabled(): boolean {
  if (getGeminiApiKey()) return false;
  return process.env.NODE_ENV !== 'production';
}

async function generateJson(prompt: string): Promise<string> {
  const res = await geminiFetch(prompt, true);
  if (!res.ok) throwForGeminiStatus(res.status);

  const body = await res.json();
  const text: string | undefined = body?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('gemini_empty');
  return text;
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : trimmed;
  return JSON.parse(raw);
}

export async function inferToolCall(message: string, conversation: ChatTurn[]): Promise<RawToolCall> {
  const history = conversation
    .slice(-8)
    .map(t => `${t.role === 'user' ? 'User' : 'Assistant'}: ${t.text.slice(0, 500)}`)
    .join('\n');

  const prompt = `You map a user's finance question to ONE allowed tool. Return JSON only.

Allowed tools: ${ALLOWED_TOOLS.join(', ')}

JSON shape:
{
  "tool": "get_expense_summary",
  "period": "this_month",
  "category": null,
  "source": null,
  "person": null,
  "limit": 3,
  "from": null,
  "to": null,
  "last_n_days": null,
  "month": null,
  "year": null,
  "compare_period": null,
  "clarification": null
}

period must be one of: today, yesterday, this_week, last_week, this_month, last_month, this_year, last_year, last_n_days, named_month, explicit.

Rules:
- If the message is gibberish, venting, a greeting, or not about this user's expenses/income/sources/lending, use tool "clarify". Do NOT default to expenses.
- clarification should tell them you only answer questions about their finances.
- "total lent / money owed / who owes me" → get_lending_summary (remaining receivable, not expenses).
- Follow-ups like "how much of that was food?" MUST reuse the previous period from the conversation.
- Default period is this_month only when the question is clearly about spend or income.
- category is an expense category name (Food, Shopping), never a payment method.
- source is a Money Source (Salary, Freelance), never UPI/Cash/Card.
- Use get_spend_by_source for spending FROM a money source.
- Use get_income_by_source for income FROM a money source.
- Never invent SQL. Never include user_id.

Conversation:
${history || '(none)'}

Current question:
${message}`;

  const text = await generateJson(prompt);
  const parsed = extractJson(text);
  if (!parsed || typeof parsed !== 'object') throw new Error('invalid_intent');
  return parsed as RawToolCall;
}

export async function phraseReply(question: string, facts: Record<string, unknown>, fallback: string): Promise<string> {
  const prompt = `You are Ask KanakkuX, a concise personal finance assistant.

Rewrite the factual answer for the user. You MUST:
- Use only numbers, names, dates, and statuses present in FACTS or FALLBACK.
- Never invent or round to a different amount.
- Keep Indian rupee figures exactly as written (e.g. ₹1,25,000).
- If empty is true, say you could not find the data. Do not guess.
- Money lent is not an expense. Repayments are not new income.
- Keep it to 1-3 short sentences. No markdown.

Question: ${question}

FACTS JSON:
${JSON.stringify(facts)}

FALLBACK (already factually correct):
${fallback}`;

  if (!getGeminiApiKey()) return fallback;

  const res = await geminiFetch(prompt, false);
  if (!res.ok) return fallback;
  const body = await res.json();
  const text: string | undefined = body?.candidates?.[0]?.content?.parts?.[0]?.text;
  const cleaned = (text || '').trim();
  return cleaned || fallback;
}

function clarifyCall(): RawToolCall {
  return {
    tool: 'clarify',
    clarification:
      'I can only answer questions about your expenses, income, money sources, and money owed. Try something like “How much did I spend this month?” or “Who owes me money?”',
  };
}

export function heuristicToolCall(message: string, conversation: ChatTurn[]): RawToolCall {
  const text = message.toLowerCase().trim();
  const prev = [...conversation].reverse().find(t => t.role === 'user')?.text.toLowerCase() || '';
  const combined = `${prev} ${text}`;
  const looksFinancial =
    /spend|spent|expense|income|earn|salary|owe|owed|lent|lending|repay|pending|overdue|balance|category|source|food|shopping|transport|bills|commission|freelance|who owes|how much|total/.test(
      text
    );

  if (!looksFinancial) return clarifyCall();

  const call: RawToolCall = { tool: 'get_expense_summary', period: 'this_month' };

  if (/last month/.test(text) || /last month/.test(combined)) call.period = 'last_month';
  else if (/yesterday/.test(text)) call.period = 'yesterday';
  else if (/today/.test(text)) call.period = 'today';
  else if (/last week/.test(text)) call.period = 'last_week';
  else if (/this week/.test(text)) call.period = 'this_week';
  else if (/last year/.test(text)) call.period = 'last_year';
  else if (/this year/.test(text)) call.period = 'this_year';
  else if (/this month/.test(text)) call.period = 'this_month';
  else if (/that|those/.test(text) && /last month/.test(prev)) call.period = 'last_month';

  const monthMatch = text.match(
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i
  );
  if (monthMatch) {
    const months = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december',
    ];
    call.period = 'named_month';
    call.month = months.indexOf(monthMatch[1].toLowerCase()) + 1;
  }

  const lastDays = text.match(/last (\d{1,3}) days/);
  if (lastDays) {
    call.period = 'last_n_days';
    call.last_n_days = Number(lastDays[1]);
  }

  if (/owe|owed|lending|lent|pending|overdue|repay/.test(text)) {
    if (/overdue/.test(text)) call.tool = 'get_overdue_lending';
    else if (/received|repay/.test(text)) call.tool = 'get_repayment_summary';
    else if (/who|people|pending/.test(text) && !/how much does/.test(text)) call.tool = 'get_lending_summary';
    else {
      call.tool = 'get_person_lending';
      const person = message.match(/does\s+([A-Za-z][A-Za-z .'-]{1,40})\s+(still\s+)?owe/i)
        || message.match(/from\s+([A-Za-z][A-Za-z .'-]{1,40})/i);
      if (person) call.person = person[1].trim();
      if (!call.person) call.tool = 'get_lending_summary';
    }
    return call;
  }

  if (/income|earn|received|salary|commission|freelance/.test(text) && !/spend/.test(text)) {
    if (/salary|commission|freelance|youtube|gift/.test(text)) {
      call.tool = 'get_income_by_source';
      const src = message.match(/from\s+([A-Za-z][A-Za-z ]{1,40})/i);
      call.source = src ? src[1].trim() : /salary/.test(text) ? 'Salary' : null;
    } else {
      call.tool = 'get_income_summary';
    }
    return call;
  }

  if (/biggest|largest/.test(text)) {
    call.tool = 'get_largest_expense';
    return call;
  }

  if (/top\s+\d|top categories|most on/.test(text)) {
    call.tool = 'get_top_categories';
    call.limit = 3;
    return call;
  }

  const categoryMatch = text.match(
    /on\s+(food|transport|shopping|bills|entertainment|health|education|travel|subscriptions|other)/i
  );
  if (categoryMatch || /food|shopping|transport/.test(text)) {
    call.tool = 'get_expenses_by_category';
    call.category = categoryMatch ? categoryMatch[1] : 'Food';
    return call;
  }

  if (/from my|using my|source/.test(text) && /spend/.test(text)) {
    call.tool = 'get_spend_by_source';
    const src = message.match(/(?:from|using)\s+(?:my\s+)?([A-Za-z][A-Za-z ]{1,40})/i);
    if (src) call.source = src[1].replace(/income source/i, '').trim();
    return call;
  }

  if (/compare|vs last/.test(text)) {
    call.tool = 'get_monthly_comparison';
    call.compare_period = 'last_month';
    return call;
  }

  if (/spend|spent|expense|how much/.test(text)) {
    call.tool = 'get_expense_summary';
    return call;
  }

  return clarifyCall();
}
