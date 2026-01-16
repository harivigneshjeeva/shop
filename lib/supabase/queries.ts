import { supabase } from './client';
import { format } from 'date-fns';
import { getCached, setCache, getCacheKey, clearCache } from '@/lib/utils/cache';

export async function getShops(includeRetired = false) {
  const cacheKey = getCacheKey('shops', includeRetired ? 'retired' : 'active');
  const cached = getCached<any[]>(cacheKey);
  if (cached) return { data: cached, error: null };
  
  let query = supabase.from('shops').select('*').order('name');
  if (!includeRetired) query = query.eq('status', 'active');
  const result = await query;
  
  if (result.data) setCache(cacheKey, result.data, 300);
  return result;
}

export async function getSalesByDateRange(startDate: Date, endDate: Date, shopIds?: string[]) {
  let query: any = supabase
    .from('daily_sales')
    .select('*, shops(name, city)')
    .gte('sale_date', format(startDate, 'yyyy-MM-dd'))
    .lte('sale_date', format(endDate, 'yyyy-MM-dd'))
    .order('sale_date', { ascending: false });
  
  if (shopIds?.length) query = query.in('shop_id', shopIds);
  return await query;
}

export async function getExpensesByDateRange(startDate: Date, endDate: Date, shopIds?: string[]) {
  let query: any = supabase
    .from('expenses')
    .select('*, shops(name, city), expense_categories(name)')
    .gte('expense_date', format(startDate, 'yyyy-MM-dd'))
    .lte('expense_date', format(endDate, 'yyyy-MM-dd'))
    .order('expense_date', { ascending: false });
  
  if (shopIds?.length) query = query.in('shop_id', shopIds);
  return await query;
}

export async function getPayrollsByDateRange(startDate: Date, endDate: Date, shopIds?: string[]) {
  let query = supabase
    .from('weekly_payrolls')
    .select('*, shops(name, city)')
    .gte('week_start', format(startDate, 'yyyy-MM-dd'))
    .lte('week_end', format(endDate, 'yyyy-MM-dd'))
    .order('week_start', { ascending: false });
  
  if (shopIds?.length) query = query.in('shop_id', shopIds);
  return await query;
}

export async function getExpenseCategories() {
  return supabase.from('expense_categories').select('*').order('name');
}

export async function getStaff() {
  return supabase.from('staff').select('*, staff_shops(shop_id, shops(name))').order('full_name');
}

export async function createSale(data: { shop_id: string; sale_date: string; total_amount: number; cash_amount: number; notes?: string }): Promise<any> {
  clearCache('sales');
  return await (supabase as any).from('daily_sales').insert(data).select().single();
}

export async function updateSale(id: string, data: { shop_id: string; sale_date: string; total_amount: number; cash_amount: number; notes?: string }): Promise<any> {
  clearCache('sales');
  return await (supabase as any).from('daily_sales').update(data).eq('id', id).select().single();
}

export async function createExpense(data: { shop_id: string; category_id: string; expense_date: string; amount: number; notes?: string }): Promise<any> {
  clearCache('expenses');
  return await (supabase as any).from('expenses').insert(data).select().single();
}

export async function updateExpense(id: string, data: { shop_id: string; category_id: string; expense_date: string; amount: number; notes?: string }): Promise<any> {
  clearCache('expenses');
  return await (supabase as any).from('expenses').update(data).eq('id', id).select().single();
}

export async function createPayroll(data: { shop_id: string; week_start: string; week_end: string; total_amount: number; notes?: string }): Promise<any> {
  clearCache('payrolls');
  return await (supabase as any).from('weekly_payrolls').insert(data).select().single();
}

export async function updatePayroll(id: string, data: { shop_id: string; week_start: string; week_end: string; total_amount: number; notes?: string }): Promise<any> {
  clearCache('payrolls');
  return await (supabase as any).from('weekly_payrolls').update(data).eq('id', id).select().single();
}

export async function createShop(data: { name: string; city?: string; status: 'active' | 'retired' }): Promise<any> {
  return await (supabase as any).from('shops').insert(data).select().single();
}

export async function updateShop(id: string, data: { name: string; city?: string; status: 'active' | 'retired' }): Promise<any> {
  return await (supabase as any).from('shops').update(data).eq('id', id).select().single();
}

export async function createStaff(data: { full_name: string; phone?: string; status: 'active' | 'inactive' }): Promise<any> {
  return await (supabase as any).from('staff').insert(data).select().single();
}

export async function updateStaff(id: string, data: { full_name: string; phone?: string; status: 'active' | 'inactive' }): Promise<any> {
  return await (supabase as any).from('staff').update(data).eq('id', id).select().single();
}

export async function updateStaffShops(staffId: string, shopIds: string[]) {
  await (supabase as any).from('staff_shops').delete().eq('staff_id', staffId);
  if (shopIds.length > 0) {
    const records = shopIds.map(shopId => ({ staff_id: staffId, shop_id: shopId }));
    return await (supabase as any).from('staff_shops').insert(records);
  }
  return { error: null };
}

export async function createExpenseCategory(name: string): Promise<any> {
  return await (supabase as any).from('expense_categories').insert({ name }).select().single();
}

export async function deleteSale(id: string) {
  clearCache('sales');
  return (supabase as any).from('daily_sales').delete().eq('id', id);
}

export async function deleteExpense(id: string) {
  clearCache('expenses');
  return (supabase as any).from('expenses').delete().eq('id', id);
}

export async function deletePayroll(id: string) {
  clearCache('payrolls');
  return (supabase as any).from('weekly_payrolls').delete().eq('id', id);
}

export async function deleteShop(id: string) {
  return (supabase as any).from('shops').delete().eq('id', id);
}

export async function deleteStaff(id: string) {
  return (supabase as any).from('staff').delete().eq('id', id);
}

// Targets
export async function getTargets(shopIds?: string[]) {
  let query: any = supabase.from('targets').select('*, shops(name)').order('target_date', { ascending: false });
  if (shopIds?.length) query = query.in('shop_id', shopIds);
  return await query;
}

export async function createTarget(data: { shop_id: string; target_type: string; target_date: string; sales_target: number }): Promise<any> {
  return await (supabase as any).from('targets').insert(data).select().single();
}

export async function updateTarget(id: string, data: { shop_id: string; target_type: string; target_date: string; sales_target: number }): Promise<any> {
  return await (supabase as any).from('targets').update(data).eq('id', id).select().single();
}

export async function deleteTarget(id: string) {
  return (supabase as any).from('targets').delete().eq('id', id);
}

// Backup - Get all data
export async function getAllData() {
  const [shops, staff, sales, expenses, payrolls, targets, categories] = await Promise.all([
    supabase.from('shops').select('*'),
    supabase.from('staff').select('*, staff_shops(shop_id, shops(name))'),
    supabase.from('daily_sales').select('*, shops(name)'),
    supabase.from('expenses').select('*, shops(name), expense_categories(name)'),
    supabase.from('weekly_payrolls').select('*, shops(name)'),
    supabase.from('targets').select('*, shops(name)'),
    supabase.from('expense_categories').select('*')
  ]);

  return {
    shops: shops.data || [],
    staff: staff.data || [],
    sales: sales.data || [],
    expenses: expenses.data || [],
    payrolls: payrolls.data || [],
    targets: targets.data || [],
    categories: categories.data || []
  };
}
