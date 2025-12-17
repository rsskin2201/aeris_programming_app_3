'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { ZONES, ROLES, Sector, Municipio } from '@/lib/types';
import { useAppContext } from '@/hooks/use-app-context';
import { useCollection, useFirestore } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';


const formSchema = z.object({
  id: z.string().optional(),
  nombre: z.string().min(1, 'El nombre del municipio es requerido.'),
  zona: z.string().min(1, 'La zona es requerida.'),
  sectorId: z.string().min(1, 'El sector es requerido.'),
  status: z.string().min(1, 'El estatus es requerido.'),
});

type FormValues = z.infer<typeof formSchema>;

interface MunicipioFormProps {
  municipio: Municipio | null;
  onClose: () => void;
}

const restrictedRoles = [
  ROLES.COLABORADOR,
  ROLES.GESTOR,
  ROLES.SOPORTE,
  ROLES.CALIDAD
];

export function MunicipioForm({ municipio, onClose }: MunicipioFormProps) {
  const { toast } = useToast();
  const { user, buildQuery } = useAppContext();
  const firestore = useFirestore();

  const isEditMode = !!municipio;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const sectorsQuery = useMemo(() => firestore ? query(collection(firestore, 'sectores'), ...buildQuery('sectores')) : null, [firestore, buildQuery]);
  const { data: sectors } = useCollection<Sector>(sectorsQuery);

  const selectedZone = form.watch('zona');

  const availableSectors = useMemo(() => {
    if (!sectors) return [];
    if (!selectedZone) return sectors.filter(s => s.status === 'Activo');
    return sectors.filter(s => s.zona === selectedZone && s.status === 'Activo');
  }, [sectors, selectedZone]);
  
  useEffect(() => {
    const defaultValues = {
      id: municipio?.id || `MUN-${Date.now()}`,
      nombre: municipio?.nombre || '',
      zona: municipio?.zona || '',
      sectorId: municipio?.sectorId || '',
      status: municipio?.status || 'Activo',
    };
    form.reset(defaultValues);
  }, [municipio, form]);
  
  useEffect(() => {
    // Reset sector if it's not in the available list for the selected zone
    if (selectedZone) {
      const currentSectorId = form.getValues('sectorId');
      if (currentSectorId && !availableSectors.some(s => s.id === currentSectorId)) {
        form.setValue('sectorId', '');
      }
    }
  }, [selectedZone, availableSectors, form]);
  
  const { isSubmitting } = form.formState;

  const handleUpperCase = (e: React.ChangeEvent<HTMLInputElement>, field: any) => {
    field.onChange(e.target.value.toUpperCase());
  }

  function onSubmit(values: FormValues) {
    if (!firestore) return;
    const dataToSave: Municipio = {
        ...values,
        id: values.id!,
        createdAt: municipio?.createdAt || format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
    };
    
    const docRef = doc(firestore, 'municipios', dataToSave.id);
    setDocumentNonBlocking(docRef, dataToSave, { merge: true });

    toast({
      title: isEditMode ? 'Municipio Actualizado' : 'Municipio Creado',
      description: `El municipio "${values.nombre}" se ha guardado correctamente.`,
    });

    onClose();
  }
  
  const handleReset = () => {
    const defaultValues = {
      id: municipio?.id || `MUN-${Date.now()}`,
      nombre: municipio?.nombre || '',
      zona: municipio?.zona || '',
      sectorId: municipio?.sectorId || '',
      status: municipio?.status || 'Activo',
    };
    form.reset(defaultValues);
  }

  return (
    <DialogContent className="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>{isEditMode ? 'Editar' : 'Crear'} Municipio</DialogTitle>
        <DialogDescription>
            {isEditMode ? 'Modifica los datos del municipio.' : 'Completa el formulario para dar de alta un nuevo municipio.'}
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

          <FormField control={form.control} name="nombre" render={({ field }) => (
            <FormItem>
                <FormLabel>Nombre del Municipio</FormLabel>
                <FormControl>
                    <Input 
                        {...field} 
                        placeholder="Ej. Guadalajara, Zapopan" 
                        onChange={(e) => handleUpperCase(e, field)}
                    />
                </FormControl>
                <FormMessage />
            </FormItem>
           )} />
           <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="zona" render={({ field }) => (
                <FormItem>
                    <FormLabel>Zona</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecciona una zona" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {ZONES.filter(z => z !== 'Todas las zonas').map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )} />
            <FormField control={form.control} name="sectorId" render={({ field }) => (
                <FormItem>
                    <FormLabel>Sector</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!selectedZone}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un sector" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {availableSectors.map(s => <SelectItem key={s.id} value={s.id}>{s.sector}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )} />
           </div>

           {isEditMode && municipio && (
               <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 rounded-md border bg-muted/50 p-4 text-xs text-muted-foreground">
                   <p><span className="font-semibold">Fecha Alta:</span> {municipio.createdAt}</p>
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
