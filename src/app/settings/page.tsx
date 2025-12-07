"use client";

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

export default function SettingsPage() {
    const { user } = useUser();

  return (
    <AppShell>
      <div className="p-4 space-y-6">
        <h1 className="text-3xl font-bold font-headline">Settings</h1>

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
                    <Input id="avatar-upload" type="file" />
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF up to 5MB.</p>
                </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Display Name</Label>
              <Input id="username" defaultValue={user?.displayName || ''} />
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button>Save Profile</Button>
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
              <Input id="password" type="password" placeholder="Enter a new password"/>
            </div>
          </CardContent>
           <CardFooter className="border-t pt-6 flex justify-between items-center">
            <Button>Update Password</Button>
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
