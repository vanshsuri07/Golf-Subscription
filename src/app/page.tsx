import { PageTransition } from "@/components/ui/page-transition"
import { Hero } from "@/components/marketing/hero"
import { Features } from "@/components/marketing/features"
import { Pricing } from "@/components/marketing/pricing"
import { Footer } from "@/components/marketing/footer"

export default async function Page() {
  return (
    <div className="min-h-screen bg-background font-sans antialiased text-foreground selection:bg-primary/30">
      <nav className="fixed top-0 inset-x-0 h-16 z-50 border-b bg-background/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="text-xl font-bold tracking-tighter flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-primary flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-background" />
          </div>
          GolfSub
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          <a href="/login" className="hover:text-primary transition-colors">Sign In</a>
          <a href="/login" className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-opacity">Get Started</a>
        </div>
      </nav>

      <PageTransition>
        <main>
          <Hero />
          <Features />
          <Pricing />
        </main>
        <Footer />
      </PageTransition>
    </div>
  )
}
