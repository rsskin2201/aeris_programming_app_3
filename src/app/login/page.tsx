import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { LoginForm } from '@/components/auth/login-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
          <div className="mx-auto mb-4 flex items-center justify-center gap-3">
            <span className="text-6xl font-bold text-primary">⚡</span>
            <div className='flex flex-col'>
                <h1 className="font-headline text-5xl font-bold text-primary">Aeris</h1>
                <p className="font-headline text-3xl font-semibold text-primary/90 -mt-2">Programming</p>
            </div>
          </div>
          <CardTitle className="font-headline text-2xl">Bienvenido(a)</CardTitle>
          <CardDescription>Una App de NTTDATA</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
