'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Download, Filter, ChevronLeft, ChevronRight, CalendarIcon, Eye, Pencil, ListTodo, Server, Loader2, RefreshCw } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useAppContext } from '@/hooks/use-app-context';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { addDays, format, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { STATUS, ROLES, User, CollaboratorCompany, Sector, ExpansionManager, Status, InspectionRecord, Inspector } from '@/lib/types';
import { TIPO_INSPECCION_ESPECIAL, TIPO_INSPECCION_MASIVA, MERCADO } from '@/lib/form-options';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Papa from 'papaparse';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, QueryConstraint } from 'firebase/firestore';
import { MultiSelect } from '@/components/ui/multi-select';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const allInspectionTypes = [...new Set(['Individual PES', 'Masiva PES', ...TIPO_INSPECCION_MASIVA, ...TIPO_INSPECCION_ESPECIAL])];
const statusOptions = Object.values(STATUS).map(s => ({ value: s, label: s }));

const initialFilters = {
    id: '',
    gestor: '',
    inspector: '',
    empresa: '',
    sector: '',
    poliza: '',
    caso: '',
    serieMdd: '',
    status: [] as string[],
    tipoInspeccion: '',
    mercado: '',
    date: undefined as DateRange | undefined,
};

const viewOnlyRoles = [ROLES.CANALES, ROLES.VISUAL];
const canModifyRoles = [ROLES.ADMIN, ROLES.SOPORTE, ROLES.GESTOR, ROLES.COLABORADOR, ROLES.CALIDAD];
const canExportRoles = Object.values(ROLES);
const canExportAllRoles = [ROLES.ADMIN, ROLES.COORDINADOR_SSPP];
const reprogrammableStatuses: Status[] = [STATUS.CANCELADA, STATUS.NO_APROBADA, STATUS.RECHAZADA];

interface RecordsTableProps {
    statusColors: Record<string, string>;
    page: number;
    rowsPerPage: number;
}

