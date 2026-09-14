import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGeminiApiKey, heuristicToolCall, inferToolCall, isMockAiEnabled, phraseReply } from '@/lib/ai/gemini';
import { validateToolCall } from '@/lib/ai/tools';
import { runTool, templateReply } from '@/lib/ai/queries';
import type { ChatTurn } from '@/lib/ai/gemini';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Please sign in to ask about your finances.' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const message = typeof body?.message === 'string' ? body.message.trim() : '';
    if (!message) {
      return NextResponse.json({ error: 'Type a question first.' }, { status: 400 });
    }
    if (message.length > 500) {
      return NextResponse.json({ error: 'Please keep questions under 500 characters.' }, { status: 400 });
    }

    const conversation: ChatTurn[] = Array.isArray(body?.conversation)
      ? body.conversation
          .slice(-8)
          .filter(
            (t: { role?: string; text?: string }) =>
              (t?.role === 'user' || t?.role === 'assistant') && typeof t?.text === 'string'
          )
          .map((t: { role: 'user' | 'assistant'; text: string }) => ({
            role: t.role,
            text: t.text.slice(0, 500),
          }))
      : [];

    const mock = isMockAiEnabled();
    const live = Boolean(getGeminiApiKey());

    if (!live && !mock) {
      return NextResponse.json(
        { error: 'Ask KanakkuX is not configured yet.' },
        { status: 503 }
      );
    }

    let rawCall;
    if (live) {
      try {
        rawCall = await inferToolCall(message, conversation);
      } catch (err) {
        const code = err instanceof Error ? err.message : '';
        if (code === 'rate_limited') {
          return NextResponse.json(
            { error: 'The assistant is busy. Please try again in a moment.' },
            { status: 429 }
          );
        }
        if (code === 'auth_failed') {
          return NextResponse.json(
            {
              error:
                'Gemini rejected the API key. Restart the dev server after saving .env.local, and confirm the key is an AI Studio Gemini key.',
            },
            { status: 401 }
          );
        }
        rawCall = heuristicToolCall(message, conversation);
      }
    } else {
      rawCall = heuristicToolCall(message, conversation);
    }

    const validated = validateToolCall(rawCall);
    if ('error' in validated) {
      return NextResponse.json({ reply: validated.error, mock });
    }

    let facts: Record<string, unknown>;
    try {
      facts = await runTool(supabase, user.id, validated);
    } catch {
      return NextResponse.json(
        { error: 'I could not load your records right now. Please try again.' },
        { status: 502 }
      );
    }

    const fallback = templateReply(facts);
    let reply = fallback;
    if (live && facts.type !== 'clarify') {
      try {
        reply = await phraseReply(message, facts, fallback);
      } catch {
        reply = fallback;
      }
    }

    return NextResponse.json({ reply, mock });
  } catch {
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
