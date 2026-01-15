'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, DollarSign, Receipt, Wallet, TrendingUp, Store, Users, Settings, FileText, Target, LineChart, BarChart3, Shield } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { LogoutButton } from './LogoutButton';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/sales', label: 'Sales', icon: DollarSign },
  { href: '/dashboard/expenses', label: 'Expenses', icon: Receipt },
  { href: '/dashboard/payroll', label: 'Payroll', icon: Wallet },
  { href: '/dashboard/profit', label: 'Profit', icon: TrendingUp },
  { href: '/dashboard/targets', label: 'Targets', icon: Target },
  { href: '/dashboard/forecasting', label: 'Forecasting', icon: LineChart },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/data-quality', label: 'Data Quality', icon: Shield },
  { href: '/dashboard/reports', label: 'Reports', icon: FileText },
  { href: '/dashboard/shops', label: 'Shops', icon: Store },
  { href: '/dashboard/staff', label: 'Staff', icon: Users },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden lg:flex w-64 border-r bg-card h-screen sticky top-0 flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold">MR Services</h1>
        <p className="text-sm text-muted-foreground">Dashboard</p>
      </div>
      <nav className="space-y-1 px-3 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t">
        <LogoutButton />
      </div>
    </div>
  );
}
