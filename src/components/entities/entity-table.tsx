'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

const statusColors: Record<string, string> = {
  Activa: 'bg-green-600/80 border-green-700 text-white',
  Inactiva: 'bg-yellow-500/80 border-yellow-600 text-white',
  Deshabilitada: 'bg-red-700/80 border-red-800 text-white',
  Activo: 'bg-green-600/80 border-green-700 text-white',
  Inactivo: 'bg-yellow-500/80 border-yellow-600 text-white',
  Deshabilitado: 'bg-red-700/80 border-red-800 text-white',
};

interface ColumnDefinition {
  accessor: string;
  header: string;
}

interface EntityTableProps {
  data: any[];
  columns: ColumnDefinition[];
  canModify: boolean;
  canDelete: boolean;
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
}

export function EntityTable({
  data,
  columns,
  canModify,
  canDelete,
  onEdit,
  onDelete,
}: EntityTableProps) {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const paginatedData = data.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );
  const totalPages = Math.ceil(data.length / rowsPerPage);
  
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
        setPage(newPage);
    }
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.accessor}>{col.header}</TableHead>
              ))}
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  className="h-24 text-center"
                >
                  No se encontraron resultados.
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/60">
                  {columns.map((col) => (
                    <TableCell
                      key={col.accessor}
                      className="py-2 px-4 whitespace-nowrap"
                    >
                      {col.accessor === 'status' ? (
                        <Badge
                          className={cn(
                            'whitespace-nowrap',
                            statusColors[item[col.accessor]] || 'bg-gray-400'
                          )}
                        >
                          {item[col.accessor]}
                        </Badge>
                      ) : (
                        item[col.accessor]
                      )}
                    </TableCell>
                  ))}
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
                        {canModify && (
                          <DropdownMenuItem onClick={() => onEdit(item)}>
                            Editar
                          </DropdownMenuItem>
                        )}
                        {canDelete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => onDelete(item)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Deshabilitar
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Registros por página</span>
          <Select
            value={`${rowsPerPage}`}
            onValueChange={(value) => {
              setRowsPerPage(+value);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={rowsPerPage} />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50, 100].map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            Página {totalPages > 0 ? page : 0} de {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
