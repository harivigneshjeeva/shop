'use client';

import { useEffect, useState } from 'react';
import { Download, FileText, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShopFilter } from '@/components/filters/ShopFilter';
import { DateFilter } from '@/components/filters/DateFilter';
import { FilterProvider, useFilters } from '@/lib/context/FilterContext';
import { getSalesByDateRange, getExpensesByDateRange, getPayrollsByDateRange, getShops } from '@/lib/supabase/queries';
import { formatCurrency, formatDate, formatWeekRange } from '@/lib/utils/formatting';
import { exportToCSV } from '@/lib/utils/export';
import { exportToJSON } from '@/lib/utils/export';
import { getAllData } from '@/lib/supabase/queries';
import { TableSkeleton } from '@/components/ui/skeleton';

function ReportsContent() {
  const { startDate, endDate, selectedShops } = useFilters();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>({
    sales: [],
    expenses: [],
    payrolls: [],
    summary: { totalSales: 0, totalExpenses: 0, totalPayroll: 0, profit: 0 }
  });

  useEffect(() => {
    loadReportData();
  }, [startDate, endDate, selectedShops]);

  async function loadReportData() {
    setLoading(true);
    const { data: sales } = await getSalesByDateRange(startDate, endDate, selectedShops.length ? selectedShops : undefined);
    const { data: expenses } = await getExpensesByDateRange(startDate, endDate, selectedShops.length ? selectedShops : undefined);
    const { data: payrolls } = await getPayrollsByDateRange(startDate, endDate, selectedShops.length ? selectedShops : undefined);

    const totalSales = sales?.reduce((sum: number, s: any) => sum + Number(s.total_amount), 0) || 0;
    const totalExpenses = expenses?.reduce((sum: number, e: any) => sum + Number(e.amount), 0) || 0;
    const totalPayroll = payrolls?.reduce((sum: number, p: any) => sum + Number(p.total_amount), 0) || 0;
    const profit = totalSales - totalExpenses - totalPayroll;

    setReportData({
      sales: sales || [],
      expenses: expenses || [],
      payrolls: payrolls || [],
      summary: { totalSales, totalExpenses, totalPayroll, profit }
    });
    setLoading(false);
  }

  function exportFullReport() {
    const reportExport = [
      { Section: 'SUMMARY', Value: '' },
      { Section: 'Total Sales', Value: reportData.summary.totalSales },
      { Section: 'Total Expenses', Value: reportData.summary.totalExpenses },
      { Section: 'Total Payroll', Value: reportData.summary.totalPayroll },
      { Section: 'Net Profit', Value: reportData.summary.profit },
      { Section: '', Value: '' },
      { Section: 'SALES DETAILS', Value: '' },
      ...reportData.sales.map((s: any) => ({
        Date: formatDate(s.sale_date),
        Shop: s.shops?.name,
        Amount: s.total_amount,
        Type: 'Sale'
      })),
      { Section: '', Value: '' },
      { Section: 'EXPENSES DETAILS', Value: '' },
      ...reportData.expenses.map((e: any) => ({
        Date: formatDate(e.expense_date),
        Shop: e.shops?.name,
        Category: e.expense_categories?.name,
        Amount: e.amount,
        Type: 'Expense'
      })),
      { Section: '', Value: '' },
      { Section: 'PAYROLL DETAILS', Value: '' },
      ...reportData.payrolls.map((p: any) => ({
        Week: formatWeekRange(new Date(p.week_start), new Date(p.week_end)),
        Shop: p.shops?.name,
        Amount: p.total_amount,
        Type: 'Payroll'
      }))
    ];
    exportToCSV(reportExport, 'full_report');
  }

  async function exportSummaryByShop() {
    const { data: shops } = await getShops(true);
    const summaryData = reportData.sales.reduce((acc: any, sale: any) => {
      const shopId = sale.shop_id;
      if (!acc[shopId]) {
        acc[shopId] = {
          Shop: sale.shops?.name,
          Sales: 0,
          Expenses: 0,
          Payroll: 0,
          Profit: 0
        };
      }
      acc[shopId].Sales += Number(sale.total_amount);
      return acc;
    }, {});

    reportData.expenses.forEach((expense: any) => {
      const shopId = expense.shop_id;
      if (summaryData[shopId]) {
        summaryData[shopId].Expenses += Number(expense.amount);
      }
    });

    reportData.payrolls.forEach((payroll: any) => {
      const shopId = payroll.shop_id;
      if (summaryData[shopId]) {
        summaryData[shopId].Payroll += Number(payroll.total_amount);
      }
    });

    Object.values(summaryData).forEach((shop: any) => {
      shop.Profit = shop.Sales - shop.Expenses - shop.Payroll;
    });

    exportToCSV(Object.values(summaryData), 'summary_by_shop');
  }

  async function handleBackup() {
    const allData = await getAllData();
    exportToJSON(allData, 'full_backup');
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Comprehensive financial reports and exports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleBackup}>
            <Download className="h-4 w-4 mr-2" />
            Backup All Data
          </Button>
          <Button variant="outline" onClick={exportSummaryByShop}>
            <FileText className="h-4 w-4 mr-2" />
            Export Summary
          </Button>
          <Button onClick={exportFullReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Full Report
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        <ShopFilter />
        <DateFilter />
      </div>

      {loading ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Loading...</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted animate-pulse rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Loading Data...</CardTitle>
            </CardHeader>
            <CardContent>
              <TableSkeleton rows={10} />
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(reportData.summary.totalSales)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(reportData.summary.totalExpenses)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Payroll</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(reportData.summary.totalPayroll)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${reportData.summary.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(reportData.summary.profit)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sales Records ({reportData.sales.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {reportData.sales.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No sales data for selected period</p>
              ) : (
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-background">
                      <tr className="border-b">
                        <th className="text-left p-2">Date</th>
                        <th className="text-left p-2">Shop</th>
                        <th className="text-right p-2">Total</th>
                        <th className="text-right p-2">Cash</th>
                        <th className="text-right p-2">Card/Digital</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.sales.map((sale: any) => (
                        <tr key={sale.id} className="border-b">
                          <td className="p-2">{formatDate(sale.sale_date)}</td>
                          <td className="p-2">{sale.shops?.name}</td>
                          <td className="text-right p-2">{formatCurrency(Number(sale.total_amount))}</td>
                          <td className="text-right p-2">{formatCurrency(Number(sale.cash_amount))}</td>
                          <td className="text-right p-2">{formatCurrency(Number(sale.total_amount) - Number(sale.cash_amount))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Expense Records ({reportData.expenses.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {reportData.expenses.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No expense data for selected period</p>
              ) : (
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-background">
                      <tr className="border-b">
                        <th className="text-left p-2">Date</th>
                        <th className="text-left p-2">Shop</th>
                        <th className="text-left p-2">Category</th>
                        <th className="text-right p-2">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.expenses.map((expense: any) => (
                        <tr key={expense.id} className="border-b">
                          <td className="p-2">{formatDate(expense.expense_date)}</td>
                          <td className="p-2">{expense.shops?.name}</td>
                          <td className="p-2">{expense.expense_categories?.name}</td>
                          <td className="text-right p-2">{formatCurrency(Number(expense.amount))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payroll Records ({reportData.payrolls.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {reportData.payrolls.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No payroll data for selected period</p>
              ) : (
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-background">
                      <tr className="border-b">
                        <th className="text-left p-2">Week</th>
                        <th className="text-left p-2">Shop</th>
                        <th className="text-right p-2">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.payrolls.map((payroll: any) => (
                        <tr key={payroll.id} className="border-b">
                          <td className="p-2">{formatWeekRange(new Date(payroll.week_start), new Date(payroll.week_end))}</td>
                          <td className="p-2">{payroll.shops?.name}</td>
                          <td className="text-right p-2">{formatCurrency(Number(payroll.total_amount))}</td>
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

export default function ReportsPage() {
  return (
    <FilterProvider>
      <ReportsContent />
    </FilterProvider>
  );
}
