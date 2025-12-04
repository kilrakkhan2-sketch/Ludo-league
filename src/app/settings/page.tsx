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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold font-headline">Settings</h1>

        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>
              Update your public profile information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
                <Avatar className="w-20 h-20">
                    <AvatarImage src="https://picsum.photos/seed/user-avatar/200/200" />
                    <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div className="flex-grow">
                     <Label htmlFor="avatar-upload">Profile Picture</Label>
                    <Input id="avatar-upload" type="file" />
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF up to 5MB.</p>
                </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" defaultValue="LudoKing99" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Input id="bio" placeholder="Tell everyone a little about yourself" />
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button>Save Changes</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>
              Manage your email and password.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="john.doe@email.com" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input id="password" type="password" placeholder="Enter a new password"/>
            </div>
          </CardContent>
           <CardFooter className="border-t pt-6 flex justify-between items-center">
            <Button>Update Account</Button>
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
          <CardContent className="space-y-4">
             <div className="flex items-center justify-between rounded-lg border p-4">
              <Label htmlFor="friend-requests">
                Friend Requests
              </Label>
              <Switch id="friend-requests" defaultChecked />
            </div>
             <div className="flex items-center justify-between rounded-lg border p-4">
              <Label htmlFor="match-invites">
                Match Invites
              </Label>
              <Switch id="match-invites" defaultChecked />
            </div>
             <div className="flex items-center justify-between rounded-lg border p-4">
              <Label htmlFor="newsletter">
                Newsletter
              </Label>
              <Switch id="newsletter" />
            </div>
          </CardContent>
        </Card>

      </div>
    </AppShell>
  );
}
