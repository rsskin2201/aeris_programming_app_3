'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ChevronLeft, FileUp, Loader2, CheckCircle, AlertCircle, CalendarIcon as CalendarIconLucide, ListChecks, File as FileIcon, BadgeCheck, Copy } from "lucide-react";
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
import { ROLES, Role, STATUS, CollaboratorCompany, Sector, ExpansionManager, Inspector, User as AppUser } from "@/lib/types";
import { InspectionRecord } from "@/lib/mock-data";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { TIPO_PROGRAMACION_PES, TIPO_MDD, MERCADO, mockMunicipalities } from "@/lib/form-options";
import { ChecklistForm } from "@/components/inspections/checklist-form";
import { SupportValidationForm } from "@/components/inspections/support-validation-form";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCollection, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { addDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { collection, doc } from "firebase/firestore";

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

const editableStatuses = [STATUS.EN_PROCESO, STATUS.PROGRAMADA, STATUS.CONFIRMADA_POR_GE, STATUS.REGISTRADA];
const checklistRoles = [ROLES.CALIDAD, ROLES.SOPORTE, ROLES.ADMIN];
const supportRoles = [ROLES.SOPORTE, ROLES.ADMIN];
const canViewChecklistStatuses = [STATUS.PROGRAMADA, STATUS.EN_PROCESO, STATUS.APROBADA, STATUS.NO_APROBADA, STATUS.RECHAZADA, STATUS.CONECTADA, STATUS.PENDIENTE_CORRECCION];

export default function IndividualInspectionPage() {
  const { toast } = useToast();
  const { 
    user, 
    weekendsEnabled, 
    blockedDays, 
    zone, 
    addNotification,
    devModeEnabled,
  } = useAppContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const firestore = useFirestore();

  const recordId = searchParams.get('id');
  const mode = searchParams.get('mode');

  const [isConfirming, setIsConfirming] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [isSupportFormOpen, setIsSupportFormOpen] = useState(false);
  const [pageMode, setPageMode] = useState<'new' | 'view' | 'edit'>('new');
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [createdRecordInfo, setCreatedRecordInfo] = useState<{ids: string[], status: string} | null>(null);

  const { data: collaborators } = useCollection<CollaboratorCompany>(useMemoFirebase(() => collection(firestore, 'empresas_colaboradoras'), [firestore]));
  const { data: installers } = useCollection<any>(useMemoFirebase(() => collection(firestore, 'instaladores'), [firestore]));
  const { data: expansionManagers } = useCollection<ExpansionManager>(useMemoFirebase(() => collection(firestore, 'gestores_expansion'), [firestore]));
  const { data: sectors } = useCollection<Sector>(useMemoFirebase(() => collection(firestore, 'sectores'), [firestore]));
  const { data: inspectors } = useCollection<Inspector>(useMemoFirebase(() => collection(firestore, 'inspectores'), [firestore]));
  const { data: allUsers } = useCollection<AppUser>(useMemoFirebase(() => collection(firestore, 'users'), [firestore]));

  const docRef = useMemoFirebase(() => recordId ? doc(firestore, 'inspections', recordId) : null, [firestore, recordId]);
  const { data: currentRecord, isLoading: isRecordLoading } = useDoc<InspectionRecord>(docRef);
  
  const fromParam = searchParams.get('from');
  
  const isCollaborator = user?.role === ROLES.COLABORADOR;
  const collaboratorCompany = isCollaborator ? user.name : ''; // Assumption: user.name is company name for collaborator

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
      observaciones: "",
      empresaColaboradora: isCollaborator ? collaboratorCompany : "",
      fechaProgramacion: dateParam ? parse(dateParam, 'yyyy-MM-dd', new Date()) : undefined,
      horarioProgramacion: timeParam || "",
      instalador: "",
      inspector: "",
      gestor: "",
      sector: "",
      status: getInitialStatus(user?.role),
    }
  }, [zone, user?.role, searchParams, isCollaborator, collaboratorCompany]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: 'onChange',
  });
  
  useEffect(() => {
    if (recordId) {
        setPageMode(mode === 'view' ? 'view' : 'edit');
        if (currentRecord) {
             form.reset({
                ...currentRecord,
                id: currentRecord.id,
                zone: currentRecord.zone,
                sector: currentRecord.sector,
                poliza: currentRecord.poliza,
                caso: currentRecord.caso,
                municipality: currentRecord.municipality,
                colonia: currentRecord.colonia,
                calle: currentRecord.calle,
                numero: currentRecord.numero,
                portal: currentRecord.portal,
                escalera: currentRecord.escalera,
                piso: currentRecord.piso,
                puerta: currentRecord.puerta,
                tipoInspeccion: currentRecord.tipoInspeccion,
                tipoProgramacion: currentRecord.tipoProgramacion,
                tipoMdd: currentRecord.tipoMdd,
                mercado: currentRecord.mercado,
                oferta: currentRecord.oferta,
                observaciones: currentRecord.observaciones,
                empresaColaboradora: currentRecord.collaboratorCompany,
                fechaProgramacion: parse(currentRecord.requestDate, 'yyyy-MM-dd', new Date()),
                horarioProgramacion: currentRecord.horarioProgramacion || '09:00',
                instalador: currentRecord.instalador,
                inspector: currentRecord.inspector || '',
                gestor: currentRecord.gestor,
                status: currentRecord.status,
            });
        }
    } else {
        setPageMode('new');
        form.reset({
            ...defaultValues,
            id: generateId(),
            status: getInitialStatus(user?.role),
            zone: zone,
            empresaColaboradora: isCollaborator ? user.name : '', // Assuming user.name is the company name
        });
    }
}, [recordId, mode, currentRecord, form, user, defaultValues, zone, isCollaborator]);


  const isFieldDisabled = (fieldName: keyof FormValues): boolean => {
    if (pageMode === 'view') return true;
    
    if (isCollaborator && fieldName === 'empresaColaboradora') {
        return true;
    }

    if (pageMode === 'edit' && currentRecord) {
        const isClosed = [STATUS.APROBADA, STATUS.NO_APROBADA, STATUS.RECHAZADA, STATUS.CANCELADA, STATUS.CONECTADA, STATUS.PENDIENTE_CORRECCION].includes(currentRecord.status as any);
        if (isClosed && user?.role !== ROLES.ADMIN) return true;

        if (isCollaborator && fieldName === 'status') {
            return true; // Can only change to CANCELADA via special action, not direct selection
        }

        const now = new Date();
        const eighteenHoursBefore = set(parse(currentRecord.requestDate, 'yyyy-MM-dd', new Date()), { hours: -6 });

        switch (fieldName) {
            case 'status':
                return ![ROLES.ADMIN, ROLES.SOPORTE, ROLES.CALIDAD, ROLES.GESTOR].includes(user!.role);
            case 'inspector':
                return ![ROLES.ADMIN, ROLES.CALIDAD].includes(user!.role);
            case 'gestor':
                return ![ROLES.ADMIN, ROLES.SOPORTE].includes(user!.role) && !isCollaborator;
            case 'empresaColaboradora':
                return ![ROLES.GESTOR, ROLES.ADMIN, ROLES.SOPORTE].includes(user!.role);
            case 'poliza':
            case 'caso':
                return ![ROLES.COLABORADOR, ROLES.GESTOR, ROLES.SOPORTE, ROLES.ADMIN].includes(user!.role);
            case 'tipoInspeccion':
                return !currentRecord.id.startsWith("INSP-PS");
            case 'fechaProgramacion':
            case 'horarioProgramacion':
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
                return false;
            default:
                return false;
        }
    }
    return false; // Modo 'new'
  };

  const showChecklistButton = useMemo(() => {
    if (pageMode !== 'edit' || !user || !currentRecord) return false;
    const canAccess = checklistRoles.includes(user.role);
    const isValidStatus = canViewChecklistStatuses.includes(currentRecord.status as any);
    return canAccess && isValidStatus;
  }, [pageMode, user, currentRecord]);

  const showSupportButton = useMemo(() => {
    if (pageMode !== 'edit' || !user || !currentRecord) return false;
    const canAccess = supportRoles.includes(user.role);
    const isValidStatus = [STATUS.APROBADA, STATUS.NO_APROBADA, STATUS.PENDIENTE_CORRECCION, STATUS.CONECTADA].includes(currentRecord.status as any);
    return canAccess && isValidStatus;
  }, [pageMode, user, currentRecord]);
  
  const formData = form.watch();
  
  const availableSectors = useMemo(() => {
    if (!sectors) return [];
    const currentZone = formData.zone;
    if (currentZone === 'Todas las zonas') {
        return sectors;
    }
    return sectors.filter(s => s.zone === currentZone);
  }, [formData.zone, sectors]);

    const availableInstallers = useMemo(() => {
        if (!installers) return [];
        if (!isCollaborator) return installers.filter(i => i.status === 'Activo');
        return installers.filter(i => 
            i.collaboratorCompany === collaboratorCompany && i.status === 'Activo'
        );
    }, [isCollaborator, collaboratorCompany, installers]);
    
    const availableManagers = useMemo(() => {
        if (!expansionManagers) return [];
        return expansionManagers.filter(m => 
            (m.zone === formData.zone || formData.zone === 'Todas las zonas') && 
            m.status === 'Activo'
        );
    }, [formData.zone, expansionManagers]);

    const availableInspectors = useMemo(() => {
        if (!inspectors) return [];
        return inspectors.filter(m => 
            (m.zone === formData.zone || formData.zone === 'Todas las zonas') && 
            m.status === 'Activo'
        );
    }, [formData.zone, inspectors]);

    const availableStatusOptions = useMemo(() => {
        if (isCollaborator && pageMode === 'edit') {
            return [currentRecord?.status, STATUS.CANCELADA].filter(Boolean) as string[];
        }
        return Object.values(STATUS);
    }, [isCollaborator, pageMode, currentRecord?.status]);


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

  function onFinalSubmit(values: FormValues) {
    setIsSubmitting(true);
    
    const recordToSave: InspectionRecord = {
        ...currentRecord,
        ...values,
        client: currentRecord?.client || 'Cliente (TBD)',
        address: `${values.calle} ${values.numero}, ${values.colonia}`,
        requestDate: format(values.fechaProgramacion, 'yyyy-MM-dd'),
        type: 'Individual PES',
        createdAt: currentRecord?.createdAt || format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        createdBy: currentRecord?.createdBy || user?.username || 'desconocido',
        inspector: values.inspector || currentRecord?.inspector || 'N/A',
        horarioProgramacion: values.horarioProgramacion,
        zone: values.zone,
        id: values.id || generateId(),
        serieMdd: currentRecord?.serieMdd,
        mercado: values.mercado,
        observaciones: values.observaciones,
        collaboratorCompany: values.empresaColaboradora,
    };

    const docRef = doc(firestore, 'inspections', recordToSave.id);
    setDocumentNonBlocking(docRef, recordToSave, { merge: true });

    if (pageMode === 'edit' && currentRecord) {
         if (values.status !== currentRecord.status) {
            const creator = allUsers?.find(u => u.username === recordToSave.createdBy);
            const gestor = allUsers?.find(u => u.name === recordToSave.gestor);

            if (values.status === STATUS.APROBADA) {
                const coordinators = allUsers?.filter(u => u.role === ROLES.COORDINADOR_SSPP && (u.zone === recordToSave.zone || u.zone === 'Todas las zonas'));
                coordinators?.forEach(c => addNotification({
                    recipientUsername: c.username,
                    message: `Inspección ${recordToSave.id} aprobada en zona ${recordToSave.zone}.`,
                }));
            } else if (values.status === STATUS.NO_APROBADA || values.status === STATUS.RECHAZADA) {
                const statusText = values.status === STATUS.NO_APROBADA ? 'no aprobada' : 'rechazada';
                if (creator) addNotification({
                     recipientUsername: creator.username,
                     message: `Tu solicitud de inspección ${recordToSave.id} ha sido ${statusText}.`,
                });
                if (gestor) addNotification({
                    recipientUsername: gestor.username,
                    message: `La inspección ${recordToSave.id} asignada a ti ha sido ${statusText}.`,
                });
            }
        }
    } else {
        const gestorUser = allUsers?.find(u => u.name === values.gestor);
        if (gestorUser) {
            addNotification({
                recipientUsername: gestorUser.username,
                message: `Nueva inspección individual (${recordToSave.id}) te ha sido asignada.`,
            });
        }
    }
    
    setCreatedRecordInfo({ ids: [recordToSave.id], status: recordToSave.status });
    setIsSuccessDialogOpen(true);
    setIsSubmitting(false);
    setIsConfirming(false);
  }

  const handleReset = () => {
    if (pageMode === 'new') {
        const newId = generateId();
        form.reset({
            ...defaultValues,
            id: newId,
            status: getInitialStatus(user?.role),
            empresaColaboradora: isCollaborator ? user?.name : '',
        });
    } else if (currentRecord) {
        form.reset({
            ...currentRecord,
            fechaProgramacion: parse(currentRecord.requestDate, 'yyyy-MM-dd', new Date()),
        });
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
  
  const handleRecordUpdate = (updatedData: Partial<InspectionRecord>) => {
    if (currentRecord) {
        const newRecord: InspectionRecord = { 
            ...currentRecord, 
            ...updatedData,
            lastModifiedBy: user?.username,
            lastModifiedAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        };
        const docRef = doc(firestore, 'inspections', newRecord.id);
        setDocumentNonBlocking(docRef, newRecord, { merge: true });
        
        form.reset({ // Re-sync main form if needed
            ...newRecord,
            fechaProgramacion: parse(newRecord.requestDate, 'yyyy-MM-dd', new Date()),
        });
    }
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
       <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                <Link href={backPath}>
                    <ChevronLeft className="h-4 w-4" />
                </Link>
                </Button>
                <div>
                <h1 className="flex items-center gap-3 font-headline text-3xl font-semibold">
                    <FileIcon className="h-8 w-8 text-primary" />
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
            <div className="flex items-center gap-2">
                {showChecklistButton && (
                    <Dialog open={isChecklistOpen} onOpenChange={setIsChecklistOpen}>
                        <DialogTrigger asChild>
                            <Button variant="secondary" className="bg-orange-500 hover:bg-orange-600 text-white">
                                <ListChecks className="mr-2 h-4 w-4"/>
                                Check List
                            </Button>
                        </DialogTrigger>
                        <ChecklistForm record={currentRecord} onClose={() => setIsChecklistOpen(false)} onSave={handleRecordUpdate} />
                    </Dialog>
                )}
                {showSupportButton && (
                    <Dialog open={isSupportFormOpen} onOpenChange={setIsSupportFormOpen}>
                        <DialogTrigger asChild>
                            <Button variant="secondary" className="bg-blue-600 hover:bg-blue-700 text-white">
                                <BadgeCheck className="mr-2 h-4 w-4"/>
                                Validar Datos (Soporte)
                            </Button>
                        </DialogTrigger>
                        <SupportValidationForm user={user} record={currentRecord} onClose={() => setIsSupportFormOpen(false)} onSave={handleRecordUpdate} />
                    </Dialog>
                )}
            </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={(e) => { e.preventDefault(); handlePreview() }} className="space-y-8">

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
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={isFieldDisabled('sector')}>
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
                          <FormControl><Input placeholder="Ej. AT-12345678" {...field} maxLength={11} disabled={isFieldDisabled('caso')} /></FormControl>
                          <FormMessage />
                      </FormItem>
                  )} />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
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
                </div>

                <div className="grid md:grid-cols-2 gap-6">
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
                <div className="grid md:grid-cols-4 gap-6">
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
                </div>
                <FormField control={form.control} name="observaciones" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Observaciones (Opcional)</FormLabel>
                        <FormControl>
                            <Textarea 
                                placeholder="Añadir comentarios o notas relevantes para la inspección..."
                                {...field} 
                                disabled={isFieldDisabled('observaciones')}
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
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={isFieldDisabled('empresaColaboradora')}>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isFieldDisabled('gestor')}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un gestor" /></SelectTrigger></FormControl>
                        <SelectContent>
                            {availableManagers?.map(i => <SelectItem key={i.id} value={i.name}>{i.name}</SelectItem>)}
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
                            {availableInstallers?.map(i => <SelectItem key={i.id} value={i.name}>{i.name}</SelectItem>)}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )} />
                    <FormField control={form.control} name="inspector" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Inspector</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isFieldDisabled('inspector')}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un inspector" /></SelectTrigger></FormControl>
                        <SelectContent>
                            {availableInspectors?.map(i => <SelectItem key={i.id} value={i.name}>{i.name}</SelectItem>)}
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
                                    disabled={isFieldDisabled('fechaProgramacion')}
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
                                <Input type="time" {...field} disabled={isFieldDisabled('horarioProgramacion')} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                <FormField control={form.control} name="status" render={({ field }) => (
                   <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isFieldDisabled('status')}>
                      <FormControl>
                          <SelectTrigger><SelectValue placeholder="Selecciona un estado" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableStatusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                     </Select>
                    <FormMessage />
                  </FormItem>
                )} />

              </CardContent>
            </Card>

            {pageMode !== 'view' && (
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
                router.push(backPath);
              }}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}
