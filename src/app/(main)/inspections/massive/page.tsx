'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { CalendarIcon as CalendarIconLucide, ChevronLeft, Loader2, PlusCircle, Trash2, CheckCircle, AlertCircle, Files, Copy } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format, isSunday, parse } from "date-fns";
import { es } from 'date-fns/locale';
import React, { useMemo, useState } from "react";

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
import { InspectionRecord } from "@/lib/mock-data";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { TIPO_PROGRAMACION_PES, TIPO_MDD, MERCADO, TIPO_INSPECCION_MASIVA, mockMunicipalities } from "@/lib/form-options";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const inspectionDetailSchema = z.object({
  id: z.string(),
  poliza: z.string().optional(),
  caso: z.string().max(11, 'El caso no debe exceder los 11 caracteres.').optional().refine(val => !val || /^AT-\d{8}$/.test(val), {
    message: 'El formato debe ser AT-XXXXXXXX'
  }),
  portal: z.string().optional(),
  escalera: z.string().optional(),
  piso: z.string().optional(),
  puerta: z.string().optional(),
});

const formSchema = z.object({
  zone: z.string(),
  sector: z.string().min(1, "El sector es requerido."),
  // Common fields
  municipality: z.string().min(1, "El municipio es requerido."),
  colonia: z.string().min(1, "La colonia es requerida."),
  calle: z.string().min(1, "La calle es requerida."),
  numero: z.string().min(1, "El número es requerido."),
  
  tipoInspeccion: z.string().min(1, "El tipo de inspección es requerido."),
  tipoProgramacion: z.string().min(1, "El tipo de programación es requerido."),
  tipoMdd: z.string().min(1, "El tipo de MDD es requerido."),
  mercado: z.string().min(1, "El mercado es requerido."),
  oferta: z.string().optional(),
  observaciones: z.string().optional(),

  empresaColaboradora: z.string().min(1, "La empresa colaboradora es requerida."),
  fechaProgramacion: z.date({ required_error: "La fecha de programación es requerida." }),
  horarioProgramacion: z.string().min(1, "El horario es requerido."),
  instalador: z.string().min(1, "El instalador es requerido."),
  inspector: z.string().optional(),
  gestor: z.string().min(1, "El gestor es requerido."),
  status: z.string(),
  
  // Array of inspections
  inspections: z.array(inspectionDetailSchema).min(1, "Debe agregar al menos una inspección.").max(4, "No puede agregar más de 4 inspecciones."),
}).refine(data => {
    if (data.status === STATUS.PROGRAMADA) {
        return !!data.inspector;
    }
    return true;
}, {
    message: "El campo Inspector es requerido para el estatus 'Programada'.",
    path: ["inspector"],
});

type FormValues = z.infer<typeof formSchema>;

