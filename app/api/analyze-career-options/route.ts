import { type NextRequest, NextResponse } from "next/server"
import { parseResume } from "@/lib/resume-parser"
import { analysisCache } from "@/lib/cache"
import pdfParse from "pdf-parse"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const resumeFile = formData.get("resume") as File
    const analysisType = formData.get("analysisType") as string

    if (!resumeFile || !analysisType) {
      return NextResponse.json({ error: "Resume file and analysis type are required" }, { status: 400 })
    }

    const arrayBuffer = await resumeFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const parsed = await pdfParse(buffer)
    const resumeText = parsed.text

    const cacheKey = `${analysisType}-${resumeText.substring(0, 100)}`
    const cachedResult = analysisCache.get(cacheKey, "")
    if (cachedResult) {
      console.log("Returning cached result")
      return NextResponse.json(cachedResult)
    }

    const parsedResume = parseResume(resumeText, true)

    let prompt = ""

    if (analysisType === "companies") {
      prompt = `
You are a career advisor with expertise in matching candidates to suitable companies.
Based on the resume provided, suggest 5 popular companies that would be a good fit for this candidate's skills and experience.

For each company, provide:
1. Company name
2. Brief explanation of why it's a good match (1-2 sentences)
3. Primary industry

Respond in this JSON format only:
{
  "companies": [
    {
      "name": "Company Name",
      "reason": "Brief explanation of match",
      "industry": "Primary industry"
    }
  ]
}

RESUME:
${parsedResume}
`.trim()
    } else if (analysisType === "jobs") {
      prompt = `
You are a career advisor with expertise in job market trends.
Based on the resume provided, suggest 5 specific job titles that:
1. Match the candidate's existing skills
2. Are currently in high demand and growing
3. Represent logical next steps in their career path

For each job, provide:
1. Job title
2. Brief explanation of why it's a good match (1-2 sentences)
3. Key skills they already have that apply
4. 1-2 skills they might need to develop

Respond in this JSON format only:
{
  "jobs": [
    {
      "title": "Job Title",
      "reason": "Brief explanation of match",
      "existingSkills": ["Skill 1", "Skill 2"],
      "skillsToAcquire": ["Skill 1", "Skill 2"]
    }
  ]
}

RESUME:
${parsedResume}
`.trim()
    } else {
      return NextResponse.json({ error: "Invalid analysis type" }, { status: 400 })
    }

    console.log(`Sending ${analysisType} analysis request to Gemini API...`)

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const result = await model.generateContent(prompt)
    const response = result.response
    const rawText = response.text().trim()

    // Try parsing JSON response
    const firstBrace = rawText.indexOf("{")
    const lastBrace = rawText.lastIndexOf("}")
    let jsonString = rawText.slice(firstBrace, lastBrace + 1)

    if (!jsonString.trim().endsWith("}")) {
      jsonString += "}"
    }

    let resultData
    try {
      resultData = JSON.parse(jsonString)
    } catch (e) {
      console.error("Failed to parse Gemini response:", rawText)
      throw new Error("Invalid JSON returned by Gemini API")
    }

    const finalResult = {
      ...(analysisType === "companies" ? { companies: resultData.companies || [] } : {}),
      ...(analysisType === "jobs" ? { jobs: resultData.jobs || [] } : {}),
      modelUsed: "gemini-1.5-flash",
    }

    analysisCache.set(cacheKey, "", finalResult)
    return NextResponse.json(finalResult)
  } catch (error: any) {
    console.error("Error in analyze-career-options route:", error)
    return NextResponse.json(
      { error: error.message || "Internal error. Ensure Gemini API key is valid." },
      { status: 500 }
    )
  }
}

export const dynamic = "force-dynamic"
