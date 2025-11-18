'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useAppContext } from "@/hooks/use-app-context";
import { PERMISSIONS } from "@/lib/permissions";
import { MODULES } from "@/lib/types";

const inspectionTypes = [
    {
        id: 'individual',
        title: 'Programación Individual de PES',
        description: 'Para solicitudes de una Puesta en Servicio en campo.',
        href: '/inspections/individual',
        requiredModule: MODULES.INSPECTIONS, // Assuming this is the correct module
    },
    {
        id: 'masiva',
        title: 'Programación Masiva de PES',
        description: 'Para solicitudes masivas en una misma dirección.',
        href: '#', // Not implemented yet
        requiredModule: MODULES.INSPECTIONS,
    },
    {
        id: 'especial',
        title: 'Programaciones Especiales (No PES)',
        description: 'Otras inspecciones que no son Puesta en Servicio.',
        href: '/inspections/special',
        requiredModule: MODULES.INSPECTIONS,
    }
]


export default function InspectionsPage() {
    const { user } = useAppContext();
    if (!user) return null;

    const userPermissions = PERMISSIONS[user.role] || [];
    const visibleCards = inspectionTypes.filter(it => userPermissions.includes(it.requiredModule));

  return (
    <div>
      <h1 className="font-headline text-3xl font-semibold mb-4">Gestión de Inspecciones</h1>
      <p className="text-muted-foreground mb-8">Selecciona el tipo de programación que deseas realizar.</p>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {visibleCards.map(card => (
             <Card key={card.id}>
                <CardHeader>
                    <CardTitle>{card.title}</CardTitle>
                    <CardDescription>{card.description}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild disabled={card.href === '#'}>
                        <Link href={card.href}>Iniciar Solicitud</Link>
                    </Button>
                </CardContent>
            </Card>
        ))}
      </div>
    </div>
  );
}