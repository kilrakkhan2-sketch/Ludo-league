
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCollection } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useFirestore } from "@/firebase/provider";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'deposit_admin' | 'match_admin' | 'user';
}

export default function ManageAdminsPage() {
  const { data: users, loading } = useCollection<UserProfile>('users');
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!firestore) return;
    
    const userRef = doc(firestore, "users", userId);
    const updatedData = { role: newRole };

    updateDoc(userRef, updatedData)
      .then(() => {
        toast({
          title: "Success",
          description: `User role updated to ${newRole}.`,
        });
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'update',
          requestResourceData: updatedData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };
  
  const getRoleBadgeVariant = (role: UserProfile['role']) => {
    switch (role) {
      case 'superadmin':
        return 'destructive';
      case 'deposit_admin':
        return 'default';
      case 'match_admin':
        return 'secondary';
      default:
        return 'outline';
    }
  }


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Manage Admins</h1>
      <Card>
        <CardHeader>
          <CardTitle>User Roles</CardTitle>
          <CardDescription>
            Assign admin roles to users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? <p>Loading users...</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Current Role</TableHead>
                  <TableHead className="w-[200px]">Change Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                            {user.role}
                        </Badge>
                    </TableCell>
                    <TableCell>
                      <Select 
                        defaultValue={user.role}
                        onValueChange={(newRole) => handleRoleChange(user.id, newRole)}
                        disabled={user.role === 'superadmin'}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="deposit_admin">Deposit Admin</SelectItem>
                          <SelectItem value="match_admin">Match Admin</SelectItem>
                          <SelectItem value="superadmin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
