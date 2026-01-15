'use client';

import { Suspense, lazy } from 'react';
import { ChartSkeleton } from './skeleton';

const LazyBarChart = lazy(() => import('recharts').then(mod => ({ default: mod.BarChart })));
const LazyLineChart = lazy(() => import('recharts').then(mod => ({ default: mod.LineChart })));
const LazyPieChart = lazy(() => import('recharts').then(mod => ({ default: mod.PieChart })));

export function LazyChart({ type, children, ...props }: any) {
  let ChartComponent;
  
  switch (type) {
    case 'bar':
      ChartComponent = LazyBarChart;
      break;
    case 'line':
      ChartComponent = LazyLineChart;
      break;
    case 'pie':
      ChartComponent = LazyPieChart;
      break;
    default:
      ChartComponent = LazyBarChart;
  }

  return (
    <Suspense fallback={<ChartSkeleton />}>
      <ChartComponent {...props}>{children}</ChartComponent>
    </Suspense>
  );
}
