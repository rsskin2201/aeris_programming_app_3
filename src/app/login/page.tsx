import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { LoginForm } from '@/components/auth/login-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';

export default function LoginPage() {
  const loginBg = PlaceHolderImages.find(img => img.id === 'login-background');

  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center p-4">
      {loginBg && (
        <Image
          src={loginBg.imageUrl}
          alt={loginBg.description}
          fill
          className="object-cover -z-10 brightness-50"
          data-ai-hint={loginBg.imageHint}
          priority
        />
      )}
      <Card className="w-full max-w-md bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex items-center gap-3">
            <Icons.logo className="h-16 w-16 text-primary" />
            <h1 className="font-headline text-5xl font-bold text-primary">AERIS</h1>
          </div>
          <CardTitle className="font-headline text-2xl">Bienvenido</CardTitle>
          <CardDescription>Inicia sesión para gestionar las inspecciones.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
