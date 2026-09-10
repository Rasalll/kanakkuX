# EXPENSE TRACKER — AI PROJECT HANDOFF / CONTEXT

You are taking over an existing Expense Tracker web application project.

IMPORTANT:
- This is an existing project, NOT a new project.
- Do NOT restart the project.
- Do NOT recreate work that has already been completed.
- First inspect the existing project and continue from the current state.
- The Product Requirements Document (PRD) is the source of truth for product behavior.
- Preserve existing work unless it is clearly incorrect or conflicts with the PRD.
- Do not implement future phases automatically.
- Work only on the phase/task explicitly requested.

==================================================
1. PROJECT OVERVIEW
==================================================

Project: Expense Tracker

Goal:
Build a simple, polished, mobile-first personal finance web application for:
- Expenses
- Income
- Money lent to other people
- Partial/full repayments
- Reusable Money Sources
- Categories
- Dashboard
- Unified Transactions
- Basic Reports

Primary target:
Mobile-first, but fully responsive on desktop.

This is an MVB (Minimum Viable Build). Keep the product focused and polished.

==================================================
2. TECHNOLOGY STACK
==================================================

- Next.js
- Tailwind CSS
- Supabase Auth
- Supabase PostgreSQL
- Supabase Row Level Security (RLS)
- Cloudinary for receipt/image uploads
- Vercel for deployment
- No separate backend server required for the MVB

Use environment variables for Supabase, Cloudinary, and server-side secrets.

Never expose private secrets in client-side code.

==================================================
3. WHO DOES WHAT
==================================================

The project is intentionally split between THREE roles:

1. CHATGPT = PROJECT COORDINATOR / PLANNER
2. ANTIGRAVITY = FRONTEND / UI IMPLEMENTATION AGENT
3. CODEX = BACKEND / DATABASE / INFRASTRUCTURE AGENT

The user works with Antigravity and Codex as separate implementation agents.

--------------------------------------------------
CHATGPT RESPONSIBILITY
--------------------------------------------------

ChatGPT is the project coordinator.

ChatGPT should:
- Maintain the overall project plan.
- Track which phase/task is completed.
- Determine the correct next task.
- Decide whether the task belongs to Antigravity or Codex.
- Give the user ready-to-paste prompts for the correct agent.
- Keep Antigravity and Codex responsibilities separate.
- Prevent duplicated work.
- Prevent agents from jumping ahead.
- Compare implementation progress against the PRD.
- Help verify whether a phase is actually complete.

ChatGPT does NOT replace Antigravity or Codex for implementation.

When the user says:
"Do 4.1"

ChatGPT should understand the task and provide the appropriate implementation instruction for the agent responsible for 4.1.

When the user says:
"What should Codex do next?"
determine the next appropriate Codex task from the current project state.

--------------------------------------------------
ANTIGRAVITY RESPONSIBILITY
--------------------------------------------------

Antigravity is primarily responsible for FRONTEND / UI / APPLICATION EXPERIENCE.

Typical Antigravity work:
- Next.js pages
- React components
- Tailwind styling
- Forms
- Frontend hooks
- UI state
- Loading states
- Empty states
- Error states
- Success states
- Responsive/mobile UI
- Navigation
- Frontend validation
- Connecting UI to existing backend/data operations
- User interaction
- Visual polish

Antigravity should NOT independently redesign the database or weaken security/RLS.

--------------------------------------------------
CODEX RESPONSIBILITY
--------------------------------------------------

Codex is primarily responsible for BACKEND / DATABASE / SECURITY / INFRASTRUCTURE.

Typical Codex work:
- Supabase PostgreSQL schema
- SQL migrations
- Database relationships
- Database constraints
- Supabase RLS
- Server/data operations
- Backend validation/business-rule enforcement
- Supabase Auth configuration
- Google OAuth configuration
- Cloudinary infrastructure/configuration
- Environment/configuration work
- GitHub/repository work
- Vercel/production configuration
- Security audits
- Database/data integrity verification

