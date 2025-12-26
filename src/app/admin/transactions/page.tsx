'use client';

import { useCollection } from "@/firebase";
import { Transaction, UserProfile } from "@/types";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CircleArrowDown, CircleArrowUp, Ticket, Trophy } from "lucide-react";

// Decide which icon to show based on the transaction type
const TypeIcon = ({ type }: { type: Transaction['type'] }) => {
    const className = "h-5 w-5";
    switch (type) {
        case 'prize':
        case 'prize_win':
            return <Trophy className={`${className} text-yellow-500`} />;
        case 'entry_fee':
            return <Ticket className={`${className} text-gray-500`} />;
        case 'withdrawal':
            return <CircleArrowUp className={`${className} text-red-500`} />;
        case 'deposit':
            return <CircleArrowDown className={`${className} text-green-500`} />;
        default:
            return null;
    }
};

// Determine badge variant based on status
const getBadgeVariant = (status: Transaction['status']) => {
  switch (status) {
    case 'completed': return 'default';
    case 'pending': return 'secondary';
    case 'failed': return 'destructive';
    default: return 'outline';
  }
};

export default function TransactionsPage() {
  const { data: transactions, loading: transactionsLoading } = useCollection<Transaction>('transactions', { orderBy: ['createdAt', 'desc'], limit: 100 });
  const { data: users, loading: usersLoading } = useCollection<UserProfile>('users');

  // Create a map of userId -> user for quick lookup
  const userMap = useMemo(() => {
    if (!users) return {};
    return users.reduce((acc, user) => {
      acc[user.uid] = user;
      return acc;
    }, {} as { [key: string]: UserProfile });
  }, [users]);

  const loading = transactionsLoading || usersLoading;

  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold">All Transactions</h1>
            <p className="text-muted-foreground">A log of all financial movements in the system.</p>
        </div>

        <div className="border rounded-lg">
            <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[80px]">Type</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Transaction ID</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                    Loading transactions...
                    </TableCell>
                </TableRow>
                ) : transactions && transactions.length > 0 ? (
                transactions.map((tx) => {
                    const user = userMap[tx.userId];
                    return (
                    <TableRow key={tx.id}>
                        <TableCell><TypeIcon type={tx.type} /></TableCell>
                        <TableCell>
                            {user ? (
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8 border">
                                        <AvatarImage src={user.photoURL} alt={user.displayName} />
                                        <AvatarFallback>{user.displayName?.[0]}</AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium">{user.displayName}</span>
                                </div>
                            ) : (
                                <span className="text-xs font-mono">{tx.userId}</span>
                            )}
                        </TableCell>
                        <TableCell className="font-medium">₹{tx.amount}</TableCell>
                        <TableCell>
                        <Badge variant={getBadgeVariant(tx.status)} className="capitalize">{tx.status}</Badge>
                        </TableCell>
                        <TableCell>{tx.createdAt ? new Date(tx.createdAt.seconds * 1000).toLocaleString() : 'N/A'}</TableCell>
                        <TableCell className="font-mono text-xs">{tx.id}</TableCell>
                    </TableRow>
                    );
                })
                ) : (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                    No transactions found.
                    </TableCell>
                </TableRow>
                )}
            </TableBody>
            </Table>
        </div>
    </div>
  );
}
