import {useMemo, type DependencyList} from 'react';
import {
  type DocumentReference,
  type CollectionReference,
  type Query,
  type Firestore,
} from 'firebase/firestore';

type FirebaseRef<T> =
  | DocumentReference<T>
  | CollectionReference<T>
  | Query<T>
  | null;

export function useMemoFirebase<T, U>(
  factory: () => FirebaseRef<U>,
  deps: DependencyList
) {
  return useMemo(factory, deps);
}
