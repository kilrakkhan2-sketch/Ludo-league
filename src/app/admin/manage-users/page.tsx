
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { getAuth } from 'firebase/auth';

const VALID_ROLES = ['superadmin', 'deposit_admin', 'match_admin', 'user'];

export default function ManageUsersPage() {
  const { toast } = useToast();
  const { user } = useUser(); 
  const [targetUid, setTargetUid] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSetClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!targetUid || !selectedRole) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please provide a User ID and select a role.' });
      setIsLoading(false);
      return;
    }

    if (!user) {
        toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
        setIsLoading(false);
        return;
    }

    try {
      const auth = getAuth();
      const idToken = await auth.currentUser?.getIdToken();

      if (!idToken) {
        throw new Error('Could not get authentication token.');
      }

      const response = await fetch('/api/set-claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ uid: targetUid, newRole: selectedRole }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'An unknown error occurred.');
      }

      toast({
        title: 'Success',
        description: `Role '${selectedRole}' has been assigned to user ${targetUid}.`,
      });
      setTargetUid('');
      setSelectedRole('');

    } catch (error: any) {
      console.error('Failed to set claim:', error);
      toast({
        variant: 'destructive',
        title: 'Operation Failed',
        description: error.message || 'Could not set user role. Please check the console for more details.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Set User Role</CardTitle>
          <CardDescription>
            Assign a custom role to a user by providing their User ID (UID).
            This action can only be performed by a Super Admin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSetClaim} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="uid">User ID (UID)</Label>
              <Input
                id="uid"
                type="text"
                placeholder="Enter the User ID of the target user"
                value={targetUid}
                onChange={(e) => setTargetUid(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">New Role</Label>
              <Select onValueChange={setSelectedRole} value={selectedRole} required>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role to assign" />
                </SelectTrigger>
                <SelectContent>
                  {VALID_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Assigning...' : 'Assign Role'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
