
'use client';

import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Award, ShieldCheck, Swords, Users, Wallet } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const heroImage = PlaceHolderImages.find(p => p.id === 'hero');

export default function LandingPage() {
  const features = [
    {
      icon: Swords,
      title: 'Play & Compete',
      description: 'Challenge players from around the country in exciting Ludo matches.',
    },
    {
      icon: Wallet,
      title: 'Secure Wallet',
      description: 'Easily add and withdraw money with our secure and reliable wallet system.',
    },
    {
      icon: Award,
      title: 'Win Big Prizes',
      description: 'Participate in matches and tournaments to win real cash prizes.',
    },
    {
      icon: Users,
      title: 'Refer & Earn',
      description: 'Invite your friends to join and earn a commission on their deposits.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex items-center">
            <Link href="/" className="flex items-center gap-2 font-bold">
               <div className="p-1 bg-primary rounded-md">
                <Image src="/favicon.ico" alt="LudoLeague Logo" width={24} height={24} />
              </div>
              <span className="font-headline text-lg">LudoLeague</span>
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[60vh] min-h-[400px] flex items-center justify-center text-center text-white">
          {heroImage && (
             <Image
                src={heroImage.imageUrl}
                alt={heroImage.description}
                data-ai-hint={heroImage.imageHint}
                fill
                className="object-cover -z-10"
                priority
             />
          )}
          <div className="absolute inset-0 bg-black/60 -z-10" />
          <div className="container px-4 md:px-6">
            <div className="max-w-3xl mx-auto space-y-4">
              <h1 className="text-4xl md:text-6xl font-extrabold font-headline tracking-tight">
                The Ultimate Ludo Gaming Arena
              </h1>
              <p className="md:text-xl text-lg text-primary-foreground/90">
                Join thousands of players, compete in thrilling matches, and win real cash prizes. Your next victory awaits!
              </p>
              <div className="flex justify-center gap-4">
                <Button size="lg" asChild className="bg-primary hover:bg-primary-dark">
                  <Link href="/signup">Join Now for Free</Link>
                </Button>
                 <Button size="lg" variant="secondary" asChild>
                  <Link href="#features">Learn More</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section id="features" className="py-12 md:py-20 bg-muted/40">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold font-headline">Why You'll Love LudoLeague</h2>
              <p className="text-muted-foreground mt-2">Everything you need for a competitive and rewarding Ludo experience.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <div key={index} className="bg-card p-6 rounded-lg text-center shadow-sm hover:shadow-lg transition-shadow">
                  <div className="inline-block p-4 bg-primary/10 text-primary rounded-full mb-4">
                    <feature.icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-12 md:py-20">
           <div className="container px-4 md:px-6">
             <div className="text-center mb-10">
              <h2 className="text-3xl font-bold font-headline">Get Started in 3 Easy Steps</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Dashed line for desktop */}
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-px bg-border -translate-y-12 border-t-2 border-dashed"></div>

              <div className="relative flex flex-col items-center text-center">
                <div className="h-16 w-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mb-4 z-10 border-4 border-background">1</div>
                <h3 className="text-lg font-bold">Create an Account</h3>
                <p className="text-sm text-muted-foreground">Sign up for free and set up your player profile.</p>
              </div>
              <div className="relative flex flex-col items-center text-center">
                 <div className="h-16 w-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mb-4 z-10 border-4 border-background">2</div>
                <h3 className="text-lg font-bold">Join a Match</h3>
                <p className="text-sm text-muted-foreground">Add funds to your wallet and join an open match or tournament.</p>
              </div>
               <div className="relative flex flex-col items-center text-center">
                 <div className="h-16 w-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mb-4 z-10 border-4 border-background">3</div>
                <h3 className="text-lg font-bold">Win & Earn</h3>
                <p className="text-sm text-muted-foreground">Play your best, win the match, and see your winnings in your wallet!</p>
              </div>
            </div>
           </div>
        </section>

         {/* Why Choose Us Section */}
        <section className="py-12 md:py-20 bg-muted/40">
           <div className="container grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <h2 className="text-3xl font-bold font-headline">Fair, Secure, and Built for You</h2>
                <p className="text-muted-foreground mt-4 mb-6">We've built our platform from the ground up with the player in mind. From robust security to fast payouts, we've got you covered.</p>
                <div className="space-y-4">
                    <div className="flex items-start gap-4">
                        <ShieldCheck className="h-6 w-6 text-primary mt-1 shrink-0" />
                        <div>
                            <h4 className="font-semibold">Secure Transactions</h4>
                            <p className="text-sm text-muted-foreground">Your financial data is protected with industry-standard security measures.</p>
                        </div>
                    </div>
                     <div className="flex items-start gap-4">
                        <ShieldCheck className="h-6 w-6 text-primary mt-1 shrink-0" />
                        <div>
                            <h4 className="font-semibold">Instant Withdrawals</h4>
                            <p className="text-sm text-muted-foreground">Get your winnings quickly with our streamlined withdrawal process.</p>
                        </div>
                    </div>
                     <div className="flex items-start gap-4">
                        <ShieldCheck className="h-6 w-6 text-primary mt-1 shrink-0" />
                        <div>
                            <h4 className="font-semibold">24/7 Customer Support</h4>
                            <p className="text-sm text-muted-foreground">Our dedicated support team is here to help you around the clock.</p>
                        </div>
                    </div>
                </div>
              </div>
               <div className="flex items-center justify-center">
                    <div className="p-4 bg-gradient-to-br from-primary to-accent rounded-2xl shadow-2xl rotate-3">
                        <Image src="/favicon.ico" alt="LudoLeague Logo" width={160} height={160} />
                    </div>
                </div>
           </div>
        </section>
        
        {/* Final CTA */}
        <section className="py-16 md:py-24">
           <div className="container text-center">
              <h2 className="text-3xl font-bold font-headline">Ready to Roll the Dice?</h2>
              <p className="text-muted-foreground mt-2 max-w-xl mx-auto">Join the fastest-growing Ludo community and start your journey to becoming a Ludo champion today.</p>
              <Button size="lg" className="mt-6" asChild>
                <Link href="/signup">Sign Up and Play Now</Link>
              </Button>
           </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="container py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} LudoLeague. All rights reserved.</p>
          <div className="flex gap-4 text-sm">
            <Link href="/privacy" className="text-muted-foreground hover:text-primary">Privacy Policy</Link>
            <Link href="/terms" className="text-muted-foreground hover:text-primary">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
