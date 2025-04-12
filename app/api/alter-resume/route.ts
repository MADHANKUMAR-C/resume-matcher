import { type NextRequest, NextResponse } from "next/server"
import { parseResume, parseJobDescription } from "@/lib/resume-parser"
import { checkOllamaStatus } from "@/lib/check-ollama"
import pdfParse from "pdf-parse"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const resumeFile = formData.get("resume") as File
    const jobDescription = formData.get("jobDescription") as string

    if (!resumeFile || !jobDescription) {
      return NextResponse.json({ error: "Resume file and job description are required" }, { status: 400 })
    }

    const arrayBuffer = await resumeFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const parsed = await pdfParse(buffer)
    const resumeText = parsed.text

    const ollamaStatus = await checkOllamaStatus()
    if (!ollamaStatus.running || !ollamaStatus.modelLoaded) {
      return NextResponse.json(
        { error: ollamaStatus.error || "Ollama is not running or no suitable model is available" },
        { status: 500 },
      )
    }

    const modelName = ollamaStatus.selectedModel?.name || "phi"
    console.log(`Using model: ${modelName}`)

    const parsedResume = parseResume(resumeText, false)
    const parsedJobDescription = parseJobDescription(jobDescription, false)

    // Build prompt for resume alteration
    const prompt = `
You are an expert resume writer with years of experience helping job seekers optimize their resumes for specific job descriptions.

TASK: Rewrite the provided resume to better match the job description while maintaining truthfulness.

INSTRUCTIONS:
1. Analyze the job description to identify key skills, qualifications, and responsibilities.
2. Restructure and reword the resume to highlight relevant experience and skills that match the job description.
3. Use industry-standard terminology and action verbs.
4. Maintain the same basic structure (sections like Education, Experience, Skills, etc.).
5. Do NOT invent new experiences or qualifications - only reword and reorganize existing information.
6. Focus on making the resume ATS-friendly by incorporating relevant keywords from the job description.
7. Format the resume in a clean, professional layout.

IMPORTANT: Your response should ONLY contain the rewritten resume text. Do not include any explanations, notes, or commentary.

JOB DESCRIPTION:
${parsedJobDescription}

ORIGINAL RESUME:
${parsedResume}
`.trim()

    console.log("Sending resume alteration request to Ollama API...")

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 600000) // 10 minutes timeout

    try {
      const response = await fetch("http://localhost:11434/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: modelName,
          messages: [{ role: "user", content: prompt }],
          stream: false,
          options: {
            temperature: 0.2,
            top_p: 0.9,
            num_predict: 4000, // Increased for longer response
          },
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Ollama API error: ${error}`)
      }

      const data = await response.json()
      const alteredResume = data.message.content.trim()

      return NextResponse.json({ alteredResume })
    } catch (error: any) {
      clearTimeout(timeoutId)

      if (error.name === "AbortError") {
        console.error("Request to Ollama timed out")
        return NextResponse.json(
          { error: "Resume alteration timed out. Try again with shorter resume or job description." },
          { status: 504 },
        )
      }

      throw error
    }
  } catch (error: any) {
    console.error("Error in alter-resume route:", error)
    return NextResponse.json(
      { error: error.message || "Internal error. Ensure Ollama is running with a proper model." },
      { status: 500 },
    )
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}
