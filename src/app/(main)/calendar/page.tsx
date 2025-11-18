'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Download, Filter, Power, PowerOff, ShieldCheck, ShieldOff } from "lucide-react";
import { useMemo, useState } from "react";
import { useAppContext } from "@/hooks/use-app-context";
import { mockRecords } from "@/lib/mock-data";
import { addDays, addMonths, addWeeks, format, getDate, getDay, getISODay, getMonth, getYear, isSameDay, isSameMonth, isSunday, parseISO, startOfDay, startOfMonth, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { ROLES } from "@/lib/types";
import { cn } from "@/lib/utils";

const privilegedRoles = [ROLES.ADMIN, ROLES.CALIDAD, ROLES.SOPORTE];
const adminRoles = [ROLES.ADMIN];

const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const hoursOfDay = Array.from({ length: 11 }, (_, i) => `${String(i + 9).padStart(2, '0')}:00`); // 09:00 to 19:00

export default function CalendarPage() {
  const { user, zone, formsEnabled, toggleForms, enableWeekends, weekendsEnabled } = useAppContext();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');

  const canToggleForms = user && privilegedRoles.includes(user.role);
  const canEnableWeekends = user && adminRoles.includes(user.role);

  const inspectionsByDay = useMemo(() => {
    const filteredRecords = mockRecords.filter(record => zone === 'Todas las zonas' || record.zone === zone);
    const inspections: Record<string, typeof mockRecords> = {};
    
    filteredRecords.forEach(record => {
      const recordDate = parseISO(record.requestDate);
      const dateKey = format(recordDate, 'yyyy-MM-dd');
      if (!inspections[dateKey]) {
        inspections[dateKey] = [];
      }
      inspections[dateKey].push(record);
    });
    return inspections;
  }, [zone]);
  
  const firstDayOfMonth = startOfMonth(currentDate);
  const startingDayOfWeek = (getISODay(firstDayOfMonth) - 1); // 0=Mon, 6=Sun
  const daysInMonth = Array.from({ length: new Date(getYear(currentDate), getMonth(currentDate) + 1, 0).getDate() }, (_, i) => i + 1);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), i);
    return day;
  });

  const changeDate = (amount: number) => {
    if (view === 'month') setCurrentDate(prev => addMonths(prev, amount));
    if (view === 'week') setCurrentDate(prev => addWeeks(prev, amount));
    if (view === 'day') setCurrentDate(prev => addDays(prev, amount));
  }

  const renderMonthView = () => (
    <>
      <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-muted-foreground">
        {daysOfWeek.map(day => <div key={day} className="py-2">{day}</div>)}
      </div>
      <div className="grid grid-cols-7 grid-rows-5 gap-1">
        {Array.from({ length: startingDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="h-24 rounded-md border bg-muted/50"></div>
        ))}
        {daysInMonth.map(day => {
            const date = new Date(getYear(currentDate), getMonth(currentDate), day);
            const dateKey = format(date, 'yyyy-MM-dd');
            const dayInspections = inspectionsByDay[dateKey] || [];
            
            return (
              <div key={day} className={cn(
                "h-24 rounded-md border p-2 text-sm transition-colors hover:bg-accent/50 cursor-pointer", 
                isSameDay(date, new Date()) && "bg-accent text-accent-foreground",
                isSunday(date) && !weekendsEnabled && "bg-destructive/10 text-destructive",
                isSunday(date) && weekendsEnabled && "bg-green-100"
                )}>
                <span>{day}</span>
                {dayInspections.length > 0 && (
                    <div className="mt-1 rounded-sm bg-primary/20 px-1 py-0.5 text-xs text-primary-foreground">
                        {dayInspections.length} {dayInspections.length > 1 ? 'Inspecciones' : 'Inspección'}
                    </div>
                )}
              </div>
            )
        })}
      </div>
    </>
  );

  const renderWeekView = () => (
    <div className="flex border-t">
        <div className="w-16 flex-shrink-0 text-center text-xs">
            {hoursOfDay.map(hour => (
                <div key={hour} className="h-16 border-b pr-2 flex items-center justify-center text-muted-foreground">{hour}</div>
            ))}
        </div>
        <div className="grid grid-cols-7 flex-1">
            {weekDays.map(day => (
                <div key={day.toString()} className={cn("border-l", isSameDay(day, new Date()) && "bg-accent/50")}>
                    {hoursOfDay.map(hour => (
                        <div key={`${day}-${hour}`} className={cn(
                          "h-16 border-b transition-colors hover:bg-primary/10 cursor-pointer",
                          isSunday(day) && !weekendsEnabled && "bg-destructive/10 cursor-not-allowed",
                          isSunday(day) && weekendsEnabled && "bg-green-100"
                          )}>
                          {/* Event rendering logic here */}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    </div>
  );
  
  const renderDayView = () => (
     <div className="flex border-t">
        <div className="w-16 flex-shrink-0 text-center text-xs">
            {hoursOfDay.map(hour => (
                <div key={hour} className="h-16 border-b pr-2 flex items-center justify-center text-muted-foreground">{hour}</div>
            ))}
        </div>
        <div className="flex-1">
            <div className={cn("border-l", isSameDay(currentDate, new Date()) && "bg-accent/50")}>
                {hoursOfDay.map(hour => (
                    <div key={`${currentDate}-${hour}`} className={cn(
                      "h-16 border-b transition-colors hover:bg-primary/10 cursor-pointer",
                      isSunday(currentDate) && !weekendsEnabled && "bg-destructive/10 cursor-not-allowed",
                      isSunday(currentDate) && weekendsEnabled && "bg-green-100"
                      )}>
                       {/* Event rendering logic here */}
                    </div>
                ))}
            </div>
        </div>
    </div>
  );


  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-headline text-3xl font-semibold">Calendario de Inspecciones</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> Filtros</Button>
          <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Exportar .csv</Button>
          {canEnableWeekends && (
             <Button variant={weekendsEnabled ? "destructive" : "secondary"} onClick={toggleForms}>
              {weekendsEnabled ? <ShieldOff className="mr-2 h-4 w-4" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              {weekendsEnabled ? 'Deshab. Domingos' : 'Hab. Domingos'}
            </Button>
          )}
          {canToggleForms && (
            <Button variant={formsEnabled ? "destructive" : "secondary"} onClick={toggleForms}>
              {formsEnabled ? <PowerOff className="mr-2 h-4 w-4" /> : <Power className="mr-2 h-4 w-4" />}
              {formsEnabled ? 'Deshabilitar Forms' : 'Habilitar Forms'}
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-y-2">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => changeDate(-1)}><ChevronLeft className="h-4 w-4" /></Button>
            <CardTitle className="font-headline text-xl">
              {view === 'day' && format(currentDate, "eeee, dd 'de' MMMM", { locale: es })}
              {view === 'week' && `Semana del ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), "dd 'de' MMM")} - ${format(addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), 6), "dd 'de' MMM, yyyy", { locale: es })}`}
              {view === 'month' && format(currentDate, "MMMM yyyy", { locale: es })}
            </CardTitle>
            <Button variant="outline" size="icon" onClick={() => changeDate(1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-muted p-1 text-sm">
            <Button size="sm" variant={view === 'month' ? 'ghost' : 'ghost'} className={view === 'month' ? 'bg-background' : ''} onClick={() => setView('month')}>Mes</Button>
            <Button size="sm" variant={view === 'week' ? 'ghost' : 'ghost'} className={view === 'week' ? 'bg-background' : ''} onClick={() => setView('week')}>Semana</Button>
            <Button size="sm" variant={view === 'day' ? 'ghost' : 'ghost'} className={view === 'day' ? 'bg-background' : ''} onClick={() => setView('day')}>Día</Button>
          </div>
        </CardHeader>
        <CardContent>
          {view === 'month' && renderMonthView()}
          {view === 'week' && (
            <div className='overflow-x-auto'>
                <div className="grid grid-cols-[auto,1fr] min-w-[800px]">
                    <div className="w-16 flex-shrink-0">&nbsp;</div>
                     <div className="grid grid-cols-7">
                        {weekDays.map(day => (
                            <div key={day.toString()} className="text-center py-2 font-medium">
                                <div className='text-sm text-muted-foreground'>{format(day, 'eee', {locale: es})}</div>
                                <div className='text-lg'>{format(day, 'd')}</div>
                            </div>
                        ))}
                    </div>
                </div>
                 {renderWeekView()}
            </div>
          )}
          {view === 'day' && renderDayView()}
        </CardContent>
      </Card>
    </div>
  );
}
