'use client';
import {useEffect} from 'react';
import {errorEmitter, isFirestorePermissionError} from '@/firebase';

export function FirebaseErrorListener() {
  useEffect(() => {
    const handleError = (error: unknown) => {
      if (isFirestorePermissionError(error)) {
        // Log the rich error to the console. The Next.js dev overlay will pick it up.
        console.error(error);
      }
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  return null; // This component does not render anything.
}
