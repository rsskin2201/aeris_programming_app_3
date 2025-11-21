'use client';

import {
  Button,
  buttonVariants,
} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Lock,
  LockOpen,
  Power,
  PowerOff,
  ShieldCheck,
  ShieldOff,
  CalendarClock,
  Eye,
  Pencil,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAppContext } from '@/hooks/use-app-context';
import { mockRecords, InspectionRecord } from '@/lib/mock-data';
import {
  addDays,
  addMonths,
  addWeeks,
  format,
  endOfMonth,
  endOfWeek,
  startOfDay,
  startOfMonth,
  startOfWeek,
  isSunday,
  isSameDay,
  parseISO,
  getYear,
  getMonth,
  getDay,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ROLES } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import Papa from 'papaparse';
import { useToast } from '@/hooks/use-toast';

const privilegedRoles = [ROLES.ADMIN, ROLES.CALIDAD, ROLES.SOPORTE, ROLES.COORDINADOR_SSPP];
const adminRoles = [ROLES.ADMIN];
const dayBlockingRoles = [ROLES.ADMIN, ROLES.CALIDAD, ROLES.COORDINADOR_SSPP];
const canExportRoles = [ROLES.ADMIN, ROLES.CALIDAD, ROLES.COORDINADOR_SSPP, ROLES.VISUAL];

const daysOfWeek = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
];
const hoursOfDay = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

const statusColors: Record<InspectionRecord['status'], string> = {
    'Aprobado': 'bg-green-500/80 border-green-700 text-white',
    'Contemplado': 'bg-yellow-500/80 border-yellow-700 text-white',
    'Pendiente Aprobación': 'bg-blue-500/80 border-blue-700 text-white',
    'Rechazado': 'bg-red-500/80 border-red-700 text-white',
};

