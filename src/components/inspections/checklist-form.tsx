'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import React, { useEffect, useMemo } from "react";

import { Button } from '@/components/ui/button';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/hooks/use-app-context";
import { InspectionRecord } from "@/lib/mock-data";
import { MARCA_MDD, TIPO_MDD, SI_NO, MATERIAL_TUBERIA, EQUIPO, FORMA_PAGO } from "@/lib/form-options";
import { ScrollArea } from "../ui/scroll-area";
import { STATUS } from "@/lib/types";

const formSchema = z.object({
  inspector: z.string().min(1, "El inspector es requerido."),
  serieMdd: z.string().min(1, "Requerido"),
  marcaMdd: z.string().min(1, "Requerido"),
  tipoMddCampo: z.string().optional(),
  presion: z.string().min(1, "Requerido"),
  folioIt: z.string().min(1, "Requerido"),
  precinto: z.string().min(1, "Requerido"),
  epp: z.string().min(1, "Requerido"),
  controlPrevio: z.string().min(1, "Requerido"),
  mtsInstalados: z.string().min(1, "Requerido"),
  materialTuberia: z.string().min(1, "Requerido"),
  folioChecklist: z.string().min(1, "Requerido"),
  defectosCorregidos: z.string().optional(),
  defectosNoCorregidos: z.string().optional(),
  horaEntrada: z.string().min(1, "Requerido"),
  horaSalida: z.string().min(1, "Requerido"),
  ventilaPreexistente: z.string().min(1, "Requerido"),
  ventilacionEcc: z.string().min(1, "Requerido"),
  aparatosConectados: z.string().optional(),

  equipo_1: z.string().optional(),
  marca_eq1: z.string().optional(),
  coCor_eq1: z.string().optional(),
  coAmb_eq1: z.string().optional(),
  equipo_2: z.string().optional(),
  marca_eq2: z.string().optional(),
  coCor_eq2: z.string().optional(),
  coAmb_eq2: z.string().optional(),
  equipo_3: z.string().optional(),
  marca_eq3: z.string().optional(),
  coCor_eq3: z.string().optional(),
  coAmb_eq3: z.string().optional(),
  equipo_4: z.string().optional(),
  marca_eq4: z.string().optional(),
  coCor_eq4: z.string().optional(),
  coAmb_eq4: z.string().optional(),
  equipo_5: z.string().optional(),
  marca_eq5: z.string().optional(),
  coCor_eq5: z.string().optional(),
  coAmb_eq5: z.string().optional(),
  
  nombreCliente: z.string().min(1, "Requerido"),
  telCliente: z.string().min(1, "Requerido"),
  motivoCancelacion: z.string().optional(),
  comentariosOca: z.string().optional(),
  formaDePago: z.string().min(1, "Requerido"),
  equipoExtra: z.string().optional(),
  capturista: z.string(),
  hraDeAudio: z.string().optional(),
  infFormasPago: z.string().min(1, "Requerido"),
  altaSms: z.string().min(1, "Requerido"),
  appNaturgy: z.string().min(1, "Requerido"),
  entregaGuia: z.string().min(1, "Requerido"),
  status: z.string().min(1, "El estatus es requerido."),
});

type FormValues = z.infer<typeof formSchema>;

interface ChecklistFormProps {
    record: InspectionRecord | null;
    onClose: () => void;
    onSave: (updatedRecord: Partial<InspectionRecord>) => void;
}

