import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

// Simple in-memory cache implementation
const cache = new Map()

export async function POST(req: NextRequest) {
  console.log("Match resume API called")

  // Create a fallback result
  const fallbackResult = {
    matchPercentage: 0,
    matchedSkills: [],
    missingSkills: [],
    suggestions: ["Try again with a more detailed resume"],
    explanation: "An error occurred during processing. Please try again.",
    companies: [],
    jobs: [],
    modelUsed: "gemini-1.5-flash",
    parsingError: true,
  }

  try {
    // Check if Google API key is available
    const apiKey = process.env.GOOGLE_API_KEY
    if (!apiKey) {
      console.error("GOOGLE_API_KEY is not defined")
      return NextResponse.json(
        {
          ...fallbackResult,
          error: "API key is not configured",
          details: "The GOOGLE_API_KEY environment variable is not set.",
        },
        { status: 400 },
      )
    }

    // Parse form data
    let formData
    try {
      formData = await req.formData()
      console.log("FormData received")
    } catch (formError: any) {
      console.error("Error parsing form data:", formError)
      return NextResponse.json(
        {
          ...fallbackResult,
          error: "Failed to parse form data",
          details: formError.message || "There was an error processing your request.",
        },
        { status: 400 },
      )
    }

    const resumeFile = formData.get("resume") as File | null
    const jobDescription = (formData.get("jobDescription") as string) || ""

    console.log("Resume file:", resumeFile?.name || "No file")
    console.log("Job description length:", jobDescription?.length || 0)

    if (!resumeFile) {
      return NextResponse.json(
        {
          ...fallbackResult,
          error: "Resume file is required",
        },
        { status: 400 },
      )
    }

    // For now, let's return a mock response to test if the API route works
    const mockResult = {
      matchPercentage: 75,
      matchedSkills: ["JavaScript", "React", "TypeScript", "Next.js", "UI/UX"],
      missingSkills: ["GraphQL", "AWS"],
      suggestions: [
        "Add more details about your GraphQL experience",
        "Highlight any cloud platform experience you have",
      ],
      explanation: "Your resume shows strong frontend development skills that match well with this position.",
      companies: [
        {
          name: "Vercel",
          reason: "Your Next.js and React experience would be valuable here",
          industry: "Web Development",
        },
        {
          name: "Netlify",
          reason: "Your frontend skills align with their platform focus",
          industry: "Web Infrastructure",
        },
        {
          name: "Stripe",
          reason: "Your TypeScript and UI experience would be relevant",
          industry: "Financial Technology",
        },
        {
          name: "Shopify",
          reason: "Your React skills would be useful for their platform",
          industry: "E-commerce",
        },
        {
          name: "GitHub",
          reason: "Your development experience matches their technical needs",
          industry: "Developer Tools",
        },
      ],
      jobs: [
        {
          title: "Senior Frontend Developer",
          reason: "Your React and TypeScript skills are in high demand",
          existingSkills: ["React", "TypeScript", "CSS"],
          skillsToAcquire: ["GraphQL", "Performance Optimization"],
        },
        {
          title: "UI Engineer",
          reason: "Your UI/UX experience is valuable for this role",
          existingSkills: ["JavaScript", "CSS", "UI Design"],
          skillsToAcquire: ["Design Systems", "Accessibility"],
        },
        {
          title: "Full Stack Developer",
          reason: "Your frontend skills provide a good foundation",
          existingSkills: ["JavaScript", "React", "HTML/CSS"],
          skillsToAcquire: ["Node.js", "Database Design"],
        },
        {
          title: "Next.js Developer",
          reason: "Your Next.js experience is directly applicable",
          existingSkills: ["Next.js", "React", "JavaScript"],
          skillsToAcquire: ["Serverless Functions", "Edge Computing"],
        },
        {
          title: "Frontend Architect",
          reason: "Your experience could lead to architecture roles",
          existingSkills: ["JavaScript", "React", "TypeScript"],
          skillsToAcquire: ["System Design", "Team Leadership"],
        },
      ],
      modelUsed: "gemini-1.5-flash (mock)",
    }

    return NextResponse.json(mockResult)
  } catch (error: any) {
    // Global catch-all error handler
    console.error("CRITICAL ERROR in match-resume route:", error)

    // Always return a valid JSON response
    return NextResponse.json(
      {
        matchPercentage: 0,
        matchedSkills: [],
        missingSkills: [],
        suggestions: ["Server encountered an error. Please try again later."],
        explanation: "Error processing request.",
        companies: [],
        jobs: [],
        modelUsed: "gemini-1.5-flash",
        parsingError: true,
        error: "Internal server error",
        details: error.message || "An unexpected error occurred.",
      },
      { status: 500 },
    )
  }
}

// Force dynamic to ensure we don't cache the response
export const dynamic = "force-dynamic"
