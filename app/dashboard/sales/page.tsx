'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Download, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ShopFilter } from '@/components/filters/ShopFilter';
import { DateFilter } from '@/components/filters/DateFilter';
import { MobileFilterDrawer } from '@/components/filters/MobileFilterDrawer';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { FilterProvider, useFilters } from '@/lib/context/FilterContext';
import { useToast } from '@/lib/context/ToastContext';
import { getSalesByDateRange, getShops, createSale, updateSale, deleteSale } from '@/lib/supabase/queries';
import { formatCurrency, formatDate } from '@/lib/utils/formatting';
import { exportToCSV } from '@/lib/utils/export';
import { validateAmount, validateDate, validateRequired } from '@/lib/utils/validation';
import { validateAmountRange, detectAnomaly } from '@/lib/utils/validation';
import { calculatePercentageChange } from '@/lib/utils/calculations';
import { DailySale, Shop } from '@/lib/types/database';
import { subDays, startOfWeek, endOfWeek, eachDayOfInterval, format as formatDateFns } from 'date-fns';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function SalesContent() {
  const { startDate, endDate, selectedShops } = useFilters();
  const { showToast } = useToast();
  const [sales, setSales] = useState<any[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSale, setEditingSale] = useState<any | null>(null);
  const [formData, setFormData] = useState({ shop_id: '', sale_date: '', total_amount: '', cash_amount: '', notes: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<Record<string, string>>({});
  const [totalSales, setTotalSales] = useState(0);
  const [totalCash, setTotalCash] = useState(0);
  const [prevTotalSales, setPrevTotalSales] = useState(0);
  const [prevTotalCash, setPrevTotalCash] = useState(0);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [paymentSplitData, setPaymentSplitData] = useState<any[]>([]);
  const [shopSalesData, setShopSalesData] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadShops();
  }, []);

  useEffect(() => {
    loadSales();
  }, [startDate, endDate, selectedShops]);

  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate, selectedShops]);

  async function loadShops() {
    const { data } = await getShops();
    if (data) setShops(data);
  }

  async function loadSales() {
    const { data } = await getSalesByDateRange(startDate, endDate, selectedShops.length ? selectedShops : undefined);
    if (data) {
      setSales(data);
      const total = data.reduce((sum, s) => sum + Number(s.total_amount), 0);
      const cash = data.reduce((sum, s) => sum + Number(s.cash_amount), 0);
      setTotalSales(total);
      setTotalCash(cash);

      // Previous period comparison
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const prevStart = subDays(startDate, daysDiff);
      const prevEnd = subDays(endDate, daysDiff);
      const { data: prevData } = await getSalesByDateRange(prevStart, prevEnd, selectedShops.length ? selectedShops : undefined);
      const prevTotal = prevData?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0;
      const prevCash = prevData?.reduce((sum, s) => sum + Number(s.cash_amount), 0) || 0;
      setPrevTotalSales(prevTotal);
      setPrevTotalCash(prevCash);

      // Trend data
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      const prevDays = eachDayOfInterval({ start: prevStart, end: prevEnd });
      const trend = days.map((day, idx) => {
        const daySales = data.filter(s => formatDate(s.sale_date) === formatDate(day));
        const prevDaySales = prevData?.filter(s => formatDate(s.sale_date) === formatDate(prevDays[idx])) || [];
        return {
          day: formatDateFns(day, 'EEE'),
          current: daySales.reduce((sum, s) => sum + Number(s.total_amount), 0),
          previous: prevDaySales.reduce((sum, s) => sum + Number(s.total_amount), 0)
        };
      });
      setTrendData(trend);

      // Payment split
      setPaymentSplitData([
        { name: 'Cash', value: cash, fill: '#3b82f6' },
        { name: 'Card/Digital', value: total - cash, fill: '#8b5cf6' }
      ]);

      // Sales by shop
      const shopSales: Record<string, number> = {};
      data.forEach(s => {
        const shopName = s.shops?.name || 'Unknown';
        shopSales[shopName] = (shopSales[shopName] || 0) + Number(s.total_amount);
      });
      const shopData = Object.entries(shopSales)
        .map(([shop, sales]) => ({ shop, sales }))
        .sort((a, b) => b.sales - a.sales);
      setShopSalesData(shopData);
    }
  }

  async function validateForm() {
    const newErrors: Record<string, string> = {};
    const newWarnings: Record<string, string> = {};
    
    const shopValidation = validateRequired(formData.shop_id, 'Shop');
    if (!shopValidation.valid) newErrors.shop_id = shopValidation.error!;
    
    const dateValidation = validateDate(formData.sale_date);
    if (!dateValidation.valid) newErrors.sale_date = dateValidation.error!;
    
    const amountValidation = validateAmountRange(formData.total_amount, 0, 100000);
    if (!amountValidation.valid) newErrors.total_amount = amountValidation.error!;
    
    const cashValidation = validateAmount(formData.cash_amount);
    if (!cashValidation.valid) newErrors.cash_amount = cashValidation.error!;
    
    const cashNum = parseFloat(formData.cash_amount || '0');
    const totalNum = parseFloat(formData.total_amount || '0');
    if (cashNum > totalNum) newErrors.cash_amount = 'Cash amount cannot exceed total sales';
    
    // Anomaly detection
    if (formData.shop_id && totalNum > 0) {
      const { data: historicalSales } = await getSalesByDateRange(subDays(new Date(), 30), new Date(), [formData.shop_id]);
      const historical = historicalSales?.map(s => Number(s.total_amount)) || [];
      const anomaly = detectAnomaly(totalNum, historical);
      if (anomaly.isAnomaly) {
        newWarnings.total_amount = anomaly.message!;
      }
    }
    
    setErrors(newErrors);
    setWarnings(newWarnings);
    return Object.keys(newErrors).length === 0;
  }

  function openForm(sale?: any) {
    if (sale) {
      setEditingSale(sale);
      setFormData({
        shop_id: sale.shop_id,
        sale_date: sale.sale_date,
        total_amount: sale.total_amount,
        cash_amount: sale.cash_amount,
        notes: sale.notes || ''
      });
    } else {
      setEditingSale(null);
      setFormData({ shop_id: '', sale_date: '', total_amount: '', cash_amount: '', notes: '' });
    }
    setShowForm(true);
    setErrors({});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!(await validateForm())) return;

    const data = {
      shop_id: formData.shop_id,
      sale_date: formData.sale_date,
      total_amount: parseFloat(formData.total_amount),
      cash_amount: parseFloat(formData.cash_amount || '0'),
      notes: formData.notes || undefined,
    };

    const { error } = editingSale ? await updateSale(editingSale.id, data) : await createSale(data);

    if (error) {
      if (error.code === '23505') {
        setErrors({ sale_date: 'Sales entry already exists for this shop on this date.' });
      }
      showToast('error', 'Failed to save sale');
      return;
    }

    showToast('success', editingSale ? 'Sale updated' : 'Sale added');
    setShowForm(false);
    loadSales();
  }

  function handleExport() {
    const exportData = sales.map(s => ({
      Date: formatDate(s.sale_date),
      Shop: s.shops?.name,
      'Total Sales': s.total_amount,
      Cash: s.cash_amount,
      'Card/Digital': Number(s.total_amount) - Number(s.cash_amount),
      Notes: s.notes || ''
    }));
    exportToCSV(exportData, 'sales');
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this sale?')) return;
    await deleteSale(id);
    showToast('success', 'Sale deleted');
    loadSales();
  }

  const totalPages = Math.ceil(sales.length / itemsPerPage);
  const paginatedSales = sales.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Sales</h1>
          <p className="text-sm lg:text-base text-muted-foreground">Track daily sales across all shops</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={sales.length === 0} size="lg" className="flex-1 lg:flex-none">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => openForm()} size="lg" className="flex-1 lg:flex-none">
            <Plus className="h-4 w-4 mr-2" />
            Add Sale
          </Button>
        </div>
      </div>

      <MobileFilterDrawer />
      <div className="hidden lg:flex gap-4">
        <ShopFilter />
        <DateFilter />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl lg:text-3xl font-bold">{formatCurrency(totalSales)}</p>
            {prevTotalSales > 0 && (
              <div className="flex items-center gap-1 mt-2">
                {calculatePercentageChange(totalSales, prevTotalSales) >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${calculatePercentageChange(totalSales, prevTotalSales) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(calculatePercentageChange(totalSales, prevTotalSales)).toFixed(1)}% vs last period
                </span>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Cash</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl lg:text-3xl font-bold">{formatCurrency(totalCash)}</p>
            {prevTotalCash > 0 && (
              <div className="flex items-center gap-1 mt-2">
                {calculatePercentageChange(totalCash, prevTotalCash) >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${calculatePercentageChange(totalCash, prevTotalCash) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(calculatePercentageChange(totalCash, prevTotalCash)).toFixed(1)}% vs last period
                </span>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Card/Digital</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl lg:text-3xl font-bold">{formatCurrency(totalSales - totalCash)}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {totalSales > 0 ? ((totalSales - totalCash) / totalSales * 100).toFixed(1) : 0}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sales Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {trendData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="current" name="Current Period" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  <Line type="monotone" dataKey="previous" name="Previous Period" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Method Split</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentSplitData.length === 0 || totalSales === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No data available</div>
            ) : (
              <div className="relative">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={paymentSplitData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {paymentSplitData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-lg font-bold">{formatCurrency(totalSales)}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {shopSalesData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sales by Shop</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {shopSalesData.map((shop, idx) => {
                const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];
                const color = colors[idx % colors.length];
                const percentage = totalSales > 0 ? (shop.sales / totalSales) * 100 : 0;
                return (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-32 text-sm font-medium truncate">{shop.shop}</div>
                    <div className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all" 
                        style={{ width: `${percentage}%`, backgroundColor: color }}
                      />
                    </div>
                    <div className="w-24 text-right text-sm font-semibold">{formatCurrency(shop.sales)}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Sales Records</CardTitle>
        </CardHeader>
        <CardContent>
          {sales.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-4">📊</p>
              <p className="text-lg font-medium mb-2">No Sales Data Yet</p>
              <p className="text-muted-foreground mb-4">Start by recording your first sale using the "Add Sale" button above.</p>
            </div>
          ) : (
            <ResponsiveTable>
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Date</th>
                    <th className="text-left p-3">Shop</th>
                    <th className="text-right p-3">Total Sales</th>
                    <th className="text-right p-3">Cash</th>
                    <th className="text-right p-3">Card/Digital</th>
                    <th className="text-left p-3">Notes</th>
                    <th className="text-right p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSales.map((sale) => (
                    <tr key={sale.id} className="border-b">
                      <td className="p-3">{formatDate(sale.sale_date)}</td>
                      <td className="p-3">{sale.shops?.name}</td>
                      <td className="text-right p-3">{formatCurrency(Number(sale.total_amount))}</td>
                      <td className="text-right p-3">{formatCurrency(Number(sale.cash_amount))}</td>
                      <td className="text-right p-3">{formatCurrency(Number(sale.total_amount) - Number(sale.cash_amount))}</td>
                      <td className="p-3">{sale.notes || '-'}</td>
                      <td className="text-right p-3">
                        <Button variant="ghost" size="icon" onClick={() => openForm(sale)} className="min-h-[44px] min-w-[44px]">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(sale.id)} className="min-h-[44px] min-w-[44px]">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ResponsiveTable>
          )}
          {sales.length > itemsPerPage && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sales.length)} of {sales.length} entries</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-[95vw] lg:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSale ? 'Edit Sale' : 'Add Sale'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label>Shop *</Label>
                <select
                  className="w-full h-12 lg:h-10 rounded-md border border-input bg-background px-3 text-base"
                  value={formData.shop_id}
                  onChange={(e) => setFormData({ ...formData, shop_id: e.target.value })}
                >
                  <option value="">Select shop</option>
                  {shops.map((shop) => (
                    <option key={shop.id} value={shop.id}>{shop.name}</option>
                  ))}
                </select>
                {errors.shop_id && <p className="text-sm text-red-500 mt-1">{errors.shop_id}</p>}
              </div>
              <div>
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={formData.sale_date}
                  onChange={(e) => setFormData({ ...formData, sale_date: e.target.value })}
                  className="h-12 lg:h-10 text-base"
                />
                {errors.sale_date && <p className="text-sm text-red-500 mt-1">{errors.sale_date}</p>}
              </div>
              <div>
                <Label>Total Sales *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.total_amount}
                  onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                  className="h-12 lg:h-10 text-base"
                />
                {errors.total_amount && <p className="text-sm text-red-500 mt-1">{errors.total_amount}</p>}
                {warnings.total_amount && <p className="text-sm text-orange-500 mt-1">⚠️ {warnings.total_amount}</p>}
              </div>
              <div>
                <Label>Cash Amount *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.cash_amount}
                  onChange={(e) => setFormData({ ...formData, cash_amount: e.target.value })}
                  className="h-12 lg:h-10 text-base"
                />
                {errors.cash_amount && <p className="text-sm text-red-500 mt-1">{errors.cash_amount}</p>}
              </div>
              <div>
                <Label>Notes</Label>
                <textarea
                  className="w-full min-h-24 rounded-md border border-input bg-background px-3 py-2 text-base"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter className="mt-6 gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)} size="lg" className="flex-1 lg:flex-none">Cancel</Button>
              <Button type="submit" size="lg" className="flex-1 lg:flex-none">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function SalesPage() {
  return (
    <FilterProvider>
      <SalesContent />
    </FilterProvider>
  );
}
