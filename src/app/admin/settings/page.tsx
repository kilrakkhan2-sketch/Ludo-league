
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDoc } from "@/firebase";
import { useFirestore } from "@/firebase/provider";
import { doc, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useEffect } from "react";

type AppSettings = {
  id: string;
  upiId?: string;
}

const formSchema = z.object({
  upiId: z.string().min(1, 'UPI ID is required'),
});

export default function AdminSettingsPage() {
  const { data: settings, loading } = useDoc<AppSettings>('settings/payment');
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      upiId: '',
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({ upiId: settings.upiId || '' });
    }
  }, [settings, form]);


  const onSubmit = async (values: z.infer<typeof formSchema>>) => {
    if (!firestore) return;
    try {
      const settingsRef = doc(firestore, "settings", "payment");
      await setDoc(settingsRef, values, { merge: true });
      toast({
        title: "Success",
        description: `Settings updated successfully.`,
      });
    } catch (error) {
      console.error("Error updating settings: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update settings.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Site Settings</h1>
      <Card>
       <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Payment Settings</CardTitle>
            <CardDescription>
              Configure payment-related settings for the app.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <p>Loading settings...</p> : (
               <FormField
                control={form.control}
                name="upiId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UPI ID for Deposits</FormLabel>
                    <FormControl>
                      <Input placeholder="your-upi-id@bank" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={form.formState.isSubmitting || loading}>
                {form.formState.isSubmitting ? "Saving..." : "Save Settings"}
            </Button>
          </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}

