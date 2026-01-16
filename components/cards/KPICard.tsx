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
      <CardContent className="p-3 sm:p-6">
        <div className="flex items-start justify-between mb-1 sm:mb-2 gap-1">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground line-clamp-2 flex-1">{title}</p>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
        </div>
        <div className="space-y-1 sm:space-y-2">
          <p className="text-lg sm:text-3xl font-bold leading-tight">{formatCurrency(value)}</p>
          {badge && (
            <span className={`inline-block text-xs font-medium px-2 py-0.5 sm:py-1 rounded border ${colorClasses[badgeColor]}`}>
              {badge}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