Codex should NOT unnecessarily redesign frontend UI.

--------------------------------------------------
IMPORTANT OWNERSHIP RULE
--------------------------------------------------

The split is based on RESPONSIBILITY, not simply technology.

Some features require BOTH agents.

Example:
Cloudinary:
- Codex handles configuration/infrastructure/storage-related setup.
- Antigravity handles upload UI, preview, loading/error states and frontend integration.

Authentication:
- Codex handles Supabase Auth/OAuth configuration and backend/security setup.
- Antigravity handles login/signup UI and frontend auth integration.

Never duplicate work.

==================================================
4. CORE AUTHENTICATION REQUIREMENTS
==================================================

Use Supabase Auth.

Required:
- Continue with Google / Google OAuth
- Email/password login
- Logout
- Persistent session

After login:
- Create/use user's profile
- Associate all records with authenticated user's ID
- Redirect authenticated users to dashboard
- Redirect unauthenticated users to login

Security:
- Enable RLS on all user-owned tables.
- Users can only access their own records.
- Never rely only on frontend authorization.

==================================================
5. MAIN PRODUCT REQUIREMENTS
==================================================

Dashboard:
- Total income
- Total expenses
- Current balance
- Total money currently owed to the user
- Total pending lending
- Recent transactions
- Upcoming lending due dates
- Overdue lending records

Balance:
Balance = Total Income - Total Expenses

Money lent is a receivable, NOT an expense.

Money received as a lending repayment is NOT counted as new income by default.

--------------------------------------------------
EXPENSES
--------------------------------------------------

Fields:
- Amount
- Category
- Money Source (optional)
- Payment Method
- Date
- Note
- Optional receipt/image

Payment methods:
- UPI
- Cash
- Bank Transfer
- Card
- Other

Actions:
- Add
- View
- Edit
- Delete
- Search
- Filter by date
- Filter by category
- Filter by Money Source

--------------------------------------------------
INCOME
--------------------------------------------------

Fields:
- Amount
- Money Source (optional)
- Payment Method
- Date
- Note

Actions:
- Add
- View
- Edit
- Delete
- Search/filter

Income must support reusable Money Sources.

--------------------------------------------------
MONEY SOURCES
--------------------------------------------------

Money Source means WHERE the user's money comes from.

Examples:
- Salary
- Commission
- Freelance
- Business
- Gift
- YouTube Income
- Other

Money Source and Payment Method are DIFFERENT.

Money Source:
WHERE money comes from.
Examples:
- Salary
- Commission
- Freelance

Payment Method:
HOW money is paid/received.
Examples:
- UPI
- Cash
- Bank Transfer
- Card

Money Source is optional.

When adding a transaction, user can:
1. Select an existing source.
2. Type a new source.
3. Save the new source.
4. Reuse it later.

Sources are user-specific.

Source management:
- Add
- Rename
- Archive/delete
- Select existing source

Prefer soft-delete/archive behavior.

Existing transactions must remain valid if a source is archived.

--------------------------------------------------
MONEY OWED TO ME / LENDING
--------------------------------------------------

Track money the user has lent to another person.

Fields:
- Person name
- Phone number (optional, record keeping only)
- Amount
- Lent date
- Duration
- Due date
- Lent via
- Note

Lent via:
- UPI
- Cash
- Bank Transfer
- Other

Due date:
User can provide duration.

Example:
Lent Date: September 10
Duration: 2 days
Due Date: September 12

Automatically calculate:
Due Date = Lent Date + Duration

Alternatively, user can select a due date directly.

Actual due date must be stored in the database.

Lending status:
- Pending
- Partially Paid
- Paid
- Overdue

Rules:
Pending:
- Nothing received
- Due date has not passed

Partially Paid:
- Some money received
- Remaining amount > 0

Paid:
- Remaining amount = 0

