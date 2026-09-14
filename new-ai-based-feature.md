# Ask KanakkuX — Feature Spec

Add an AI financial assistant to the existing Expense Tracker.

This is an **additive** feature. Do not redesign the app, change existing flows, or replace navigation. Keep the current UI, colors, layout, components, database, and behavior. Make only the smallest UI changes needed to open the assistant.

The app is **mobile-first**. That experience stays the priority.

---

## 1. Product

**Ask KanakkuX** lets an authenticated user ask natural-language questions about **their own** data:

- Expenses
- Income
- Money Sources
- Categories
- Lending (money owed to them)
- Repayments

Answers must come from the user’s Supabase records, not from invented numbers.

The assistant is a **read-only Q&A layer**. It does not create, edit, or delete transactions.

---

## 2. Non-negotiables

1. Do not replace the existing application.
2. Do not add a sixth item to the bottom navigation.
3. Do not let Gemini write or run arbitrary SQL.
4. Do not put `GEMINI_API_KEY` or the Supabase service-role key in client code.
5. Never trust a `user_id` from the client or from the model. Always use the authenticated session.
6. Never invent amounts, categories, sources, dates, or lending figures.
7. Do not treat money lent as an expense.
8. Do not treat lending repayments as new income.
9. Do not confuse **Money Source** (Salary, Freelance) with **Payment Method** (UPI, Cash, Card).
10. Reuse existing components, types, date helpers, and visual tokens.

---

## 3. Integration with the current app

The live product UI is a client SPA (`src/App.tsx`) mounted on `/dashboard`. Main sections are in-app tabs, not separate screens:

`dashboard` · `expenses` · `income` · `owed`

Bottom nav today: **Dashboard · Expenses · + Add · Income · Owed**. Keep that exact set.

Header today: month/calendar controls and profile. Add the AI entry **between calendar and profile**.

### Route

Use **`/ask`**.

Protect it in `middleware.ts` the same way as `/dashboard`.

Minimum-change approach:

- Add an Ask view inside the existing SPA (not a new bottom-nav tab).
- Mount the same SPA on `/ask` (same pattern as `/dashboard`).
- Header sparkle button opens `/ask` / the Ask view.
- Back on the Ask header returns to Dashboard.
- Bottom nav on `/ask` still switches Dashboard / Expenses / Add / Income / Owed.

Do not hide bottom nav on Ask.

---

## 4. UI

### 4.1 Header entry

On the Dashboard header, between Calendar and Profile:

`Calendar` · `✨` · `Profile`

Use a small sparkle + chat icon (`auto_awesome` or similar Material Symbol). Match existing header icon buttons. No large “AI” label. Not a bottom-nav item.

### 4.2 Chat page layout

Full-page, mobile-first, messaging-style:

```text
┌─────────────────────────────────────┐
│  ←   ✨ Ask KanakkuX                │
│      Your financial assistant       │
├─────────────────────────────────────┤
│                                     │
│     Scrollable messages             │
│                                     │
├─────────────────────────────────────┤
│  Ask about your finances…        ➤  │
├─────────────────────────────────────┤
│ Dashboard | Expenses | + | Income | Owed │
└─────────────────────────────────────┘
```

| Region | Behavior |
|---|---|
| Top bar | Back, sparkle icon, title, optional subtitle |
| Middle | Independent scroll; auto-scroll to latest message |
| Input | Fixed above bottom nav; send disabled when empty |
| Bottom nav | Sticky and fully usable |

Keyboard must not cover the input. Use the visual viewport / safe-area padding.

Desktop: same chrome; chat column centered with a sensible max-width (same shell as the rest of the app). Do not stretch the conversation full-bleed.

Visual language: existing teal/green tokens, typography, radius, spacing, buttons, cards. Do not introduce a separate “AI theme.”

### 4.3 Empty state

On first open / empty thread:

**Ask KanakkuX**  
Ask me anything about your expenses, income, and money owed.

Clickable suggestion chips that send the question immediately:

- How much did I spend last month?
- What was my biggest expense?
- How much did I spend on food?
- How much income did I receive this month?
- Who owes me money?
- How much is still pending?

Do not hard-code a person’s name in chips.

### 4.4 Messages

- User: right-aligned bubble
- Assistant: left-aligned bubble
- Typing/loading indicator while waiting
- Error state with retry
- Concise, mobile-readable answers
- Money as INR with Indian grouping: `₹1,25,000` not `₹125000`
- If data is missing: say so. Never guess.

---

## 5. Architecture

The browser must not call Gemini or query “all user data for the model.”

```text
User
  → Ask KanakkuX UI
  → POST /api/ai/chat  (authenticated)
  → Gemini (intent / tool call only)
  → Validate tool + args on the server
  → Supabase query scoped to session user
  → Gemini (natural-language answer from query result)
  → Chat UI
```

Suggested files:

- `lib/ai/gemini.ts` — Gemini client (server only)
- `lib/ai/tools.ts` — allowed tools, arg schemas, date-range resolution
- `lib/ai/queries.ts` — user-scoped Supabase queries
- `app/api/ai/chat/route.ts` — auth, orchestrate, respond
- `src/components/AskKanakkuXScreen.tsx` — chat UI

Request body:

```json
{
  "message": "How much did I spend last month?",
  "conversation": []
}
```

`conversation` is the current session only. Send the minimum needed for follow-ups. Never send the full ledger.

Server steps:

1. Require authenticated user.
2. Reject empty messages.
3. Ask Gemini for a structured tool call (not SQL).
4. Validate tool name and arguments against an allowlist.
5. Resolve dates on the **server** using existing helpers (`todayISO`, local calendar dates).
6. Run the matching Supabase query for `auth.uid()`.
7. Ask Gemini to phrase the result; numbers in that prompt must be the query result only.
8. Return `{ reply, mock?: boolean }` to the client.

