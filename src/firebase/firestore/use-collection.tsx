'use client';
import {useEffect, useState} from 'react';
import {
  type CollectionReference,
  type DocumentData,
  type Query,
  onSnapshot,
} from 'firebase/firestore';

import {errorEmitter} from '../error-emitter';
import {FirestorePermissionError} from '../errors';

interface HookResponse<T> {
  data: T[] | null;
  loading: boolean;
  error: Error | null;
}

export function useCollection<T extends DocumentData>(
  query: CollectionReference<T> | Query<T> | null
): HookResponse<T> {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      query,
      (querySnapshot) => {
        const data: T[] = [];
        querySnapshot.forEach((doc) => {
          data.push({id: doc.id, ...doc.data()} as T);
        });
        setData(data);
        setLoading(false);
      },
      async (err) => {
        const permissionError = new FirestorePermissionError({
          path: (query as CollectionReference).path,
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [query]);

  return {data, loading, error};
}
