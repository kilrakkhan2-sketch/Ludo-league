
'use client';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { BarChart, Crown, Medal, Trophy } from "lucide-react";
import { useFirestore } from "@/firebase";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { PlaceHolderImages } from '@/lib/placeholder-images';

type UserProfile = {
  uid: string;
  displayName: string;
  photoURL: string;
  winRate?: number;
  winnings?: number;
};

const bannerImage = PlaceHolderImages.find(img => img.id === 'banner-leaderboard');

export default function LeaderboardPage() {
  const firestore = useFirestore();
  const [sortedUsers, setSortedUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firestore) return;
    
    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            const usersRef = collection(firestore, 'users');
            const q = query(usersRef, orderBy('winnings', 'desc'), limit(50));
            
            const snapshot = await getDocs(q);
            const usersData = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
            setSortedUsers(usersData);
        } catch (error) {
            console.error("Error fetching leaderboard: ", error);
        } finally {
            setLoading(false);
        }
    };
    
    fetchLeaderboard();
  }, [firestore]);


  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-6 w-6 text-yellow-400" />; // Gold using a different gold
    if (rank === 2) return <Medal className="h-6 w-6 text-slate-400" />; // Silver
    if (rank === 3) return <Trophy className="h-6 w-6 text-orange-400" />; // Bronze
    return <span className="font-bold text-lg">{rank}</span>;
  }

  return (
    <div className='space-y-6'>
       {bannerImage && (
            <div className="relative w-full h-40 md:h-56 rounded-lg overflow-hidden">
                <Image src={bannerImage.imageUrl} alt="Leaderboard Banner" fill className="object-cover" data-ai-hint={bannerImage.imageHint} />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
                        <BarChart className="h-8 w-8" /> Leaderboard
                    </h2>
                </div>
            </div>
        )}

      <Card>
        <CardHeader>
            <CardTitle>Top Players</CardTitle>
            <CardDescription>See who is leading the league with the most winnings.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="text-center">Rank</TableHead>
                        <TableHead>Player</TableHead>
                        <TableHead className="text-center">Win Rate</TableHead>
                        <TableHead className="text-right">Winnings</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading && (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground">Loading leaderboard...</TableCell>
                        </TableRow>
                    )}
                    {!loading && sortedUsers.length === 0 && (
                        <TableRow>
                             <TableCell colSpan={4} className="text-center text-muted-foreground">No players on the leaderboard yet.</TableCell>
                        </TableRow>
                    )}
                    {!loading && sortedUsers.map((user, index) => {
                        const rank = index + 1;
                        return (
                            <TableRow key={user.uid} className={cn({
                                "bg-yellow-400/10": rank === 1,
                                "bg-slate-400/10": rank === 2,
                                "bg-orange-400/10": rank === 3,
                            })}>
                                <TableCell className="text-center">
                                    <div className="flex justify-center items-center h-full">
                                        {getRankIcon(rank)}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10 border-2 border-muted">
                                            <AvatarImage src={user.photoURL} alt={user.displayName} />
                                            <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium">{user.displayName}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center font-semibold">{user.winRate || 0}%</TableCell>
                                <TableCell className="text-right font-bold text-primary text-base">
                                    ₹{(user.winnings || 0).toLocaleString('en-IN')}
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
