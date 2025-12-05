'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UploadCloud, File, X, ChevronLeft, Download, AlertCircle, FileUp, Building, User, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CsvEditor, FieldDefinition } from '@/components/shared/csv-editor';
import { useAppContext } from '@/hooks/use-app-context';
import { CollaboratorCompany, QualityControlCompany, Inspector, Installer, ExpansionManager, Sector, Meter } from '@/lib/mock-data';
import { ROLES, ZONES } from '@/lib/types';
import Papa from 'papaparse';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

type EntityType = 'users' | 'collaborators' | 'quality' | 'inspectors' | 'installers' | 'managers' | 'sectors' | 'meters';

const entityFields: Record<EntityType, FieldDefinition<any>[]> = {
    users: [
        { key: 'name', label: 'Nombre Completo', required: true },
        { key: 'username', label: 'Nombre de Usuario', required: true },
        { key: 'password', label: 'Contraseña', required: true },
        { key: 'role', label: 'Rol', required: true, validation: (val) => Object.values(ROLES).includes(val) || `Rol inválido. Roles válidos: ${Object.values(ROLES).join(', ')}` },
        { key: 'zone', label: 'Zona', required: true, validation: (val) => Object.values(ZONES).includes(val) || 'Zona inválida.' },
        { key: 'status', label: 'Estatus', required: true },
    ],
    collaborators: [
        { key: 'id', label: 'ID', required: true },
        { key: 'name', label: 'Nombre Empresa', required: true },
        { key: 'rfc', label: 'RFC', required: true },
        { key: 'zone', label: 'Zona', required: true },
        { key: 'status', label: 'Estatus', required: true },
        { key: 'created_at', label: 'Fecha Alta', required: true },
    ],
    quality: [
        { key: 'id', label: 'ID', required: true },
        { key: 'name', label: 'Nombre Empresa', required: true },
        { key: 'rfc', label: 'RFC', required: true },
        { key: 'zone', label: 'Zona', required: true },
        { key: 'status', label: 'Estatus', required: true },
        { key: 'created_at', label: 'Fecha Alta', required: true },
    ],
    inspectors: [
        { key: 'id', label: 'ID', required: true },
        { key: 'name', label: 'Nombre', required: true },
        { key: 'position', label: 'Puesto', required: true },
        { key: 'qualityCompany', label: 'Empresa Calidad', required: true },
        { key: 'certStartDate', label: 'Inicio Cert.', required: true },
        { key: 'certEndDate', label: 'Fin Cert.', required: true },
        { key: 'status', label: 'Estatus', required: true },
        { key: 'createdAt', label: 'Fecha Alta', required: true },
        { key: 'zone', label: 'Zona', required: true },
    ],
    installers: [
        { key: 'id', label: 'ID', required: true },
        { key: 'name', label: 'Nombre', required: true },
        { key: 'position', label: 'Puesto', required: true },
        { key: 'collaboratorCompany', label: 'Empresa Colaboradora', required: true },
        { key: 'certStartDate', label: 'Inicio Cert.', required: true },
        { key: 'certEndDate', label: 'Fin Cert.', required: true },
        { key: 'status', label: 'Estatus', required: true },
        { key: 'createdAt', label: 'Fecha Alta', required: true },
        { key: 'zone', label: 'Zona', required: true },
    ],
    managers: [
        { key: 'id', label: 'ID', required: true },
        { key: 'name', label: 'Nombre', required: true },
        { key: 'position', label: 'Puesto', required: true },
        { key: 'zone', label: 'Zona', required: true },
        { key: 'assignment', label: 'Asignación', required: true },
        { key: 'subAssignment', label: 'Sub-Asignación', required: true },
        { key: 'status', label: 'Estatus', required: true },
        { key: 'createdAt', label: 'Fecha Alta', required: true },
    ],
    sectors: [
        { key: 'id', label: 'ID', required: true },
        { key: 'zone', label: 'Zona', required: true },
        { key: 'assignment', label: 'Asignación', required: true },
        { key: 'subAssignment', label: 'Sub-Asignación', required: true },
        { key: 'sector', label: 'Sector', required: true },
        { key: 'sectorKey', label: 'Clave Sector', required: true },
        { key: 'status', label: 'Estatus', required: true },
        { key: 'createdAt', label: 'Fecha Alta', required: true },
    ],
    meters: [
        { key: 'id', label: 'ID', required: true },
        { key: 'marca', label: 'Marca', required: true },
        { key: 'tipo', label: 'Tipo', required: true },
        { key: 'zona', label: 'Zona', required: true },
        { key: 'status', label: 'Estatus', required: true },
    ],
};

const entityInfo = {
    'users': { icon: User, name: 'Usuarios' },
    'collaborators': { icon: Building, name: 'Empresas Colaboradoras' },
    'quality': { icon: Building, name: 'Empresas de Calidad' },
    'inspectors': { icon: User, name: 'Inspectores' },
    'installers': { icon: User, name: 'Instaladores' },
    'managers': { icon: User, name: 'Gestores de Expansión' },
    'sectors': { icon: MapPin, name: 'Sectores' },
    'meters': { icon: MapPin, name: 'Medidores' },
}

