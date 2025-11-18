'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { InspectionRecord, sampleExpansionManagers, sampleCollaborators, sampleSectors } from "@/lib/mock-data";
import { MoreHorizontal, Download, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAppContext } from '@/hooks/use-app-context';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

const statusVariant: Record<InspectionRecord['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
  'REGISTRADA': 'outline',
  'CONFIRMADA POR GE': 'default',
  'PROGRAMADA': 'default',
  'EN PROCESO': 'secondary',
  'APROBADA': 'default',
  'NO APROBADA': 'destructive',
  'CANCELADA': 'destructive',
  'RESULTADO REGISTRADO': 'default',
  // Old statuses for compatibility
  'Aprobado': 'default',
  'Contemplado': 'secondary',
  'Pendiente Aprobación': 'outline',
  'Rechazado': 'destructive',
};


export default function RecordsPage() {
  const { zone, records } = useAppContext();
  const router = useRouter();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [date, setDate] = useState<DateRange | undefined>();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filteredRecords = useMemo(() =>
    records.filter(record => zone === 'Todas las zonas' || record.zone === zone),
    [zone, records]
  );
  
  const paginatedRecords = useMemo(() => {
    const startIndex = (page - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredRecords.slice(startIndex, endIndex);
  }, [filteredRecords, page, rowsPerPage]);

  const totalPages = Math.ceil(filteredRecords.length / rowsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
    }
  }

  const handleAction = (recordId: string, mode: 'view' | 'edit') => {
    // This is a simplification. In a real app, you'd check the record type 
    // and navigate to the correct form (individual, massive, special).
    // For now, we'll assume all are individual.
    router.push(`/inspections/individual?id=${recordId}&mode=${mode}`);
  }


  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-headline text-3xl font-semibold">Gestión de Registros</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Exportar .csv</Button>
        </div>
      </div>

       <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
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
                     <div className="space-y-2">
                        <Label htmlFor="gestor">Gestor Asignado</Label>
                        <Select>
                            <SelectTrigger id="gestor"><SelectValue placeholder="Todos" /></SelectTrigger>
                            <SelectContent>
                                {sampleExpansionManagers.map(g => <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="empresa">Empresa Colaboradora</Label>
                        <Select>
                            <SelectTrigger id="empresa"><SelectValue placeholder="Todas" /></SelectTrigger>
                            <SelectContent>
                                 {sampleCollaborators.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sector">Sector</Label>
                         <Select>
                            <SelectTrigger id="sector"><SelectValue placeholder="Todos" /></SelectTrigger>
                            <SelectContent>
                                {sampleSectors.map(s => <SelectItem key={s.id} value={s.sector}>{s.sector}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="poliza">Póliza</Label>
                        <Input id="poliza" placeholder="Buscar por póliza..." />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="caso">Caso</Label>
                        <Input id="caso" placeholder="Buscar por caso AT..." />
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
                                    !date && "text-muted-foreground"
                                )}
                                >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date?.from ? (
                                    date.to ? (
                                    <>
                                        {format(date.from, "LLL dd, y", { locale: es })} -{" "}
                                        {format(date.to, "LLL dd, y", { locale: es })}
                                    </>
                                    ) : (
                                    format(date.from, "LLL dd, y")
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
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={setDate}
                                numberOfMonths={2}
                                locale={es}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="flex items-end gap-2">
                        <Button className="w-full">Aplicar Filtros</Button>
                        <Button variant="ghost" className="w-full">Limpiar</Button>
                    </div>
                </div>
            </Card>
        </CollapsibleContent>
      </Collapsible>


      <Card>
        <CardHeader>
          <CardTitle>Listado de Inspecciones</CardTitle>
          <CardDescription>Muestra todos los registros de inspecciones, tanto de formulario como de carga masiva.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Estatus</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha Sol.</TableHead>
                <TableHead>Fecha Alta</TableHead>
                <TableHead>Usuario Alta</TableHead>
                <TableHead>Inspector</TableHead>
                <TableHead>Zona</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRecords.map((record) => (
                <TableRow key={record.id} className="h-auto">
                  <TableCell className="py-2 px-4 font-medium">{record.id}</TableCell>
                   <TableCell className="py-2 px-4">
                    <Badge variant={statusVariant[record.status]}>{record.status}</Badge>
                  </TableCell>
                  <TableCell className="py-2 px-4">{record.type}</TableCell>
                  <TableCell className="py-2 px-4">{record.address}</TableCell>
                  <TableCell className="py-2 px-4">{record.client}</TableCell>
                  <TableCell className="py-2 px-4">{record.requestDate}</TableCell>
                  <TableCell className="py-2 px-4">{record.createdAt}</TableCell>
                  <TableCell className="py-2 px-4">{record.createdBy}</TableCell>
                  <TableCell className="py-2 px-4">{record.inspector}</TableCell>
                  <TableCell className="py-2 px-4">{record.zone}</TableCell>
                  <TableCell className="py-2 px-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleAction(record.id, 'view')}>Visualizar</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction(record.id, 'edit')}>Modificar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Registros por página</span>
                 <Select value={`${rowsPerPage}`} onValueChange={value => setRowsPerPage(+value)}>
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
        </CardFooter>
      </Card>
    </div>
  );
}
