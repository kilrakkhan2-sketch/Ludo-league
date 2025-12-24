
'use client';

import { useCollectionGroup, useDoc } from "@/firebase";
import type { Transaction, UserProfile } from "@/types";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CircleArrowDown, CircleArrowUp, Ticket, Trophy, Gift, Minus, Coins } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const transactionTypes = ['all', 'prize', 'win', 'entry_fee', 'withdrawal', 'deposit', 'add_money', 'referral_bonus'];

const getTransactionIcon = (type: Transaction['type']) => {
    const className = "h-5 w-5";
    switch (type) {
        case 'prize': case 'win': return <Trophy className={`${className} text-yellow-500`} />;
        case 'entry_fee': return <Ticket className={`${className} text-gray-500`} />;
        case 'withdrawal': return <CircleArrowUp className={`${className} text-red-500`} />;
        case 'deposit': case 'add_money': return <CircleArrowDown className={`${className} text-green-500`} />;
        case 'referral_bonus': return <Gift className={`${className} text-blue-500`} />;
        default: return <Minus className={`${className} text-gray-400`} />;
    }
}

const UserCell = ({ uid }: { uid: string }) => {
    const { data: user, loading } = useDoc<UserProfile>(`users/${uid}`);
    if (loading) return <Skeleton className="h-5 w-24" />;
    return (
        <div className="flex flex-col">
            <span className='font-medium'>{user?.displayName || 'Unknown User'}</span>
            <span className='text-xs text-muted-foreground'>{uid}</span>
        </div>
    );
}

export default function AdminTransactionsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const queryOptions = useMemo(() => ({
    orderBy: ['createdAt', 'desc'] as const,
    limit: 100, // Increased limit for better overview
  }), []);

  const { data: transactions, loading } = useCollectionGroup<Transaction>('transactions', queryOptions);

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    const lowerSearch = searchTerm.toLowerCase();
    return transactions.filter(tx => {
      const typeMatch = typeFilter === 'all' || tx.type === typeFilter;
      const searchMatch = !searchTerm || 
        tx.userId.toLowerCase().includes(lowerSearch) || 
        tx.id.toLowerCase().includes(lowerSearch) ||
        tx.description?.toLowerCase().includes(lowerSearch);
      return typeMatch && searchMatch;
    });
  }, [transactions, searchTerm, typeFilter]);

  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold">Transaction Ledger</h1>
            <p className="text-muted-foreground">A complete, searchable history of all transactions on the platform.</p>
        </div>
        
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                     <div className="w-full sm:w-auto sm:max-w-xs">
                        <Input 
                            placeholder='Search by User/Txn ID...'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="w-full sm:w-auto sm:max-w-xs">
                         <Select onValueChange={setTypeFilter} value={typeFilter}>
                            <SelectTrigger><SelectValue placeholder="Filter by type" /></SelectTrigger>
                            <SelectContent>
                                {transactionTypes.map(t => <SelectItem key={t} value={t} className="capitalize">{t.replace('_', ' ')}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                 <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead className="hidden md:table-cell">Description</TableHead>
                                <TableHead className="hidden lg:table-cell">Date</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && [...Array(10)].map((_, i) => <TableRow key={i}>{Array(6).fill(0).map((_, c) => <TableCell key={c}><Skeleton className="h-8 w-full" /></TableCell>)}</TableRow>)}
                            {!loading && filteredTransactions.length === 0 && <TableRow><TableCell colSpan={6} className="h-24 text-center">No transactions found.</TableCell></TableRow>}
                            {!loading && filteredTransactions.map((tx: Transaction) => {
                                const isCredit = tx.amount > 0 || ['deposit', 'prize', 'referral_bonus', 'win', 'add_money'].includes(tx.type);
                                const amount = isCredit ? tx.amount : Math.abs(tx.amount);
                                return (
                                    <TableRow key={tx.id}>
                                        <TableCell><UserCell uid={tx.userId} /></TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {getTransactionIcon(tx.type)}
                                                <span className="capitalize font-medium">{tx.type.replace(/_/g, ' ')}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className={`font-bold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                                            {isCredit ? '+' : '-'}₹{amount.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell text-sm">{tx.description}</TableCell>
                                        <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                                            {tx.createdAt?.seconds ? format(new Date(tx.createdAt.seconds * 1000), 'dd MMM yyyy, HH:mm') : 'N/A'}
                                        </TableCell>
                                        <TableCell className="text-right"><Badge variant={tx.status === 'completed' ? 'default' : 'secondary'}>{tx.status}</Badge></TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
