
'use client';

import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Award, ShieldCheck, Swords, Users, Wallet, Zap, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const heroImage = PlaceHolderImages.find(p => p.id === 'hero');

export default function LandingPage() {
  const features = [
    {
      icon: Award,
      title: 'Win Real Cash',
      description: 'Engage in thrilling matches and win real money. Your skills pay off!',
    },
    {
      icon: Zap,
      title: 'Instant Withdrawals',
      description: 'Get your winnings transferred to your account instantly, anytime you want.',
    },
    {
      icon: ShieldCheck,
      title: 'Fair & Secure',
      description: 'Our platform ensures fair play with advanced anti-fraud systems and secure transactions.',
    },
     {
      icon: Users,
      title: 'Thriving Community',
      description: 'Join thousands of Ludo enthusiasts and make new friends (and rivals!).',
    },
  ];
  
  const testimonials = [
      {
          quote: "This is the best Ludo app I've ever played. The withdrawals are super fast!",
          author: "Rohan S.",
          location: "Mumbai"
      },
      {
          quote: "Finally, a fair and fun platform to play Ludo for real stakes. Highly recommended!",
          author: "Priya K.",
          location: "Delhi"
      },
      {
          quote: "I love the tournaments! The competition is fierce and the prize pools are huge.",
          author: "Amit G.",
          location: "Bangalore"
      }
  ]

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
            <Button asChild className="bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 text-white">
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[80vh] min-h-[500px] flex items-center justify-center text-center text-white">
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
          <div className="absolute inset-0 bg-black/70 -z-10" />
          <div className="container px-4 md:px-6">
            <div className="max-w-3xl mx-auto space-y-6">
              <h1 className="text-4xl md:text-6xl font-extrabold font-headline tracking-tight animate-fade-in" style={{animationDelay: '0.2s'}}>
                India's Most Thrilling Ludo Arena
              </h1>
              <p className="md:text-xl text-lg text-primary-foreground/90 animate-fade-in" style={{animationDelay: '0.4s'}}>
                Where Skill Meets Fortune. Play, Compete, and Win Real Cash Prizes 24/7.
              </p>
              <div className="flex justify-center gap-4 animate-fade-in" style={{animationDelay: '0.6s'}}>
                <Button size="lg" asChild className="bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 text-white shadow-lg transform hover:scale-105 transition-transform">
                  <Link href="/signup">Claim Your Bonus Now</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section id="features" className="py-16 md:py-24 bg-card">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold font-headline">The LudoLeague Advantage</h2>
              <p className="text-muted-foreground mt-2">More than just a game. It's a premium experience.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="text-center p-2">
                  <div className="inline-block p-4 bg-primary/10 text-primary rounded-full mb-4 transition-transform transform hover:scale-110 hover:rotate-12">
                    <feature.icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 md:py-24 bg-muted/40">
           <div className="container px-4 md:px-6">
             <div className="text-center mb-12">
              <h2 className="text-3xl font-bold font-headline">Start Winning in 3 Easy Steps</h2>
            </div>
            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Dashed line for desktop */}
              <div className="hidden md:block absolute top-8 left-0 w-full h-px bg-border -translate-y-1/2 border-t-2 border-dashed"></div>
               <div className="relative flex flex-col items-center text-center p-4">
                <div className="h-16 w-16 bg-card text-primary rounded-full flex items-center justify-center text-3xl font-bold mb-4 z-10 border-4 border-muted/40 shadow-md">1</div>
                <h3 className="text-xl font-bold">Sign Up & KYC</h3>
                <p className="text-sm text-muted-foreground mt-2">Create your free account and complete a quick KYC to get started.</p>
              </div>
              <div className="relative flex flex-col items-center text-center p-4">
                 <div className="h-16 w-16 bg-card text-primary rounded-full flex items-center justify-center text-3xl font-bold mb-4 z-10 border-4 border-muted/40 shadow-md">2</div>
                <h3 className="text-xl font-bold">Add Funds</h3>
                <p className="text-sm text-muted-foreground mt-2">Securely add money to your wallet using UPI or other payment methods.</p>
              </div>
               <div className="relative flex flex-col items-center text-center p-4">
                 <div className="h-16 w-16 bg-card text-primary rounded-full flex items-center justify-center text-3xl font-bold mb-4 z-10 border-4 border-muted/40 shadow-md">3</div>
                <h3 className="text-xl font-bold">Play & Win</h3>
                <p className="text-sm text-muted-foreground mt-2">Join a match, defeat your opponent, and your winnings are instantly credited!</p>
              </div>
            </div>
           </div>
        </section>
        
         {/* Testimonials Section */}
        <section className="py-16 md:py-24 bg-card">
           <div className="container">
              <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold font-headline">Don't Just Take Our Word For It</h2>
                  <p className="text-muted-foreground mt-2">See what our players have to say about their experience.</p>
              </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {testimonials.map((testimonial, index) => (
                    <div key={index} className="bg-muted/50 p-6 rounded-lg shadow-sm">
                        <div className="flex text-yellow-400 mb-4">
                            {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-current" />)}
                        </div>
                        <p className="text-foreground mb-4">"{testimonial.quote}"</p>
                        <p className="font-bold text-right">- {testimonial.author}, <span className="text-muted-foreground">{testimonial.location}</span></p>
                    </div>
                ))}
              </div>
           </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 md:py-24 bg-primary text-primary-foreground">
           <div className="container text-center">
              <h2 className="text-3xl md:text-4xl font-extrabold font-headline">Ready to Roll the Dice?</h2>
              <p className="mt-4 max-w-xl mx-auto opacity-90">Join over 50,000 happy players and start your journey to becoming a Ludo champion today. Your first match is just a click away!</p>
              <Button size="lg" className="mt-8 bg-background text-primary hover:bg-background/90 shadow-lg" asChild>
                <Link href="/signup">Sign Up and Play Now</Link>
              </Button>
           </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-muted/40 border-t">
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

