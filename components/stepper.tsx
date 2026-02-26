"use client"

import { cn } from "@/lib/utils"
import { Check, Settings, FileStack, Rocket } from "lucide-react"
import type { Step } from "@/lib/types"

const steps = [
  { number: 1, label: "Configurar Apps", icon: Settings },
  { number: 2, label: "Selecionar Templates", icon: FileStack },
  { number: 3, label: "Migração", icon: Rocket },
] as const

interface StepperProps {
  currentStep: Step
}

export function Stepper({ currentStep }: StepperProps) {
  return (
    <nav className="relative mx-auto w-full max-w-3xl px-4 py-8" aria-label="Progresso">
      <div className="relative flex items-center justify-center gap-4 md:gap-0">
        {steps.map((step, index) => {
          const isActive = step.number === currentStep
          const isCompleted = step.number < currentStep
          const Icon = step.icon
          
          return (
            <div key={step.number} className="flex items-center">
              <div className="relative flex flex-col items-center gap-3">
                {/* Step indicator */}
                <div
                  className={cn(
                    "relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 transition-all duration-500",
                    isCompleted && "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/25",
                    isActive && "border-primary bg-primary/10 text-primary shadow-lg shadow-primary/20",
                    !isActive && !isCompleted && "border-border bg-secondary/50 text-muted-foreground"
                  )}
                >
                  {/* Glow effect for active */}
                  {isActive && (
                    <div className="absolute -inset-1 animate-pulse rounded-xl bg-primary/20 blur-md" />
                  )}
                  
                  <div className="relative">
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                </div>
                
                {/* Step label */}
                <div className="flex flex-col items-center gap-0.5">
                  <span
                    className={cn(
                      "text-[10px] font-semibold uppercase tracking-wider transition-colors",
                      isActive && "text-primary",
                      isCompleted && "text-primary",
                      !isActive && !isCompleted && "text-muted-foreground/60"
                    )}
                  >
                    Etapa {step.number}
                  </span>
                  <span
                    className={cn(
                      "hidden text-center text-sm font-medium transition-colors sm:block",
                      isActive && "text-foreground",
                      isCompleted && "text-foreground",
                      !isActive && !isCompleted && "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </span>
                </div>
              </div>
              
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="relative mx-4 hidden h-0.5 w-16 overflow-hidden rounded-full bg-border md:block lg:w-24">
                  <div
                    className={cn(
                      "absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary transition-all duration-700 ease-out",
                      step.number < currentStep ? "w-full" : "w-0"
                    )}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </nav>
  )
}
