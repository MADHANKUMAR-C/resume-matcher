import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid message format" }, { status: 400 })
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    // Join all messages into a single prompt with role context
    const prompt = messages
      .map((msg: any) => {
        const prefix = msg.role === "user" ? "User:" : "Assistant:"
        return `${prefix} ${msg.content}`
      })
      .join("\n")

    const result = await model.generateContent(prompt)
    const response = result.response
    const reply = response.text().trim()

    return NextResponse.json({ response: reply })
  } catch (error: any) {
    console.error("Error in chat route:", error)
    return NextResponse.json({ error: "Failed to process your request" }, { status: 500 })
  }
}
