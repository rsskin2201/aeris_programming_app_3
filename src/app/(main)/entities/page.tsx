import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const entities = [
  "Empresa Colaboradora", "Instalador", "Gestor de Expansión", "Empresa de Control de Calidad", "Inspector", "Sectores"
];

const sampleData = [
    { id: 'EC-01', name: 'GasLink S.A. de C.V.', contact: 'Juan Rodriguez', status: 'Activo' },
    { id: 'EC-02', name: 'ServiGas del Norte', contact: 'Maria Lopez', status: 'Activo' },
    { id: 'EC-03', name: 'Conexiones Seguras', contact: 'Pedro Martinez', status: 'Inactivo' },
];

export default function EntitiesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-3xl font-semibold">Gestión de Entidades</h1>
        <Button>Crear Nueva Entidad</Button>
      </div>

      <Tabs defaultValue={entities[0]}>
        <TabsList>
          {entities.map(entity => <TabsTrigger key={entity} value={entity}>{entity}</TabsTrigger>)}
        </TabsList>
        {entities.map(entity => (
          <TabsContent key={entity} value={entity}>
            <Card>
              <CardHeader>
                <CardTitle>Listado de: {entity}</CardTitle>
                <CardDescription>Gestiona las entidades de este tipo.</CardDescription>
              </CardHeader>
              <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Contacto Principal</TableHead>
                            <TableHead>Estatus</TableHead>
                            <TableHead><span className="sr-only">Acciones</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sampleData.map(item => (
                             <TableRow key={item.id}>
                                <TableCell>{item.id}</TableCell>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell>{item.contact}</TableCell>
                                <TableCell>
                                    <Badge variant={item.status === 'Activo' ? 'default' : 'destructive'}>{item.status}</Badge>
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
                                        <DropdownMenuItem>Editar</DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive">Deshabilitar</DropdownMenuItem>
                                    </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                             </TableRow>
                        ))}
                    </TableBody>
                 </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
