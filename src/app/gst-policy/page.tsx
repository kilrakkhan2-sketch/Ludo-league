
import Link from 'next/link';

export default function GstPolicyPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <h1 className="text-4xl font-bold mb-4">GST Policy</h1>
      <p className="text-lg text-muted-foreground mb-8">This is the placeholder for the GST Policy page.</p>
      <Link href="/dashboard">
        <span className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">Go to Dashboard</span>
      </Link>
    </div>
  );
}
