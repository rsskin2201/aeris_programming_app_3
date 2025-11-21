'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useAppContext } from "@/hooks/use-app-context";
import { PERMISSIONS } from "@/lib/permissions";
import { MODULES, ROLES } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Power, PowerOff, Upload } from "lucide-react";

const inspectionTypes = [
    {
        id: 'individual',
        title: 'Programación Individual de PES',
        description: 'Para solicitudes de una Puesta en Servicio en campo.',
        href: '/inspections/individual',
        requiredModule: MODULES.INSPECTIONS,
    },
    {
        id: 'masiva',
        title: 'Programación Masiva de PES',
        description: 'Para solicitudes masivas en una misma dirección.',
        href: '/inspections/massive',
        requiredModule: MODULES.INSPECTIONS,
    },
    {
        id: 'especial',
        title: 'Programaciones Especiales (No PES)',
        description: 'Otras inspecciones que no son Puesta en Servicio.',
        href: '/inspections/special',
        requiredModule: MODULES.INSPECTIONS,
    },
    {
        id: 'salesforce',
        title: 'Carga Masiva Salesforce',
        description: 'Cargar registros desde un archivo .csv de Salesforce.',
        href: '/inspections/salesforce',
        requiredModule: MODULES.SALESFORCE_UPLOAD, // Custom module for this
        icon: Upload,
    }
];

const privilegedRoles = [ROLES.ADMIN, ROLES.CALIDAD, ROLES.SOPORTE, ROLES.COORDINADOR_SSPP];
const restrictedRoles = [ROLES.COLABORADOR, ROLES.GESTOR];

export default function InspectionsPage() {
    const { user, formsEnabled, toggleForms } = useAppContext();
    const { toast } = useToast();

    if (!user) return null;

    const canToggleForms = privilegedRoles.includes(user.role);
    const isFormCreationRestricted = restrictedRoles.includes(user.role) && !formsEnabled;

    const userPermissions = PERMISSIONS[user.role] || [];
    let visibleCards = inspectionTypes.filter(it => userPermissions.includes(it.requiredModule as any));

    // Special logic for Coordinator SSPP
    if (user.role === ROLES.COORDINADOR_SSPP) {
        visibleCards = visibleCards.filter(it => it.id === 'salesforce');
    }


    const handleCardClick = (e: React.MouseEvent, cardHref: string) => {
        if (!formsEnabled && cardHref !== '/inspections/salesforce') {
            e.preventDefault();
            toast({
                variant: "destructive",
                title: "Creación de Inspecciones Deshabilitada",
                description: "La creación de nuevas inspecciones está temporalmente deshabilitada. Se habilitará en breve.",
            });
        }
    };


  return (
    <div>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
                <h1 className="font-headline text-3xl font-semibold">Gestión de Inspecciones</h1>
                <p className="text-muted-foreground mt-2">Selecciona el tipo de programación que deseas realizar.</p>
            </div>
            {canToggleForms && (
                <Button variant={formsEnabled ? "destructive" : "secondary"} onClick={toggleForms}>
                {formsEnabled ? <PowerOff className="mr-2 h-4 w-4" /> : <Power className="mr-2 h-4 w-4" />}
                {formsEnabled ? 'Deshabilitar Formularios' : 'Habilitar Formularios'}
                </Button>
            )}
        </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {visibleCards.map(card => (
             <Card key={card.id} className={!formsEnabled && card.id !== 'salesforce' ? 'bg-muted/50' : ''}>
                <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                        {card.icon && <card.icon className="h-5 w-5 text-primary"/>}
                        {card.title}
                    </CardTitle>
                    <CardDescription>{card.description}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild disabled={!formsEnabled && card.id !== 'salesforce'} onClick={(e) => handleCardClick(e, card.href)}>
                        <Link href={card.href}>Iniciar Carga</Link>
                    </Button>
                </CardContent>
            </Card>
        ))}
      </div>
    </div>
  );
}