---

## 6. Tools (no arbitrary SQL)

Gemini may request **only** these server operations (names can be prefixed, but the set is closed):

| Tool | Purpose |
|---|---|
| `get_expense_summary` | Total spend for a period |
| `get_expenses_by_category` | Spend for one category, or breakdown |
| `get_largest_expense` | Single largest expense in a period |
| `get_top_categories` | Top N categories by spend |
| `get_income_summary` | Total income for a period |
| `get_income_by_source` | Income for one Money Source, or breakdown |
| `get_spend_by_source` | Expenses filtered by Money Source |
| `get_lending_summary` | Totals owed / pending / overdue |
| `get_person_lending` | One person’s original, received, remaining, due, status |
| `get_repayment_summary` | Repayments for a person or overall |
| `get_overdue_lending` | Overdue lending list |
| `get_monthly_comparison` | Compare two periods (e.g. this month vs last) |

Unknown tools are rejected. Invalid args are rejected. The model cannot pass `user_id`.

Query only what the tool needs. Do not load the user’s entire history into Gemini.

### Example

User: “How much did I spend last month?”

Intent:

```json
{ "tool": "get_expense_summary", "period": "last_month" }
```

Server resolves `last_month` to an explicit local range (e.g. `2026-08-01` → `2026-08-31`), queries `expenses` for that user, then Gemini may answer:

“You spent ₹12,450 last month.”

A short breakdown is optional **only if those figures also came from the query**.

---

## 7. Question coverage

### Expenses

- How much did I spend last month / this month / today?
- Biggest expense
- Spend on Food / Shopping / a user category
- Top 3 categories

Resolve category names against the user’s `categories` table. Do not invent categories.

### Income and Money Sources

- Income this month / last month
- Income from Salary / Commission / a user source
- Which source brought the most income
- How much did I spend from Salary / Freelance

Use `sources`. Never mix up source vs payment method.

### Lending

- Who owes me money?
- How much is owed / still pending?
- How much does [person] still owe?
- Who is overdue?
- How much have I received from [person]?

Use original amount, repayments, remaining, due date, and status:

`pending` · `partially_paid` / `partial` · `paid` · `overdue`

Map UI `partial` to DB `partially_paid` in one place. Do not treat lending as expense or repayment as income.

---

## 8. Dates

Understand:

today · yesterday · this week · last week · this month · last month · this year · last year · named months (“August”) · explicit ranges · last N days

The **server** computes ranges from the user’s local calendar rules already used in the app (`lib/utils.ts`). Do not blindly trust model-generated dates.

If the user does not specify a period, prefer **this month**, and say that in the answer.

---

## 9. Follow-ups

Keep session context so this works:

1. “How much did I spend last month?” → “You spent ₹12,450 last month.”
2. “How much of that was food?” → food spend for **that same period**

Resolve “that”, “he”, “Rahul” from recent turns. If ambiguous, ask a short clarifying question instead of guessing.

---

## 10. Security

- User must be signed in.
- Every query uses the session user + existing RLS.
- Never expose `GEMINI_API_KEY` or service-role keys to the browser.
- Never send another user’s data to Gemini.
- Send the smallest result set needed for the answer.
- Do not log full financial payloads.
- Validate model output before any database call.

---

## 11. Gemini config and mock mode

Env (server only):

```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

Keep the placeholder in `.env.example`. Never commit a real key.

If `GEMINI_API_KEY` is missing:

- Do not crash.
- Serve clearly labeled **mock** replies so the chat UI can be built.
- Mark mock in the API response and in the UI (e.g. “Demo reply — add GEMINI_API_KEY for live answers”).
- Mock mode must be impossible to mistake for live data in production (disable unless `NODE_ENV === 'development'`).

When a real key is present, use Gemini with no code change.

---

## 12. Errors

Handle: missing key, Gemini failure, Supabase failure, invalid tool payload, unauthenticated, empty message, network, rate limit.

Show a short friendly message. Never show stack traces, keys, SQL, or raw provider errors.

If nothing matches:

“I couldn’t find any Food expenses for August.”

not a fabricated amount.

---

## 13. UX details

- Full-height chat; large tap targets
- Auto-scroll to newest message
- Send disabled when input is empty
- Enter/send that works on mobile
- Long replies stay readable
- Chat never sits under the sticky nav
- Safe-area padding on notched phones

---

## 14. Out of scope

- WhatsApp / SMS
- Writing or editing ledger data via chat
- OCR / receipt extraction
- Bank sync
- Forecasting or budgeting advice beyond stored facts
- Extra npm AI SDKs unless required for the official Gemini call

---

## 15. Acceptance

The feature is done when:

1. Dashboard header has a small Ask KanakkuX control between calendar and profile.
2. It opens `/ask` as a dedicated chat view.
3. The page behaves like a mobile messenger: independent message scroll, input above nav.
4. Existing bottom nav stays visible and can reach Dashboard, Expenses, Add, Income, Owed.
5. Authenticated questions are answered from that user’s Supabase data via allowlisted tools.
6. Gemini key is server-side only; no arbitrary SQL.
7. Natural dates such as “last month” resolve on the server.
8. Expense, income, source, category, and lending questions work; follow-ups use session context.
9. The assistant never invents financial numbers.
10. Missing key → safe, labeled mock mode in development; real key enables live Gemini.
11. Existing app behavior is unchanged aside from the header button and Ask view.
12. No real API key is in the repo.

Test mock mode end-to-end first, then the live Gemini path when `GEMINI_API_KEY` is set.
