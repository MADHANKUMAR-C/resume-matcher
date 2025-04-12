import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  console.log("Alter resume API called")

  try {
    // Verify API key is available first
    const apiKey = process.env.GOOGLE_API_KEY
    if (!apiKey) {
      console.error("GOOGLE_API_KEY is not defined")
      return NextResponse.json(
        {
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
          error: "Failed to parse form data",
          details: formError.message || "There was an error processing your request.",
        },
        { status: 400 },
      )
    }

    const resumeFile = formData.get("resume") as File | null
    const jobDescription = formData.get("jobDescription") as string | null

    console.log("Resume file:", resumeFile?.name || "No file")
    console.log("Job description length:", jobDescription?.length || 0)

    if (!resumeFile || !jobDescription) {
      return NextResponse.json(
        {
          error: "Resume file and job description are required",
        },
        { status: 400 },
      )
    }

    // Return a mock altered resume for testing
    const mockAlteredResume = `
JOHN DOE
Software Engineer
john.doe@example.com | (123) 456-7890 | linkedin.com/in/johndoe | github.com/johndoe

SUMMARY
Experienced Software Engineer with 5+ years of expertise in JavaScript, React, and Next.js. Passionate about creating responsive, user-friendly web applications with a focus on performance and accessibility.

SKILLS
• Frontend: React, Next.js, TypeScript, HTML5, CSS3, Tailwind CSS
• Backend: Node.js, Express, RESTful APIs
• Tools: Git, GitHub, VS Code, Webpack, Jest
• Concepts: Responsive Design, Accessibility, Performance Optimization

EXPERIENCE
Senior Frontend Developer | TechCorp Inc. | Jan 2021 - Present
• Led development of company's flagship SaaS product using React and Next.js
• Improved application performance by 40% through code optimization and lazy loading
• Implemented comprehensive testing strategy using Jest and React Testing Library
• Mentored junior developers and conducted code reviews

Frontend Engineer | WebSolutions LLC | Mar 2018 - Dec 2020
• Developed responsive web applications using React and TypeScript
• Collaborated with UX/UI designers to implement pixel-perfect interfaces
• Built reusable component library that reduced development time by 30%
• Integrated third-party APIs and services

EDUCATION
Bachelor of Science in Computer Science
University of Technology | Graduated: May 2018
    `

    return NextResponse.json({ alteredResume: mockAlteredResume })
  } catch (error: any) {
    // Global catch-all error handler
    console.error("CRITICAL ERROR in alter-resume route:", error)

    // Always return a valid JSON response
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message || "An unexpected error occurred.",
      },
      { status: 500 },
    )
  }
}

export const dynamic = "force-dynamic"
