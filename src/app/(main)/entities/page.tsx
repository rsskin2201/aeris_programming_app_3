'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { collection, doc, query } from 'firebase/firestore';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit,
  Filter,
  MoreHorizontal,
  PlusCircle,
  Settings,
  Trash2,
  Upload,
} from 'lucide-react';
import Papa from 'papaparse';
import { format } from 'date-fns';

import { useCollection, useFirestore } from '@/firebase';
import { useAppContext } from '@/hooks/use-app-context';
import { useToast } from '@/hooks/use-toast';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { PERMISSIONS, ROLES } from '@/lib/types';
import type {
  CollaboratorCompany,
  QualityControlCompany,
  Inspector,
  Installer,
  ExpansionManager,
  Sector,
  Meter,
  User,
  Municipio,
} from '@/lib/types';
import { ZONES, USER_STATUS } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CollaboratorCompanyForm } from '@/components/entities/collaborator-company-form';
import { QualityControlCompanyForm } from '@/components/entities/quality-control-company-form';
import { InspectorForm } from '@/components/entities/inspector-form';
import { InstallerForm } from '@/components/entities/installer-form';
import { ExpansionManagerForm } from '@/components/entities/expansion-manager-form';
import { SectorForm } from '@/components/entities/sector-form';
import { MeterForm } from '@/components/entities/meter-form';
import { MunicipioForm } from '@/components/entities/municipio-form';
import { EntityTable } from '@/components/entities/entity-table';

const entities = [
  {
    name: 'Empresa Colaboradora',
    collection: 'empresas_colaboradoras',
    columns: [
      { accessor: 'id', header: 'ID' },
      { accessor: 'name', header: 'Nombre Empresa' },
      { accessor: 'rfc', header: 'RFC' },
      { accessor: 'codSap', header: 'Cod SAP' },
      { accessor: 'zone', header: 'Zona' },
      { accessor: 'status', header: 'Estatus' },
      { accessor: 'created_at', header: 'Fecha Alta' },
    ],
  },
  {
    name: 'Instalador',
    collection: 'instaladores',
    columns: [
      { accessor: 'id', header: 'ID' },
      { accessor: 'name', header: 'Nombre' },
      { accessor: 'collaboratorCompany', header: 'Empresa' },
      { accessor: 'zone', header: 'Zona' },
      { accessor: 'certStartDate', header: 'Cert. Inicio' },
      { accessor: 'certEndDate', header: 'Cert. Fin' },
      { accessor: 'status', header: 'Estatus' },
    ],
  },
  {
    name: 'Gestor de Expansión',
    collection: 'gestores_expansion',
    columns: [
      { accessor: 'id', header: 'ID' },
      { accessor: 'name', header: 'Nombre' },
      { accessor: 'position', header: 'Puesto' },
      { accessor: 'zone', header: 'Zona' },
      { accessor: 'assignment', header: 'Asignación' },
      { accessor: 'subAssignment', header: 'Sub-Asignación' },
      { accessor: 'status', header: 'Estatus' },
    ],
  },
  {
    name: 'Empresa de Control de Calidad',
    collection: 'empresas_control_calidad',
    columns: [
      { accessor: 'id', header: 'ID' },
      { accessor: 'name', header: 'Nombre Empresa' },
      { accessor: 'rfc', header: 'RFC' },
      { accessor: 'zone', header: 'Zona' },
      { accessor: 'status', header: 'Estatus' },
      { accessor: 'created_at', header: 'Fecha Alta' },
    ],
  },
  {
    name: 'Inspector',
    collection: 'inspectores',
    columns: [
      { accessor: 'id', header: 'ID' },
      { accessor: 'name', header: 'Nombre' },
      { accessor: 'qualityCompany', header: 'Empresa' },
      { accessor: 'zone', header: 'Zona' },
      { accessor: 'certStartDate', header: 'Cert. Inicio' },
      { accessor: 'certEndDate', header: 'Cert. Fin' },
      { accessor: 'status', header: 'Estatus' },
    ],
  },
  {
    name: 'Sectores',
    collection: 'sectores',
    columns: [
      { accessor: 'id', header: 'ID' },
      { accessor: 'sector', header: 'Sector' },
      { accessor: 'sectorKey', header: 'Clave' },
      { accessor: 'zone', header: 'Zona' },
      { accessor: 'assignment', header: 'Asignación' },
      { accessor: 'subAssignment', header: 'Sub-Asignación' },
      { accessor: 'status', header: 'Estatus' },
    ],
  },
  {
    name: 'Municipios',
    collection: 'municipios',
    columns: [
      { accessor: 'id', header: 'ID' },
      { accessor: 'nombre', header: 'Municipio' },
      { accessor: 'sectorId', header: 'Sector' },
      { accessor: 'zona', header: 'Zona' },
      { accessor: 'status', header: 'Estatus' },
    ],
  },
  {
    name: 'Medidores',
    collection: 'medidores',
    columns: [
      { accessor: 'id', header: 'ID' },
      { accessor: 'marca', header: 'Marca' },
      { accessor: 'tipo', header: 'Tipo' },
      { accessor: 'zona', header: 'Zona' },
      { accessor: 'status', header: 'Estatus' },
    ],
  },
];

