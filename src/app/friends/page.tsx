
'use client';

import { useUser, useCollection } from '@/firebase';
import { UserProfile } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function FriendsPage() {
    const { userData } = useUser();
    const referralLink = userData ? `${window.location.origin}/join?ref=${userData.referralCode}` : '';

    const { data: referrals, loading: referralsLoading } = useCollection<UserProfile>(
        userData ? `users/${userData.uid}/referrals` : undefined,
    );

    const { toast } = useToast();
    const copyToClipboard = () => {
        navigator.clipboard.writeText(referralLink).then(() => {
            toast({ title: "Copied!", description: "Referral link copied to clipboard." });
        });
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Your Referral Link</CardTitle>
                    <CardDescription>Share this link with your friends to invite them.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center space-x-2">
                    <Input value={referralLink} readOnly />
                    <Button onClick={copyToClipboard} size="icon">
                        <Copy className="h-4 w-4" />
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Your Referrals</CardTitle>
                    <CardDescription>Users who have signed up using your link.</CardDescription>
                </CardHeader>
                <CardContent>
                    {referralsLoading && <p>Loading referrals...</p>}
                    {referrals && referrals.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Status</TableHead> 
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {referrals.map(ref => (
                                    <TableRow key={ref.id}>
                                        <TableCell className="flex items-center space-x-2">
                                             <Avatar className="h-8 w-8">
                                                <AvatarImage src={ref.photoURL} />
                                                <AvatarFallback>{ref.displayName[0]}</AvatarFallback>
                                            </Avatar>
                                            <span>{ref.displayName}</span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge>Joined</Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p>You haven't referred anyone yet.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
