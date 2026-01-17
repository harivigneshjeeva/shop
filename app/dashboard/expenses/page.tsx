'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ShopFilter } from '@/components/filters/ShopFilter';
import { DateFilter } from '@/components/filters/DateFilter';
import { MobileFilterDrawer } from '@/components/filters/MobileFilterDrawer';
import { FilterProvider, useFilters } from '@/lib/context/FilterContext';
import { getExpensesByDateRange, getShops, getExpenseCategories, createExpense, updateExpense, deleteExpense } from '@/lib/supabase/queries';
import { formatCurrency, formatDate } from '@/lib/utils/formatting';
import { exportToCSV } from '@/lib/utils/export';
import { validateAmount, validateDate, validateRequired } from '@/lib/utils/validation';
import { validateAmountRange, validateExpenseLimit } from '@/lib/utils/validation';
import { Shop, ExpenseCategory } from '@/lib/types/database';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

function ExpensesContent() {
  const { startDate, endDate, selectedShops } = useFilters();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any | null>(null);
  const [formData, setFormData] = useState({ shop_id: '', category_id: '', expense_date: '', amount: '', notes: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<Record<string, string>>({});
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadShops();
    loadCategories();
  }, []);

  useEffect(() => {
    loadExpenses();
  }, [startDate, endDate, selectedShops]);

  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate, selectedShops]);

  async function loadShops() {
    const { data } = await getShops();
    if (data) setShops(data);
  }

  async function loadCategories() {
    const { data } = await getExpenseCategories();
    if (data) setCategories(data);
  }

  async function loadExpenses() {
    const { data } = await getExpensesByDateRange(startDate, endDate, selectedShops.length ? selectedShops : undefined);
    if (data) {
      setExpenses(data);
      const total = data.reduce((sum: number, e: any) => sum + Number(e.amount), 0);
      setTotalExpenses(total);

      // Group by category for chart
      const categoryMap = new Map();
      data.forEach((exp: any) => {
        const catName = exp.expense_categories?.name || 'Unknown';
        categoryMap.set(catName, (categoryMap.get(catName) || 0) + Number(exp.amount));
      });
      const chartDataTemp = Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));
      setChartData(chartDataTemp);
    }
  }

  function validateForm() {
    const newErrors: Record<string, string> = {};
    const newWarnings: Record<string, string> = {};
    
    const shopValidation = validateRequired(formData.shop_id, 'Shop');
    if (!shopValidation.valid) newErrors.shop_id = shopValidation.error!;
    
    const categoryValidation = validateRequired(formData.category_id, 'Category');
    if (!categoryValidation.valid) newErrors.category_id = categoryValidation.error!;
    
    const dateValidation = validateDate(formData.expense_date);
    if (!dateValidation.valid) newErrors.expense_date = dateValidation.error!;
    
    const amountValidation = validateAmountRange(formData.amount, 0, 50000);
    if (!amountValidation.valid) newErrors.amount = amountValidation.error!;
    
    // Expense limits by category
    const limits: Record<string, number> = {
      'Rent': 10000,
      'Utilities': 2000,
      'Supplies': 5000,
      'Marketing': 3000
    };
    
    const category = categories.find(c => c.id === formData.category_id);
    if (category) {
      const limitCheck = validateExpenseLimit(parseFloat(formData.amount), category.name, limits);
      if (!limitCheck.valid) {
        newErrors.amount = limitCheck.warning!;
      } else if (limitCheck.warning) {
        newWarnings.amount = limitCheck.warning;
      }
    }
    
    setErrors(newErrors);
    setWarnings(newWarnings);
    return Object.keys(newErrors).length === 0;
  }

  function openForm(expense?: any) {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        shop_id: expense.shop_id,
        category_id: expense.category_id,
        expense_date: expense.expense_date,
        amount: expense.amount,
        notes: expense.notes || ''
      });
    } else {
      setEditingExpense(null);
      setFormData({ shop_id: '', category_id: '', expense_date: '', amount: '', notes: '' });
    }
    setShowForm(true);
    setErrors({});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    const data = {
      shop_id: formData.shop_id,
      category_id: formData.category_id,
      expense_date: formData.expense_date,
      amount: parseFloat(formData.amount),
      notes: formData.notes || undefined,
    };

    editingExpense ? await updateExpense(editingExpense.id, data) : await createExpense(data);

    setShowForm(false);
    loadExpenses();
  }

  function handleExport() {
    const exportData = expenses.map(e => ({
      Date: formatDate(e.expense_date),
      Shop: e.shops?.name,
      Category: e.expense_categories?.name,
      Amount: e.amount,
      Notes: e.notes || ''
    }));
    exportToCSV(exportData, 'expenses');
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this expense?')) return;
    await deleteExpense(id);
    loadExpenses();
  }

  const totalPages = Math.ceil(expenses.length / itemsPerPage);
  const paginatedExpenses = expenses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6 pt-4 md:pt-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Expenses</h1>
          <p className="text-muted-foreground">Track expenses across all shops</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={expenses.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => openForm()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      <MobileFilterDrawer />
      <div className="hidden lg:flex gap-4">
        <ShopFilter />
        <DateFilter />
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden space-y-3">
        {/* Row 1: 3 stats in single row */}
        <div className="grid grid-cols-3 gap-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-xs font-medium text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold">{formatCurrency(totalExpenses)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-xs font-medium text-muted-foreground">Count</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold">{expenses.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {expenses.length > 0 ? `Avg: ${formatCurrency(totalExpenses / expenses.length)}` : 'No entries'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-xs font-medium text-muted-foreground">Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold">{chartData.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Row 2: Chart with legend on right */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        innerRadius={40}
                        paddingAngle={5}
                        label={({ cx, cy, midAngle, innerRadius, outerRadius, value, index }) => {
                          const RADIAN = Math.PI / 180;
                          const radius = outerRadius + 15;
                          const x = cx + radius * Math.cos(-midAngle * RADIAN);
                          const y = cy + radius * Math.sin(-midAngle * RADIAN);
                          
                          return (
                            <text
                              x={x}
                              y={y}
                              fill="#666"
                              textAnchor={x > cx ? 'start' : 'end'}
                              dominantBaseline="middle"
                              fontSize="11"
                            >
                              {formatCurrency(value)}
                            </text>
                          );
                        }}
                        labelLine={({ cx, cy, midAngle, outerRadius }) => {
                          const RADIAN = Math.PI / 180;
                          const radius = outerRadius + 10;
                          const x1 = cx + radius * Math.cos(-midAngle * RADIAN);
                          const y1 = cy + radius * Math.sin(-midAngle * RADIAN);
                          const x2 = cx + (outerRadius + 15) * Math.cos(-midAngle * RADIAN);
                          const y2 = cy + (outerRadius + 15) * Math.sin(-midAngle * RADIAN);
                          
                          return (
                            <line
                              x1={x1}
                              y1={y1}
                              x2={x2}
                              y2={y2}
                              stroke="#999"
                              strokeWidth="1"
                            />
                          );
                        }}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-1 min-w-[60px]">
                  {chartData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-1 text-xs">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="truncate">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:grid grid-cols-1 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6">
        {/* Stats Column - 25% */}
        <div className="lg:col-span-1 space-y-1">
          <Card className="p-2">
            <CardHeader className="p-0 mb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground">Total Expenses</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-xl lg:text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
            </CardContent>
          </Card>
          <Card className="p-2">
            <CardHeader className="p-0 mb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground">Expenses Count</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-xl lg:text-2xl font-bold">{expenses.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {expenses.length > 0 ? `Avg: ${formatCurrency(totalExpenses / expenses.length)}` : 'No entries'}
              </p>
            </CardContent>
          </Card>
          <Card className="p-2">
            <CardHeader className="p-0 mb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground">By Category</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-xl lg:text-2xl font-bold">{chartData.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Expense categories</p>
            </CardContent>
          </Card>
        </div>
        {/* Chart Column - 75% */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                      <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        innerRadius={30}
                        paddingAngle={5}
                        label={({ cx, cy, midAngle, innerRadius, outerRadius, value, index }) => {
                          const RADIAN = Math.PI / 180;
                          const radius = outerRadius + 12;
                          const x = cx + radius * Math.cos(-midAngle * RADIAN);
                          const y = cy + radius * Math.sin(-midAngle * RADIAN);
                          
                          return (
                            <text
                              x={x}
                              y={y}
                              fill="#666"
                              textAnchor={x > cx ? 'start' : 'end'}
                              dominantBaseline="middle"
                              fontSize="10"
                            >
                              {formatCurrency(value)}
                            </text>
                          );
                        }}
                        labelLine={({ cx, cy, midAngle, outerRadius }) => {
                          const RADIAN = Math.PI / 180;
                          const radius = outerRadius + 8;
                          const x1 = cx + radius * Math.cos(-midAngle * RADIAN);
                          const y1 = cy + radius * Math.sin(-midAngle * RADIAN);
                          const x2 = cx + (outerRadius + 12) * Math.cos(-midAngle * RADIAN);
                          const y2 = cy + (outerRadius + 12) * Math.sin(-midAngle * RADIAN);
                          
                          return (
                            <line
                              x1={x1}
                              y1={y1}
                              x2={x2}
                              y2={y2}
                              stroke="#999"
                              strokeWidth="1"
                            />
                          );
                        }}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-2 min-w-[80px]">
                  {chartData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="truncate">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No data</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expense Records</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-4">💸</p>
              <p className="text-lg font-medium mb-2">No Expenses Recorded</p>
              <p className="text-muted-foreground mb-4">Track your shop expenses to see profit margins clearly.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">Shop</th>
                      <th className="text-left p-2">Category</th>
                      <th className="text-right p-2">Amount</th>
                      <th className="text-left p-2">Notes</th>
                      <th className="text-right p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedExpenses.map((expense) => (
                      <tr key={expense.id} className="border-b">
                        <td className="p-2">{formatDate(expense.expense_date)}</td>
                        <td className="p-2">{expense.shops?.name}</td>
                        <td className="p-2">{expense.expense_categories?.name}</td>
                        <td className="text-right p-2">{formatCurrency(Number(expense.amount))}</td>
                        <td className="p-2">{expense.notes || '-'}</td>
                        <td className="text-right p-2">
                          <Button variant="ghost" size="icon" onClick={() => openForm(expense)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(expense.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Layout */}
              <div className="lg:hidden space-y-3">
                {paginatedExpenses.map((expense) => (
                  <Card key={expense.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="font-semibold text-sm">{expense.shops?.name}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(expense.expense_date)}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openForm(expense)} className="min-h-[36px] min-w-[36px]">
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(expense.id)} className="min-h-[36px] min-w-[36px]">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Category</p>
                          <p className="font-medium">{expense.expense_categories?.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-muted-foreground text-xs">Amount</p>
                          <p className="font-medium">{formatCurrency(Number(expense.amount))}</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
          {expenses.length > itemsPerPage && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, expenses.length)} of {expenses.length} entries</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label>Shop *</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3"
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
                <Label>Category *</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3"
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                {errors.category_id && <p className="text-sm text-red-500 mt-1">{errors.category_id}</p>}
              </div>
              <div>
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={formData.expense_date}
                  onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                />
                {errors.expense_date && <p className="text-sm text-red-500 mt-1">{errors.expense_date}</p>}
              </div>
              <div>
                <Label>Amount *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
                {errors.amount && <p className="text-sm text-red-500 mt-1">{errors.amount}</p>}
                {warnings.amount && <p className="text-sm text-orange-500 mt-1">⚠️ {warnings.amount}</p>}
              </div>
              <div>
                <Label>Notes</Label>
                <textarea
                  className="w-full min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ExpensesPage() {
  return (
    <FilterProvider>
      <ExpensesContent />
    </FilterProvider>
  );
}
