'use client';

import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils/formatting';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  badge?: string;
  badgeColor?: 'green' | 'red' | 'gray' | 'orange';
  onClick?: () => void;
}

export function KPICard({ title, value, icon: Icon, badge, badgeColor = 'gray', onClick }: KPICardProps) {
  const colorClasses = {
    green: 'bg-green-100 text-green-800 border-green-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    gray: 'bg-gray-100 text-gray-800 border-gray-200',
    orange: 'bg-orange-100 text-orange-800 border-orange-200'
  };

  return (
    <Card className={onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} onClick={onClick}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <p className="text-3xl font-bold">{formatCurrency(value)}</p>
          {badge && (
            <span className={`inline-block text-xs font-medium px-2 py-1 rounded border ${colorClasses[badgeColor]}`}>
              {badge}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
