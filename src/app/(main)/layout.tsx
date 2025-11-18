'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppContext } from '@/hooks/use-app-context';
import Header from '@/components/layout/header';
import { WelcomeZoneSelector } from '@/components/layout/welcome-zone-selector';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, isZoneConfirmed } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);
  
  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <p>Cargando...</p>
      </div>
    );
  }

  if (!isZoneConfirmed) {
    return <WelcomeZoneSelector />;
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col bg-muted/40 p-4 pt-6 md:p-8">
        {children}
      </main>
    </div>
  );
}
