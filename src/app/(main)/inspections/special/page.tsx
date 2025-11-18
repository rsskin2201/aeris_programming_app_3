'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { CalendarIcon, ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, isSunday } from "date-fns";
import { es } from 'date-fns/locale';

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
import { ROLES, Role } from "@/lib/types";
import { sampleInstallers, sampleCollaborators, sampleSectors, mockMunicipalities, sampleExpansionManagers } from "@/lib/mock-data";
import { useMemo } from "react";

const formSchema = z.object({
  id: z.string().optional(),
  poliza: z.string().optional(),
  caso: z.string().optional().refine(val => !val || /^AT-\d{7}$/.test(val), {
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
  tipoMdd: z.string().optional(),
  mercado: z.string().min(1, "El mercado es requerido."),
  oferta: z.string().optional(),

  empresaColaboradora: z.string().min(1, "La empresa colaboradora es requerida."),
  fechaProgramacion: z.date({ required_error: "La fecha de programación es requerida." }),
  horarioProgramacion: z.string().min(1, "El horario es requerido."),
  instalador: z.string().min(1, "El instalador es requerido."),
  gestor: z.string().min(1, "El gestor es requerido."),
  sector: z.string().min(1, "El sector es requerido."),
  
  status: z.string(),
});

const inspectionTypes = [
    'Retiro de Cercha', 
    'Reclamacion',
    'Calibracion',
    'Terminacion de Obra',
    'Inspección de PH-IRC',
    'PH Monoxido',
    'Pre Inspección IRI',
    'Pre Inspección IRC',
    'Retiro de Termomanografo'
];

export default function SpecialInspectionPage() {
  const { toast } = useToast();
  const { user, zone, weekendsEnabled } = useAppContext();
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
    return `INSP-ES-${timestamp}-${random}`;
  };

  const defaultValues = useMemo(() => ({
    id: generateId(),
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
    empresaColaboradora: "",
    horarioProgramacion: "",
    instalador: "",
    gestor: "",
    sector: "",
    status: getInitialStatus(user?.role),
  }), [user?.role]);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  
  const { isSubmitting } = form.formState;


  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log({ ...values });

    toast({
      title: "Solicitud Enviada",
      description: `La solicitud especial con ID ${values.id} se creó con estatus: ${values.status}.`,
    });
    
    setTimeout(() => {
      router.push('/records');
    }, 1000);
  }

  const handleReset = () => {
    const newId = generateId();
    form.reset({
        ...defaultValues,
        id: newId,
        status: getInitialStatus(user?.role)
    });
  }
  
  const handleUpperCase = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: any) => {
      field.onChange(e.target.value.toUpperCase());
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
          <h1 className="font-headline text-3xl font-semibold">Programación Especial (No PES)</h1>
          <p className="text-muted-foreground">Formulario para otras inspecciones que no son Puesta en Servicio.</p>
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

            <Card>
              <CardHeader>
                <CardTitle>Ubicación del Servicio</CardTitle>
                <CardDescription>Dirección donde se realizará la inspección.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="md:col-span-2">
                    <FormField control={form.control} name="id" render={({ field }) => (
                        <FormItem>
                            <FormLabel>ID de Registro</FormLabel>
                            <FormControl><Input {...field} readOnly disabled className="font-mono" /></FormControl>
                        </FormItem>
                    )} />
                </div>
                 <FormField control={form.control} name="poliza" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Póliza</FormLabel>
                        <FormControl><Input placeholder="Opcional" {...field} type="text" inputMode="numeric" pattern="[0-9]*" /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="caso" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Caso (AT)</FormLabel>
                        <FormControl><Input placeholder="Ej. AT-1234567" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

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
                            <FormControl><Input placeholder="Número exterior/interior" {...field} onChange={(e) => handleUpperCase(e, field)} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un tipo" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {inspectionTypes.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}
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
                        {['PARRILLA', 'REPROGRAMACION', 'ESPONTANEA'].map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}
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
                        <FormLabel>Oferta/Campaña (Opcional)</FormLabel>
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
