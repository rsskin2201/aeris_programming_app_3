'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Download, Filter, Power, PowerOff } from "lucide-react";
import { useMemo, useState } from "react";
import { useAppContext } from "@/hooks/use-app-context";
import { mockRecords } from "@/lib/mock-data";
import { format, getDate, parseISO } from 'date-fns';

const daysOfWeek = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

export default function CalendarPage() {
  const [formsActive, setFormsActive] = useState(true);
  const { zone } = useAppContext();

  const inspectionsByDay = useMemo(() => {
    const filteredRecords = mockRecords.filter(record => zone === 'Todas las zonas' || record.zone === zone);
    
    const inspections: Record<number, number> = {};
    filteredRecords.forEach(record => {
      // Assuming requestDate is 'YYYY-MM-DD'
      // This is a simplification; a real app would handle dates more robustly.
      const dayOfMonth = getDate(parseISO(record.requestDate));
      inspections[dayOfMonth] = (inspections[dayOfMonth] || 0) + 1;
    });
    return inspections;
  }, [zone]);


  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-headline text-3xl font-semibold">Calendario de Inspecciones</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> Filtros</Button>
          <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Exportar .csv</Button>
          <Button variant={formsActive ? "destructive" : "secondary"} onClick={() => setFormsActive(!formsActive)}>
            {formsActive ? <PowerOff className="mr-2 h-4 w-4" /> : <Power className="mr-2 h-4 w-4" />}
            {formsActive ? 'Desactivar Formularios' : 'Activar Formularios'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon"><ChevronLeft className="h-4 w-4" /></Button>
            <CardTitle className="font-headline text-xl">Julio 2024</CardTitle>
            <Button variant="outline" size="icon"><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-muted p-1 text-sm">
            <Button size="sm" variant="ghost" className="bg-background">Mes</Button>
            <Button size="sm" variant="ghost">Semana</Button>
            <Button size="sm" variant="ghost">Día</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-muted-foreground">
            {daysOfWeek.map(day => <div key={day} className="py-2">{day}</div>)}
          </div>
          <div className="grid grid-cols-7 grid-rows-5 gap-1">
            {daysInMonth.map(day => (
              <div key={day} className={`h-24 rounded-md border p-2 text-sm ${day > 30 ? 'bg-muted/50 text-muted-foreground' : ''}`}>
                <span>{day}</span>
                {inspectionsByDay[day] && (
                    <div className="mt-1 rounded-sm bg-primary/20 px-1 py-0.5 text-xs text-primary-foreground">
                        {inspectionsByDay[day]} {inspectionsByDay[day] > 1 ? 'Inspecciones' : 'Inspección'}
                    </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
