'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/firebase";
import { BarChart, Edit, Mail, Phone, User as UserIcon, Wallet } from "lucide-react";

export default function ProfilePage() {
  const { user, userProfile } = useUser();

  if (!user || !userProfile) {
    return <div>Loading...</div>;
  }

  return (
    <div className="grid gap-8">
      <Card className="shadow-md">
        <CardHeader className="flex flex-col items-center text-center gap-4">
          <Avatar className="h-24 w-24 border-4 border-primary">
            <AvatarImage src={user.photoURL || ''} alt={user.displayName || ''} />
            <AvatarFallback className="text-3xl">{user.displayName?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="grid gap-1">
            <CardTitle className="text-2xl">{user.displayName}</CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </div>
           <Button variant="outline" size="sm" className="mt-2">
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </CardHeader>
        <CardContent className="mt-4 border-t pt-6 grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <UserIcon className="h-6 w-6 text-muted-foreground" />
                <div>
                    <p className="text-sm text-muted-foreground">User ID</p>
                    <p className="font-semibold text-sm break-all">{user.uid}</p>
                </div>
            </div>
            <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <Mail className="h-6 w-6 text-muted-foreground" />
                <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-semibold">{user.email}</p>
                </div>
            </div>
             <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <Wallet className="h-6 w-6 text-muted-foreground" />
                <div>
                    <p className="text-sm text-muted-foreground">Total Winnings</p>
                    <p className="font-semibold">₹{userProfile.winnings || 0}</p>
                </div>
            </div>
             <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <BarChart className="h-6 w-6 text-muted-foreground" />
                <div>
                    <p className="text-sm text-muted-foreground">Win Rate</p>
                    <p className="font-semibold">{userProfile.winRate || 0}%</p>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
