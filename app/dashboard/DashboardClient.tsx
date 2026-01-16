'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, TrendingDown, DollarSign, Receipt, Wallet, PiggyBank } from 'lucide-react';
import { KPICard } from '@/components/cards/KPICard';
import { AlertCard } from '@/components/cards/AlertCard';
import { ShopFilter } from '@/components/filters/ShopFilter';
import { DateFilter } from '@/components/filters/DateFilter';
import { MobileFilterDrawer } from '@/components/filters/MobileFilterDrawer';
import { FilterProvider, useFilters } from '@/lib/context/FilterContext';
import { useSettings } from '@/lib/context/SettingsContext';
import { getSalesByDateRange, getExpensesByDateRange, getPayrollsByDateRange, getShops } from '@/lib/supabase/queries';
import { getComparisonBadge, calculatePercentageChange } from '@/lib/utils/calculations';
import { getPayrollWeekStart, getPayrollWeekEnd } from '@/lib/utils/payrollWeek';
import { subDays, format, getDay, addDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CardSkeleton, ChartSkeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { formatCurrency } from '@/lib/utils/formatting';

function DashboardContent() {
  const router = useRouter();
  const { startDate, endDate, selectedShops } = useFilters();
  const { settings } = useSettings();
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [todaySales, setTodaySales] = useState(0);
  const [yesterdaySales, setYesterdaySales] = useState(0);
  const [todayExpenses, setTodayExpenses] = useState(0);
  const [yesterdayExpenses, setYesterdayExpenses] = useState(0);
  const [weekPayroll, setWeekPayroll] = useState(0);
  const [weekProfit, setWeekProfit] = useState(0);
  const [lastWeekProfit, setLastWeekProfit] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);
  const [profitByShopData, setProfitByShopData] = useState<any[]>([]);
  const [shopSummaryData, setShopSummaryData] = useState<any[]>([]);
  const [topSellingDay, setTopSellingDay] = useState({ day: '', amount: 0 });
  const [expenseTrends, setExpenseTrends] = useState<any[]>([]);
  const [cashVsDigital, setCashVsDigital] = useState({ cash: 0, digital: 0 });

  useEffect(() => {
    loadData();
  }, [startDate, endDate, selectedShops]);

  async function loadData() {
    setLoading(true);
    const today = new Date();
    const yesterday = subDays(today, 1);
    const weekStart = getPayrollWeekStart(today, settings.payrollWeekStartDay);
    const weekEnd = getPayrollWeekEnd(today, settings.payrollWeekStartDay);
    const lastWeekStart = getPayrollWeekStart(subDays(today, 7), settings.payrollWeekStartDay);
    const lastWeekEnd = getPayrollWeekEnd(subDays(today, 7), settings.payrollWeekStartDay);

    // Check for missing data alerts
    await checkAlerts();

    // Today's sales
    const { data: todaySalesData } = await getSalesByDateRange(today, today, selectedShops.length ? selectedShops : undefined);
    const todayTotal = todaySalesData?.reduce((sum: number, s: any) => sum + Number(s.total_amount), 0) || 0;
    setTodaySales(todayTotal);

    // Yesterday's sales
    const { data: yesterdaySalesData } = await getSalesByDateRange(yesterday, yesterday, selectedShops.length ? selectedShops : undefined);
    const yesterdayTotal = yesterdaySalesData?.reduce((sum: number, s: any) => sum + Number(s.total_amount), 0) || 0;
    setYesterdaySales(yesterdayTotal);

    // Today's expenses
    const { data: todayExpensesData } = await getExpensesByDateRange(today, today, selectedShops.length ? selectedShops : undefined);
    const todayExpTotal = todayExpensesData?.reduce((sum: number, e: any) => sum + Number(e.amount), 0) || 0;
    setTodayExpenses(todayExpTotal);

    // Yesterday's expenses
    const { data: yesterdayExpensesData } = await getExpensesByDateRange(yesterday, yesterday, selectedShops.length ? selectedShops : undefined);
    const yesterdayExpTotal = yesterdayExpensesData?.reduce((sum: number, e: any) => sum + Number(e.amount), 0) || 0;
    setYesterdayExpenses(yesterdayExpTotal);

    // This week's payroll
    const { data: weekPayrollData } = await getPayrollsByDateRange(weekStart, weekEnd, selectedShops.length ? selectedShops : undefined);
    const weekPayrollTotal = weekPayrollData?.reduce((sum: number, p: any) => sum + Number(p.total_amount), 0) || 0;
    setWeekPayroll(weekPayrollTotal);

    // This week's profit
    const { data: weekSalesData } = await getSalesByDateRange(weekStart, weekEnd, selectedShops.length ? selectedShops : undefined);
    const weekSalesTotal = weekSalesData?.reduce((sum: number, s: any) => sum + Number(s.total_amount), 0) || 0;
    const { data: weekExpensesData } = await getExpensesByDateRange(weekStart, weekEnd, selectedShops.length ? selectedShops : undefined);
    const weekExpensesTotal = weekExpensesData?.reduce((sum: number, e: any) => sum + Number(e.amount), 0) || 0;
    const weekProfitTotal = weekSalesTotal - weekExpensesTotal - weekPayrollTotal;
    setWeekProfit(weekProfitTotal);

    // Last week's profit
    const { data: lastWeekSalesData } = await getSalesByDateRange(lastWeekStart, lastWeekEnd, selectedShops.length ? selectedShops : undefined);
    const lastWeekSalesTotal = lastWeekSalesData?.reduce((sum: number, s: any) => sum + Number(s.total_amount), 0) || 0;
    const { data: lastWeekExpensesData } = await getExpensesByDateRange(lastWeekStart, lastWeekEnd, selectedShops.length ? selectedShops : undefined);
    const lastWeekExpensesTotal = lastWeekExpensesData?.reduce((sum: number, e: any) => sum + Number(e.amount), 0) || 0;
    const { data: lastWeekPayrollData } = await getPayrollsByDateRange(lastWeekStart, lastWeekEnd, selectedShops.length ? selectedShops : undefined);
    const lastWeekPayrollTotal = lastWeekPayrollData?.reduce((sum: number, p: any) => sum + Number(p.total_amount), 0) || 0;
    const lastWeekProfitTotal = lastWeekSalesTotal - lastWeekExpensesTotal - lastWeekPayrollTotal;
    setLastWeekProfit(lastWeekProfitTotal);

    // Chart data (last 7 days)
    const chartDataTemp = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const { data: daySales } = await getSalesByDateRange(date, date, selectedShops.length ? selectedShops : undefined);
      const { data: dayExpenses } = await getExpensesByDateRange(date, date, selectedShops.length ? selectedShops : undefined);
      chartDataTemp.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        Sales: daySales?.reduce((sum: number, s: any) => sum + Number(s.total_amount), 0) || 0,
        Expenses: dayExpenses?.reduce((sum: number, e: any) => sum + Number(e.amount), 0) || 0,
      });
    }
    setChartData(chartDataTemp);

    // Profit by shop chart
    await loadProfitByShop();
    
    // Top selling day
    const dayTotals = chartDataTemp.map(d => ({ day: d.date, amount: d.Sales }));
    const topDay = dayTotals.reduce((max, d) => d.amount > max.amount ? d : max, { day: '', amount: 0 });
    setTopSellingDay(topDay);
    
    // Expense trends by category
    const { data: allExpenses } = await getExpensesByDateRange(subDays(today, 30), today, selectedShops.length ? selectedShops : undefined);
    const categoryMap = new Map();
    allExpenses?.forEach((e: any) => {
      const cat = e.expense_categories?.name || 'Other';
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + Number(e.amount));
    });
    const trends = Array.from(categoryMap.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
    setExpenseTrends(trends);
    
    // Cash vs Digital
    const { data: recentSales } = await getSalesByDateRange(subDays(today, 7), today, selectedShops.length ? selectedShops : undefined);
    const totalCash = recentSales?.reduce((sum: number, s: any) => sum + Number(s.cash_amount), 0) || 0;
    const totalSales = recentSales?.reduce((sum: number, s: any) => sum + Number(s.total_amount), 0) || 0;
    setCashVsDigital({ cash: totalCash, digital: totalSales - totalCash });
    
    setLoading(false);
  }

  async function loadProfitByShop() {
    const { data: shops } = await getShops();
    const shopFilter = selectedShops.length ? selectedShops : undefined;
    const filteredShops = shopFilter ? shops?.filter(s => shopFilter.includes(s.id)) : shops;

    const profitData = [];
    for (const shop of filteredShops || []) {
      const { data: sales } = await getSalesByDateRange(startDate, endDate, [shop.id]);
      const { data: expenses } = await getExpensesByDateRange(startDate, endDate, [shop.id]);
      const { data: payrolls } = await getPayrollsByDateRange(startDate, endDate, [shop.id]);

      const totalSales = sales?.reduce((sum: number, s: any) => sum + Number(s.total_amount), 0) || 0;
      const totalExpenses = expenses?.reduce((sum: number, e: any) => sum + Number(e.amount), 0) || 0;
      const totalPayroll = payrolls?.reduce((sum: number, p: any) => sum + Number(p.total_amount), 0) || 0;
      const profit = totalSales - totalExpenses - totalPayroll;

      profitData.push({
        shop: shop.name,
        sales: totalSales,
        expenses: totalExpenses,
        payroll: totalPayroll,
        amount: Math.abs(profit),
        actualProfit: profit,
        fill: profit >= 0 ? '#22c55e' : '#ef4444'
      });
    }

    profitData.sort((a, b) => b.actualProfit - a.actualProfit);
    setProfitByShopData(profitData);

    // Shop summary table with trend
    setShopSummaryData(profitData.map(p => ({
      shop: p.shop,
      sales: p.sales,
      expenses: p.expenses,
      payroll: p.payroll,
      profit: p.actualProfit,
      trend: p.actualProfit >= 0 ? 'up' : 'down'
    })));
  }

  async function checkAlerts() {
    const currentHour = new Date().getHours();
    const currentDay = getDay(new Date());
    const alertsList: any[] = [];

    // Check missing sales (after 6 PM)
    if (currentHour >= 18) {
      const { data: shops } = await getShops();
      const today = new Date();
      const { data: todaySales } = await getSalesByDateRange(today, today);
      
      shops?.forEach((shop: any) => {
        const hasSale = todaySales?.some((s: any) => s.shop_id === shop.id);
        if (!hasSale) {
          alertsList.push({
            type: 'sales',
            shopName: shop.name,
            message: `No sales recorded for today`,
            onClick: () => router.push('/dashboard/sales')
          });
        }
      });
    }

    // Check missing payroll (check day after week end)
    const checkDay = (settings.payrollWeekStartDay + 7) % 7; // Day after week ends
    if (currentDay === checkDay) {
      const { data: shops } = await getShops();
      const lastWeekStart = getPayrollWeekStart(subDays(new Date(), 7), settings.payrollWeekStartDay);
      const lastWeekEnd = getPayrollWeekEnd(subDays(new Date(), 7), settings.payrollWeekStartDay);
      const { data: payrolls } = await getPayrollsByDateRange(lastWeekStart, lastWeekEnd);
      
      shops?.forEach((shop: any) => {
        const hasPayroll = payrolls?.some((p: any) => p.shop_id === shop.id);
        if (!hasPayroll) {
          alertsList.push({
            type: 'payroll',
            shopName: shop.name,
            message: `Payroll missing for week ${format(lastWeekStart, 'MMM d')} - ${format(lastWeekEnd, 'MMM d')}`,
            onClick: () => router.push('/dashboard/payroll')
          });
        }
      });
    }

    setAlerts(alertsList);
  }

  const salesBadge = getComparisonBadge(todaySales, yesterdaySales);
  const expensesBadge = getComparisonBadge(todayExpenses, yesterdayExpenses);
  const profitBadge = getComparisonBadge(weekProfit, lastWeekProfit);

  const salesChange = calculatePercentageChange(todaySales, yesterdaySales);
  const expensesChange = calculatePercentageChange(todayExpenses, yesterdayExpenses);
  const profitChange = calculatePercentageChange(weekProfit, lastWeekProfit);

  return (
    <div className="space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Dashboard</h1>
        <p className="text-sm lg:text-base text-muted-foreground">Welcome to MR Services Dashboard</p>
      </div>

      <MobileFilterDrawer />
      <div className="hidden lg:flex gap-4">
        <ShopFilter />
        <DateFilter />
      </div>

      {loading ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6">
          <KPICard
            title="Today's Sales"
            value={todaySales}
            icon={DollarSign}
            badge={salesBadge}
            badgeColor={salesChange > 0 ? 'green' : salesChange < 0 ? 'red' : 'gray'}
          />
          <KPICard
            title="Today's Expenses"
            value={todayExpenses}
            icon={Receipt}
            badge={expensesBadge}
            badgeColor={expensesChange > 0 ? 'red' : expensesChange < 0 ? 'green' : 'gray'}
          />
          <KPICard
            title="This Week's Payroll"
            value={weekPayroll}
            icon={Wallet}
          />
          <KPICard
            title="This Week's Profit"
            value={weekProfit}
            icon={PiggyBank}
            badge={profitBadge}
            badgeColor={profitChange > 0 ? 'green' : profitChange < 0 ? 'red' : weekProfit < 0 ? 'orange' : 'gray'}
          />
        </div>
      )}

      <AlertCard alerts={alerts} />

      {loading ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Sales vs Expenses (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartSkeleton />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Profit by Shop</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartSkeleton />
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Sales vs Expenses (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Sales" fill="#3b82f6" />
                  <Bar dataKey="Expenses" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Profit by Shop</CardTitle>
            </CardHeader>
            <CardContent>
              {profitByShopData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No data available for selected filters
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={profitByShopData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="shop" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        formatter={(value: any, name: string, props: any) => {
                          const actualValue = props.payload.actualProfit;
                          return [`£${actualValue.toFixed(2)}`, actualValue >= 0 ? 'Profit' : 'Loss'];
                        }}
                      />
                      <Bar dataKey="amount" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-6 mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: '#22c55e' }}></div>
                      <span className="text-sm text-muted-foreground">Profit</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ef4444' }}></div>
                      <span className="text-sm text-muted-foreground">Loss</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4 lg:gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Top Selling Day</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold">{topSellingDay.day || '-'}</p>
                <p className="text-sm text-muted-foreground">{topSellingDay.amount > 0 ? formatCurrency(topSellingDay.amount) : 'No data'}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Cash vs Digital (7d)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Cash</span>
                    <span className="font-medium">{formatCurrency(cashVsDigital.cash)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Digital</span>
                    <span className="font-medium">{formatCurrency(cashVsDigital.digital)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Top Expense Category</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold">{expenseTrends[0]?.name || '-'}</p>
                <p className="text-sm text-muted-foreground">{expenseTrends[0] ? formatCurrency(expenseTrends[0].amount) : 'No data'}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Expense Category Trends (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              {expenseTrends.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No expense data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={expenseTrends} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                    <Bar dataKey="amount" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shop Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {shopSummaryData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No data available for selected filters
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px]">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">Shop</th>
                        <th className="text-right p-3 font-medium">Sales</th>
                        <th className="text-right p-3 font-medium">Expenses</th>
                        <th className="text-right p-3 font-medium">Payroll</th>
                        <th className="text-right p-3 font-medium">Profit</th>
                        <th className="text-center p-3 font-medium">Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shopSummaryData.map((row, idx) => (
                        <tr key={idx} className="border-b hover:bg-muted/50">
                          <td className="p-3 font-medium">{row.shop}</td>
                          <td className="text-right p-3">£{row.sales.toFixed(2)}</td>
                          <td className="text-right p-3">£{row.expenses.toFixed(2)}</td>
                          <td className="text-right p-3">£{row.payroll.toFixed(2)}</td>
                          <td className={`text-right p-3 font-medium ${row.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            £{row.profit.toFixed(2)}
                          </td>
                          <td className="text-center p-3">
                            {row.trend === 'up' ? (
                              <TrendingUp className="h-5 w-5 text-green-600 inline" />
                            ) : (
                              <TrendingDown className="h-5 w-5 text-red-600 inline" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <FilterProvider>
      <DashboardContent />
    </FilterProvider>
  );
}
