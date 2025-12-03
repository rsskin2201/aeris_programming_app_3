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
): FirebaseRef<U> {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoized = useMemo<FirebaseRef<U>>(factory, deps);
  if (memoized && typeof memoized === 'object') {
    // @ts-ignore
    memoized.__memo = true;
  }
  return memoized;
}
