'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { AlertCircle, Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '../ui/dialog';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export interface FieldDefinition<T> {
    key: keyof T;
    label: string;
    required?: boolean;
    validation?: (value: any) => boolean | string;
}

interface CsvEditorProps<T> {
    file: File;
    onUpload: (records: T[]) => void;
    isUploading: boolean;
    fields: FieldDefinition<T>[];
}

export const CsvEditor = <T extends object>({ file, onUpload, isUploading, fields }: CsvEditorProps<T>) => {
    const [data, setData] = useState<any[][]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [mapping, setMapping] = useState<Record<string, keyof T | '' | 'no-map'>>({});
    const [errors, setErrors] = useState<Record<string, string | null>[]>([]);
    const [globalError, setGlobalError] = useState<string | null>(null);
    const [isConfirming, setIsConfirming] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        Papa.parse(file, {
            skipEmptyLines: true,
            complete: (result) => {
                const headerRow = result.data[0] as string[];
                const bodyRows = result.data.slice(1) as any[][];
                setHeaders(headerRow);
                setData(bodyRows);

                const initialMapping: Record<string, keyof T | ''> = {};
                headerRow.forEach(h => {
                    const foundField = fields.find(f => f.label.toLowerCase() === h.toLowerCase().trim() || String(f.key).toLowerCase() === h.toLowerCase().trim());
                    initialMapping[h] = foundField ? foundField.key : '';
                });
                setMapping(initialMapping);
            },
            error: (err) => {
                setGlobalError(`Error al parsear el archivo: ${err.message}`);
            }
        });
    }, [file, fields]);

    const validateData = () => {
        const newErrors: Record<string, string | null>[] = [];
        let isValid = true;
        
        const mappedFields = Object.values(mapping).filter(v => v && v !== 'no-map') as (keyof T)[];
        for (const field of fields) {
            if (field.required && !mappedFields.includes(field.key)) {
                setGlobalError(`El campo requerido "${field.label}" no ha sido mapeado a ninguna columna.`);
                isValid = false;
            }
        }

        if(!isValid) return false;
        setGlobalError(null);

        data.forEach((row, rowIndex) => {
            const rowErrors: Record<string, string | null> = {};
            let rowHasError = false;
            
            headers.forEach((header, colIndex) => {
                const mappedKey = mapping[header];
                if (mappedKey && mappedKey !== 'no-map') {
                    const fieldDef = fields.find(f => f.key === mappedKey);
                    const value = row[colIndex];

                    if (fieldDef?.required && (value === undefined || value === null || value === '')) {
                        rowErrors[header] = 'Campo requerido.';
                        rowHasError = true;
                    } else if (value && fieldDef?.validation) {
                        const validationResult = fieldDef.validation(value);
                        if (typeof validationResult === 'string') {
                            rowErrors[header] = validationResult;
                            rowHasError = true;
                        } else {
                            rowErrors[header] = null;
                        }
                    } else {
                        rowErrors[header] = null;
                    }
                }
            });
            newErrors.push(rowErrors);
            if (rowHasError) isValid = false;
        });

        setErrors(newErrors);
        return isValid;
    };
    
    useEffect(() => {
        if (data.length > 0) {
            validateData();
        }
    }, [mapping, data]);


    const handleMappingChange = (header: string, fieldKey: keyof T | '' | 'no-map') => {
        setMapping(prev => ({ ...prev, [header]: fieldKey }));
    };

    const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
        const newData = [...data];
        newData[rowIndex][colIndex] = value;
        setData(newData);
    };

    const handleProcessUpload = () => {
       if (validateData()) {
            setIsConfirming(true);
       } else {
           setGlobalError('Hay errores en los datos. Por favor, corríjalos antes de continuar.');
           toast({
               variant: 'destructive',
               title: 'Errores de Validación',
               description: 'No se puede cargar el archivo porque contiene errores. Por favor, corríjalos.',
           });
       }
    };

    const hasErrors = useMemo(() => errors.some(row => Object.values(row).some(err => err !== null)), [errors]);

    const handleConfirmUpload = () => {
        if(hasErrors) {
            setGlobalError('No se puede cargar el archivo porque contiene errores. Por favor, corríjalos.');
            setIsConfirming(false);
            return;
        }

        const newRecords = data.map(row => {
            const record: Partial<T> = {};
            headers.forEach((header, index) => {
                const mappedField = mapping[header];
                if (mappedField && mappedField !== 'no-map') {
                    record[mappedField] = row[index];
                }
            });
            return record;
        });
        onUpload(newRecords as T[]);
        setIsConfirming(false);
    }
    
    if (globalError && !hasErrors) { // Only show global structural errors if there are no data errors
        return (
             <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{globalError}</AlertDescription>
            </Alert>
        )
    }

    return (
        <>
            <ScrollArea className="flex-1 overflow-auto border rounded-lg">
                <div className="relative w-full">
                    <Table className="relative">
                        <TableHeader className="sticky top-0 bg-muted z-10">
                            <TableRow>
                                {headers.map((header, index) => (
                                    <TableHead key={index} className='min-w-[250px] align-top'>
                                        <p className="font-bold text-foreground truncate">{header}</p>
                                        <Select 
                                          value={String(mapping[header] || '')}
                                          onValueChange={(value) => handleMappingChange(header, value as keyof T | '' | 'no-map')}
                                        >
                                            <SelectTrigger className="h-8 mt-1">
                                                <SelectValue placeholder="Mapear a..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="no-map">No Mapear</SelectItem>
                                                {fields.map(field => (
                                                    <SelectItem key={String(field.key)} value={String(field.key)}>{field.label}</SelectItem>
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
                                    {row.map((cell, colIndex) => {
                                        const error = errors[rowIndex]?.[headers[colIndex]];
                                        return (
                                            <TableCell key={colIndex}>
                                                <Input 
                                                    value={cell || ''}
                                                    onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                                                    className={cn(error ? 'border-destructive focus-visible:ring-destructive' : 'focus-visible:ring-ring')}
                                                />
                                                {error && <p className="text-xs text-destructive mt-1">{error}</p>}
                                            </TableCell>
                                        )
                                    })}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
            <div className="flex-shrink-0 pt-4 space-y-2">
                 {globalError && hasErrors && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Errores de Validación</AlertTitle>
                        <AlertDescription>{globalError}</AlertDescription>
                    </Alert>
                )}
                <Button onClick={handleProcessUpload} disabled={isUploading || hasErrors} className='w-full'>
                    {hasErrors ? 'Corrija los errores para continuar' : `Cargar ${data.length} Registros`}
                </Button>
            </div>
            <Dialog open={isConfirming} onOpenChange={setIsConfirming}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar Carga Masiva</DialogTitle>
                        <DialogDescription>
                            Estás a punto de cargar <strong>{data.length}</strong> nuevos registros. Esta acción no se puede deshacer.
                            ¿Estás seguro de que quieres continuar?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="ghost">Cancelar</Button></DialogClose>
                        <Button onClick={handleConfirmUpload} disabled={isUploading}>
                             {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirmar y Cargar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};
