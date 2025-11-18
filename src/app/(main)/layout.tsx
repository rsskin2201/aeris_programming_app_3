'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppContext } from '@/hooks/use-app-context';
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
  
  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <p>Cargando...</p>
      </div>
    );
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
