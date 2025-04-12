import { type NextRequest, NextResponse } from "next/server"
import { parseResume, parseJobDescription } from "@/lib/resume-parser"
import pdfParse from "pdf-parse"
import { GoogleGenerativeAI } from "@google/generative-ai"

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

    console.log("Sending resume alteration request to Gemini...")

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const result = await model.generateContent(prompt)
    const response = result.response
    const alteredResume = response.text().trim()

    return NextResponse.json({ alteredResume })
  } catch (error: any) {
    console.error("Error in alter-resume route:", error)
    return NextResponse.json(
      { error: error.message || "Internal error. Ensure Gemini API key is valid." },
      { status: 500 }
    )
  }
}

export const dynamic = "force-dynamic"
