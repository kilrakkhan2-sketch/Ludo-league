'use client';

import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Gamepad2, Search, Swords } from "lucide-react";
import Link from "next/link";

export default function MatchesPage() {
    return (
        <AppShell pageTitle="Matches" showBackButton>
            <div className="p-4 sm:p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 text-primary rounded-full">
                                    <Search className="h-6 w-6" />
                                </div>
                                <div>
                                    <CardTitle>Find a Match</CardTitle>
                                    <CardDescription>Browse all open matches and join the action.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                             <Button asChild className="w-full">
                                <Link href="/matches/open">View Open Matches</Link>
                            </Button>
                        </CardContent>
                    </Card>
                     <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                             <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 text-primary rounded-full">
                                    <Gamepad2 className="h-6 w-6" />
                                </div>
                                <div>
                                    <CardTitle>Your Active Matches</CardTitle>
                                    <CardDescription>Track the games you have joined or created.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Button asChild className="w-full">
                                <Link href="/matches/my-matches">View My Matches</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <div className="text-center pt-4">
                     <Button asChild variant="outline">
                        <Link href="/create-match">
                            <Swords className="mr-2 h-4 w-4" /> Or Create Your Own Match
                        </Link>
                    </Button>
                </div>
            </div>
        </AppShell>
    )
}