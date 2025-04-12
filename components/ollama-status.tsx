"use client"

import { useEffect, useState } from "react"
import { checkOllamaStatus, type ModelInfo } from "@/lib/check-ollama"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Info, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

type StatusType = {
  running: boolean
  error?: string
  modelLoaded?: boolean
  selectedModel?: ModelInfo
  availableModels?: string[]
}

export function OllamaStatus() {
  const [status, setStatus] = useState<StatusType | null>(null)
  const [loading, setLoading] = useState(true)

  const checkStatus = async () => {
    setLoading(true)
    const result = await checkOllamaStatus()
    setStatus(result)
    setLoading(false)
  }

  useEffect(() => {
    checkStatus()

    // Check status every 30 seconds
    const interval = setInterval(checkStatus, 30000)

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <Alert className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Checking Ollama status...</AlertTitle>
        <AlertDescription>Verifying connection to your local Ollama instance</AlertDescription>
      </Alert>
    )
  }

  if (!status?.running) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Ollama not detected</AlertTitle>
        <AlertDescription>
          {status?.error || "Could not connect to Ollama. Make sure it's installed and running."}
        </AlertDescription>
      </Alert>
    )
  }

  if (status.error) {
    return (
      <Alert variant="warning" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Ollama is running but there's an issue</AlertTitle>
        <AlertDescription className="flex flex-col gap-2">
          <div>{status.error}</div>
          <Button size="sm" variant="outline" onClick={checkStatus} className="self-start">
            Check Again
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className="mb-4 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
      <AlertTitle className="flex items-center gap-2">
        Ollama is running
        {status.selectedModel && (
          <span className="text-xs bg-green-100 dark:bg-green-900 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Zap className="h-3 w-3" />
            Using {status.selectedModel.name}
          </span>
        )}
      </AlertTitle>
      <AlertDescription className="flex flex-col gap-2">
        {status.selectedModel ? (
          <div className="text-sm">
            Using {status.selectedModel.name} ({status.selectedModel.description})
          </div>
        ) : (
          <div>Connected to your local Ollama instance</div>
        )}
        <div className="text-xs text-muted-foreground">
          <Info className="h-3 w-3 inline mr-1" />
          Resume analysis has been optimized for faster processing
        </div>
      </AlertDescription>
    </Alert>
  )
}
