'use client';

import React from 'react';
import { useMemo } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, User, Clock, Edit } from 'lucide-react';
import { type ChangeHistory } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

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
          <div className="space-y-8 py-4">
            {history.map((entry) => (
              <div key={entry.id} className="grid grid-cols-[auto_1fr] gap-x-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-baseline justify-between">
                    <p className="font-semibold text-primary">{entry.username}</p>
                     <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {format(parseISO(entry.timestamp), "dd MMM yyyy, HH:mm:ss", { locale: es })}
                      </p>
                  </div>
                  <div className="mt-2 space-y-2 rounded-md border bg-muted/50 p-3 text-sm">
                      {entry.changes.map((change, i) => (
                          <div key={i} className="grid grid-cols-[150px_1fr] items-baseline gap-x-2">
                              <span className="font-medium text-muted-foreground truncate text-right">{change.field}:</span>
                              <div className='flex items-center gap-2 flex-wrap'>
                                  <span className="text-red-600 line-through truncate">{change.oldValue || 'Vacío'}</span>
                                  <span className="text-lg font-bold text-muted-foreground">→</span>
                                  <span className="font-semibold text-green-700 truncate">{change.newValue || 'Vacío'}</span>
                              </div>
                          </div>
                      ))}
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