Overdue:
- Due date passed
- Remaining amount > 0

Display:
- Original amount
- Amount received
- Remaining amount
- Due date
- Status

--------------------------------------------------
REPAYMENTS
--------------------------------------------------

Fields:
- Amount received
- Received date
- Received via
- Optional note

Received via:
- UPI
- Cash
- Bank Transfer
- Other

Requirements:
- Multiple repayments allowed
- Partial repayments allowed
- Repayment cannot exceed current remaining amount
- Maintain repayment history

--------------------------------------------------
LENDING DUE TRACKING
--------------------------------------------------

Show:
- Due in X days
- Due today
- Overdue by X days
- Paid

SMS and WhatsApp reminders are NOT part of the MVB.

--------------------------------------------------
CATEGORIES
--------------------------------------------------

Default categories:
- Food
- Transport
- Shopping
- Bills
- Entertainment
- Health
- Education
- Travel
- Subscriptions
- Other

Users can create custom categories.

Category fields:
- Name
- Icon
- Optional color

==================================================
6. GLOBAL DATE RULE
==================================================

Apply this rule throughout the entire app.

If user selects a date:
- Save the selected date.

If user does not select a date:
- Automatically use today's date.

Every transaction must have a stored date.

Applies to:
- Expenses
- Income
- Money lent
- Repayments
- Future transaction types

Handle dates consistently to avoid timezone-related date changes.

==================================================
7. MOBILE-FIRST UX
==================================================

Primary target is mobile.

Requirements:
- Mobile-first responsive design
- Responsive desktop layout
- Bottom navigation
- Prominent + Add action
- Large touch-friendly controls
- Simple forms
- Easy one-handed use
- Clear transaction cards/lists
- Comfortable spacing
- Readable typography

Suggested bottom navigation:
- Home
- Reports
- Add
- Transactions
- Settings

Add action:
- Expense
- Income
- Money Lent

Keep forms short and optional fields optional.

==================================================
8. TRANSACTIONS
==================================================

Provide a unified history containing:
- Expenses
- Income
- Money lent
- Repayments where appropriate

Each item should show:
- Description/person
- Amount
- Date
- Category/type
- Money Source where applicable
- Payment method
- Status where relevant

Filters:
- Search
- Date
- Category
- Money Source
- Transaction type

==================================================
9. REPORTS
==================================================

Keep reports simple and mobile-friendly.

Required:
- Spending by category
- Income vs expenses
- Monthly totals
- Lending/receivables summary
- Spending/income by Money Source

Do NOT build complex financial analytics in the MVB.

==================================================
10. DATABASE MODEL
==================================================

Required tables:

profiles
- id
- name
- email
- created_at
- updated_at

expenses
- id
- user_id
- amount
- category_id
- source_id
- payment_method
- date
- note
- receipt_url
- receipt_public_id
- created_at
- updated_at

income
- id
- user_id
- amount
- source_id
- payment_method
- date
- note
- created_at
- updated_at

lending
- id
- user_id
- person_name
- phone_number
- original_amount
- lent_via
- lent_date
- duration_days
- due_date
- note
- status
- created_at
- updated_at

repayments
- id
- user_id
- lending_id
- amount
- received_via
- date
- note
- created_at

categories
- id
- user_id
- name
- icon
- color
- created_at
- updated_at

sources
- id
- user_id
- name
- is_archived
- created_at
- updated_at

Do not force the existing project to match this structure if it has a valid implementation difference. Inspect first.

==================================================
11. DATABASE SECURITY
==================================================

Use Supabase RLS.

For user-owned data:

SELECT:
Only user's own records.

INSERT:
Only records belonging to authenticated user.

UPDATE:
Only user's own records.

DELETE:
Only user's own records.

Repayments must also be protected through:
- authenticated user
- associated lending record

==================================================
12. BUSINESS RULES
==================================================

