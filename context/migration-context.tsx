"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import type { GupshupTemplate, MigrationResult, MigrationStatus, Step } from "@/lib/types"

interface MigrationContextType {
  token: string | null
  email: string | null
  sourceAppId: string
  destinationAppId: string
  templates: GupshupTemplate[]
  selectedTemplateIds: Set<string>
  migrationResults: MigrationResult[]
  migrationStatus: MigrationStatus
  currentStep: Step
  processingIndex: number
  requestDelay: number

  setAuth: (token: string, email: string) => void
  logout: () => void
  setSourceAppId: (id: string) => void
  setDestinationAppId: (id: string) => void
  setTemplates: (templates: GupshupTemplate[]) => void
  toggleTemplate: (id: string) => void
  selectAll: (ids: string[]) => void
  deselectAll: () => void
  setCurrentStep: (step: Step) => void
  setMigrationStatus: (status: MigrationStatus) => void
  addMigrationResult: (result: MigrationResult) => void
  setProcessingIndex: (index: number) => void
  setRequestDelay: (delay: number) => void
  resetMigration: () => void
}

const MigrationContext = createContext<MigrationContextType | null>(null)

export function MigrationProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [sourceAppId, setSourceAppId] = useState("")
  const [destinationAppId, setDestinationAppId] = useState("")
  const [templates, setTemplates] = useState<GupshupTemplate[]>([])
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<string>>(new Set())
  const [migrationResults, setMigrationResults] = useState<MigrationResult[]>([])
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus>("idle")
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [processingIndex, setProcessingIndex] = useState(-1)
  const [requestDelay, setRequestDelay] = useState(10)

  const setAuth = useCallback((t: string, e: string) => {
    setToken(t)
    setEmail(e)
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setEmail(null)
    setSourceAppId("")
    setDestinationAppId("")
    setTemplates([])
    setSelectedTemplateIds(new Set())
    setMigrationResults([])
    setMigrationStatus("idle")
    setCurrentStep(1)
    setProcessingIndex(-1)
  }, [])

  const toggleTemplate = useCallback((id: string) => {
    setSelectedTemplateIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const selectAll = useCallback((ids: string[]) => {
    setSelectedTemplateIds(new Set(ids))
  }, [])

  const deselectAll = useCallback(() => {
    setSelectedTemplateIds(new Set())
  }, [])

  const addMigrationResult = useCallback((result: MigrationResult) => {
    setMigrationResults((prev) => [...prev, result])
  }, [])

  const resetMigration = useCallback(() => {
    setMigrationResults([])
    setMigrationStatus("idle")
    setProcessingIndex(-1)
    setSelectedTemplateIds(new Set())
    setCurrentStep(1)
    setRequestDelay(10)
  }, [])

  return (
    <MigrationContext.Provider
      value={{
        token,
        email,
        sourceAppId,
        destinationAppId,
        templates,
        selectedTemplateIds,
        migrationResults,
        migrationStatus,
        currentStep,
        processingIndex,
        requestDelay,
        setAuth,
        logout,
        setSourceAppId,
        setDestinationAppId,
        setTemplates,
        toggleTemplate,
        selectAll,
        deselectAll,
        setCurrentStep,
        setMigrationStatus,
        addMigrationResult,
        setProcessingIndex,
        setRequestDelay,
        resetMigration,
      }}
    >
      {children}
    </MigrationContext.Provider>
  )
}

export function useMigration() {
  const ctx = useContext(MigrationContext)
  if (!ctx) throw new Error("useMigration must be used within MigrationProvider")
  return ctx
}