export default function CalendarPage() {
  const {
    user,
    zone,
    formsEnabled,
    toggleForms,
    weekendsEnabled,
    toggleWeekends,
    blockedDays,
    addBlockedDay,
    removeBlockedDay,
    records,
  } = useAppContext();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const canToggleForms = user && privilegedRoles.includes(user.role);
  const canEnableWeekends = user && adminRoles.includes(user.role);
  const canBlockDays = user && dayBlockingRoles.includes(user.role);
  const canExport = user && canExportRoles.includes(user.role);
  
  const isCollaborator = user?.role === ROLES.COLABORADOR;
  const isQualityControl = user?.role === ROLES.CALIDAD;

  const filteredRecordsForView = useMemo(() => {
    let filtered = records;
    if (isCollaborator) {
      filtered = records.filter(record => record.collaboratorCompany === user.name);
    } else if (zone !== 'Todas las zonas' && !isQualityControl) {
      filtered = records.filter(record => record.zone === zone);
    }
    // For Quality Control, they can see all in their zone, so no special filter here,
    // it's handled by the global zone context.
    return filtered;
  }, [zone, records, isCollaborator, isQualityControl, user]);


  const inspectionsByDay = useMemo(() => {
    const inspections: Record<string, typeof filteredRecordsForView> = {};
    filteredRecordsForView.forEach((record) => {
      const recordDate = parseISO(record.requestDate);
      const dateKey = format(recordDate, 'yyyy-MM-dd');
      if (!inspections[dateKey]) {
        inspections[dateKey] = [];
      }
      inspections[dateKey].push(record);
    });
    return inspections;
  }, [filteredRecordsForView]);
  
   const inspectionsByTime = useMemo(() => {
    const inspections: Record<string, typeof filteredRecordsForView> = {};
    filteredRecordsForView.forEach((record) => {
      const recordDate = parseISO(record.requestDate);
      const dateTimeKey = format(recordDate, 'yyyy-MM-dd-HH');
      if (!inspections[dateTimeKey]) {
        inspections[dateTimeKey] = [];
      }
      inspections[dateTimeKey].push(record);
    });
    return inspections;
  }, [filteredRecordsForView]);


  const firstDayOfMonth = startOfMonth(currentDate);
  const startingDayOfWeek = (getDay(firstDayOfMonth) + 6) % 7; // 0 for Monday, 1 for Tuesday ... 6 for Sunday
  
  const daysInMonth = Array.from(
    { length: new Date(getYear(currentDate), getMonth(currentDate) + 1, 0).getDate() },
    (_, i) => i + 1
  );

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // 1 for Monday
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  const changeDate = (amount: number) => {
    if (view === 'month') setCurrentDate((prev) => addMonths(prev, amount));
    if (view === 'week') setCurrentDate((prev) => addWeeks(prev, amount));
    if (view === 'day') setCurrentDate((prev) => addDays(prev, amount));
  };
  
  const handleDateClick = (date: Date) => {
    const isDayBlocked = !!blockedDays[format(date, 'yyyy-MM-dd')];
    if (isDayBlocked) return;
    if (isSunday(date) && !weekendsEnabled) return;

    setCurrentDate(date);
    setView('day');
  }
  
  const handleTimeSlotDoubleClick = (date: Date, hour: string) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    if (blockedDays[dateKey]) return;
    if (isSunday(date) && !weekendsEnabled) return;
    const url = `/inspections/individual?date=${format(date, 'yyyy-MM-dd')}&time=${hour}&from=calendar`;
    router.push(url);
  }

  const openBlockDialog = () => {
    const dateKey = format(currentDate, 'yyyy-MM-dd');
    setBlockReason(blockedDays[dateKey]?.reason || '');
    setIsBlockDialogOpen(true);
  }
  
  const handleBlockDay = () => {
    addBlockedDay(format(currentDate, 'yyyy-MM-dd'), blockReason);
    setIsBlockDialogOpen(false);
    setBlockReason('');
  }

  const handleUnblockDay = () => {
    removeBlockedDay(format(currentDate, 'yyyy-MM-dd'));
    setIsBlockDialogOpen(false);
    setBlockReason('');
  }

  const { exportData, exportRange, exportCount } = useMemo(() => {
      let start: Date;
      let end: Date;

      switch(view) {
          case 'day':
              start = startOfDay(currentDate);
              end = start;
              break;
          case 'week':
              start = startOfWeek(currentDate, { weekStartsOn: 1 });
              end = endOfWeek(currentDate, { weekStartsOn: 1 });
              break;
          case 'month':
          default:
              start = startOfMonth(currentDate);
              end = endOfMonth(currentDate);
              break;
      }
      
      const recordsToExport = filteredRecordsForView.filter(rec => {
          const recDate = parseISO(rec.requestDate);
          return recDate >= start && recDate <= end;
      });

      return {
          exportData: recordsToExport,
          exportCount: recordsToExport.length,
          exportRange: { from: start, to: end }
      };

  }, [view, currentDate, filteredRecordsForView]);
  
  const handleExport = () => {
    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `calendario_${format(new Date(), 'yyyyMMdd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    setIsExporting(false);
    toast({
        title: "Exportación Completa",
        description: `${exportCount} registros han sido exportados a CSV.`
    });
  };

  const renderMonthView = () => (
    <>
      <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-muted-foreground">
        {daysOfWeek.map((day) => (
          <div key={day} className="py-2">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 grid-rows-5 gap-1">
        {Array.from({ length: startingDayOfWeek }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="h-24 rounded-md border bg-muted/50"
          ></div>
        ))}
        {daysInMonth.map((day) => {
          const date = new Date(
            getYear(currentDate),
            getMonth(currentDate),
            day
          );
          const dateKey = format(date, 'yyyy-MM-dd');
          const dayInspections = inspectionsByDay[dateKey] || [];
          const blockedDayInfo = blockedDays[dateKey];

          const dayCell = (
             <div
              key={day}
              onClick={() => handleDateClick(date)}
              className={cn(
                'h-24 rounded-md border p-2 text-sm transition-all duration-200 hover:shadow-lg hover:border-accent/80',
                blockedDayInfo
                  ? 'bg-muted-foreground/30 text-muted-foreground cursor-not-allowed hover:bg-muted-foreground/30'
                  : 'cursor-pointer',
                isSameDay(date, new Date()) && 'bg-blue-500/20 ring-2 ring-blue-500',
                isSunday(date) && !weekendsEnabled && 'bg-destructive/20 text-destructive cursor-not-allowed hover:bg-destructive/20',
                isSunday(date) && weekendsEnabled && 'bg-green-100/70',
              )}
            >
              <span>{day}</span>
              {dayInspections.length > 0 && !blockedDayInfo && (
                <div className="mt-1 rounded-sm bg-primary/20 px-1 py-0.5 text-xs text-primary-foreground">
                  {dayInspections.length}{' '}
                  {dayInspections.length > 1 ? 'Inspecciones' : 'Inspección'}
                </div>
              )}
               {blockedDayInfo && (
                  <div className="mt-1 flex items-center gap-1 rounded-sm bg-destructive/80 px-1 py-0.5 text-xs text-destructive-foreground">
                     <Lock className="h-3 w-3" />
                     <span className="truncate">{blockedDayInfo.reason || "Bloqueado"}</span>
                  </div>
              )}
            </div>
          )

          if (blockedDayInfo) {
            return (
              <TooltipProvider key={`tp-${day}`}>
                <Tooltip>
                  <TooltipTrigger asChild>{dayCell}</TooltipTrigger>
                  <TooltipContent>
                    <p className='font-bold'>Día Bloqueado</p>
                    <p>{blockedDayInfo.reason}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
          }

          return dayCell;
        })}
      </div>
    </>
  );
  
  const renderInspectionsForSlot = (day: Date, hour: string) => {
    const hourNumber = parseInt(hour.split(':')[0]);
    const slotKey = `${format(day, 'yyyy-MM-dd')}-${String(hourNumber).padStart(2, '0')}`;
    const slotInspections = inspectionsByTime[slotKey] || [];

    if (slotInspections.length === 0) return null;

    return slotInspections.map((inspection) => (
      <TooltipProvider key={inspection.id}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn("mb-1 rounded-md p-1 text-xs shadow-sm hover:opacity-80 border-l-4", statusColors[inspection.status])}>
              <p className="truncate font-medium">{inspection.client}</p>
              <p className="truncate text-xs">{inspection.address}</p>
            </div>
          </TooltipTrigger>
          <TooltipContent>
             <div className="p-1 text-sm">
                <p className="font-bold">{inspection.client}</p>
                <p><strong>ID:</strong> {inspection.id}</p>
                <p><strong>Dirección:</strong> {inspection.address}</p>
                <p><strong>Inspector:</strong> {inspection.inspector}</p>
                <p><strong>Estatus:</strong> <span className='font-semibold'>{inspection.status}</span></p>
             </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ));
  };


  const renderWeekView = () => (
    <div className="flex border-t">
      <div className="w-16 flex-shrink-0 text-center text-xs">
        {hoursOfDay.map((hour) => (
          <div
            key={hour}
            className={cn(
              "h-16 border-b pr-2 flex items-center justify-center text-muted-foreground",
              (parseInt(hour) < 9 || parseInt(hour) >= 19) && "bg-muted/40"
            )}
          >
            {hour}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 flex-1">
        {weekDays.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const isBlocked = !!blockedDays[dateKey];
          return (
            <div
              key={day.toString()}
              className={cn('border-l relative', 
                isSameDay(day, new Date()) && 'bg-accent/10',
                isBlocked && 'bg-muted-foreground/30'
              )}
            >
              {hoursOfDay.map((hour) => (
                <div
                  key={`${day}-${hour}`}
                  onDoubleClick={() => handleTimeSlotDoubleClick(day, hour)}
                  className={cn(
                    'h-16 border-b p-1 transition-colors hover:bg-accent/20 hover:border-l-2 hover:border-accent cursor-pointer overflow-y-auto',
                    isSunday(day) && !weekendsEnabled && 'bg-destructive/10 cursor-not-allowed hover:bg-destructive/10',
                    isSunday(day) && weekendsEnabled && 'bg-green-100/50',
                    isBlocked && 'cursor-not-allowed hover:bg-muted-foreground/30',
                    (parseInt(hour) < 9 || parseInt(hour) >= 19) && 'bg-muted/40 hover:bg-muted/60'
                  )}
                >
                  {!isBlocked && renderInspectionsForSlot(day, hour)}
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  );

  const renderDayView = () => {
    const dateKey = format(currentDate, 'yyyy-MM-dd');
    const isBlocked = !!blockedDays[dateKey];
    return (
    <div className="flex border-t">
      <div className="w-16 flex-shrink-0 text-center text-xs">
        {hoursOfDay.map((hour) => (
          <div
            key={hour}
            className={cn(
              "h-16 border-b pr-2 flex items-center justify-center text-muted-foreground",
              (parseInt(hour) < 9 || parseInt(hour) >= 19) && "bg-muted/40"
            )}
          >
            {hour}
          </div>
        ))}
      </div>
      <div className="flex-1">
        <div
          className={cn(
            'border-l relative',
            isSameDay(currentDate, new Date()) && 'bg-accent/10',
            isBlocked && 'bg-muted-foreground/30'
          )}
        >
          {hoursOfDay.map((hour) => (
            <div
              key={`${currentDate}-${hour}`}
              onDoubleClick={() => handleTimeSlotDoubleClick(currentDate, hour)}
              className={cn(
                'h-16 border-b p-1 transition-colors hover:bg-accent/20 hover:border-l-2 hover:border-accent cursor-pointer overflow-y-auto',
                isSunday(currentDate) && !weekendsEnabled && 'bg-destructive/10 cursor-not-allowed hover:bg-destructive/10',
                isSunday(currentDate) && weekendsEnabled && 'bg-green-100/50',
                isBlocked && 'cursor-not-allowed hover:bg-muted-foreground/30',
                (parseInt(hour) < 9 || parseInt(hour) >= 19) && 'bg-muted/40 hover:bg-muted/60'
              )}
            >
              {!isBlocked && renderInspectionsForSlot(currentDate, hour)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )};

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="flex items-center gap-3 font-headline text-3xl font-semibold">
          <CalendarIcon className="h-8 w-8 text-primary" />
          Calendario de Inspecciones
        </h1>
        <div className="flex flex-wrap items-center gap-2">
            {canExport && (
               <Dialog open={isExporting} onOpenChange={setIsExporting}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="bg-green-600 text-white hover:bg-green-700 hover:text-white border-green-700 active:bg-green-800"
                  >
                    <Download className="mr-2 h-4 w-4" /> Exportar .csv
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirmar Exportación de Calendario</DialogTitle>
                    <DialogDescription>
                      Se exportarán <strong>{exportCount}</strong> registros para el rango de fechas:
                      <p className='font-medium mt-2'>
                          {format(exportRange.from, 'PPP', { locale: es })} - {format(exportRange.to, 'PPP', { locale: es })}
                      </p>
                      ¿Deseas continuar?
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild><Button variant="ghost">Cancelar</Button></DialogClose>
                    <Button onClick={handleExport} className="bg-green-600 hover:bg-green-700">Confirmar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          {canEnableWeekends && (
            <Button
              variant={weekendsEnabled ? 'secondary' : 'destructive'}
              onClick={toggleWeekends}
              className={cn(
                weekendsEnabled
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-destructive hover:bg-destructive/90',
                'text-white'
              )}
            >
              {weekendsEnabled ? (
                <ShieldCheck className="mr-2 h-4 w-4" />
              ) : (
                <ShieldOff className="mr-2 h-4 w-4" />
              )}
              {weekendsEnabled ? 'Hab. Domingos' : 'Deshab. Domingos'}
            </Button>
          )}
          {canToggleForms && (
            <Button
              variant={formsEnabled ? 'destructive' : 'secondary'}
              onClick={toggleForms}
            >
              {formsEnabled ? (
                <PowerOff className="mr-2 h-4 w-4" />
              ) : (
                <Power className="mr-2 h-4 w-4" />
              )}
              {formsEnabled ? 'Deshabilitar Forms' : 'Habilitar Forms'}
            </Button>
          )}
        </div>
      </div>
      
        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen} className='w-full'>
            <div className="flex items-center justify-end">
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm">
                        <Filter className="mr-2 h-4 w-4" />
                        {filtersOpen ? 'Ocultar' : 'Mostrar'} Filtros
                    </Button>
                </CollapsibleTrigger>
            </div>
            <CollapsibleContent asChild>
                 <Card className="mt-2 p-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-2">
                            <Label htmlFor="filter-type">Tipo de Inspección</Label>
                            <Select>
                                <SelectTrigger id="filter-type">
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="pes-individual">PES Individual</SelectItem>
                                    <SelectItem value="pes-masiva">PES Masiva</SelectItem>
                                    <SelectItem value="especial">Especial</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                            <div className="space-y-2">
                            <Label htmlFor="filter-status">Estado</Label>
                            <Select>
                                <SelectTrigger id="filter-status">
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="Aprobado">Aprobado</SelectItem>
                                    <SelectItem value="Contemplado">Contemplado</SelectItem>
                                    <SelectItem value="Pendiente">Pendiente Aprobación</SelectItem>
                                    <SelectItem value="Rechazado">Rechazado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                            <div className="flex items-end gap-2 lg:col-start-4">
                            <Button className="flex-1">Aplicar</Button>
                            <Button variant="ghost" className="flex-1">Limpiar</Button>
                        </div>
                    </div>
                </Card>
            </CollapsibleContent>
        </Collapsible>


       {canBlockDays && (
        <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Gestionar Bloqueo de Día</DialogTitle>
                    <DialogDescription>
                        Bloquea o desbloquea el {format(currentDate, "dd 'de' MMMM, yyyy", { locale: es })}.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="reason">Motivo del bloqueo (ej. Día Feriado)</Label>
                    <Textarea 
                        id="reason"
                        value={blockReason}
                        onChange={(e) => setBlockReason(e.target.value)}
                        placeholder="Añade una nota..."
                        className="mt-2"
                    />
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsBlockDialogOpen(false)}>Cancelar</Button>
                     {blockedDays[format(currentDate, 'yyyy-MM-dd')] ? (
                        <Button variant="outline" onClick={handleUnblockDay} className="text-green-600 border-green-600 hover:bg-green-100 hover:text-green-700">
                            <LockOpen className="mr-2 h-4 w-4" />
                            Desbloquear Día
                        </Button>
                     ) : (
                        <Button variant="destructive" onClick={handleBlockDay}>
                            <Lock className="mr-2 h-4 w-4" />
                            Bloquear Día
                        </Button>
                     )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-y-2">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => changeDate(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className='w-[350px]'>
                <CardTitle className="font-headline text-xl capitalize text-center">
                {view === 'day' &&
                    format(currentDate, "eeee, dd 'de' MMMM", { locale: es })}
                {view === 'week' &&
                    `Semana del ${format(
                    startOfWeek(currentDate, { weekStartsOn: 1 }),
                    "dd 'de' MMM"
                    )} - ${format(
                    addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), 6),
                    "dd 'de' MMM, yyyy",
                    { locale: es }
                    )}`}
                {view === 'month' &&
                    format(currentDate, 'MMMM yyyy', { locale: es })}
                </CardTitle>
            </div>
            <Button variant="outline" size="icon" onClick={() => changeDate(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className='flex items-center gap-2'>
            {canBlockDays && (
              <Button variant="outline" onClick={openBlockDialog}>
                <CalendarClock className="mr-2 h-4 w-4" />
                Gestionar Bloqueo
              </Button>
            )}
            <div className="flex items-center gap-2 rounded-md bg-muted p-1 text-sm">
              <Button
                size="sm"
                variant={'ghost'}
                className={cn('bg-background shadow font-semibold text-primary', view === 'month' ? 'bg-primary/10 text-primary' : 'hover:bg-primary/5')}
                onClick={() => setView('month')}
              >
                Mes
              </Button>
              <Button
                size="sm"
                variant={'ghost'}
                className={cn('bg-background shadow font-semibold text-primary', view === 'week' ? 'bg-primary/10 text-primary' : 'hover:bg-primary/5')}
                onClick={() => setView('week')}
              >
                Semana
              </Button>
              <Button
                size="sm"
                variant={'ghost'}
                className={cn('bg-background shadow font-semibold text-primary', view === 'day' ? 'bg-primary/10 text-primary' : 'hover:bg-primary/5')}
                onClick={() => setView('day')}
              >
                Día
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {view === 'month' && renderMonthView()}
          {view === 'week' && (
            <div className="overflow-x-auto">
              <div className="grid grid-cols-[auto,1fr] min-w-[900px]">
                <div className="w-16 flex-shrink-0">&nbsp;</div>
                <div className="grid grid-cols-7">
                  {weekDays.map((day) => (
                    <div
                      key={day.toString()}
                      className="text-center py-2 font-medium"
                    >
                      <div className="text-sm text-muted-foreground capitalize">
                        {format(day, 'eee', { locale: es })}
                      </div>
                      <div className="text-lg">{format(day, 'd')}</div>
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
