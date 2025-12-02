export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
};

export class FirestorePermissionError extends Error {
  __brand = 'FirestorePermissionError' as const;
  context: SecurityRuleContext;
  serverError?: Error;

  constructor(context: SecurityRuleContext, serverError?: Error) {
    const message = `FirestoreError: Missing or insufficient permissions: The following request was denied by Firestore Security Rules:\n${JSON.stringify(
      context,
      null,
      2
    )}`;
    super(message);
    this.name = 'FirestorePermissionError';
    this.context = context;
    this.serverError = serverError;

    // This is necessary for custom errors in TypeScript.
    Object.setPrototypeOf(this, FirestorePermissionError.prototype);
  }
}

export function isFirestorePermissionError(
  error: any
): error is FirestorePermissionError {
  return (
    error &&
    typeof error === 'object' &&
    '__brand' in error &&
    error.__brand === 'FirestorePermissionError'
  );
}