export default function MassiveInspectionPage() {
  const { toast } = useToast();
  const { user, weekendsEnabled, blockedDays, addRecord, zone, collaborators, installers, expansionManagers, sectors, inspectors, addNotification, users: allUsers, devModeEnabled } = useAppContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [createdRecordInfo, setCreatedRecordInfo] = useState<{ids: string[], status: string} | null>(null);

  const fromParam = searchParams.get('from');

  const isCollaborator = user?.role === ROLES.COLABORADOR;
  const collaboratorCompany = isCollaborator ? user.name : ''; // Assumption

  const getInitialStatus = (role: Role | undefined) => {
    switch (role) {
      case ROLES.GESTOR: return STATUS.CONFIRMADA_POR_GE;
      case ROLES.COLABORADOR:
      default: return STATUS.REGISTRADA;
    }
  };

  const generateId = () => `INSP-IM-${Date.now()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

  const defaultValues: FormValues = useMemo(() => {
    const dateParam = searchParams.get('date');
    const timeParam = searchParams.get('time');
    return {
      zone: zone,
      sector: "",
      municipality: "",
      colonia: "",
      calle: "",
      numero: "",
      tipoInspeccion: "Programacion PES",
      tipoProgramacion: "",
      tipoMdd: "",
      mercado: "",
      oferta: "",
      observaciones: "",
      empresaColaboradora: isCollaborator ? collaboratorCompany : "",
      horarioProgramacion: timeParam || "",
      instalador: "",
      inspector: "",
      gestor: "",
      status: getInitialStatus(user?.role),
      inspections: [{ id: generateId(), poliza: "", caso: "", portal: "", escalera: "", piso: "", puerta: "" }],
      fechaProgramacion: dateParam ? parse(dateParam, 'yyyy-MM-dd', new Date()) : undefined,
    }
  }, [user?.role, zone, isCollaborator, collaboratorCompany, searchParams]);


  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: 'onChange',
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "inspections"
  });

  const formData = form.watch();

  const isInspectorFieldDisabled = useMemo(() => {
    return ![ROLES.ADMIN, ROLES.CALIDAD].includes(user!.role);
  }, [user]);

  const availableSectors = useMemo(() => {
    const currentZone = formData.zone;
    if (currentZone === 'Todas las zonas') {
        return sectors;
    }
    return sectors.filter(s => s.zone === currentZone);
  }, [formData.zone, sectors]);

    const availableInstallers = useMemo(() => {
        if (!isCollaborator) return installers.filter(i => i.status === 'Activo');
        return installers.filter(i => 
            i.collaboratorCompany === collaboratorCompany && i.status === 'Activo'
        );
    }, [isCollaborator, collaboratorCompany, installers]);
    
    const availableManagers = useMemo(() => {
        return expansionManagers.filter(m => 
            (m.zone === formData.zone || formData.zone === 'Todas las zonas') && 
            m.status === 'Activo'
        );
    }, [formData.zone, expansionManagers]);

    const availableInspectors = useMemo(() => {
        return inspectors.filter(m => 
            (m.zone === formData.zone || formData.zone === 'Todas las zonas') && 
            m.status === 'Activo'
        );
    }, [formData.zone, inspectors]);

    const availableStatusOptions = useMemo(() => {
        if (isCollaborator) {
            return [STATUS.REGISTRADA, STATUS.CANCELADA];
        }
        return Object.values(STATUS);
    }, [isCollaborator]);


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
    });
  }
  
  const backPath = useMemo(() => {
    switch (fromParam) {
      case 'calendar':
        return '/calendar';
      default:
        return '/inspections';
    }
  }, [fromParam]);

  function onFinalSubmit(values: FormValues) {
    setIsSubmitting(true);
    
    setTimeout(() => {
        const gestorUser = allUsers.find(u => u.name === values.gestor);
        const createdIds: string[] = [];
        
        values.inspections.forEach(detail => {
            const recordToSave: InspectionRecord = {
                ...values,
                ...detail,
                client: 'Cliente (TBD)',
                address: `${values.calle} ${values.numero}, ${detail.puerta || ''}`,
                requestDate: format(values.fechaProgramacion, 'yyyy-MM-dd'),
                type: 'Masiva PES',
                createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
                createdBy: user?.username || 'desconocido',
                inspector: values.inspector || 'N/A',
                horarioProgramacion: values.horarioProgramacion,
                zone: values.zone,
                id: detail.id,
                serieMdd: undefined,
                observaciones: values.observaciones,
            };
            addRecord(recordToSave);
            createdIds.push(detail.id);
        });

        if (gestorUser) {
            addNotification({
                recipientUsername: gestorUser.username,
                message: `${values.inspections.length} nuevas inspecciones masivas te han sido asignadas.`,
            });
        }
        
        setCreatedRecordInfo({ ids: createdIds, status: values.status });
        setIsSuccessDialogOpen(true);

      setIsSubmitting(false);
      setIsConfirming(false);
    }, 1500);
  }

  const handleReset = () => {
    form.reset({
        ...defaultValues,
        status: getInitialStatus(user?.role),
        empresaColaboradora: isCollaborator ? user?.name : '',
    });
  }
  
  const handleUpperCase = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: any) => {
      field.onChange(e.target.value.toUpperCase());
  }
  
  const addInspection = () => {
    if (fields.length < 4) {
      append({ id: generateId(), poliza: "", caso: "", portal: "", escalera: "", piso: "", puerta: "" });
    }
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
                 {isTouched && (
                    <div className="w-4 h-4">
                        {error ? <AlertCircle className="text-destructive" /> : <CheckCircle className="text-green-500" />}
                    </div>
                )}
            </div>
        </div>
      );
  }
  
  const handleCopyIds = () => {
    if (createdRecordInfo) {
      navigator.clipboard.writeText(createdRecordInfo.ids.join(', '));
      toast({ title: 'IDs Copiados', description: 'Los IDs de las inspecciones se han copiado.' });
    }
  };


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href={backPath}>
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="flex items-center gap-3 font-headline text-3xl font-semibold">
            <Files className="h-8 w-8 text-primary" />
            Programación Masiva de PES
          </h1>
          <p className="text-muted-foreground">Formulario para múltiples Puestas en Servicio en una misma dirección.</p>
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={(e) => { e.preventDefault(); handlePreview(); }} className="space-y-8">

            <Card>
              <CardHeader>
                <CardTitle>Ubicación Común del Servicio</CardTitle>
                <CardDescription>Dirección principal donde se realizarán las inspecciones.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                <div className="grid md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="zone" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Zona</FormLabel>
                            <FormControl><Input {...field} readOnly disabled className="bg-muted/50" /></FormControl>
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="sector" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Sector</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un sector" /></SelectTrigger></FormControl>
                        <SelectContent>
                            {availableSectors.map(s => <SelectItem key={s.id} value={s.sector}>{s.sector} ({s.sectorKey})</SelectItem>)}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )} />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="municipality" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Municipio</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                            <FormControl><Input placeholder="Colonia" {...field} onChange={(e) => handleUpperCase(e, field)} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="calle" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Calle</FormLabel>
                            <FormControl><Input placeholder="Nombre de la calle" {...field} onChange={(e) => handleUpperCase(e, field)}/></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="numero" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Número</FormLabel>
                            <FormControl><Input placeholder="Número exterior" {...field} onChange={(e) => handleUpperCase(e, field)} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
              </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Detalles de Inspecciones Individuales</CardTitle>
                            <CardDescription>Añada hasta 4 inspecciones para la dirección principal.</CardDescription>
                        </div>
                        <Button type="button" size="sm" onClick={addInspection} disabled={fields.length >= 4}>
                            <PlusCircle className="mr-2"/>
                            Añadir
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {fields.map((field, index) => (
                        <div key={field.id} className="rounded-md border p-4 space-y-4 relative">
                            <h4 className="font-semibold text-md">Inspección {index + 1}</h4>
                             <FormField control={form.control} name={`inspections.${index}.id`} render={({ field }) => (
                                <FormItem>
                                    <FormLabel>ID de Registro</FormLabel>
                                    <FormControl><Input {...field} readOnly disabled className="font-mono bg-muted/50" /></FormControl>
                                </FormItem>
                            )} />
                            <div className="grid md:grid-cols-2 gap-4">
                                <FormField control={form.control} name={`inspections.${index}.poliza`} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Póliza (Opcional)</FormLabel>
                                        <FormControl><Input placeholder="Póliza" {...field} type="text" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name={`inspections.${index}.caso`} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Caso (AT) (Opcional)</FormLabel>
                                        <FormControl><Input placeholder="Ej. AT-12345678" {...field} maxLength={11} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                            <div className="grid md:grid-cols-4 gap-4">
                                <FormField control={form.control} name={`inspections.${index}.portal`} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Portal</FormLabel>
                                        <FormControl><Input {...field} onChange={(e) => handleUpperCase(e, field)}/></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name={`inspections.${index}.escalera`} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Escalera</FormLabel>
                                        <FormControl><Input {...field} onChange={(e) => handleUpperCase(e, field)}/></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name={`inspections.${index}.piso`} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Piso</FormLabel>
                                        <FormControl><Input {...field} onChange={(e) => handleUpperCase(e, field)}/></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name={`inspections.${index}.puerta`} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Puerta</FormLabel>
                                        <FormControl><Input {...field} onChange={(e) => handleUpperCase(e, field)}/></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                             {index > 0 && (
                                <Button type="button" variant="destructive" size="icon" className="absolute top-4 right-4" onClick={() => remove(index)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    ))}
                    <FormMessage>{form.formState.errors.inspections?.root?.message}</FormMessage>
                </CardContent>
             </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalles de la Programación</CardTitle>
                <CardDescription>Información técnica y de clasificación del servicio.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                <div className="grid md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="tipoInspeccion" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Tipo de Inspección</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un tipo" /></SelectTrigger></FormControl>
                        <SelectContent>
                            {TIPO_INSPECCION_MASIVA.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )} />
                    <FormField control={form.control} name="tipoProgramacion" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Tipo de Programación</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                            <FormControl><Input {...field} onChange={(e) => handleUpperCase(e, field)}/></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                <FormField control={form.control} name="observaciones" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Observaciones (Opcional)</FormLabel>
                        <FormControl>
                            <Textarea 
                                placeholder="Añadir comentarios o notas relevantes para la inspección..."
                                {...field}
                            />
                        </FormControl>
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
              <CardContent className="grid gap-6">
                 <div className="grid md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="empresaColaboradora" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Empresa Colaboradora</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={isCollaborator}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecciona una empresa" /></SelectTrigger></FormControl>
                        <SelectContent>
                            {collaborators.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )} />
                    <FormField control={form.control} name="gestor" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Gestor</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un gestor" /></SelectTrigger></FormControl>
                        <SelectContent>
                            {availableManagers.map(i => <SelectItem key={i.id} value={i.name}>{i.name}</SelectItem>)}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )} />
                    <FormField control={form.control} name="instalador" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Instalador</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un instalador" /></SelectTrigger></FormControl>
                        <SelectContent>
                            {availableInstallers.map(i => <SelectItem key={i.id} value={i.name}>{i.name}</SelectItem>)}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )} />
                    <FormField control={form.control} name="inspector" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Inspector</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isInspectorFieldDisabled}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un inspector" /></SelectTrigger></FormControl>
                            <SelectContent>
                                {availableInspectors.map(i => <SelectItem key={i.id} value={i.name}>{i.name}</SelectItem>)}
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
                                <div className="relative">
                                <Input
                                    value={field.value ? format(field.value, "PPP", { locale: es }) : ''}
                                    readOnly
                                    placeholder="Elige una fecha"
                                    className={cn("pl-3 pr-10 text-left font-normal", !field.value && "text-muted-foreground")}
                                />
                                <CalendarIconLucide className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
                                </div>
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
                                <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                <FormField control={form.control} name="status" render={({ field }) => (
                   <FormItem>
                    <FormLabel>Status</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={isCollaborator}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                        <SelectContent>
                           {availableStatusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                     </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </CardContent>
            </Card>

            <div className="flex justify-center gap-2">
                <Button type="button" variant="ghost" onClick={handleReset} disabled={isSubmitting}>Limpiar</Button>
                <Button type="button" variant="outline" onClick={() => router.push(backPath)} disabled={isSubmitting}>Cancelar</Button>
                 <Dialog open={isConfirming} onOpenChange={setIsConfirming}>
                    <DialogTrigger asChild>
                         <Button type="button" onClick={handlePreview} disabled={isSubmitting}>
                            Guardar
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl">
                        <DialogHeader>
                            <DialogTitle>Confirmar Creación de Inspección Masiva</DialogTitle>
                            <DialogDescription>
                                Revisa los datos del formulario antes de confirmar la solicitud. Se creará una inspección por cada detalle individual.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="max-h-[60vh] overflow-y-auto p-1 pr-4 space-y-6">
                           <div>
                                <h3 className="font-semibold text-lg mb-2">Datos Comunes</h3>
                                {renderFieldWithFeedback('zone', 'Zona', formData.zone)}
                                {renderFieldWithFeedback('sector', 'Sector', formData.sector)}
                                {renderFieldWithFeedback('municipality', 'Municipio', formData.municipality)}
                                {renderFieldWithFeedback('colonia', 'Colonia', formData.colonia)}
                                {renderFieldWithFeedback('calle', 'Calle', formData.calle)}
                                {renderFieldWithFeedback('numero', 'Número', formData.numero)}
                                
                                <h3 className="font-semibold text-lg mb-2 mt-4">Detalles de la Programación</h3>
                                {renderFieldWithFeedback('tipoInspeccion', 'Tipo de Inspección', formData.tipoInspeccion)}
                                {renderFieldWithFeedback('tipoProgramacion', 'Tipo de Programación', formData.tipoProgramacion)}
                                {renderFieldWithFeedback('tipoMdd', 'Tipo MDD', formData.tipoMdd)}
                                {renderFieldWithFeedback('mercado', 'Mercado', formData.mercado)}
                                {renderFieldWithFeedback('oferta', 'Oferta/Campaña', formData.oferta)}
                                {renderFieldWithFeedback('observaciones', 'Observaciones', formData.observaciones)}

                                <h3 className="font-semibold text-lg mb-2 mt-4">Asignación y Estatus</h3>
                                {renderFieldWithFeedback('empresaColaboradora', 'Empresa Colaboradora', formData.empresaColaboradora)}
                                {renderFieldWithFeedback('instalador', 'Instalador', formData.instalador)}
                                {renderFieldWithFeedback('inspector', 'Inspector', formData.inspector)}
                                {renderFieldWithFeedback('fechaProgramacion', 'Fecha Programación', formData.fechaProgramacion)}
                                {renderFieldWithFeedback('horarioProgramacion', 'Horario', formData.horarioProgramacion)}
                                {renderFieldWithFeedback('gestor', 'Gestor', formData.gestor)}
                                {renderFieldWithFeedback('status', 'Estatus', formData.status)}
                           </div>
                           <div>
                                <h3 className="font-semibold text-lg mb-2">Detalles Individuales</h3>
                                {formData.inspections?.map((inspection, index) => (
                                    <div key={inspection.id} className="rounded-md border p-4 mb-4">
                                        <h4 className="font-medium text-md mb-2 border-b pb-2">Inspección {index + 1}</h4>
                                        <p className="text-sm"><span className="font-medium text-muted-foreground">ID:</span> <span className="font-mono">{inspection.id}</span></p>
                                        <p className="text-sm"><span className="font-medium text-muted-foreground">Póliza:</span> {inspection.poliza || 'N/A'}</p>
                                        <p className="text-sm"><span className="font-medium text-muted-foreground">Caso:</span> {inspection.caso || 'N/A'}</p>
                                        <p className="text-sm"><span className="font-medium text-muted-foreground">Portal:</span> {inspection.portal || 'N/A'}</p>
                                        <p className="text-sm"><span className="font-medium text-muted-foreground">Escalera:</span> {inspection.escalera || 'N/A'}</p>
                                        <p className="text-sm"><span className="font-medium text-muted-foreground">Piso:</span> {inspection.piso || 'N/A'}</p>
                                        <p className="text-sm"><span className="font-medium text-muted-foreground">Puerta:</span> {inspection.puerta || 'N/A'}</p>
                                    </div>
                                ))}
                           </div>
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
        </form>
      </Form>
      
      {createdRecordInfo && (
        <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-500" />
                ¡Solicitudes Generadas con Éxito!
              </DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <p>Se han generado las siguientes solicitudes de inspección:</p>
              <div className="space-y-2">
                  <Label>IDs de Inspección</Label>
                  <div className='max-h-32 overflow-y-auto space-y-1 pr-2'>
                    {createdRecordInfo.ids.map(id => (
                      <div key={id} className="flex items-center gap-2 rounded-md bg-muted p-2 font-mono text-sm">
                        <span className="flex-1 truncate">{id}</span>
                      </div>
                    ))}
                  </div>
                   <Button variant="outline" size="sm" onClick={handleCopyIds} className="w-full">
                        <Copy className="mr-2 h-4 w-4" />
                        Copiar IDs
                    </Button>
              </div>
              <div>
                <Label>Estatus</Label>
                <p className="font-semibold">{createdRecordInfo.status}</p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => {
                setIsSuccessDialogOpen(false);
                router.push('/records');
              }}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}
