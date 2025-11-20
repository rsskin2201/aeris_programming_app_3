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
  username: z.string().min(1, { message: 'El usuario es requerido.' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
  operatorName: z.string().optional(),
});

const forgotPasswordSchema = z.object({
    username: z.string().min(1, { message: 'Por favor, ingresa tu nombre de usuario.' }),
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
      operatorName: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setTimeout(() => {
      const user = login(values.username, values.operatorName);
      if (user) {
        toast({
          title: 'Inicio de sesión exitoso',
          description: `Bienvenido, ${values.operatorName || user.name}`,
          duration: 2000,
        });
        router.push('/');
      } else {
        toast({
          variant: 'destructive',
          title: 'Error de autenticación',
          description: 'Usuario o contraseña incorrectos. Intentos restantes: 4',
        });
        setIsLoading(false);
      }
    }, 2000);
  }

  const handleForgotPasswordSubmit = () => {
    if (!forgotUsername) {
        toast({
            variant: 'destructive',
            title: 'Campo requerido',
            description: 'Por favor, ingresa tu nombre de usuario.'
        });
        return;
    }

    setIsSubmittingForgot(true);
    setTimeout(() => {
        toast({
            title: 'Solicitud Enviada',
            description: 'Se ha enviado una notificación al administrador. Se pondrá en contacto contigo en breve.'
        });
        setIsSubmittingForgot(false);
        setIsForgotPassOpen(false);
        setForgotUsername('');
    }, 1500);
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
                <FormLabel>Usuario</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., admin, gestor, visual" {...field} />
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
                <FormLabel>Contraseña</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="******" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="operatorName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre de operador (Opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="Tu nombre" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
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
                <button className="underline underline-offset-4 hover:text-primary">
                    ¿Olvidaste tu contraseña?
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Recuperar Contraseña</DialogTitle>
                    <DialogDescription>
                        Ingresa tu nombre de usuario para solicitar un reseteo de contraseña. Se enviará una notificación al administrador.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="forgot-username">Nombre de Usuario</Label>
                    <Input 
                        id="forgot-username" 
                        value={forgotUsername}
                        onChange={(e) => setForgotUsername(e.target.value)}
                        placeholder="tu.usuario"
                        className="mt-2"
                    />
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
