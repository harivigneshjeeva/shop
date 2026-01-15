'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, TrendingUp, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getSalesByDateRange, getExpensesByDateRange, getPayrollsByDateRange, getShops } from '@/lib/supabase/queries';
import { subDays, format, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns';

export default function DataQualityPage() {
  const [loading, setLoading] = useState(true);
  const [qualityScore, setQualityScore] = useState(0);
  const [completeness, setCompleteness] = useState({ sales: 0, expenses: 0, payroll: 0 });
  const [missingData, setMissingData] = useState<any[]>([]);
  const [inconsistencies, setInconsistencies] = useState<any[]>([]);
  const [dataStats, setDataStats] = useState({ totalRecords: 0, lastUpdated: '', activeShops: 0 });

  useEffect(() => {
    analyzeDataQuality();
  }, []);

  async function analyzeDataQuality() {
    setLoading(true);
    const today = new Date();
    const last30Days = subDays(today, 30);

    const { data: shops } = await getShops();
    const activeShops = shops?.filter(s => s.status === 'active') || [];

    const { data: sales } = await getSalesByDateRange(last30Days, today);
    const { data: expenses } = await getExpensesByDateRange(last30Days, today);
    const { data: payrolls } = await getPayrollsByDateRange(last30Days, today);

    // Calculate completeness
    const expectedDays = 30;
    const expectedWeeks = 4;
    const salesCompleteness = ((sales?.length || 0) / (activeShops.length * expectedDays)) * 100;
    const expensesCompleteness = Math.min(((expenses?.length || 0) / (activeShops.length * expectedDays * 0.5)) * 100, 100);
    const payrollCompleteness = ((payrolls?.length || 0) / (activeShops.length * expectedWeeks)) * 100;

    setCompleteness({
      sales: Math.min(salesCompleteness, 100),
      expenses: Math.min(expensesCompleteness, 100),
      payroll: Math.min(payrollCompleteness, 100)
    });

    // Overall quality score
    const avgCompleteness = (salesCompleteness + expensesCompleteness + payrollCompleteness) / 3;
    setQualityScore(Math.min(avgCompleteness, 100));

    // Find missing data
    const missing: any[] = [];
    const days = eachDayOfInterval({ start: last30Days, end: today });

    for (const shop of activeShops) {
      // Missing sales
      const shopSales = sales?.filter(s => s.shop_id === shop.id) || [];
      const missingSalesDays = days.filter(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        return !shopSales.some(s => s.sale_date === dateStr);
      });

      if (missingSalesDays.length > 5) {
        missing.push({
          type: 'sales',
          shop: shop.name,
          message: `Missing ${missingSalesDays.length} days of sales data`,
          severity: 'high'
        });
      }

      // Missing payroll
      const shopPayrolls = payrolls?.filter(p => p.shop_id === shop.id) || [];
      if (shopPayrolls.length < 3) {
        missing.push({
          type: 'payroll',
          shop: shop.name,
          message: `Only ${shopPayrolls.length} payroll entries in last 30 days`,
          severity: 'medium'
        });
      }
    }

    setMissingData(missing);

    // Find inconsistencies
    const issues: any[] = [];

    for (const sale of sales || []) {
      // Check for zero sales
      if (Number(sale.total_amount) === 0) {
        issues.push({
          type: 'Zero Sales',
          shop: sale.shops?.name,
          date: sale.sale_date,
          message: 'Sales amount is zero',
          severity: 'low'
        });
      }

      // Check cash > total
      if (Number(sale.cash_amount) > Number(sale.total_amount)) {
        issues.push({
          type: 'Invalid Cash',
          shop: sale.shops?.name,
          date: sale.sale_date,
          message: 'Cash amount exceeds total sales',
          severity: 'high'
        });
      }
    }

    // Check for duplicate dates
    const salesByShopDate = new Map();
    for (const sale of sales || []) {
      const key = `${sale.shop_id}-${sale.sale_date}`;
      if (salesByShopDate.has(key)) {
        issues.push({
          type: 'Duplicate',
          shop: sale.shops?.name,
          date: sale.sale_date,
          message: 'Duplicate sales entry detected',
          severity: 'high'
        });
      }
      salesByShopDate.set(key, true);
    }

    setInconsistencies(issues);

    // Data stats
    setDataStats({
      totalRecords: (sales?.length || 0) + (expenses?.length || 0) + (payrolls?.length || 0),
      lastUpdated: format(today, 'MMM dd, yyyy'),
      activeShops: activeShops.length
    });

    setLoading(false);
  }

  function getScoreColor(score: number): string {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  }

  function getScoreIcon(score: number) {
    if (score >= 80) return <CheckCircle className="h-8 w-8 text-green-600" />;
    if (score >= 60) return <AlertTriangle className="h-8 w-8 text-orange-600" />;
    return <XCircle className="h-8 w-8 text-red-600" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Data Quality Dashboard</h1>
        <p className="text-muted-foreground">Monitor data completeness and consistency</p>
      </div>

      {loading ? (
        <div className="text-center py-12">Analyzing data quality...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Overall Quality Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  {getScoreIcon(qualityScore)}
                  <div>
                    <p className={`text-3xl font-bold ${getScoreColor(qualityScore)}`}>
                      {qualityScore.toFixed(0)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {qualityScore >= 80 ? 'Excellent' : qualityScore >= 60 ? 'Good' : 'Needs Improvement'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Records</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Database className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-3xl font-bold">{dataStats.totalRecords}</p>
                    <p className="text-xs text-muted-foreground">Last 30 days</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Missing Data Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-3xl font-bold">{missingData.length}</p>
                    <p className="text-xs text-muted-foreground">Gaps detected</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Inconsistencies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <XCircle className="h-8 w-8 text-red-600" />
                  <div>
                    <p className="text-3xl font-bold">{inconsistencies.length}</p>
                    <p className="text-xs text-muted-foreground">Issues found</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Data Completeness by Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Sales Data</span>
                    <span className={`text-sm font-bold ${getScoreColor(completeness.sales)}`}>
                      {completeness.sales.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${completeness.sales >= 80 ? 'bg-green-600' : completeness.sales >= 60 ? 'bg-orange-600' : 'bg-red-600'}`}
                      style={{ width: `${completeness.sales}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Expense Data</span>
                    <span className={`text-sm font-bold ${getScoreColor(completeness.expenses)}`}>
                      {completeness.expenses.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${completeness.expenses >= 80 ? 'bg-green-600' : completeness.expenses >= 60 ? 'bg-orange-600' : 'bg-red-600'}`}
                      style={{ width: `${completeness.expenses}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Payroll Data</span>
                    <span className={`text-sm font-bold ${getScoreColor(completeness.payroll)}`}>
                      {completeness.payroll.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${completeness.payroll >= 80 ? 'bg-green-600' : completeness.payroll >= 60 ? 'bg-orange-600' : 'bg-red-600'}`}
                      style={{ width: `${completeness.payroll}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Missing Data Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              {missingData.length === 0 ? (
                <div className="text-center py-8 text-green-600">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2" />
                  <p className="font-medium">No missing data detected!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {missingData.map((item, idx) => (
                    <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg ${item.severity === 'high' ? 'bg-red-50' : 'bg-orange-50'}`}>
                      <AlertTriangle className={`h-5 w-5 mt-0.5 ${item.severity === 'high' ? 'text-red-600' : 'text-orange-600'}`} />
                      <div className="flex-1">
                        <p className="font-medium">{item.shop}</p>
                        <p className="text-sm text-gray-600">{item.message}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${item.severity === 'high' ? 'bg-red-200 text-red-800' : 'bg-orange-200 text-orange-800'}`}>
                        {item.severity}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Inconsistencies</CardTitle>
            </CardHeader>
            <CardContent>
              {inconsistencies.length === 0 ? (
                <div className="text-center py-8 text-green-600">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2" />
                  <p className="font-medium">No inconsistencies found!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Type</th>
                        <th className="text-left p-2">Shop</th>
                        <th className="text-left p-2">Date</th>
                        <th className="text-left p-2">Issue</th>
                        <th className="text-left p-2">Severity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inconsistencies.map((issue, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="p-2">{issue.type}</td>
                          <td className="p-2">{issue.shop}</td>
                          <td className="p-2">{issue.date}</td>
                          <td className="p-2">{issue.message}</td>
                          <td className="p-2">
                            <span className={`text-xs px-2 py-1 rounded ${issue.severity === 'high' ? 'bg-red-200 text-red-800' : issue.severity === 'medium' ? 'bg-orange-200 text-orange-800' : 'bg-yellow-200 text-yellow-800'}`}>
                              {issue.severity}
                            </span>
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
