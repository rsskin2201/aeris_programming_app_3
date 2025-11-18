'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { CalendarIcon, ChevronLeft, FileUp, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from 'date-fns/locale';

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/hooks/use-app-context";
import { ROLES, Role } from "@/lib/types";
import { mockInstallers, mockInstallerCompanies, mockSectors, mockMunicipalities } from "@/lib/mock-data";

const formSchema = z.object({
  contractNumber: z.string().min(1, "El número de contrato es requerido."),
  clientName: z.string().min(1, "El nombre del cliente es requerido."),
  address: z.string().min(1, "La dirección es requerida."),
  municipality: z.string().min(1, "El municipio es requerido."),
  sector: z.string().min(1, "El sector es requerido."),
  installerCompany: z.string().min(1, "La empresa instaladora es requerida."),
  installerName: z.string().min(1, "El nombre del instalador es requerido."),
  gasAppliances: z.coerce.number().min(1, "Debe haber al menos un aparato."),
  serviceType: z.string().min(1, "El tipo de servicio es requerido."),
  proposedDate: z.date({ required_error: "La fecha propuesta es requerida." }),
  preferredTime: z.string().min(1, "El horario preferido es requerido."),
  contactName: z.string().min(1, "El nombre de contacto es requerido."),
  contactPhone: z.string().min(1, "El teléfono de contacto es requerido.").refine(phone => /^\d{10}$/.test(phone), { message: "El teléfono debe tener 10 dígitos."}),
  observations: z.string().optional(),
});

export default function IndividualInspectionPage() {
  const { toast } = useToast();
  const { user } = useAppContext();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contractNumber: "",
      clientName: "",
      address: "",
      municipality: "",
      sector: "",
      installerCompany: "",
      installerName: "",
      gasAppliances: 1,
      serviceType: "",
      preferredTime: "",
      contactName: "",
      contactPhone: "",
      observations: "",
    },
  });

  const { isSubmitting } = form.formState;

  const getInitialStatus = (role: Role | undefined) => {
    switch (role) {
      case ROLES.GESTOR: return "Contemplado";
      case ROLES.CALIDAD: return "Aprobado";
      case ROLES.COLABORADOR:
      default: return "Pendiente Aprobación";
    }
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    const status = getInitialStatus(user?.role);
    console.log({ ...values, status });

    toast({
      title: "Solicitud Enviada",
      description: `La solicitud para ${values.clientName} se creó con estatus: ${status}.`,
    });
    
    setTimeout(() => {
      router.push('/records');
    }, 1000);
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
          <h1 className="font-headline text-3xl font-semibold">Programación Individual de PES</h1>
          <p className="text-muted-foreground">Formulario para una Puesta en Servicio en campo.</p>
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Información del Cliente y Servicio</CardTitle>
                <CardDescription>Proporciona los datos del cliente final y la ubicación de la inspección.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <FormField control={form.control} name="contractNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Contrato</FormLabel>
                    <FormControl><Input placeholder="Ej. 123456789" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="clientName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre Completo del Cliente</FormLabel>
                    <FormControl><Input placeholder="Ej. Juan Pérez" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Dirección Completa</FormLabel>
                    <FormControl><Input placeholder="Calle, Número, Colonia, C.P." {...field} /></FormControl>
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
                <FormField control={form.control} name="sector" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sector</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un sector" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {mockSectors.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalles de la Instalación</CardTitle>
                <CardDescription>Especifica los detalles técnicos de la instalación de gas.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <FormField control={form.control} name="installerCompany" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa Instaladora</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecciona una empresa" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {mockInstallerCompanies.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="installerName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Instalador</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un instalador" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {mockInstallers.map(i => <SelectItem key={i.id} value={i.name}>{i.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="gasAppliances" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de aparatos a gas</FormLabel>
                    <FormControl><Input type="number" min="1" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="serviceType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Servicio</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un tipo" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Doméstico">Doméstico</SelectItem>
                        <SelectItem value="Comercial">Comercial</SelectItem>
                         <SelectItem value="Industrial">Industrial</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Programación y Contacto</CardTitle>
                <CardDescription>Sugiere una fecha y proporciona la información de contacto en el sitio.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <FormField control={form.control} name="proposedDate" render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha propuesta de inspección</FormLabel>
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
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="preferredTime" render={({ field }) => (
                   <FormItem>
                    <FormLabel>Horario Preferido</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un horario" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="9:00 - 13:00">9:00 - 13:00 hrs</SelectItem>
                        <SelectItem value="13:00 - 18:00">13:00 - 18:00 hrs</SelectItem>
                        <SelectItem value="Abierto">Abierto</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="contactName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de Contacto en sitio</FormLabel>
                    <FormControl><Input placeholder="Quien recibirá al inspector" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="contactPhone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono de Contacto</FormLabel>
                    <FormControl><Input type="tel" placeholder="Ej. 5512345678" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Documentación y Observaciones</CardTitle>
                <CardDescription>Adjunta documentos necesarios y añade cualquier comentario relevante.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Carga de Dictamen Técnico (Opcional)</Label>
                  <div className="flex w-full items-center justify-center">
                    <Label htmlFor="dropzone-file" className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-card hover:bg-muted">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <FileUp className="mb-4 h-8 w-8 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click para subir</span> o arrastra y suelta</p>
                        <p className="text-xs text-muted-foreground">PDF, PNG, JPG (MAX. 5MB)</p>
                      </div>
                      <Input id="dropzone-file" type="file" className="hidden" />
                    </Label>
                  </div>
                  <FormDescription>Adjunta el dictamen técnico de la instalación si ya lo tienes.</FormDescription>
                </div>
                <FormField control={form.control} name="observations" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observaciones</FormLabel>
                    <FormControl><Textarea placeholder="Añade cualquier información adicional relevante para la inspección." className="resize-none" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enviar Solicitud
                </Button>
            </div>
        </form>
      </Form>
    </div>
  );
}
