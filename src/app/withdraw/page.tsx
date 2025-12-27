
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { httpsCallable } from 'firebase/functions';
import { useUser, useFunctions } from '@/firebase';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const withdrawalSchema = z.object({
  amount: z.coerce.number().min(300, "Minimum withdrawal amount is ₹300."),
  method: z.enum(['upi', 'bank'], { required_error: "You must select a withdrawal method." }),
  details: z.string().min(1, "Payment details are required."),
});

export default function WithdrawPage() {
  const router = useRouter();
  const { toast } = useToast();
  const functions = useFunctions();
  const { userData, loading: userLoading } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof withdrawalSchema>>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: 300,
      method: 'upi',
      details: '',
    },
  });

  const { watch } = form;
  const selectedMethod = watch('method');

  const onSubmit = async (values: z.infer<typeof withdrawalSchema>) => {
    if (!functions) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not connect to services.' });
      return;
    }
    if ((userData?.wallet.balance || 0) < values.amount) {
        form.setError('amount', { message: 'Withdrawal amount cannot exceed your balance.' });
        return;
    }

    setIsSubmitting(true);
    
    try {
      const createWithdrawalRequest = httpsCallable(functions, 'createWithdrawalRequest');
      await createWithdrawalRequest(values);
      toast({ title: 'Withdrawal Request Submitted', description: 'Your request is being processed and will be reviewed by an admin.' });
      router.push('/wallet/history');
    } catch (error: any) {
      console.error("Withdrawal Error:", error);
      toast({ variant: 'destructive', title: 'Request Failed', description: error.message || 'An unexpected error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const balance = userData?.wallet.balance || 0;

  return (
    <AppShell pageTitle="Withdraw Funds" showBackButton>
      <div className="flex justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Request Withdrawal</CardTitle>
                  <CardDescription>Enter the amount you wish to withdraw from your wallet.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted border">
                    <p className="text-sm text-muted-foreground">Available Balance</p>
                    {userLoading ? <Skeleton className="h-8 w-32 mt-1" /> : (
                      <p className="text-3xl font-bold">₹{balance.toLocaleString('en-IN')}</p>
                    )}
                  </div>
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount to Withdraw (INR)</FormLabel>
                        <FormControl>
                            <Input type="number" {...field} placeholder="300" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                    <CardTitle>Payment Method</CardTitle>
                    <CardDescription>Where should we send your money?</CardDescription>
                </CardHeader>
                <CardContent>
                    <FormField
                        control={form.control}
                        name="method"
                        render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4">
                                     <FormItem>
                                        <FormControl>
                                            <RadioGroupItem value="upi" id="upi" className="sr-only" />
                                        </FormControl>
                                        <FormLabel htmlFor="upi" className="flex flex-col items-center justify-center gap-2 cursor-pointer border rounded-lg p-4 has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:checked]:border-primary">UPI</FormLabel>
                                     </FormItem>
                                     <FormItem>
                                        <FormControl>
                                            <RadioGroupItem value="bank" id="bank" className="sr-only" />
                                        </FormControl>
                                        <FormLabel htmlFor="bank" className="flex flex-col items-center justify-center gap-2 cursor-pointer border rounded-lg p-4 has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:checked]:border-primary">Bank Transfer</FormLabel>
                                     </FormItem>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage className="pt-2"/>
                        </FormItem>
                    )}/>
                    
                    <FormField
                        control={form.control}
                        name="details"
                        render={({ field }) => (
                        <FormItem className="mt-4">
                            <FormLabel>{selectedMethod === 'upi' ? 'UPI ID' : 'Bank Account Number'}</FormLabel>
                             <FormControl>
                                <Input {...field} placeholder={selectedMethod === 'upi' ? 'yourname@bank' : 'Enter your account number'} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                </CardContent>
              </Card>
              
               <Button type="submit" size="lg" className="w-full" disabled={isSubmitting || userLoading}>
                    {isSubmitting ? 'Submitting Request...' : `Submit Request`}
                </Button>
            </form>
          </Form>
        </div>
      </div>
    </AppShell>
  );
}
