# Expense Tracker — MVB PRD

## 1. Product Overview

A simple, mobile-first Expense Tracker web app for tracking expenses, income, and money lent to other people.

The app should be easy to use on a phone while remaining fully responsive on desktop.

## 2. Tech Stack

- Next.js
- Tailwind CSS
- Supabase Auth
- Supabase PostgreSQL
- Supabase Row Level Security (RLS)
- Cloudinary for receipt/image uploads
- Vercel for deployment
- No separate backend server required for the MVB

Use environment variables for Supabase, Cloudinary, and server-side secrets. Never expose private secrets in client-side code.

## 3. Authentication

Use Supabase Auth.

Authentication:
- Continue with Google (OAuth)
- Email/password login
- Logout
- Persistent session

After login:
- Create/use the user's profile
- Associate all records with the authenticated user's ID
- Redirect authenticated users to dashboard
- Redirect unauthenticated users to login

Security:
- Enable RLS on all user-owned tables
- Users can only access their own records
- Never rely only on frontend authorization

## 4. Goals

- Quickly record expenses and income
- Track payment methods
- Track money lent and repayments
- Support partial repayments
- Track lending due dates
- Show due-soon, due-today, and overdue records
- Track reusable money sources
- Provide a simple financial overview
- Provide an excellent mobile-first experience

## 5. Dashboard

Display:
- Total income
- Total expenses
- Current balance
- Total money currently owed to the user
- Total pending lending
- Recent transactions
- Upcoming lending due dates
- Overdue lending records

Balance:

`Balance = Total Income - Total Expenses`

Money lent is a receivable, not an expense.

Money received as a lending repayment is not counted as new income by default.

## 6. Expenses

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

Example:

`Expense: ₹250`
`Category: Food`
`Money Source: Salary`
`Payment Method: UPI`

## 7. Income

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

Income should support reusable Money Sources.

## 8. Money Sources

Money Sources identify where the user's money comes from.

Examples:
- Salary
- Commission
- Freelance
- Business
- Gift
- YouTube Income
- Other

### Source Behavior

The Money Source field is optional.

When adding a transaction, users can:
- Select an existing source
- Type a new source
- Save the new source
- Reuse it later

Example:

First time:
`Money Source: Salary`

Next time:
`Money Source: Salary ▼`

If the user types `YouTube Income`, save it as a new reusable source.

Sources are user-specific.

### Money Source vs Payment Method

Keep these separate:

- Money Source = where the money comes from, e.g. Salary, Commission, Freelance
- Payment Method = how money is paid/received, e.g. UPI, Cash, Bank Transfer, Card

### Source Management

Users can:
- Add a source
- Rename a source
- Archive/delete a source
- Select an existing source

Existing transactions must remain valid if a source is archived/deleted. Prefer soft-delete/archive behavior.

## 9. Money Owed to Me

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

### Duration and Due Date

Example:

`Lent Date: September 10`
`Duration: 2 days`
`Due Date: September 12`

Automatically calculate the due date from lent date + duration.

The user may alternatively select a due date directly.

Store the actual due date in the database.

### Lending Status

Show:
- Original amount
- Amount received
- Remaining amount
- Due date
- Status

Statuses:
- Pending
- Partially Paid
- Paid
- Overdue

Rules:
- Pending: nothing received and due date has not passed
- Partially Paid: some money received and remaining amount > 0
- Paid: remaining amount = 0
- Overdue: due date has passed and remaining amount > 0

## 10. Repayments

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

Support multiple and partial repayments.

A repayment cannot exceed the current remaining amount.

Maintain repayment history for each lending record.

## 11. Lending Due Tracking

Track due dates without SMS or WhatsApp.

Show:
- Due in X days
- Due today
- Overdue by X days
- Paid

Example:

`Rahul — ₹5,000 — Due in 2 days`

`Rahul — ₹5,000 — Due today`

`Rahul — ₹5,000 — Overdue by 3 days`

Future in-app reminders may use Supabase Cron + Edge Functions.

SMS and WhatsApp are outside the MVB.

## 12. Categories

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

## 13. Global Date Rule

Apply this rule throughout the app.

If the user selects a date:
- Save the selected date.

If the user does not select a date:
- Automatically use today's date.

Every transaction must have a stored date.

Applies to:
- Expenses
- Income
- Money lent
- Repayments
- Future transaction types

Handle dates consistently to avoid timezone-related date changes.

## 14. Mobile-First UI

Primary target: mobile.

Requirements:
- Mobile-first responsive design
- Responsive desktop layout
- Bottom navigation
- Prominent `+ Add` action
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

## 15. Add Transaction Experience

Provide a quick Add action for:
- Expense
- Income
- Money Lent

Keep forms short and optional fields optional.

## 16. Transactions

Provide a unified history area.

Show:
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

Provide:
- Search
- Date filtering
- Category filtering
- Money Source filtering
- Transaction-type filtering

## 17. Reports

