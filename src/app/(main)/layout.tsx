'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/hooks/use-app-context';
import Header from '@/components/layout/header';
import { WelcomeZoneSelector } from '@/components/layout/welcome-zone-selector';
import { Loader2 } from 'lucide-react';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading, isZoneConfirmed } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);
  
  if (isUserLoading) {
     return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Cargando datos de usuario...</p>
      </div>
    );
  }

  if (!user) {
    return null; // Redirection is handled by the useEffect
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
