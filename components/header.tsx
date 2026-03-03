"use client"

import { useMigration } from "@/context/migration-context"
import { Button } from "@/components/ui/button"
import { LogOut, User } from "lucide-react"
import { useRouter } from "next/navigation"

export function Header() {
  const { email, logout } = useMigration()
  const router = useRouter()

  function handleLogout() {
    logout()
    router.push("/")
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
      <div className="relative flex items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute -inset-2 rounded-full bg-primary/20 blur-md" />
            <img src="/logo-reduzida.png" alt="Jet Migration" className="relative h-8 w-auto object-contain drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-foreground">
              Jet Migration
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {email && (
            <div className="hidden items-center gap-2 rounded-lg border border-border/50 bg-secondary/50 px-3 py-1.5 md:flex">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                <User className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">
                {email}
              </span>
            </div>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout} 
            className="gap-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
