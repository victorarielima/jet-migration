"use client"

import { useState } from "react"
import { useMigration } from "@/context/migration-context"
import { fetchTemplates } from "@/lib/api"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2, ArrowRight, Upload, Download, ArrowDown, Sparkles, Server } from "lucide-react"
import { toast } from "sonner"

export function AppConfigForm() {
  const {
    token,
    sourceAppId,
    destinationAppId,
    setSourceAppId,
    setDestinationAppId,
    setTemplates,
    setCurrentStep,
  } = useMigration()
  const [loading, setLoading] = useState(false)

  async function handleFetch(e: React.FormEvent) {
    e.preventDefault()
    if (!sourceAppId.trim() || !destinationAppId.trim()) {
      toast.error("Preencha ambos os App IDs.")
      return
    }
    if (!token) {
      toast.error("Sessao expirada. Faca login novamente.")
      return
    }

    setLoading(true)
    try {
      const templates = await fetchTemplates(sourceAppId.trim(), token)
      if (templates.length === 0) {
        toast.warning("Nenhum template encontrado no app de origem.")
      } else {
        toast.success(`${templates.length} templates encontrados.`)
      }
      setTemplates(templates)
      setCurrentStep(2)
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Erro ao buscar templates."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex justify-center px-4">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
      </div>
      
      <Card className="gradient-border card-hover relative w-full max-w-lg border-0 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-2 pt-6">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
              <Server className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Configurar Apps
              </h2>
              <p className="text-sm text-muted-foreground">
                Defina origem e destino da migração
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 px-6 pb-6 pt-2">
          <form onSubmit={handleFetch} className="flex flex-col gap-6">
            {/* Source App */}
            <div className="group relative rounded-xl border border-border/50 bg-secondary/30 p-4 transition-all hover:border-primary/30 hover:bg-secondary/50">
              <div className="absolute -top-3 left-4 flex items-center gap-1.5 bg-card px-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <Upload className="h-3 w-3" />
                Origem
              </div>
              <div className="flex flex-col gap-2 pt-1">
                <Label htmlFor="source" className="text-sm font-medium text-foreground">
                  App ID de Origem
                </Label>
                <Input
                  id="source"
                  type="text"
                  placeholder="Ex: 12345abcde"
                  value={sourceAppId}
                  onChange={(e) => setSourceAppId(e.target.value)}
                  className="h-11 border-border/50 bg-background/50 transition-all focus:border-primary/50"
                />
              </div>
            </div>

            {/* Arrow indicator */}
            <div className="flex items-center justify-center">
              <div className="relative flex h-10 w-10 items-center justify-center">
                <div className="absolute inset-0 animate-pulse rounded-full bg-primary/10" />
                <div className="relative flex h-8 w-8 items-center justify-center rounded-full border border-primary/30 bg-card">
                  <ArrowDown className="h-4 w-4 text-primary" />
                </div>
              </div>
            </div>

            {/* Destination App */}
            <div className="group relative rounded-xl border border-border/50 bg-secondary/30 p-4 transition-all hover:border-primary/30 hover:bg-secondary/50">
              <div className="absolute -top-3 left-4 flex items-center gap-1.5 bg-card px-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <Download className="h-3 w-3" />
                Destino
              </div>
              <div className="flex flex-col gap-2 pt-1">
                <Label htmlFor="dest" className="text-sm font-medium text-foreground">
                  App ID de Destino
                </Label>
                <Input
                  id="dest"
                  type="text"
                  placeholder="Ex: 67890fghij"
                  value={destinationAppId}
                  onChange={(e) => setDestinationAppId(e.target.value)}
                  className="h-11 border-border/50 bg-background/50 transition-all focus:border-primary/50"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading} 
              className="btn-tech mt-2 h-12 w-full gap-2 border-0 text-primary-foreground"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Buscando Templates...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Buscar Templates
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
