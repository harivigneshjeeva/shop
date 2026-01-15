'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase/client';

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    // Clear the cookie
    document.cookie = 'sb-access-token=; path=/; max-age=0';
    window.location.href = '/auth/login';
  }

  return (
    <Button
      variant="ghost"
      className="w-full justify-start text-muted-foreground hover:text-accent-foreground"
      onClick={handleLogout}
    >
      <LogOut className="h-5 w-5 mr-3" />
      Logout
    </Button>
  );
}
