# AI Agent Guidelines (AGENTS.md)

This document provides a architectural map, design system blueprint, and coding patterns for any AI developer agents working on this Money Manager PWA codebase.

---

## 1. Core Architecture & Stack

- **Framework**: React 19 + Vite + JS (ESModules).
- **Router**: `HashRouter` (from `react-router-dom`) is utilized so that the client-side router handles URLs properly without triggering backend redirects in an offline PWA sandbox environment.
- **Offline Persistence**: IndexedDB via the lightweight `idb` promise-based wrapper. No backend dependencies.
- **Data Visualization**: `recharts` for monthly spending bar and donut breakdowns.
- **Date Manipulation**: `date-fns` for lightweight date ranges and groupings.
- **Design Tokens**: Standard CSS variables located in [src/index.css](file:///d:/GitHub/Money-Manager/src/index.css). No utility CSS frameworks (Tailwind) are used.

---

## 2. "Claude Design" Aesthetic Rules

To maintain the calm, warm, and humanist interface of the application, adhere to these guidelines:
1. **Background**: Use warm cream/off-white (`#FAF8F5` or `#F0ECE6`) rather than sterile pure white (`#FFF`) or cold grays.
2. **Accents**: Earthy tones:
   - Terracotta / Clay Orange: `#C4785B` (main accent, buttons, expenses)
   - Sage Green: `#7BA07E` (income, success indicator)
   - Muted Slate/Beige: `#5C574F`, `#9B958C`
3. **Radius**: Generous rounded borders (`--radius-md: 12px`, `--radius-lg: 16px`, `--radius-xl: 20px`).
4. **Shadows**: Subtle, low-contrast shadows (`rgba(45, 42, 38, 0.04)`) to avoid fintech-corporate clutter.
5. **Mobile-First**: Interactive inputs must target bottom-sheet modals with large tap targets (minimum 44x44px for buttons).

---

## 3. Database Schema Blueprint (`src/db/database.js`)

IndexedDB uses database version `1` with three primary object stores:

```javascript
// 1. transactions
{
  id: Number (AutoIncrement),
  amount: Number,
  type: 'income' | 'expense',
  category: String (e.g. 'food', 'bills', 'salary'),
  note: String,
  date: String (YYYY-MM-DD),
  monthKey: String (YYYY-MM),  // Index for fast monthly filtering
  dateKey: String (YYYY-MM-DD),
  createdAt: Number (timestamp)
}

// 2. subscriptions
{
  id: Number (AutoIncrement),
  name: String,
  amount: Number,
  cycle: 'monthly' | 'yearly',
  dueDay: Number (1-31),
  category: String (e.g. 'streaming', 'fitness'),
  createdAt: Number (timestamp)
}

// 3. subscriptionPayments
{
  id: Number (AutoIncrement),
  subscriptionId: Number,
  monthKey: String (YYYY-MM), // Unique tracking month (resets paid/unpaid monthly)
  paidAt: Number (timestamp)
}
```

---

## 4. Coding Patterns & Custom Hooks

### A. Transactions Tracking (`src/db/useTransactions.js`)
This hook exposes:
- CRUD actions: `addTransaction`, `updateTransaction`, `deleteTransaction`
- Calculations: `summary` (`totalIncome`, `totalExpense`, `net`), `groupedByDate` (grouped list display), `categoryBreakdown`, and `dailyTotals` (formatted for Recharts).
- When a transaction's date changes, `monthKey` and `dateKey` are automatically re-calculated from `data.date`.

### B. Subscriptions Tracking (`src/db/useSubscriptions.js`)
This hook merges the static subscription information from the `subscriptions` store with the current month's payment ledger (`subscriptionPayments` store):
- The computed `isPaid` state for any subscription is calculated using:
  ```javascript
  const subscriptionsWithStatus = subscriptions.map(sub => ({
    ...sub,
    isPaid: payments.some(p => p.subscriptionId === sub.id)
  }))
  ```
- Triggering `togglePaid(subId)` checks if a payment entry exists for the current `monthKey`. If it does, it deletes it (marking unpaid); otherwise, it adds a new payment entry.

---

## 5. Adding New Features (Design Guidelines)

### Feature Extension: Budgets
To add budget limits:
1. Create a `budgets` object store in IndexedDB (`category`, `limitAmount`, `monthKey`).
2. Add a `useBudgets` hook calculating `spent` from `useTransactions` categories versus the set limits.
3. Keep the visual clean; use simple progress bars matching the progress indicator styling in `Subscriptions.css`.

### Feature Extension: Export to CSV
1. Use `useTransactions` to get all entries for the active month.
2. Format array of items: `"Date","Type","Category","Note","Amount"`.
3. Create a download payload using a Blob URL `new Blob([csvContent], { type: 'text/csv' })` triggered via a button in the bottom sheets or main settings.

### Feature Extension: Multi-currency
1. Modify `src/utils/currency.js` to allow currency settings overrides.
2. Store the chosen currency config in `localStorage`.
3. Read current currency dynamically in `AmountDisplay.jsx`.

### Feature Extension: Cloud Sync
1. Use a sync state queue or timestamp comparisons (e.g., `updatedAt` / `deletedAt`).
2. Push local database changes asynchronously when network state turns online (`window.addEventListener('online')`), preserving offline-first interactions.

---

## 6. Versioning & Changelog

### A. Version Constant (`src/utils/version.js`)
The app version is defined in `APP_VERSION` (e.g. `'1.0.0'`) and displayed as `v1.0.0` in the bottom nav bar.

### B. Changelog Entries
When adding or updating a feature, you MUST:
1. Increment the `APP_VERSION` in `src/utils/version.js` following [semver](https://semver.org/) (major.minor.patch).
2. Add a new entry to the `CHANGELOG` array in the same file with the new version, today's date, and a list of changes.
3. Update `package.json` version to match `APP_VERSION`.

### C. Changelog Display
The changelog is shown automatically on first app open after a version update. It uses a bottom sheet (`BottomSheet` + `ChangelogSheet` component) triggered by comparing the current `APP_VERSION` with the last seen version stored in `localStorage` under key `money-manager-version`.

Example of adding a changelog entry:
```javascript
export const CHANGELOG = [
  {
    version: '1.1.0',
    date: '2026-07-01',
    changes: [
      'Added budget tracking with monthly limits',
      'Export transactions to CSV',
    ],
  },
  // ... previous entries
]
```
