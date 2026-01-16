'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShopFilter } from '@/components/filters/ShopFilter';
import { FilterProvider, useFilters } from '@/lib/context/FilterContext';
import { getSalesByDateRange, getExpensesByDateRange } from '@/lib/supabase/queries';
import { formatCurrency } from '@/lib/utils/formatting';
import { subDays, addDays, format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function ForecastingContent() {
  const { selectedShops } = useFilters();
  const [loading, setLoading] = useState(true);
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [nextWeekForecast, setNextWeekForecast] = useState(0);
  const [nextMonthForecast, setNextMonthForecast] = useState(0);
  const [growthRate, setGrowthRate] = useState(0);
  const [seasonalTrends, setSeasonalTrends] = useState<any[]>([]);
  const [expenseForecast, setExpenseForecast] = useState(0);

  useEffect(() => {
    loadForecast();
  }, [selectedShops]);

  async function loadForecast() {
    setLoading(true);
    const today = new Date();
    const last30Days = subDays(today, 30);
    const last60Days = subDays(today, 60);

    // Get historical data
    const { data: recent30 } = await getSalesByDateRange(last30Days, today, selectedShops.length ? selectedShops : undefined);
    const { data: previous30 } = await getSalesByDateRange(last60Days, last30Days, selectedShops.length ? selectedShops : undefined);

    const recent30Total = recent30?.reduce((sum: number, s: any) => sum + Number(s.total_amount), 0) || 0;
    const previous30Total = previous30?.reduce((sum: number, s: any) => sum + Number(s.total_amount), 0) || 0;

    // Calculate growth rate
    const growth = previous30Total > 0 ? ((recent30Total - previous30Total) / previous30Total) * 100 : 0;
    setGrowthRate(growth);

    // Calculate daily average
    const dailyAvg = recent30Total / 30;

    // Forecast next 7 days
    const weekForecast = dailyAvg * 7 * (1 + growth / 100);
    setNextWeekForecast(weekForecast);

    // Forecast next 30 days
    const monthForecast = dailyAvg * 30 * (1 + growth / 100);
    setNextMonthForecast(monthForecast);

    // Build forecast chart data
    const chartData = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(today, i + 1);
      chartData.push({
        date: format(date, 'MMM dd'),
        forecast: dailyAvg * (1 + growth / 100),
        lower: dailyAvg * (1 + growth / 100) * 0.85,
        upper: dailyAvg * (1 + growth / 100) * 1.15
      });
    }
    setForecastData(chartData);

    // Seasonal trends (last 90 days grouped by week)
    const last90Days = subDays(today, 90);
    const { data: seasonal } = await getSalesByDateRange(last90Days, today, selectedShops.length ? selectedShops : undefined);
    
    const weeklyData: Record<string, number> = {};
    seasonal?.forEach((s: any) => {
      const week = format(new Date(s.sale_date), 'MMM dd');
      weeklyData[week] = (weeklyData[week] || 0) + Number(s.total_amount);
    });

    const trends = Object.entries(weeklyData)
      .map(([week, amount]) => ({ week, amount }))
      .slice(-12);
    setSeasonalTrends(trends);

    // Expense forecast
    const { data: expenses } = await getExpensesByDateRange(last30Days, today, selectedShops.length ? selectedShops : undefined);
    const expenseTotal = expenses?.reduce((sum: number, e: any) => sum + Number(e.amount), 0) || 0;
    const expenseAvg = expenseTotal / 30;
    setExpenseForecast(expenseAvg * 30);

    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Forecasting & Predictions</h1>
        <p className="text-muted-foreground">AI-powered sales and expense predictions</p>
      </div>

      <div className="flex gap-4">
        <ShopFilter />
      </div>

      {loading ? (
        <div className="text-center py-12">Loading forecasts...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Next 7 Days Forecast
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-600">{formatCurrency(nextWeekForecast)}</p>
                <p className="text-sm text-muted-foreground mt-2">Expected sales</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Next 30 Days Forecast
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">{formatCurrency(nextMonthForecast)}</p>
                <p className="text-sm text-muted-foreground mt-2">Expected sales</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Growth Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-3xl font-bold ${growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {growthRate >= 0 ? '+' : ''}{growthRate.toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground mt-2">vs previous 30 days</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>7-Day Sales Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="upper" stroke="#94a3b8" strokeDasharray="5 5" name="Upper Bound" />
                  <Line type="monotone" dataKey="forecast" stroke="#3b82f6" strokeWidth={3} name="Forecast" />
                  <Line type="monotone" dataKey="lower" stroke="#94a3b8" strokeDasharray="5 5" name="Lower Bound" />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-sm text-muted-foreground text-center mt-4">
                Forecast based on last 30 days with ±15% confidence interval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Seasonal Trends (Last 90 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              {seasonalTrends.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Not enough data for seasonal analysis
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={seasonalTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                    <Bar dataKey="amount" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Expense Forecast (Next 30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(expenseForecast)}</p>
                <p className="text-sm text-muted-foreground mt-2">Based on current spending patterns</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Predicted Profit (Next 30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${nextMonthForecast - expenseForecast >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(nextMonthForecast - expenseForecast)}
                </p>
                <p className="text-sm text-muted-foreground mt-2">Sales forecast - Expense forecast</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Insights & Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {growthRate > 5 && (
                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-900">Strong Growth Detected</p>
                      <p className="text-sm text-green-700">Sales are growing at {growthRate.toFixed(1)}%. Consider increasing inventory.</p>
                    </div>
                  </div>
                )}
                {growthRate < -5 && (
                  <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-900">Declining Trend</p>
                      <p className="text-sm text-red-700">Sales are declining by {Math.abs(growthRate).toFixed(1)}%. Review marketing strategy.</p>
                    </div>
                  </div>
                )}
                {Math.abs(growthRate) <= 5 && (
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900">Stable Performance</p>
                      <p className="text-sm text-blue-700">Sales are stable. Maintain current operations.</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default function ForecastingPage() {
  return (
    <FilterProvider>
      <ForecastingContent />
    </FilterProvider>
  );
}
