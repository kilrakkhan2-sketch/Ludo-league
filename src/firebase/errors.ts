export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  requestResourceData?: any;
};

export class FirestorePermissionError extends Error {
  public context: SecurityRuleContext;

  constructor(context: SecurityRuleContext) {
    const message = `FirestoreError: Missing or insufficient permissions: The following request was denied by Firestore Security Rules:\n${JSON.stringify(
      {
        path: context.path,
        operation: context.operation,
        // In a real app, you'd get the auth context from the current user.
        // For this example, we'll leave it as a placeholder.
        auth: { uid: '(unknown)', token: { /* ... */ } }, 
        requestData: context.requestResourceData,
      },
      null,
      2
    )}`;

    super(message);
    this.name = 'FirestorePermissionError';
    this.context = context;

    // This is to make the error object serializable for the Next.js overlay.
    Object.setPrototypeOf(this, FirestorePermissionError.prototype);
  }
}
