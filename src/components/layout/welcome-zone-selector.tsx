'use client';

import { useState } from 'react';
import { useAppContext } from '@/hooks/use-app-context';
import { ZONES, Zone } from '@/lib/types';
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
import { Icons } from '../icons';

export function WelcomeZoneSelector() {
  const { zone, confirmZone, operatorName } = useAppContext();
  const [selectedZone, setSelectedZone] = useState<Zone>(zone);

  const handleSave = () => {
    confirmZone(selectedZone);
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-muted">
       <Dialog open={true}>
        <DialogContent className="sm:max-w-[425px]" hideCloseButton={true}>
            <DialogHeader>
                 <div className="mx-auto mb-4 flex items-center gap-3">
                    <Icons.logo className="h-12 w-12 text-primary" />
                    <h1 className="font-headline text-5xl font-bold text-primary">AERIS</h1>
                </div>
                <DialogTitle className="text-center text-2xl">¡Bienvenido, {operatorName}!</DialogTitle>
                <DialogDescription className="text-center">
                    Para comenzar, elige la zona en la que trabajarás.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
            <RadioGroup value={selectedZone} onValueChange={(value) => setSelectedZone(value as Zone)}>
                <div className="grid gap-2">
                {ZONES.map((z) => (
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
