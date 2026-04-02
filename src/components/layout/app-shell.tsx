"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Menu, X, LayoutDashboard, Target, Trophy, HeartHandshake, User, ShieldAlert, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

interface AppShellProps {
  children: React.ReactNode
  userRole?: 'subscriber' | 'admin' | null
}

export function AppShell({ children, userRole = 'subscriber' }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const subscriberNav = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Scores', href: '/scores', icon: Target },
    { name: 'Charity', href: '/charity', icon: HeartHandshake },
  ]

  const adminNav = [
    { name: 'Overview', href: '/admin', icon: ShieldAlert },
    { name: 'Winners', href: '/admin/winners', icon: Trophy },
  ]

  const navItems = userRole === 'admin' ? adminNav : subscriberNav

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Mobile Top Navbar */}
      <div className="md:hidden flex items-center justify-between border-b bg-background px-4 py-3 sticky top-0 z-50">
        <Link href="/" className="font-bold tracking-tight flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-primary flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-background" />
          </div>
          GolfSub
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <div className="fixed inset-y-0 left-0 w-64 bg-card border-r shadow-lg p-4 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8">
              <span className="font-bold">Menu</span>
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <nav className="flex flex-col gap-2 flex-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
            <Button variant="ghost" className="justify-start gap-3 text-muted-foreground mt-4" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      )}

      {/* Desktop Layout */}
      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex flex-col w-64 border-r bg-card min-h-screen sticky top-0">
          <div className="p-6 border-b">
            <Link href="/" className="text-xl font-bold tracking-tighter flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-background" />
              </div>
              GolfSub
            </Link>
          </div>
          <nav className="flex flex-col gap-2 p-4 flex-1 mt-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isActive ? "bg-primary/10 text-primary border border-primary/20" : "hover:bg-muted text-muted-foreground hover:text-foreground border border-transparent"
                  }`}
                >
                  <item.icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'opacity-70'}`} />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          <div className="p-4 border-t border-border/50">
            <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-[100vw]">
          {children}
        </main>
      </div>
    </div>
  )
}
