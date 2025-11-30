'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UploadCloud, File, X, ChevronLeft, FileUp, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import Papa from 'papaparse';
import { useAppContext } from '@/hooks/use-app-context';
import { InspectionRecord } from '@/lib/mock-data';
import { ROLES, STATUS } from '@/lib/types';
import { CsvEditor, FieldDefinition } from '@/components/shared/csv-editor';
import { MERCADO } from '@/lib/form-options';
import { isValid, parse } from 'date-fns';

const recordFields: FieldDefinition<InspectionRecord>[] = [
    { key: 'poliza', label: 'POLIZA' },
    { key: 'caso', label: 'CASO [AT]' },
    { key: 'municipality', label: 'MUNICIPIO' },
    { key: 'colonia', label: 'COLONIA' },
    { key: 'calle', label: 'CALLE' },
    { key: 'numero', label: 'NUMERO' },
    { key: 'portal', label: 'PORTAL' },
    { key: 'escalera', label: 'ESCALERA' },
    { key: 'piso', label: 'PISO' },
    { key: 'puerta', label: 'PUERTA' },
    { key: 'tipoInspeccion', label: 'TIPO DE INSPECCION' },
    { key: 'tipoProgramacion', label: 'TIPO DE PROGRAMACION' },
    { key: 'tipoMdd', label: 'TIPO MDD' },
    { 
      key: 'mercado', 
      label: 'MERCADO', 
      required: true, 
      validation: (val) => Object.values(MERCADO).includes(val) || `Mercado inválido. Válidos: ${Object.values(MERCADO).join(', ')}`
    },
    { key: 'oferta', label: 'OFERTA/CAMPAÑA' },
    { key: 'collaboratorCompany', label: 'EMPRESA COLABORADORA', required: true },
    { 
      key: 'requestDate', 
      label: 'FECHA PROGRAMACION', 
      required: true,
      validation: (val) => isValid(parse(val, 'yyyy-MM-dd', new Date())) || 'Formato de fecha debe ser AAAA-MM-DD.'
    },
    { key: 'horarioProgramacion', label: 'HORARIO PROGRAMACION' },
    { key: 'instalador', label: 'INSTALADOR' },
    { key: 'gestor', label: 'GESTOR', required: true },
    { key: 'grupoMercado', label: 'GRUPO DE MERCADO' },
    { key: 'semana', label: 'SEMANA' },
    { key: 'inspector', label: 'INSPECTOR' },
    { 
      key: 'status', 
      label: 'STATUS', 
      required: true,
      validation: (val) => Object.values(STATUS).includes(val) || 'Estatus inválido.'
    },
    { key: 'serieMdd', label: 'SERIE MDD' },
    { key: 'marcaMdd', label: 'MARCA MDD' },
    { key: 'tipoMddCampo', label: 'TIPO MDD CAMPO' },
    { key: 'presion', label: 'PRESION DE TRABAJO (kg/cm2)' },
    { key: 'folioIt', label: 'FOLIO IT' },
    { key: 'precinto', label: 'PRECINTO' },
    { key: 'epp', label: 'EPP' },
    { key: 'controlPrevio', label: 'CONTROL PREVIO' },
    { key: 'mtsInstalados', label: 'MTS INSTALADOS' },
    { key: 'materialTuberia', label: 'MATERIAL DE TUBERIA' },
    { key: 'folioChecklist', label: 'FOLIO CHECK LIST' },
    { key: 'defectosCorregidos', label: 'DEFECTOS CORREGIDOS' },
    { key: 'defectosNoCorregidos', label: 'DEFECTOS NO CORREGIDOS' },
    { key: 'horaEntrada', label: 'HRA ENTRADA' },
    { key: 'horaSalida', label: 'HRA SALIDA' },
    { key: 'ventilaPreexistente', label: 'VENTILA PREEXISTENTE' },
    { key: 'ventilacionEcc', label: 'VENTILACION ECC' },
    { key: 'aparatosConectados', label: 'APARATOS CONECTADOS' },
    { key: 'equipo_1', label: 'EQUIPO_1' },
    { key: 'marca_eq1', label: 'MARCA_EQ1' },
    { key: 'coCor_eq1', label: 'CO COR (PPM)_EQ1' },
    { key: 'coAmb_eq1', label: 'CO AMB (PPM)_EQ1' },
    { key: 'equipo_2', label: 'EQUIPO_2' },
    { key: 'marca_eq2', label: 'MARCA_EQ2' },
    { key: 'coCor_eq2', label: 'CO COR (PPM)_EQ2' },
    { key: 'coAmb_eq2', label: 'CO AMB (PPM)_EQ2' },
    { key: 'equipo_3', label: 'EQUIPO_3' },
    { key: 'marca_eq3', label: 'MARCA_EQ3' },
    { key: 'coCor_eq3', label: 'CO COR (PPM)_EQ3' },
    { key: 'coAmb_eq3', label: 'CO AMB (PPM)_EQ3' },
    { key: 'equipo_4', label: 'EQUIPO_4' },
    { key: 'marca_eq4', label: 'MARCA_EQ4' },
    { key: 'coCor_eq4', label: 'CO COR (PPM)_EQ4' },
    { key: 'coAmb_eq4', label: 'CO AMB (PPM)_EQ4' },
    { key: 'equipo_5', label: 'EQUIPO_5' },
    { key: 'marca_eq5', label: 'MARCA_EQ5' },
    { key: 'coCor_eq5', label: 'CO COR (PPM)_EQ5' },
    { key: 'coAmb_eq5', label: 'CO AMB (PPM)_EQ5' },
    { key: 'nombreCliente', label: 'NOMBRE DEL CLIENTE' },
    { key: 'telCliente', label: 'TEL. CLIENTE' },
    { key: 'motivoCancelacion', label: 'MOTIVO CANCELACION / NO APROBACION' },
    { key: 'comentariosOca', label: 'COMENTARIOS OCA' },
    { key: 'formaDePago', label: 'FORMA DE PAGO' },
    { key: 'equipoExtra', label: 'EQUIPO EXTRA' },
    { key: 'capturista', label: 'CAPTURISTA' },
    { key: 'hraDeAudio', label: 'HRA DE AUDIO' },
    { key: 'infFormasPago', label: 'INF FORMAS PAGO' },
    { key: 'altaSms', label: 'ALTA DE SMS' },
    { key: 'appNaturgy', label: 'APP NATURGY' },
    { key: 'entregaGuia', label: 'ENTREGA DE GUIA' },
    { key: 'fechaConexion', label: 'FECHA CONEXION' },
    { key: 'datosConfirmados', label: 'DATOS CONFIRMADOS' },
    { key: 'observacionesSoporte', label: 'OBSERVACIONES SOPORTE' },
    { key: 'tipoRechazo', label: 'TIPO RECHAZO' },
    { key: 'motivoRechazo', label: 'MOTIVO RECHAZO' },
    { key: 'observaciones', label: 'Observaciones' },
];


