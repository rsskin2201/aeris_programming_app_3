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
import { ZONES } from '@/lib/types';
import { useAppContext } from '@/hooks/use-app-context';
import type { Sector } from '@/lib/mock-data';

const formSchema = z.object({
  id: z.string().optional(),
  zone: z.string().min(1, 'La zona es requerida.'),
  assignment: z.string().min(1, 'La asignación es requerida.'),
  subAssignment: z.string().min(1, 'La sub-asignación es requerida.'),
  sector: z.string().min(1, 'El sector es requerido.'),
  sectorKey: z.string().min(1, 'La clave de sector es requerida.'),
  status: z.string().min(1, 'El estatus es requerido.'),
});

interface SectorFormProps {
  sector: Sector | null;
  onClose: () => void;
}

export function SectorForm({ sector, onClose }: SectorFormProps) {
  const { toast } = useToast();
  const { user } = useAppContext();

  const isEditMode = !!sector;

  const defaultValues = useMemo(() => ({
    id: sector?.id || `SEC-${Math.floor(1000 + Math.random() * 9000)}`,
    zone: sector?.zone || '',
    assignment: sector?.assignment || '',
    subAssignment: sector?.subAssignment || '',
    sector: sector?.sector || '',
    sectorKey: sector?.sectorKey || '',
    status: sector?.status || 'Activo',
  }), [sector]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [sector, defaultValues, form]);
  
  const { isSubmitting } = form.formState;

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log({
        ...values,
        subAssignment: values.subAssignment.toUpperCase(),
        sector: values.sector.toUpperCase(),
        sectorKey: values.sectorKey.toUpperCase(),
        fecha_alta: isEditMode ? sector?.createdAt : format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        usuario_alta: isEditMode ? 'N/A (edición)' : user?.username,
        fecha_mod: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        usuario_last_mod: user?.username,
        cambio_realizado: isEditMode ? `Edición de registro` : 'Creación de registro',
    });

    toast({
      title: isEditMode ? 'Sector Actualizado' : 'Sector Creado',
      description: `El sector "${values.sector}" se ha guardado correctamente.`,
    });

    onClose();
  }
  
  const handleReset = () => {
      form.reset(defaultValues);
  }

  return (
    <DialogContent className="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>{isEditMode ? 'Editar' : 'Crear'} Sector</DialogTitle>
        <DialogDescription>
            {isEditMode ? 'Modifica los datos del sector.' : 'Completa el formulario para dar de alta un nuevo sector.'}
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
                            placeholder="Ej. Residencial Santa Fe"
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )} />

            <div className='grid grid-cols-2 gap-4'>
                 <FormField control={form.control} name="sector" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Sector</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                placeholder="Ej. Santa Fe"
                                onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="sectorKey" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Clave de Sector</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                placeholder="Ej. SF01"
                                onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>

           {isEditMode && sector && (
               <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 rounded-md border bg-muted/50 p-4 text-xs text-muted-foreground">
                   <p><span className="font-semibold">Fecha Alta:</span> {sector.createdAt}</p>
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