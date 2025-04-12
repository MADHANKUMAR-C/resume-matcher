"use client"

import type React from "react"

import { useState } from "react"
import { SendHorizonal, Bot } from "lucide-react"

export function GeminiChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<{ role: "user" | "gemini"; text: string }[]>([])

  const toggleSidebar = () => setIsOpen(!isOpen)

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMsg = { role: "user", text: input }
    setMessages((prev) => [...prev, userMsg])
    setInput("")

    const res = await fetch("/api/gemini-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input }),
    })

    const data = await res.json()
    const botMsg = { role: "gemini", text: data.reply }
    setMessages((prev) => [...prev, botMsg])
  }

  return (
    <>
      {/* Floating button */}
      <button
        className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white rounded-full w-14 h-14 shadow-lg hover:bg-blue-700 transition-all"
        onClick={toggleSidebar}
      >
        💬
      </button>

      {/* Sidebar */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 w-80 h-[400px] bg-grey shadow-xl border border-gray-200 rounded-xl flex flex-col z-50">
          <div className="p-3 border-b font-semibold flex items-center gap-2 bg-grey- 500">
            <Bot className="h-5 w-15" /> SkillZilla Chatbot
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`p-2 rounded-lg max-w-[90%] ${msg.role === "user" ? "text-right ml-auto" : "mr-auto"}`}
                style={{
                  backgroundColor: msg.role === "user" ? "#DCF8C6" : "#E6ECF0", // Green & soft gray
                  color: "#1a1a1a",
                }}
              >
                <span>{msg.text}</span>
              </div>
            ))}
          </div>
          <form onSubmit={sendMessage} className="flex border-t p-2 gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 p-2 border rounded-md text-sm"
              placeholder="Ask SkillZilla..."
            />
            <button type="submit" className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700">
              <SendHorizonal size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
