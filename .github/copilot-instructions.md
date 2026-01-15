# MR Services Dashboard - AI Coding Guidelines

## Architecture Overview
This is a Next.js 14 app router dashboard for multi-shop profit tracking using Supabase. Single-tenant design with no permissions - owner has full access.

**Key Components:**
- `app/dashboard/` - Page routes for sales, expenses, payroll, profit, shops, staff, settings
- `components/` - Organized by ui/, filters/, forms/, charts/, cards/, layout/
- `lib/supabase/` - Client setup and typed queries
- `lib/context/` - Global state for filters, settings, toast notifications

## Data Integrity Rules
- **Sales:** One entry per shop per day (UNIQUE constraint)
- **Payroll:** One entry per shop per week (Monday-Sunday, configurable start day)
- **Expenses:** Multiple per shop per day, categorized
- All amounts > 0, dates cannot be future

## Critical Patterns
- Use `FilterProvider` for global shop/date filtering (see `lib/context/FilterContext.tsx`)
- Implement comparison badges with `getComparisonBadge()` from `lib/utils/calculations.ts`
- Handle loading states with skeleton components from `components/ui/skeleton.tsx`
- Prevent duplicates via UI validation + DB constraints
- Export data as CSV using `lib/utils/export.ts`

## Development Workflow
- `npm run dev` - Start development server
- `npm run seed` - Populate sample data (requires `.env.local` with Supabase credentials)
- Database schema in `scripts/schema.sql`, types in `lib/types/database.ts`
- Auth protected via `middleware.ts`, redirects to `/auth/login`

## UI Conventions
- Responsive design with mobile drawer navigation
- KPI cards show green/red comparison arrows (e.g., `🔼 12%` for increases)
- Alerts for missing data (sales after 6 PM, payroll on Tuesdays)
- Form validation prevents invalid entries (see `lib/utils/validation.ts`)

## Query Patterns
- Filter by date range using `gte/lte` on date fields
- Join with shops table for names: `.select('*, shops(name, city)')`
- Shop filtering: `.in('shop_id', shopIds)` if provided
- Example: `getSalesByDateRange(startDate, endDate, selectedShops)` in `lib/supabase/queries.ts`

## Common Pitfalls
- Payroll weeks calculated with `getPayrollWeekStart/End()` from `lib/utils/payrollWeek.ts`
- Ensure `selectedShops` is array of UUIDs, empty means all shops
- Use `date-fns` for date manipulation, format dates as 'yyyy-MM-dd' for DB
- Charts use Recharts with ResponsiveContainer for mobile compatibility