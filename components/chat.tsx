"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { type Message, streamMessage } from "@/lib/chat"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
import { Loader2, Send, User } from "lucide-react"
import { cn } from "@/lib/utils"

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: "user", content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setError(null)

    // Add a placeholder for the assistant's message
    const placeholderIndex = messages.length + 1
    setMessages((prev) => [...prev, { role: "assistant", content: "" }])

    try {
      let fullResponse = ""

      // Use streaming for a better UX
      streamMessage(
        [...messages, userMessage],
        (chunk) => {
          fullResponse += chunk
          setMessages((prev) => {
            const newMessages = [...prev]
            newMessages[placeholderIndex] = {
              role: "assistant",
              content: fullResponse,
            }
            return newMessages
          })
        },
        (error) => {
          setError(`Error: ${error}`)
          setIsLoading(false)
        },
        () => {
          setIsLoading(false)
        },
      )
    } catch (err) {
      setError("Failed to send message. Make sure Ollama is running locally.")
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle>Chat with Gemma2 (Offline)</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        <div className="space-y-4 pb-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">Start a conversation with Gemma2</div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-start gap-3 rounded-lg p-4",
                  message.role === "user" ? "bg-muted" : "bg-background border",
                )}
              >
                <Avatar className="h-8 w-8">
                  {message.role === "user" ? (
                    <User className="h-5 w-5" />
                  ) : (
                    <div className="bg-primary text-primary-foreground flex h-full w-full items-center justify-center rounded-full text-sm">
                      AI
                    </div>
                  )}
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <div className="prose dark:prose-invert">
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4">
        {error && <div className="text-red-500 mb-2 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
          <Textarea
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-10 flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}

