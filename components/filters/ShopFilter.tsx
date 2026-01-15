'use client';

import { useEffect, useState } from 'react';
import { useFilters } from '@/lib/context/FilterContext';
import { getShops } from '@/lib/supabase/queries';
import { Shop } from '@/lib/types/database';

export function ShopFilter() {
  const { selectedShops, setSelectedShops } = useFilters();
  const [shops, setShops] = useState<Shop[]>([]);

  useEffect(() => {
    getShops().then(({ data }) => data && setShops(data));
  }, []);

  return (
    <select
      className="h-9 rounded-md border border-input bg-background px-3 text-sm"
      value={selectedShops.length === 0 ? 'all' : selectedShops[0]}
      onChange={(e) => setSelectedShops(e.target.value === 'all' ? [] : [e.target.value])}
    >
      <option value="all">All Shops</option>
      {shops.map((shop) => (
        <option key={shop.id} value={shop.id}>
          {shop.name} {shop.city && `(${shop.city})`}
        </option>
      ))}
    </select>
  );
}
