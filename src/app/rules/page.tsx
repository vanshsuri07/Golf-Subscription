import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Charity Rules — GolfSub",
};

export default function RulesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground pt-24 pb-24 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>
        <h1 className="text-4xl font-extrabold mb-8">Charity Rules</h1>
        <p className="text-muted-foreground mb-4">Last Updated: {new Date().toLocaleDateString()}</p>
        <div className="prose prose-slate dark:prose-invert">
          <p>This is a placeholder for the Charity Rules.</p>
          <p>These rules govern how subscriptions are managed, draws are hosted, and charity contributions are distributed.</p>
        </div>
      </div>
    </div>
  );
}
