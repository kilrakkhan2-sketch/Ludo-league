
'use client';
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { ArrowDownLeft, ArrowUpRight, UploadCloud, DownloadCloud, Landmark, Wallet as WalletIcon, AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { useUser, useFirestore } from "@/firebase"
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp, doc } from "firebase/firestore"
import { useEffect, useState } from "react"
import type { Transaction, UpiConfiguration } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage"
import { PlaceHolderImages } from '@/lib/placeholder-images';

const bannerImage = PlaceHolderImages.find(img => img.id === 'banner-wallet');

const DynamicQrCode = ({ upiId }: { upiId: string | null }) => {
  if (!upiId) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-4 bg-muted/50 rounded-lg h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary"/>
        <p className="text-sm text-center text-muted-foreground">Loading QR Code...</p>
      </div>
    );
  }

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${upiId}&pn=LudoLeague`;

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <p className="text-sm text-center text-muted-foreground">Scan the QR code with your payment app and enter the details below.</p>
        <Image src={qrUrl} alt="QR Code for payment" width={200} height={200} className="rounded-lg border-2 shadow-md bg-white" data-ai-hint="qr code" />
        <p className="font-bold text-center text-sm">UPI ID: {upiId}</p>
    </div>
  );
};


export default function WalletPage() {
  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [depositScreenshot, setDepositScreenshot] = useState<File | null>(null);
  const [activeUpiId, setActiveUpiId] = useState<string | null>(null);
  
  const balance = userProfile?.walletBalance ?? 0;

  useEffect(() => {
    if (!firestore) return;
    const upiConfigRef = doc(firestore, 'upiConfiguration', 'active');
    const unsubscribeUpi = onSnapshot(upiConfigRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data() as UpiConfiguration;
        setActiveUpiId(data.activeUpiId);
      } else {
        console.log("No active UPI configuration found!");
        setActiveUpiId(null);
      }
    });

    return () => unsubscribeUpi();
  }, [firestore]);


  useEffect(() => {
    if (!firestore || !user) return;

    const transRef = collection(firestore, 'transactions');
    const q = query(transRef, where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
        setTransactions(data);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, user]);

  const getFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error("Failed to read file."));
        }
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDepositSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !firestore || !depositScreenshot) {
        toast({ title: "Please fill all fields and upload a screenshot.", variant: "destructive" });
        return;
    }

    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get('deposit-amount'));
    
    if (amount < 100) {
        toast({ title: "Invalid Amount", description: "Minimum deposit amount is ₹100.", variant: "destructive"});
        return;
    }

    setIsDepositing(true);
    const utr = formData.get('utr') as string;
    
    if(!utr || !amount || amount <= 0) {
        toast({title: "Invalid UTR or Amount.", variant: "destructive"});
        setIsDepositing(false);
        return;
    }
    
    try {
        const dataUrl = await getFileAsDataUrl(depositScreenshot);
        const storage = getStorage();
        const storageRef = ref(storage, `deposits/${user.uid}/${Date.now()}`);

        await uploadString(storageRef, dataUrl, 'data_url');
        const screenshotUrl = await getDownloadURL(storageRef);

        await addDoc(collection(firestore, 'transactions'), {
            userId: user.uid,
            type: 'deposit',
            amount,
            utr,
            screenshotUrl,
            status: 'pending',
            createdAt: serverTimestamp(),
            description: 'Deposit via UPI'
        });
        
        toast({ title: "Deposit request submitted successfully." });
        (e.target as HTMLFormElement).reset();
        setDepositScreenshot(null);

    } catch (error: any) {
        console.error("Deposit Error:", error);
        toast({ title: "Deposit Failed", description: error.message || "An unexpected error occurred.", variant: "destructive" });
    } finally {
        setIsDepositing(false);
    }
  };


  const handleWithdrawalSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
     if (!user || !firestore) {
        toast({ title: "Please login first", variant: "destructive" });
        return;
    }
    if(userProfile?.kycStatus !== 'approved') {
        toast({ title: "KYC not approved", description: "Please complete your KYC to enable withdrawals.", variant: "destructive" });
        return;
    }
    setIsWithdrawing(true);
    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get('withdraw-amount'));

    if (!amount || amount < 300) {
        toast({ title: "Invalid Amount", description: "Minimum withdrawal is ₹300.", variant: "destructive" });
        setIsWithdrawing(false);
        return;
    }
    if (amount > balance) {
        toast({ title: "Insufficient Balance", variant: "destructive"});
        setIsWithdrawing(false);
        return;
    }

    try {
        await addDoc(collection(firestore, 'transactions'), {
            userId: user.uid,
            type: 'withdrawal',
            amount,
            status: 'pending',
            createdAt: serverTimestamp(),
            upiId: userProfile?.upiId || '',
            bankDetails: userProfile?.bankDetails || '',
            description: 'Withdrawal request'
        });
        toast({ title: "Withdrawal request submitted successfully." });
        (e.target as HTMLFormElement).reset();
    } catch(error: any) {
        toast({ title: "Request Failed", description: error.message, variant: "destructive" });
    } finally {
        setIsWithdrawing(false);
    }
  }


  return (
    <div className="space-y-6">
      {bannerImage && (
            <div className="relative w-full h-40 md:h-56 rounded-lg overflow-hidden">
                <Image src={bannerImage.imageUrl} alt="Wallet Banner" fill className="object-cover" data-ai-hint={bannerImage.imageHint} />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
                        <WalletIcon className="h-8 w-8" /> My Wallet
                    </h2>
                </div>
            </div>
        )}
      <div className="grid gap-8">
        <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="grid gap-2">
                    <CardTitle>Current Balance</CardTitle>
                    <CardDescription>
                        This is the total amount of funds in your wallet.
                    </CardDescription>
                </div>
                <div className="text-4xl font-bold text-primary">
                    ₹{balance.toFixed(2)}
                </div>
            </CardHeader>
        </Card>

        <div className="grid gap-8 md:grid-cols-2">
             <Card className="shadow-md">
                <form onSubmit={handleDepositSubmit}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><UploadCloud className="h-6 w-6 text-green-500" />Deposit Funds</CardTitle>
                        <CardDescription>Add money to your wallet to join matches.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Important: Name Match Required</AlertTitle>
                            <AlertDescription>
                                Please deposit from a bank account or UPI ID where the name matches your KYC documents. Mismatched names will result in rejection of the deposit.
                            </AlertDescription>
                        </Alert>
                        <DynamicQrCode upiId={activeUpiId} />

                        <div className="grid gap-2">
                            <Label htmlFor="deposit-amount">Amount (Min. ₹100)</Label>
                            <Input name="deposit-amount" id="deposit-amount" placeholder="e.g., 500" type="number" required />
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="utr">UTR / Transaction ID</Label>
                            <Input name="utr" id="utr" placeholder="Enter the 12-digit UTR number" required />
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="screenshot">Payment Screenshot</Label>
                            <Input name="screenshot" id="screenshot" type="file" required onChange={(e) => setDepositScreenshot(e.target.files?.[0] || null)} className="file:text-primary"/>
                        </div>
                        <Button type="submit" disabled={isDepositing} className="w-full">
                            {isDepositing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                            Submit Deposit
                        </Button>
                    </CardContent>
                </form>
            </Card>
             <Card className="shadow-md">
                 <form onSubmit={handleWithdrawalSubmit}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><DownloadCloud className="h-6 w-6 text-red-500"/>Withdraw Funds</CardTitle>
                        <CardDescription>Request a withdrawal to your bank account.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                         <Alert>
                            <Landmark className="h-4 w-4" />
                            <AlertTitle>Withdrawal Policy</AlertTitle>
                            <AlertDescription>
                                KYC must be approved for withdrawals. Minimum withdrawal is ₹300. Approval may take up to 24 hours.
                            </AlertDescription>
                        </Alert>
                        <div className="grid gap-2">
                            <Label htmlFor="withdraw-amount">Amount (Min. ₹300)</Label>
                            <Input name="withdraw-amount" id="withdraw-amount" placeholder="e.g., 1000" type="number" required />
                        </div>
                        <Button type="submit" variant="destructive" className="w-full" disabled={isWithdrawing || userProfile?.kycStatus !== 'approved'}>
                             {isWithdrawing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                            Request Withdrawal
                        </Button>
                        {userProfile?.kycStatus !== 'approved' && (
                             <p className="text-sm text-center text-red-500">KYC must be approved for withdrawals.</p>
                        )}
                    </CardContent>
                 </form>
            </Card>
        </div>

        <Card className="shadow-md">
            <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && <TableRow><TableCell colSpan={4} className="text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto"/></TableCell></TableRow>}
                        {!loading && transactions.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No transactions yet.</TableCell></TableRow>}
                        {!loading && transactions.slice(0,5).map((t) => (
                            <TableRow key={t.id}>
                                <TableCell>
                                <div className="font-medium flex items-center gap-2">
                                     {t.type === 'deposit' || t.type === 'winnings' || t.type === 'refund' ? <ArrowUpRight className="h-4 w-4 text-green-500"/> : <ArrowDownLeft className="h-4 w-4 text-red-500"/>}
                                    {t.description}
                                </div>
                                </TableCell>
                                <TableCell>
                                <Badge variant={t.status === 'completed' ? 'default' : t.status === 'pending' ? 'secondary' : 'destructive'}>
                                    {t.status}
                                </Badge>
                                </TableCell>
                                <TableCell className={cn("font-semibold", t.amount > 0 ? "text-green-500" : "text-red-500")}>
                                    {t.amount > 0 ? '+' : ''}₹{t.amount.toFixed(2)}
                                </TableCell>
                                <TableCell>{t.createdAt?.toDate().toLocaleString()}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}

    