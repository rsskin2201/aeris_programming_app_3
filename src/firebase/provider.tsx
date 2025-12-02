'use client';

import {createContext, useContext, ReactNode, useMemo} from 'react';
import type {FirebaseApp} from 'firebase/app';
import type {Auth} from 'firebase/auth';
import type {Firestore} from 'firebase/firestore';
import {FirebaseErrorListener} from '@/components/FirebaseErrorListener';

export interface FirebaseContextValue {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

export const FirebaseContext = createContext<FirebaseContextValue | undefined>(
  undefined
);

export function FirebaseProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: FirebaseContextValue;
}) {
  const memoizedValue = useMemo(() => value, [value]);
  return (
    <FirebaseContext.Provider value={memoizedValue}>
      {children}
      <FirebaseErrorListener />
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}

export const useFirebaseApp = () => useFirebase().app;
export const useAuth = () => useFirebase().auth;
export const useFirestore = () => useFirebase().firestore;