1. Expense amounts > 0.
2. Income amounts > 0.
3. Lending amounts > 0.
4. Repayment amounts > 0.
5. Repayment cannot exceed current remaining lending amount.
6. Multiple repayments allowed.
7. Lending becomes Paid when remaining amount reaches zero.
8. Lending becomes Partially Paid when received > 0 and remaining > 0.
9. Lending is Pending when nothing received and it is not overdue.
10. Lending is Overdue when due date passed and money remains unpaid.
11. Money lent does not reduce expense total.
12. Lending repayments are not new income by default.
13. Missing transaction date uses today's date.
14. Explicit transaction date must be preserved.
15. Every transaction has a stored date.
16. Every user-owned record belongs to authenticated user.
17. Destructive actions require confirmation.
18. Forms validate required fields and invalid amounts.
19. Money Source is optional.
20. Newly typed Money Source can be saved and reused.
21. Money Sources are user-specific.
22. Money Source and Payment Method are separate.
23. Existing transactions remain valid when source is archived.

==================================================
13. MVB SCOPE
==================================================

INCLUDE:
- Next.js
- Tailwind CSS
- Supabase Auth
- Google OAuth
- Email/password
- PostgreSQL
- RLS
- Dashboard
- Expenses
- Income
- Money Owed to Me
- Lending duration
- Automatic due-date calculation
- Due/overdue tracking
- Full repayments
- Partial repayments
- Repayment history
- UPI/Cash/Bank Transfer/Card/Other
- Categories
- Custom categories
- Reusable Money Sources
- User-created Money Sources
- Cloudinary receipt uploads
- Basic search/filter
- Basic reports
- Mobile-first responsive UI
- Vercel deployment

DO NOT INCLUDE YET:
- WhatsApp reminders
- SMS reminders
- AI financial assistant
- OCR/automatic receipt extraction
- Bank synchronization
- Advanced budgeting
- Multiple financial accounts
- Investment tracking
- Complex recurring transactions
- Advanced financial forecasting

==================================================
14. IMPLEMENTATION PHASES
==================================================

The original high-level implementation plan is:

PHASE 1
Next.js App Router Architecture & Foundation

PHASE 2
Database Schema & Supabase RLS Migration

PHASE 3
Supabase Authentication & Protected Routes

PHASE 4
Reusable Money Sources & Categories System

PHASE 5
Money Owed to Me — Lending, Due Dates & Repayments

PHASE 6
Expenses & Income Management with Cloudinary Receipts

PHASE 7
Dashboard & Unified Transactions History

PHASE 8
Mobile-First UX, Reports & Deployment Polish

For implementation, phases are divided into smaller numbered tasks.

IMPORTANT:
- Do not automatically execute an entire phase.
- If the user asks for a numbered task, perform only that task.
- If the user asks to continue a phase, inspect current state and continue unfinished work only.

==================================================
15. DETAILED TASK OWNERSHIP
==================================================

PHASE 1 — FOUNDATION

1.1  Antigravity → Next.js App Router project/folder structure
1.2  Antigravity → Tailwind CSS/design foundation
1.3  Antigravity → Supabase browser/server clients
1.4  Antigravity → TypeScript models/utilities
1.5  Antigravity → Middleware/auth route protection foundation
1.6  Antigravity → Login/signup UI
1.7  Antigravity → Basic responsive/mobile foundation

PHASE 2 — DATABASE & SECURITY

2.1  Codex → profiles table
2.2  Codex → expenses table
2.3  Codex → income table
2.4  Codex → lending table
2.5  Codex → repayments table
2.6  Codex → categories table
2.7  Codex → sources table
2.8  Codex → relationships/constraints
2.9  Codex → RLS policies
2.10 Codex → default categories
2.11 Codex → security/user-isolation verification

PHASE 3 — AUTHENTICATION