Simple mobile-friendly reports:
- Spending by category
- Income vs expenses
- Monthly totals
- Lending/receivables summary
- Spending/income by Money Source

Avoid complex financial analytics in the MVB.

## 18. Data Model

### profiles
- id
- name
- email
- created_at
- updated_at

### expenses
- id
- user_id
- amount
- category_id
- source_id (optional)
- payment_method
- date
- note
- receipt_url
- receipt_public_id
- created_at
- updated_at

### income
- id
- user_id
- amount
- source_id (optional)
- payment_method
- date
- note
- created_at
- updated_at

### lending
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

### repayments
- id
- user_id
- lending_id
- amount
- received_via
- date
- note
- created_at

### categories
- id
- user_id
- name
- icon
- color
- created_at
- updated_at

### sources
- id
- user_id
- name
- is_archived
- created_at
- updated_at

## 19. Database Security

Use Supabase RLS.

For user-owned data:
- SELECT only own records
- INSERT only records belonging to authenticated user
- UPDATE only own records
- DELETE only own records

Repayments must be protected through the authenticated user and associated lending record.

## 20. Business Rules

1. Expense amounts must be greater than zero.
2. Income amounts must be greater than zero.
3. Lending amounts must be greater than zero.
4. Repayment amounts must be greater than zero.
5. A repayment cannot exceed the current remaining lending amount.
6. Multiple repayments are allowed.
7. A lending record becomes Paid when remaining amount reaches zero.
8. A lending record is Partially Paid when received amount > 0 and remaining amount > 0.
9. A lending record is Pending when nothing has been received and it is not overdue.
10. A lending record is Overdue when due date has passed and money remains unpaid.
11. Money lent should not reduce expense total.
12. Lending repayments should not be counted as new income by default.
13. If no transaction date is provided, use today's date.
14. If a transaction date is provided, preserve the selected date.
15. Every transaction must have a stored date.
16. Every user-owned record must be associated with the authenticated user.
17. Destructive actions require confirmation.
18. Forms must validate required fields and invalid amounts.
19. Money Source is optional.
20. A newly typed Money Source can be saved and reused later.
21. Money Sources are user-specific.
22. Money Source and Payment Method are separate concepts.
23. Existing transactions must remain valid if a source is archived.

## 21. MVB Scope

### Include
- Next.js
- Tailwind CSS
- Supabase Auth
- Google OAuth
- Email/password authentication
- Supabase PostgreSQL
- Supabase RLS
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
- UPI/Cash/Bank Transfer/Card/Other payment methods
- Categories
- Custom categories
- Reusable Money Sources
- User-created Money Sources
- Cloudinary receipt uploads
- Basic search and filters
- Basic reports
- Mobile-first responsive UI
- Vercel deployment

### Do Not Include Yet
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

## 22. Future Reminder Architecture

For future scheduled in-app reminders:

`Supabase Database → Supabase Cron → Supabase Edge Function → Check upcoming/overdue lending → Create in-app reminder`

Do not implement SMS or WhatsApp in the MVB.

## 23. UX Principles

- Adding a transaction should take only a few taps.
- Avoid unnecessary fields.
- Keep important financial information visible.
- Make the Add action easy to access.
- Use clear status indicators.
- Make due dates obvious.
- Make remaining borrowed amounts obvious.
- Keep mobile as the primary experience.
- Provide loading, empty, success, and error states.
- Confirm destructive actions.
- Keep the interface simple.

## 24. Success Criteria

The MVB is successful if a user can:

1. Create an account or sign in with Google.
2. Add an expense quickly.
3. Add income easily.
4. See their financial summary.
5. Select an existing Money Source.
6. Create a new reusable Money Source while adding a transaction.
7. Record money lent to a friend.
8. Specify how the money was lent.
9. Set a lending duration or due date.
10. See the automatically calculated due date.
11. See when a lending record is due or overdue.
12. Record a full repayment.
13. Record multiple partial repayments.
14. See exactly how much someone still owes.
15. See how money was received.
16. Attach and view a receipt image.
17. Use the app comfortably on mobile.
18. Have data securely isolated from other users.
19. Use consistent date behavior throughout the application.

## 25. Suggested Next.js Structure

```text
app/
├── login/
├── dashboard/
├── expenses/
├── income/
├── lending/
├── transactions/
├── reports/
└── settings/

components/
├── ui/
├── forms/
├── dashboard/
├── expenses/
├── income/
├── lending/
└── reports/

lib/
├── supabase/
├── cloudinary/
├── validations/
└── utils/
```

## 26. MVB Principle

Build the smallest version that feels like a real, polished personal finance app.

Prioritize:
1. Correct data handling
2. Secure authentication and RLS
3. Fast transaction entry
4. Accurate lending/repayment calculations
5. Reusable Money Sources
6. Consistent dates
7. Excellent mobile UX
8. Clean, maintainable Next.js architecture

Avoid adding advanced features until the core experience is reliable.
