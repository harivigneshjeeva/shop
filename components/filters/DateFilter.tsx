'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useFilters } from '@/lib/context/FilterContext';
import { CustomDateRange } from './CustomDateRange';
import { startOfDay, endOfDay } from 'date-fns';

export function DateFilter() {
  const { dateFilterType, setDateFilterType, setDateRange } = useFilters();
  const [showCustom, setShowCustom] = useState(false);

  const filters = [
    { value: 'daily' as const, label: 'Daily' },
    { value: 'weekly' as const, label: 'Weekly' },
    { value: 'monthly' as const, label: 'Monthly' },
    { value: 'yearly' as const, label: 'Yearly' },
    { value: 'custom' as const, label: 'Custom' },
  ];

  function handleFilterClick(value: typeof filters[number]['value']) {
    if (value === 'custom') {
      setShowCustom(true);
    } else {
      setDateFilterType(value);
    }
  }

  function handleCustomApply(start: Date, end: Date) {
    setDateRange(startOfDay(start), endOfDay(end));
    setDateFilterType('custom');
  }

  return (
    <>
      <div className="flex gap-2 flex-wrap">
        {filters.map((filter) => (
          <Button
            key={filter.value}
            variant={dateFilterType === filter.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilterClick(filter.value)}
            className="min-h-[44px] lg:min-h-[36px]"
          >
            {filter.label}
          </Button>
        ))}
      </div>
      <CustomDateRange
        open={showCustom}
        onOpenChange={setShowCustom}
        onApply={handleCustomApply}
      />
    </>
  );
}
