'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Globe } from 'lucide-react';
import { useAppContext } from '@/hooks/use-app-context';
import { ZONES, Zone } from '@/lib/types';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

export function ZoneSelector() {
  const { zone, setZone } = useAppContext();
  const [selectedZone, setSelectedZone] = useState<Zone>(zone);
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = () => {
    setZone(selectedZone);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">Zona:</span>
          <span className="font-semibold">{zone}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Seleccionar Zona</DialogTitle>
          <DialogDescription>
            Elige la zona que corresponde para filtrar los datos en todos los módulos.
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
                  {z}
                </Label>
              ))}
            </div>
          </RadioGroup>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleSave}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
