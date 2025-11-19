'use client';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UploadCloud, File, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';

// This is a placeholder for the future CSV editor component.
const CsvEditorPlaceholder = () => (
  <div className="border-dashed border-2 border-muted-foreground/50 rounded-lg p-8 text-center bg-muted/20">
    <p className="font-semibold">Visor/Editor de CSV</p>
    <p className="text-sm text-muted-foreground">Aquí se mostrará el contenido del archivo y las herramientas para mapear columnas y editar datos antes de la carga.</p>
  </div>
);

export default function SalesforceUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

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

  const handleFinalUpload = () => {
    setIsUploading(true);
    // Simulate API call for uploading and processing
    setTimeout(() => {
        setIsUploading(false);
        setIsEditorOpen(false);
        setFile(null);
        toast({
            title: "Carga Exitosa",
            description: "Los registros del archivo CSV se han cargado y están siendo procesados."
        })
    }, 2000);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-headline text-3xl font-semibold">Carga Masiva de Salesforce</h1>
      <Card>
        <CardHeader>
          <CardTitle>Cargar Archivo .csv</CardTitle>
          <CardDescription>
            Arrastra y suelta tu archivo CSV aquí o haz clic para seleccionarlo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>Editor de Carga Masiva</DialogTitle>
                <DialogDescription>
                    Verifica y ajusta los datos de tu archivo CSV antes de realizar la carga final.
                </DialogDescription>
            </DialogHeader>
            <div className='flex-1 overflow-y-auto'>
                <CsvEditorPlaceholder />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditorOpen(false)} disabled={isUploading}>
                    Cancelar
                </Button>
                <Button onClick={handleFinalUpload} disabled={isUploading}>
                     {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Cargar Registros
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
