"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMigration } from "@/context/migration-context"
import { login } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2, Mail, KeyRound, ArrowRight } from "lucide-react"
import { toast } from "sonner"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [secret, setSecret] = useState("")
  const [loading, setLoading] = useState(false)
  const { setAuth } = useMigration()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !secret) {
      toast.error("Preencha todos os campos.")
      return
    }

    setLoading(true)
    try {
      const { token } = await login(email, secret)
      setAuth(token, email)
      toast.success("Login realizado com sucesso!")
      router.push("/dashboard")
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Credenciais invalidas. Verifique seu email e client secret."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      {/* Background gradient base */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/30 via-background to-background" />
      
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40" />
      
      {/* Green ambient lighting - improved */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-b from-emerald-500/30 via-emerald-600/15 to-transparent blur-[100px]" />
      <div className="pointer-events-none absolute top-1/4 -right-32 h-[600px] w-[600px] rounded-full bg-gradient-to-l from-emerald-500/25 via-teal-600/10 to-transparent blur-[80px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-t from-emerald-600/20 via-emerald-700/10 to-transparent blur-[90px]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px]" />
      
      {/* Vignette effect */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />


      <div className="relative z-10 w-full max-w-md">
        {/* Logo and branding */}
        <div className="mb-8 flex flex-col items-center">
          <div className="relative mb-4">
            <div className="absolute inset-0 animate-pulse-glow rounded-full bg-primary/30 blur-2xl" />
            <img src="/logo-reduzida.png" alt="Jet Migration" className="relative h-20 w-auto object-contain drop-shadow-[0_0_25px_rgba(16,185,129,0.3)]" />
          </div>
          <h1 className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
            Jet Migration
          </h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Plataforma de migração de templates WhatsApp
          </p>
        </div>

        {/* Login card */}
        <Card className="gradient-border card-hover border-0 bg-card/80 backdrop-blur-sm">
          <CardContent className="px-6 pb-8 pt-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Mail className="h-3.5 w-3.5 text-primary" />
                  Email
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 border-border/50 bg-secondary pl-4 focus:border-primary/50"
                    autoComplete="email"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="secret" className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <KeyRound className="h-3.5 w-3.5 text-primary" />
                  Client Secret
                </Label>
                <div className="relative">
                  <Input
                    id="secret"
                    type="password"
                    placeholder="Seu client secret"
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    className="h-11 border-border/50 bg-secondary pl-4 focus:border-primary/50"
                    autoComplete="current-password"
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                disabled={loading} 
                className="btn-tech mt-3 h-11 w-full border-0 text-primary-foreground"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Autenticando...
                  </>
                ) : (
                  <>
                    Entrar na plataforma
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground/60">
            Migração segura e automatizada de templates
          </p>
        </div>
      </div>
    </div>
  )
}
