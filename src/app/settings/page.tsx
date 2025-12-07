
"use client";

import { useState } from 'react';
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@/firebase";
import { useFirebase } from '@/firebase/provider';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

export default function SettingsPage() {
    const { user } = useUser();
    const { firestore, storage, auth } = useFirebase();
    const { toast } = useToast();
    
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [newPassword, setNewPassword] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !user || !firestore || !storage) return;

      setIsUploading(true);
      try {
        const filePath = `profile-pictures/${user.uid}/${file.name}`;
        const storageRef = ref(storage, filePath);
        
        await uploadBytes(storageRef, file);
        const photoURL = await getDownloadURL(storageRef);
        
        const userDocRef = doc(firestore, 'users', user.uid);
        await updateDoc(userDocRef, { photoURL });

        if(auth?.currentUser) {
          await updateProfile(auth.currentUser, { photoURL });
        }

        toast({ title: 'Avatar Updated!', description: 'Your new profile picture has been saved.' });
      } catch (error) {
        toast({ variant: 'destructive', title: 'Upload Failed' });
      } finally {
        setIsUploading(false);
      }
    };

    const handleProfileSave = async () => {
      if(!user || !firestore || !displayName) return;
      setIsSavingProfile(true);
      try {
        const userDocRef = doc(firestore, 'users', user.uid);
        await updateDoc(userDocRef, { name: displayName, displayName: displayName });

        if(auth?.currentUser) {
          await updateProfile(auth.currentUser, { displayName });
        }
        toast({ title: 'Profile Saved!' });
      } catch(error) {
        toast({ variant: 'destructive', title: 'Save Failed' });
      } finally {
        setIsSavingProfile(false);
      }
    };

    const handlePasswordUpdate = async () => {
      if(!auth?.currentUser || !newPassword) return;
      setIsUpdatingPassword(true);
      try {
        await updatePassword(auth.currentUser, newPassword);
        toast({ title: 'Password Updated Successfully!' });
        setNewPassword('');
      } catch (error: any) {
         toast({ variant: 'destructive', title: 'Password Update Failed', description: error.message });
      } finally {
        setIsUpdatingPassword(false);
      }
    }


  return (
    <AppShell pageTitle="Settings" showBackButton>
      <div className="p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Update your public profile information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
                <Avatar className="w-20 h-20">
                    <AvatarImage src={user?.photoURL || undefined} />
                    <AvatarFallback>{user?.displayName?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-grow">
                     <Label htmlFor="avatar-upload">Profile Picture</Label>
                    <Input id="avatar-upload" type="file" onChange={handleAvatarUpload} disabled={isUploading}/>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB.</p>
                </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Display Name</Label>
              <Input id="username" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button onClick={handleProfileSave} disabled={isSavingProfile}>
              {isSavingProfile ? 'Saving...' : 'Save Profile'}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              Manage your email and password.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue={user?.email || ''} disabled />
            </div>
             <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input id="password" type="password" placeholder="Enter a new password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
          </CardContent>
           <CardFooter className="border-t pt-6 flex justify-between items-center">
            <Button onClick={handlePasswordUpdate} disabled={isUpdatingPassword}>
              {isUpdatingPassword ? 'Updating...' : 'Update Password'}
            </Button>
            <Button variant="destructive">Delete Account</Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              Control how you receive notifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
             <div className="flex items-center justify-between rounded-lg border p-4">
              <Label htmlFor="friend-requests" className="flex flex-col gap-1">
                <span>Friend Requests</span>
                <span className="text-xs text-muted-foreground">Notify me about new friend requests.</span>
              </Label>
              <Switch id="friend-requests" defaultChecked />
            </div>
             <div className="flex items-center justify-between rounded-lg border p-4">
              <Label htmlFor="match-invites" className="flex flex-col gap-1">
                <span>Match Updates</span>
                <span className="text-xs text-muted-foreground">Notify me about match starts, results, etc.</span>
              </Label>
              <Switch id="match-invites" defaultChecked />
            </div>
             <div className="flex items-center justify-between rounded-lg border p-4">
              <Label htmlFor="newsletter" className="flex flex-col gap-1">
                <span>Newsletter</span>
                <span className="text-xs text-muted-foreground">Receive updates about new features and promotions.</span>
              </Label>
              <Switch id="newsletter" />
            </div>
          </CardContent>
        </Card>

      </div>
    </AppShell>
  );
}
