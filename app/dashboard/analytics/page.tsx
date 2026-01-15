'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShopFilter } from '@/components/filters/ShopFilter';
import { DateFilter } from '@/components/filters/DateFilter';
import { FilterProvider, useFilters } from '@/lib/context/FilterContext';
import { getSalesByDateRange, getExpensesByDateRange, getPayrollsByDateRange, getShops, getTargets } from '@/lib/supabase/queries';
import { formatCurrency } from '@/lib/utils/formatting';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { subDays, format, getDay, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

function AnalyticsContent() {
  const { startDate, endDate, selectedShops } = useFilters();
  const [loading, setLoading] = useState(true);
  const [waterfallData, setWaterfallData] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [gaugeData, setGaugeData] = useState({ current: 0, target: 0, percentage: 0 });
  const [sparklineData, setSparklineData] = useState<Record<string, any[]>>({});

  useEffect(() => {
    loadAnalytics();
  }, [startDate, endDate, selectedShops]);

  async function loadAnalytics() {
    setLoading(true);

    // Waterfall Chart Data
    const { data: sales } = await getSalesByDateRange(startDate, endDate, selectedShops.length ? selectedShops : undefined);
    const { data: expenses } = await getExpensesByDateRange(startDate, endDate, selectedShops.length ? selectedShops : undefined);
    const { data: payrolls } = await getPayrollsByDateRange(startDate, endDate, selectedShops.length ? selectedShops : undefined);

    const totalSales = sales?.reduce((sum, s) => sum + Number((s as any).total_amount), 0) || 0;
    const totalExpenses = expenses?.reduce((sum, e) => sum + Number((e as any).amount), 0) || 0;
    const totalPayroll = payrolls?.reduce((sum, p) => sum + Number((p as any).total_amount), 0) || 0;
    const netProfit = totalSales - totalExpenses - totalPayroll;

    setWaterfallData([
      { name: 'Sales', value: totalSales, fill: '#3b82f6' },
      { name: 'Expenses', value: -totalExpenses, fill: '#ef4444' },
      { name: 'Payroll', value: -totalPayroll, fill: '#f59e0b' },
      { name: 'Net Profit', value: netProfit, fill: netProfit >= 0 ? '#22c55e' : '#ef4444' }
    ]);

    // Heatmap Data (Sales by Day of Week)
    const dayMap: Record<number, number> = {};
    sales?.forEach(s => {
      const day = getDay(new Date((s as any).sale_date));
      dayMap[day] = (dayMap[day] || 0) + Number((s as any).total_amount);
    });

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const heatmap = days.map((name, idx) => ({
      day: name,
      amount: dayMap[idx] || 0,
      fill: getHeatColor(dayMap[idx] || 0, Math.max(...Object.values(dayMap)))
    }));
    setHeatmapData(heatmap);

    // Gauge Data (Target Achievement)
    const { data: targets } = await getTargets(selectedShops.length ? selectedShops : undefined);
    if (targets && targets.length > 0) {
      const target = targets[0];
      const targetAmount = Number((target as any).sales_target);
      const percentage = (totalSales / targetAmount) * 100;
      setGaugeData({ current: totalSales, target: targetAmount, percentage });
    }

    // Sparklines (Last 30 days per shop)
    const { data: shops } = await getShops();
    const sparklines: Record<string, any[]> = {};
    const last30 = subDays(new Date(), 30);

    for (const shop of shops || []) {
      const { data: shopSales } = await getSalesByDateRange(last30, new Date(), [shop.id]);
      const dailyData = eachDayOfInterval({ start: last30, end: new Date() }).map(date => {
        const daySales = shopSales?.filter(s => format(new Date((s as any).sale_date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));
        return daySales?.reduce((sum, s) => sum + Number((s as any).total_amount), 0) || 0;
      });
      sparklines[shop.name] = dailyData;
    }
    setSparklineData(sparklines);

    setLoading(false);
  }

  function getHeatColor(value: number, max: number): string {
    const intensity = value / max;
    if (intensity > 0.75) return '#22c55e';
    if (intensity > 0.5) return '#3b82f6';
    if (intensity > 0.25) return '#f59e0b';
    return '#ef4444';
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Advanced Analytics</h1>
        <p className="text-muted-foreground">Visual insights with advanced charts</p>
      </div>

      <div className="flex gap-4">
        <ShopFilter />
        <DateFilter />
      </div>

      {loading ? (
        <div className="text-center py-12">Loading analytics...</div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Profit Waterfall</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={waterfallData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => formatCurrency(Math.abs(value))} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {waterfallData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="text-sm text-muted-foreground text-center mt-4">
                Flow from Sales to Net Profit
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sales Heatmap (By Day of Week)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={heatmapData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                    {heatmapData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#22c55e' }}></div>
                  <span className="text-xs">High</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3b82f6' }}></div>
                  <span className="text-xs">Medium</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f59e0b' }}></div>
                  <span className="text-xs">Low</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Target Achievement Gauge</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8">
                <div className="relative w-64 h-32">
                  <svg viewBox="0 0 200 100" className="w-full h-full">
                    <path
                      d="M 20 80 A 80 80 0 0 1 180 80"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="20"
                    />
                    <path
                      d="M 20 80 A 80 80 0 0 1 180 80"
                      fill="none"
                      stroke={gaugeData.percentage >= 100 ? '#22c55e' : gaugeData.percentage >= 75 ? '#3b82f6' : '#f59e0b'}
                      strokeWidth="20"
                      strokeDasharray={`${(gaugeData.percentage / 100) * 251.2} 251.2`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-3xl font-bold">{gaugeData.percentage.toFixed(0)}%</p>
                    <p className="text-sm text-muted-foreground">of target</p>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-sm text-muted-foreground">Current: {formatCurrency(gaugeData.current)}</p>
                  <p className="text-sm text-muted-foreground">Target: {formatCurrency(gaugeData.target)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shop Performance Sparklines (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(sparklineData).map(([shop, data]) => {
                  const total = data.reduce((sum, val) => sum + val, 0);
                  const avg = total / data.length;
                  const trend = data[data.length - 1] > avg ? 'up' : 'down';
                  
                  return (
                    <div key={shop} className="flex items-center gap-4">
                      <div className="w-32 font-medium truncate">{shop}</div>
                      <div className="flex-1 h-12">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={data.map((val, idx) => ({ value: val }))}>
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke={trend === 'up' ? '#22c55e' : '#ef4444'}
                              strokeWidth={2}
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="w-24 text-right">
                        <p className="font-medium">{formatCurrency(total)}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <FilterProvider>
      <AnalyticsContent />
    </FilterProvider>
  );
}
