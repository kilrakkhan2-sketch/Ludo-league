
'use client';

import { useState, useEffect } from 'react';
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
import { useUser, useDoc } from "@/firebase";
import { useFirebase } from '@/firebase/provider';
import { doc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { updateProfile, updatePassword } from 'firebase/auth';
import type { UserProfile } from '@/types';
import { httpsCallable } from 'firebase/functions';

const SettingsSection = ({ title, description, children, footer }: { title: string, description: string, children: React.ReactNode, footer?: React.ReactNode }) => (
    <Card>
        <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            {children}
        </CardContent>
        {footer && (
            <CardFooter className="border-t pt-6">
                {footer}
            </CardFooter>
        )}
    </Card>
);

const NotificationRow = ({ id, label, description, checked, onCheckedChange }: { id: string, label: string, description: string, checked: boolean, onCheckedChange: (checked: boolean) => void }) => (
    <div className="flex items-center justify-between rounded-lg border p-4">
        <Label htmlFor={id} className="flex flex-col gap-1 cursor-pointer">
            <span>{label}</span>
            <span className="text-xs font-normal text-muted-foreground">{description}</span>
        </Label>
        <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
);


export function SettingsPageContent() {
    const { user, auth } = useUser();
    const { data: profile, setData: setProfile } = useDoc<UserProfile>(user ? `users/${user.uid}`: undefined);
    const { firestore, storage, functions } = useFirebase();
    const { toast } = useToast();
    
    const [displayName, setDisplayName] = useState('');
    const [newPassword, setNewPassword] = useState('');
    
    // Loading states
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const defaultNotifications = { friendRequests: true, matchUpdates: true, newsletter: false };
    const [notifications, setNotifications] = useState(defaultNotifications);

    useEffect(() => {
        if(profile) {
            setDisplayName(profile.displayName || '');
            setNotifications(profile.notifications || defaultNotifications);
        }
    }, [profile]);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !user || !firestore || !storage || !auth?.currentUser) return;

      setIsUploading(true);
      try {
        const filePath = `avatars/${user.uid}`;
        const storageRef = ref(storage, filePath);
        const snapshot = await uploadBytes(storageRef, file);
        const photoURL = await getDownloadURL(snapshot.ref);
        
        await updateProfile(auth.currentUser, { photoURL });
        await setProfile({ photoURL });

        toast({ title: 'Avatar Updated!', description: 'Your new profile picture looks great.' });
      } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Upload Failed', description: 'Please try a smaller image (PNG, JPG).' });
      } finally {
        setIsUploading(false);
      }
    };

    const handleProfileSave = async () => {
      if(!user || !displayName || !auth?.currentUser) return;
      if(displayName === profile?.displayName && JSON.stringify(notifications) === JSON.stringify(profile?.notifications)) {
          toast({ title: 'No changes to save.' });
          return;
      }

      setIsSaving(true);
      try {
        await updateProfile(auth.currentUser, { displayName });
        await setProfile({ displayName, notifications });
        toast({ title: 'Settings Saved!', description: 'Your changes have been updated.' });
      } catch(error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save your settings.' });
      } finally {
        setIsSaving(false);
      }
    };

    const handlePasswordUpdate = async () => {
      if(!auth?.currentUser || !newPassword) {
        toast({ variant: 'destructive', title: 'Invalid Input', description: 'Please enter a new password.'});
        return;
      }
      setIsSaving(true);
      try {
        await updatePassword(auth.currentUser, newPassword);
        toast({ title: 'Password Updated Successfully!' });
        setNewPassword('');
      } catch (error: any) {
         console.error(error);
         toast({ variant: 'destructive', title: 'Password Update Failed', description: 'This is a sensitive action. Please log out and log back in before trying again.' });
      } finally {
        setIsSaving(false);
      }
    }
    
    const handleDeleteAccount = async () => {
        if (!functions) return;

        const confirmed = window.confirm("Are you absolutely sure you want to delete your account? This action is irreversible and all your data will be lost.");
        if (!confirmed) return;

        setIsSaving(true);
        try {
            const deleteUserAccount = httpsCallable(functions, 'deleteUserAccount');
            await deleteUserAccount();
            toast({ title: "Account Deletion Initiated", description: "Your account is being deleted. You will be logged out shortly." });
        } catch (error: any) { 
            console.error(error);
            toast({ variant: 'destructive', title: 'Deletion Failed', description: error.message });
        } finally {
            setIsSaving(false);
        }
    }

  return (
    <div className="space-y-6">
        <SettingsSection title="Public Profile" description="This information will be visible to other players.">
            <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative">
                    <Avatar className="w-24 h-24">
                        <AvatarImage src={profile?.photoURL} />
                        <AvatarFallback>{displayName?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {isUploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full"><div className="w-6 h-6 border-4 border-t-transparent border-white rounded-full animate-spin"></div></div>}
                </div>
                <div className="flex-grow w-full">
                    <Label htmlFor="avatar-upload" className="mb-2 block">Profile Picture</Label>
                    <Input id="avatar-upload" type="file" accept="image/png, image/jpeg" onChange={handleAvatarUpload} disabled={isUploading}/>
                    <p className="text-xs text-muted-foreground mt-1.5">Recommended: Square, 200x200px. Max 2MB.</p>
                </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Display Name</Label>
              <Input id="username" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your public name" />
            </div>
        </SettingsSection>

         <SettingsSection title="Notifications" description="Control how you receive game and platform updates.">
            <NotificationRow 
                id="matchUpdates" 
                label="Match Updates" 
                description="When a match starts, result is submitted, etc."
                checked={notifications.matchUpdates}
                onCheckedChange={(c) => setNotifications(p => ({...p, matchUpdates: c}))}
            />
             <NotificationRow 
                id="friendRequests" 
                label="Social Alerts" 
                description="When you receive a friend request or message."
                checked={notifications.friendRequests}
                onCheckedChange={(c) => setNotifications(p => ({...p, friendRequests: c}))}
            />
             <NotificationRow 
                id="newsletter" 
                label="Promotions & News"
                description="Receive our newsletter with new features and offers."
                checked={notifications.newsletter}
                onCheckedChange={(c) => setNotifications(p => ({...p, newsletter: c}))}
            />
        </SettingsSection>

        <SettingsSection title="Account Security" description="Manage your login credentials.">
             <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={user?.email || ''} disabled />
            </div>
             <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input id="password" type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <Button onClick={handlePasswordUpdate} disabled={isSaving} className="w-full">Update Password</Button>
        </SettingsSection>
        
        <SettingsSection title="Danger Zone" description="These actions are permanent and cannot be undone.">
             <Button variant="destructive" className="w-full" onClick={handleDeleteAccount} disabled={isSaving}>Delete My Account</Button>
        </SettingsSection>

        <div className="flex justify-end">
             <Button onClick={handleProfileSave} disabled={isSaving || isUploading} size="lg">
                {isSaving ? 'Saving...' : 'Save All Changes'}
            </Button>
        </div>
    </div>
  );
}
