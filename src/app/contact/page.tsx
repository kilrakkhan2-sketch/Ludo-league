
'use client';

import { useState, useEffect, useTransition } from 'react';
import { submitContactForm, type ContactFormState } from '@/actions/contact';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle, LifeBuoy, ChevronDown } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const initialState: ContactFormState = {
  success: false,
  message: '',
};

const faqs = [
  {
    question: "My deposit is not reflecting in my wallet.",
    answer: "Deposits usually reflect instantly, but can sometimes take up to 15 minutes due to UPI network delays. If it's been longer, please fill out the contact form below with your Transaction ID."
  },
  {
    question: "How long do withdrawals take?",
    answer: "Withdrawal requests are processed by our team within 24 hours. Once approved, the amount should reflect in your bank account within 3-5 business days."
  },
  {
    question: "What happens if there is a result dispute?",
    answer: "If players submit conflicting results, the match is automatically flagged for review. Our support team will check the submitted proof and declare the correct winner. Deliberately submitting wrong results will lead to a penalty."
  }
];

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
    <AppShell pageTitle="Help & Support">
        <div className="p-4 sm:p-6 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><LifeBuoy className="text-primary"/> Frequently Asked Questions</CardTitle>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                        {faqs.map((faq, i) => (
                           <AccordionItem value={`item-${i}`} key={i}>
                               <AccordionTrigger>{faq.question}</AccordionTrigger>
                               <AccordionContent>
                                   {faq.answer}
                               </AccordionContent>
                           </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Still Need Help?</CardTitle>
                    <CardDescription>Fill out the form below and our support team will get back to you.</CardDescription>
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
                    <CardFooter>
                        <SubmitButton />
                    </CardFooter>
                </form>
            </Card>
        </div>
    </AppShell>
  );
}