3.1  Codex → Supabase Auth configuration
3.2  Codex → Google OAuth configuration
3.3  Codex → email/password configuration
3.4  Codex → profile creation/use verification
3.5  Codex → session persistence verification
3.6  Codex → authenticated ownership verification
3.7  Antigravity → connect login UI
3.8  Antigravity → signup flow
3.9  Antigravity → Google login flow
3.10 Antigravity → logout
3.11 Antigravity → auth loading/error states
3.12 Antigravity → login/dashboard redirects

PHASE 4 — SOURCES & CATEGORIES

4.1  Antigravity → Money Sources UI
4.2  Antigravity → Add Source UI
4.3  Antigravity → Rename Source UI
4.4  Antigravity → Archive Source UI
4.5  Antigravity → Categories UI
4.6  Antigravity → Add custom Category UI
4.7  Antigravity → Category edit/delete UI
4.8  Antigravity → source/category loading & empty states
4.9  Codex → Source CRUD/data operations
4.10 Codex → Source archive behavior
4.11 Codex → Category CRUD/data operations
4.12 Codex → Source/category RLS verification
4.13 Antigravity → connect Source UI
4.14 Antigravity → connect Category UI
4.15 Both → integration verification

PHASE 5 — LENDING & REPAYMENTS

5.1  Antigravity → Lending form
5.2  Antigravity → Person/name/phone fields
5.3  Antigravity → Amount/lent-date fields
5.4  Antigravity → Duration input
5.5  Antigravity → Due-date selection
5.6  Antigravity → calculated due-date display
5.7  Antigravity → Lending list/cards
5.8  Antigravity → Lending status UI
5.9  Antigravity → due/overdue indicators
5.10 Antigravity → Lending detail view
5.11 Codex → Lending CRUD/data operations
5.12 Codex → due-date data handling
5.13 Codex → repayment data operations
5.14 Codex → repayment validation/business rules
5.15 Codex → lending RLS/security
5.16 Antigravity → repayment UI
5.17 Antigravity → partial repayment UI
5.18 Antigravity → repayment history UI
5.19 Codex → enforce repayment amount rules
5.20 Both → status/calculation verification

PHASE 6 — EXPENSES & INCOME

6.1  Antigravity → Expense form
6.2  Antigravity → amount/category/source/payment UI
6.3  Antigravity → date/note fields
6.4  Antigravity → receipt UI
6.5  Antigravity → expense list
6.6  Antigravity → expense detail
6.7  Antigravity → edit expense
6.8  Antigravity → delete confirmation
6.9  Antigravity → expense search/filter
6.10 Codex → expense CRUD
6.11 Codex → expense validation
6.12 Codex → expense RLS
6.13 Antigravity → income form
6.14 Antigravity → income list
6.15 Antigravity → income edit/delete
6.16 Antigravity → income search/filter
6.17 Antigravity → income Money Source selection
6.18 Codex → income CRUD
6.19 Codex → income validation
6.20 Codex → income RLS

PHASE 7 — CLOUDINARY RECEIPTS

7.1  Codex → Cloudinary configuration
7.2  Codex → secure upload configuration
7.3  Codex → receipt URL/public ID handling
7.4  Codex → environment/production configuration
7.5  Antigravity → receipt picker/upload UI
7.6  Antigravity → upload progress/loading
7.7  Antigravity → receipt preview
7.8  Antigravity → receipt viewing
7.9  Antigravity → upload error handling

PHASE 8 — DASHBOARD

8.1  Antigravity → Dashboard layout
8.2  Antigravity → total income
8.3  Antigravity → total expenses
8.4  Antigravity → balance
8.5  Antigravity → money owed
8.6  Antigravity → pending lending
8.7  Antigravity → recent transactions
8.8  Antigravity → upcoming due dates
8.9  Antigravity → overdue lending
8.10 Antigravity → responsive dashboard
8.11 Codex → dashboard data queries
8.12 Codex → income/expense calculations
8.13 Codex → lending totals
8.14 Codex → recent transaction queries
8.15 Codex → due/overdue queries

