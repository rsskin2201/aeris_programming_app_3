'use client';

import { useMemo, useState } from "react";
import { collection, query, where, QueryConstraint } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, PlusCircle, Settings, Upload } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CollaboratorCompanyForm } from "@/components/entities/collaborator-company-form";
import { QualityControlCompanyForm } from "@/components/entities/quality-control-company-form";
import { InspectorForm } from "@/components/entities/inspector-form";
import { InstallerForm } from "@/components/entities/installer-form";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import type { CollaboratorCompany, QualityControlCompany, Inspector, Installer, ExpansionManager, Sector } from "@/lib/mock-data";
import { ExpansionManagerForm } from "@/components/entities/expansion-manager-form";
import { SectorForm } from "@/components/entities/sector-form";
import { useAppContext } from "@/hooks/use-app-context";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ROLES } from "@/lib/types";


const entities = [
  "Empresa Colaboradora", "Instalador", "Gestor de Expansión", "Empresa de Control de Calidad", "Inspector", "Sectores"
];

const statusColors: Record<string, string> = {
  'Activa': 'bg-green-600/80 border-green-700 text-white',
  'Inactiva': 'bg-yellow-500/80 border-yellow-600 text-white',
  'Deshabilitada': 'bg-red-600/80 border-red-700 text-white',
  'Activo': 'bg-green-600/80 border-green-700 text-white',
  'Inactivo': 'bg-yellow-500/80 border-yellow-600 text-white',
  'Deshabilitado': 'bg-red-600/80 border-red-700 text-white',
};

const viewOnlyRoles = [ROLES.VISUAL];
const canModifyRoles = [ROLES.ADMIN, ROLES.SOPORTE, ROLES.GESTOR, ROLES.COLABORADOR, ROLES.CALIDAD, ROLES.CANALES];

