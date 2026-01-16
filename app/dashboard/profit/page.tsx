'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShopFilter } from '@/components/filters/ShopFilter';
import { DateFilter } from '@/components/filters/DateFilter';
import { FilterProvider, useFilters } from '@/lib/context/FilterContext';
import { getSalesByDateRange, getExpensesByDateRange, getPayrollsByDateRange, getShops } from '@/lib/supabase/queries';
import { formatCurrency } from '@/lib/utils/formatting';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#22c55e'];

function ProfitContent() {
  const { startDate, endDate, selectedShops } = useFilters();
  const [totalProfit, setTotalProfit] = useState(0);
  const [profitMargin, setProfitMargin] = useState(0);
  const [bestShop, setBestShop] = useState('');
  const [worstShop, setWorstShop] = useState('');
  const [trendData, setTrendData] = useState<any[]>([]);
  const [shopData, setShopData] = useState<any[]>([]);
  const [contributionData, setContributionData] = useState<any[]>([]);
  const [marginData, setMarginData] = useState<any[]>([]);
  const [detailData, setDetailData] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [startDate, endDate, selectedShops]);

  async function loadData() {
    const { data: sales } = await getSalesByDateRange(startDate, endDate, selectedShops.length ? selectedShops : undefined);
    const { data: expenses } = await getExpensesByDateRange(startDate, endDate, selectedShops.length ? selectedShops : undefined);
    const { data: payrolls } = await getPayrollsByDateRange(startDate, endDate, selectedShops.length ? selectedShops : undefined);
    const { data: shops } = await getShops(true);

    const totalSales = sales?.reduce((sum: number, s: any) => sum + Number(s.total_amount), 0) || 0;
    const totalExpenses = expenses?.reduce((sum: number, e: any) => sum + Number(e.amount), 0) || 0;
    const totalPayroll = payrolls?.reduce((sum: number, p: any) => sum + Number(p.total_amount), 0) || 0;
    const profit = totalSales - totalExpenses - totalPayroll;
    
    setTotalProfit(profit);
    setProfitMargin(totalSales > 0 ? (profit / totalSales) * 100 : 0);

    // Contribution breakdown
    setContributionData([
      { name: 'Sales', value: totalSales },
      { name: 'Expenses', value: totalExpenses },
      { name: 'Payroll', value: totalPayroll },
      { name: 'Profit', value: Math.max(0, profit) }
    ]);

    // Profit by shop
    const shopMap = new Map();
    shops?.forEach((shop: any) => {
      const shopSales = sales?.filter((s: any) => s.shop_id === shop.id).reduce((sum: number, s: any) => sum + Number(s.total_amount), 0) || 0;
      const shopExpenses = expenses?.filter((e: any) => e.shop_id === shop.id).reduce((sum: number, e: any) => sum + Number(e.amount), 0) || 0;
      const shopPayroll = payrolls?.filter((p: any) => p.shop_id === shop.id).reduce((sum: number, p: any) => sum + Number(p.total_amount), 0) || 0;
      const shopProfit = shopSales - shopExpenses - shopPayroll;
      const shopMargin = shopSales > 0 ? (shopProfit / shopSales) * 100 : 0;
      
      shopMap.set(shop.name, { profit: shopProfit, sales: shopSales, expenses: shopExpenses, payroll: shopPayroll, margin: shopMargin });
    });

    const shopDataTemp = Array.from(shopMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.profit - a.profit);
    
    setShopData(shopDataTemp);
    setDetailData(shopDataTemp);
    setMarginData(shopDataTemp);
    
    if (shopDataTemp.length > 0) {
      setBestShop(shopDataTemp[0].name);
      setWorstShop(shopDataTemp[shopDataTemp.length - 1].name);
    }

    // Trend data (simplified - daily aggregation)
    const dateMap = new Map();
    sales?.forEach((s: any) => {
      const date = s.sale_date;
      if (!dateMap.has(date)) dateMap.set(date, { sales: 0, expenses: 0, payroll: 0 });
      dateMap.get(date).sales += Number(s.total_amount);
    });
    expenses?.forEach((e: any) => {
      const date = e.expense_date;
      if (!dateMap.has(date)) dateMap.set(date, { sales: 0, expenses: 0, payroll: 0 });
      dateMap.get(date).expenses += Number(e.amount);
    });

    const trendDataTemp = Array.from(dateMap.entries())
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        profit: data.sales - data.expenses
      }))
      .slice(-30);
    
    setTrendData(trendDataTemp);
  }

  return (
    <div className="space-y-6 pt-4 md:pt-6">
      <div>
        <h1 className="text-3xl font-bold">Profit</h1>
        <p className="text-muted-foreground">Analyze profit margins and trends</p>
      </div>

      <div className="flex gap-4">
        <ShopFilter />
        <DateFilter />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalProfit)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{profitMargin.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Best Performing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-green-600">{bestShop || '-'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Worst Performing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-red-600">{worstShop || '-'}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profit Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Line type="monotone" dataKey="profit" stroke="#22c55e" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contribution Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={contributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
                  {contributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profit by Shop</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={shopData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={150} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="profit" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Margin Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={marginData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
              <Bar dataKey="margin" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {detailData.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-4">📈</p>
              <p className="text-lg font-medium mb-2">No Data to Analyze</p>
              <p className="text-muted-foreground">Add sales, expenses, and payroll data to see profit insights.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Shop</th>
                      <th className="text-right p-2">Sales</th>
                      <th className="text-right p-2">Expenses</th>
                      <th className="text-right p-2">Payroll</th>
                      <th className="text-right p-2">Profit</th>
                      <th className="text-right p-2">Margin %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailData.map((row, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="p-2">{row.name}</td>
                        <td className="text-right p-2">{formatCurrency(row.sales)}</td>
                        <td className="text-right p-2">{formatCurrency(row.expenses)}</td>
                        <td className="text-right p-2">{formatCurrency(row.payroll)}</td>
                        <td className={`text-right p-2 font-bold ${row.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(row.profit)}
                        </td>
                        <td className="text-right p-2">{row.margin.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Layout */}
              <div className="lg:hidden space-y-3">
                {detailData.map((row, idx) => (
                  <Card key={idx} className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="font-semibold text-sm">{row.name}</p>
                          <p className={`text-sm font-bold ${row.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(row.profit)} Profit
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Margin</p>
                          <p className="font-medium">{row.margin.toFixed(1)}%</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm border-t pt-2">
                        <div>
                          <p className="text-muted-foreground text-xs">Sales</p>
                          <p className="font-medium">{formatCurrency(row.sales)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Expenses</p>
                          <p className="font-medium">{formatCurrency(row.expenses)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Payroll</p>
                          <p className="font-medium">{formatCurrency(row.payroll)}</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProfitPage() {
  return (
    <FilterProvider>
      <ProfitContent />
    </FilterProvider>
  );
}
