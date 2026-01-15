'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

type DateFilterType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

interface FilterContextType {
  selectedShops: string[];
  setSelectedShops: (shops: string[]) => void;
  dateFilterType: DateFilterType;
  setDateFilterType: (type: DateFilterType) => void;
  startDate: Date;
  endDate: Date;
  setDateRange: (start: Date, end: Date) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [selectedShops, setSelectedShops] = useState<string[]>(() => {
    const shops = searchParams.get('shops');
    return shops ? shops.split(',') : [];
  });
  const [dateFilterType, setDateFilterType] = useState<DateFilterType>(() => {
    return (searchParams.get('dateType') as DateFilterType) || 'daily';
  });
  const [startDate, setStartDate] = useState(startOfDay(new Date()));
  const [endDate, setEndDate] = useState(endOfDay(new Date()));

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedShops.length > 0) params.set('shops', selectedShops.join(','));
    params.set('dateType', dateFilterType);
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [selectedShops, dateFilterType]);

  const setDateRange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleDateFilterChange = (type: DateFilterType) => {
    setDateFilterType(type);
    const now = new Date();
    
    switch (type) {
      case 'daily':
        setDateRange(startOfDay(now), endOfDay(now));
        break;
      case 'weekly':
        setDateRange(startOfWeek(now, { weekStartsOn: 1 }), endOfWeek(now, { weekStartsOn: 1 }));
        break;
      case 'monthly':
        setDateRange(startOfMonth(now), endOfMonth(now));
        break;
      case 'yearly':
        setDateRange(startOfYear(now), endOfYear(now));
        break;
    }
  };

  return (
    <FilterContext.Provider
      value={{
        selectedShops,
        setSelectedShops,
        dateFilterType,
        setDateFilterType: handleDateFilterChange,
        startDate,
        endDate,
        setDateRange,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (!context) throw new Error('useFilters must be used within FilterProvider');
  return context;
}
