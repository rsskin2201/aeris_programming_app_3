'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ZONES, ROLES } from '@/lib/types';
import { useAppContext } from '@/hooks/use-app-context';
import type { ExpansionManager } from '@/lib/mock-data';
import { useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

const formSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'El nombre es requerido.'),
  position: z.string().min(1, 'El puesto es requerido.'),
  zone: z.string().min(1, 'La zona es requerida.'),
  assignment: z.string().min(1, 'La asignación es requerida.'),
  subAssignment: z.string().min(1, 'La sub-asignación es requerida.'),
  status: z.string().min(1, 'El estatus es requerido.'),
});

type FormValues = z.infer<typeof formSchema>;

interface ExpansionManagerFormProps {
  manager: ExpansionManager | null;
  onClose: () => void;
}

const restrictedRoles = [
  ROLES.COLABORADOR,
  ROLES.GESTOR,
  ROLES.SOPORTE,
  ROLES.CALIDAD
];

export function ExpansionManagerForm({ manager, onClose }: ExpansionManagerFormProps) {
  const { toast } = useToast();
  const { user } = useAppContext();
  const firestore = useFirestore();

  const isEditMode = !!manager;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    const defaultValues = {
      id: manager?.id || `GE-${Date.now()}`,
      name: manager?.name || '',
      position: 'Gestor de Expansion',
      zone: manager?.zone || '',
      assignment: manager?.assignment || '',
      subAssignment: manager?.subAssignment || '',
      status: manager?.status || 'Activo',
    };
    form.reset(defaultValues);
  }, [manager, form]);
  
  const { isSubmitting } = form.formState;
  
  const availableZones = useMemo(() => {
    if (user && restrictedRoles.includes(user.role)) {
      return ZONES.filter(z => z !== 'Todas las zonas');
    }
    return ZONES;
  }, [user]);

  const handleUpperCase = (e: React.ChangeEvent<HTMLInputElement>, field: any) => {
    field.onChange(e.target.value.toUpperCase());
  }

  function onSubmit(values: FormValues) {
    if (!firestore) return;
    const dataToSave: ExpansionManager = {
        ...values,
        id: values.id!,
        createdAt: manager?.createdAt || format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
    };

    const docRef = doc(firestore, 'gestores_expansion', dataToSave.id);
    setDocumentNonBlocking(docRef, dataToSave, { merge: true });

    toast({
      title: isEditMode ? 'Gestor Actualizado' : 'Gestor Creado',
      description: `Los datos de "${values.name}" se han guardado correctamente.`,
    });

    onClose();
  }
  
  const handleReset = () => {
    const defaultValues = {
      id: manager?.id || `GE-${Date.now()}`,
      name: manager?.name || '',
      position: 'Gestor de Expansion',
      zone: manager?.zone || '',
      assignment: manager?.assignment || '',
      subAssignment: manager?.subAssignment || '',
      status: manager?.status || 'Activo',
    };
    form.reset(defaultValues);
  }

  return (
    <DialogContent className="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>{isEditMode ? 'Editar' : 'Crear'} Gestor de Expansión</DialogTitle>
        <DialogDescription>
            {isEditMode ? 'Modifica los datos del gestor.' : 'Completa el formulario para dar de alta un nuevo gestor.'}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="id" render={({ field }) => (
                <FormItem>
                    <FormLabel>ID</FormLabel>
                    <FormControl><Input {...field} readOnly disabled /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
            <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                    <FormLabel>Estatus</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un estatus" /></SelectTrigger></FormControl>
                    <SelectContent>
                        <SelectItem value="Activo">Activo</SelectItem>
                        <SelectItem value="Inactivo">Inactivo</SelectItem>
                        <SelectItem value="Deshabilitado">Deshabilitado</SelectItem>
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )} />
          </div>

          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
                <FormLabel>Nombre del Gestor</FormLabel>
                <FormControl>
                    <Input 
                        {...field} 
                        placeholder="Nombre completo" 
                        onChange={(e) => handleUpperCase(e, field)}
                    />
                </FormControl>
                <FormMessage />
            </FormItem>
           )} />
            <FormField control={form.control} name="position" render={({ field }) => (
            <FormItem>
                <FormLabel>Puesto</FormLabel>
                <FormControl><Input {...field} readOnly disabled /></FormControl>
                <FormMessage />
            </FormItem>
            )} />
           <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="zone" render={({ field }) => (
                <FormItem>
                    <FormLabel>Zona</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecciona una zona" /></SelectTrigger></FormControl>
                        <SelectContent>
                        {availableZones.map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )} />
             <FormField control={form.control} name="assignment" render={({ field }) => (
                <FormItem>
                    <FormLabel>Asignación</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecciona una asignación" /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="Expansión">Expansión</SelectItem>
                            <SelectItem value="Saturación">Saturación</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )} />
           </div>
            <FormField control={form.control} name="subAssignment" render={({ field }) => (
                <FormItem>
                    <FormLabel>Sub-Asignación</FormLabel>
                    <FormControl>
                        <Input
                                {...field}
                                placeholder="Ej: Sector Residencial"
                                onChange={(e) => handleUpperCase(e, field)}
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )} />

           {isEditMode && manager && (
               <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 rounded-md border bg-muted/50 p-4 text-xs text-muted-foreground">
                   <p><span className="font-semibold">Fecha Alta:</span> {manager.createdAt}</p>
                   <p><span className="font-semibold">Usuario Alta:</span> N/A</p>
                   <p><span className="font-semibold">Fecha Últ. Mod.:</span> {format(new Date(), 'yyyy-MM-dd HH:mm:ss')}</p>
                   <p><span className="font-semibold">Usuario Últ. Mod.:</span> {user?.username}</p>
               </div>
           )}

          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={handleReset} disabled={isSubmitting}>Limpiar</Button>
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
