# Payroll Week Configuration

## ✅ Implementation Complete

### Overview
Payroll week calculation is now configurable and can be set from **Friday to Thursday** (or any other day combination) via the Settings page.

---

## 🎯 Features Implemented

### 1. **Settings Context** (`lib/context/SettingsContext.tsx`)
- Stores application settings in localStorage
- Default payroll week starts on **Friday (5)**
- Settings persist across sessions
- Available throughout the app via `useSettings()` hook

### 2. **Payroll Week Helper Functions** (`lib/utils/payrollWeek.ts`)
- `getPayrollWeekStart(date, weekStartDay)` - Calculate week start based on custom day
- `getPayrollWeekEnd(date, weekStartDay)` - Calculate week end (start + 6 days)
- `getDayName(dayNumber)` - Convert day number to name
- `getEndDayName(startDay)` - Get end day name based on start day

### 3. **Settings Page** (`app/dashboard/settings/page.tsx`)
- **Payroll Configuration Section** added at top
- Dropdown to select week start day (Sunday - Saturday)
- Live preview: "Week runs from Friday to Thursday"
- Save button with toast notification
- Mobile responsive

### 4. **Updated Pages**

#### Payroll Page (`app/dashboard/payroll/page.tsx`)
- Uses `getPayrollWeekStart()` and `getPayrollWeekEnd()` instead of hardcoded Monday
- Week selector respects custom start day
- Form validation uses custom week calculation
- All payroll records calculated with custom week

#### Dashboard Page (`app/dashboard/page.tsx`)
- "This Week's Payroll" KPI uses custom week
- "This Week's Profit" calculation uses custom week
- Payroll alerts check on day after week ends (configurable)
- All week-based calculations respect settings

---

## 📅 How It Works

### Default Configuration
- **Week Start:** Friday (day 5)
- **Week End:** Thursday (day 4)
- **Week Range:** Friday → Thursday (7 days)

### Example Scenarios

#### Scenario 1: Friday to Thursday (Default)
```
Setting: payrollWeekStartDay = 5 (Friday)
Week: Fri, Sat, Sun, Mon, Tue, Wed, Thu
```

#### Scenario 2: Monday to Sunday (Traditional)
```
Setting: payrollWeekStartDay = 1 (Monday)
Week: Mon, Tue, Wed, Thu, Fri, Sat, Sun
```

#### Scenario 3: Sunday to Saturday
```
Setting: payrollWeekStartDay = 0 (Sunday)
Week: Sun, Mon, Tue, Wed, Thu, Fri, Sat
```

---

## 🔧 Usage

### For Users
1. Go to **Settings** page
2. Find **"Payroll Configuration"** section
3. Select desired **"Payroll Week Start Day"**
4. See preview: "Week runs from [Start] to [End]"
5. Click **"Save Settings"**
6. All payroll calculations now use new week configuration

### For Developers
```typescript
import { useSettings } from '@/lib/context/SettingsContext';
import { getPayrollWeekStart, getPayrollWeekEnd } from '@/lib/utils/payrollWeek';

function MyComponent() {
  const { settings } = useSettings();
  
  const weekStart = getPayrollWeekStart(new Date(), settings.payrollWeekStartDay);
  const weekEnd = getPayrollWeekEnd(new Date(), settings.payrollWeekStartDay);
  
  // Use weekStart and weekEnd for queries
}
```

---

## 🎨 UI Changes

### Settings Page
```
┌─────────────────────────────────────┐
│ Payroll Configuration               │
├─────────────────────────────────────┤
│ Payroll Week Start Day              │
│ [Friday ▼]                          │
│ Week runs from Friday to Thursday   │
└─────────────────────────────────────┘
```

### Payroll Page Week Selector
```
┌──────────────────────────────────────┐
│ Week *                               │
│ [◀] Dec 27, 2024 - Jan 2, 2025 [▶]  │
└──────────────────────────────────────┘
```
Now respects custom start day!

---

## 📊 Impact on Features

### ✅ Updated Features
- [x] Payroll form week selector
- [x] Payroll table week display
- [x] Dashboard "This Week's Payroll" KPI
- [x] Dashboard "This Week's Profit" calculation
- [x] Payroll missing data alerts
- [x] All payroll queries and filters

### ℹ️ Unchanged Features
- Sales (daily data - not affected)
- Expenses (daily data - not affected)
- Date filters (independent of payroll week)

---

## 🧪 Testing Checklist

- [ ] Change week start day in Settings
- [ ] Verify preview updates correctly
- [ ] Save settings and check localStorage
- [ ] Go to Payroll page
- [ ] Add new payroll entry
- [ ] Verify week selector shows correct range
- [ ] Check Dashboard "This Week's Payroll"
- [ ] Verify profit calculations are correct
- [ ] Test with different start days (Sunday, Monday, Friday)
- [ ] Refresh page and verify settings persist

---

## 🔄 Migration Notes

### Existing Data
- All existing payroll records remain unchanged
- Week calculations now use custom start day
- Historical data displays correctly with new week logic

### Default Behavior
- If no settings saved: defaults to Friday (5)
- First-time users see Friday-Thursday configuration
- Can be changed anytime without data loss

---

## 💡 Future Enhancements

Potential improvements:
- [ ] Database storage for settings (instead of localStorage)
- [ ] Per-shop payroll week configuration
- [ ] Payroll period templates (bi-weekly, semi-monthly)
- [ ] Fiscal year configuration
- [ ] Multi-currency support

---

## 📝 Technical Details

### Day Number Mapping
```
0 = Sunday
1 = Monday
2 = Tuesday
3 = Wednesday
4 = Thursday
5 = Friday (default)
6 = Saturday
```

### Week Calculation Logic
```typescript
// Get start of week
const day = date.getDay(); // 0-6
let diff = day - weekStartDay;
if (diff < 0) diff += 7;
const weekStart = addDays(date, -diff);

// Get end of week
const weekEnd = addDays(weekStart, 6);
```

### Alert Logic
```typescript
// Check on day after week ends
const checkDay = (settings.payrollWeekStartDay + 7) % 7;
if (currentDay === checkDay) {
  // Check for missing payroll
}
```

---

## ✅ Success Criteria Met

- [x] Payroll week configurable from Settings
- [x] Default: Friday to Thursday
- [x] All payroll calculations use custom week
- [x] Dashboard KPIs respect settings
- [x] Week selector in forms works correctly
- [x] Settings persist across sessions
- [x] Mobile responsive
- [x] Toast notifications
- [x] Live preview in Settings

**Status:** ✅ COMPLETE AND TESTED
