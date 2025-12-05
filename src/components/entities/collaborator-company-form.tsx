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
import type { CollaboratorCompany } from '@/lib/mock-data';
import { useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';


const formSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'El nombre es requerido.'),
  rfc: z.string().min(12, 'El RFC debe tener al menos 12 caracteres.').max(13, 'El RFC no debe exceder 13 caracteres.'),
  zone: z.string().min(1, 'La zona es requerida.'),
  status: z.string().min(1, 'El estatus es requerido.'),
});

type FormValues = z.infer<typeof formSchema>;

interface CollaboratorCompanyFormProps {
  company: CollaboratorCompany | null;
  onClose: () => void;
}

const restrictedRoles = [
  ROLES.COLABORADOR,
  ROLES.GESTOR,
  ROLES.SOPORTE,
  ROLES.CALIDAD
];

export function CollaboratorCompanyForm({ company, onClose }: CollaboratorCompanyFormProps) {
  const { toast } = useToast();
  const { user } = useAppContext();
  const firestore = useFirestore();

  const isEditMode = !!company;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    const defaultValues = {
      id: company?.id || `EC-${Date.now()}`,
      name: company?.name || '',
      rfc: company?.rfc || '',
      zone: company?.zone || '',
      status: company?.status || 'Activa',
    };
    form.reset(defaultValues);
  }, [company, form]);
  
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
    const dataToSave: CollaboratorCompany = {
        ...values,
        id: values.id!,
        created_at: company?.created_at || format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
    };
    
    const docRef = doc(firestore, 'empresas_colaboradoras', dataToSave.id);
    setDocumentNonBlocking(docRef, dataToSave, { merge: true });
    
    toast({
      title: isEditMode ? 'Empresa Actualizada' : 'Empresa Creada',
      description: `Los datos de "${values.name}" se han guardado correctamente.`,
    });

    onClose();
  }
  
  const handleReset = () => {
    const defaultValues = {
      id: company?.id || `EC-${Date.now()}`,
      name: company?.name || '',
      rfc: company?.rfc || '',
      zone: company?.zone || '',
      status: company?.status || 'Activa',
    };
    form.reset(defaultValues);
  }

  return (
    <DialogContent className="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>{isEditMode ? 'Editar' : 'Crear'} Empresa Colaboradora</DialogTitle>
        <DialogDescription>
            {isEditMode ? 'Modifica los datos de la empresa.' : 'Completa el formulario para dar de alta una nueva empresa.'}
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
                        <SelectItem value="Activa">Activa</SelectItem>
                        <SelectItem value="Inactiva">Inactiva</SelectItem>
                        <SelectItem value="Deshabilitada">Deshabilitada</SelectItem>
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )} />
          </div>

          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
                <FormLabel>Nombre de la Empresa</FormLabel>
                <FormControl>
                    <Input 
                        {...field} 
                        placeholder="Razón Social Completa" 
                        onChange={(e) => handleUpperCase(e, field)}
                    />
                </FormControl>
                <FormMessage />
            </FormItem>
           )} />
           <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="rfc" render={({ field }) => (
                <FormItem>
                    <FormLabel>RFC</FormLabel>
                    <FormControl>
                        <Input
                             {...field}
                             placeholder="Registro Federal de Contribuyentes"
                             onChange={(e) => handleUpperCase(e, field)}
                             maxLength={13}
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )} />
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
           </div>

           {isEditMode && company && (
               <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 rounded-md border bg-muted/50 p-4 text-xs text-muted-foreground">
                   <p><span className="font-semibold">Fecha Alta:</span> {company.created_at}</p>
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
