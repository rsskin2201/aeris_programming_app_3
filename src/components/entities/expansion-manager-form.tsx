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
import { ZONES, Zone } from '@/lib/types';
import { useAppContext } from '@/hooks/use-app-context';
import type { ExpansionManager } from '@/lib/mock-data';

const formSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'El nombre es requerido.'),
  position: z.string().min(1, 'El puesto es requerido.'),
  zone: z.string().min(1, 'La zona es requerida.'),
  assignment: z.string().min(1, 'La asignación es requerida.'),
  subAssignment: z.string().min(1, 'La sub-asignación es requerida.'),
  status: z.string().min(1, 'El estatus es requerido.'),
});

interface ExpansionManagerFormProps {
  manager: ExpansionManager | null;
  onClose: () => void;
}

export function ExpansionManagerForm({ manager, onClose }: ExpansionManagerFormProps) {
  const { toast } = useToast();
  const { user } = useAppContext();

  const isEditMode = !!manager;

  const defaultValues = useMemo(() => ({
    id: manager?.id || `GE-${Math.floor(1000 + Math.random() * 9000)}`,
    name: manager?.name || '',
    position: 'Gestor de Expansion',
    zone: manager?.zone || '',
    assignment: manager?.assignment || '',
    subAssignment: manager?.subAssignment || '',
    status: manager?.status || 'Activo',
  }), [manager]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [manager, defaultValues, form]);
  
  const { isSubmitting } = form.formState;
  
  const handleUpperCase = (e: React.ChangeEvent<HTMLInputElement>, field: any) => {
    field.onChange(e.target.value.toUpperCase());
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log({
        ...values,
        fecha_alta: isEditMode ? manager?.createdAt : format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        usuario_alta: isEditMode ? 'N/A (edición)' : user?.username,
        fecha_mod: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        usuario_last_mod: user?.username,
        cambio_realizado: isEditMode ? `Edición de registro` : 'Creación de registro',
    });

    toast({
      title: isEditMode ? 'Gestor Actualizado' : 'Gestor Creado',
      description: `Los datos de "${values.name}" se han guardado correctamente.`,
    });

    onClose();
  }
  
  const handleReset = () => {
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecciona una zona" /></SelectTrigger></FormControl>
                        <SelectContent>
                        {ZONES.map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )} />
             <FormField control={form.control} name="assignment" render={({ field }) => (
                <FormItem>
                    <FormLabel>Asignación</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                   <p><span className="font-semibold">Fecha Últ. Mod.:</span> {format(new Date(), 'yyyy-MM-dd HH:mm')}</p>
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
