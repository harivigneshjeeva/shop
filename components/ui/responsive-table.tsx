import { ReactNode } from 'react';

interface ResponsiveTableProps {
  children: ReactNode;
}

export function ResponsiveTable({ children }: ResponsiveTableProps) {
  return (
    <div className="w-full overflow-x-auto -mx-4 lg:mx-0">
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 lg:rounded-lg">
          {children}
        </div>
      </div>
    </div>
  );
}