export function RecordsTable({ statusColors, page, rowsPerPage }: RecordsTableProps) {
  const { user, zone, reprogramInspection } = useAppContext();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const firestore = useFirestore();

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState(initialFilters);
  const [isExporting, setIsExporting] = useState(false);
  
  const canModify = user && canModifyRoles.includes(user.role);
  const canExport = user && canExportRoles.includes(user.role);
  const canExportAll = user && canExportAllRoles.includes(user.role);
  
  const topScrollRef = useRef<HTMLDivElement>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);

  const buildQuery = (collectionName: string) => {
    if (!firestore || !user) return null;
    const constraints: QueryConstraint[] = [];
    if (user.role !== ROLES.ADMIN && zone !== 'Todas las zonas') {
        constraints.push(where('zone', '==', zone));
    }
    return query(collection(firestore, collectionName), ...constraints);
  };

  const inspectionsQuery = useMemo(() => {
    if (!firestore || !user) return null;
    const constraints: QueryConstraint[] = [];
    if (user.role !== ROLES.ADMIN && zone !== 'Todas las zonas') {
        constraints.push(where('zone', '==', zone));
    }
    return query(collection(firestore, 'inspections'), ...constraints);
  }, [firestore, user, zone]);

  
  const expansionManagersQuery = useMemo(() => buildQuery('gestores_expansion'), [firestore, user, zone]);
  const collaboratorsQuery = useMemo(() => buildQuery('empresas_colaboradoras'), [firestore, user, zone]);
  const sectorsQuery = useMemo(() => buildQuery('sectores'), [firestore, user, zone]);
  const inspectorsQuery = useMemo(() => buildQuery('inspectores'), [firestore, user, zone]);
  
  const { data: expansionManagers } = useCollection<ExpansionManager>(expansionManagersQuery);
  const { data: collaborators } = useCollection<CollaboratorCompany>(collaboratorsQuery);
  const { data: sectors } = useCollection<Sector>(sectorsQuery);
  const { data: inspectors } = useCollection<Inspector>(inspectorsQuery);
  const { data: records, isLoading } = useCollection<InspectionRecord>(inspectionsQuery);

  const filteredRecords = useMemo(() => {
    if (!records) return [];
    return records.filter(record => {
      if (filters.id && !record.id.toLowerCase().includes(filters.id.toLowerCase())) return false;
      if (filters.gestor && record.gestor !== filters.gestor) return false;
      if (filters.inspector && record.inspector !== filters.inspector) return false;
      if (filters.empresa && record.collaboratorCompany !== filters.empresa) return false;
      if (filters.sector && record.sector !== filters.sector) return false;
      if (filters.poliza && record.poliza && !record.poliza.includes(filters.poliza)) return false;
      if (filters.caso && record.caso && !record.caso.includes(filters.caso)) return false;
      if (filters.serieMdd && record.serieMdd !== filters.serieMdd) return false;
      if (filters.status.length > 0 && !filters.status.includes(record.status)) return false;
      if (filters.tipoInspeccion && record.type !== filters.tipoInspeccion) return false;
      if (filters.mercado && record.mercado !== filters.mercado) return false;
      if (filters.date?.from && parse(record.requestDate, 'yyyy-MM-dd', new Date()) < filters.date.from) return false;
      if (filters.date?.to && parse(record.requestDate, 'yyyy-MM-dd', new Date()) > addDays(filters.date.to, 1)) return false;
      return true;
    });
  }, [records, filters]);
  
  const paginatedRecords = useMemo(() => {
    const startIndex = (page - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredRecords.slice(startIndex, endIndex);
  }, [filteredRecords, page, rowsPerPage]);

  const createQueryString = useCallback(
    (paramsToUpdate: Record<string, string | number>) => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(paramsToUpdate).forEach(([name, value]) => {
        params.set(name, String(value));
      });
 
      return params.toString()
    },
    [searchParams]
  );
  
  useEffect(() => {
    const topScroll = topScrollRef.current;
    const bottomScroll = bottomScrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');

    if (!topScroll || !bottomScroll) return;

    const syncScroll = (source: 'top' | 'bottom') => (event: Event) => {
      if (source === 'top') {
        bottomScroll.scrollLeft = (event.target as HTMLDivElement).scrollLeft;
      } else {
        topScroll.scrollLeft = (event.target as HTMLDivElement).scrollLeft;
      }
    };
    
    const handleTopScroll = syncScroll('top');
    const handleBottomScroll = syncScroll('bottom');

    topScroll.addEventListener('scroll', handleTopScroll);
    bottomScroll.addEventListener('scroll', handleBottomScroll);
    
    // Initial sync
    bottomScroll.scrollLeft = topScroll.scrollLeft;

    return () => {
      topScroll.removeEventListener('scroll', handleTopScroll);
      bottomScroll.removeEventListener('scroll', handleBottomScroll);
    };
  }, [paginatedRecords]);
  

  const handleFilterChange = (key: keyof typeof initialFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value || (Array.isArray(prev[key]) ? [] : '') }));
  }

  const clearFilters = () => {
    setFilters(initialFilters);
  }

  const totalPages = Math.ceil(filteredRecords.length / rowsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      router.push(`${pathname}?${createQueryString({ page: newPage })}`);
    }
  }
  
  const handleRowsPerPageChange = (value: string) => {
      router.push(`${pathname}?${createQueryString({ rows: value, page: 1 })}`);
  }

  const handleAction = (recordId: string, mode: 'view' | 'edit') => {
    const path = '/inspections/individual';
    router.push(`${path}?id=${recordId}&mode=${mode}&from=records`);
  }

  const handleExport = (allData: boolean) => {
    // Note: The 'allData' logic will be handled by a server action in a real high-scale scenario.
    // Here we simulate based on filteredRecords.
    const recordsToExport = allData ? records : filteredRecords;

    if (!recordsToExport || recordsToExport.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Exportación Vacía',
        description: 'No hay registros que coincidan con los filtros actuales para exportar.',
      });
      return;
    }

    const dataForCsv = recordsToExport.map(record => ({
      'Fecha de Creación del Registro': record.createdAt,
      'ID': record.id,
      'POLIZA': record.poliza,
      'CASO (AT)': record.caso,
      'ZONA': record.zone,
      'SECTOR': record.sector,
      'MUNICIPIO': record.municipality,
      'COLONIA': record.colonia,
      'CALLE': record.calle,
      'NUMERO': record.numero,
      'PORTAL': record.portal,
      'ESCALERA': record.escalera,
      'PISO': record.piso,
      'PUERTA': record.puerta,
      'TIPO DE INSPECCION': record.tipoInspeccion,
      'TIPO DE PROGRAMACION': record.tipoProgramacion,
      'TIPO MDD': record.tipoMdd,
      'MERCADO': record.mercado,
      'OFERTA/CAMPAÑA': record.oferta,
      'EMPRESA COLABORADORA': record.collaboratorCompany,
      'FECHA PROGRAMACION': record.requestDate,
      'HORARIO PROGRAMACION': record.horarioProgramacion,
      'INSTALADOR': record.instalador,
      'GESTOR': record.gestor,
      'INSPECTOR': record.inspector,
      'STATUS': record.status,
      'Observaciones': record.observaciones,
      'Fecha de Ultima Modificación': record.lastModifiedAt,
    }));

    const csv = Papa.unparse(dataForCsv);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `registros_inspecciones_${format(new Date(), 'yyyyMMdd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    setIsExporting(false);
    toast({
        title: "Exportación Completa",
        description: `${recordsToExport.length} registros han sido exportados a CSV.`
    });
  };

  const handleReprogram = (record: InspectionRecord) => {
    reprogramInspection(record);
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen} className='w-full'>
            <div className="flex items-center justify-between">
                <h3 className='text-xl font-semibold'>Filtros</h3>
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
                        <div className="space-y-2 lg:col-span-full">
                            <Label htmlFor="id">ID de Inspección</Label>
                            <Input id="id" placeholder="Buscar por ID..." value={filters.id} onChange={(e) => handleFilterChange('id', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="gestor">Gestor Asignado</Label>
                            <Select value={filters.gestor} onValueChange={(v) => handleFilterChange('gestor', v)}>
                                <SelectTrigger id="gestor"><SelectValue placeholder="Todos" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    {expansionManagers?.map(g => <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="inspector">Inspector Asignado</Label>
                            <Select value={filters.inspector} onValueChange={(v) => handleFilterChange('inspector', v)}>
                                <SelectTrigger id="inspector"><SelectValue placeholder="Todos" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    {inspectors?.map(i => <SelectItem key={i.id} value={i.name}>{i.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="empresa">Empresa Colaboradora</Label>
                            <Select value={filters.empresa} onValueChange={(v) => handleFilterChange('empresa', v)}>
                                <SelectTrigger id="empresa"><SelectValue placeholder="Todas" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas</SelectItem>
                                    {collaborators?.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="sector">Sector</Label>
                            <Select value={filters.sector} onValueChange={(v) => handleFilterChange('sector', v)}>
                                <SelectTrigger id="sector"><SelectValue placeholder="Todos" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    {sectors?.map(s => <SelectItem key={s.id} value={s.sector}>{s.sector}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="poliza">Póliza</Label>
                            <Input id="poliza" placeholder="Buscar por póliza..." value={filters.poliza} onChange={(e) => handleFilterChange('poliza', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="caso">Caso</Label>
                            <Input id="caso" placeholder="Buscar por caso AT..." value={filters.caso} onChange={(e) => handleFilterChange('caso', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="serieMdd">Serie MDD</Label>
                            <Input id="serieMdd" placeholder="Buscar por serie..." value={filters.serieMdd} onChange={(e) => handleFilterChange('serieMdd', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <MultiSelect
                                options={statusOptions}
                                onValueChange={(v) => handleFilterChange('status', v)}
                                defaultValue={filters.status}
                                placeholder="Seleccionar estatus..."
                                className="w-full"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tipoInspeccion">Tipo de Inspección</Label>
                            <Select value={filters.tipoInspeccion} onValueChange={(v) => handleFilterChange('tipoInspeccion', v)}>
                                <SelectTrigger id="tipoInspeccion"><SelectValue placeholder="Todos" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    {allInspectionTypes.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="mercado">Mercado</Label>
                            <Select value={filters.mercado} onValueChange={(v) => handleFilterChange('mercado', v)}>
                                <SelectTrigger id="mercado"><SelectValue placeholder="Todos" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    {MERCADO.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="date-range">Rango de Fechas</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                    id="date-range"
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !filters.date && "text-muted-foreground"
                                    )}
                                    >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {filters.date?.from ? (
                                        filters.date.to ? (
                                        <>
                                            {format(filters.date.from, "LLL dd, y", { locale: es })} -{" "}
                                            {format(filters.date.to, "LLL dd, y", { locale: es })}
                                        </>
                                        ) : (
                                        format(filters.date.from, "LLL dd, y")
                                        )
                                    ) : (
                                        <span>Selecciona un rango</span>
                                    )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={filters.date?.from}
                                    selected={filters.date}
                                    onSelect={(d) => handleFilterChange('date', d)}
                                    numberOfMonths={2}
                                    locale={es}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="flex items-end gap-2 lg:col-start-4">
                            <Button variant="ghost" className="w-full" onClick={clearFilters}>Limpiar</Button>
                        </div>
                    </div>
                </Card>
            </CollapsibleContent>
        </Collapsible>
        
        {canExport && (
          <div className='flex items-center gap-2 justify-end'>
            {canExportAll && 
                <Button
                variant="outline"
                className="bg-purple-600 text-white hover:bg-purple-700 hover:text-white border-purple-700"
                onClick={() => handleExport(true)}
                >
                <Server className="mr-2 h-4 w-4" /> Exportar Vista Completa (Admin)
                </Button>
            }
            <Dialog open={isExporting} onOpenChange={setIsExporting}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-green-600 text-white hover:bg-green-700 hover:text-white border-green-700 active:bg-green-800"
                >
                  <Download className="mr-2 h-4 w-4" /> Exportar Vista Actual
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirmar Exportación de Vista</DialogTitle>
                  <DialogDescription>
                    Se exportarán <strong>{filteredRecords.length}</strong> registros que coinciden con los filtros actuales.
                    ¿Deseas continuar?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild><Button variant="ghost">Cancelar</Button></DialogClose>
                  <Button onClick={() => handleExport(false)} className="bg-green-600 hover:bg-green-700">Confirmar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      <div className="w-full">
            <div ref={topScrollRef} className="overflow-x-auto overflow-y-hidden">
                <div className="h-px" style={{ width: paginatedRecords.length > 0 ? '2500px' : '100%' }} />
            </div>
            <ScrollArea ref={bottomScrollRef} className="w-full whitespace-nowrap rounded-md border">
                {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
                ) : (
                <Table>
                    <TableHeader>
                    <TableRow className='bg-primary/90 hover:bg-primary/90'>
                        <TableHead className="h-10 px-2 text-xs font-bold text-primary-foreground">Estatus</TableHead>
                        <TableHead className="h-10 px-2 text-xs font-bold text-primary-foreground">Fecha Alta</TableHead>
                        <TableHead className="h-10 px-2 text-xs font-bold text-primary-foreground">Fecha Prog.</TableHead>
                        <TableHead className="h-10 px-2 text-xs font-bold text-primary-foreground">Sector</TableHead>
                        <TableHead className="h-10 px-2 text-xs font-bold text-primary-foreground">Póliza</TableHead>
                        <TableHead className="h-10 px-2 text-xs font-bold text-primary-foreground">Caso (AT)</TableHead>
                        <TableHead className="h-10 px-2 text-xs font-bold text-primary-foreground">Municipio</TableHead>
                        <TableHead className="h-10 px-2 text-xs font-bold text-primary-foreground">Colonia</TableHead>
                        <TableHead className="h-10 px-2 text-xs font-bold text-primary-foreground">Calle</TableHead>
                        <TableHead className="h-10 px-2 text-xs font-bold text-primary-foreground">Número</TableHead>
                        <TableHead className="h-10 px-2 text-xs font-bold text-primary-foreground">Portal</TableHead>
                        <TableHead className="h-10 px-2 text-xs font-bold text-primary-foreground">Puerta</TableHead>
                        <TableHead className="h-10 px-2 text-xs font-bold text-primary-foreground">Tipo Inspección</TableHead>
                        <TableHead className="h-10 px-2 text-xs font-bold text-primary-foreground">Tipo Prog.</TableHead>
                        <TableHead className="h-10 px-2 text-xs font-bold text-primary-foreground">Mercado</TableHead>
                        <TableHead className="h-10 px-2 text-xs font-bold text-primary-foreground">Empresa Colab.</TableHead>
                        <TableHead className="h-10 px-2 text-xs font-bold text-primary-foreground">Gestor</TableHead>
                        <TableHead className="h-10 px-2 text-xs font-bold text-primary-foreground">Inspector</TableHead>
                        <TableHead className="h-10 px-2 text-xs font-bold text-primary-foreground">Últ. Mod.</TableHead>
                        <TableHead className="sticky right-0 bg-primary/90 h-10 px-2 text-xs font-bold text-primary-foreground">Acciones</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {paginatedRecords.map((record) => (
                        <TableRow key={record.id} className="transition-colors hover:bg-muted/60">
                        <TableCell className="py-2 px-2 text-xs">
                            <Badge className={cn('whitespace-nowrap', statusColors[record.status] || 'bg-gray-400')}>{record.status}</Badge>
                        </TableCell>
                        <TableCell className="py-2 px-2 text-xs">{record.createdAt}</TableCell>
                        <TableCell className="py-2 px-2 text-xs">{record.requestDate}</TableCell>
                        <TableCell className="py-2 px-2 text-xs">{record.sector || '-'}</TableCell>
                        <TableCell className="py-2 px-2 text-xs">{record.poliza || '-'}</TableCell>
                        <TableCell className="py-2 px-2 text-xs">{record.caso || '-'}</TableCell>
                        <TableCell className="py-2 px-2 text-xs">{record.municipality || '-'}</TableCell>
                        <TableCell className="py-2 px-2 text-xs">{record.colonia || '-'}</TableCell>
                        <TableCell className="py-2 px-2 text-xs">{record.calle || '-'}</TableCell>
                        <TableCell className="py-2 px-2 text-xs">{record.numero || '-'}</TableCell>
                        <TableCell className="py-2 px-2 text-xs">{record.portal || '-'}</TableCell>
                        <TableCell className="py-2 px-2 text-xs">{record.puerta || '-'}</TableCell>
                        <TableCell className="py-2 px-2 text-xs">{record.tipoInspeccion || '-'}</TableCell>
                        <TableCell className="py-2 px-2 text-xs">{record.tipoProgramacion || '-'}</TableCell>
                        <TableCell className="py-2 px-2 text-xs">{record.mercado || '-'}</TableCell>
                        <TableCell className="py-2 px-2 text-xs">{record.collaboratorCompany || '-'}</TableCell>
                        <TableCell className="py-2 px-2 text-xs">{record.gestor || '-'}</TableCell>
                        <TableCell className="py-2 px-2 text-xs">{record.inspector || '-'}</TableCell>
                        <TableCell className="py-2 px-2 text-xs">{record.lastModifiedAt || '-'}</TableCell>
                        <TableCell className="py-2 px-2 sticky right-0 bg-card/95">
                            <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleAction(record.id, 'view')}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Visualizar
                                </DropdownMenuItem>
                                {canModify && (user.role === ROLES.ADMIN || !(record.id.startsWith('SF-') && [STATUS.CANCELADA, STATUS.NO_APROBADA].includes(record.status as any))) && (
                                    <DropdownMenuItem onClick={() => handleAction(record.id, 'edit')}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Modificar
                                    </DropdownMenuItem>
                                )}
                                {canModify && reprogrammableStatuses.includes(record.status as any) && !record.id.startsWith('SF-') && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleReprogram(record)}>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Reprogramar
                                    </DropdownMenuItem>
                                </>
                                )}
                            </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                )}
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
           </div>
        <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Registros por página</span>
                 <Select value={`${rowsPerPage}`} onValueChange={handleRowsPerPageChange}>
                    <SelectTrigger className="h-8 w-[70px]">
                        <SelectValue placeholder={rowsPerPage} />
                    </SelectTrigger>
                    <SelectContent>
                        {[10, 20, 50, 100].map(size => (
                            <SelectItem key={size} value={`${size}`}>{size}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Página {page} de {totalPages}</span>
                <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handlePageChange(page - 1)} disabled={page === 1}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                     <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handlePageChange(page + 1)} disabled={page === totalPages}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    </>
  );
}
