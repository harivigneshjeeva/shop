# MR Services Dashboard - COMPLETE

A bulletproof Multi-Shop Profit Intelligence Dashboard built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

**Status:** ✅ PRODUCTION READY

---

## 🎯 Features

### Financial Tracking
- 📊 Daily sales tracking per shop
- 💸 Expense management by category
- 🧾 Weekly payroll processing
- 📈 Real-time profit analytics

### Analytics & Insights
- 🔼 Comparison badges (vs previous periods)
- 📉 Trend charts (Sales, Expenses, Profit)
- 🏆 Best/Worst performing shops
- 💹 Profit margin calculations

### Management
- 🏪 Shop management (Active/Retired)
- 👥 Staff directory with multi-shop assignment
- ⚙️ Application settings
- 📥 CSV export for all data

### User Experience
- ⚠️ Missing data alerts
- 🔍 Global filters (Shop + Date range)
- 📱 Responsive design
- ⚡ Loading states
- ✏️ Full CRUD operations

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd mr-services-dashboard
npm install
```

### 2. Set Up Supabase
1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Go to SQL Editor
4. Copy and run `scripts/schema.sql`
5. Go to Settings > API for credentials
6. **Enable Email Auth:** Authentication → Providers → Enable Email
7. **Create Admin User:** Authentication → Users → Add User

### 3. Configure Environment
Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 4. Seed Sample Data (Optional)
```bash
npm run seed
```

### 5. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📦 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (Strict Mode)
- **Styling:** Tailwind CSS
- **UI Components:** Shadcn/UI
- **Charts:** Recharts
- **Icons:** Lucide React
- **Database:** Supabase (PostgreSQL)
- **Date Handling:** date-fns

---

## 📁 Project Structure

```
mr-services-dashboard/
├── app/
│   ├── dashboard/
│   │   ├── page.tsx              # Dashboard with KPIs & alerts
│   │   ├── sales/page.tsx        # Sales management
│   │   ├── expenses/page.tsx     # Expense tracking
│   │   ├── payroll/page.tsx      # Payroll management
│   │   ├── profit/page.tsx       # Profit analytics
│   │   ├── shops/page.tsx        # Shop management
│   │   ├── staff/page.tsx        # Staff directory
│   │   └── settings/page.tsx     # Settings
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                       # Reusable UI components
│   ├── filters/                  # Filter components
│   ├── forms/                    # Form components
│   ├── charts/                   # Chart components
│   ├── cards/                    # Card components
│   └── layout/                   # Layout components
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Supabase client
│   │   └── queries.ts            # Database queries
│   ├── utils/
│   │   ├── calculations.ts       # Calculations
│   │   ├── formatting.ts         # Formatting
│   │   ├── validation.ts         # Validation
│   │   ├── export.ts             # CSV export
│   │   └── cn.ts                 # Class names
│   ├── types/
│   │   └── database.ts           # TypeScript types
│   └── context/
│       └── FilterContext.tsx     # Global filter state
├── scripts/
│   ├── schema.sql                # Database schema
│   └── seed.ts                   # Seed script
├── README.md
├── PHASE3.md
├── PHASE4.md
└── package.json
```

---

## 🎨 Pages Overview

### Dashboard
- 4 KPI cards with comparison badges
- Missing data alerts
- Sales vs Expenses chart
- Global filters

### Sales
- Add/Edit/Delete sales
- Duplicate prevention (one per shop per day)
- Total sales, cash, card/digital breakdown
- CSV export

### Expenses
- Add/Edit/Delete expenses
- Category-based tracking
- Pie chart breakdown
- CSV export

### Payroll
- Add/Edit/Delete payroll
- Week picker (Monday-Sunday)
- Duplicate prevention (one per shop per week)
- CSV export

### Profit
- Total profit & margin
- Best/Worst performing shops
- 5 charts (Trend, Contribution, By Shop, Margin, Detailed)
- Read-only analytics

### Shops
- Add/Edit shops
- Retire/Reactivate
- Card-based layout
- Status badges

### Staff
- Add/Edit/Delete staff
- Multi-shop assignment
- Active/Inactive status
- Table view

### Settings
- Currency selector
- Date format
- Business settings
- Data management

---

## 🔒 Data Integrity Rules

### Sales
- ✅ ONE entry per shop per day (UNIQUE constraint)
- ✅ Total amount > 0
- ✅ Cash amount ≥ 0 and ≤ Total amount
- ✅ Date cannot be future

### Expenses
- ✅ MULTIPLE entries allowed per shop per day
- ✅ Amount > 0
- ✅ Date cannot be future
- ✅ Category required

### Payroll
- ✅ ONE entry per shop per week (UNIQUE constraint)
- ✅ Amount > 0
- ✅ Week cannot be future
- ✅ Week end > Week start

---

## ⚠️ Alerts System

### Missing Sales Alert
- **When:** After 6 PM daily
- **Checks:** Any active shop without sales for today
- **Action:** Click to navigate to Sales page

### Missing Payroll Alert
- **When:** On Tuesdays
- **Checks:** Any active shop without payroll for last week
- **Action:** Click to navigate to Payroll page

---

## 📊 Comparison Badges

All KPI cards show comparison with previous period:
- 🔼 X% (Green) - Increase
- 🔽 X% (Red) - Decrease
- — (Gray) - No change or no previous data
- New! - First entry

**Logic:**
- Sales/Profit: Green = good, Red = bad
- Expenses: Red = bad (increase), Green = good (decrease)

---

## 🎯 Key Features

### Filters
- **Shop Filter:** All Shops or specific shop
- **Date Filter:** Daily, Weekly, Monthly, Yearly, Custom
- **Custom Range:** Max 2 years, start < end

### Export
- CSV format with headers
- Filename includes date stamp
- Handles special characters
- Disabled when no data

### Loading States
- Skeleton loaders for cards
- Skeleton loaders for tables
- Skeleton loaders for charts
- Smooth transitions

### Validation
- Required fields
- Amount > 0
- Date not future
- Duplicate prevention
- Custom validations

---

## 🧪 Testing Checklist

### Dashboard
- [ ] KPI cards show correct values
- [ ] Comparison badges display
- [ ] Alerts appear when data missing
- [ ] Charts render properly
- [ ] Filters update data

### Sales
- [ ] Can add sale
- [ ] Can edit sale
- [ ] Can delete sale
- [ ] Duplicate shows error
- [ ] Export works
- [ ] Empty state shows

### Expenses
- [ ] Can add expense
- [ ] Can edit expense
- [ ] Can delete expense
- [ ] Pie chart shows
- [ ] Export works
- [ ] Empty state shows

### Payroll
- [ ] Can add payroll
- [ ] Can edit payroll
- [ ] Can delete payroll
- [ ] Week picker works
- [ ] Duplicate shows error
- [ ] Export works

### Profit
- [ ] All charts render
- [ ] Calculations correct
- [ ] Filters work
- [ ] Color coding correct

### Shops
- [ ] Can add shop
- [ ] Can edit shop
- [ ] Can retire/activate
- [ ] Status badges show

### Staff
- [ ] Can add staff
- [ ] Can edit staff
- [ ] Can delete staff
- [ ] Multi-shop assignment works

### Settings
- [ ] Settings save
- [ ] LocalStorage persists

---

## 🚢 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy

### Manual
```bash
npm run build
npm run start
```

---

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run seed` - Seed database

