import { OllamaStatus } from "@/components/ollama-status"
import { ResumeMatcher } from "@/components/resume-matcher"
import { GeminiChat } from "@/components/GeminiChat"

export default function Home() {
  return (
    <main className="container mx-auto p-4 max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Resume Matcher</h1>
      <p className="text-center mb-8 text-muted-foreground">
        Analyze how well your resume matches a job description using Ollama with Gemma2 (offline)
      </p>
      <OllamaStatus />
      <ResumeMatcher />
      <GeminiChat />
    </main>
  )
}
