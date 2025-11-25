'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { Loader2, PlusCircle, Trash2 } from "lucide-react";
import React, { useEffect, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/hooks/use-app-context";
import { InspectionRecord } from "@/lib/mock-data";
import { MARCA_MDD, TIPO_MDD, SI_NO, MATERIAL_TUBERIA, EQUIPO, FORMA_PAGO } from "@/lib/form-options";
import { ScrollArea } from "../ui/scroll-area";
import { STATUS } from "@/lib/types";

const equipmentSchema = z.object({
  equipo: z.string().min(1, "Requerido"),
  marca: z.string().min(1, "Requerido"),
  coCor: z.string().min(1, "Requerido"),
  coAmb: z.string().min(1, "Requerido"),
});

const formSchema = z.object({
  inspector: z.string().min(1, "El inspector es requerido."),
  serieMdd: z.string().min(1, "Requerido"),
  marcaMdd: z.string().min(1, "Requerido"),
  tipoMddCampo: z.string().min(1, "Requerido"),
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
  
  numEquipos: z.coerce.number().int().min(0, "Debe ser 0 o más").max(10, "Máximo 10 equipos"),
  equipos: z.array(equipmentSchema).optional(),

  nombreCliente: z.string().min(1, "Requerido"),
  telCliente: z.string().min(1, "Requerido"),
  motivoCancelacion: z.string().optional(),
  comentariosOca: z.string().optional(),
  formaDePago: z.string().min(1, "Requerido"),
  equipoExtra: z.string().optional(),
  capturista: z.string(),
  infFormasDePago: z.string().min(1, "Requerido"),
  altaSms: z.string().min(1, "Requerido"),
  appNaturgy: z.string().min(1, "Requerido"),
  entregaGuia: z.string().min(1, "Requerido"),
  status: z.string().optional(),
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

    const defaultValues = useMemo(() => {
        const getEquipos = () => {
            const equipos = [];
            if (record?.equipo_1) equipos.push({ equipo: record.equipo_1, marca: record.marca_eq1 || '', coCor: record.coCor_eq1 || '', coAmb: record.coAmb_eq1 || '' });
            if (record?.equipo_2) equipos.push({ equipo: record.equipo_2, marca: record.marca_eq2 || '', coCor: record.coCor_eq2 || '', coAmb: record.coAmb_eq2 || '' });
            if (record?.equipo_3) equipos.push({ equipo: record.equipo_3, marca: record.marca_eq3 || '', coCor: record.coCor_eq3 || '', coAmb: record.coAmb_eq3 || '' });
            if (record?.equipo_4) equipos.push({ equipo: record.equipo_4, marca: record.marca_eq4 || '', coCor: record.coCor_eq4 || '', coAmb: record.coAmb_eq4 || '' });
            if (record?.equipo_5) equipos.push({ equipo: record.equipo_5, marca: record.marca_eq5 || '', coCor: record.coCor_eq5 || '', coAmb: record.coAmb_eq5 || '' });
            return equipos;
        };
        const equipos = getEquipos();

        return {
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
            numEquipos: equipos.length,
            equipos: equipos,
            nombreCliente: record?.nombreCliente || record?.client || '',
            telCliente: record?.telCliente || '',
            motivoCancelacion: record?.motivoCancelacion || '',
            comentariosOca: record?.comentariosOca || '',
            formaDePago: record?.formaDePago || '',
            equipoExtra: record?.equipoExtra || '',
            capturista: user?.name || '',
            infFormasDePago: record?.infFormasPago || '',
            altaSms: record?.altaSms || '',
            appNaturgy: record?.appNaturgy || '',
            entregaGuia: record?.entregaGuia || '',
            status: record?.status,
        };
    }, [record, user?.name]);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues,
        mode: "onChange",
    });

    useEffect(() => {
        form.reset(defaultValues);
    }, [defaultValues, form]);


    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "equipos"
    });

    const numEquipos = form.watch('numEquipos');

    React.useEffect(() => {
        const diff = numEquipos - fields.length;
        if (diff > 0) {
            for (let i = 0; i < diff; i++) {
                append({ equipo: '', marca: '', coCor: '', coAmb: '' });
            }
        } else if (diff < 0) {
            for (let i = 0; i < Math.abs(diff); i++) {
                remove(fields.length - 1 - i);
            }
        }
    }, [numEquipos, fields.length, append, remove]);


    const { isSubmitting } = form.formState;

    const availableInspectors = useMemo(() => {
        const recordZone = record?.zone;
        if (!recordZone) return [];
        return inspectors.filter(i => i.zone === recordZone);
    }, [record?.zone, inspectors]);

    function onSubmit(values: FormValues) {
        if (!record) return;

        const updatedData: Partial<InspectionRecord> = {
            ...values,
            equipo_1: values.equipos?.[0]?.equipo,
            marca_eq1: values.equipos?.[0]?.marca,
            coCor_eq1: values.equipos?.[0]?.coCor,
            coAmb_eq1: values.equipos?.[0]?.coAmb,
            equipo_2: values.equipos?.[1]?.equipo,
            marca_eq2: values.equipos?.[1]?.marca,
            coCor_eq2: values.equipos?.[1]?.coCor,
            coAmb_eq2: values.equipos?.[1]?.coAmb,
            equipo_3: values.equipos?.[2]?.equipo,
            marca_eq3: values.equipos?.[2]?.marca,
            coCor_eq3: values.equipos?.[2]?.coCor,
            coAmb_eq3: values.equipos?.[2]?.coAmb,
            equipo_4: values.equipos?.[3]?.equipo,
            marca_eq4: values.equipos?.[3]?.marca,
            coCor_eq4: values.equipos?.[3]?.coCor,
            coAmb_eq4: values.equipos?.[3]?.coAmb,
            equipo_5: values.equipos?.[4]?.equipo,
            marca_eq5: values.equipos?.[4]?.marca,
            coCor_eq5: values.equipos?.[4]?.coCor,
            coAmb_eq5: values.equipos?.[4]?.coAmb,
            client: values.nombreCliente,
            status: (values.status as any) || record.status,
        };

        onSave(updatedData);

        toast({
        title: 'Checklist Guardado',
        description: 'La información del checklist se ha guardado correctamente.',
        });
        onClose();
    }

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
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 min-h-0">
                <ScrollArea className="h-full pr-6">
                    <div className="space-y-8 py-4">
                        {/* Datos Programación */}
                        <div className="space-y-4 p-4 border rounded-md">
                            <h3 className="font-semibold text-lg">Datos Programación</h3>
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
                                    <FormItem><FormLabel>Serie MDD</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="marcaMdd" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Marca MDD</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar marca" /></SelectTrigger></FormControl>
                                            <SelectContent>{MARCA_MDD.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="tipoMddCampo" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo MDD Campo</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger></FormControl>
                                            <SelectContent>{TIPO_MDD.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="presion" render={({ field }) => (
                                    <FormItem><FormLabel>Presión (kg/cm2)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="folioIt" render={({ field }) => (
                                    <FormItem><FormLabel>Folio IT</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="precinto" render={({ field }) => (
                                    <FormItem><FormLabel>Precinto</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="epp" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>EPP</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                                            <SelectContent>{SI_NO.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="controlPrevio" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Control Previo</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                                            <SelectContent>{SI_NO.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="mtsInstalados" render={({ field }) => (
                                    <FormItem><FormLabel>Mts Instalados</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="materialTuberia" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Material Tubería</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar material" /></SelectTrigger></FormControl>
                                            <SelectContent>{MATERIAL_TUBERIA.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="folioChecklist" render={({ field }) => (
                                    <FormItem><FormLabel>Folio Check List</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="horaEntrada" render={({ field }) => (
                                    <FormItem><FormLabel>Hora Entrada</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="horaSalida" render={({ field }) => (
                                    <FormItem><FormLabel>Hora Salida</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="ventilaPreexistente" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ventila Preexistente</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                                            <SelectContent>{SI_NO.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="ventilacionEcc" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ventilación ECC</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                                            <SelectContent>{SI_NO.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="defectosCorregidos" render={({ field }) => (
                                    <FormItem className="lg:col-span-2"><FormLabel>Defectos Corregidos</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="defectosNoCorregidos" render={({ field }) => (
                                    <FormItem className="lg:col-span-2"><FormLabel>Defectos No Corregidos</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                        </div>

                        {/* Equipos */}
                        <div className="space-y-4 p-4 border rounded-md">
                            <h3 className="font-semibold text-lg">Equipos</h3>
                             <FormField control={form.control} name="numEquipos" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Número de Equipos Conectados</FormLabel>
                                    <FormControl><Input type="number" min="0" max="10" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            {fields.map((field, index) => (
                                <div key={field.id} className="p-3 border rounded-md space-y-3">
                                    <h4 className="font-medium">Equipo {index + 1}</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                         <FormField control={form.control} name={`equipos.${index}.equipo`} render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Equipo</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                                                    <SelectContent>{EQUIPO.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name={`equipos.${index}.marca`} render={({ field }) => (
                                            <FormItem><FormLabel>Marca</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name={`equipos.${index}.coCor`} render={({ field }) => (
                                            <FormItem><FormLabel>Co Cor PPM</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name={`equipos.${index}.coAmb`} render={({ field }) => (
                                            <FormItem><FormLabel>Co AMB PPM</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {/* Datos Complementarios */}
                        <div className="space-y-4 p-4 border rounded-md">
                            <h3 className="font-semibold text-lg">Datos Complementarios</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <FormField control={form.control} name="status" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Resultado de Inspección</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar resultado" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value={STATUS.APROBADA}>Aprobada</SelectItem>
                                                <SelectItem value={STATUS.NO_APROBADA}>No Aprobada</SelectItem>
                                                <SelectItem value={STATUS.CANCELADA}>Cancelada</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="nombreCliente" render={({ field }) => (
                                    <FormItem><FormLabel>Nombre del Cliente</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="telCliente" render={({ field }) => (
                                    <FormItem><FormLabel>Tel Cliente</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="formaDePago" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Forma de Pago</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                                            <SelectContent>{FORMA_PAGO.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                 <FormField control={form.control} name="equipoExtra" render={({ field }) => (
                                    <FormItem><FormLabel>Equipo Extra</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                 <FormField control={form.control} name="capturista" render={({ field }) => (
                                    <FormItem><FormLabel>Capturista</FormLabel><FormControl><Input {...field} disabled readOnly /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="infFormasDePago" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Inf Formas de Pago</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                                            <SelectContent>{SI_NO.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="altaSms" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Alta de SMS</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                                            <SelectContent>{SI_NO.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="appNaturgy" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>App Naturgy</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                                            <SelectContent>{SI_NO.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="entregaGuia" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Entrega de Guía</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                                            <SelectContent>{SI_NO.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="motivoCancelacion" render={({ field }) => (
                                    <FormItem className="md:col-span-2"><FormLabel>Motivo Cancelación/No Aprobación</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="comentariosOca" render={({ field }) => (
                                    <FormItem className="md:col-span-2"><FormLabel>Comentarios OCA</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                        </div>
                    </div>
                </ScrollArea>
                <DialogFooter className="pt-6 border-t">
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

    