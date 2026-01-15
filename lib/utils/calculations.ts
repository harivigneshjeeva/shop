export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 999 : 0;
  return ((current - previous) / previous) * 100;
}

export function formatPercentageChange(change: number): string {
  if (change > 0) {
    return `🔼 ${Math.min(change, 999).toFixed(1)}%`;
  } else if (change < 0) {
    return `🔽 ${Math.abs(change).toFixed(1)}%`;
  }
  return '— No change';
}

export function getComparisonBadge(current: number, previous: number | null): string {
  if (previous === null || previous === undefined) return '—';
  if (previous === 0 && current > 0) return 'New!';
  
  const change = calculatePercentageChange(current, previous);
  return formatPercentageChange(change);
}