---

## 🐛 Troubleshooting

**Charts not showing?**
- Check if data exists for selected date range
- Try different filters

**Alerts not appearing?**
- Check current time (sales alerts after 6 PM)
- Check current day (payroll alerts on Tuesdays)

**Export not working?**
- Ensure data exists
- Check browser console for errors

**Duplicate error?**
- Sales: One per shop per day
- Payroll: One per shop per week
- Check existing entries

---

## 📚 Documentation

- `README.md` - This file
- `SETUP.md` - Setup instructions
- `PHASE3.md` - Phase 3 features
- `PHASE4.md` - Phase 4 features

---

## 🎉 Complete Feature List

✅ Dashboard with KPIs & alerts
✅ Sales management (Full CRUD)
✅ Expense tracking (Full CRUD)
✅ Payroll management (Full CRUD)
✅ Profit analytics (5 charts)
✅ Shop management (Full CRUD)
✅ Staff management (Full CRUD)
✅ Settings page
✅ Global filters
✅ Comparison badges
✅ Missing data alerts
✅ Custom date range
✅ CSV export
✅ Loading states
✅ Form validation
✅ Duplicate prevention
✅ Empty states
✅ Responsive design
✅ TypeScript strict mode

---

## 📞 Support

For issues:
1. Check documentation
2. Review browser console
3. Verify Supabase connection
4. Check environment variables

---

## 📄 License

Private - All Rights Reserved

---

## 👨‍💻 Built With

- Next.js 14
- TypeScript
- Tailwind CSS
- Supabase
- Recharts
- Lucide React
- date-fns

**Version:** 1.0.0

**Status:** ✅ PRODUCTION READY

---

🎊 **All 4 phases complete! Ready for deployment.**
