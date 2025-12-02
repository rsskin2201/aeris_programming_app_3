'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { useAppContext } from '@/hooks/use-app-context';
import { useFirestore } from '@/firebase';
import Header from '@/components/layout/header';
import { WelcomeZoneSelector } from '@/components/layout/welcome-zone-selector';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, Copy, HelpCircle, User as UserIcon } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useToast } from '@/hooks/use-toast';
import { User } from '@/lib/types';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { authUser, isAuthLoading, userProfile, setUserProfile, isZoneConfirmed } = useAppContext();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const supportAvatar = PlaceHolderImages.find(img => img.id === 'support-avatar');

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copiado', description: 'El correo electrónico se ha copiado al portapapeles.' });
  }

  useEffect(() => {
    if (!isAuthLoading && !authUser) {
      router.push('/login');
    }
  }, [authUser, isAuthLoading, router]);

  useEffect(() => {
    if (authUser && !userProfile) {
      const fetchUserProfile = async () => {
        const userDocRef = doc(firestore, 'users', authUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserProfile(userDocSnap.data() as User);
        } else {
          // Handle case where user is authenticated but has no profile
          console.error("No user profile found in Firestore!");
          // Optional: redirect to a profile creation page or show an error
        }
      };
      fetchUserProfile();
    }
  }, [authUser, userProfile, firestore, setUserProfile]);
  
  if (isAuthLoading || !userProfile) {
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
          <DialogContent className="sm:max-w-lg text-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl">
                <HelpCircle className="text-primary"/>
                Soporte Técnico
              </DialogTitle>
              <DialogDescription className="text-base">
                Para dudas, aclaraciones o problemas con la plataforma, no dudes en contactarnos.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-8 pt-4 text-base">
              <div className="flex items-center gap-4">
                {supportAvatar && (
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={supportAvatar.imageUrl} alt={supportAvatar.description} data-ai-hint={supportAvatar.imageHint} />
                    <AvatarFallback><UserIcon className="h-10 w-10" /></AvatarFallback>
                  </Avatar>
                )}
                <div>
                  <h4 className="font-semibold text-xl">Ricardo González</h4>
                  <p className="text-muted-foreground">Administrador de la Plataforma</p>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <h5 className="mb-2 font-medium">Correo de Contacto</h5>
                  <div className="flex items-center justify-between rounded-md border bg-muted px-3 py-2">
                    <a href="mailto:jorge.ricardo.seichi.gonzalez.garcia@nttdata.com" className="truncate font-medium text-primary hover:underline">
                      jorge.ricardo.seichi.gonzalez.garcia@nttdata.com
                    </a>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopy('jorge.ricardo.seichi.gonzalez.garcia@nttdata.com')}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <h5 className="mb-2 font-medium">Horarios de Atención</h5>
                   <div className="rounded-md border bg-muted p-4">
                        <p className="flex items-center text-muted-foreground">
                            <Clock className="mr-2 h-5 w-5 flex-shrink-0" /> 
                            Lunes a Viernes: 09:00 a.m. - 06:00 p.m.
                        </p>
                    </div>
                </div>
              </div>
            </div>
          </DialogContent>
      </Dialog>
    </div>
  );
}
