
'use client';
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { ArrowDownLeft, ArrowUpRight, UploadCloud, DownloadCloud, Landmark, Wallet as WalletIcon, AlertCircle, Loader2, ScanQrCode, ExternalLink, History } from "lucide-react"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { useUser, useFirestore } from "@/firebase"
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp, doc } from "firebase/firestore"
import { useEffect, useState } from "react"
import type { Transaction, UpiConfiguration, DepositRequest, WithdrawalRequest } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage"
import { PlaceHolderImages } from '@/lib/placeholder-images';

const bannerImage = PlaceHolderImages.find(img => img.id === 'banner-wallet');

const DynamicQrCode = ({ upiId, amount }: { upiId: string | null, amount: number }) => {
  if (!upiId) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-4 bg-muted/50 rounded-lg h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary"/>
        <p className="text-sm text-center text-muted-foreground">Loading Payment Details...</p>
      </div>
    );
  }
  
  const upiUrl = `upi://pay?pa=${upiId}&pn=LudoLeague&am=${amount.toFixed(2)}&cu=INR`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`;

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <p className="text-sm text-center text-muted-foreground">Scan the QR or use the button below.</p>
        <Image src={qrUrl} alt="QR Code for payment" width={200} height={200} className="rounded-lg border-2 shadow-md bg-white" data-ai-hint="qr code for upi payment with amount" />
        <p className="font-bold text-center text-sm">UPI ID: {upiId}</p>
        <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
          <a href={upiUrl}>
            <ExternalLink className="mr-2 h-4 w-4"/>
            Pay with UPI App
          </a>
        </Button>
    </div>
  );
};


export default function WalletPage() {
  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [depositHistory, setDepositHistory] = useState<DepositRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [depositAmount, setDepositAmount] = useState(100);
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

    setLoading(true);

    const transRef = collection(firestore, 'transactions');
    const qTrans = query(transRef, where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
    
    const unsubscribeTrans = onSnapshot(qTrans, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
        setTransactions(data);
        setLoading(false);
    });

    const depositRef = collection(firestore, 'depositRequests');
    const qDeposits = query(depositRef, where('userId', '==', user.uid), orderBy('createdAt', 'desc'));

    const unsubscribeDeposits = onSnapshot(qDeposits, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DepositRequest));
        setDepositHistory(data);
    });

    return () => {
        unsubscribeTrans();
        unsubscribeDeposits();
    };
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
    const utr = formData.get('utr') as string;
    
    if (depositAmount < 100) {
        toast({ title: "Invalid Amount", description: "Minimum deposit amount is ₹100.", variant: "destructive"});
        return;
    }
    
    if(!utr) {
        toast({title: "UTR / Transaction ID is required.", variant: "destructive"});
        return;
    }
    
    setIsSubmitting(true);
    try {
        const dataUrl = await getFileAsDataUrl(depositScreenshot);
        const storage = getStorage();
        const storageRef = ref(storage, `deposits/${user.uid}/${Date.now()}`);

        await uploadString(storageRef, dataUrl, 'data_url');
        const screenshotUrl = await getDownloadURL(storageRef);

        await addDoc(collection(firestore, 'depositRequests'), {
            userId: user.uid,
            amount: depositAmount,
            utr,
            screenshotUrl,
            status: 'pending',
            createdAt: serverTimestamp(),
            userName: user.displayName, // For easier review in admin panel
        } as Omit<DepositRequest, 'id'>);
        
        toast({ title: "Deposit request submitted successfully.", description: "Your request is under review and will be processed shortly." });
        (e.target as HTMLFormElement).reset();
        setDepositScreenshot(null);
        setDepositAmount(100);

    } catch (error: any) {
        console.error("Deposit Error:", error);
        toast({ title: "Deposit Failed", description: error.message || "An unexpected error occurred.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
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
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get('withdraw-amount'));

    if (!amount || amount < 300) {
        toast({ title: "Invalid Amount", description: "Minimum withdrawal is ₹300.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }
    if (amount > balance) {
        toast({ title: "Insufficient Balance", variant: "destructive"});
        setIsSubmitting(false);
        return;
    }

    try {
        await addDoc(collection(firestore, 'withdrawalRequests'), {
            userId: user.uid,
            amount,
            status: 'pending',
            createdAt: serverTimestamp(),
            upiId: userProfile?.upiId || '',
            bankDetails: userProfile?.bankDetails || '',
            userName: user.displayName, // For admin panel
        } as Omit<WithdrawalRequest, 'id'>);
        toast({ title: "Withdrawal request submitted successfully." });
        (e.target as HTMLFormElement).reset();
    } catch(error: any) {
        toast({ title: "Request Failed", description: error.message, variant: "destructive" });
    } finally {
        setIsSubmitting(false);
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
        <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="grid gap-2">
                    <CardTitle>Current Balance</CardTitle>
                    <CardDescription>Total funds available for matches.</CardDescription>
                </div>
                <div className="text-4xl font-bold text-primary">
                    ₹{balance.toFixed(2)}
                </div>
            </CardHeader>
        </Card>

        <Tabs defaultValue="deposit" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="deposit"><UploadCloud className="mr-2 h-4 w-4"/>Deposit</TabsTrigger>
                <TabsTrigger value="withdraw"><DownloadCloud className="mr-2 h-4 w-4"/>Withdraw</TabsTrigger>
                <TabsTrigger value="history"><History className="mr-2 h-4 w-4"/>History</TabsTrigger>
            </TabsList>
            <TabsContent value="deposit">
                <Card className="shadow-md">
                    <form onSubmit={handleDepositSubmit}>
                        <CardHeader>
                            <CardTitle>Deposit Funds</CardTitle>
                            <CardDescription>Add money to your wallet to join matches.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <Alert variant="destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle>Important: Name Match Required</AlertTitle>
                                        <AlertDescription>
                                            Please deposit from a bank account or UPI ID where the name matches your KYC documents. Mismatched names will result in rejection.
                                        </AlertDescription>
                                    </Alert>
                                    <div className="grid gap-2">
                                        <Label htmlFor="deposit-amount">Amount (Min. ₹100)</Label>
                                        <Input name="deposit-amount" id="deposit-amount" value={depositAmount} onChange={(e) => setDepositAmount(Number(e.target.value))} placeholder="e.g., 500" type="number" required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="utr">UTR / Transaction ID</Label>
                                        <Input name="utr" id="utr" placeholder="Enter the 12-digit UTR number" required />
                                    </div>
                                     <div className="grid gap-2">
                                        <Label htmlFor="screenshot">Payment Screenshot</Label>
                                        <Input name="screenshot" id="screenshot" type="file" required onChange={(e) => setDepositScreenshot(e.target.files?.[0] || null)} className="file:text-primary"/>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col gap-4">
                                    {depositAmount >= 100 ? (
                                        <DynamicQrCode upiId={activeUpiId} amount={depositAmount} />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center gap-4 p-4 bg-muted/50 rounded-lg h-full">
                                            <ScanQrCode className="h-10 w-10 text-muted-foreground"/>
                                            <p className="text-sm text-center text-muted-foreground">Enter an amount of ₹100 or more to generate QR code.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                         <CardFooter>
                            <Button type="submit" disabled={isSubmitting} className="w-full">
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                Submit Deposit Request
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </TabsContent>
            <TabsContent value="withdraw">
                <Card className="shadow-md">
                    <form onSubmit={handleWithdrawalSubmit}>
                        <CardHeader>
                            <CardTitle>Withdraw Funds</CardTitle>
                            <CardDescription>Request a withdrawal to your verified account.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            <Alert>
                                <Landmark className="h-4 w-4" />
                                <AlertTitle>Withdrawal Policy</AlertTitle>
                                <AlertDescription>
                                    KYC must be approved. Minimum withdrawal is ₹300. Requests may take up to 24 hours to process.
                                </AlertDescription>
                            </Alert>
                            <div className="grid gap-2">
                                <Label htmlFor="withdraw-amount">Amount (Min. ₹300)</Label>
                                <Input name="withdraw-amount" id="withdraw-amount" placeholder="e.g., 1000" type="number" required />
                            </div>
                        </CardContent>
                        <CardFooter className="flex-col gap-4">
                             <Button type="submit" variant="destructive" className="w-full" disabled={isSubmitting || userProfile?.kycStatus !== 'approved'}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                Request Withdrawal
                            </Button>
                             {userProfile?.kycStatus !== 'approved' && (
                                 <p className="text-sm w-full text-center text-red-500">KYC must be approved to enable withdrawals.</p>
                            )}
                        </CardFooter>
                    </form>
                </Card>
            </TabsContent>
            <TabsContent value="history">
                <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle>Deposit & Withdrawal History</CardTitle>
                        <CardDescription>An overview of your recent deposit and withdrawal requests.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Reason</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && <TableRow><TableCell colSpan={4} className="text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto"/></TableCell></TableRow>}
                                {!loading && depositHistory.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No deposit history found.</TableCell></TableRow>}
                                {!loading && depositHistory.map((req) => (
                                    <TableRow key={req.id}>
                                        <TableCell>{req.createdAt?.toDate().toLocaleDateString()}</TableCell>
                                        <TableCell className="font-semibold text-green-500">₹{req.amount.toFixed(2)}</TableCell>
                                        <TableCell>
                                            <Badge variant={req.status === 'approved' ? 'default' : req.status === 'pending' ? 'secondary' : 'destructive'} className={cn({'bg-green-100 text-green-800': req.status === 'approved'})}>
                                                {req.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{req.rejectionReason || 'N/A'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>

        <Card className="shadow-md">
            <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>A log of all movements in your wallet balance.</CardDescription>
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
                        {!loading && transactions.slice(0,10).map((t) => (
                            <TableRow key={t.id}>
                                <TableCell>
                                <div className="font-medium flex items-center gap-2">
                                     {t.amount >= 0 ? <ArrowUpRight className="h-4 w-4 text-green-500"/> : <ArrowDownLeft className="h-4 w-4 text-red-500"/>}
                                    {t.description || t.type.replace('-', ' ')}
                                </div>
                                </TableCell>
                                <TableCell>
                                <Badge variant={t.status === 'completed' ? 'default' : t.status === 'pending' ? 'secondary' : 'destructive'} className={cn({'bg-green-100 text-green-800': t.status === 'completed'})}>
                                    {t.status}
                                </Badge>
                                </TableCell>
                                <TableCell className={cn("font-semibold", t.amount >= 0 ? "text-green-500" : "text-red-500")}>
                                    {t.amount >= 0 ? '+' : ''}₹{t.amount.toFixed(2)}
                                </TableCell>
                                <TableCell>{t.createdAt?.toDate().toLocaleString()}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  )
}
