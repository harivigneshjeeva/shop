import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { subDays, format, startOfWeek, endOfWeek } from 'date-fns';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('🌱 Starting seed...');

  // 1. Create Shops
  const { data: shops, error: shopsError } = await supabase
    .from('shops')
    .insert([
      { name: 'Downtown Store', city: 'London', status: 'active' },
      { name: 'Westside Branch', city: 'Manchester', status: 'active' },
      { name: 'Old Market Shop', city: 'Birmingham', status: 'retired' }
    ])
    .select();

  if (shopsError) throw shopsError;
  console.log('✅ Shops created');

  // 2. Create Staff
  const { data: staff, error: staffError } = await supabase
    .from('staff')
    .insert([
      { full_name: 'John Smith', phone: '020-1234-5678', status: 'active' },
      { full_name: 'Sarah Johnson', phone: '020-2345-6789', status: 'active' },
      { full_name: 'Mike Williams', phone: '020-3456-7890', status: 'active' },
      { full_name: 'Emma Brown', phone: '020-4567-8901', status: 'active' },
      { full_name: 'David Lee', phone: '020-5678-9012', status: 'active' }
    ])
    .select();

  if (staffError) throw staffError;
  console.log('✅ Staff created');

  // 3. Assign Staff to Shops
  await supabase.from('staff_shops').insert([
    { staff_id: staff[0].id, shop_id: shops[0].id },
    { staff_id: staff[0].id, shop_id: shops[1].id },
    { staff_id: staff[1].id, shop_id: shops[0].id },
    { staff_id: staff[2].id, shop_id: shops[1].id },
    { staff_id: staff[3].id, shop_id: shops[0].id },
    { staff_id: staff[3].id, shop_id: shops[1].id },
    { staff_id: staff[4].id, shop_id: shops[2].id }
  ]);
  console.log('✅ Staff assigned to shops');

  // 4. Create Expense Categories
  const { data: categories, error: categoriesError } = await supabase
    .from('expense_categories')
    .insert([
      { name: 'Rent' },
      { name: 'Utilities' },
      { name: 'Supplies' },
      { name: 'Marketing' },
      { name: 'Repairs' },
      { name: 'Insurance' },
      { name: 'Licenses' },
      { name: 'Cleaning' },
      { name: 'Security' },
      { name: 'Miscellaneous' }
    ])
    .select();

  if (categoriesError) throw categoriesError;
  console.log('✅ Expense categories created');

  // 5. Create Daily Sales (Past 30 days)
  const salesData = [];
  for (let i = 0; i < 30; i++) {
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
    
    // Skip 2 days for Downtown Store (to test alerts)
    if (i !== 0 && i !== 5) {
      const totalAmount = 800 + Math.random() * 1200;
      const cashAmount = totalAmount * (0.3 + Math.random() * 0.4);
      salesData.push({
        shop_id: shops[0].id,
        sale_date: date,
        total_amount: parseFloat(totalAmount.toFixed(2)),
        cash_amount: parseFloat(cashAmount.toFixed(2))
      });
    }

    // Westside Branch - complete data
    if (i !== 0) {
      const totalAmount = 600 + Math.random() * 1000;
      const cashAmount = totalAmount * (0.3 + Math.random() * 0.4);
      salesData.push({
        shop_id: shops[1].id,
        sale_date: date,
        total_amount: parseFloat(totalAmount.toFixed(2)),
        cash_amount: parseFloat(cashAmount.toFixed(2))
      });
    }

    // Old Market Shop (retired) - historical data only
    if (i > 7) {
      const totalAmount = 500 + Math.random() * 800;
      const cashAmount = totalAmount * (0.3 + Math.random() * 0.4);
      salesData.push({
        shop_id: shops[2].id,
        sale_date: date,
        total_amount: parseFloat(totalAmount.toFixed(2)),
        cash_amount: parseFloat(cashAmount.toFixed(2))
      });
    }
  }

  await supabase.from('daily_sales').insert(salesData);
  console.log('✅ Daily sales created');

  // 6. Create Expenses (Past 30 days)
  const expensesData = [];
  for (let i = 0; i < 30; i++) {
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
    
    // Random 2-3 expenses per shop per week
    if (i % 3 === 0) {
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      expensesData.push({
        shop_id: shops[0].id,
        category_id: randomCategory.id,
        expense_date: date,
        amount: parseFloat((50 + Math.random() * 200).toFixed(2))
      });
    }

    if (i % 4 === 0) {
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      expensesData.push({
        shop_id: shops[1].id,
        category_id: randomCategory.id,
        expense_date: date,
        amount: parseFloat((50 + Math.random() * 150).toFixed(2))
      });
    }
  }

  await supabase.from('expenses').insert(expensesData);
  console.log('✅ Expenses created');

  // 7. Create Weekly Payrolls (Past 4 weeks)
  const payrollData = [];
  for (let i = 1; i <= 4; i++) {
    const weekDate = subDays(new Date(), i * 7);
    const weekStart = format(startOfWeek(weekDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const weekEnd = format(endOfWeek(weekDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');

    // Skip week 1 for Downtown Store (to test alerts)
    if (i !== 1) {
      payrollData.push({
        shop_id: shops[0].id,
        week_start: weekStart,
        week_end: weekEnd,
        total_amount: i % 2 === 0 ? 1250.00 : 1200.00
      });
    }

    payrollData.push({
      shop_id: shops[1].id,
      week_start: weekStart,
      week_end: weekEnd,
      total_amount: i % 2 === 0 ? 950.00 : 900.00
    });
  }

  await supabase.from('weekly_payrolls').insert(payrollData);
  console.log('✅ Weekly payrolls created');

  console.log('🎉 Seed completed successfully!');
}

seed().catch(console.error);
