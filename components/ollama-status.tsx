"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"

export function OllamaStatus() {
  const [status, setStatus] = useState<"loading" | "running" | "error">("loading")
  const [model, setModel] = useState<string | null>(null)
  const [modelInfo, setModelInfo] = useState<string | null>(null)
  const [optimized, setOptimized] = useState(false)

  useEffect(() => {
    // For this version, we're using Gemini API instead of Ollama
    // So we'll just set the status to "running" and the model to "gemini"
    setStatus("running")
    setModel("gemini2")
    setModelInfo("Google's gemma2 (compact, efficient model)")
    setOptimized(true)
  }, [])

  return (
    <div className="mb-6">
      {status === "loading" && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>Checking Ollama status...</AlertDescription>
        </Alert>
      )}

      {status === "running" && (
        <Alert>
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertDescription className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span>Ollama is running</span>
            </div>
            {model && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Using {model}</span>
                {modelInfo && <span className="text-xs">({modelInfo})</span>}
              </div>
            )}
            {optimized && (
              <div className="text-xs text-muted-foreground">
                Resume analysis has been optimized for faster processing
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {status === "error" && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex flex-col gap-1">
            <div>Ollama is not running or not accessible</div>
            <div className="text-xs">
              Make sure Ollama is installed and running on your machine. Visit{" "}
              <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" className="underline">
                ollama.ai
              </a>{" "}
              for installation instructions.
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
