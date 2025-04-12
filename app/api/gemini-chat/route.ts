import { GoogleGenerativeAI } from "@google/generative-ai"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json()

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "")
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const result = await model.generateContent(message)
    const reply = result.response.text()

    return NextResponse.json({ reply })
  } catch (error: any) {
    console.error("Gemini Chat Error:", error)
    return NextResponse.json({ reply: "❌ Gemini failed: " + error.message }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
