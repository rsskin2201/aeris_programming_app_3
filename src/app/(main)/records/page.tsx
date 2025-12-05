'use server';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Download, Filter, ChevronLeft, ChevronRight, CalendarIcon, Eye, Pencil, ListTodo, Server, Loader2, RefreshCw } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
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
import { MultiSelect } from '@/components/ui/multi-select';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { RecordsTable } from '@/components/records/records-table';

const statusColors: Record<InspectionRecord['status'], string> = {
  [STATUS.REGISTRADA]: 'bg-gray-500/80 border-gray-600 text-white',
  [STATUS.CONFIRMADA_POR_GE]: 'bg-cyan-600/80 border-cyan-700 text-white',
  [STATUS.PROGRAMADA]: 'bg-blue-600/80 border-blue-700 text-white',
  [STATUS.EN_PROCESO]: 'bg-orange-500/80 border-orange-600 text-white',
  [STATUS.PENDIENTE_INFORMAR_DATOS]: 'bg-yellow-500/80 border-yellow-600 text-white',
  [STATUS.APROBADA]: 'bg-green-600/80 border-green-700 text-white',
  [STATUS.NO_APROBADA]: 'bg-red-600/80 border-red-700 text-white',
  [STATUS.RECHAZADA]: 'bg-red-700/80 border-red-800 text-white',
  [STATUS.CANCELADA]: 'bg-red-800/80 border-red-900 text-white',
  [STATUS.CONECTADA]: 'bg-purple-600/80 border-purple-700 text-white',
  [STATUS.FALTA_INFORMACION]: 'bg-yellow-600/80 border-yellow-700 text-white',
};

export default async function RecordsPage({
  searchParams,
}: {
  searchParams?: {
    page?: string;
    rows?: string;
    id?: string;
    status?: string;
  };
}) {

  const page = Number(searchParams?.page) || 1;
  const rows = Number(searchParams?.rows) || 10;
  
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="flex items-center gap-3 font-headline text-3xl font-semibold">
          <ListTodo className="h-8 w-8 text-primary" />
          Gestión de Registros
        </h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Listado de Inspecciones</CardTitle>
          <CardDescription>Muestra todos los registros de inspecciones, tanto de formulario como de carga masiva.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
            <RecordsTable statusColors={statusColors} page={page} rowsPerPage={rows} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
