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
import { QualityControlCompanyForm } from "@/components/entities/quality-control-company-form";
import { InspectorForm } from "@/components/entities/inspector-form";
import { InstallerForm } from "@/components/entities/installer-form";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { sampleCollaborators, sampleQualityControlCompanies, sampleInspectors, sampleInstallers, sampleExpansionManagers, sampleSectors } from "@/lib/mock-data";
import type { CollaboratorCompany, QualityControlCompany, Inspector, Installer, ExpansionManager, Sector } from "@/lib/mock-data";
import { ExpansionManagerForm } from "@/components/entities/expansion-manager-form";
import { SectorForm } from "@/components/entities/sector-form";


const entities = [
  "Empresa Colaboradora", "Instalador", "Gestor de Expansión", "Empresa de Control de Calidad", "Inspector", "Sectores"
];


export default function EntitiesPage() {
  const [collaboratorDialogOpen, setCollaboratorDialogOpen] = useState(false);
  const [qualityDialogOpen, setQualityDialogOpen] = useState(false);
  const [inspectorDialogOpen, setInspectorDialogOpen] = useState(false);
  const [installerDialogOpen, setInstallerDialogOpen] = useState(false);
  const [managerDialogOpen, setManagerDialogOpen] = useState(false);
  const [sectorDialogOpen, setSectorDialogOpen] = useState(false);
  
  const [selectedCollaborator, setSelectedCollaborator] = useState<CollaboratorCompany | null>(null);
  const [selectedQualityCompany, setSelectedQualityCompany] = useState<QualityControlCompany | null>(null);
  const [selectedInspector, setSelectedInspector] = useState<Inspector | null>(null);
  const [selectedInstaller, setSelectedInstaller] = useState<Installer | null>(null);
  const [selectedManager, setSelectedManager] = useState<ExpansionManager | null>(null);
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);


  const handleEditCollaborator = (company: CollaboratorCompany) => {
    setSelectedCollaborator(company);
    setCollaboratorDialogOpen(true);
  };
  
  const handleNewCollaborator = () => {
    setSelectedCollaborator(null);
    setCollaboratorDialogOpen(true);
  }

  const handleEditQualityCompany = (company: QualityControlCompany) => {
    setSelectedQualityCompany(company);
    setQualityDialogOpen(true);
  };

  const handleNewQualityCompany = () => {
    setSelectedQualityCompany(null);
    setQualityDialogOpen(true);
  };

  const handleEditInspector = (inspector: Inspector) => {
    setSelectedInspector(inspector);
    setInspectorDialogOpen(true);
  };

  const handleNewInspector = () => {
    setSelectedInspector(null);
    setInspectorDialogOpen(true);
  };

  const handleEditInstaller = (installer: Installer) => {
    setSelectedInstaller(installer);
    setInstallerDialogOpen(true);
  };

  const handleNewInstaller = () => {
    setSelectedInstaller(null);
    setInstallerDialogOpen(true);
  };

  const handleEditManager = (manager: ExpansionManager) => {
    setSelectedManager(manager);
    setManagerDialogOpen(true);
  };

  const handleNewManager = () => {
    setSelectedManager(null);
    setManagerDialogOpen(true);
  };

  const handleEditSector = (sector: Sector) => {
    setSelectedSector(sector);
    setSectorDialogOpen(true);
  };

  const handleNewSector = () => {
    setSelectedSector(null);
    setSectorDialogOpen(true);
  };


  const handleStatusChange = (item: any, newStatus: string) => {
    // Logic to change status, maybe with a confirmation dialog
    alert(`Cambiando estatus de ${item.name || item.sector} a ${newStatus}`);
  };


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-3xl font-semibold">Gestión de Entidades</h1>
      </div>

      
        <Tabs defaultValue={entities[0]}>
          <TabsList className="flex-wrap h-auto">
            {entities.map(entity => <TabsTrigger key={entity} value={entity}>{entity}</TabsTrigger>)}
          </TabsList>

          <TabsContent value="Empresa Colaboradora">
            <Dialog open={collaboratorDialogOpen} onOpenChange={setCollaboratorDialogOpen}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                      <CardTitle>Listado de: Empresa Colaboradora</CardTitle>
                      <CardDescription>Gestiona las empresas colaboradoras.</CardDescription>
                  </div>
                   <DialogTrigger asChild>
                      <Button onClick={handleNewCollaborator}>
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
                                          <DropdownMenuItem onClick={() => handleEditCollaborator(item)}>Editar</DropdownMenuItem>
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
              <CollaboratorCompanyForm company={selectedCollaborator} onClose={() => setCollaboratorDialogOpen(false)}/>
            </Dialog>
          </TabsContent>
          
          <TabsContent value="Instalador">
            <Dialog open={installerDialogOpen} onOpenChange={setInstallerDialogOpen}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Listado de: Instaladores</CardTitle>
                    <CardDescription>Gestiona los instaladores.</CardDescription>
                  </div>
                  <DialogTrigger asChild>
                    <Button onClick={handleNewInstaller}>
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
                        <TableHead>Nombre Instalador</TableHead>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Cert. Fin</TableHead>
                        <TableHead>Estatus</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sampleInstallers.map(item => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono">{item.id}</TableCell>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.collaboratorCompany}</TableCell>
                          <TableCell>{item.certEndDate}</TableCell>
                           <TableCell>
                            <Badge variant={
                                item.status === 'Activo' ? 'default' : 
                                item.status === 'Inactivo' ? 'secondary' : 'destructive'
                            }>{item.status}</Badge>
                          </TableCell>
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
                                <DropdownMenuItem onClick={() => handleEditInstaller(item)}>Editar</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(item, 'Activo')} className="text-green-600">Activar</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(item, 'Inactivo')} className="text-yellow-600">Poner Inactivo</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(item, 'Deshabilitado')} className="text-red-600">Deshabilitar</DropdownMenuItem>
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
              <InstallerForm installer={selectedInstaller} onClose={() => setInstallerDialogOpen(false)} />
            </Dialog>
          </TabsContent>

          <TabsContent value="Gestor de Expansión">
            <Dialog open={managerDialogOpen} onOpenChange={setManagerDialogOpen}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Listado de: Gestores de Expansión</CardTitle>
                    <CardDescription>Gestiona los gestores de expansión.</CardDescription>
                  </div>
                  <DialogTrigger asChild>
                    <Button onClick={handleNewManager}>
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
                        <TableHead>Nombre</TableHead>
                        <TableHead>Zona</TableHead>
                        <TableHead>Asignación</TableHead>
                        <TableHead>Estatus</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sampleExpansionManagers.map(item => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono">{item.id}</TableCell>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.zone}</TableCell>
                          <TableCell>{item.assignment}</TableCell>
                           <TableCell>
                            <Badge variant={
                                item.status === 'Activo' ? 'default' : 
                                item.status === 'Inactivo' ? 'secondary' : 'destructive'
                            }>{item.status}</Badge>
                          </TableCell>
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
                                <DropdownMenuItem onClick={() => handleEditManager(item)}>Editar</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(item, 'Activo')} className="text-green-600">Activar</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(item, 'Inactivo')} className="text-yellow-600">Poner Inactivo</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(item, 'Deshabilitado')} className="text-red-600">Deshabilitar</DropdownMenuItem>
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
              <ExpansionManagerForm manager={selectedManager} onClose={() => setManagerDialogOpen(false)} />
            </Dialog>
          </TabsContent>

          <TabsContent value="Empresa de Control de Calidad">
            <Dialog open={qualityDialogOpen} onOpenChange={setQualityDialogOpen}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Listado de: Empresa de Control de Calidad</CardTitle>
                    <CardDescription>Gestiona las empresas de control de calidad.</CardDescription>
                  </div>
                  <DialogTrigger asChild>
                    <Button onClick={handleNewQualityCompany}>
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
                      {sampleQualityControlCompanies.map(item => (
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
                                <DropdownMenuItem onClick={() => handleEditQualityCompany(item)}>Editar</DropdownMenuItem>
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
              <QualityControlCompanyForm company={selectedQualityCompany} onClose={() => setQualityDialogOpen(false)} />
            </Dialog>
          </TabsContent>

          <TabsContent value="Inspector">
            <Dialog open={inspectorDialogOpen} onOpenChange={setInspectorDialogOpen}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Listado de: Inspectores</CardTitle>
                    <CardDescription>Gestiona los inspectores de calidad.</CardDescription>
                  </div>
                  <DialogTrigger asChild>
                    <Button onClick={handleNewInspector}>
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
                        <TableHead>Nombre Inspector</TableHead>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Cert. Fin</TableHead>
                        <TableHead>Estatus</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sampleInspectors.map(item => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono">{item.id}</TableCell>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.qualityCompany}</TableCell>
                          <TableCell>{item.certEndDate}</TableCell>
                           <TableCell>
                            <Badge variant={
                                item.status === 'Activo' ? 'default' : 
                                item.status === 'Inactivo' ? 'secondary' : 'destructive'
                            }>{item.status}</Badge>
                          </TableCell>
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
                                <DropdownMenuItem onClick={() => handleEditInspector(item)}>Editar</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(item, 'Activo')} className="text-green-600">Activar</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(item, 'Inactivo')} className="text-yellow-600">Poner Inactivo</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(item, 'Deshabilitado')} className="text-red-600">Deshabilitar</DropdownMenuItem>
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
              <InspectorForm inspector={selectedInspector} onClose={() => setInspectorDialogOpen(false)} />
            </Dialog>
          </TabsContent>
          
          <TabsContent value="Sectores">
            <Dialog open={sectorDialogOpen} onOpenChange={setSectorDialogOpen}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Listado de: Sectores</CardTitle>
                    <CardDescription>Gestiona los sectores.</CardDescription>
                  </div>
                  <DialogTrigger asChild>
                    <Button onClick={handleNewSector}>
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
                        <TableHead>Sector</TableHead>
                        <TableHead>Clave</TableHead>
                        <TableHead>Zona</TableHead>
                        <TableHead>Asignación</TableHead>
                        <TableHead>Estatus</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sampleSectors.map(item => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono">{item.id}</TableCell>
                          <TableCell className="font-medium">{item.sector}</TableCell>
                          <TableCell>{item.sectorKey}</TableCell>
                          <TableCell>{item.zone}</TableCell>
                          <TableCell>{item.assignment}</TableCell>
                          <TableCell>
                            <Badge variant={
                                item.status === 'Activo' ? 'default' : 
                                item.status === 'Inactivo' ? 'secondary' : 'destructive'
                            }>{item.status}</Badge>
                          </TableCell>
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
                                <DropdownMenuItem onClick={() => handleEditSector(item)}>Editar</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(item, 'Activo')} className="text-green-600">Activar</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(item, 'Inactivo')} className="text-yellow-600">Poner Inactivo</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(item, 'Deshabilitado')} className="text-red-600">Deshabilitar</DropdownMenuItem>
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
              <SectorForm sector={selectedSector} onClose={() => setSectorDialogOpen(false)} />
            </Dialog>
          </TabsContent>
        </Tabs>
    </div>
  );
}