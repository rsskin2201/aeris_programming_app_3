'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { CalendarIcon, ChevronLeft, FileUp, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format, isSunday, parse, isBefore, set, endOfDay } from "date-fns";
import { es } from 'date-fns/locale';
import React, { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/hooks/use-app-context";
import { ROLES, Role, STATUS } from "@/lib/types";
import { sampleInstallers, sampleCollaborators, sampleSectors, mockMunicipalities, sampleExpansionManagers, InspectionRecord } from "@/lib/mock-data";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { TIPO_PROGRAMACION_PES, TIPO_MDD, MERCADO } from "@/lib/form-options";

const formSchema = z.object({
  id: z.string().optional(),
  zone: z.string(),
  sector: z.string().min(1, "El sector es requerido."),
  poliza: z.string().optional(),
  caso: z.string().max(11, 'El caso no debe exceder los 11 caracteres.').optional().refine(val => !val || /^AT-\d{7}$/.test(val), {
    message: 'El formato debe ser AT-XXXXXXX'
  }),
  municipality: z.string().min(1, "El municipio es requerido."),
  colonia: z.string().min(1, "La colonia es requerida."),
  calle: z.string().min(1, "La calle es requerida."),
  numero: z.string().min(1, "El número es requerido."),
  portal: z.string().optional(),
  escalera: z.string().optional(),
  piso: z.string().optional(),
  puerta: z.string().optional(),
  
  tipoInspeccion: z.string().min(1, "El tipo de inspección es requerido."),
  tipoProgramacion: z.string().min(1, "El tipo de programación es requerido."),
  tipoMdd: z.string().min(1, "El tipo de MDD es requerido."),
  mercado: z.string().min(1, "El mercado es requerido."),
  oferta: z.string().optional(),

  empresaColaboradora: z.string().min(1, "La empresa colaboradora es requerida."),
  fechaProgramacion: z.date({ required_error: "La fecha de programación es requerida." }),
  horarioProgramacion: z.string().min(1, "El horario es requerido."),
  instalador: z.string().min(1, "El instalador es requerido."),
  gestor: z.string().min(1, "El gestor es requerido."),
  
  status: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

const editableStatuses = [STATUS.EN_PROCESO, STATUS.PROGRAMADA, STATUS.CONFIRMADA_POR_GE, STATUS.REGISTRADA];

export default function IndividualInspectionPage() {
  const { toast } = useToast();
  const { user, weekendsEnabled, blockedDays, getRecordById, updateRecord, zone } = useAppContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageMode, setPageMode] = useState<'new' | 'view' | 'edit'>('new');
  const [currentRecord, setCurrentRecord] = useState<InspectionRecord | null>(null);

  const getInitialStatus = (role: Role | undefined) => {
    if (pageMode !== 'new') return currentRecord?.status || '';
    switch (role) {
      case ROLES.GESTOR: return STATUS.CONFIRMADA_POR_GE;
      case ROLES.COLABORADOR:
      default: return STATUS.REGISTRADA;
    }
  };

  const generateId = () => `INSP-PS-${Date.now()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

  const defaultValues = useMemo(() => {
    const dateParam = searchParams.get('date');
    const timeParam = searchParams.get('time');

    return {
      id: generateId(),
      zone: zone,
      poliza: "",
      caso: "",
      municipality: "",
      colonia: "",
      calle: "",
      numero: "",
      portal: "",
      escalera: "",
      piso: "",
      puerta: "",
      tipoInspeccion: "Programacion PES",
      tipoProgramacion: "",
      tipoMdd: "",
      mercado: "",
      oferta: "",
      empresaColaboradora: "",
      fechaProgramacion: dateParam ? parse(dateParam, 'yyyy-MM-dd', new Date()) : undefined,
      horarioProgramacion: timeParam || "",
      instalador: "",
      gestor: "",
      sector: "",
      status: getInitialStatus(user?.role),
    }
  }, [zone, user?.role]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: 'onChange',
  });
  
  useEffect(() => {
    const recordId = searchParams.get('id');
    const mode = searchParams.get('mode');

    if (recordId) {
        const record = getRecordById(recordId);
        if (record) {
            setCurrentRecord(record);
            setPageMode(mode === 'view' ? 'view' : 'edit');
            form.reset({
                ...record,
                fechaProgramacion: parse(record.requestDate, 'yyyy-MM-dd', new Date()),
                // This is a simplification. A real app might need to parse time.
                horarioProgramacion: '09:00',
                zone: record.zone,
            });
        }
    } else {
        setPageMode('new');
        form.reset({
            ...defaultValues,
            id: generateId(),
            status: getInitialStatus(user?.role),
            zone: zone,
        });
    }
}, [searchParams, getRecordById, form, user?.role, defaultValues, zone]);


  const isFieldDisabled = (fieldName: keyof FormValues): boolean => {
    if (pageMode === 'view') return true;
    if (pageMode === 'edit' && currentRecord) {
        const canEdit = editableStatuses.includes(currentRecord.status as any);
        if (!canEdit) return true;

        const now = new Date();
        const eighteenHoursBefore = set(parse(currentRecord.requestDate, 'yyyy-MM-dd', new Date()), { hours: -6 }); // 18:00 prev day

        switch (fieldName) {
            case 'status':
                return ![ROLES.ADMIN, ROLES.SOPORTE, ROLES.CALIDAD].includes(user!.role);
            case 'gestor':
                return ![ROLES.ADMIN, ROLES.SOPORTE].includes(user!.role);
            case 'empresaColaboradora':
                return ![ROLES.GESTOR, ROLES.ADMIN, ROLES.SOPORTE].includes(user!.role);
            case 'poliza':
            case 'caso':
                return ![ROLES.COLABORADOR, ROLES.GESTOR, ROLES.SOPORTE, ROLES.ADMIN].includes(user!.role);
            case 'tipoInspeccion':
                return !currentRecord.id.startsWith("INSP-PS");
            case 'fechaProgramacion':
            case 'horarioProgramacion':
                if (user?.role === ROLES.COLABORADOR) {
                    return isBefore(now, eighteenHoursBefore);
                }
                return false; // Gestor y Admin pueden modificar
            case 'municipality':
            case 'colonia':
            case 'calle':
            case 'numero':
                if (user?.role === ROLES.COLABORADOR) {
                    return isBefore(now, eighteenHoursBefore);
                }
                return false;
             case 'sector':
             case 'instalador':
                return false; // Modificable si el status lo permite
            default:
                return false; // Por defecto no se bloquea si el status es editable
        }
    }
    return false; // Modo 'new'
  };
  
  const formData = form.watch();
  
  const availableSectors = useMemo(() => {
    const currentZone = formData.zone;
    if (currentZone === 'Todas las zonas') {
        return sampleSectors;
    }
    return sampleSectors.filter(s => s.zone === currentZone);
  }, [formData.zone]);

  const handlePreview = () => {
      form.trigger().then(isValid => {
          if (isValid) {
              setIsConfirming(true);
          } else {
               toast({
                variant: "destructive",
                title: "Errores en el formulario",
                description: "Por favor, revisa los campos marcados en rojo y corrige los errores antes de continuar.",
            });
          }
      })
  }
  
  function onFinalSubmit(values: FormValues) {
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
        const recordToSave = {
            ...values,
            client: 'Cliente (TBD)', // Placeholder
            address: `${values.calle} ${values.numero}, ${values.colonia}`,
            requestDate: format(values.fechaProgramacion, 'yyyy-MM-dd'),
            type: 'Individual PES' as const,
            createdAt: currentRecord?.createdAt || format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
            createdBy: currentRecord?.createdBy || user?.username || 'desconocido',
            inspector: currentRecord?.inspector || 'N/A', // Placeholder
            zone: values.zone,
        };

        if (pageMode === 'edit' && currentRecord) {
            updateRecord(recordToSave as InspectionRecord);
        } else {
            // Here you would call a function to add a new record to the context
            console.log("Creating new record:", recordToSave);
        }

        toast({
          title: pageMode === 'edit' ? "Solicitud Actualizada" : "Solicitud Enviada",
          description: `La solicitud con ID ${values.id} se ${pageMode === 'edit' ? 'actualizó' : 'creó'} con estatus: ${values.status}.`,
        });

        setIsSubmitting(false);
        setIsConfirming(false);
        router.push('/records');
    }, 1500);
  }

  const handleReset = () => {
    if (pageMode === 'new') {
        const newId = generateId();
        form.reset({
            ...defaultValues,
            id: newId,
            status: getInitialStatus(user?.role)
        });
    } else {
        form.reset(); // Resets to the loaded record data
    }
  }
  
  const handleUpperCase = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: any) => {
      field.onChange(e.target.value.toUpperCase());
  }
  
  const renderFieldWithFeedback = (fieldName: keyof FormValues, fieldLabel: string, value: any) => {
      const { errors, touchedFields } = form.formState;
      const isTouched = touchedFields[fieldName];
      const error = errors[fieldName];
      const displayValue = value instanceof Date ? format(value, "PPP", { locale: es }) : value || <span className="text-muted-foreground">No especificado</span>;

      return (
         <div className="flex items-start justify-between py-2 border-b">
            <span className="text-sm font-medium text-muted-foreground">{fieldLabel}</span>
             <div className="text-right flex items-center gap-2">
                <span className="text-sm font-semibold">{displayValue}</span>
                 {(pageMode !== 'view' && isTouched) && (
                    <div className="w-4 h-4">
                        {error ? <AlertCircle className="text-destructive" /> : <CheckCircle className="text-green-500" />}
                    </div>
                )}
            </div>
        </div>
      );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/records">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="font-headline text-3xl font-semibold">
            {pageMode === 'new' && 'Programación Individual de PES'}
            {pageMode === 'view' && 'Visualizar Inspección Individual'}
            {pageMode === 'edit' && 'Modificar Inspección Individual'}
          </h1>
          <p className="text-muted-foreground">
             {pageMode === 'new' && 'Formulario para una Puesta en Servicio en campo.'}
             {pageMode === 'view' && 'Consulta de los detalles de una inspección registrada.'}
             {pageMode === 'edit' && 'Modificación de los detalles de una inspección.'}
          </p>
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={(e) => { e.preventDefault(); handlePreview() }} className="space-y-8">

            <Card>
              <CardHeader>
                <CardTitle>Ubicación del Servicio</CardTitle>
                <CardDescription>Dirección donde se realizará la inspección.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                 <FormField control={form.control} name="id" render={({ field }) => (
                    <FormItem>
                        <FormLabel>ID de Registro</FormLabel>
                        <FormControl><Input {...field} readOnly disabled className="font-mono bg-muted/50" /></FormControl>
                    </FormItem>
                )} />
                <FormField control={form.control} name="zone" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Zona</FormLabel>
                        <FormControl><Input {...field} readOnly disabled className="bg-muted/50" /></FormControl>
                    </FormItem>
                )} />
                 <FormField control={form.control} name="sector" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sector</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={isFieldDisabled('sector')}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un sector" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {availableSectors.map(s => <SelectItem key={s.id} value={s.sector}>{s.sector} ({s.sectorKey})</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                 <FormField control={form.control} name="poliza" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Póliza</FormLabel>
                        <FormControl><Input placeholder="Opcional" {...field} type="text" disabled={isFieldDisabled('poliza')} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="caso" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Caso (AT)</FormLabel>
                        <FormControl><Input placeholder="Ej. AT-1234567" {...field} maxLength={11} disabled={isFieldDisabled('caso')} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <FormField control={form.control} name="municipality" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Municipio</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isFieldDisabled('municipality')}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un municipio" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {mockMunicipalities.map(m => <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                 <FormField control={form.control} name="colonia" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Colonia</FormLabel>
                        <FormControl><Input placeholder="Colonia" {...field} onChange={(e) => handleUpperCase(e, field)} disabled={isFieldDisabled('colonia')} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <div className="md:col-span-2 grid md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="calle" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Calle</FormLabel>
                            <FormControl><Input placeholder="Nombre de la calle" {...field} onChange={(e) => handleUpperCase(e, field)} disabled={isFieldDisabled('calle')}/></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="numero" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Número</FormLabel>
                            <FormControl><Input placeholder="Número exterior/interior" {...field} onChange={(e) => handleUpperCase(e, field)} disabled={isFieldDisabled('numero')} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                 <FormField control={form.control} name="portal" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Portal (Opcional)</FormLabel>
                        <FormControl><Input {...field} onChange={(e) => handleUpperCase(e, field)} disabled={isFieldDisabled('portal')} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="escalera" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Escalera (Opcional)</FormLabel>
                        <FormControl><Input {...field} onChange={(e) => handleUpperCase(e, field)} disabled={isFieldDisabled('escalera')} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="piso" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Piso (Opcional)</FormLabel>
                        <FormControl><Input {...field} onChange={(e) => handleUpperCase(e, field)} disabled={isFieldDisabled('piso')} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="puerta" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Puerta (Opcional)</FormLabel>
                        <FormControl><Input {...field} onChange={(e) => handleUpperCase(e, field)} disabled={isFieldDisabled('puerta')} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalles de la Programación</CardTitle>
                <CardDescription>Información técnica y de clasificación del servicio.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                 <FormField control={form.control} name="tipoInspeccion" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Inspección</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={isFieldDisabled('tipoInspeccion')}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un tipo" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Programacion PES">Programacion PES</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="tipoProgramacion" render={({ field }) => (
                   <FormItem>
                    <FormLabel>Tipo de Programación</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isFieldDisabled('tipoProgramacion')}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un tipo" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {TIPO_PROGRAMACION_PES.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                 <FormField control={form.control} name="tipoMdd" render={({ field }) => (
                   <FormItem>
                    <FormLabel>Tipo MDD</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isFieldDisabled('tipoMdd')}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un tipo" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {TIPO_MDD.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                 <FormField control={form.control} name="mercado" render={({ field }) => (
                   <FormItem>
                    <FormLabel>Mercado</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isFieldDisabled('mercado')}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un mercado" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {MERCADO.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="oferta" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Oferta/Campaña</FormLabel>
                        <FormControl><Input {...field} onChange={(e) => handleUpperCase(e, field)} disabled={isFieldDisabled('oferta')}/></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Asignación y Estatus</CardTitle>
                <CardDescription>Asignación de responsables y fecha de ejecución.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                 <FormField control={form.control} name="empresaColaboradora" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa Colaboradora</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isFieldDisabled('empresaColaboradora')}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecciona una empresa" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {sampleCollaborators.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                 <FormField control={form.control} name="instalador" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instalador</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isFieldDisabled('instalador')}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un instalador" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {sampleInstallers.map(i => <SelectItem key={i.id} value={i.name}>{i.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="fechaProgramacion" render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha Programación</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")} disabled={isFieldDisabled('fechaProgramacion')}>
                            {field.value ? format(field.value, "PPP", { locale: es }) : <span>Elige una fecha</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar 
                          mode="single" 
                          selected={field.value} 
                          onSelect={field.onChange} 
                          disabled={(date) => {
                            const dateKey = format(date, 'yyyy-MM-dd');
                            if (blockedDays[dateKey]) return true;
                            if (isSunday(date) && !weekendsEnabled) return true;
                            return date < new Date(new Date().setDate(new Date().getDate() - 1));
                          }}
                          initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="horarioProgramacion" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Horario Programación</FormLabel>
                        <FormControl>
                            <Input type="time" {...field} disabled={isFieldDisabled('horarioProgramacion')} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="gestor" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gestor</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isFieldDisabled('gestor')}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un gestor" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {sampleExpansionManagers.map(i => <SelectItem key={i.id} value={i.name}>{i.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                 <FormField control={form.control} name="status" render={({ field }) => (
                   <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isFieldDisabled('status')}>
                      <FormControl>
                          <SelectTrigger><SelectValue placeholder="Selecciona un estado" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(STATUS).filter(s => typeof s === 'string').map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                     </Select>
                    <FormMessage />
                  </FormItem>
                )} />

              </CardContent>
            </Card>

            {pageMode !== 'view' && (
              <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={handleReset} disabled={isSubmitting}>Limpiar</Button>
                  <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>Cancelar</Button>
                  <Dialog open={isConfirming} onOpenChange={setIsConfirming}>
                      <DialogTrigger asChild>
                          <Button type="button" onClick={handlePreview} disabled={isSubmitting}>
                              Guardar
                          </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-xl">
                          <DialogHeader>
                              <DialogTitle>Confirmar {pageMode === 'edit' ? 'Modificación' : 'Creación'} de Inspección</DialogTitle>
                              <DialogDescription>
                                  Revisa los datos del formulario antes de confirmar la solicitud.
                              </DialogDescription>
                          </DialogHeader>
                          <div className="max-h-[50vh] overflow-y-auto p-1 pr-4">
                              <h3 className="font-semibold text-lg mb-2">Ubicación del Servicio</h3>
                              {renderFieldWithFeedback('id', 'ID de Registro', formData.id)}
                              {renderFieldWithFeedback('zone', 'Zona', formData.zone)}
                              {renderFieldWithFeedback('sector', 'Sector', formData.sector)}
                              {renderFieldWithFeedback('poliza', 'Póliza', formData.poliza)}
                              {renderFieldWithFeedback('caso', 'Caso (AT)', formData.caso)}
                              {renderFieldWithFeedback('municipality', 'Municipio', formData.municipality)}
                              {renderFieldWithFeedback('colonia', 'Colonia', formData.colonia)}
                              {renderFieldWithFeedback('calle', 'Calle', formData.calle)}
                              {renderFieldWithFeedback('numero', 'Número', formData.numero)}
                              {renderFieldWithFeedback('portal', 'Portal', formData.portal)}
                              {renderFieldWithFeedback('escalera', 'Escalera', formData.escalera)}
                              {renderFieldWithFeedback('piso', 'Piso', formData.piso)}
                              {renderFieldWithFeedback('puerta', 'Puerta', formData.puerta)}

                              <h3 className="font-semibold text-lg mb-2 mt-4">Detalles de la Programación</h3>
                              {renderFieldWithFeedback('tipoInspeccion', 'Tipo de Inspección', formData.tipoInspeccion)}
                              {renderFieldWithFeedback('tipoProgramacion', 'Tipo de Programación', formData.tipoProgramacion)}
                              {renderFieldWithFeedback('tipoMdd', 'Tipo MDD', formData.tipoMdd)}
                              {renderFieldWithFeedback('mercado', 'Mercado', formData.mercado)}
                              {renderFieldWithFeedback('oferta', 'Oferta/Campaña', formData.oferta)}

                              <h3 className="font-semibold text-lg mb-2 mt-4">Asignación y Estatus</h3>
                              {renderFieldWithFeedback('empresaColaboradora', 'Empresa Colaboradora', formData.empresaColaboradora)}
                              {renderFieldWithFeedback('instalador', 'Instalador', formData.instalador)}
                              {renderFieldWithFeedback('fechaProgramacion', 'Fecha Programación', formData.fechaProgramacion)}
                              {renderFieldWithFeedback('horarioProgramacion', 'Horario', formData.horarioProgramacion)}
                              {renderFieldWithFeedback('gestor', 'Gestor', formData.gestor)}
                              {renderFieldWithFeedback('status', 'Estatus', formData.status)}
                          </div>
                          <DialogFooter>
                              <DialogClose asChild>
                                  <Button variant="outline" disabled={isSubmitting}>Cancelar</Button>
                              </DialogClose>
                              <Button onClick={() => onFinalSubmit(formData)} disabled={isSubmitting}>
                                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                  Confirmar y Guardar
                              </Button>
                          </DialogFooter>
                      </DialogContent>
                  </Dialog>
              </div>
            )}
        </form>
      </Form>
    </div>
  );
}
