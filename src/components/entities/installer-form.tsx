'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/hooks/use-app-context';
import { type Installer } from '@/lib/mock-data';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '../ui/calendar';
import { ZONES } from '@/lib/types';

const formSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'El nombre es requerido.'),
  position: z.string().min(1, 'El puesto es requerido.'),
  collaboratorCompany: z.string().min(1, 'La empresa es requerida.'),
  zone: z.string().min(1, 'La zona es requerida.'),
  certStartDate: z.date({ required_error: "La fecha de inicio es requerida." }),
  certEndDate: z.date({ required_error: "La fecha de fin es requerida." }),
  status: z.string().min(1, 'El estatus es requerido.'),
});

type FormValues = z.infer<typeof formSchema>;

interface InstallerFormProps {
  installer: Installer | null;
  onClose: () => void;
}

export function InstallerForm({ installer, onClose }: InstallerFormProps) {
  const { toast } = useToast();
  const { user, collaborators, addInstaller, updateInstaller } = useAppContext();

  const isEditMode = !!installer;

  const defaultValues = useMemo(() => {
    const parseDate = (dateStr: string | undefined) => dateStr ? parse(dateStr, 'yyyy-MM-dd', new Date()) : new Date();
    return {
      id: installer?.id || `INST-${Math.floor(1000 + Math.random() * 9000)}`,
      name: installer?.name || '',
      position: 'Instalador',
      collaboratorCompany: installer?.collaboratorCompany || '',
      zone: installer?.zone || '',
      certStartDate: parseDate(installer?.certStartDate),
      certEndDate: parseDate(installer?.certEndDate),
      status: installer?.status || 'Activo',
    }
  }, [installer]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [installer, defaultValues, form]);
  
  const { isSubmitting } = form.formState;

  const handleUpperCase = (e: React.ChangeEvent<HTMLInputElement>, field: any) => {
    field.onChange(e.target.value.toUpperCase());
  }

  function onSubmit(values: FormValues) {
    const dataToSave: Installer = {
        ...values,
        id: values.id!,
        certStartDate: format(values.certStartDate, 'yyyy-MM-dd'),
        certEndDate: format(values.certEndDate, 'yyyy-MM-dd'),
        createdAt: installer?.createdAt || format(new Date(), 'yyyy-MM-dd'),
    };
    
    if (isEditMode) {
        updateInstaller(dataToSave);
    } else {
        addInstaller(dataToSave);
    }
    
    toast({
      title: isEditMode ? 'Instalador Actualizado' : 'Instalador Creado',
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
        <DialogTitle>{isEditMode ? 'Editar' : 'Crear'} Instalador</DialogTitle>
        <DialogDescription>
            {isEditMode ? 'Modifica los datos del instalador.' : 'Completa el formulario para dar de alta un nuevo instalador.'}
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
                <FormLabel>Nombre del Instalador</FormLabel>
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
           <div className="grid grid-cols-2 gap-4">
             <FormField control={form.control} name="position" render={({ field }) => (
                <FormItem>
                    <FormLabel>Puesto</FormLabel>
                    <FormControl><Input {...field} readOnly disabled /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
            <FormField control={form.control} name="collaboratorCompany" render={({ field }) => (
                <FormItem>
                    <FormLabel>Empresa Colaboradora</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecciona una empresa" /></SelectTrigger></FormControl>
                        <SelectContent>
                        {collaborators.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )} />
           </div>
           
            <FormField control={form.control} name="zone" render={({ field }) => (
                <FormItem>
                    <FormLabel>Zona</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecciona una zona" /></SelectTrigger></FormControl>
                        <SelectContent>
                        {ZONES.filter(z => z !== 'Todas las zonas').map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
                 <FormField control={form.control} name="certStartDate" render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Inicio de Certificación</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                            {field.value ? format(field.value, "PPP", { locale: es }) : <span>Elige una fecha</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )} />
                 <FormField control={form.control} name="certEndDate" render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fin de Certificación</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                            {field.value ? format(field.value, "PPP", { locale: es }) : <span>Elige una fecha</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )} />
            </div>

           {isEditMode && installer && (
               <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 rounded-md border bg-muted/50 p-4 text-xs text-muted-foreground">
                   <p><span className="font-semibold">Fecha Alta:</span> {installer.createdAt}</p>
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