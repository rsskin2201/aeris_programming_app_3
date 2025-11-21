'use client';

import { useState } from 'react';
import { useAppContext } from '@/hooks/use-app-context';
import { ZONES, Zone, ROLES } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Globe } from 'lucide-react';
import { useMemo } from 'react';

const restrictedRoles = [
  ROLES.COLABORADOR,
  ROLES.GESTOR,
  ROLES.SOPORTE,
  ROLES.CALIDAD
];

export function WelcomeZoneSelector() {
  const { user, zone, confirmZone, operatorName } = useAppContext();
  const [selectedZone, setSelectedZone] = useState<Zone>(zone);
  
  const availableZones = useMemo(() => {
    if (user && restrictedRoles.includes(user.role)) {
      return ZONES.filter(z => z !== 'Todas las zonas');
    }
    return ZONES;
  }, [user]);

  const handleSave = () => {
    confirmZone(selectedZone);
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-muted">
       <Dialog open={true}>
        <DialogContent className="sm:max-w-[425px]" hideCloseButton={true}>
            <DialogHeader>
                 <div className="mx-auto mb-4 flex items-center justify-center gap-3">
                    <span className="text-5xl font-bold text-primary">⚡</span>
                    <div className='flex flex-col'>
                        <h1 className="font-headline text-4xl font-bold text-primary">Aeris</h1>
                        <p className="font-headline text-2xl font-semibold text-primary/90 -mt-2">Programming</p>
                    </div>
                </div>
                <DialogTitle className="text-center text-2xl">¡Bienvenido, {operatorName}!</DialogTitle>
                <DialogDescription className="text-center">
                    Para comenzar, elige la zona en la que trabajarás.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
            <RadioGroup value={selectedZone} onValueChange={(value) => setSelectedZone(value as Zone)}>
                <div className="grid gap-2">
                {availableZones.map((z) => (
                    <Label
                    key={z}
                    htmlFor={`zone-${z}`}
                    className="flex items-center gap-3 rounded-md border p-3 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
                    >
                    <RadioGroupItem value={z} id={`zone-${z}`} />
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    {z}
                    </Label>
                ))}
                </div>
            </RadioGroup>
            </div>
            <DialogFooter>
                <Button onClick={handleSave} className="w-full">Confirmar Zona</Button>
            </DialogFooter>
        </DialogContent>
        </Dialog>
    </div>
  );
}
