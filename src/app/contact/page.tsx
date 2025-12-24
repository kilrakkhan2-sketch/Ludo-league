
'use client';

import { useState, useEffect, useTransition } from 'react';
import { submitContactForm, type ContactFormState } from '@/actions/contact';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast'; // Corrected import path
import { LoaderCircle } from 'lucide-react';

const initialState: ContactFormState = {
  success: false,
  message: '',
};

function SubmitButton() {
    const [isPending, startTransition] = useTransition();
  
    return (
      <Button type="submit" disabled={isPending} className="w-full font-bold">
        {isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
        Send Message
      </Button>
    );
}

export default function ContactPage() {
  const { toast } = useToast();
  const [state, setState] = useState<ContactFormState>(initialState);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
        const result = await submitContactForm(initialState, formData);
        setState(result);
    });
  }

  useEffect(() => {
    if (state.message) {
        toast({
            title: state.success ? 'Success!' : 'Oops!',
            description: state.message,
            variant: state.success ? 'default' : 'destructive',
        });
    }
  }, [state, toast]);

  return (
    <div className="container py-12 md:py-20">
        <div className="max-w-xl mx-auto">
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-headline">Contact Us</CardTitle>
                    <CardDescription>Have a question or need to report an issue? Fill out the form below.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" name="name" placeholder="John Doe" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" name="email" type="email" placeholder="john.doe@example.com" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="message">Your Message</Label>
                            <Textarea id="message" name="message" placeholder="Please describe your issue or question..." required minLength={10}/>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col items-center">
                        <SubmitButton />
                    </CardFooter>
                </form>
            </Card>
        </div>
    </div>
  );
}