PHASE 9 — UNIFIED TRANSACTIONS

9.1  Antigravity → Transactions page
9.2  Antigravity → transaction cards/list
9.3  Antigravity → expense representation
9.4  Antigravity → income representation
9.5  Antigravity → lending representation
9.6  Antigravity → repayment representation
9.7  Antigravity → search UI
9.8  Antigravity → date filter
9.9  Antigravity → category filter
9.10 Antigravity → Money Source filter
9.11 Antigravity → transaction-type filter
9.12 Codex → unified transaction data
9.13 Codex → search queries
9.14 Codex → filter queries
9.15 Codex → pagination/query optimization if needed

PHASE 10 — REPORTS

10.1  Antigravity → Reports page
10.2  Antigravity → spending by category UI
10.3  Antigravity → income vs expenses UI
10.4  Antigravity → monthly totals UI
10.5  Antigravity → lending summary UI
10.6  Antigravity → Money Source report UI
10.7  Antigravity → mobile report experience
10.8  Codex → report queries
10.9  Codex → category aggregation
10.10 Codex → income/expense aggregation
10.11 Codex → monthly aggregation
10.12 Codex → lending/source aggregation

PHASE 11 — MOBILE UX & NAVIGATION

11.1 Antigravity → bottom navigation
11.2 Antigravity → Home navigation
11.3 Antigravity → Reports navigation
11.4 Antigravity → Add action/navigation
11.5 Antigravity → Transactions navigation
11.6 Antigravity → Settings navigation
11.7 Antigravity → prominent + Add action
11.8 Antigravity → touch-friendly controls
11.9 Antigravity → mobile spacing/typography
11.10 Antigravity → desktop responsive layout

PHASE 12 — VALIDATION / SECURITY / UX

12.1  Antigravity → loading states
12.2  Antigravity → empty states
12.3  Antigravity → success states
12.4  Antigravity → error states
12.5  Antigravity → frontend form validation
12.6  Antigravity → destructive-action confirmations
12.7  Antigravity → date handling UI
12.8  Antigravity → final accessibility/UX pass
12.9  Codex → server/business-rule validation
12.10 Codex → RLS/security audit
12.11 Codex → data integrity checks
12.12 Codex → date consistency verification

PHASE 13 — FINAL TESTING & DEPLOYMENT

13.1  Antigravity → full UI testing
13.2  Antigravity → mobile testing
13.3  Antigravity → desktop testing
13.4  Antigravity → navigation testing
13.5  Antigravity → form/error-state testing
13.6  Antigravity → final visual polish
13.7  Codex → production environment configuration
13.8  Codex → Supabase production verification
13.9  Codex → final RLS audit
13.10 Codex → Cloudinary production verification
13.11 Codex → Vercel deployment
13.12 Codex → production smoke test

==================================================
16. ACTUAL PROJECT PROGRESS
==================================================

IMPORTANT:
This status comes from the user's actual Antigravity conversation.

PHASE 1:
COMPLETED according to Antigravity.

Reported completed:
- package.json
- tsconfig.json
- next.config.ts
- tailwind.config.js
- middleware.ts
- lib/supabase/server.ts
- lib/supabase/client.ts
- lib/types.ts
- lib/utils.ts
- app/login/LoginPage.tsx
- supabase/migrations/
- initial SQL schema/migration
- auth route guard foundation
- login/signup UI
- Google + Email login UI

Antigravity also reported the development server running on:
http://localhost:3000

Do not assume external dashboard configuration was completed just because it was mentioned as a next step.

--------------------------------------------------
PHASE 2 / PHASE 3
--------------------------------------------------

A later Antigravity/Codex responsibility report marked several infrastructure tasks as completed.

It mentioned:
- Run SQL migration
- Enable RLS
- Seed default categories
- Configure Google OAuth
- Supabase credentials in .env.local
- Cloudinary upload preset
- Cloudinary environment variables
- GitHub push

