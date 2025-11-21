'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UploadCloud, File, X, ChevronLeft, Download, FileUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CsvEditor, FieldDefinition } from '@/components/shared/csv-editor';
import { useAppContext } from '@/hooks/use-app-context';
import { User, ROLES, ZONES } from '@/lib/types';
import Papa from 'papaparse';

const userFields: FieldDefinition<User>[] = [
    { key: 'name', label: 'Nombre Completo', required: true },
    { key: 'username', label: 'Nombre de Usuario', required: true },
    { key: 'password', label: 'Contraseña', required: true },
    { key: 'role', label: 'Rol', required: true, validation: (val) => Object.values(ROLES).includes(val as any) || `Rol inválido. Válidos: Administrador, Gestor...` },
    { key: 'zone', label: 'Zona', required: true, validation: (val) => Object.values(ZONES).includes(val as any) || 'Zona inválida.' },
    { key: 'status', label: 'Estatus', required: true },
];

export default function UserUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { addMultipleUsers } = useAppContext();

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

  const handleFinalUpload = (newRecords: User[]) => {
    setIsUploading(true);
    
    setTimeout(() => {
        try {
            addMultipleUsers(newRecords);

            setIsUploading(false);
            setIsEditorOpen(false);
            setFile(null);
            toast({
                title: "Carga Exitosa",
                description: `Se han cargado y procesado ${newRecords.length} nuevos usuarios.`
            });
        } catch (e: any) {
            setIsUploading(false);
             toast({
                variant: 'destructive',
                title: "Error en la Carga",
                description: e.message || "Ocurrió un problema al procesar los registros."
            });
        }
    }, 1500);
  }

  const downloadTemplate = () => {
    const headers = userFields.map(f => f.label);
    const csv = Papa.unparse([headers]);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "plantilla_usuarios.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/users">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="flex items-center gap-3 font-headline text-3xl font-semibold">
          <FileUp className="h-8 w-8 text-primary" />
          Carga Masiva de Usuarios
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Cargar Archivo .csv</CardTitle>
          <CardDescription>
            Arrastra y suelta tu archivo CSV aquí o haz clic para seleccionarlo. Puedes descargar una plantilla para asegurar el formato correcto.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className='flex justify-end'>
                <Button variant="secondary" onClick={downloadTemplate}>
                    <Download className="mr-2 h-4 w-4" />
                    Descargar Plantilla
                </Button>
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
            Revisar y Cargar Archivo
          </Button>
        </CardContent>
      </Card>
      
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-7xl h-[90vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>Editor de Carga Masiva - Usuarios</DialogTitle>
                <DialogDescription>
                    Verifica, mapea las columnas y ajusta los datos de tu archivo CSV antes de realizar la carga final.
                </DialogDescription>
            </DialogHeader>
            <div className='flex-1 overflow-y-auto min-h-0'>
                {file && <CsvEditor file={file} onUpload={handleFinalUpload} isUploading={isUploading} fields={userFields} />}
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
