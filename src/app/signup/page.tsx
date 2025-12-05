
'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useFirebase } from '@/firebase/provider';
import { createUserWithEmailAndPassword, sendEmailVerification, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useState } from 'react';

const formSchema = z
  .object({
    fullName: z.string().min(1, 'Full name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(10, 'Phone number must be at least 10 digits'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    otp: z.string().length(6, 'OTP must be 6 digits'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export default function SignupPage() {
  const { auth, firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      otp: '',
    },
  });

  const handleSendOtp = async () => {
    if (!auth) return;
    try {
      const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
      });
      const phoneNumber = `+${form.getValues('phone')}`;
      const result = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      setConfirmationResult(result);
      setOtpSent(true);
      toast({ title: 'OTP Sent', description: 'An OTP has been sent to your phone.' });
    } catch (error) {
      console.error('OTP error:', error);
      toast({ variant: 'destructive', title: 'OTP Failed', description: 'Could not send OTP. Please try again.' });
    }
  };


  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!auth || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: 'Firebase not initialized. Please try again later.',
      });
      return;
    }

    try {
        if (!confirmationResult) {
            toast({ variant: 'destructive', title: 'OTP Verification Failed', description: 'Please send an OTP first.' });
            return;
        }
      const credential = await confirmationResult.confirm(values.otp);
      const user = credential.user;

      await sendEmailVerification(user);

      await setDoc(doc(firestore, 'users', user.uid), {
        uid: user.uid,
        name: values.fullName,
        email: values.email,
        phone: values.phone,
        role: 'user', // Default role
        walletBalance: 0, // Initial wallet balance
        isVerified: false, // Email not verified yet
        createdAt: new Date(),
      });

      toast({
        title: 'Account Created!',
        description: 'We have sent a verification link to your email. Please verify to log in.',
      });

      router.push('/login');
    } catch (error: any) {
      console.error('Signup error:', error);
      let description = 'An unexpected error occurred. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        description = 'This email is already registered. Please sign in instead.';
      } else if (error.code === 'auth/weak-password') {
        description = 'The password is too weak. Please choose a stronger password.';
      } else if (error.code === 'auth/invalid-verification-code') {
        description = 'The OTP you entered is incorrect. Please try again.';
      }
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description,
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div id="recaptcha-container"></div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="flex justify-center mb-4">
            <div className="p-2 bg-primary rounded-lg">
              <Image src="/logo.svg" alt="LudoLeague Logo" width={32} height={32} />
            </div>
          </Link>
          <CardTitle className="text-3xl font-headline">Create an Account</CardTitle>
          <CardDescription>Join LudoLeague to start playing and winning!</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="m@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="+91 98765 43210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {otpSent ? (
                <FormField
                  control={form.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>OTP</FormLabel>
                      <FormControl>
                        <Input placeholder="_ _ _ _ _ _" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <Button type="button" className="w-full" onClick={handleSendOtp}>
                  Send OTP
                </Button>
              )}

              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