HOWEVER:
These statuses were not independently verified in this conversation.

Therefore:
Treat Phase 2/3/infrastructure as:
"REPORTED COMPLETED / NEEDS VERIFICATION"

Do not blindly repeat these tasks.

Inspect the actual project and relevant configuration before changing anything.

==================================================
17. CURRENT EXACT STATE — PHASE 4
==================================================

PHASE 4 HAS BEEN STARTED BUT IS NOT FINISHED.

Antigravity reported implementing:

- useSources.ts
- useCategories.ts
- SourceSelector.tsx
- CategoryPicker.tsx
- Modal.tsx
- Button.tsx
- Badge.tsx
- Settings page
- SettingsPage.tsx

The purpose was:
- Money Sources functionality
- Categories functionality
- Settings management
- Data hooks
- UI components

These files/components should already exist or have been created during Phase 4.

DO NOT recreate them blindly.

==================================================
18. EXACT POINT WHERE PHASE 4 STOPPED
==================================================

After the Phase 4 UI/hooks/settings work, Antigravity was verifying the development server.

It identified a Next.js 16 issue:
the middleware convention had changed from:

middleware.ts

to:

proxy.ts

Antigravity attempted the Next.js codemod:
middleware-to-proxy

The codemod failed because the project was not a Git repository.

Error included:
"fatal: not a git repository"

Antigravity then attempted to inspect documentation using the Unix command:
head

That also failed because the Windows shell did not have the `head` command.

The last action/message from Antigravity was effectively:

"Codemod failed because there's no git repo. Let me manually rename middleware.ts to proxy.ts with the correct Next.js 16 format"

Then the session stopped because of token limits.

==================================================
19. IMMEDIATE NEXT ACTION
==================================================

The next agent taking over MUST NOT restart Phase 4.

First:

1. Inspect the current project.
2. Inspect package.json.
3. Check installed Next.js version.
4. Check whether middleware.ts exists.
5. Inspect middleware.ts contents.
6. Check whether proxy.ts already exists.
7. Inspect existing Phase 4 files.
8. Run appropriate checks.

If Next.js 16 requires proxy.ts:
- Manually migrate correctly.
- Preserve authentication route protection behavior.
- Do not change unrelated code.

Then:
- Verify Money Sources.
- Verify Categories.
- Verify Settings.
- Verify integration.
- Run TypeScript/build/dev-server checks.
- Fix only issues discovered.
- Do NOT start Phase 5.

==================================================
20. PHASE 4 COMPLETION CHECKLIST
==================================================

Money Sources:

[ ] Existing sources display correctly.
[ ] Existing source can be selected.
[ ] User can type a new source.
[ ] User can save a new source.
[ ] New source can be reused later.
[ ] Sources are user-specific.
[ ] User can rename a source.
[ ] User can archive/delete a source.
[ ] Existing transactions remain valid after source archive.
[ ] Archived sources are handled correctly in selectors.

Categories:

[ ] Default categories exist.
[ ] Categories display correctly.
[ ] User can create custom category.
[ ] Category fields work.
[ ] User can manage categories.
[ ] Categories are user-specific where applicable.

Settings:

[ ] Sources management works.
[ ] Categories management works.
[ ] Loading states work.
[ ] Empty states work.
[ ] Error states work.
[ ] Destructive actions require confirmation.

Integration:

[ ] SourceSelector works.
[ ] CategoryPicker works.
[ ] Existing UI components work.
[ ] Supabase operations work.
[ ] RLS/user isolation works.
[ ] TypeScript/build/dev-server checks pass.
[ ] No unrelated features are broken.

Next.js:

[ ] Middleware/proxy convention is correct for installed Next.js version.
[ ] Authentication route protection still works.
[ ] Login/dashboard redirect behavior still works.