export default function EntitiesPage() {
  const { user, zone } = useAppContext();
  const firestore = useFirestore();

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
  
  const canModify = user && canModifyRoles.includes(user.role);
  const canUpload = user && [ROLES.ADMIN, ROLES.CANALES].includes(user.role);

  const buildQuery = (collectionName: string) => {
    if (!firestore || !user) return null;
    const constraints: QueryConstraint[] = [];
    if (user.role !== ROLES.ADMIN && zone !== 'Todas las zonas') {
        constraints.push(where('zone', '==', zone));
    }
    return query(collection(firestore, collectionName), ...constraints);
  };
  
  const collaboratorsQuery = useMemoFirebase(() => buildQuery('empresas_colaboradoras'), [firestore, user, zone]);
  const { data: collaborators } = useCollection<CollaboratorCompany>(collaboratorsQuery);
  
  const installersQuery = useMemoFirebase(() => buildQuery('instaladores'), [firestore, user, zone]);
  const { data: installers } = useCollection<Installer>(installersQuery);

  const managersQuery = useMemoFirebase(() => buildQuery('gestores_expansion'), [firestore, user, zone]);
  const { data: expansionManagers } = useCollection<ExpansionManager>(managersQuery);
  
  const qualityQuery = useMemoFirebase(() => buildQuery('empresas_control_calidad'), [firestore, user, zone]);
  const { data: qualityCompanies } = useCollection<QualityControlCompany>(qualityQuery);
  
  const inspectorsQuery = useMemoFirebase(() => buildQuery('inspectores'), [firestore, user, zone]);
  const { data: inspectors } = useCollection<Inspector>(inspectorsQuery);
  
  const sectorsQuery = useMemoFirebase(() => buildQuery('sectores'), [firestore, user, zone]);
  const { data: sectors } = useCollection<Sector>(sectorsQuery);

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
        <h1 className="flex items-center gap-3 font-headline text-3xl font-semibold">
          <Settings className="h-8 w-8 text-primary" />
          Gestión de Entidades
        </h1>
         {canUpload && (
            <Button asChild>
              <Link href="/entities/upload">
                <Upload className="mr-2 h-4 w-4" />
                Carga Masiva
              </Link>
            </Button>
         )}
      </div>

      
        <Tabs defaultValue={entities[0]}>
          <TabsList className="h-auto flex-wrap justify-start bg-transparent p-0">
            {entities.map(entity => (
              <TabsTrigger 
                key={entity} 
                value={entity}
                className="transition-all duration-300 data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-md hover:bg-primary/5 hover:border-primary/50 border-b-2 border-transparent"
              >
                {entity}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="Empresa Colaboradora">
            <Dialog open={collaboratorDialogOpen} onOpenChange={setCollaboratorDialogOpen}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                      <CardTitle>Listado de: Empresa Colaboradora</CardTitle>
                      <CardDescription>Gestiona las empresas colaboradoras.</CardDescription>
                  </div>
                  {canModify && (
                   <DialogTrigger asChild>
                      <Button onClick={handleNewCollaborator}>
                          <PlusCircle className="mr-2" />
                          Nuevo Registro
                      </Button>
                  </DialogTrigger>
                  )}
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
                          {collaborators?.map(item => (
                               <TableRow key={item.id} className="hover:bg-muted/60">
                                  <TableCell className="py-2 px-4 font-mono">{item.id}</TableCell>
                                  <TableCell className="py-2 px-4 font-medium">{item.name}</TableCell>
                                  <TableCell className="py-2 px-4">{item.rfc}</TableCell>
                                   <TableCell className="py-2 px-4">{item.zone}</TableCell>
                                  <TableCell className="py-2 px-4">
                                      <Badge className={cn('whitespace-nowrap', statusColors[item.status] || 'bg-gray-400')}>{item.status}</Badge>
                                  </TableCell>
                                  <TableCell className="py-2 px-4">{item.created_at}</TableCell>
                                  <TableCell className="py-2 px-4 text-right">
                                      {canModify && (
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
                                      )}
                                  </TableCell>
                               </TableRow>
                          ))}
                      </TableBody>
                   </Table>
                   {/* TODO: Add Pagination Controls */}
                </CardContent>
              </Card>
              {canModify && <CollaboratorCompanyForm company={selectedCollaborator} onClose={() => setCollaboratorDialogOpen(false)}/>}
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
                  {canModify && (
                    <DialogTrigger asChild>
                      <Button onClick={handleNewInstaller}>
                        <PlusCircle className="mr-2" />
                        Nuevo Registro
                      </Button>
                    </DialogTrigger>
                  )}
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Zona</TableHead>
                        <TableHead>Cert. Inicio</TableHead>
                        <TableHead>Cert. Fin</TableHead>
                        <TableHead>Estatus</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {installers?.map(item => (
                        <TableRow key={item.id} className="hover:bg-muted/60">
                          <TableCell className="py-2 px-4 font-mono">{item.id}</TableCell>
                          <TableCell className="py-2 px-4 font-medium">{item.name}</TableCell>
                          <TableCell className="py-2 px-4">{item.collaboratorCompany}</TableCell>
                          <TableCell className="py-2 px-4">{item.zone}</TableCell>
                          <TableCell className="py-2 px-4">{item.certStartDate}</TableCell>
                          <TableCell className="py-2 px-4">{item.certEndDate}</TableCell>
                           <TableCell className="py-2 px-4">
                            <Badge className={cn('whitespace-nowrap', statusColors[item.status] || 'bg-gray-400')}>{item.status}</Badge>
                          </TableCell>
                          <TableCell className="py-2 px-4 text-right">
                           {canModify && (
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
                           )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {/* TODO: Add Pagination Controls */}
                </CardContent>
              </Card>
              {canModify && <InstallerForm installer={selectedInstaller} onClose={() => setInstallerDialogOpen(false)} />}
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
                  {canModify && (
                  <DialogTrigger asChild>
                    <Button onClick={handleNewManager}>
                      <PlusCircle className="mr-2" />
                      Nuevo Registro
                    </Button>
                  </DialogTrigger>
                  )}
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Puesto</TableHead>
                        <TableHead>Zona</TableHead>
                        <TableHead>Asignación</TableHead>
                        <TableHead>Sub-Asignación</TableHead>
                        <TableHead>Estatus</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expansionManagers?.map(item => (
                        <TableRow key={item.id} className="hover:bg-muted/60">
                          <TableCell className="py-2 px-4 font-mono">{item.id}</TableCell>
                          <TableCell className="py-2 px-4 font-medium">{item.name}</TableCell>
                          <TableCell className="py-2 px-4">{item.position}</TableCell>
                          <TableCell className="py-2 px-4">{item.zone}</TableCell>
                          <TableCell className="py-2 px-4">{item.assignment}</TableCell>
                          <TableCell className="py-2 px-4">{item.subAssignment}</TableCell>
                           <TableCell className="py-2 px-4">
                            <Badge className={cn('whitespace-nowrap', statusColors[item.status] || 'bg-gray-400')}>{item.status}</Badge>
                          </TableCell>
                          <TableCell className="py-2 px-4 text-right">
                           {canModify && (
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
                           )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {/* TODO: Add Pagination Controls */}
                </CardContent>
              </Card>
              {canModify && <ExpansionManagerForm manager={selectedManager} onClose={() => setManagerDialogOpen(false)} />}
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
                  {canModify && (
                  <DialogTrigger asChild>
                    <Button onClick={handleNewQualityCompany}>
                      <PlusCircle className="mr-2" />
                      Nuevo Registro
                    </Button>
                  </DialogTrigger>
                  )}
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
                      {qualityCompanies?.map(item => (
                        <TableRow key={item.id} className="hover:bg-muted/60">
                          <TableCell className="py-2 px-4 font-mono">{item.id}</TableCell>
                          <TableCell className="py-2 px-4 font-medium">{item.name}</TableCell>
                          <TableCell className="py-2 px-4">{item.rfc}</TableCell>
                          <TableCell className="py-2 px-4">{item.zone}</TableCell>
                          <TableCell className="py-2 px-4">
                            <Badge className={cn('whitespace-nowrap', statusColors[item.status] || 'bg-gray-400')}>{item.status}</Badge>
                          </TableCell>
                          <TableCell className="py-2 px-4">{item.created_at}</TableCell>
                          <TableCell className="py-2 px-4 text-right">
                           {canModify && (
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
                           )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {/* TODO: Add Pagination Controls */}
                </CardContent>
              </Card>
              {canModify && <QualityControlCompanyForm company={selectedQualityCompany} onClose={() => setQualityDialogOpen(false)} />}
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
                  {canModify && (
                  <DialogTrigger asChild>
                    <Button onClick={handleNewInspector}>
                      <PlusCircle className="mr-2" />
                      Nuevo Registro
                    </Button>
                  </DialogTrigger>
                  )}
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Zona</TableHead>
                        <TableHead>Cert. Inicio</TableHead>
                        <TableHead>Cert. Fin</TableHead>
                        <TableHead>Estatus</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inspectors?.map(item => (
                        <TableRow key={item.id} className="hover:bg-muted/60">
                          <TableCell className="py-2 px-4 font-mono">{item.id}</TableCell>
                          <TableCell className="py-2 px-4 font-medium">{item.name}</TableCell>
                          <TableCell className="py-2 px-4">{item.qualityCompany}</TableCell>
                          <TableCell className="py-2 px-4">{item.zone}</TableCell>
                          <TableCell className="py-2 px-4">{item.certStartDate}</TableCell>
                          <TableCell className="py-2 px-4">{item.certEndDate}</TableCell>
                           <TableCell className="py-2 px-4">
                            <Badge className={cn('whitespace-nowrap', statusColors[item.status] || 'bg-gray-400')}>{item.status}</Badge>
                          </TableCell>
                          <TableCell className="py-2 px-4 text-right">
                           {canModify && (
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
                           )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {/* TODO: Add Pagination Controls */}
                </CardContent>
              </Card>
              {canModify && <InspectorForm inspector={selectedInspector} onClose={() => setInspectorDialogOpen(false)} />}
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
                  {canModify && (
                  <DialogTrigger asChild>
                    <Button onClick={handleNewSector}>
                      <PlusCircle className="mr-2" />
                      Nuevo Registro
                    </Button>
                  </DialogTrigger>
                  )}
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
                        <TableHead>Sub-Asignación</TableHead>
                        <TableHead>Estatus</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sectors?.map(item => (
                        <TableRow key={item.id} className="hover:bg-muted/60">
                          <TableCell className="py-2 px-4 font-mono">{item.id}</TableCell>
                          <TableCell className="py-2 px-4 font-medium">{item.sector}</TableCell>
                          <TableCell className="py-2 px-4">{item.sectorKey}</TableCell>
                          <TableCell className="py-2 px-4">{item.zone}</TableCell>
                          <TableCell className="py-2 px-4">{item.assignment}</TableCell>
                          <TableCell className="py-2 px-4">{item.subAssignment}</TableCell>
                          <TableCell className="py-2 px-4">
                            <Badge className={cn('whitespace-nowrap', statusColors[item.status] || 'bg-gray-400')}>{item.status}</Badge>
                          </TableCell>
                          <TableCell className="py-2 px-4 text-right">
                            {canModify && (
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
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {/* TODO: Add Pagination Controls */}
                </CardContent>
              </Card>
              {canModify && <SectorForm sector={selectedSector} onClose={() => setSectorDialogOpen(false)} />}
            </Dialog>
          </TabsContent>
        </Tabs>
    </div>
  );
}
