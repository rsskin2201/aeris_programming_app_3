'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Edit, AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/hooks/use-app-context';
import { ROLES, ZONES } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { collection, doc, getDocs, query, updateDoc, writeBatch } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

type EntityType = 'empresas_colaboradoras' | 'instaladores' | 'gestores_expansion' | 'empresas_control_calidad' | 'inspectores' | 'sectores' | 'medidores';

const entityOptions: { label: string, value: EntityType }[] = [
  { label: "Empresa Colaboradora", value: 'empresas_colaboradoras' },
  { label: "Instalador", value: 'instaladores' },
  { label: "Gestor de Expansión", value: 'gestores_expansion' },
  { label: "Empresa de Control de Calidad", value: 'empresas_control_calidad' },
  { label: "Inspector", value: 'inspectores' },
  { label: "Sectores", value: 'sectores' },
  { label: "Medidores", value: 'medidores' },
];

const entityFields: Record<EntityType, { label: string, value: string, type: 'text' | 'select', options?: readonly string[] }[]> = {
  empresas_colaboradoras: [
    { label: 'Zona', value: 'zone', type: 'select', options: ZONES },
    { label: 'Estatus', value: 'status', type: 'select', options: ['Activa', 'Inactiva', 'Deshabilitada'] },
  ],
  instaladores: [
    { label: 'Zona', value: 'zone', type: 'select', options: ZONES },
    { label: 'Estatus', value: 'status', type: 'select', options: ['Activo', 'Inactivo', 'Deshabilitado'] },
  ],
  gestores_expansion: [
    { label: 'Zona', value: 'zone', type: 'select', options: ZONES },
    { label: 'Estatus', value: 'status', type: 'select', options: ['Activo', 'Inactivo', 'Deshabilitado'] },
  ],
  empresas_control_calidad: [
    { label: 'Zona', value: 'zone', type: 'select', options: ZONES },
    { label: 'Estatus', value: 'status', type: 'select', options: ['Activa', 'Inactiva', 'Deshabilitada'] },
  ],
  inspectores: [
    { label: 'Zona', value: 'zone', type: 'select', options: ZONES },
    { label: 'Estatus', value: 'status', type: 'select', options: ['Activo', 'Inactivo', 'Deshabilitado'] },
  ],
  sectores: [
    { label: 'Zona', value: 'zone', type: 'select', options: ZONES },
    { label: 'Estatus', value: 'status', type: 'select', options: ['Activo', 'Inactivo', 'Deshabilitado'] },
  ],
  medidores: [
    { label: 'Zona', value: 'zona', type: 'select', options: ZONES },
    { label: 'Estatus', value: 'status', type: 'select', options: ['Activo', 'Inactivo'] },
  ],
};


