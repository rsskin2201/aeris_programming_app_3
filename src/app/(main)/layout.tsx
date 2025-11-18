'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useAppContext } from '@/hooks/use-app-context';
import { AppSidebar } from '@/components/layout/app-sidebar';
import Header from '@/components/layout/header';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAppContext();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);
  
  // Update sidebar state on page change
  useEffect(() => {
    // This is a placeholder for potential logic to close mobile sidebar on nav
  }, [pathname]);

  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex flex-1 flex-col">
        <Header />
        <div className="flex-1 overflow-auto p-4 pt-6 md:p-8">
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
}
