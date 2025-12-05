'use client';

import { useEffect, useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth } from '@/firebase/provider';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function MakeAdminPage() {
  const [status, setStatus] = useState('Processing: Granting superadmin access...');
  const [error, setError] = useState('');
  const auth = useAuth(); // Initialize Firebase

  useEffect(() => {
    const makeAdmin = async () => {
      // This function should only be called once and the page deleted immediately after.
      if (!auth) return;
      
      try {
        const functions = getFunctions();
        const setSuperAdminRole = httpsCallable(functions, 'setSuperAdminRole');
        
        const result = await setSuperAdminRole({ email: 'waseem982878@gmail.com' });
        
        // @ts-ignore
        setStatus(result.data.message || 'Superadmin role granted successfully!');
        setError('');
      } catch (err: any) {
        console.error(err);
        setStatus('Failed to grant superadmin role.');
        setError(err.message || 'An unknown error occurred. Check the function logs.');
      }
    };

    makeAdmin();
  }, [auth]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Super Admin Setup</h1>
        <p className="text-lg mb-2 text-gray-700 dark:text-gray-300">{status}</p>
        {error && <p className="text-red-500 text-sm mb-4">Error: {error}</p>}
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The user 'waseem982878@gmail.com' should now have superadmin privileges. Please log in with this account to access the admin panel.
        </p>
        <div className="flex gap-4 justify-center">
            <Button asChild>
                <Link href="/login">Go to Login</Link>
            </Button>
            <Button asChild variant="secondary">
                <Link href="/admin/dashboard">Go to Admin Panel</Link>
            </Button>
        </div>
      </div>
    </div>
  );
}
