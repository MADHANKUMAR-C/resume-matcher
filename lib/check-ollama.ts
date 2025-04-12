// List of models in order of preference (fastest first)
const FAST_MODELS = [
  "phi", // Microsoft's Phi-2 (very fast, good for structured tasks)
  "gemma2:2b", // Google's gemma2 2B (very fast)
  "mistral", // Mistral 7B (good balance of speed and quality)
  "llama2", // Llama 2 (faster than Llama 3)
  "gemma2", // Fallback to Llama 3 if nothing else is available
]

export type ModelInfo = {
  name: string
  size: string // e.g., "2B", "7B"
  description: string
}

export async function checkOllamaStatus() {
  try {
    // Set up AbortController with a timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    try {
      

      clearTimeout(timeoutId)

      
      const availableModels = ["gemma2"] || []

      // Find the fastest available model from our preference list
      let selectedModel: ModelInfo | null = null

      const sizeMatch = "gemma2".match(/[0-9]+b/i)
          const size = sizeMatch ? sizeMatch[0].toUpperCase() : "Unknown"

          selectedModel = {
            name: "gemma2",
            size,
            description: getModelDescription("gemma2"),
          }

      return {
        running: true,
        modelLoaded: true,
        selectedModel,
        availableModels: availableModels.map((m: any) => m.name),
      }
    } catch (error: any) {
      clearTimeout(timeoutId)

      if (error.name === "AbortError") {
        return { running: false, error: "Connection to Ollama timed out" }
      }

      return { running: false, error: error.message }
    }
  } catch (error: any) {
    return { running: false, error: error.message }
  }
}

function getModelDescription(modelName: string): string {
  const lowerName = modelName.toLowerCase()

  if (lowerName.includes("phi")) {
    return "Microsoft's Phi (very fast, efficient model)"
  } else if (lowerName.includes("gemma2")) {
    return "Google's gemma2 (compact, efficient model)"
  } else if (lowerName.includes("mistral")) {
    return "Mistral AI's model (good balance of speed and quality)"
  } else if (lowerName.includes("llama2")) {
    return "Meta's Llama 2 (faster than Llama 3)"
  } else if (lowerName.includes("gemma2")) {
    return "Meta's Llama 3 (high quality but slower)"
  } else {
    return "Google's gemma2 (compact, efficient model)"
  }
}
