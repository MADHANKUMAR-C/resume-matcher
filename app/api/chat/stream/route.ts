import type { NextRequest } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" })

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Create prompt from message history
          const parts = messages.map((msg: any) => ({
            role: msg.role,
            parts: [{ text: msg.content }],
          }))

          const chat = model.startChat({ history: parts })
          const result = await chat.sendMessageStream(messages[messages.length - 1].content)

          for await (const chunk of result.stream) {
            const content = chunk.text()
            if (content) {
              controller.enqueue(`data: ${JSON.stringify({ content })}\n\n`)
            }
          }

          controller.close()
        } catch (err) {
          controller.error(`Streaming error: ${err}`)
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("Error in stream route:", error)
    return new Response(`data: ${JSON.stringify({ error: "Failed to process your request" })}\n\n`, {
      status: 500,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  }
}
