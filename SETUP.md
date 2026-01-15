# Phase 2 Complete - Setup Instructions

## ✅ What's Been Built

### Core Pages
- **Dashboard** - KPI cards with comparison badges, Sales vs Expenses chart
- **Sales** - Add/view/delete sales with duplicate prevention
- **Expenses** - Add/view/delete expenses with category breakdown pie chart
- **Payroll** - Add/view/delete weekly payroll with week picker

### Components
- Sidebar navigation
- Global filters (Shop + Date range)
- KPI cards with comparison badges
- Modal dialogs for forms
- Data tables with actions
- Charts (Bar, Pie)

### Features Implemented
- ✅ Global filter context (shop + date range)
- ✅ Date filter buttons (Daily, Weekly, Monthly, Yearly, Custom)
- ✅ Shop dropdown filter
- ✅ Comparison badges with percentage calculations
- ✅ Form validation with error messages
- ✅ Duplicate prevention for Sales and Payroll
- ✅ Empty states for all tables
- ✅ Real-time data aggregation
- ✅ Responsive layouts

## 🚀 How to Run

### 1. Install Dependencies
```bash
cd mr-services-dashboard
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to SQL Editor in your Supabase dashboard
3. Copy the entire contents of `scripts/schema.sql`
4. Paste and run it in the SQL Editor
5. Go to Settings > API to get your credentials

### 3. Configure Environment

Edit `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Seed Sample Data (Optional)

```bash
npm run seed
```

This creates:
- 3 shops (2 active, 1 retired)
- 5 staff members
- 10 expense categories
- 30 days of sales data
- Random expenses
- 4 weeks of payroll

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📋 Testing Checklist

### Dashboard
- [ ] KPI cards show correct values
- [ ] Comparison badges display with correct colors
- [ ] Sales vs Expenses chart renders
- [ ] Filters update all data instantly

### Sales Page
- [ ] Can add new sale
- [ ] Duplicate sale shows error message
- [ ] Can delete sale
- [ ] Total sales calculates correctly
- [ ] Cash vs Card/Digital splits correctly
- [ ] Empty state shows when no data

### Expenses Page
- [ ] Can add new expense
- [ ] Can delete expense
- [ ] Pie chart shows category breakdown
- [ ] Total expenses calculates correctly
- [ ] Empty state shows when no data

### Payroll Page
- [ ] Week picker navigates correctly
- [ ] Can add new payroll
- [ ] Duplicate payroll shows error message
- [ ] Can delete payroll
- [ ] Week range displays correctly (Mon-Sun)
- [ ] Empty state shows when no data

### Filters
- [ ] Shop filter changes data across all pages
- [ ] Date filter buttons work (Daily, Weekly, Monthly, Yearly)
- [ ] All Shops option shows all data
- [ ] Specific shop shows only that shop's data

## 🐛 Known Issues / Limitations

1. **Custom date range** - Button exists but functionality not yet implemented
2. **Loading states** - No loading skeletons yet (Phase 4)
3. **Alerts** - Missing data alerts not yet implemented
4. **Edit functionality** - Only delete available, edit coming in Phase 3
5. **Profit calculations** - Profit page is placeholder (Phase 3)

## 📦 What's Next - Phase 3

- Profit analytics page with all charts
- Shops management (CRUD)
- Staff management (CRUD)
- Settings page
- Edit functionality for all records
- Missing data alerts
- Custom date range picker
- More chart types

## 💡 Tips

- Use the seed script to populate test data
- Check browser console for any errors
- Ensure Supabase credentials are correct
- All amounts must be > 0 (validation enforced)
- Dates cannot be in the future (validation enforced)
- Sales: ONE per shop per day (UNIQUE constraint)
- Payroll: ONE per shop per week (UNIQUE constraint)
- Expenses: MULTIPLE allowed per shop per day

## 🔧 Troubleshooting

**Error: "Cannot find module"**
- Run `npm install` again

**Error: "Invalid Supabase credentials"**
- Check `.env.local` has correct URL and key
- Restart dev server after changing .env

**Error: "relation does not exist"**
- Run the schema.sql in Supabase SQL Editor
- Ensure all tables are created

**Charts not showing**
- Check if data exists for the selected date range
- Try changing filters to see more data

**Duplicate error not showing**
- Check Supabase has UNIQUE constraints on tables
- Verify schema.sql was run completely