export default function MassUpdatePage() {
  const { user } = useAppContext();
  const { toast } = useToast();
  const firestore = useFirestore();

  const [entityType, setEntityType] = useState<EntityType | null>(null);
  const [fieldToUpdate, setFieldToUpdate] = useState<string>('');
  const [newValue, setNewValue] = useState<string>('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [countToUpdate, setCountToUpdate] = useState(0);

  const isAdmin = user?.role === ROLES.ADMIN;

  const handleEntityTypeChange = (value: string) => {
    setEntityType(value as EntityType);
    setFieldToUpdate('');
    setNewValue('');
  };

  const handleFieldChange = (value: string) => {
    setFieldToUpdate(value);
    setNewValue('');
  };

  const selectedField = useMemo(() => {
    if (!entityType || !fieldToUpdate) return null;
    return entityFields[entityType].find(f => f.value === fieldToUpdate);
  }, [entityType, fieldToUpdate]);

  const handlePrepareUpdate = async () => {
    if (!firestore || !entityType || !fieldToUpdate || !newValue) {
      toast({
        variant: 'destructive',
        title: 'Campos incompletos',
        description: 'Por favor, selecciona una entidad, un campo y un nuevo valor.',
      });
      return;
    }
    
    // For simplicity, we'll update all documents in the collection.
    // A more advanced version could include filters.
    const collectionRef = collection(firestore, entityType);
    const q = query(collectionRef); // No filters for now
    
    try {
        const querySnapshot = await getDocs(q);
        setCountToUpdate(querySnapshot.size);
        if (querySnapshot.size > 0) {
            setIsConfirming(true);
        } else {
            toast({
                title: 'No hay registros',
                description: 'No se encontraron registros para actualizar en la entidad seleccionada.',
            });
        }
    } catch (error) {
        console.error("Error counting documents for update: ", error);
        toast({ variant: 'destructive', title: 'Error de consulta', description: 'No se pudo contar los documentos a actualizar.' });
    }
  };
  
  const handleConfirmUpdate = async () => {
    if (!firestore || !entityType || !fieldToUpdate || !newValue) return;

    setIsUpdating(true);
    
    const collectionRef = collection(firestore, entityType);
    const q = query(collectionRef); // Again, no filters for now
    
    try {
        const querySnapshot = await getDocs(q);
        const batch = writeBatch(firestore);
        
        querySnapshot.forEach((doc) => {
            batch.update(doc.ref, { [fieldToUpdate]: newValue });
        });
        
        await batch.commit();
        
        toast({
            title: 'Actualización Masiva Exitosa',
            description: `${countToUpdate} registros de "${entityOptions.find(e => e.value === entityType)?.label}" han sido actualizados.`
        });

    } catch (error) {
        console.error("Error performing mass update: ", error);
        toast({ variant: 'destructive', title: 'Error en la Actualización', description: 'Ocurrió un problema al actualizar los registros.' });
    } finally {
        setIsUpdating(false);
        setIsConfirming(false);
    }
  };

  if (!isAdmin) {
    return (
        <div className="flex items-center justify-center h-full">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive"/>Acceso Denegado</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Esta funcionalidad está restringida a los administradores.</p>
                </CardContent>
                <CardFooter>
                    <Button asChild className='w-full'><Link href="/entities">Volver a Entidades</Link></Button>
                </CardFooter>
            </Card>
        </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/entities">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="flex items-center gap-3 font-headline text-3xl font-semibold">
          <Edit className="h-8 w-8 text-primary" />
          Modificación Masiva de Entidades
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Paso 1: Seleccionar Entidad y Campo</CardTitle>
          <CardDescription>
            Elige qué entidad y qué campo específico deseas actualizar en bloque.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className='grid md:grid-cols-2 gap-4'>
            <div className="space-y-2">
              <Label htmlFor="entity-type">Tipo de Entidad</Label>
              <Select onValueChange={handleEntityTypeChange}>
                <SelectTrigger id="entity-type">
                  <SelectValue placeholder="Seleccionar entidad..." />
                </SelectTrigger>
                <SelectContent>
                  {entityOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {entityType && (
              <div className="space-y-2">
                <Label htmlFor="field-to-update">Campo a Modificar</Label>
                <Select value={fieldToUpdate} onValueChange={handleFieldChange}>
                  <SelectTrigger id="field-to-update">
                    <SelectValue placeholder="Seleccionar campo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {entityFields[entityType].map(field => (
                      <SelectItem key={field.value} value={field.value}>
                        {field.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {selectedField && (
        <Card>
            <CardHeader>
                <CardTitle>Paso 2: Definir el Nuevo Valor</CardTitle>
                <CardDescription>
                    Establece el valor que se aplicará a todas las entidades seleccionadas.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 {selectedField.type === 'select' ? (
                     <div className="space-y-2">
                        <Label htmlFor="new-value">Nuevo Valor para "{selectedField.label}"</Label>
                        <Select value={newValue} onValueChange={setNewValue}>
                            <SelectTrigger id="new-value">
                                <SelectValue placeholder={`Seleccionar nuevo ${selectedField.label}...`} />
                            </SelectTrigger>
                            <SelectContent>
                                {selectedField.options?.map(opt => (
                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <Label htmlFor="new-value-text">Nuevo Valor para "{selectedField.label}"</Label>
                        <Input 
                            id="new-value-text"
                            value={newValue}
                            onChange={(e) => setNewValue(e.target.value)}
                        />
                    </div>
                )}
            </CardContent>
        </Card>
      )}

      {entityType && fieldToUpdate && newValue && (
        <div className="flex justify-end">
            <Button onClick={handlePrepareUpdate} disabled={isUpdating}>
                Revisar y Ejecutar Actualización
            </Button>
        </div>
      )}

      <Dialog open={isConfirming} onOpenChange={setIsConfirming}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive"/>Confirmar Modificación Masiva</DialogTitle>
                <DialogDescription>
                    Estás a punto de realizar una acción irreversible. Por favor, confirma los detalles.
                </DialogDescription>
            </DialogHeader>
            <div className='py-4 space-y-3'>
                <p><strong>Entidad a modificar:</strong> {entityOptions.find(e => e.value === entityType)?.label}</p>
                <p><strong>Campo a modificar:</strong> {entityFields[entityType as EntityType]?.find(f => f.value === fieldToUpdate)?.label}</p>
                <p><strong>Nuevo valor:</strong> {newValue}</p>
                <p><strong>Número de registros afectados:</strong> {countToUpdate}</p>
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setIsConfirming(false)} disabled={isUpdating}>Cancelar</Button>
                <Button variant="destructive" onClick={handleConfirmUpdate} disabled={isUpdating}>
                    {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Sí, Actualizar {countToUpdate} Registros
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
