'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/hooks/use-app-context';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';

const formSchema = z.object({
  username: z.string().min(1, { message: 'Por favor, ingresa tu nombre de usuario.' }),
  password: z.string().min(1, { message: 'Por favor, ingresa tu contraseña.' }),
});

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPassOpen, setIsForgotPassOpen] = useState(false);
  const [isSubmittingForgot, setIsSubmittingForgot] = useState(false);
  const [forgotUsername, setForgotUsername] = useState('');
  
  const router = useRouter();
  const { login } = useAppContext();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const userProfile = await login(values.username, values.password);
      if (userProfile) {
        toast({
          title: 'Inicio de sesión exitoso',
          description: `Bienvenido(a), ${userProfile.name}`,
          duration: 2000,
        });
        router.push('/');
      }
    } catch (error: any) {
      console.error("Login failed:", error);
      let description = 'Ocurrió un error inesperado.';
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            description = 'Usuario o contraseña incorrectos.';
            break;
          case 'auth/invalid-email':
            description = 'El formato del usuario no es válido.';
            break;
          default:
            description = `Error de autenticación. Por favor, inténtalo de nuevo.`;
        }
      } else {
        description = error.message || description;
      }
      toast({
        variant: 'destructive',
        title: 'Error de autenticación',
        description,
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleForgotPasswordSubmit = () => {
    // This functionality would require a backend function to send a reset email.
    // For now, it will just show a confirmation toast.
    setIsSubmittingForgot(true);
    setTimeout(() => {
        toast({
            title: 'Funcionalidad no implementada',
            description: 'La recuperación de contraseña se implementará en una futura versión.'
        });
        setIsSubmittingForgot(false);
        setIsForgotPassOpen(false);
    }, 1000);
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-bold">Usuario</FormLabel>
                <FormControl>
                  <Input placeholder="tu.usuario" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-bold">Contraseña</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="******" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full !mt-6" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              'Iniciar sesión'
            )}
          </Button>
        </form>
      </Form>
      <div className="mt-4 text-center text-sm">
        <Dialog open={isForgotPassOpen} onOpenChange={setIsForgotPassOpen}>
            <DialogTrigger asChild>
                <button className="underline underline-offset-4 text-primary hover:text-destructive">
                    ¿Olvidaste tu contraseña?
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Recuperar Contraseña</DialogTitle>
                    <DialogDescription>
                        Esta función (no implementada) enviaría un correo para restablecer tu contraseña.
                    </DialogDescription>
                </DialogHeader>
                 <div className="py-4 space-y-4">
                     <div>
                        <Label htmlFor="forgot-username">Nombre de Usuario</Label>
                        <Input 
                            id="forgot-username" 
                            type="text"
                            value={forgotUsername}
                            onChange={(e) => setForgotUsername(e.target.value)}
                            placeholder="tu.usuario"
                            className="mt-2"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsForgotPassOpen(false)}>Cancelar</Button>
                    <Button onClick={handleForgotPasswordSubmit} disabled={isSubmittingForgot}>
                        {isSubmittingForgot && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Enviar Solicitud
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
