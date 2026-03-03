"use client"

import { useMemo, useState } from "react"
import { useMigration } from "@/context/migration-context"
import { TemplateCard } from "@/components/template-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Search, ArrowLeft, Import, FileStack, Filter, CheckSquare, Clock } from "lucide-react"

interface TemplateListProps {
  onImport: (all: boolean) => void
}

export function TemplateList({ onImport }: TemplateListProps) {
  const {
    templates,
    selectedTemplateIds,
    toggleTemplate,
    selectAll,
    deselectAll,
    setCurrentStep,
    sourceAppId,
    token,
    requestDelay,
    setRequestDelay,
  } = useMigration()

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [delayInput, setDelayInput] = useState(requestDelay.toString())

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      const matchesSearch = t.elementName
        .toLowerCase()
        .includes(search.toLowerCase())
      const matchesStatus =
        statusFilter === "ALL" || t.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [templates, search, statusFilter])

  const allVisibleSelected =
    filtered.length > 0 &&
    filtered.every((t) => selectedTemplateIds.has(t.id))

  function handleSelectAllVisible() {
    if (allVisibleSelected) {
      deselectAll()
    } else {
      selectAll(filtered.map((t) => t.id))
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header section */}
      <div className="border-b border-border/50 bg-card/30 px-4 py-4 backdrop-blur-sm md:px-6">
        <div className="mx-auto max-w-7xl">
          {/* Title and back button */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                <FileStack className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Templates Disponíveis</h2>
                <p className="text-sm text-muted-foreground">{templates.length} templates encontrados</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentStep(1)}
              className="gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </div>
          
          {/* Filters */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome do template..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 border-border/50 bg-secondary/50 pl-10 transition-all focus:border-primary/50 focus:bg-secondary"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Filter className="h-4 w-4" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 w-full border-border/50 bg-secondary/50 md:w-44">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os status</SelectItem>
                  <SelectItem value="APPROVED">Aprovados</SelectItem>
                  <SelectItem value="PENDING">Pendentes</SelectItem>
                  <SelectItem value="REJECTED">Rejeitados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Selection controls */}
          <div className="mt-4 flex items-center justify-between rounded-lg border border-border/30 bg-secondary/20 px-3 py-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={allVisibleSelected}
                  onCheckedChange={handleSelectAllVisible}
                  id="select-all"
                  className="border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                />
                <label
                  htmlFor="select-all"
                  className="cursor-pointer text-sm font-medium text-foreground"
                >
                  Selecionar Todos
                </label>
              </div>
              <div className="hidden h-4 w-px bg-border md:block" />
              <div className="hidden items-center gap-1.5 md:flex">
                <CheckSquare className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">
                  <span className="font-semibold text-primary">{selectedTemplateIds.size}</span> de {templates.length} selecionados
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de templates */}
      <ScrollArea className="flex-1 px-4 md:px-6">
        <div className="mx-auto max-w-7xl py-4">
          <div className="grid grid-cols-1 gap-4 pb-32 md:grid-cols-2 xl:grid-cols-3">
            {filtered.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 py-16 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                  <Search className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">Nenhum template encontrado</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Tente ajustar os filtros de busca
                </p>
              </div>
            ) : (
              filtered.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  selected={selectedTemplateIds.has(template.id)}
                  onToggle={() => toggleTemplate(template.id)}
                  sourceAppId={sourceAppId}
                  token={token || undefined}
                />
              ))
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Bottom action bar */}
      {selectedTemplateIds.size > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/50 bg-card/95 backdrop-blur-xl">
          <div className="mx-auto flex max-w-4xl items-center justify-center px-4 py-4 md:px-6">
            <Button 
              size="lg" 
              onClick={() => {
                setDelayInput(requestDelay.toString())
                setIsDialogOpen(true)
              }}
              className="btn-tech gap-2 border-0 px-8"
            >
              <Import className="h-5 w-5" />
              Importar Templates
            </Button>
          </div>
        </div>
      )}

      {/* Dialog de confirmação */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Import className="h-5 w-5 text-primary" />
              Importar Templates
            </DialogTitle>
            <DialogDescription>
              Configure o intervalo entre as requisições e confirme a importação.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
              <CheckSquare className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold text-foreground">
                {selectedTemplateIds.size}
              </span>
              <span className="text-muted-foreground">templates selecionados</span>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Tempo entre requisições</label>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
                <Input
                  type="number"
                  min={10}
                  value={delayInput}
                  onChange={(e) => setDelayInput(e.target.value)}
                  onBlur={() => {
                    const value = parseInt(delayInput, 10)
                    if (!isNaN(value) && value >= 10) {
                      setRequestDelay(value)
                    } else {
                      setDelayInput(requestDelay.toString())
                    }
                  }}
                  className="h-10 w-24 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <span className="text-sm text-muted-foreground">segundos</span>
              </div>
              <p className="text-xs text-muted-foreground">O tempo mínimo é de 10 segundos para evitar bloqueios na API.</p>
            </div>
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                const value = parseInt(delayInput, 10)
                if (!isNaN(value) && value >= 10) {
                  setRequestDelay(value)
                } else {
                  setRequestDelay(10)
                  setDelayInput("10")
                }
                setIsDialogOpen(false)
                onImport(false)
              }}
              className="btn-tech gap-2 border-0"
            >
              <Import className="h-4 w-4" />
              Confirmar Importação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
