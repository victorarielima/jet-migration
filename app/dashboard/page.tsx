"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useMigration } from "@/context/migration-context"
import { Header } from "@/components/header"
import { Stepper } from "@/components/stepper"
import { AppConfigForm } from "@/components/app-config-form"
import { TemplateList } from "@/components/template-list"
import { createTemplate, delay } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, XCircle, Loader2, RefreshCw, Home } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"

export default function DashboardPage() {
  const router = useRouter()
  const {
    token,
    currentStep,
    templates,
    selectedTemplateIds,
    destinationAppId,
    migrationStatus,
    migrationResults,
    processingIndex,
    requestDelay,
    randomizeDelay,
    minDelay,
    maxDelay,
    setCurrentStep,
    setMigrationStatus,
    addMigrationResult,
    setProcessingIndex,
    resetMigration,
  } = useMigration()

  const isPopStateRef = useRef(false)

  // Verifica autenticação
  useEffect(() => {
    if (!token) {
      router.push("/")
    }
  }, [token, router])

  // Sincroniza as etapas com o histórico do navegador
  useEffect(() => {
    // Ao mudar de step, adiciona entrada no histórico (exceto se for popstate)
    if (!isPopStateRef.current && currentStep > 1) {
      window.history.pushState({ step: currentStep }, "", `/dashboard?step=${currentStep}`)
    }
    isPopStateRef.current = false
  }, [currentStep])

  // Escuta o evento de voltar do navegador
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (migrationStatus === "running") {
        // Se estiver migrando, não permite voltar
        window.history.pushState({ step: currentStep }, "", `/dashboard?step=${currentStep}`)
        return
      }
      
      isPopStateRef.current = true
      
      if (event.state?.step) {
        setCurrentStep(event.state.step)
      } else if (currentStep > 1) {
        setCurrentStep((currentStep - 1) as 1 | 2 | 3)
      }
    }

    window.addEventListener("popstate", handlePopState)
    
    // Inicializa o estado do histórico
    if (typeof window !== "undefined" && !window.history.state?.step) {
      window.history.replaceState({ step: currentStep }, "", `/dashboard?step=${currentStep}`)
    }

    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [currentStep, setCurrentStep, migrationStatus])

  // Função para iniciar a migração
  async function startMigration(importAll: boolean) {
    if (!token || !destinationAppId) {
      toast.error("Configuração incompleta.")
      return
    }

    const templatesToMigrate = importAll
      ? templates
      : templates.filter((t) => selectedTemplateIds.has(t.id))

    if (templatesToMigrate.length === 0) {
      toast.error("Nenhum template selecionado.")
      return
    }

    setCurrentStep(3)
    setMigrationStatus("running")
    setProcessingIndex(0)

    for (let i = 0; i < templatesToMigrate.length; i++) {
      const template = templatesToMigrate[i]
      setProcessingIndex(i)

      try {
        await createTemplate(destinationAppId, token, template)
        addMigrationResult({
          templateId: template.id,
          templateName: template.elementName,
          success: true,
        })
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao importar template"
        addMigrationResult({
          templateId: template.id,
          templateName: template.elementName,
          success: false,
          error: errorMessage,
        })
      }
      
      // Delay configurável entre requisições (exceto após o último template)
      if (i < templatesToMigrate.length - 1) {
        let delayTime: number
        if (randomizeDelay) {
          // Gera um delay aleatório entre minDelay e maxDelay
          delayTime = Math.floor(Math.random() * (maxDelay - minDelay + 1) + minDelay) * 1000
        } else {
          delayTime = requestDelay * 1000
        }
        await delay(delayTime)
      }
    }

    setMigrationStatus("completed")
    setProcessingIndex(-1)
    
    const successCount = migrationResults.filter((r) => r.success).length + 
      templatesToMigrate.filter((t, i) => {
        const result = migrationResults.find(r => r.templateId === t.id)
        return result ? result.success : i < processingIndex
      }).length
    
    if (successCount === templatesToMigrate.length) {
      toast.success(`Todos os ${templatesToMigrate.length} templates foram migrados com sucesso!`)
    } else {
      toast.warning(`Migração concluída com erros. ${successCount}/${templatesToMigrate.length} templates migrados.`)
    }
  }

  // Função para reiniciar o processo
  function handleRestart() {
    resetMigration()
    setCurrentStep(1)
  }

  if (!token) {
    return null // Ou um loading spinner
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Background base */}
      <div className="fixed inset-0 bg-background" />
      
      {/* Background gradient base */}
      <div className="fixed inset-0 bg-gradient-to-br from-emerald-950/30 via-transparent to-emerald-950/20" />
      
      {/* Grid pattern */}
      <div className="fixed inset-0 bg-grid-pattern opacity-25" />
      
      {/* Green ambient lighting - full page coverage */}
      <div className="fixed -top-40 left-1/2 h-[900px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-radial from-emerald-500/30 via-emerald-600/15 to-transparent blur-[120px]" />
      <div className="fixed top-1/4 -right-40 h-[700px] w-[700px] rounded-full bg-gradient-radial from-emerald-500/25 via-teal-600/10 to-transparent blur-[100px]" />
      <div className="fixed top-1/2 -left-40 h-[600px] w-[600px] rounded-full bg-gradient-radial from-emerald-600/25 via-emerald-700/10 to-transparent blur-[90px]" />
      <div className="fixed bottom-0 left-1/3 h-[700px] w-[700px] translate-y-1/3 rounded-full bg-gradient-radial from-emerald-500/20 via-emerald-700/10 to-transparent blur-[100px]" />
      
      {/* Vignette effect */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
      
      {/* Content layer */}
      <div className="relative z-10 flex min-h-screen flex-col">
        <Header />
        <Stepper currentStep={currentStep} />
        
        <main className="flex-1 pb-6">
          {currentStep === 1 && <AppConfigForm />}
          
          {currentStep === 2 && <TemplateList onImport={startMigration} />}
          
          {currentStep === 3 && (
            <div className="flex justify-center px-4">
            <Card className="gradient-border relative w-full max-w-2xl border-0 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex flex-col gap-6">
                  {/* Cabeçalho */}
                  <div className="flex items-start gap-4">
                    <div className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                      migrationStatus === "running" 
                        ? "bg-primary/10" 
                        : migrationStatus === "completed" 
                        ? "bg-primary/20" 
                        : "bg-secondary"
                    }`}>
                      {migrationStatus === "running" && (
                        <>
                          <div className="absolute inset-0 animate-pulse rounded-xl bg-primary/20" />
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </>
                      )}
                      {migrationStatus === "completed" && (
                        <CheckCircle2 className="h-6 w-6 text-primary" />
                      )}
                      {migrationStatus === "idle" && (
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <h2 className="text-xl font-semibold text-foreground">
                        {migrationStatus === "running" && "Migração em Progresso"}
                        {migrationStatus === "completed" && "Migração Concluída"}
                        {migrationStatus === "idle" && "Preparando Migração..."}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                      {migrationStatus === "running" &&
                        "Por favor, aguarde enquanto os templates são migrados..."}
                      {migrationStatus === "completed" &&
                        "O processo de migração foi finalizado."}
                    </p>
                    </div>
                  </div>

                  {/* Barra de progresso */}
                  {migrationStatus === "running" && (
                    <div className="flex flex-col gap-3 rounded-xl border border-border/50 bg-secondary/30 p-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Processando template <span className="font-semibold text-foreground">{processingIndex + 1}</span> de{" "}
                          <span className="font-semibold text-foreground">{
                            templates.filter((t) =>
                              selectedTemplateIds.has(t.id)
                            ).length
                          }</span>
                        </span>
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                          {Math.round(
                            ((processingIndex + 1) /
                              templates.filter((t) =>
                                selectedTemplateIds.has(t.id)
                              ).length) *
                              100
                          )}%
                        </span>
                      </div>
                      <Progress
                        value={
                          ((processingIndex + 1) /
                            templates.filter((t) =>
                              selectedTemplateIds.has(t.id)
                            ).length) *
                          100
                        }
                      />
                    </div>
                  )}

                  {/* Lista de resultados */}
                  {migrationResults.length > 0 && (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-foreground">
                          Log de Migração
                        </h3>
                        <span className="text-xs text-muted-foreground">
                          {migrationResults.filter(r => r.success).length} sucesso · {migrationResults.filter(r => !r.success).length} falhas
                        </span>
                      </div>
                      <ScrollArea className="h-[350px] rounded-xl border border-border/50 bg-secondary/20">
                        <div className="flex flex-col gap-1 p-2">
                          {migrationResults.map((result, index) => (
                            <div
                              key={`${result.templateId}-${index}`}
                              className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                                result.success 
                                  ? "border-primary/20 bg-primary/5 hover:bg-primary/10" 
                                  : "border-destructive/20 bg-destructive/5 hover:bg-destructive/10"
                              }`}
                            >
                              {result.success ? (
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                                </div>
                              ) : (
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-destructive/20">
                                  <XCircle className="h-3.5 w-3.5 text-destructive" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="truncate text-sm font-medium text-foreground">
                                  {result.templateName}
                                </p>
                                {result.error && (
                                  <p className="mt-1 text-xs text-destructive/80">
                                    {result.error}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                          {migrationStatus === "running" && processingIndex >= 0 && processingIndex < templates.filter((t) => selectedTemplateIds.has(t.id)).length && (
                            <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
                              <div className="relative flex h-6 w-6 items-center justify-center">
                                <div className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                              </div>
                              <p className="text-sm font-medium text-primary">
                                {migrationResults.length < processingIndex + 1
                                  ? "Processando template..."
                                  : "Aguardando próximo template..."}
                              </p>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  {/* Estatísticas finais */}
                  {migrationStatus === "completed" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-4">
                        <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-primary/10 blur-xl" />
                        <div className="relative">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Sucesso</span>
                          </div>
                          <span className="mt-2 block text-3xl font-bold text-foreground">
                            {migrationResults.filter((r) => r.success).length}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            templates migrados
                          </span>
                        </div>
                      </div>
                      <div className="relative overflow-hidden rounded-xl border border-destructive/20 bg-gradient-to-br from-destructive/10 to-destructive/5 p-4">
                        <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-destructive/10 blur-xl" />
                        <div className="relative">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-5 w-5 text-destructive" />
                            <span className="text-xs font-semibold uppercase tracking-wider text-destructive">Falhas</span>
                          </div>
                          <span className="mt-2 block text-3xl font-bold text-foreground">
                            {migrationResults.filter((r) => !r.success).length}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            templates com erro
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Ações */}
                  {migrationStatus === "completed" && (
                    <div className="flex items-center gap-3 pt-2">
                      <Button
                        onClick={handleRestart}
                        variant="outline"
                        className="flex-1 gap-2 border-border/50 transition-all hover:border-primary/30 hover:bg-primary/5"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Nova Migração
                      </Button>
                      <Button 
                        onClick={() => router.push("/")} 
                        className="btn-tech flex-1 gap-2 border-0"
                      >
                        <Home className="h-4 w-4" />
                        Início
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      </div>
    </div>
  )
}
