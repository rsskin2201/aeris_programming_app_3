'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2, CalendarIcon as CalendarIconLucide } from "lucide-react";
import React, { useEffect, useMemo } from "react";
import { format } from "date-fns";
import { es } from 'date-fns/locale';

import { Button } from "@/components/ui/button";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/hooks/use-app-context";
import { InspectionRecord } from "@/lib/mock-data";
import { Checkbox } from "../ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";
import { STATUS } from "@/lib/types";

const formSchema = z.object({
  fechaConexion: z.date({ required_error: "La fecha es requerida." }),
  datosConfirmados: z.boolean().refine(val => val === true, {
    message: "Debes confirmar la validación de los datos."
  }),
  observacionesSoporte: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface SupportValidationFormProps {
    record: InspectionRecord | null;
    onClose: () => void;
    onSave: (updatedRecord: Partial<InspectionRecord>) => void;
}

export function SupportValidationForm({ record, onClose, onSave }: SupportValidationFormProps) {
    const { toast } = useToast();

    const defaultValues = useMemo(() => {
        return {
            fechaConexion: record?.fechaConexion ? new Date(record.fechaConexion) : new Date(),
            datosConfirmados: record?.datosConfirmados || false,
            observacionesSoporte: record?.observacionesSoporte || '',
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

        const updatedData: Partial<InspectionRecord> = {
            ...values,
            fechaConexion: format(values.fechaConexion, 'yyyy-MM-dd'),
            status: STATUS.RESULTADO_REGISTRADO,
        };

        onSave(updatedData);

        toast({
            title: 'Validación Guardada',
            description: `La validación de soporte para la inspección ${record.id} se ha guardado.`,
        });
        onClose();
    }

    if (!record) return null;

  return (
    <DialogContent className="sm:max-w-md">
        <DialogHeader>
            <DialogTitle>Validación de Soporte a Procesos</DialogTitle>
            <DialogDescription>
                Confirma los datos de la inspección y registra la fecha de conexión.
            </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
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
                                    className={cn("pl-3 pr-10 text-left font-normal", !field.value && "text-muted-foreground")}
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
                    name="observacionesSoporte"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Observaciones (Opcional)</FormLabel>
                        <FormControl>
                            <Textarea
                                placeholder="Añade comentarios o notas relevantes..."
                                {...field}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <FormField
                    control={form.control}
                    name="datosConfirmados"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
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
