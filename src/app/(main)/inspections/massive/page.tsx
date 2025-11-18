'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { CalendarIcon, ChevronLeft, Loader2, PlusCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, isSunday } from "date-fns";
import { es } from 'date-fns/locale';
import React, { useMemo } from "react";

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
import { ROLES, Role } from "@/lib/types";
import { mockInstallers, sampleCollaborators, sampleSectors, mockMunicipalities, sampleExpansionManagers } from "@/lib/mock-data";
import { Separator } from "@/components/ui/separator";

const inspectionDetailSchema = z.object({
  id: z.string(),
  poliza: z.string().optional(),
  caso: z.string().max(11, 'El caso no debe exceder los 11 caracteres.').optional().refine(val => !val || /^AT-\d{7}$/.test(val), {
    message: 'El formato debe ser AT-XXXXXXX'
  }),
  portal: z.string().optional(),
  escalera: z.string().optional(),
  piso: z.string().optional(),
  puerta: z.string().optional(),
});

const formSchema = z.object({
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

  empresaColaboradora: z.string().min(1, "La empresa colaboradora es requerida."),
  fechaProgramacion: z.date({ required_error: "La fecha de programación es requerida." }),
  horarioProgramacion: z.string().min(1, "El horario es requerido."),
  instalador: z.string().min(1, "El instalador es requerido."),
  gestor: z.string().min(1, "El gestor es requerido."),
  sector: z.string().min(1, "El sector es requerido."),
  status: z.string(),
  
  // Array of inspections
  inspections: z.array(inspectionDetailSchema).min(1, "Debe agregar al menos una inspección.").max(4, "No puede agregar más de 4 inspecciones."),
});

export default function MassiveInspectionPage() {
  const { toast } = useToast();
  const { user, weekendsEnabled } = useAppContext();
  const router = useRouter();

  const getInitialStatus = (role: Role | undefined) => {
    switch (role) {
      case ROLES.GESTOR: return "CONFIRMADA POR GE";
      case ROLES.COLABORADOR:
      default: return "REGISTRADA";
    }
  };

  const generateId = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `INSP-IM-${timestamp}-${random}`;
  };

  const defaultValues = useMemo(() => ({
    municipality: "",
    colonia: "",
    calle: "",
    numero: "",
    tipoInspeccion: "Programacion PES",
    tipoProgramacion: "",
    tipoMdd: "",
    mercado: "",
    oferta: "",
    empresaColaboradora: "",
    horarioProgramacion: "",
    instalador: "",
    gestor: "",
    sector: "",
    status: getInitialStatus(user?.role),
    inspections: [{ id: generateId(), poliza: "", caso: "", portal: "", escalera: "", piso: "", puerta: "" }],
  }), [user?.role]);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "inspections"
  });

  const { isSubmitting } = form.formState;

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log({ ...values });

    toast({
      title: "Solicitudes Enviadas",
      description: `Se crearon ${values.inspections.length} solicitudes masivas con estatus: ${values.status}.`,
    });
    
    setTimeout(() => {
      router.push('/records');
    }, 1000);
  }

  const handleReset = () => {
    form.reset(defaultValues);
  }
  
  const handleUpperCase = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: any) => {
      field.onChange(e.target.value.toUpperCase());
  }
  
  const addInspection = () => {
    if (fields.length < 4) {
      append({ id: generateId(), poliza: "", caso: "", portal: "", escalera: "", piso: "", puerta: "" });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/inspections">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="font-headline text-3xl font-semibold">Programación Masiva de PES</h1>
          <p className="text-muted-foreground">Formulario para múltiples Puestas en Servicio en una misma dirección.</p>
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

            <Card>
              <CardHeader>
                <CardTitle>Ubicación Común del Servicio</CardTitle>
                <CardDescription>Dirección principal donde se realizarán las inspecciones.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
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
                <div className="md:col-span-2 grid md:grid-cols-2 gap-6">
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
                                        <FormControl><Input placeholder="Póliza" {...field} type="number" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name={`inspections.${index}.caso`} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Caso (AT) (Opcional)</FormLabel>
                                        <FormControl><Input placeholder="Ej. AT-1234567" {...field} /></FormControl>
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
              <CardContent className="grid gap-6 md:grid-cols-2">
                 <FormField control={form.control} name="tipoInspeccion" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Inspección</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
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
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un tipo" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {['SALESFORCE', 'PARRILLA', 'REPROGRAMACION', 'ESPONTANEA', 'PEC'].map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}
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
                        {['G-1,6', 'G-10', 'G-2,5', 'G-4', 'G-6', 'G-16', 'G-25', 'G-40'].map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}
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
                        {['ES-SV', 'CN', 'NE', 'SH', 'SP', 'SV'].map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un instalador" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {mockInstallers.map(i => <SelectItem key={i.id} value={i.name}>{i.name}</SelectItem>)}
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
                          <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
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
                <FormField control={form.control} name="gestor" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gestor</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un gestor" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {sampleExpansionManagers.map(i => <SelectItem key={i.id} value={i.name}>{i.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                 <FormField control={form.control} name="sector" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sector</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un sector" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {sampleSectors.map(s => <SelectItem key={s.id} value={s.sector}>{s.sector}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                 <FormField control={form.control} name="status" render={({ field }) => (
                   <FormItem>
                    <FormLabel>Status</FormLabel>
                     <FormControl>
                        <Input {...field} readOnly disabled />
                     </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={handleReset} disabled={isSubmitting}>Limpiar</Button>
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar
                </Button>
            </div>
        </form>
      </Form>
    </div>
  );
}
