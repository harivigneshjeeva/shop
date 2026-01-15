import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { AuthCheck } from '@/components/layout/AuthCheck';
import { ToastProvider } from '@/lib/context/ToastContext';
import { SettingsProvider } from '@/lib/context/SettingsContext';
import { OfflineIndicator } from '@/components/layout/OfflineIndicator';
import { InstallPrompt } from '@/components/layout/InstallPrompt';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthCheck>
      <SettingsProvider>
        <ToastProvider>
          <div className="flex">
            <Sidebar />
            <MobileNav />
            <main className="flex-1 p-4 lg:p-8 overflow-auto pt-16 lg:pt-8">{children}</main>
          </div>
          <OfflineIndicator />
          <InstallPrompt />
        </ToastProvider>
      </SettingsProvider>
    </AuthCheck>
  );
}
