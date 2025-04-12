"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, RefreshCw } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error)
  }, [error])

  return (
    <div className="container mx-auto p-4 max-w-4xl py-8">
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Something went wrong!</AlertTitle>
        <AlertDescription>
          <p className="mb-4">The application encountered an unexpected error.</p>
          <p className="text-sm opacity-80 mb-4">{error.message}</p>
          <Button onClick={reset} variant="outline" size="sm" className="mt-2">
            <RefreshCw className="mr-2 h-3 w-3" />
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  )
}
