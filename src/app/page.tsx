import { Button } from "@/components/ui/button";
import { Swords, Star, TrendingUp, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen font-sans bg-gradient-to-br from-background via-background to-primary/10 text-foreground">
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 lg:px-6 h-16 flex items-center bg-background/80 backdrop-blur-sm border-b border-border/60">
        <Link href="/" className="flex items-center justify-center gap-2">
          <div className="p-2 bg-gradient-to-r from-primary to-accent rounded-lg shadow-md">
            <Swords className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold font-headline bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            LudoLeague
          </span>
        </Link>
        <nav className="ml-auto flex gap-2 sm:gap-4">
          <Button variant="ghost" asChild className="text-foreground/80 hover:text-foreground hover:bg-foreground/10 transition-colors">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-105">
            <Link href="/signup">Sign Up</Link>
          </Button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="relative w-full min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 opacity-5"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background"></div>
            <div className="absolute w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-slow -top-16 -left-16"></div>
            <div className="absolute w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse-slow-delay bottom-0 -right-16"></div>

            <div className="container px-4 md:px-6 z-10">
            <div className="flex flex-col justify-center items-center space-y-6 text-center">
                <div className="space-y-4">
                <h1 className="text-5xl font-bold tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl/none font-headline bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 py-2">
                    Where Champions Compete
                </h1>
                <p className="max-w-[700px] text-muted-foreground text-lg md:text-xl">
                    Step into the arena. Challenge the best Ludo players, rise through the ranks, and claim your victory spoils. The digital board awaits its next champion.
                </p>
                </div>
                <div className="flex flex-col gap-4 min-[400px]:flex-row justify-center">
                <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-primary/50 transition-all duration-300 transform hover:scale-105 animate-pulse">
                    <Link href="/dashboard">Enter the Arena</Link>
                </Button>
                <Button size="lg" variant="secondary" asChild className="bg-accent/90 hover:bg-accent text-accent-foreground shadow-lg hover:shadow-accent/50 transition-all duration-300 transform hover:scale-105">
                    <Link href="/tournaments">See Tournaments</Link>
                </Button>
                </div>
            </div>
            </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-20 md:py-32 bg-background">
            <div className="container px-4 md:px-6">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold font-headline">Why LudoLeague?</h2>
                    <p className="text-muted-foreground mt-2">The ultimate fusion of classic board gaming and modern esports.</p>
                </div>
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    <div className="flex flex-col items-center text-center p-6 rounded-lg bg-card border border-border/60 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300">
                        <div className="p-4 bg-gradient-to-r from-primary to-accent rounded-full mb-4"><Star className="h-8 w-8 text-primary-foreground"/></div>
                        <h3 className="text-xl font-bold mb-2">Exciting Matches</h3>
                        <p className="text-muted-foreground">Create or join matches 24/7. Play against friends or find a worthy opponent from our global community.</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-6 rounded-lg bg-card border border-border/60 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300">
                        <div className="p-4 bg-gradient-to-r from-primary to-accent rounded-full mb-4"><TrendingUp className="h-8 w-8 text-primary-foreground"/></div>
                        <h3 className="text-xl font-bold mb-2">Rise the Ranks</h3>
                        <p className="text-muted-foreground">Compete in skill-based matchmaking. Track your stats, improve your game, and climb the leaderboard.</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-6 rounded-lg bg-card border border-border/60 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300">
                        <div className="p-4 bg-gradient-to-r from-primary to-accent rounded-full mb-4"><ShieldCheck className="h-8 w-8 text-primary-foreground"/></div>
                        <h3 className="text-xl font-bold mb-2">Secure & Fair Play</h3>
                        <p className="text-muted-foreground">Our platform ensures a secure environment with fair play policies and quick, reliable prize distribution.</p>
                    </div>
                </div>
            </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="py-6 w-full shrink-0 px-4 md:px-6 border-t border-border/60 bg-background">
        <div className="container flex flex-col gap-2 sm:flex-row items-center justify-between">
             <p className="text-xs text-muted-foreground">
                &copy; 2024 LudoLeague. All rights reserved.
            </p>
            <nav className="flex gap-4 sm:gap-6">
            <Link
                href="/terms"
                className="text-xs hover:underline underline-offset-4 text-muted-foreground hover:text-foreground transition-colors"
            >
                Terms of Service
            </Link>
            <Link
                href="/privacy"
                className="text-xs hover:underline underline-offset-4 text-muted-foreground hover:text-foreground transition-colors"
            >
                Privacy
            </Link>
            </nav>
        </div>
      </footer>
    </div>
  );
}
