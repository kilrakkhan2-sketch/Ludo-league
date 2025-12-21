
'use client';

import { AdminShell } from "@/components/layout/AdminShell";
import { useUser } from "@/firebase";
import { usePathname } from 'next/navigation';
import type { UserProfile } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";

// Define which roles can access which paths
const rolePermissions: { [key: string]: (UserProfile['role'])[] } = {
  '/admin/deposits': ['superadmin', 'deposit_admin'],
  '/admin/withdrawals': ['superadmin', 'withdrawal_admin'],
  '/admin/matches': ['superadmin', 'match_admin'],
  '/admin/announcements': ['superadmin', 'match_admin'],
  '/admin/tournaments': ['superadmin', 'match_admin'],
  // Only superadmin can manage sensitive areas
  '/admin/users': ['superadmin'],
  '/admin/manage-admins': ['superadmin'],
  '/admin/status': ['superadmin'],
  '/admin/transactions': ['superadmin'],
  '/admin/kyc': ['superadmin'],
  '/admin/upi-management': ['superadmin'],
  '/admin/settings': ['superadmin'],
};

const AccessDenied = () => (
    <div className="flex items-center justify-center h-full p-4">
        <Card className="w-full max-w-md text-center">
            <CardHeader>
                <div className="mx-auto bg-red-100 rounded-full p-3 w-fit">
                    <ShieldAlert className="h-8 w-8 text-red-600" />
                </div>
                <CardTitle className="pt-4">Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    You do not have the necessary permissions to view this page. Please contact a super administrator if you believe this is an error.
                </p>
            </CardContent>
        </Card>
    </div>
);

const LoadingPermissions = () => (
    <div className="flex items-center justify-center h-full"><p>Loading user permissions...</p></div>
);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userData, loading: userLoading } = useUser();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const hasPermission = () => {
    // If auth is still loading, don't show anything yet
    if (!isClient || userLoading) {
      return 'loading';
    }

    // If no user or the user has no role or is a regular user, deny access.
    const role = userData?.role;
    if (!role || role === 'user') {
      return false;
    }

    // Superadmin can access everything
    if (role === 'superadmin') {
      return true;
    }

    // Find a matching permission entry for the current path
    const permissionKey = Object.keys(rolePermissions).find(key => pathname?.startsWith(key));
    
    if (permissionKey) {
        const allowedRoles = rolePermissions[permissionKey];
        return allowedRoles.includes(role);
    }

    // If no specific permission is defined for a path (like /admin/dashboard), allow access for any admin role.
    return true;
  };
  
  const permissionState = hasPermission();

  if (permissionState === 'loading') {
    return <AdminShell pageTitle="Loading..."><LoadingPermissions /></AdminShell>;
  }

  if (!permissionState) {
    return <AdminShell pageTitle="Access Denied"><AccessDenied /></AdminShell>;
  }

  return <AdminShell>{children}</AdminShell>;
}
