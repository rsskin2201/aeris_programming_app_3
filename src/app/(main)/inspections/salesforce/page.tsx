'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UploadCloud, File, X, Loader2, ChevronLeft, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import Papa from 'papaparse';
import { useAppContext } from '@/hooks/use-app-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { InspectionRecord } from '@/lib/mock-data';
import { format } from 'date-fns';
import { STATUS } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// --- CsvEditor Component ---
const recordFields: (keyof InspectionRecord)[] = [
  'id', 'address', 'client', 'requestDate', 'sector', 'poliza', 'caso', 'type', 'mercado'
];

interface CsvEditorProps {
    file: File;
    onUpload: (records: Omit<InspectionRecord, 'id' | 'createdAt' | 'createdBy' | 'status' | 'inspector' | 'zone'>[]) => void;
    isUploading: boolean;
}

const CsvEditor = ({ file, onUpload, isUploading }: CsvEditorProps) => {
    const [data, setData] = useState<any[][]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [mapping, setMapping] = useState<Record<string, keyof InspectionRecord | ''>>({});
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        Papa.parse(file, {
            complete: (result) => {
                const headerRow = result.data[0] as string[];
                const bodyRows = result.data.slice(1) as any[][];
                setHeaders(headerRow);
                setData(bodyRows);
                // Initialize mapping
                const initialMapping: Record<string, keyof InspectionRecord | ''> = {};
                headerRow.forEach(h => initialMapping[h] = '');
                setMapping(initialMapping);
            },
            error: (err) => {
                setError(`Error al parsear el archivo: ${err.message}`);
            }
        });
    }, [file]);

    const handleMappingChange = (header: string, field: keyof InspectionRecord | '') => {
        setMapping(prev => ({ ...prev, [header]: field }));
    };

    const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
        const newData = [...data];
        newData[rowIndex][colIndex] = value;
        setData(newData);
    };

    const handleProcessUpload = () => {
        const requiredFields: (keyof InspectionRecord)[] = ['address', 'client', 'requestDate'];
        const mappedFields = Object.values(mapping).filter(v => v !== '');

        for (const field of requiredFields) {
            if (!mappedFields.includes(field)) {
                setError(`El campo requerido "${field}" no ha sido mapeado a ninguna columna.`);
                return;
            }
        }
        setError(null);
        
        const newRecords = data.map(row => {
            const record: any = {};
            headers.forEach((header, index) => {
                const mappedField = mapping[header];
                if (mappedField) {
                    record[mappedField] = row[index];
                }
            });
            return record;
        });

        onUpload(newRecords);
    };
    
    if (error) {
        return (
             <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )
    }

    return (
        <div className="flex flex-col h-full gap-4">
            <div className='flex-1 overflow-auto border rounded-lg'>
                <Table className="relative">
                    <TableHeader className="sticky top-0 bg-muted z-10">
                        <TableRow>
                            {headers.map((header, index) => (
                                <TableHead key={index} className='min-w-[200px]'>
                                    <p className="font-bold text-foreground truncate">{header}</p>
                                    <Select 
                                      value={mapping[header] || ''}
                                      onValueChange={(value: keyof InspectionRecord | '') => handleMappingChange(header, value)}
                                    >
                                        <SelectTrigger className="h-8 mt-1">
                                            <SelectValue placeholder="Mapear a..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">No Mapear</SelectItem>
                                            {recordFields.map(field => (
                                                <SelectItem key={field} value={field}>{field}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((row, rowIndex) => (
                            <TableRow key={rowIndex}>
                                {row.map((cell, colIndex) => (
                                    <TableCell key={colIndex}>
                                        <Input 
                                            value={cell || ''}
                                            onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                                            className="h-8 border-none focus-visible:ring-1"
                                        />
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <div className="flex-shrink-0">
                <Button onClick={handleProcessUpload} disabled={isUploading} className='w-full'>
                    {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Cargar {data.length} Registros
                </Button>
            </div>
        </div>
    );
};


export default function SalesforceUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { addRecord, user, zone } = useAppContext();

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

  const generateId = () => `INSP-SF-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const handleFinalUpload = (newRecords: Omit<InspectionRecord, 'id' | 'createdAt' | 'createdBy' | 'status' | 'inspector' | 'zone'>[]) => {
    setIsUploading(true);
    
    // Simulate API call and processing
    setTimeout(() => {
        try {
            newRecords.forEach(rec => {
                const recordToSave: InspectionRecord = {
                    ...rec,
                    id: generateId(),
                    createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
                    createdBy: user?.username || 'desconocido',
                    status: STATUS.REGISTRADA,
                    inspector: 'N/A',
                    zone: zone,
                };
                addRecord(recordToSave);
            });

            setIsUploading(false);
            setIsEditorOpen(false);
            setFile(null);
            toast({
                title: "Carga Exitosa",
                description: `Se han cargado y procesado ${newRecords.length} registros del archivo CSV.`
            });
        } catch (e: any) {
            setIsUploading(false);
             toast({
                variant: 'destructive',
                title: "Error en la Carga",
                description: e.message || "Ocurrió un problema al procesar los registros."
            });
        }
    }, 2000);
  }

  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/inspections">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="font-headline text-3xl font-semibold">Carga Masiva de Salesforce</h1>
      </div>
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
        <DialogContent className="max-w-7xl h-[90vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>Editor de Carga Masiva</DialogTitle>
                <DialogDescription>
                    Verifica, mapea las columnas y ajusta los datos de tu archivo CSV antes de realizar la carga final.
                </DialogDescription>
            </DialogHeader>
            <div className='flex-1 overflow-y-auto min-h-0'>
                {file && <CsvEditor file={file} onUpload={handleFinalUpload} isUploading={isUploading} />}
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
