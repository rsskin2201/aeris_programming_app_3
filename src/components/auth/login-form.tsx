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
  const [forgotEmail, setForgotEmail] = useState('');
  
  const router = useRouter();
  const { login, requestPasswordReset } = useAppContext();
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
      toast({
        variant: 'destructive',
        title: 'Error de autenticación',
        description: error.message || 'Ocurrió un error inesperado.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleForgotPasswordSubmit = () => {
    if (!forgotUsername || !forgotEmail) {
        toast({
            variant: 'destructive',
            title: 'Campos incompletos',
            description: 'Por favor, ingresa tu usuario y correo electrónico.'
        });
        return;
    }

    setIsSubmittingForgot(true);
    requestPasswordReset(forgotUsername, forgotEmail);
    
    setTimeout(() => {
        toast({
            title: 'Solicitud Enviada',
            description: 'Se ha notificado al administrador para restablecer tu contraseña.'
        });
        setIsSubmittingForgot(false);
        setIsForgotPassOpen(false);
        setForgotUsername('');
        setForgotEmail('');
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
                        Ingresa tu usuario y correo electrónico. El administrador será notificado para restablecer tu contraseña.
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
                     <div>
                        <Label htmlFor="forgot-email">Correo Electrónico</Label>
                        <Input 
                            id="forgot-email" 
                            type="email"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            placeholder="tu.correo@ejemplo.com"
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
