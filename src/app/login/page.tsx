import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import LoginForm from "./LoginForm";

export const metadata = {
  title: "Sign In — GolfSub",
  description: "Sign in or create your GolfSub account to start tracking scores and entering draws.",
};

export default async function LoginPage() {
  const supabase = createClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // Check role for redirect
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "admin") {
      redirect("/admin");
    }
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      {/* Background gradient */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <a href="/" className="text-2xl font-bold tracking-tighter flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <div className="w-3.5 h-3.5 rounded-full bg-background" />
            </div>
            GolfSub
          </a>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
