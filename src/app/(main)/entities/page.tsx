'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CollaboratorCompanyForm } from "@/components/entities/collaborator-company-form";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

const entities = [
  "Empresa Colaboradora", "Instalador", "Gestor de Expansión", "Empresa de Control de Calidad", "Inspector", "Sectores"
];

const sampleCollaborators = [
    { id: 'EC-001', name: 'GasLink S.A. de C.V.', rfc: 'GLI010203AB4', zone: 'Zona Norte', status: 'Activa', created_at: '2023-01-15' },
    { id: 'EC-002', name: 'ServiGas del Norte', rfc: 'SGN050607CD8', zone: 'Zona Norte', status: 'Activa', created_at: '2023-02-20' },
    { id: 'EC-003', name: 'Conexiones Seguras', rfc: 'CSE101112EFG', zone: 'Bajio Norte', status: 'Inactiva', created_at: '2023-03-10' },
    { id: 'EC-004', name: 'Energía Confiable', rfc: 'ECO151213HIJ', zone: 'Zona Centro', status: 'Deshabilitada', created_at: '2023-04-05' },
];

export default function EntitiesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<typeof sampleCollaborators[0] | null>(null);

  const handleEdit = (company: typeof sampleCollaborators[0]) => {
    setSelectedCompany(company);
    setDialogOpen(true);
  };
  
  const handleNew = () => {
    setSelectedCompany(null);
    setDialogOpen(true);
  }

  const handleStatusChange = (company: any, newStatus: string) => {
    // Logic to change status, maybe with a confirmation dialog
    alert(`Cambiando estatus de ${company.name} a ${newStatus}`);
  };


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-3xl font-semibold">Gestión de Entidades</h1>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <Tabs defaultValue={entities[0]}>
          <TabsList>
            {entities.map(entity => <TabsTrigger key={entity} value={entity}>{entity}</TabsTrigger>)}
          </TabsList>

          <TabsContent value="Empresa Colaboradora">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Listado de: Empresa Colaboradora</CardTitle>
                    <CardDescription>Gestiona las empresas colaboradoras.</CardDescription>
                </div>
                 <DialogTrigger asChild>
                    <Button onClick={handleNew}>
                        <PlusCircle className="mr-2" />
                        Nuevo Registro
                    </Button>
                </DialogTrigger>
              </CardHeader>
              <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Nombre Empresa</TableHead>
                            <TableHead>RFC</TableHead>
                            <TableHead>Zona</TableHead>
                            <TableHead>Estatus</TableHead>
                             <TableHead>Fecha Alta</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sampleCollaborators.map(item => (
                             <TableRow key={item.id}>
                                <TableCell className="font-mono">{item.id}</TableCell>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell>{item.rfc}</TableCell>
                                 <TableCell>{item.zone}</TableCell>
                                <TableCell>
                                    <Badge variant={
                                        item.status === 'Activa' ? 'default' : 
                                        item.status === 'Inactiva' ? 'secondary' : 'destructive'
                                    }>{item.status}</Badge>
                                </TableCell>
                                <TableCell>{item.created_at}</TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button aria-haspopup="true" size="icon" variant="ghost">
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Toggle menu</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => handleEdit(item)}>Editar</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleStatusChange(item, 'Activa')} className="text-green-600">Activar</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleStatusChange(item, 'Inactiva')} className="text-yellow-600">Poner Inactiva</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleStatusChange(item, 'Deshabilitada')} className="text-red-600">Deshabilitar</DropdownMenuItem>
                                    </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                             </TableRow>
                        ))}
                    </TableBody>
                 </Table>
                 {/* TODO: Add Pagination Controls */}
              </CardContent>
            </Card>
          </TabsContent>
          
          {entities.slice(1).map(entity => (
            <TabsContent key={entity} value={entity}>
              <Card>
                <CardHeader>
                  <CardTitle>Listado de: {entity}</CardTitle>
                  <CardDescription>Próximamente...</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>La funcionalidad para {entity} se implementará en una futura iteración.</p>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
        <CollaboratorCompanyForm company={selectedCompany} onClose={() => setDialogOpen(false)}/>
      </Dialog>
    </div>
  );
}
