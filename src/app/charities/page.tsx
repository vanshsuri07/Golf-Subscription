import { pool } from "@/lib/db";
import { SPACING } from "@/lib/design-tokens";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HeartHandshake } from "lucide-react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Charity Directory — GolfSub",
  description: "Explore the charities supported by GolfSub subscriptions.",
};

export default async function CharitiesPage() {
  const result = await pool.query(
    "SELECT id, name, description FROM public.charities ORDER BY name ASC"
  );
  
  const charities = result.rows || [];

  return (
    <div className="min-h-screen bg-background text-foreground pt-24 pb-24 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl mb-4 text-foreground">
            Supported Charities
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-muted-foreground">
            A portion of every subscription goes directly to your chosen charity. Explore the amazing organizations we support.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {charities.map((charity) => (
            <Card key={charity.id} className="border-border/50">
              <CardHeader>
                <div className="mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <HeartHandshake className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>{charity.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  {charity.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
          {charities.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No charities found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
