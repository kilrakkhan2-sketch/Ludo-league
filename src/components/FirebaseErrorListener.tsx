'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

// This is a client-side only component that handles Firebase permission errors.
// It is intended for use in development environments to provide rich, contextual
// errors to the developer. It should be disabled in production.
export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      console.error(
        'Firestore Permission Error:',
        JSON.stringify(error.context, null, 2)
      );

      // In a real app, you might use a more sophisticated logging service.
      // For this example, we'll throw the error in development to show
      // the Next.js error overlay, which is very useful for debugging.
      if (process.env.NODE_ENV === 'development') {
        // This will be caught by the Next.js error overlay.
        throw error;
      } else {
        // In production, you might want to show a toast or log to a service.
        toast({
          variant: 'destructive',
          title: 'Permission Denied',
          description: 'You do not have permission to perform this action.',
        });
      }
    };

    errorEmitter.on('permission-error', handlePermissionError);

    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, [toast]);

  return null; // This component does not render anything.
}
