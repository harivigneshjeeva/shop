'use client';

import { AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Alert {
  type: 'sales' | 'payroll';
  shopName: string;
  message: string;
  onClick: () => void;
}

interface AlertCardProps {
  alerts: Alert[];
}

export function AlertCard({ alerts }: AlertCardProps) {
  if (alerts.length === 0) {
    return (
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle className="h-5 w-5" />
            All Caught Up!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-green-700">No missing data. Everything is up to date.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-red-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-800">
          <AlertCircle className="h-5 w-5" />
          ⚠️ Action Required
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {alerts.map((alert, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-red-50 rounded-md cursor-pointer hover:bg-red-100 transition-colors"
              onClick={alert.onClick}
            >
              <div>
                <p className="font-medium text-sm">
                  {alert.type === 'sales' ? '🔴' : '🟡'} {alert.shopName}
                </p>
                <p className="text-xs text-muted-foreground">{alert.message}</p>
              </div>
              <span className="text-xs text-blue-600 font-medium">Add →</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
