import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function InspectionsPage() {
  return (
    <div>
      <h1 className="font-headline text-3xl font-semibold mb-4">Gestión de Inspecciones</h1>
      <p className="text-muted-foreground mb-8">Selecciona el tipo de programación que deseas realizar.</p>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Programación Individual de PES</CardTitle>
            <CardDescription>Para solicitudes de una Puesta en Servicio en campo.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/inspections/individual">Iniciar Solicitud</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Programación Masiva de PES</CardTitle>
            <CardDescription>Para solicitudes masivas en una misma dirección.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="#">Iniciar Solicitud</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Programaciones Especiales (No PES)</CardTitle>
            <CardDescription>Otras inspecciones que no son Puesta en Servicio.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="#">Iniciar Solicitud</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