const initialFilters = {
  name: '',
  role: '',
  zone: '',
  status: '',
};

const canModifyRoles = [ROLES.ADMIN, ROLES.CANALES];
const canUploadRoles = [ROLES.ADMIN, ROLES.CANALES];
const canDeleteRoles = [ROLES.ADMIN];

export default function EntitiesPage() {
  const { user, buildQuery } = useAppContext();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState(entities[0].name);

  const [dialogState, setDialogState] = useState({
    collaborator: false,
    quality: false,
    inspector: false,
    installer: false,
    manager: false,
    sector: false,
    meter: false,
    municipio: false,
    delete: false,
    export: false,
  });

  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [entityToDelete, setEntityToDelete] = useState<{
    id: string;
    name: string;
    collection: string;
  } | null>(null);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState(initialFilters);

  const handleFilterChange = (key: keyof typeof initialFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value === 'all' ? '' : value }));
  };

  const clearFilters = () => setFilters(initialFilters);

  const canModify = user && canModifyRoles.includes(user.role);
  const canUpload = user && canUploadRoles.includes(user.role);
  const canDelete = user && canDeleteRoles.includes(user.role);
  const isAdmin = user?.role === ROLES.ADMIN;

  const collaboratorsQuery = useMemo(
    () =>
      firestore
        ? query(
            collection(firestore, 'empresas_colaboradoras'),
            ...buildQuery('empresas_colaboradoras')
          )
        : null,
    [firestore, buildQuery]
  );
  const installersQuery = useMemo(
    () =>
      firestore
        ? query(
            collection(firestore, 'instaladores'),
            ...buildQuery('instaladores')
          )
        : null,
    [firestore, buildQuery]
  );
  const managersQuery = useMemo(
    () =>
      firestore
        ? query(
            collection(firestore, 'gestores_expansion'),
            ...buildQuery('gestores_expansion')
          )
        : null,
    [firestore, buildQuery]
  );
  const qualityQuery = useMemo(
    () =>
      firestore
        ? query(
            collection(firestore, 'empresas_control_calidad'),
            ...buildQuery('empresas_control_calidad')
          )
        : null,
    [firestore, buildQuery]
  );
  const inspectorsQuery = useMemo(
    () =>
      firestore
        ? query(
            collection(firestore, 'inspectores'),
            ...buildQuery('inspectores')
          )
        : null,
    [firestore, buildQuery]
  );
  const sectorsQuery = useMemo(
    () =>
      firestore
        ? query(collection(firestore, 'sectores'), ...buildQuery('sectores'))
        : null,
    [firestore, buildQuery]
  );
  const metersQuery = useMemo(
    () =>
      firestore
        ? query(collection(firestore, 'medidores'), ...buildQuery('medidores'))
        : null,
    [firestore, buildQuery]
  );
  const municipiosQuery = useMemo(
    () =>
      firestore
        ? query(collection(firestore, 'municipios'), ...buildQuery('municipios'))
        : null,
    [firestore, buildQuery]
  );

  const { data: collaborators } = useCollection<CollaboratorCompany>(
    collaboratorsQuery
  );
  const { data: installers } = useCollection<Installer>(installersQuery);
  const { data: expansionManagers } =
    useCollection<ExpansionManager>(managersQuery);
  const { data: qualityCompanies } =
    useCollection<QualityControlCompany>(qualityQuery);
  const { data: inspectors } = useCollection<Inspector>(inspectorsQuery);
  const { data: sectors } = useCollection<Sector>(sectorsQuery);
  const { data: meters } = useCollection<Meter>(metersQuery);
  const { data: municipios } = useCollection<Municipio>(municipiosQuery);

  const dataMap = {
    'Empresa Colaboradora': collaborators,
    Instalador: installers,
    'Gestor de Expansión': expansionManagers,
    'Empresa de Control de Calidad': qualityCompanies,
    Inspector: inspectors,
    Sectores: sectors,
    Medidores: meters,
    Municipios: municipios,
  };

  const handleOpenDialog = (
    dialog: keyof typeof dialogState,
    entity?: any
  ) => {
    if (entity) setSelectedEntity(entity);
    setDialogState((prev) => ({ ...prev, [dialog]: true }));
  };

  const handleCloseDialog = (dialog: keyof typeof dialogState) => {
    setDialogState((prev) => ({ ...prev, [dialog]: false }));
    setSelectedEntity(null);
  };

  const handleOpenDeleteDialog = (item: any, collectionName: string) => {
    setEntityToDelete({
      id: item.id,
      name: item.name || item.sector || item.nombre,
      collection: collectionName,
    });
    handleOpenDialog('delete');
  };

  const handleConfirmDelete = () => {
    if (!entityToDelete || !firestore) return;
    const { id, collection, name } = entityToDelete;
    const docRef = doc(firestore, collection, id);
    updateDocumentNonBlocking(docRef, { status: 'Deshabilitado' });
    toast({
      variant: 'destructive',
      title: 'Entidad Deshabilitada',
      description: `La entidad "${name}" ha sido marcada como deshabilitada.`,
    });
    handleCloseDialog('delete');
    setEntityToDelete(null);
  };
  
  const filteredData = useMemo(() => {
    const currentData = dataMap[activeTab as keyof typeof dataMap] || [];
    if (Object.values(filters).every((v) => v === '')) return currentData;
    
    return currentData.filter(item => {
      const name = item.name || item.sector || item.marca || item.nombre;
      if (filters.name && !name.toLowerCase().includes(filters.name.toLowerCase())) return false;
      if (filters.role && 'position' in item && item.position !== filters.role) return false;
      if (filters.zone && 'zone' in item && item.zone !== filters.zone) return false;
      if (filters.status && item.status !== filters.status) return false;
      return true;
    });
  }, [activeTab, dataMap, filters]);

  const handleExport = () => {
    const activeEntityConfig = entities.find(e => e.name === activeTab);
    if (!activeEntityConfig) return;
    
    const headers = activeEntityConfig.columns.map(c => c.header);
    const dataToExport = filteredData.map(item =>
      activeEntityConfig.columns.map(col => item[col.accessor as keyof typeof item])
    );
    
    const csv = Papa.unparse({
        fields: headers,
        data: dataToExport
    });
    
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `${activeEntityConfig.collection}_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
        title: "Exportación Completa",
        description: `Se han exportado ${filteredData.length} registros.`
    });
    handleCloseDialog('export');
  }

  const getFormForTab = (tabName: string) => {
    switch (tabName) {
      case 'Empresa Colaboradora':
        return (
          <CollaboratorCompanyForm
            company={selectedEntity}
            onClose={() => handleCloseDialog('collaborator')}
          />
        );
      case 'Instalador':
        return (
          <InstallerForm
            installer={selectedEntity}
            onClose={() => handleCloseDialog('installer')}
          />
        );
      case 'Gestor de Expansión':
        return (
          <ExpansionManagerForm
            manager={selectedEntity}
            onClose={() => handleCloseDialog('manager')}
          />
        );
      case 'Empresa de Control de Calidad':
        return (
          <QualityControlCompanyForm
            company={selectedEntity}
            onClose={() => handleCloseDialog('quality')}
          />
        );
      case 'Inspector':
        return (
          <InspectorForm
            inspector={selectedEntity}
            onClose={() => handleCloseDialog('inspector')}
          />
        );
      case 'Sectores':
        return (
          <SectorForm
            sector={selectedEntity}
            onClose={() => handleCloseDialog('sector')}
          />
        );
      case 'Medidores':
        return (
          <MeterForm
            meter={selectedEntity}
            onClose={() => handleCloseDialog('meter')}
          />
        );
      case 'Municipios':
        return (
          <MunicipioForm
            municipio={selectedEntity}
            onClose={() => handleCloseDialog('municipio')}
          />
        );
      default:
        return null;
    }
  };

  const getDialogStateKey = (tabName: string): keyof typeof dialogState => {
    switch (tabName) {
      case 'Empresa Colaboradora': return 'collaborator';
      case 'Instalador': return 'installer';
      case 'Gestor de Expansión': return 'manager';
      case 'Empresa de Control de Calidad': return 'quality';
      case 'Inspector': return 'inspector';
      case 'Sectores': return 'sector';
      case 'Medidores': return 'meter';
      case 'Municipios': return 'municipio';
      default: throw new Error('Invalid tab name');
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="flex items-center gap-3 font-headline text-3xl font-semibold">
          <Settings className="h-8 w-8 text-primary" />
          Gestión de Entidades
        </h1>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button asChild variant="secondary">
              <Link href="/entities/mass-update">
                <Edit className="mr-2 h-4 w-4" />
                Modificación Masiva
              </Link>
            </Button>
          )}
          {canUpload && (
            <Button asChild>
              <Link href="/entities/upload">
                <Upload className="mr-2 h-4 w-4" />
                Carga Masiva
              </Link>
            </Button>
          )}
        </div>
      </div>
      
      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
        <div className="flex items-center justify-end mb-2">
            <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    {filtersOpen ? 'Ocultar' : 'Mostrar'} Filtros
                </Button>
            </CollapsibleTrigger>
        </div>
        <CollapsibleContent asChild>
             <Card className="p-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                        <Label htmlFor="filter-name">Nombre / Sector / Marca</Label>
                        <Input id="filter-name" placeholder="Buscar por nombre..." value={filters.name} onChange={(e) => handleFilterChange('name', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="filter-zone">Zona</Label>
                        <Select value={filters.zone} onValueChange={(v) => handleFilterChange('zone', v)}>
                            <SelectTrigger id="filter-zone"><SelectValue placeholder="Todas" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas</SelectItem>
                                {Object.values(ZONES).map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="filter-status">Estatus</Label>
                        <Select value={filters.status} onValueChange={(v) => handleFilterChange('status', v)}>
                            <SelectTrigger id="filter-status"><SelectValue placeholder="Todos" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="Activo">Activo / Activa</SelectItem>
                                <SelectItem value="Inactivo">Inactivo / Inactiva</SelectItem>
                                <SelectItem value="Deshabilitado">Deshabilitado / Deshabilitada</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-end">
                        <Button variant="ghost" className="w-full" onClick={clearFilters}>Limpiar Filtros</Button>
                    </div>
                </div>
            </Card>
        </CollapsibleContent>
    </Collapsible>


      <Dialog open={dialogState[getDialogStateKey(activeTab)]} onOpenChange={(isOpen) => !isOpen && handleCloseDialog(getDialogStateKey(activeTab))}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-auto flex-wrap justify-start bg-transparent p-0">
            {entities.map((entity) => (
              <TabsTrigger
                key={entity.name}
                value={entity.name}
                className="transition-all duration-300 data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-md hover:bg-primary/5 hover:border-primary/50 border-b-2 border-transparent"
              >
                {entity.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {entities.map((entity) => (
            <TabsContent key={entity.name} value={entity.name}>
              <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle>Listado de: {entity.name}</CardTitle>
                    <CardDescription>
                      Gestiona las entidades de este tipo.
                    </CardDescription>
                  </div>
                  <div className='flex items-center gap-2'>
                    <DialogTrigger asChild>
                      <Button variant="outline" onClick={() => handleOpenDialog('export')}>
                        <Download className="mr-2" />
                        Exportar .csv
                      </Button>
                    </DialogTrigger>
                    {canModify && (
                       <DialogTrigger asChild>
                          <Button onClick={() => handleOpenDialog(getDialogStateKey(entity.name))}>
                              <PlusCircle className="mr-2" />
                              Nuevo Registro
                          </Button>
                      </DialogTrigger>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <EntityTable 
                    data={filteredData}
                    columns={entity.columns}
                    canModify={canModify}
                    canDelete={canDelete}
                    onEdit={(item) => handleOpenDialog(getDialogStateKey(entity.name), item)}
                    onDelete={(item) => handleOpenDeleteDialog(item, entity.collection)}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
        {getFormForTab(activeTab)}
      </Dialog>
      
      <Dialog open={dialogState.delete} onOpenChange={() => handleCloseDialog('delete')}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="text-destructive"/>
                    Confirmar Acción
                </DialogTitle>
                <DialogDescription>
                    ¿Estás seguro de que quieres deshabilitar la entidad <strong className="text-foreground">{entityToDelete?.name}</strong>?
                    Esta acción cambiará su estatus a "Deshabilitado" y no podrá ser seleccionado en el futuro.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="ghost">Cancelar</Button>
                </DialogClose>
                <Button variant="destructive" onClick={handleConfirmDelete}>Sí, Deshabilitar</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogState.export} onOpenChange={() => handleCloseDialog('export')}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Confirmar Exportación</DialogTitle>
                <DialogDescription>
                    Se exportarán <strong>{filteredData.length}</strong> registros de <strong>{activeTab}</strong> a un archivo CSV. ¿Deseas continuar?
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <DialogClose asChild><Button variant="ghost">Cancelar</Button></DialogClose>
                <Button className="bg-green-600 hover:bg-green-700" onClick={handleExport}>Confirmar y Exportar</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
