
import { cn } from "@/lib/utils";

interface StaticPageProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
}

export function StaticPage({ title, subtitle, children }: StaticPageProps) {
    return (
        <div className="container max-w-4xl py-12 md:py-20">
            <div className="space-y-2 mb-8 md:mb-12 text-center">
                <h1 className="text-3xl md:text-4xl font-headline font-bold tracking-tighter">{title}</h1>
                {subtitle && <p className="text-lg text-muted-foreground">{subtitle}</p>}
            </div>
            <div className={cn(
                "prose prose-quoteless prose-neutral dark:prose-invert max-w-none",
                "prose-headings:font-headline prose-headings:tracking-tighter prose-headings:text-primary",
                "prose-h2:text-2xl prose-h3:text-xl",
                "prose-strong:font-semibold prose-strong:text-foreground",
                "prose-a:text-primary hover:prose-a:text-primary/80 transition-colors"
            )}>
                {children}
            </div>
        </div>
    );
}
