'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2, CalendarIcon as CalendarIconLucide } from "lucide-react";
import React, { useEffect, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { es } from 'date-fns/locale';

import { Button } from "@/components/ui/button";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { InspectionRecord } from "@/lib/mock-data";
import { Checkbox } from "../ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";
import { STATUS, User } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

const formSchema = z.object({
  fechaConexion: z.date().optional(),
  datosConfirmados: z.boolean().optional(),
  observacionesSoporte: z.string().optional(),
  tipoRechazo: z.string().optional(),
  motivoRechazo: z.string().optional(),
}).refine(data => {
    const isConectada = data.fechaConexion && data.datosConfirmados;
    const isPendiente = data.tipoRechazo && data.motivoRechazo;
    return (isConectada && !isPendiente) || (!isConectada && isPendiente);
}, {
    message: "Debe completar la sección de 'Conectada' o la sección de 'Rechazo', pero no ambas.",
    path: ["fechaConexion"],
});

type FormValues = z.infer<typeof formSchema>;

interface SupportValidationFormProps {
    record: InspectionRecord | null;
    user: User | null;
    onClose: () => void;
    onSave: (updatedRecord: Partial<InspectionRecord>) => void;
}

export function SupportValidationForm({ record, user, onClose, onSave }: SupportValidationFormProps) {
    const { toast } = useToast();

    const defaultValues = useMemo(() => {
        return {
            fechaConexion: record?.fechaConexion ? parseISO(record.fechaConexion) : undefined,
            datosConfirmados: record?.datosConfirmados || false,
            observacionesSoporte: record?.observacionesSoporte || '',
            tipoRechazo: record?.tipoRechazo || '',
            motivoRechazo: record?.motivoRechazo || '',
        };
    }, [record]);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues,
        mode: "onChange",
    });

    useEffect(() => {
        form.reset(defaultValues);
    }, [defaultValues, form]);

    const { isSubmitting } = form.formState;

    function onSubmit(values: FormValues) {
        if (!record) return;

        let newStatus: STATUS;
        if (values.fechaConexion && values.datosConfirmados) {
            newStatus = STATUS.CONECTADA;
        } else if (values.tipoRechazo && values.motivoRechazo) {
            newStatus = STATUS.PENDIENTE_CORRECCION;
        } else {
            // This case should be prevented by the zod refine validation
            toast({
                variant: 'destructive',
                title: 'Error de validación',
                description: 'Debe completar los campos para conectar o para rechazar.',
            });
            return;
        }

        const updatedData: Partial<InspectionRecord> = {
            ...values,
            fechaConexion: values.fechaConexion ? format(values.fechaConexion, 'yyyy-MM-dd') : undefined,
            status: newStatus,
        };

        onSave(updatedData);

        toast({
            title: 'Validación Guardada',
            description: `La inspección ${record.id} ahora tiene el estatus: ${newStatus}.`,
        });
        onClose();
    }

    if (!record) return null;

  return (
    <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
            <DialogTitle>Validación de Soporte a Procesos</DialogTitle>
            <DialogDescription>
                Confirma los datos de la inspección, registra la fecha de conexión o informa un rechazo.
            </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                <div className="space-y-4 p-4 border rounded-md bg-muted/50">
                    <h4 className="font-semibold text-lg">Opción 1: Marcar como Conectada</h4>
                    <FormField
                        control={form.control}
                        name="fechaConexion"
                        render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Fecha de Conexión en Sistema</FormLabel>
                            <Popover>
                            <PopoverTrigger asChild>
                                <FormControl>
                                    <div className="relative">
                                    <Input
                                        value={field.value ? format(field.value, "PPP", { locale: es }) : ''}
                                        readOnly
                                        placeholder="Elige una fecha"
                                        className={cn("bg-background pl-3 pr-10 text-left font-normal", !field.value && "text-muted-foreground")}
                                    />
                                    <CalendarIconLucide className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
                                    </div>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                            </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="datosConfirmados"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border bg-background p-4">
                            <FormControl>
                                <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>
                                Confirmo que los datos de la inspección y el checklist coinciden con la instalación en campo.
                                </FormLabel>
                                <FormMessage />
                            </div>
                            </FormItem>
                        )}
                    />
                </div>

                <div className="space-y-4 p-4 border rounded-md bg-muted/50">
                     <h4 className="font-semibold text-lg">Opción 2: Marcar como Pendiente de Corrección</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="tipoRechazo"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tipo de Rechazo</FormLabel>
                                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar tipo..." /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {/* TODO: Add options in next iteration */}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                         <FormField
                            control={form.control}
                            name="motivoRechazo"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Motivo de Rechazo</FormLabel>
                                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar motivo..." /></SelectTrigger></FormControl>
                                    <SelectContent>
                                       {/* TODO: Add options in next iteration */}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                </div>

                <FormField
                    control={form.control}
                    name="observacionesSoporte"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Observaciones Generales (Opcional)</FormLabel>
                        <FormControl>
                            <Textarea
                                placeholder="Añade comentarios o notas relevantes..."
                                {...field}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                {form.formState.errors.fechaConexion && (
                    <p className="text-sm font-medium text-destructive">{form.formState.errors.fechaConexion.message}</p>
                )}
                
                {record.lastModifiedBy && record.lastModifiedAt && (
                    <div className="mt-4 rounded-md border bg-muted/50 p-4 text-xs text-muted-foreground">
                        <p><span className="font-semibold">Última Modificación:</span> {record.lastModifiedAt}</p>
                        <p><span className="font-semibold">Modificado por:</span> {record.lastModifiedBy}</p>
                    </div>
                )}
                
                <DialogFooter className="pt-4">
                    <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar Confirmación
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    </DialogContent>
  );
}