export default function SalesforceUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { addMultipleRecords, user, zone, users: allUsers, addNotification } = useAppContext();

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

  const handleFinalUpload = (newRecords: Partial<InspectionRecord>[]) => {
    setIsUploading(true);
    
    setTimeout(() => {
        try {
            const recordsToSave = newRecords.map(rec => {
                const fullAddress = [rec.calle, rec.numero, rec.colonia].filter(Boolean).join(', ');
                return {
                    ...rec,
                    id: `SF-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                    type: rec.tipoInspeccion || 'Masiva Salesforce',
                    client: rec.nombreCliente || 'Cliente por definir',
                    address: fullAddress,
                    createdAt: new Date().toISOString(),
                    createdBy: rec.capturista || user?.username || 'desconocido',
                    status: rec.status || STATUS.REGISTRADA,
                    zone: rec.zone || zone,
                } as InspectionRecord;
            });

            addMultipleRecords(recordsToSave);

            const usersToNotify = allUsers.filter(u => 
                (u.role === ROLES.COORDINADOR_SSPP || u.role === ROLES.CALIDAD) &&
                (u.zone === zone || u.zone === 'Todas las zonas')
            );
            
            usersToNotify.forEach(notifiedUser => {
                addNotification({
                    recipientUsername: notifiedUser.username,
                    message: `Se han cargado ${newRecords.length} registros masivos en la zona ${zone}.`,
                });
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

  const downloadTemplate = () => {
    const headers = recordFields.map(f => f.label);
    const csv = Papa.unparse([headers]);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "plantilla_registros.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }


  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/inspections">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="flex items-center gap-3 font-headline text-3xl font-semibold">
          <FileUp className="h-8 w-8 text-primary" />
          Carga Masiva de Registros
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Cargar Archivo .csv</CardTitle>
          <CardDescription>
            Arrastra y suelta tu archivo CSV o haz clic para seleccionarlo. Puedes descargar una plantilla para asegurar el formato correcto.
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
                <DialogTitle>Editor de Carga Masiva de Registros</DialogTitle>
                <DialogDescription>
                    Verifica, mapea las columnas y ajusta los datos de tu archivo CSV antes de realizar la carga final.
                </DialogDescription>
            </DialogHeader>
            <div className='flex-1 overflow-y-auto min-h-0'>
                {file && <CsvEditor file={file} onUpload={handleFinalUpload} isUploading={isUploading} fields={recordFields} />}
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
