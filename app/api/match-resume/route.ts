import { type NextRequest, NextResponse } from "next/server"
import { parseJobDescription } from "@/lib/resume-parser"
import pdfParse from "pdf-parse"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Add OPTIONS handler to respond to preflight requests
export async function OPTIONS(req: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(req: NextRequest) {
  // Log the request method and headers for debugging
  console.log("Request method:", req.method);
  console.log("Request headers:", Object.fromEntries(req.headers.entries()));
  
  try {
    // Check content type
    const contentType = req.headers.get('content-type') || '';
    console.log("Content-Type:", contentType);
    
    if (!contentType.includes('multipart/form-data') && !contentType.includes('application/x-www-form-urlencoded')) {
      console.log("Invalid content type for FormData request");
    }
    
    let formData;
    try {
      formData = await req.formData();
      console.log("FormData parsed successfully");
    } catch (error) {
      console.error("Error parsing FormData:", error);
      return NextResponse.json({ error: "Failed to parse form data" }, { status: 400 });
    }
    
    const resumeFile = formData.get("resume") as File;
    const jobDescription = formData.get("jobDescription") as string;

    console.log("Resume file received:", resumeFile ? resumeFile.name : "No file");
    console.log("Job description length:", jobDescription ? jobDescription.length : 0);

    if (!resumeFile) {
      return NextResponse.json({ error: "Resume file is required" }, { status: 400 })
    }

    const arrayBuffer = await resumeFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const parsed = await pdfParse(buffer)
    const resumeText = parsed.text

    // Build the prompt for the Gemini API
    let prompt = ""

    if (jobDescription) {
      const parsedJobDescription = parseJobDescription(jobDescription, true)

      prompt = `
You are an expert recruiter and career advisor. Analyze the provided resume and job description to provide a comprehensive career assessment.

PART 1: JOB MATCH ANALYSIS
Analyze ONLY the overlap between the job description and the candidate's resume.
1. Identify up to 5 matchedSkills from the resume that are directly useful for the job description.
2. Identify up to 5 missingSkills from the job description that are not found in the resume.
3. Provide 1–3 useful suggestions to improve job fit.
4. Provide a short explanation.
5. Calculate matchPercentage ONLY based on matchedSkills that directly align with job description needs.

PART 2: CAREER RECOMMENDATIONS
Based on the resume alone:
1. Suggest 5 popular companies that would be a good fit for this candidate's skills and experience.
   For each company, provide name, brief explanation of why it's a good match, and primary industry.
2. Suggest 5 specific job titles that match the candidate's skills, are in high demand, and represent logical career steps.
   For each job, provide title, brief explanation of match, key skills they already have, and 1-2 skills to develop.

IMPORTANT: Your response MUST be valid JSON. Do not include any text before or after the JSON object.
Respond in this JSON format only:
{
  "matchPercentage": number (0-100),
  "matchedSkills": string[] (max 5),
  "missingSkills": string[] (max 5),
  "suggestions": string[] (max 3),
  "explanation": string (brief 1-2 lines),
  "companies": [
    {
      "name": "Company Name",
      "reason": "Brief explanation of match",
      "industry": "Primary industry"
    }
  ],
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
${resumeText}

JOB DESCRIPTION:
${parsedJobDescription}
`.trim()
    } else {
      // If no job description, just focus on career recommendations
      prompt = `
You are an expert career advisor with expertise in matching candidates to suitable companies and job roles.
Based on the resume provided, provide a comprehensive career assessment.

PART 1: COMPANY RECOMMENDATIONS
Suggest 5 popular companies that would be a good fit for this candidate's skills and experience.
For each company, provide:
1. Company name
2. Brief explanation of why it's a good match (1-2 sentences)
3. Primary industry

PART 2: JOB RECOMMENDATIONS
Suggest 5 specific job titles that:
1. Match the candidate's existing skills
2. Are currently in high demand and growing
3. Represent logical next steps in their career path

For each job, provide:
1. Job title
2. Brief explanation of why it's a good match (1-2 sentences)
3. Key skills they already have that apply
4. 1-2 skills they might need to develop

IMPORTANT: Your response MUST be valid JSON. Do not include any text before or after the JSON object.
Respond in this JSON format only:
{
  "matchPercentage": 0,
  "matchedSkills": [],
  "missingSkills": [],
  "suggestions": [],
  "explanation": "No job description provided for matching.",
  "companies": [
    {
      "name": "Company Name",
      "reason": "Brief explanation of match",
      "industry": "Primary industry"
    }
  ],
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
${resumeText}
`.trim()
    }

    console.log("Sending comprehensive request to Gemini API...")

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const result = await model.generateContent(prompt)
    const response = result.response
    const content = response.text().trim()

    try {
      // Improved JSON extraction
      console.log("Raw LLM response:", content.substring(0, 500) + "...")

      // Try to find JSON in the response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      let jsonString = jsonMatch ? jsonMatch[0] : null

      if (!jsonString) {
        throw new Error("No JSON object found in the response")
      }

      // Clean up the JSON string - remove any trailing commas before closing brackets
      jsonString = jsonString.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]").replace(/\\"/g, '"').replace(/\\n/g, " ")

      console.log("Extracted JSON:", jsonString.substring(0, 500) + "...")

      let result
      try {
        result = JSON.parse(jsonString)
      } catch (e) {
        console.error("Failed to parse JSON:", e)

        // Fallback result
        const fallbackResult = {
          matchPercentage: 0,
          matchedSkills: [],
          missingSkills: [],
          suggestions: [],
          explanation: "",
          companies: [],
          jobs: [],
        }

        // Extract fallback data
        const matchPercentageMatch = content.match(/"matchPercentage"\s*:\s*(\d+)/)
        if (matchPercentageMatch) {
          fallbackResult.matchPercentage = Number.parseInt(matchPercentageMatch[1], 10)
        }

        // Use the fallback result
        result = fallbackResult
      }

      const finalResult = {
        matchPercentage: result.matchPercentage || 0,
        matchedSkills: result.matchedSkills || [],
        missingSkills: result.missingSkills || [],
        suggestions: result.suggestions || [],
        explanation: result.explanation || "Analysis complete.",
        companies: result.companies || [],
        jobs: result.jobs || [],
        modelUsed: "gemini-1.5-flash",
      }

      // Return with CORS headers
      return NextResponse.json(finalResult, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });
    } catch (error: any) {
      console.error("Error parsing Gemini response:", error)
      console.log("Raw response:", content)

      // Create a fallback result
      const fallbackResult = {
        matchPercentage: 0,
        matchedSkills: ["Could not extract skills"],
        missingSkills: ["Could not extract skills"],
        suggestions: ["Try submitting simpler resume/job inputs"],
        explanation: "Response was incomplete or not fully parseable.",
        companies: [],
        jobs: [],
        modelUsed: "gemini-1.5-flash",
        parsingError: true,
      }

      // Return with CORS headers
      return NextResponse.json(fallbackResult, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });
    }
  } catch (error: any) {
    console.error("Error in match-resume route:", error)
    
    // Return with CORS headers
    return NextResponse.json(
      { error: error.message || "Internal error. Ensure Gemini API key is valid." },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    )
  }
}

export const dynamic = "force-dynamic"
