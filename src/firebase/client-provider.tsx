'use client';
import {ReactNode} from 'react';

import {initializeFirebase} from './index';
import {FirebaseProvider} from './provider';

// This is a bit of a hack to make sure that the client-side firebase is only
// initialized once.
const firebase = initializeFirebase();

export function FirebaseClientProvider({children}: {children: ReactNode}) {
  return <FirebaseProvider value={firebase}>{children}</FirebaseProvider>;
}
