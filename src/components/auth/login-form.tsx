'use client';

import { useEffect, useState } from 'react';
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
import { ROLES } from '@/lib/types';

const formSchema = z.object({
  username: z.string().min(1, { message: 'El nombre de usuario es requerido.' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
});

const forgotPasswordSchema = z.object({
    username: z.string().min(1, { message: 'Por favor, ingresa tu nombre de usuario.' }),
    email: z.string().email({ message: 'Por favor, ingresa un correo electrónico válido.' }),
});

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPassOpen, setIsForgotPassOpen] = useState(false);
  const [isSubmittingForgot, setIsSubmittingForgot] = useState(false);
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [operatorFullName, setOperatorFullName] = useState('');
  const router = useRouter();
  const { login, addPasswordRequest, users } = useAppContext();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const watchedUsername = form.watch('username');

  useEffect(() => {
    const foundUser = users.find(u => u.username.toLowerCase() === watchedUsername.toLowerCase());
    setOperatorFullName(foundUser ? foundUser.name : '');
  }, [watchedUsername, users]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const user = await login(values.username, values.password);
    if (user) {
      toast({
        title: 'Inicio de sesión exitoso',
        description: `Bienvenido(a), ${user.name}`,
        duration: 2000,
      });
      router.push('/');
    } else {
      toast({
        variant: 'destructive',
        title: 'Error de autenticación',
        description: 'Usuario o contraseña incorrectos.',
      });
      setIsLoading(false);
    }
  }

  const handleForgotPasswordSubmit = () => {
    const result = forgotPasswordSchema.safeParse({ username: forgotUsername, email: forgotEmail });

    if (!result.success) {
        const errors = result.error.format();
        toast({
            variant: 'destructive',
            title: 'Campos inválidos',
            description: errors.username?._errors[0] || errors.email?._errors[0] || 'Por favor revisa los campos.',
        });
        return;
    }

    setIsSubmittingForgot(true);
    setTimeout(() => {
        addPasswordRequest({ username: forgotUsername, email: forgotEmail, recipientRole: ROLES.ADMIN });
        toast({
            title: 'Solicitud Enviada',
            description: 'Se ha enviado una notificación al administrador. Se pondrá en contacto contigo en breve.'
        });
        setIsSubmittingForgot(false);
        setIsForgotPassOpen(false);
        setForgotUsername('');
        setForgotEmail('');
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
                <FormLabel className="text-base font-bold">Nombre de usuario</FormLabel>
                <FormControl>
                  <Input placeholder="usuario.alias" {...field} />
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
           <div className="space-y-2">
            <Label className="text-base font-bold">Nombre</Label>
            <Input value={operatorFullName} disabled placeholder="El nombre aparecerá aquí" className="bg-muted/70"/>
           </div>
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
                        Ingresa tus datos para solicitar un reseteo. Se enviará una notificación al administrador.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div>
                        <Label htmlFor="forgot-username">Nombre de Usuario</Label>
                        <Input 
                            id="forgot-username" 
                            value={forgotUsername}
                            onChange={(e) => setForgotUsername(e.target.value)}
                            placeholder="tu.usuario.alias"
                            className="mt-2"
                        />
                    </div>
                     <div>
                        <Label htmlFor="forgot-email">Correo Electrónico de Contacto</Label>
                        <Input 
                            id="forgot-email" 
                            type="email"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            placeholder="tu@correo.com"
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
