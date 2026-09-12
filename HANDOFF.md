# KanakkuX Project Handoff

## 1. Project Overview & Architecture
**KanakkuX** is a mobile-first, full-stack Personal Finance & Expense Tracker designed for Indian users (₹ Rupee currency default).

- **Framework**: Next.js (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS v3 (`^3.4.17`), PostCSS, Google Fonts (*Plus Jakarta Sans*, *Inter*), and Google *Material Symbols Outlined*
- **Backend / Database**: Supabase (PostgreSQL with Row Level Security RLS)
- **Auth**: Supabase Auth (Google OAuth & Email/Password login)
- **Storage**: Cloudinary for receipt & bill image uploads
- **State Management**: React Context (`LedgerContext.tsx`) + Supabase hooks

---

## 2. Directory Structure
```
kanakkuX/
├── app/
│   ├── layout.tsx             # Root layout with Google Fonts + Material Symbols link
│   ├── globals.css            # Material symbols font styling, scrollbar hiding, typography
│   ├── page.tsx               # Root redirects to /login
│   ├── login/                 # Supabase auth page (OAuth & Email)
│   ├── dashboard/page.tsx     # Mounts @/src/App (full interactive client SPA)
│   └── expenses/, income/, lending/, reports/, settings/ # Sub-routes
├── src/
│   ├── App.tsx                # Main SPA client app coordinating views
│   ├── components/            # DashboardScreen, ExpensesScreen, IncomeScreen, OwedScreen, QuickAddModal, ReportModal, Toast, Navigation, Header
│   ├── context/
│   │   └── LedgerContext.tsx  # Dynamic rolling 24-month selector ending at current month (Sep 2026),
│   │                          # Default currency symbol: ₹, empty array fallbacks
│   └── data/
│       └── initialData.ts     # Cleaned of dummy data (ready for real user data entry)
├── lib/
│   ├── supabase/
│   │   ├── client.ts          # Browser Supabase client
│   │   └── server.ts          # Server Supabase client
│   ├── hooks/                 # useCategories, useSources
│   └── types.ts & utils.ts
├── supabase/
│   └── migrations/
│       ├── 20260910_initial_schema.sql   # Tables: profiles, categories, sources, transactions, loans, loan_repayments
│       └── 20260911_schema_hardening.sql # RLS policies, audit timestamps, constraints
├── tailwind.config.js         # Color tokens (primary #005c55, secondary, surface, error, etc.) + font families
├── middleware.ts              # Next.js auth & route protection with safe fallback for missing env vars
├── .env.local                 # Local environment variables (Supabase & Cloudinary configured)
└── .env.example               # Reference template for environment variables
```

---

## 3. Environment Variables (`.env.local`)
Currently configured with:
```env
NEXT_PUBLIC_SUPABASE_URL=https://bwlnynblnfmbypsfrgil.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI...
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dxtf8wnoq
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=ledgerflow_receipts
```

---

## 4. Key Fixes Completed
1. **Tailwind CSS Compatibility**:
   - Pinned `tailwindcss: ^3.4.17` (v4 caused UI breakages).
   - Added `./src/**/*.{ts,tsx}` to `content` in `tailwind.config.js`.
2. **Icons Restored**:
   - Loaded Google Material Symbols font in `app/layout.tsx` and styled in `app/globals.css`.
3. **Dashboard Integration**:
   - `app/dashboard/page.tsx` dynamically mounts the interactive SPA `@/src/App`.
4. **Localization & Clean Data**:
   - Currency configured to **₹ (Rupee)**.
   - Month picker is dynamically generated (rolling 24 months up to current month: Sep 2026).
   - All dummy mock transactions removed; clean zero-state ready for real inputs.
5. **Database & Storage**:
   - Supabase schema migrations created in `supabase/migrations/`.
   - Cloudinary upload preset and cloud name configured.

---

## 5. Next Steps for Development
1. **Connect UI to Supabase Backend**:
   - Currently `LedgerContext.tsx` persists locally in `localStorage`. Connect CRUD actions (add expense, edit, delete, loans) to the Supabase database (`transactions`, `loans` tables).
2. **Cloudinary Receipt Upload**:
   - Hook up the file upload input in `QuickAddModal.tsx` to upload directly to Cloudinary using the preset `ledgerflow_receipts`.
3. **Run Migrations & Test Auth Flow**:
   - Ensure the SQL migrations are executed on the Supabase project `bwlnynblnfmbypsfrgil`.
   - Test Google OAuth and email login redirecting to `/dashboard`.

### Recent Fix (Amount Inputs & Negative Signs):
- Removed restrictive 	ype=" number\, step, and rigid input rules on QuickAddModal.tsx, ExpensesScreen.tsx, and IncomeScreen.tsx.
- Amount input now accepts any clean numeric/decimal entry without browser blocking.
- Removed unwanted minus (-) prefixes from Outflow card, expense lists, and recent activity feeds. All transactions now display cleanly as ?500.00 instead of -?500.00.
