'use client';

import React from 'react';
import { useMemo } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, User, Clock, Edit } from 'lucide-react';
import { type ChangeHistory } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '../ui/badge';

interface ChangeHistoryViewerProps {
  inspectionId: string;
}

export function ChangeHistoryViewer({ inspectionId }: ChangeHistoryViewerProps) {
  const firestore = useFirestore();
  
  const historyQuery = useMemo(() => {
    if (!firestore || !inspectionId) return null;
    return query(collection(firestore, `inspections/${inspectionId}/history`), orderBy('timestamp', 'desc'));
  }, [firestore, inspectionId]);

  const { data: history, isLoading } = useCollection<ChangeHistory>(historyQuery);

  return (
    <DialogContent className="max-w-2xl h-[70vh] flex flex-col">
      <DialogHeader>
        <DialogTitle>Historial de Cambios</DialogTitle>
        <DialogDescription>
          Registro de todas las modificaciones realizadas a la inspección <span className='font-mono text-xs bg-muted p-1 rounded-sm'>{inspectionId}</span>.
        </DialogDescription>
      </DialogHeader>
      <ScrollArea className="flex-1 -mx-6 px-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : history && history.length > 0 ? (
          <div className="relative pl-6">
            <div className="absolute left-0 top-0 h-full w-px bg-border" />
            {history.map((entry, index) => (
              <div key={entry.id} className="relative mb-8 pl-8">
                <div className="absolute left-[-13px] top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <User className="h-3.5 w-3.5" />
                </div>
                <div className='p-4 rounded-md border bg-card'>
                    <div className="flex items-center justify-between text-sm">
                      <p className="font-semibold text-primary">{entry.username}</p>
                      <p className="text-muted-foreground flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {format(new Date(entry.timestamp), "dd MMM yyyy, HH:mm:ss", { locale: es })}
                      </p>
                    </div>
                    <div className="mt-3 space-y-2 text-xs">
                        <p className='font-semibold text-muted-foreground flex items-center gap-1.5'><Edit className="h-3.5 w-3.5" /> Cambios Realizados:</p>
                        <div className='grid grid-cols-[auto,1fr] gap-x-2 items-center'>
                        {entry.changes.map((change, i) => (
                            <React.Fragment key={i}>
                                <div className='text-right font-medium text-muted-foreground'>{change.field}:</div>
                                <div className='flex items-center gap-2'>
                                    <Badge variant="destructive" className="max-w-[100px] truncate">{change.oldValue || 'Vacío'}</Badge>
                                    <span>→</span>
                                    <Badge variant="secondary" className="max-w-[100px] truncate bg-green-100 text-green-800">{change.newValue || 'Vacío'}</Badge>
                                </div>
                            </React.Fragment>
                        ))}
                        </div>
                    </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No hay historial de cambios para este registro.</p>
          </div>
        )}
      </ScrollArea>
    </DialogContent>
  );
}
