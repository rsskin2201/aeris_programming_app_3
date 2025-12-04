'use client';

import {
  Button,
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
  File,
  Files,
  FileCheck2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAppContext } from '@/hooks/use-app-context';
import { InspectionRecord, ExpansionManager, Installer, Inspector } from '@/lib/mock-data';
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
import { ROLES, Status, STATUS } from '@/lib/types';
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
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import Papa from 'papaparse';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, QueryConstraint } from 'firebase/firestore';

const adminRoles = [ROLES.ADMIN];
const canToggleFormsRoles = [ROLES.ADMIN];
const canBlockDaysRoles = [ROLES.ADMIN, ROLES.COORDINADOR_SSPP];
const canExportRoles = [ROLES.ADMIN, ROLES.CALIDAD, ROLES.COORDINADOR_SSPP, ROLES.VISUAL, ROLES.CANALES];

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

const statusColors: Record<Status, string> = {
    'REGISTRADA': 'bg-gray-500/80 border-gray-600 text-white',
    'CONFIRMADA POR GE': 'bg-cyan-600/80 border-cyan-700 text-white',
    'PROGRAMADA': 'bg-blue-600/80 border-blue-700 text-white',
    'EN PROCESO': 'bg-orange-500/80 border-orange-600 text-white',
    'PENDIENTE INFORMAR DATOS': 'bg-yellow-500/80 border-yellow-600 text-white',
    'APROBADA': 'bg-green-600/80 border-green-700 text-white',
    'NO APROBADA': 'bg-red-600/80 border-red-700 text-white',
    'RECHAZADA': 'bg-red-700/80 border-red-800 text-white',
    'CANCELADA': 'bg-red-800/80 border-red-900 text-white',
    'CONECTADA': 'bg-purple-600/80 border-purple-700 text-white',
    'PENDIENTE CORRECCION': 'bg-yellow-600/80 border-yellow-700 text-white',
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
  } = useAppContext();
  const firestore = useFirestore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSchedulingTypeDialogOpen, setIsSchedulingTypeDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date, hour: string} | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const [activeFilters, setActiveFilters] = useState({
      status: '',
      requestType: '',
      gestor: '',
      instalador: '',
      inspector: '',
  });

  const canToggleForms = user && canToggleFormsRoles.includes(user.role);
  const canEnableWeekends = user && adminRoles.includes(user.role);
  const canBlockDays = user && canBlockDaysRoles.includes(user.role);
  const canExport = user && canExportRoles.includes(user.role);
  
  const isCollaborator = user?.role === ROLES.COLABORADOR;
  const isQualityControl = user?.role === ROLES.CALIDAD;
  const isCoordinator = user?.role === ROLES.COORDINADOR_SSPP;
  const isGestor = user?.role === ROLES.GESTOR;
  const isAdmin = user?.role === ROLES.ADMIN;

  const buildQuery = (collectionName: string) => {
    if (!firestore || !user) return null;
    const constraints: QueryConstraint[] = [];
    if (user.role !== ROLES.ADMIN && zone !== 'Todas las zonas') {
        constraints.push(where('zone', '==', zone));
    }
    return query(collection(firestore, collectionName), ...constraints);
  };
  
  const inspectionsQuery = useMemoFirebase(() => buildQuery('inspections'), [firestore, user, zone]);
  const { data: records } = useCollection<InspectionRecord>(inspectionsQuery);
  
  const { data: expansionManagers } = useCollection<ExpansionManager>(useMemoFirebase(() => buildQuery('gestores_expansion'), [firestore, user, zone]));
  const { data: installers } = useCollection<Installer>(useMemoFirebase(() => buildQuery('instaladores'), [firestore, user, zone]));
  const { data: inspectors } = useCollection<Inspector>(useMemoFirebase(() => buildQuery('inspectores'), [firestore, user, zone]));


  const filteredRecordsForView = useMemo(() => {
    if (!records) return [];
    
    let filtered = records;

    // Role-based pre-filtering
    if (isCollaborator) {
      filtered = records.filter(record => record.collaboratorCompany === user?.name);
    }
    
    // Active filters from UI
    if(activeFilters.status && activeFilters.status !== 'all') filtered = filtered.filter(r => r.status === activeFilters.status);
    if(activeFilters.requestType && activeFilters.requestType !== 'all') filtered = filtered.filter(r => r.type === activeFilters.requestType);
    if(activeFilters.gestor && activeFilters.gestor !== 'all') filtered = filtered.filter(r => r.gestor === activeFilters.gestor);
    if(activeFilters.instalador && activeFilters.instalador !== 'all') filtered = filtered.filter(r => r.instalador === activeFilters.instalador);
    if(activeFilters.inspector && activeFilters.inspector !== 'all') filtered = filtered.filter(r => r.inspector === activeFilters.inspector);
    
    return filtered;
  }, [records, isCollaborator, user, activeFilters]);

  const availableManagers = useMemo(() => 
    expansionManagers?.filter(m => m.status === 'Activo' && (m.zone === zone || zone === 'Todas las zonas')) || [], 
  [expansionManagers, zone]);
  
  const availableInstallers = useMemo(() => 
    installers?.filter(i => i.status === 'Activo' && (isCollaborator ? i.collaboratorCompany === user?.name : true)) || [], 
  [installers, user, isCollaborator]);

  const availableInspectors = useMemo(() => 
    inspectors?.filter(i => i.status === 'Activo' && (isAdmin || zone === 'Todas las zonas' || i.zone === zone)) || [], 
  [inspectors, isAdmin, zone]);


  const inspectionsByDay = useMemo(() => {
    const inspections: Record<string, typeof filteredRecordsForView> = {};
    if (!filteredRecordsForView) return inspections;
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
    if (!filteredRecordsForView) return inspections;
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
    
    setSelectedSlot({ date, hour });
    setIsSchedulingTypeDialogOpen(true);
  }

  const handleInspectionTypeSelection = (type: 'individual' | 'massive' | 'special') => {
    if (!selectedSlot) return;
    const { date, hour } = selectedSlot;
    const url = `/inspections/${type}?date=${format(date, 'yyyy-MM-dd')}&time=${hour}&from=calendar`;
    router.push(url);
    setIsSchedulingTypeDialogOpen(false);
    setSelectedSlot(null);
  };

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
  
  const handleFilterChange = (filter: keyof typeof activeFilters, value: string) => {
      setActiveFilters(prev => ({...prev, [filter]: value === 'all' ? '' : value}));
  }

  const clearFilters = () => {
    setActiveFilters({
        status: '',
        requestType: '',
        gestor: '',
        instalador: '',
        inspector: '',
    });
  }

  const { exportData, exportCount } = useMemo(() => {
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
      
      const recordsToExport = filteredRecordsForView?.filter(rec => {
          const recDate = parseISO(rec.requestDate);
          return recDate >= start && recDate <= end;
      }) || [];

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
                'h-24 rounded-md border p-2 text-sm transition-all duration-200 hover:shadow-lg hover:border-primary/80',
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
              (parseInt(hour) < 9 || parseInt(hour) >= 20) && "bg-muted/40"
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
                isSameDay(day, new Date()) && 'bg-blue-500/10',
                isBlocked && 'bg-muted-foreground/30'
              )}
            >
              {hoursOfDay.map((hour) => (
                <div
                  key={`${day}-${hour}`}
                  onDoubleClick={() => handleTimeSlotDoubleClick(day, hour)}
                  className={cn(
                    'h-16 border-b p-1 transition-colors hover:bg-primary/20 hover:border-l-2 hover:border-primary cursor-pointer overflow-y-auto',
                    isSunday(day) && !weekendsEnabled && 'bg-destructive/10 cursor-not-allowed hover:bg-destructive/10',
                    isSunday(day) && weekendsEnabled && 'bg-green-100/50',
                    isBlocked && 'cursor-not-allowed hover:bg-muted-foreground/30',
                    (parseInt(hour) < 9 || parseInt(hour) >= 20) && 'bg-muted/40 hover:bg-muted/60'
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
              (parseInt(hour) < 9 || parseInt(hour) >= 20) && "bg-muted/40"
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
            isSameDay(currentDate, new Date()) && 'bg-blue-500/10',
            isBlocked && 'bg-muted-foreground/30'
          )}
        >
          {hoursOfDay.map((hour) => (
            <div
              key={`${currentDate}-${hour}`}
              onDoubleClick={() => handleTimeSlotDoubleClick(currentDate, hour)}
              className={cn(
                'h-16 border-b p-1 transition-colors hover:bg-primary/20 hover:border-l-2 hover:border-primary cursor-pointer overflow-y-auto',
                isSunday(currentDate) && !weekendsEnabled && 'bg-destructive/10 cursor-not-allowed hover:bg-destructive/10',
                isSunday(currentDate) && weekendsEnabled && 'bg-green-100/50',
                isBlocked && 'cursor-not-allowed hover:bg-muted-foreground/30',
                (parseInt(hour) < 9 || parseInt(hour) >= 20) && 'bg-muted/40 hover:bg-muted/60'
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
                          {format(exportData[0]?.requestDate ? parseISO(exportData[0].requestDate) : new Date(), 'PPP', { locale: es })} - {format(exportData[exportData.length-1]?.requestDate ? parseISO(exportData[exportData.length - 1].requestDate) : new Date(), 'PPP', { locale: es })}
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
                            <Select value={activeFilters.requestType || 'all'} onValueChange={(v) => handleFilterChange('requestType', v)}>
                                <SelectTrigger id="filter-type">
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="Individual PES">PES Individual</SelectItem>
                                    <SelectItem value="Masiva PES">PES Masiva</SelectItem>
                                    <SelectItem value="Especial">Especial</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="filter-status">Estado</Label>
                            <Select value={activeFilters.status || 'all'} onValueChange={(v) => handleFilterChange('status', v)}>
                                <SelectTrigger id="filter-status">
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    {Object.values(STATUS).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        {(isGestor || isCoordinator || isAdmin) && (
                            <div className="space-y-2">
                                <Label htmlFor="filter-gestor">Gestor de Expansión</Label>
                                <Select value={activeFilters.gestor || 'all'} onValueChange={(v) => handleFilterChange('gestor', v)}>
                                    <SelectTrigger id="filter-gestor"><SelectValue placeholder="Todos" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
                                        {availableManagers.map(g => <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        {(isCollaborator || isCoordinator || isAdmin) && (
                             <div className="space-y-2">
                                <Label htmlFor="filter-instalador">Instalador</Label>
                                <Select value={activeFilters.instalador || 'all'} onValueChange={(v) => handleFilterChange('instalador', v)}>
                                    <SelectTrigger id="filter-instalador"><SelectValue placeholder="Todos" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
                                        {availableInstallers.map(i => <SelectItem key={i.id} value={i.name}>{i.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        {(isQualityControl || isCoordinator || isAdmin) && (
                             <div className="space-y-2">
                                <Label htmlFor="filter-inspector">Inspector</Label>
                                <Select value={activeFilters.inspector || 'all'} onValueChange={(v) => handleFilterChange('inspector', v)}>
                                    <SelectTrigger id="filter-inspector"><SelectValue placeholder="Todos" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
                                        {availableInspectors.map(i => <SelectItem key={i.id} value={i.name}>{i.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        
                        <div className="flex items-end gap-2 lg:col-start-4">
                            <Button variant="ghost" className="flex-1" onClick={clearFilters}>Limpiar</Button>
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

      <Dialog open={isSchedulingTypeDialogOpen} onOpenChange={setIsSchedulingTypeDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Seleccionar Tipo de Programación</DialogTitle>
                  {selectedSlot && (
                      <DialogDescription>
                          ¿Qué tipo de inspección deseas programar para el {format(selectedSlot.date, "dd 'de' MMMM", { locale: es })} a las {selectedSlot.hour}?
                      </DialogDescription>
                  )}
              </DialogHeader>
              <div className="grid grid-cols-1 gap-4 py-4">
                    <Button variant="outline" onClick={() => handleInspectionTypeSelection('individual')}>
                      <File className="mr-2" />
                      Programación Individual de PES
                  </Button>
                  <Button variant="outline" onClick={() => handleInspectionTypeSelection('massive')}>
                      <Files className="mr-2" />
                      Programación Masiva de PES
                  </Button>
                  <Button variant="outline" onClick={() => handleInspectionTypeSelection('special')}>
                      <FileCheck2 className="mr-2" />
                      Programaciones Especiales (No PES)
                  </Button>
              </div>
                <DialogFooter>
                  <DialogClose asChild>
                      <Button variant="ghost">Cancelar</Button>
                  </DialogClose>
              </DialogFooter>
          </DialogContent>
      </Dialog>

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
                className={cn('bg-background shadow font-semibold text-primary', view === 'month' ? 'bg-primary/20 text-primary font-bold' : 'hover:bg-primary/5')}
                onClick={() => setView('month')}
              >
                Mes
              </Button>
              <Button
                size="sm"
                variant={'ghost'}
                className={cn('bg-background shadow font-semibold text-primary', view === 'week' ? 'bg-primary/20 text-primary font-bold' : 'hover:bg-primary/5')}
                onClick={() => setView('week')}
              >
                Semana
              </Button>
              <Button
                size="sm"
                variant={'ghost'}
                className={cn('bg-background shadow font-semibold text-primary', view === 'day' ? 'bg-primary/20 text-primary font-bold' : 'hover:bg-primary/5')}
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
