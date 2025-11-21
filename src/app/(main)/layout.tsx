'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppContext } from '@/hooks/use-app-context';
import Header from '@/components/layout/header';
import { WelcomeZoneSelector } from '@/components/layout/welcome-zone-selector';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, Copy, HelpCircle } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useToast } from '@/hooks/use-toast';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, isZoneConfirmed } = useAppContext();
  const router = useRouter();
  const { toast } = useToast();
  const supportAvatar = PlaceHolderImages.find(img => img.id === 'support-avatar');

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copiado', description: 'El correo electrónico se ha copiado al portapapeles.' });
  }

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

       <Dialog>
          <DialogTrigger asChild>
            <Button className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-accent text-accent-foreground hover:bg-accent/90" size="icon">
                <HelpCircle className="h-7 w-7" />
                <span className="sr-only">Soporte</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <HelpCircle className="text-primary"/>
                Soporte Técnico
              </DialogTitle>
              <DialogDescription>
                Para dudas, aclaraciones o problemas con la plataforma, no dudes en contactarnos.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              <div className="flex items-center gap-4">
                {supportAvatar && (
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={supportAvatar.imageUrl} alt={supportAvatar.description} data-ai-hint={supportAvatar.imageHint} />
                    <AvatarFallback>ST</AvatarFallback>
                  </Avatar>
                )}
                <div>
                  <h4 className="font-semibold">Ricardo González</h4>
                  <p className="text-sm text-muted-foreground">Administrador de la Plataforma</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h5 className="mb-2 font-medium text-sm">Correo de Contacto</h5>
                  <div className="flex items-center justify-between rounded-md border bg-muted px-3 py-2">
                    <a href="mailto:jorge.ricardo.seichi.gonzalez.garcia@nttdata.com" className="truncate text-sm font-medium text-primary hover:underline">
                      jorge.ricardo.seichi.gonzalez.garcia@nttdata.com
                    </a>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopy('jorge.ricardo.seichi.gonzalez.garcia@nttdata.com')}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <h5 className="mb-2 font-medium text-sm">Horarios de Atención</h5>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p className="flex items-center"><Clock className="mr-2 h-4 w-4 flex-shrink-0" /> Lunes a Viernes: 09:00 a.m. - 06:00 p.m.</p>
                    <p className="flex items-center"><Clock className="mr-2 h-4 w-4 flex-shrink-0" /> Sábados: 09:00 a.m. - 01:00 p.m. <span className='ml-1 font-semibold'>(Solo Emergencias)</span></p>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
      </Dialog>
    </div>
  );
}
