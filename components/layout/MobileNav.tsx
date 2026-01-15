'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, LayoutDashboard, DollarSign, Receipt, Wallet, TrendingUp, Store, Users, Settings, FileText, Target, LineChart, BarChart3, Shield } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
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

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">MR Services</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setOpen(!open)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {open && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setOpen(false)}>
          <div className="fixed inset-y-0 left-0 w-64 bg-card shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 pt-20">
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors',
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
              <div className="mt-6 pt-6 border-t">
                <LogoutButton />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
