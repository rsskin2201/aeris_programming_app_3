import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { mockRecords, InspectionRecord } from "@/lib/mock-data";
import { MoreHorizontal, Download, Filter } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const statusVariant: Record<InspectionRecord['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
  'Aprobado': 'default',
  'Contemplado': 'secondary',
  'Pendiente Aprobación': 'outline',
  'Rechazado': 'destructive',
};


export default function RecordsPage() {
  return (
    <div className="flex flex-col gap-6">
       <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-headline text-3xl font-semibold">Gestión de Registros</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> Filtros</Button>
          <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Exportar .csv</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Inspecciones</CardTitle>
          <CardDescription>Muestra todos los registros de inspecciones, tanto de formulario como de carga masiva.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha Solicitud</TableHead>
                <TableHead>Inspector</TableHead>
                <TableHead>Estatus</TableHead>
                <TableHead><span className="sr-only">Acciones</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.id}</TableCell>
                  <TableCell>{record.type}</TableCell>
                  <TableCell>{record.address}</TableCell>
                  <TableCell>{record.client}</TableCell>
                  <TableCell>{record.requestDate}</TableCell>
                  <TableCell>{record.inspector}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[record.status]}>{record.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem>Visualizar</DropdownMenuItem>
                        <DropdownMenuItem>Modificar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