export default function EntityUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [entityType, setEntityType] = useState<EntityType>('collaborators');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { addMultipleCollaborators, addMultipleQualityControlCompanies, addMultipleInspectors, addMultipleInstallers, addMultipleExpansionManagers, addMultipleSectors, addMultipleMeters } = useAppContext();

  const handleFileChange = (files: FileList | null) => {
    if (files && files[0]) {
      if (files[0].type === 'text/csv' || files[0].name.endsWith('.csv')) {
        setFile(files[0]);
      } else {
        toast({
          variant: "destructive",
          title: "Archivo no válido",
          description: "Por favor, selecciona un archivo con formato .csv.",
        });
      }
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    handleFileChange(event.dataTransfer.files);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const openEditor = () => {
    if (file) {
      setIsEditorOpen(true);
    }
  };

  const handleFinalUpload = (newRecords: any[]) => {
    setIsUploading(true);
    
    try {
        switch(entityType) {
            case 'collaborators': addMultipleCollaborators(newRecords as CollaboratorCompany[]); break;
            case 'quality': addMultipleQualityControlCompanies(newRecords as QualityControlCompany[]); break;
            case 'inspectors': addMultipleInspectors(newRecords as Inspector[]); break;
            case 'installers': addMultipleInstallers(newRecords as Installer[]); break;
            case 'managers': addMultipleExpansionManagers(newRecords as ExpansionManager[]); break;
            case 'sectors': addMultipleSectors(newRecords as Sector[]); break;
            case 'meters': addMultipleMeters(newRecords as Meter[]); break;
            default: throw new Error('Tipo de entidad no soportada para carga masiva.');
        }

        setIsUploading(false);
        setIsEditorOpen(false);
        setFile(null);
        toast({
            title: "Carga Exitosa",
            description: `Se han cargado y procesado ${newRecords.length} registros de ${entityInfo[entityType].name}.`
        });
    } catch (e: any) {
        setIsUploading(false);
         toast({
            variant: 'destructive',
            title: "Error en la Carga",
            description: e.message || "Ocurrió un problema al procesar los registros."
        });
    }
  }

  const downloadTemplate = () => {
    const fields = entityFields[entityType];
    const headers = fields.map(f => f.label);
    const csv = Papa.unparse([headers]);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `plantilla_${entityType}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const CurrentIcon = entityInfo[entityType].icon;

  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/entities">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="flex items-center gap-3 font-headline text-3xl font-semibold">
          <FileUp className="h-8 w-8 text-primary" />
          Carga Masiva de Entidades
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Cargar Archivo .csv</CardTitle>
          <CardDescription>
            Arrastra y suelta tu archivo CSV aquí o haz clic para seleccionarlo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className='grid md:grid-cols-2 gap-4'>
                 <div className="space-y-2">
                    <Label htmlFor="entity-type">Tipo de Entidad a Cargar</Label>
                    <Select value={entityType} onValueChange={(v) => setEntityType(v as EntityType)}>
                        <SelectTrigger id="entity-type">
                            <SelectValue placeholder="Seleccionar tipo..." />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(entityInfo).filter(([key]) => key !== 'users').map(([key, {name, icon: Icon}]) => (
                                <SelectItem key={key} value={key}>
                                    <div className='flex items-center gap-2'>
                                        <Icon className="h-4 w-4" />
                                        {name}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="flex items-end">
                    <Button variant="secondary" onClick={downloadTemplate} className='w-full'>
                        <Download className="mr-2 h-4 w-4" />
                        Descargar Plantilla
                    </Button>
                </div>
            </div>

          {!file ? (
             <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-muted-foreground/50 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <UploadCloud className="w-12 h-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-semibold">Arrastra y suelta el archivo aquí</p>
              <p className="text-sm text-muted-foreground">o haz clic para buscar en tu equipo</p>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept=".csv"
                onChange={(e) => handleFileChange(e.target.files)}
              />
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-4">
                <File className="w-8 h-8 text-primary" />
                <div>
                  <p className="font-semibold">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setFile(null)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          )}

          <Button onClick={openEditor} disabled={!file} className="w-full">
            Revisar y Cargar Archivo de <CurrentIcon className="inline-block mx-1 h-4 w-4" /> {entityInfo[entityType].name}
          </Button>
        </CardContent>
      </Card>
      
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-7xl h-[90vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>Editor de Carga Masiva - {entityInfo[entityType].name}</DialogTitle>
                <DialogDescription>
                    Verifica, mapea las columnas y ajusta los datos de tu archivo CSV antes de realizar la carga final.
                </DialogDescription>
            </DialogHeader>
            <div className='flex-1 overflow-y-auto min-h-0'>
                {file && <CsvEditor file={file} onUpload={handleFinalUpload} isUploading={isUploading} fields={entityFields[entityType]}/>}
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