Only after all relevant checks pass should Phase 4 be marked COMPLETE.

==================================================
21. IMPORTANT WORKING RULES
==================================================

RULE 1:
The PRD is the product source of truth.

RULE 2:
The existing implementation is also important.
Inspect before modifying.

RULE 3:
Never restart completed work.

RULE 4:
Never silently implement future phases.

RULE 5:
If given a numbered task, perform only that task.

RULE 6:
If a dependency is unfinished, identify it instead of silently bypassing it.

RULE 7:
Do not modify unrelated functionality.

RULE 8:
Do not add features outside the MVB.

RULE 9:
Do not weaken security/RLS for convenience.

RULE 10:
Do not expose private environment variables in client-side code.

RULE 11:
Business rules must remain consistent with the PRD.

RULE 12:
Test after implementation.

RULE 13:
Do not assume a previous agent's "completed" label means the task is actually verified.

RULE 14:
If Antigravity and Codex both need to work on a feature, keep their responsibilities separated.

RULE 15:
When a task is complete, report:
- What was already present
- What was changed
- Files changed
- What was tested
- Test/build result
- Remaining issues
- What the next task should be

==================================================
22. HOW TO USE THIS HANDOFF
==================================================

If the user says:

"Continue Phase 4"

Inspect the current state and continue from the exact stopping point.

If the user says:

"Do 4.1"

4.1 belongs to Antigravity:
Money Sources UI.

If the user says:

"Do 4.9"

4.9 belongs to Codex:
Source CRUD/data operations.

If the user says:

"What should Codex do next?"

Determine the next unfinished Codex-owned task based on the actual current state.

If the user says:

"What should Antigravity do next?"

Determine the next unfinished Antigravity-owned task based on the actual current state.

If the user says:

"Is Phase 4 complete?"

Inspect/review the current state and verify against the Phase 4 checklist before answering.

==================================================
23. CURRENT STATUS SUMMARY
==================================================

Phase 1:
COMPLETED according to Antigravity.

Phase 2:
REPORTED COMPLETED / VERIFY.

Phase 3:
REPORTED COMPLETED / VERIFY.

Phase 4:
IN PROGRESS.

Phase 4 already implemented/reported:
- useSources.ts
- useCategories.ts
- SourceSelector.tsx
- CategoryPicker.tsx
- Modal.tsx
- Button.tsx
- Badge.tsx
- Settings page
- SettingsPage.tsx

Current stopping point:
Next.js 16 middleware → proxy migration and final Phase 4 verification.

Phase 5:
NOT STARTED.

Phase 6:
NOT STARTED.

Phase 7:
NOT STARTED.

Phase 8:
NOT STARTED.

==================================================
24. DO NOT START PHASE 5 YET
==================================================

Phase 5 should begin ONLY after Phase 4 is verified complete.

Phase 5 will cover:
- Lending form
- Person information
- Amount
- Lent date
- Duration
- Due date
- Automatic due-date calculation
- Lending list
- Lending status
- Due/overdue indicators
- Lending details
- Repayment UI
- Partial repayments
- Multiple repayments
- Repayment history
- Remaining amount calculation
- Repayment validation
- Lending RLS/security

==================================================
25. FINAL HANDOFF INSTRUCTION
==================================================

If you are a new AI taking over this project:

DO NOT START FROM SCRATCH.

DO NOT RECREATE PHASE 1.

DO NOT RESTART PHASE 4.

First inspect the existing project.

The current known stopping point is:
Phase 4 was partially completed by Antigravity, and the session stopped while dealing with the Next.js 16 middleware.ts → proxy.ts migration and before final Phase 4 verification.

Continue from there.

Use:
- Antigravity for frontend/UI/application experience work.
- Codex for backend/database/security/infrastructure/deployment work.
- ChatGPT as the project coordinator/planner.

The PRD and this handoff are the project context.

Do not proceed to Phase 5 until Phase 4 is actually verified complete.