export function ChecklistForm({ record, onClose, onSave }: ChecklistFormProps) {
    const { toast } = useToast();
    const { user, inspectors } = useAppContext();

    const defaultValues = useMemo(() => ({
        inspector: record?.inspector || '',
        serieMdd: record?.serieMdd || '',
        marcaMdd: record?.marcaMdd || '',
        tipoMddCampo: record?.tipoMddCampo || '',
        presion: record?.presion || '',
        folioIt: record?.folioIt || '',
        precinto: record?.precinto || '',
        epp: record?.epp || '',
        controlPrevio: record?.controlPrevio || '',
        mtsInstalados: record?.mtsInstalados || '',
        materialTuberia: record?.materialTuberia || '',
        folioChecklist: record?.folioChecklist || '',
        defectosCorregidos: record?.defectosCorregidos || '',
        defectosNoCorregidos: record?.defectosNoCorregidos || '',
        horaEntrada: record?.horaEntrada || '',
        horaSalida: record?.horaSalida || '',
        ventilaPreexistente: record?.ventilaPreexistente || '',
        ventilacionEcc: record?.ventilacionEcc || '',
        aparatosConectados: record?.aparatosConectados || '',

        equipo_1: record?.equipo_1 || '',
        marca_eq1: record?.marca_eq1 || '',
        coCor_eq1: record?.coCor_eq1 || '',
        coAmb_eq1: record?.coAmb_eq1 || '',
        equipo_2: record?.equipo_2 || '',
        marca_eq2: record?.marca_eq2 || '',
        coCor_eq2: record?.coCor_eq2 || '',
        coAmb_eq2: record?.coAmb_eq2 || '',
        equipo_3: record?.equipo_3 || '',
        marca_eq3: record?.marca_eq3 || '',
        coCor_eq3: record?.coCor_eq3 || '',
        coAmb_eq3: record?.coAmb_eq3 || '',
        equipo_4: record?.equipo_4 || '',
        marca_eq4: record?.marca_eq4 || '',
        coCor_eq4: record?.coCor_eq4 || '',
        coAmb_eq4: record?.coAmb_eq4 || '',
        equipo_5: record?.equipo_5 || '',
        marca_eq5: record?.marca_eq5 || '',
        coCor_eq5: record?.coCor_eq5 || '',
        coAmb_eq5: record?.coAmb_eq5 || '',

        nombreCliente: record?.nombreCliente || record?.client || '',
        telCliente: record?.telCliente || '',
        motivoCancelacion: record?.motivoCancelacion || '',
        comentariosOca: record?.comentariosOca || '',
        formaDePago: record?.formaDePago || '',
        equipoExtra: record?.equipoExtra || '',
        capturista: user?.name || '',
        hraDeAudio: record?.hraDeAudio || '',
        infFormasPago: record?.infFormasPago || '',
        altaSms: record?.altaSms || '',
        appNaturgy: record?.appNaturgy || '',
        entregaGuia: record?.entregaGuia || '',
        status: record?.status || STATUS.EN_PROCESO,
    }), [record, user?.name]);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues,
        mode: "onChange",
    });

    const aparatosConectados = form.watch('aparatosConectados');
    const numberOfEquipments = useMemo(() => parseInt(aparatosConectados || '0', 10), [aparatosConectados]);

    useEffect(() => {
        form.reset(defaultValues);
    }, [defaultValues, form]);

    const { isSubmitting } = form.formState;

    const availableInspectors = useMemo(() => {
        const recordZone = record?.zone;
        if (!recordZone) return [];
        return inspectors.filter(i => i.zone === recordZone && i.status === 'Activo');
    }, [record?.zone, inspectors]);
    
    function onSubmit(values: FormValues) {
        if (!record) return;

        const updatedData: Partial<InspectionRecord> = {
            ...values,
            client: values.nombreCliente,
        };

        onSave(updatedData);

        toast({
            title: 'Checklist Guardado',
            description: 'La información del checklist se ha guardado correctamente.',
        });
        onClose();
    }

    const handleUpperCase = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: any) => {
        field.onChange(e.target.value.toUpperCase());
    };

    if (!record) return null;

    return (
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>Checklist de Inspección en Campo</DialogTitle>
                <DialogDescription>
                    Formulario para registrar los detalles técnicos de la inspección. ID: {record.id}
                </DialogDescription>
            </DialogHeader>
    
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
                    <ScrollArea className="flex-1 pr-6 -mr-6">
                        <div className="space-y-6 py-4">
    
                            {/* Datos de Inspección y Medidor */}
                            <div className="space-y-4 p-4 border rounded-md">
                                <h3 className="font-semibold text-lg border-b pb-2">Datos de Inspección y Medidor</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <FormField control={form.control} name="inspector" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Inspector</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar inspector" /></SelectTrigger></FormControl>
                                                <SelectContent>{availableInspectors.map(i => <SelectItem key={i.id} value={i.name}>{i.name}</SelectItem>)}</SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="serieMdd" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>SERIE MDD</FormLabel>
                                            <FormControl><Input {...field} onChange={e => handleUpperCase(e, field)} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="marcaMdd" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>MARCA MDD</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccionar marca" /></SelectTrigger></FormControl><SelectContent>{MARCA_MDD.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="tipoMddCampo" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>TIPO MDD CAMPO</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger></FormControl><SelectContent>{TIPO_MDD.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="presion" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>PRESION DE TRABAJO (kg/cm2)</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                            </div>

                            {/* Detalles Técnicos de la Instalación */}
                            <div className="space-y-4 p-4 border rounded-md">
                                <h3 className="font-semibold text-lg border-b pb-2">Detalles Técnicos de la Instalación</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <FormField control={form.control} name="folioIt" render={({ field }) => (<FormItem><FormLabel>FOLIO IT</FormLabel><FormControl><Input {...field} onChange={e => handleUpperCase(e, field)} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="precinto" render={({ field }) => (<FormItem><FormLabel>PRECINTO</FormLabel><FormControl><Input {...field} onChange={e => handleUpperCase(e, field)} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="epp" render={({ field }) => (<FormItem><FormLabel>EPP</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl><SelectContent>{SI_NO.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="controlPrevio" render={({ field }) => (<FormItem><FormLabel>CONTROL PREVIO</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl><SelectContent>{SI_NO.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="mtsInstalados" render={({ field }) => (<FormItem><FormLabel>MTS INSTALADOS</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="materialTuberia" render={({ field }) => (<FormItem><FormLabel>MATERIAL DE TUBERIA</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccionar material" /></SelectTrigger></FormControl><SelectContent>{MATERIAL_TUBERIA.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="folioChecklist" render={({ field }) => (<FormItem><FormLabel>FOLIO CHECK LIST</FormLabel><FormControl><Input {...field} onChange={e => handleUpperCase(e, field)} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="horaEntrada" render={({ field }) => (<FormItem><FormLabel>HRA ENTRADA</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="horaSalida" render={({ field }) => (<FormItem><FormLabel>HRA SALIDA</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="ventilaPreexistente" render={({ field }) => (<FormItem><FormLabel>VENTILA PREEXISTENTE</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl><SelectContent>{SI_NO.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="ventilacionEcc" render={({ field }) => (<FormItem><FormLabel>VENTILACION ECC</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl><SelectContent>{SI_NO.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                </div>
                                <FormField control={form.control} name="defectosCorregidos" render={({ field }) => (<FormItem><FormLabel>DEFECTOS CORREGIDOS</FormLabel><FormControl><Textarea {...field} onChange={e => handleUpperCase(e, field)} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="defectosNoCorregidos" render={({ field }) => (<FormItem><FormLabel>DEFECTOS NO CORREGIDOS</FormLabel><FormControl><Textarea {...field} onChange={e => handleUpperCase(e, field)} /></FormControl><FormMessage /></FormItem>)} />
                            </div>

                            {/* Equipos Conectados */}
                            <div className="space-y-4 p-4 border rounded-md">
                                <h3 className="font-semibold text-lg border-b pb-2">Equipos Conectados</h3>
                                <FormField control={form.control} name="aparatosConectados" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>APARATOS CONECTADOS</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccione la cantidad de equipos" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {['1', '2', '3', '4', '5'].map(num => (
                                                    <SelectItem key={num} value={num}>{num}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                {numberOfEquipments > 0 && Array.from({ length: numberOfEquipments }, (_, i) => i + 1).map(i => (
                                    <div key={i} className="p-3 border rounded-md space-y-3">
                                        <h4 className="font-medium">Equipo {i}</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                            <FormField control={form.control} name={`equipo_${i}` as any} render={({ field }) => (<FormItem><FormLabel>EQUIPO_{i}</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl><SelectContent>{EQUIPO.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                            <FormField control={form.control} name={`marca_eq${i}` as any} render={({ field }) => (<FormItem><FormLabel>MARCA_EQ{i}</FormLabel><FormControl><Input {...field} onChange={e => handleUpperCase(e, field)} /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={form.control} name={`coCor_eq${i}` as any} render={({ field }) => (<FormItem><FormLabel>CO COR (PPM)_EQ{i}</FormLabel><FormControl><Input {...field} onChange={e => handleUpperCase(e, field)} /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={form.control} name={`coAmb_eq${i}` as any} render={({ field }) => (<FormItem><FormLabel>CO AMB (PPM)_EQ{i}</FormLabel><FormControl><Input {...field} onChange={e => handleUpperCase(e, field)} /></FormControl><FormMessage /></FormItem>)} />
                                        </div>
                                    </div>
                                ))}
                            </div>
    
                            {/* Cierre y Validación del Cliente */}
                            <div className="space-y-4 p-4 border rounded-md">
                                <h3 className="font-semibold text-lg border-b pb-2">Cierre y Validación del Cliente</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <FormField control={form.control} name="nombreCliente" render={({ field }) => (<FormItem><FormLabel>NOMBRE DEL CLIENTE</FormLabel><FormControl><Input {...field} onChange={e => handleUpperCase(e, field)} /></FormControl><FormMessage /></FormItem>)} />
                                  <FormField control={form.control} name="telCliente" render={({ field }) => (<FormItem><FormLabel>TEL. CLIENTE</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                </div>
                                <FormField control={form.control} name="comentariosOca" render={({ field }) => (<FormItem><FormLabel>COMENTARIOS OCA</FormLabel><FormControl><Textarea {...field} onChange={e => handleUpperCase(e, field)}/></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="motivoCancelacion" render={({ field }) => (<FormItem><FormLabel>MOTIVO CANCELACION / NO APROBACION</FormLabel><FormControl><Textarea {...field} onChange={e => handleUpperCase(e, field)}/></FormControl><FormMessage /></FormItem>)} />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <FormField control={form.control} name="formaDePago" render={({ field }) => (<FormItem><FormLabel>FORMA DE PAGO</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl><SelectContent>{FORMA_PAGO.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                  <FormField control={form.control} name="equipoExtra" render={({ field }) => (<FormItem><FormLabel>EQUIPO EXTRA</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                </div>
                            </div>

                             {/* Información Adicional */}
                            <div className="space-y-4 p-4 border rounded-md">
                                <h3 className="font-semibold text-lg border-b pb-2">Información Adicional (Post-Venta)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                  <FormField control={form.control} name="infFormasPago" render={({ field }) => (<FormItem><FormLabel>INF FORMAS PAGO</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl><SelectContent>{SI_NO.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                  <FormField control={form.control} name="altaSms" render={({ field }) => (<FormItem><FormLabel>ALTA DE SMS</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl><SelectContent>{SI_NO.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                  <FormField control={form.control} name="appNaturgy" render={({ field }) => (<FormItem><FormLabel>APP NATURGY</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl><SelectContent>{SI_NO.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                  <FormField control={form.control} name="entregaGuia" render={({ field }) => (<FormItem><FormLabel>ENTREGA DE GUIA</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl><SelectContent>{SI_NO.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   <FormField control={form.control} name="capturista" render={({ field }) => (<FormItem><FormLabel>CAPTURISTA</FormLabel><FormControl><Input {...field} readOnly disabled /></FormControl><FormMessage /></FormItem>)} />
                                   <FormField control={form.control} name="hraDeAudio" render={({ field }) => (<FormItem><FormLabel>HRA DE AUDIO</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                </div>
                            </div>
                            
                            {/* Estatus de la Inspección */}
                            <div className="space-y-4 p-4 border rounded-md">
                                <h3 className="font-semibold text-lg border-b pb-2">Resultado de la Inspección</h3>
                                <FormField control={form.control} name="status" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Dictamen Final</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar resultado" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value={STATUS.APROBADA}>APROBADA</SelectItem>
                                                <SelectItem value={STATUS.NO_APROBADA}>NO APROBADA</SelectItem>
                                                <SelectItem value={STATUS.PENDIENTE_CORRECCION}>PENDIENTE CORRECCION</SelectItem>
                                                <SelectItem value={STATUS.CANCELADA}>CANCELADA</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>

                        </div>
                    </ScrollArea>
        
                    <DialogFooter className="pt-6 border-t mt-4">
                        <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar Checklist
                        </Button>
                    </DialogFooter>
        
                </form>
            </Form>
        </DialogContent>
    );
}
