import {initializeApp, getApp, getApps} from 'firebase/app';
import {getAuth} from 'firebase/auth';
import {getFirestore} from 'firebase/firestore';
import {firebaseConfig} from './config';

export function initializeFirebase() {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const firestore = getFirestore(app);

  return {app, auth, firestore};
}

export * from './provider';
export * from './client-provider';
export * from './auth/use-user';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './hooks/use-memo-firebase';
export * from './errors';
export * from './error-emitter';
