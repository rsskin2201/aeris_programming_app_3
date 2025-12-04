'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/types';
import { ROLES, ZONES, USER_STATUS } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { RotateCcw, ShieldAlert } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useAuth } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useAppContext } from '@/contexts/app-provider';


const formSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido.'),
  username: z.string().min(1, 'El nombre de usuario es requerido.'),
  email: z.string().email('El correo electrónico no es válido.'),
  role: z.nativeEnum(ROLES),
  zone: z.nativeEnum(ZONES),
  status: z.nativeEnum(USER_STATUS),
  password: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface UserFormProps {
  user: User | null;
  onClose: () => void;
}

export function UserForm({ user, onClose }: UserFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const auth = useAuth();
  const { addMultipleUsers } = useAppContext();

  const usersQuery = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);
  const { data: users } = useCollection<User>(usersQuery);

  const [newPassword, setNewPassword] = useState('');

  const isEditMode = !!user;

  const defaultValues = useMemo(() => ({
    name: user?.name || '',
    username: user?.username || '',
    email: user?.email || '',
    role: user?.role || ROLES.GESTOR,
    zone: user?.zone || ZONES[0],
    status: user?.status || USER_STATUS.ACTIVO,
    password: '',
  }), [user]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  
  useEffect(() => {
    form.reset(defaultValues);
    setNewPassword('');
  }, [user, defaultValues, form]);
  
  const { isSubmitting } = form.formState;

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(password);
    form.setValue('password', password, { shouldValidate: true });
  }
  
  async function onSubmit(values: FormValues) {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'El servicio de base de datos no está disponible.'});
      return;
    }

    if (!isEditMode && users?.some(u => u.username === values.username)) {
      form.setError('username', { type: 'manual', message: 'Este nombre de usuario ya existe.' });
      return;
    }
    
    if (!isEditMode && (!values.password || values.password.length < 6)) {
        form.setError('password', { type: 'manual', message: 'La contraseña es requerida y debe tener al menos 6 caracteres.' });
        return;
    }
    
    try {
        let userId = user?.id;
        if (!isEditMode) {
             addMultipleUsers([values as Omit<User, 'id'>]);
        } else if (userId) {
             const dataToSave: Partial<User> = {
                name: values.name,
                role: values.role,
                zone: values.zone,
                status: values.status,
            };
            const userDocRef = doc(firestore, 'users', userId);
            updateDocumentNonBlocking(userDocRef, dataToSave);
        }
        
        toast({
          title: isEditMode ? 'Usuario Actualizado' : 'Usuario Creado',
          description: `Los datos de "${values.name}" se han guardado correctamente.`,
        });

        onClose();

    } catch (error: any) {
        console.error("Error saving user:", error);
        toast({
            variant: "destructive",
            title: "Error al guardar",
            description: error.message || "Ocurrió un error inesperado.",
        })
    }
  }
  
  const handleReset = () => {
      form.reset(defaultValues);
      setNewPassword('');
  }

  return (
    <DialogContent className="sm:max-w-[480px]">
      <DialogHeader>
        <DialogTitle>{isEditMode ? 'Editar' : 'Crear'} Usuario</DialogTitle>
        <DialogDescription>
            {isEditMode ? 'Modifica los datos del usuario.' : 'Completa el formulario para dar de alta un nuevo usuario.'}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                    <FormLabel>Nombre Completo</FormLabel>
                    <FormControl><Input {...field} placeholder="Nombre del usuario" /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
            <FormField control={form.control} name="username" render={({ field }) => (
                <FormItem>
                    <FormLabel>Nombre de Usuario</FormLabel>
                    <FormControl><Input {...field} placeholder="alias.de.usuario" disabled={isEditMode} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                    <FormLabel>Correo Electrónico</FormLabel>
                    <FormControl><Input type="email" {...field} placeholder="usuario@ejemplo.com" disabled={isEditMode} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
            <div className='grid grid-cols-2 gap-4'>
                <FormField control={form.control} name="role" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Rol</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un rol" /></SelectTrigger></FormControl>
                            <SelectContent>
                                {Object.values(ROLES).map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="zone" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Zona</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Selecciona una zona" /></SelectTrigger></FormControl>
                            <SelectContent>
                                {Object.values(ZONES).map(zone => <SelectItem key={zone} value={zone}>{zone}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>

            <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                    <FormLabel>Estatus</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un estatus" /></SelectTrigger></FormControl>
                        <SelectContent>
                            {Object.values(USER_STATUS).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )} />

            {!isEditMode && (
                <>
                     <FormField control={form.control} name="password" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Contraseña</FormLabel>
                             <div className="flex gap-2">
                                <FormControl><Input {...field} value={newPassword} readOnly placeholder="Generada automáticamente" /></FormControl>
                                <Button type="button" variant="secondary" onClick={generatePassword}>Generar</Button>
                             </div>
                            <FormMessage />
                        </FormItem>
                    )} />
                     {newPassword && (
                         <Alert>
                            <ShieldAlert className="h-4 w-4" />
                            <AlertTitle>Contraseña Generada</AlertTitle>
                            <AlertDescription>
                                Copia y guarda esta contraseña para el nuevo usuario.
                            </AlertDescription>
                        </Alert>
                    )}
                </>
            )}

          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={handleReset} disabled={isSubmitting}>
                <RotateCcw className="mr-2 h-4 w-4"/>
                Limpiar
            </Button>
            <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>Guardar</Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}
