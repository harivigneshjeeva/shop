export interface Shop {
  id: string;
  name: string;
  city: string | null;
  status: 'active' | 'retired';
  created_at: string;
  updated_at: string;
}

export interface Staff {
  id: string;
  full_name: string;
  phone: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface StaffShop {
  staff_id: string;
  shop_id: string;
}

export interface DailySale {
  id: string;
  shop_id: string;
  sale_date: string;
  total_amount: number;
  cash_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  created_at: string;
}

export interface Expense {
  id: string;
  shop_id: string;
  category_id: string;
  expense_date: string;
  amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface WeeklyPayroll {
  id: string;
  shop_id: string;
  week_start: string;
  week_end: string;
  total_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: 'insert' | 'update' | 'delete';
  changed_by: string | null;
  changed_at: string;
}

export interface Database {
  public: {
    Tables: {
      shops: {
        Row: Shop;
        Insert: Omit<Shop, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Shop, 'id' | 'created_at' | 'updated_at'>>;
      };
      staff: {
        Row: Staff;
        Insert: Omit<Staff, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Staff, 'id' | 'created_at' | 'updated_at'>>;
      };
      staff_shops: {
        Row: StaffShop;
        Insert: StaffShop;
        Update: Partial<StaffShop>;
      };
      daily_sales: {
        Row: DailySale;
        Insert: Omit<DailySale, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DailySale, 'id' | 'created_at' | 'updated_at'>>;
      };
      expense_categories: {
        Row: ExpenseCategory;
        Insert: Omit<ExpenseCategory, 'id' | 'created_at'>;
        Update: Partial<Omit<ExpenseCategory, 'id' | 'created_at'>>;
      };
      expenses: {
        Row: Expense;
        Insert: Omit<Expense, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Expense, 'id' | 'created_at' | 'updated_at'>>;
      };
      weekly_payrolls: {
        Row: WeeklyPayroll;
        Insert: Omit<WeeklyPayroll, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<WeeklyPayroll, 'id' | 'created_at' | 'updated_at'>>;
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Omit<AuditLog, 'id' | 'changed_at'>;
        Update: Partial<Omit<AuditLog, 'id' | 'changed_at'>>;
      };
    };
  };
}
