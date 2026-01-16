'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Download, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ShopFilter } from '@/components/filters/ShopFilter';
import { DateFilter } from '@/components/filters/DateFilter';
import { MobileFilterDrawer } from '@/components/filters/MobileFilterDrawer';
import { CustomDateRange } from '@/components/filters/CustomDateRange';
import { FilterProvider, useFilters } from '@/lib/context/FilterContext';
import { useToast } from '@/lib/context/ToastContext';
import { useSettings } from '@/lib/context/SettingsContext';
import { getPayrollsByDateRange, getShops, createPayroll, updatePayroll, deletePayroll } from '@/lib/supabase/queries';
import { formatCurrency, formatWeekRange } from '@/lib/utils/formatting';
import { exportToCSV } from '@/lib/utils/export';
import { validateAmount, validateRequired } from '@/lib/utils/validation';
import { validateAmountRange } from '@/lib/utils/validation';
import { getPayrollWeekStart, getPayrollWeekEnd } from '@/lib/utils/payrollWeek';
import { Shop } from '@/lib/types/database';
import { addWeeks, subWeeks, subDays, format } from 'date-fns';

function PayrollContent() {
  const { startDate, endDate, selectedShops, dateFilterType, setDateFilterType, setDateRange, setSelectedShops } = useFilters();
  const { showToast } = useToast();
  const { settings } = useSettings();
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState<any | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [formData, setFormData] = useState({ shop_id: '', total_amount: '', notes: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<Record<string, string>>({});
  const [totalPayroll, setTotalPayroll] = useState(0);
  const [showCustom, setShowCustom] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadShops();
    // Set defaults on initial mount
    if (!initialized) {
      if (dateFilterType !== 'weekly') {
        setDateFilterType('weekly');
      }
      if (selectedShops.length > 0) {
        setSelectedShops([]);
      }
      setInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (initialized) {
      loadPayrolls();
    }
  }, [startDate, endDate, selectedShops, dateFilterType, initialized]);

  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate, selectedShops, dateFilterType]);

  async function loadShops() {
    const { data } = await getShops();
    if (data) setShops(data);
  }

  async function loadPayrolls() {
    // For weekly/monthly/yearly, get ALL payroll data (no date limit)
    let queryStart = startDate;
    let queryEnd = endDate;
    
    if (dateFilterType === 'weekly' || dateFilterType === 'monthly' || dateFilterType === 'yearly') {
      queryStart = new Date('2000-01-01'); // Far past date to get all records
      queryEnd = new Date();
    }
    
    const { data } = await getPayrollsByDateRange(queryStart, queryEnd, selectedShops.length ? selectedShops : undefined);
    if (data) {
      if (dateFilterType === 'weekly') {
        setPayrolls(data);
        const total = data.reduce((sum: number, p: any) => sum + Number(p.total_amount), 0);
        setTotalPayroll(total);
      } else if (dateFilterType === 'monthly') {
        const monthlyData: Record<string, { amount: number, count: number, month: string, entries: any[] }> = {};
        data.forEach((p: any) => {
          const monthKey = format(new Date(p.week_end), 'yyyy-MM');
          const monthLabel = format(new Date(p.week_end), 'MMMM yyyy');
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { amount: 0, count: 0, month: monthLabel, entries: [] };
          }
          monthlyData[monthKey].amount += Number(p.total_amount);
          monthlyData[monthKey].count += 1;
          monthlyData[monthKey].entries.push(p);
        });
        
        const grouped = Object.entries(monthlyData)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([key, val]) => ({
            id: key,
            week_start: key + '-01',
            week_end: key + '-01',
            total_amount: val.amount,
            notes: `${val.count} payroll entries`,
            shops: { name: val.month },
            isGrouped: true,
            entries: val.entries
          }));
        setPayrolls(grouped);
        const total = grouped.reduce((sum, p) => sum + Number(p.total_amount), 0);
        setTotalPayroll(total);
      } else if (dateFilterType === 'yearly') {
        const yearlyData: Record<string, { amount: number, count: number, year: string, entries: any[] }> = {};
        data.forEach((p: any) => {
          const yearKey = format(new Date(p.week_end), 'yyyy');
          if (!yearlyData[yearKey]) {
            yearlyData[yearKey] = { amount: 0, count: 0, year: yearKey, entries: [] };
          }
          yearlyData[yearKey].amount += Number(p.total_amount);
          yearlyData[yearKey].count += 1;
          yearlyData[yearKey].entries.push(p);
        });
        
        const grouped = Object.entries(yearlyData)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([key, val]) => ({
            id: key,
            week_start: key + '-01-01',
            week_end: key + '-01-01',
            total_amount: val.amount,
            notes: `${val.count} payroll entries`,
            shops: { name: val.year },
            isGrouped: true,
            entries: val.entries
          }));
        setPayrolls(grouped);
        const total = grouped.reduce((sum: number, p: any) => sum + Number(p.total_amount), 0);
        setTotalPayroll(total);
      } else {
        setPayrolls(data);
        const total = data.reduce((sum: number, p: any) => sum + Number(p.total_amount), 0);
        setTotalPayroll(total);
      }
    }
  }

  function validateForm() {
    const newErrors: Record<string, string> = {};
    const newWarnings: Record<string, string> = {};
    
    const shopValidation = validateRequired(formData.shop_id, 'Shop');
    if (!shopValidation.valid) newErrors.shop_id = shopValidation.error!;
    
    const amountValidation = validateAmountRange(formData.total_amount, 0, 50000);
    if (!amountValidation.valid) newErrors.total_amount = amountValidation.error!;
    
    const weekStart = getPayrollWeekStart(selectedWeek, settings.payrollWeekStartDay);
    if (weekStart > new Date()) {
      newErrors.week = 'Week cannot be in the future';
    }
    
    // Warning for unusually high payroll
    const amount = parseFloat(formData.total_amount);
    if (amount > 10000) {
      newWarnings.total_amount = 'This payroll amount is unusually high. Please verify.';
    }
    
    setErrors(newErrors);
    setWarnings(newWarnings);
    return Object.keys(newErrors).length === 0;
  }

  function openForm(payroll?: any) {
    if (payroll) {
      setEditingPayroll(payroll);
      setSelectedWeek(new Date(payroll.week_start));
      setFormData({
        shop_id: payroll.shop_id,
        total_amount: payroll.total_amount,
        notes: payroll.notes || ''
      });
    } else {
      setEditingPayroll(null);
      setSelectedWeek(new Date());
      setFormData({ shop_id: '', total_amount: '', notes: '' });
    }
    setShowForm(true);
    setErrors({});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    const weekStart = getPayrollWeekStart(selectedWeek, settings.payrollWeekStartDay);
    const weekEnd = getPayrollWeekEnd(selectedWeek, settings.payrollWeekStartDay);

    const data = {
      shop_id: formData.shop_id,
      week_start: format(weekStart, 'yyyy-MM-dd'),
      week_end: format(weekEnd, 'yyyy-MM-dd'),
      total_amount: parseFloat(formData.total_amount),
      notes: formData.notes || undefined,
    };

    const { error } = editingPayroll ? await updatePayroll(editingPayroll.id, data) : await createPayroll(data);

    if (error) {
      if (error.code === '23505') {
        setErrors({ week: 'Payroll already recorded for this shop for this week.' });
      }
      showToast('error', 'Failed to save payroll');
      return;
    }

    showToast('success', editingPayroll ? 'Payroll updated' : 'Payroll added');
    setShowForm(false);
    loadPayrolls();
  }

  function handleExport() {
    const exportData = payrolls.map(p => ({
      Shop: p.shops?.name,
      'Week Range': formatWeekRange(new Date(p.week_start), new Date(p.week_end)),
      Amount: p.total_amount,
      Notes: p.notes || ''
    }));
    exportToCSV(exportData, 'payroll');
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this payroll?')) return;
    await deletePayroll(id);
    showToast('success', 'Payroll deleted');
    loadPayrolls();
  }

  const weekStart = getPayrollWeekStart(selectedWeek, settings.payrollWeekStartDay);
  const weekEnd = getPayrollWeekEnd(selectedWeek, settings.payrollWeekStartDay);

  function handleCustomApply(start: Date, end: Date) {
    setDateRange(start, end);
    setDateFilterType('custom');
  }

  const totalPages = Math.ceil(payrolls.length / itemsPerPage);
  const paginatedPayrolls = payrolls.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  function toggleRow(id: string) {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className="space-y-4 lg:space-y-6 pt-4 md:pt-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Payroll</h1>
          <p className="text-sm lg:text-base text-muted-foreground">Track weekly payroll costs</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={payrolls.length === 0} size="lg" className="flex-1 lg:flex-none">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => openForm()} size="lg" className="flex-1 lg:flex-none">
            <Plus className="h-4 w-4 mr-2" />
            Add Payroll
          </Button>
        </div>
      </div>

      <MobileFilterDrawer />
      <div className="hidden lg:flex gap-4">
        <ShopFilter />
        <div className="flex gap-2">
          <Button
            variant={dateFilterType === 'weekly' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateFilterType('weekly')}
            className="min-h-[44px] lg:min-h-[36px]"
          >
            Weekly
          </Button>
          <Button
            variant={dateFilterType === 'monthly' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateFilterType('monthly')}
            className="min-h-[44px] lg:min-h-[36px]"
          >
            Monthly
          </Button>
          <Button
            variant={dateFilterType === 'yearly' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateFilterType('yearly')}
            className="min-h-[44px] lg:min-h-[36px]"
          >
            Yearly
          </Button>
          <Button
            variant={dateFilterType === 'custom' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowCustom(true)}
            className="min-h-[44px] lg:min-h-[36px]"
          >
            Custom
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Payroll</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl lg:text-3xl font-bold">{formatCurrency(totalPayroll)}</p>
            <p className="text-sm text-muted-foreground mt-2">{payrolls.length} payroll entries</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Weekly Avg</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl lg:text-3xl font-bold">
              {payrolls.length > 0 ? formatCurrency(totalPayroll / payrolls.length) : formatCurrency(0)}
            </p>
            <p className="text-sm text-muted-foreground mt-2">Per entry</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Shop Count</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl lg:text-3xl font-bold">
              {payrolls.length > 0 ? new Set(payrolls.map((p: any) => p.shop_id)).size : 0}
            </p>
            <p className="text-sm text-muted-foreground mt-2">Shops with payroll</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Period</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg lg:text-xl font-bold">Wkly</p>
            <p className="text-sm text-muted-foreground mt-2">Payroll period</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payroll Records</CardTitle>
        </CardHeader>
        <CardContent>
          {payrolls.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-4">🧾</p>
              <p className="text-lg font-medium mb-2">No Payroll Entries</p>
              <p className="text-muted-foreground mb-4">Add your first weekly payroll to track labor costs.</p>
              <Button onClick={() => openForm()}>Add Payroll</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Shop</th>
                    <th className="text-left p-3">Week Range</th>
                    <th className="text-right p-3">Amount</th>
                    <th className="text-left p-3">Notes</th>
                    <th className="text-right p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPayrolls.map((payroll) => (
                    <>
                      <tr key={payroll.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          {payroll.isGrouped ? (
                            <button onClick={() => toggleRow(payroll.id)} className="flex items-center gap-2 hover:text-primary">
                              {expandedRows.has(payroll.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              {payroll.shops?.name}
                            </button>
                          ) : (
                            payroll.shops?.name
                          )}
                        </td>
                        <td className="p-3">
                          {payroll.isGrouped ? '-' : formatWeekRange(new Date(payroll.week_start), new Date(payroll.week_end))}
                        </td>
                        <td className="text-right p-3">{formatCurrency(Number(payroll.total_amount))}</td>
                        <td className="p-3">{payroll.notes || '-'}</td>
                        <td className="text-right p-3">
                          {!payroll.isGrouped && (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => openForm(payroll)} className="min-h-[44px] min-w-[44px]">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(payroll.id)} className="min-h-[44px] min-w-[44px]">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                      {payroll.isGrouped && expandedRows.has(payroll.id) && payroll.entries?.map((entry: any) => (
                        <tr key={entry.id} className="border-b bg-muted/30">
                          <td className="p-3 pl-10">{entry.shops?.name}</td>
                          <td className="p-3">{formatWeekRange(new Date(entry.week_start), new Date(entry.week_end))}</td>
                          <td className="text-right p-3">{formatCurrency(Number(entry.total_amount))}</td>
                          <td className="p-3">{entry.notes || '-'}</td>
                          <td className="text-right p-3">
                            <Button variant="ghost" size="icon" onClick={() => openForm(entry)} className="min-h-[44px] min-w-[44px]">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(entry.id)} className="min-h-[44px] min-w-[44px]">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {payrolls.length > itemsPerPage && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, payrolls.length)} of {payrolls.length} entries</p>
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
            <DialogTitle>{editingPayroll ? 'Edit Payroll' : 'Add Payroll'}</DialogTitle>
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
                <Label>Week *</Label>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="icon" onClick={() => setSelectedWeek(subWeeks(selectedWeek, 1))} className="min-h-[44px] min-w-[44px]">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex-1 text-center font-medium text-sm lg:text-base">
                    {formatWeekRange(weekStart, weekEnd)}
                  </div>
                  <Button type="button" variant="outline" size="icon" onClick={() => setSelectedWeek(addWeeks(selectedWeek, 1))} className="min-h-[44px] min-w-[44px]">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                {errors.week && <p className="text-sm text-red-500 mt-1">{errors.week}</p>}
              </div>
              <div>
                <Label>Total Amount *</Label>
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

      <CustomDateRange
        open={showCustom}
        onOpenChange={setShowCustom}
        onApply={handleCustomApply}
      />
    </div>
  );
}

export default function PayrollPage() {
  return (
    <FilterProvider>
      <PayrollContent />
    </FilterProvider>
  );
}
