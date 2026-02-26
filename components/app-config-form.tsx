"use client"

import { useState, useEffect } from "react"
import { useMigration } from "@/context/migration-context"
import { fetchTemplates, fetchPartnerApps } from "@/lib/api"
import type { PartnerApp } from "@/lib/types"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Loader2, ArrowRight, Upload, Download, ArrowDown, Sparkles, Server, Check, ChevronsUpDown, Phone, Hash } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

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
  const [loadingApps, setLoadingApps] = useState(false)
  const [apps, setApps] = useState<PartnerApp[]>([])
  const [sourceOpen, setSourceOpen] = useState(false)
  const [destOpen, setDestOpen] = useState(false)

  // Buscar apps ao carregar
  useEffect(() => {
    async function loadApps() {
      if (!token) return
      
      setLoadingApps(true)
      try {
        const partnerApps = await fetchPartnerApps(token)
        setApps(partnerApps)
      } catch (err) {
        toast.error(
          err instanceof Error
            ? err.message
            : "Erro ao carregar apps."
        )
      } finally {
        setLoadingApps(false)
      }
    }
    
    loadApps()
  }, [token])

  const selectedSourceApp = apps.find(app => app.id === sourceAppId)
  const selectedDestApp = apps.find(app => app.id === destinationAppId)

  async function handleFetch(e: React.FormEvent) {
    e.preventDefault()
    if (!sourceAppId.trim() || !destinationAppId.trim()) {
      toast.error("Selecione ambos os Apps.")
      return
    }
    if (sourceAppId === destinationAppId) {
      toast.error("App de origem e destino devem ser diferentes.")
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

  function AppCombobox({
    value,
    onSelect,
    open,
    setOpen,
    placeholder,
    excludeId,
  }: {
    value: string
    onSelect: (value: string) => void
    open: boolean
    setOpen: (open: boolean) => void
    placeholder: string
    excludeId?: string
  }) {
    const selectedApp = apps.find(app => app.id === value)
    const filteredApps = excludeId ? apps.filter(app => app.id !== excludeId) : apps

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-14 w-full justify-between border-border/50 bg-background/50 px-4 text-left transition-all hover:border-primary/50 hover:bg-background/70"
          >
            {loadingApps ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando apps...
              </div>
            ) : selectedApp ? (
              <div className="flex flex-col gap-0.5">
                <span className="font-medium text-foreground">{selectedApp.name}</span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  {selectedApp.phone && (
                    <>
                      <Phone className="h-3 w-3" />
                      {selectedApp.phone}
                    </>
                  )}
                  <Hash className="h-3 w-3" />
                  {selectedApp.id.substring(0, 8)}...
                </span>
              </div>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar por nome ou telefone..." />
            <CommandList>
              <CommandEmpty>Nenhum app encontrado.</CommandEmpty>
              <CommandGroup>
                {filteredApps.map((app) => (
                  <CommandItem
                    key={app.id}
                    value={`${app.name} ${app.phone || ""} ${app.id}`}
                    onSelect={() => {
                      onSelect(app.id)
                      setOpen(false)
                    }}
                    className="flex cursor-pointer items-center gap-3 py-3"
                  >
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold",
                      app.live 
                        ? "bg-primary/20 text-primary" 
                        : "bg-muted text-muted-foreground"
                    )}>
                      {app.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-1 flex-col gap-0.5">
                      <span className="font-medium">{app.name}</span>
                      <span className="flex items-center gap-2 text-xs text-muted-foreground">
                        {app.phone && (
                          <>
                            <Phone className="h-3 w-3" />
                            {app.phone}
                          </>
                        )}
                        {!app.phone && (
                          <>
                            <Hash className="h-3 w-3" />
                            {app.id.substring(0, 12)}...
                          </>
                        )}
                        {app.live && (
                          <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                            LIVE
                          </span>
                        )}
                      </span>
                    </div>
                    <Check
                      className={cn(
                        "h-4 w-4 text-primary",
                        value === app.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
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
                <label className="text-sm font-medium text-foreground">
                  Selecione o App de Origem
                </label>
                <AppCombobox
                  value={sourceAppId}
                  onSelect={setSourceAppId}
                  open={sourceOpen}
                  setOpen={setSourceOpen}
                  placeholder="Buscar app de origem..."
                  excludeId={destinationAppId}
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
                <label className="text-sm font-medium text-foreground">
                  Selecione o App de Destino
                </label>
                <AppCombobox
                  value={destinationAppId}
                  onSelect={setDestinationAppId}
                  open={destOpen}
                  setOpen={setDestOpen}
                  placeholder="Buscar app de destino..."
                  excludeId={sourceAppId}
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading || loadingApps || !sourceAppId || !destinationAppId} 
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
