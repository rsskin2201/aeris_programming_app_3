'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { CalendarIcon as CalendarIconLucide, ChevronLeft, Loader2, CheckCircle, AlertCircle, FileCheck2, Copy, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format, isSunday, parse, parseISO } from "date-fns";
import { es } from 'date-fns/locale';
import React, { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/hooks/use-app-context";
import { ROLES, Role, STATUS, CollaboratorCompany, Sector, ExpansionManager, Inspector, User as AppUser, Status } from "@/lib/types";
import { InspectionRecord } from "@/lib/mock-data";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { TIPO_INSPECCION_ESPECIAL, TIPO_PROGRAMACION_ESPECIAL, MERCADO, mockMunicipalities } from "@/lib/form-options";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCollection, useDoc, useFirestore, FirestorePermissionError, errorEmitter } from "@/firebase";
import { collection, doc, query, where } from "firebase/firestore";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";

const formSchema = z.object({
  id: z.string().optional(),
  zone: z.string(),
  sector: z.string().min(1, "El sector es requerido."),
  poliza: z.string().optional(),
  caso: z.string().max(11, 'El caso no debe exceder los 11 caracteres.').optional().refine(val => !val || /^AT-\d{8}$/.test(val), {
    message: 'El formato debe ser AT-XXXXXXXX'
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
  tipoMdd: z.string().optional(),
  mercado: z.string().min(1, "El mercado es requerido."),
  oferta: z.string().optional(),
  observaciones: z.string().optional(),

  collaboratorCompany: z.string().min(1, "La empresa colaboradora es requerida."),
  fechaProgramacion: z.date({ required_error: "La fecha de programación es requerida." }),
  horarioProgramacion: z.string().min(1, "El horario es requerido."),
  instalador: z.string().min(1, "El instalador es requerido."),
  inspector: z.string().optional(),
  gestor: z.string().min(1, "El gestor es requerido."),
  
  status: z.string(),
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

export default function SpecialInspectionPage() {
  const { toast } = useToast();
  const { user, weekendsEnabled, blockedDays, zone, addNotification, devModeEnabled, buildQuery } = useAppContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [createdRecordInfo, setCreatedRecordInfo] = useState<{ids: string[], status: string} | null>(null);

  const fromParam = searchParams.get('from');

  const isCollaborator = user?.role === ROLES.COLABORADOR;

  const collaboratorsQuery = useMemo(() => firestore ? query(collection(firestore, 'empresas_colaboradoras'), ...buildQuery('empresas_colaboradoras')) : null, [firestore, buildQuery]);
  const installersQuery = useMemo(() => firestore ? query(collection(firestore, 'instaladores'), ...buildQuery('instaladores')) : null, [firestore, buildQuery]);
  const managersQuery = useMemo(() => firestore ? query(collection(firestore, 'gestores_expansion'), ...buildQuery('gestores_expansion')) : null, [firestore, buildQuery]);
  const sectorsQuery = useMemo(() => firestore ? query(collection(firestore, 'sectores'), ...buildQuery('sectores')) : null, [firestore, buildQuery]);
  const inspectorsQuery = useMemo(() => firestore ? query(collection(firestore, 'inspectores'), ...buildQuery('inspectores')) : null, [firestore, buildQuery]);

  const { data: collaborators } = useCollection<CollaboratorCompany>(collaboratorsQuery);
  const { data: installers } = useCollection<any>(installersQuery);
  const { data: expansionManagers } = useCollection<ExpansionManager>(managersQuery);
  const { data: sectors } = useCollection<Sector>(sectorsQuery);
  const { data: inspectors } = useCollection<Inspector>(inspectorsQuery);

  const recordId = searchParams.get('id');
  const docRef = useMemo(() => recordId ? doc(firestore, 'inspections', recordId) : null, [firestore, recordId]);
  const { data: currentRecord, isLoading: isRecordLoading } = useDoc<InspectionRecord>(docRef);

  const collaboratorCompany = isCollaborator ? user.name : ''; // Assumption

  const getInitialStatus = (role: Role | undefined) => {
    if (isCollaborator) return STATUS.REGISTRADA;
    if (role === ROLES.GESTOR) return STATUS.CONFIRMADA_POR_GE;
    return STATUS.REGISTRADA;
  };

  const generateId = () => `INSP-ES-${Date.now()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      id: '',
      zone: zone,
      sector: '',
      poliza: '',
      caso: '',
      municipality: '',
      colonia: '',
      calle: '',
      numero: '',
      portal: '',
      escalera: '',
      piso: '',
      puerta: '',
      tipoInspeccion: '',
      tipoProgramacion: '',
      tipoMdd: '',
      mercado: '',
      oferta: '',
      observaciones: '',
      collaboratorCompany: isCollaborator ? collaboratorCompany : "",
      horarioProgramacion: '09:00',
      instalador: '',
      inspector: '',
      gestor: '',
      status: getInitialStatus(user?.role),
    },
  });

  useEffect(() => {
    const dateParam = searchParams.get('date');
    const timeParam = searchParams.get('time');

    if (recordId) {
        if(currentRecord) {
            form.reset({
              id: currentRecord.id || '',
              zone: currentRecord.zone || '',
              sector: currentRecord.sector || '',
              poliza: currentRecord.poliza || '',
              caso: currentRecord.caso || '',
              municipality: currentRecord.municipality || '',
              colonia: currentRecord.colonia || '',
              calle: currentRecord.calle || '',
              numero: currentRecord.numero || '',
              portal: currentRecord.portal || '',
              escalera: currentRecord.escalera || '',
              piso: currentRecord.piso || '',
              puerta: currentRecord.puerta || '',
              tipoInspeccion: currentRecord.tipoInspeccion || '',
              tipoProgramacion: currentRecord.tipoProgramacion || '',
              tipoMdd: currentRecord.tipoMdd || '',
              mercado: currentRecord.mercado || '',
              oferta: currentRecord.oferta || '',
              observaciones: currentRecord.observaciones || '',
              collaboratorCompany: currentRecord.collaboratorCompany || '',
              fechaProgramacion: currentRecord.requestDate ? parse(currentRecord.requestDate, 'yyyy-MM-dd', new Date()) : new Date(),
              horarioProgramacion: currentRecord.horarioProgramacion || '',
              instalador: currentRecord.instalador || '',
              inspector: currentRecord.inspector || '',
              gestor: currentRecord.gestor || '',
              status: currentRecord.status || '',
            });
        }
    } else {
        form.reset({
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
            tipoInspeccion: "",
            tipoProgramacion: "",
            tipoMdd: "",
            mercado: "",
            oferta: "",
            observaciones: "",
            collaboratorCompany: isCollaborator ? collaboratorCompany : "",
            horarioProgramacion: timeParam || "09:00",
            instalador: "",
            inspector: "",
            gestor: "",
            sector: "",
            status: getInitialStatus(user?.role),
            fechaProgramacion: dateParam ? parse(dateParam, 'yyyy-MM-dd', new Date()) : new Date(),
        });
    }
  }, [user, zone, isCollaborator, collaboratorCompany, searchParams, form, recordId, currentRecord]);
  
  const formData = form.watch();

  const isFieldDisabled = (fieldName: keyof FormValues): boolean => {
    if (isCollaborator && (fieldName === 'status' || fieldName === 'inspector' || fieldName === 'collaboratorCompany')) {
      return true;
    }
    return false;
  };

  const availableSectors = useMemo(() => {
    if (!sectors) return [];
    return sectors.filter(s => s.status === 'Activo');
  }, [sectors]);

    const availableInstallers = useMemo(() => {
        if (!installers) return [];
        const activeInstallers = installers.filter(i => i.status === 'Activo');
        if (!isCollaborator) return activeInstallers;
        return activeInstallers.filter(i => 
            i.collaboratorCompany === collaboratorCompany
        );
    }, [isCollaborator, collaboratorCompany, installers]);
    
    const availableManagers = useMemo(() => {
        if (!expansionManagers) return [];
        return expansionManagers.filter(m => m.status === 'Activo');
    }, [expansionManagers]);

    const availableInspectors = useMemo(() => {
        if (!inspectors) return [];
        return inspectors.filter(m => m.status === 'Activo');
    }, [inspectors]);

    const availableStatusOptions = useMemo(() => {
        if (isCollaborator) {
            return [STATUS.REGISTRADA];
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
      case 'records':
        return '/records';
      default:
        return '/inspections';
    }
  }, [fromParam]);

  async function onFinalSubmit(values: FormValues) {
    if (!firestore) return;
    setIsSubmitting(true);
    
    const recordToSave: InspectionRecord = {
        id: values.id || generateId(),
        zone: values.zone,
        sector: values.sector || '',
        poliza: values.poliza || '',
        caso: values.caso || '',
        municipality: values.municipality,
        colonia: values.colonia,
        calle: values.calle,
        numero: values.numero,
        portal: values.portal || '',
        escalera: values.escalera || '',
        piso: values.piso || '',
        puerta: values.puerta || '',
        tipoInspeccion: values.tipoInspeccion,
        tipoProgramacion: values.tipoProgramacion,
        tipoMdd: values.tipoMdd || '',
        mercado: values.mercado,
        oferta: values.oferta || '',
        observaciones: values.observaciones || '',
        collaboratorCompany: values.collaboratorCompany,
        horarioProgramacion: values.horarioProgramacion,
        instalador: values.instalador,
        inspector: values.inspector || '',
        gestor: values.gestor,
        status: values.status as Status,

        client: 'Cliente (TBD)',
        address: `${values.calle} ${values.numero}, ${values.colonia}`,
        requestDate: format(values.fechaProgramacion, 'yyyy-MM-dd'),
        type: 'Especial',
        createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        createdBy: user?.username || 'desconocido',
    };
    
    const docRef = doc(firestore, 'inspections', recordToSave.id);
    
    setDoc(docRef, recordToSave, { merge: true }).catch(error => {
        const contextualError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'create',
          requestResourceData: recordToSave,
        });
        errorEmitter.emit('permission-error', contextualError);
    }).finally(() => {
        setIsSubmitting(false);
        setIsConfirming(false);

        addNotification({
            recipientUsername: 'coordinador',
            message: `Nueva inspección especial ${recordToSave.id} creada por ${user?.username} en la zona ${recordToSave.zone}.`,
            link: `/inspections/special?id=${recordToSave.id}&mode=view`
        });
        
        setCreatedRecordInfo({ ids: [recordToSave.id], status: recordToSave.status });
        setIsSuccessDialogOpen(true);
    });
  }

  const handleReset = () => {
    // This logic is now handled by the useEffect
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
      toast({ title: 'ID Copiado', description: 'El ID de la inspección se ha copiado.' });
    }
  };

  if (isRecordLoading && recordId) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }


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
            <FileCheck2 className="h-8 w-8 text-primary" />
            Programación Especial (No PES)
          </h1>
          <p className="text-muted-foreground">Formulario para otras inspecciones que no son Puesta en Servicio.</p>
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={(e) => { e.preventDefault(); handlePreview(); }} className="space-y-8">

            <Card>
              <CardHeader>
                <CardTitle>Ubicación del Servicio</CardTitle>
                <CardDescription>Dirección donde se realizará la inspección.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                 <FormField control={form.control} name="id" render={({ field }) => (
                    <FormItem>
                        <FormLabel>ID de Registro</FormLabel>
                        <FormControl><Input {...field} readOnly disabled className="font-mono bg-muted/50" /></FormControl>
                    </FormItem>
                )} />
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
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un sector" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {availableSectors?.map(s => <SelectItem key={s.id} value={s.sector}>{s.sector} ({s.sectorKey})</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="poliza" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Póliza</FormLabel>
                          <FormControl><Input placeholder="Opcional" {...field} type="text" /></FormControl>
                          <FormMessage />
                      </FormItem>
                  )} />
                  <FormField control={form.control} name="caso" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Caso (AT)</FormLabel>
                          <FormControl><Input placeholder="Ej. AT-12345678" {...field} maxLength={11} /></FormControl>
                          <FormMessage />
                      </FormItem>
                  )} />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="municipality" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Municipio</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
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
                            <FormControl><Input placeholder="Número exterior/interior" {...field} onChange={(e) => handleUpperCase(e, field)} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                <div className="grid md:grid-cols-4 gap-6">
                  <FormField control={form.control} name="portal" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Portal (Opcional)</FormLabel>
                          <FormControl><Input {...field} onChange={(e) => handleUpperCase(e, field)}/></FormControl>
                          <FormMessage />
                      </FormItem>
                  )} />
                  <FormField control={form.control} name="escalera" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Escalera (Opcional)</FormLabel>
                          <FormControl><Input {...field} onChange={(e) => handleUpperCase(e, field)}/></FormControl>
                          <FormMessage />
                      </FormItem>
                  )} />
                  <FormField control={form.control} name="piso" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Piso (Opcional)</FormLabel>
                          <FormControl><Input {...field} onChange={(e) => handleUpperCase(e, field)}/></FormControl>
                          <FormMessage />
                      </FormItem>
                  )} />
                  <FormField control={form.control} name="puerta" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Puerta (Opcional)</FormLabel>
                          <FormControl><Input {...field} onChange={(e) => handleUpperCase(e, field)}/></FormControl>
                          <FormMessage />
                      </FormItem>
                  )} />
                </div>
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
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un tipo" /></SelectTrigger></FormControl>
                        <SelectContent>
                            {TIPO_INSPECCION_ESPECIAL.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )} />
                    <FormField control={form.control} name="tipoProgramacion" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Tipo de Programación</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un tipo" /></SelectTrigger></FormControl>
                        <SelectContent>
                            {TIPO_PROGRAMACION_ESPECIAL.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )} />
                    <FormField control={form.control} name="tipoMdd" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Tipo MDD</FormLabel>
                        <FormControl>
                            <Input {...field} disabled readOnly />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )} />
                    <FormField control={form.control} name="mercado" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Mercado</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
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
                            <FormLabel>Oferta/Campaña (Opcional)</FormLabel>
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
                    <FormField control={form.control} name="collaboratorCompany" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Empresa Colaboradora</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''} disabled={isFieldDisabled('collaboratorCompany')}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecciona una empresa" /></SelectTrigger></FormControl>
                        <SelectContent>
                            {collaborators?.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )} />
                    <FormField control={form.control} name="gestor" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Gestor</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
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
                        <Select onValueChange={field.onChange} value={field.value || ''}>
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
                            <Select onValueChange={field.onChange} value={field.value || ''} disabled={isFieldDisabled('inspector')}>
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
                        <FormItem className="flex flex-col">
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
                     <Select onValueChange={field.onChange} value={field.value || ''} disabled={isFieldDisabled('status')}>
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
                            <DialogTitle>Confirmar Creación de Inspección Especial</DialogTitle>
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
                            {renderFieldWithFeedback('observaciones', 'Observaciones', formData.observaciones)}

                            <h3 className="font-semibold text-lg mb-2 mt-4">Asignación y Estatus</h3>
                            {renderFieldWithFeedback('collaboratorCompany', 'Empresa Colaboradora', formData.collaboratorCompany)}
                            {renderFieldWithFeedback('instalador', 'Instalador', formData.instalador)}
                            {renderFieldWithFeedback('inspector', 'Inspector', formData.inspector)}
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
        </form>
      </Form>
      
       {createdRecordInfo && (
        <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-500" />
                ¡Solicitud Generada con Éxito!
              </DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <p>Se ha generado la siguiente solicitud de inspección:</p>
              <div className="space-y-2">
                  <Label>ID de Inspección</Label>
                  {createdRecordInfo.ids.map(id => (
                     <div key={id} className="flex items-center gap-2 rounded-md bg-muted p-2 font-mono text-sm">
                       <span className="flex-1 truncate">{id}</span>
                     </div>
                  ))}
                   <Button variant="outline" size="sm" onClick={handleCopyIds} className="w-full">
                        <Copy className="mr-2 h-4 w-4" />
                        Copiar ID
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
