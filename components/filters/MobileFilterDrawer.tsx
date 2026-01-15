'use client';

import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShopFilter } from './ShopFilter';
import { DateFilter } from './DateFilter';

export function MobileFilterDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="lg"
        onClick={() => setOpen(true)}
        className="lg:hidden w-full"
      >
        <Filter className="h-5 w-5 mr-2" />
        Filters
      </Button>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setOpen(false)}>
          <div className="fixed inset-x-0 bottom-0 bg-card rounded-t-2xl shadow-xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-card">
              <h2 className="text-lg font-semibold">Filters</h2>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Shop</label>
                <ShopFilter />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Date Range</label>
                <DateFilter />
              </div>
              <Button onClick={() => setOpen(false)} className="w-full" size="lg">
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
