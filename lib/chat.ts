export type Message = {
  role: "user" | "assistant" | "system"
  content: string
}

export async function sendMessage(messages: Message[]): Promise<string> {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages }),
    })

    if (!response.ok) {
      throw new Error("Failed to send message")
    }

    const data = await response.json()
    return data.response
  } catch (error) {
    console.error("Error sending message:", error)
    throw error
  }
}

export function streamMessage(
  messages: Message[],
  onChunk: (chunk: string) => void,
  onError: (error: string) => void,
  onComplete: () => void,
): () => void {
  const eventSource = new EventSource("/api/chat/stream", {
    withCredentials: true,
  })

  const controller = new AbortController()
  const signal = controller.signal

  fetch("/api/chat/stream", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages }),
    signal,
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok")
      }
      return response.body
    })
    .then((body) => {
      if (!body) {
        throw new Error("No response body")
        return
      }

      const reader = body.getReader()
      const decoder = new TextDecoder()

      function read() {
        reader
          .read()
          .then(({ done, value }) => {
            if (done) {
              onComplete()
              return
            }

            const chunk = decoder.decode(value)
            const lines = chunk.split("\n\n")

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.substring(6))
                  if (data.content) {
                    onChunk(data.content)
                  }
                } catch (e) {
                  console.error("Error parsing JSON:", e)
                }
              }
            }

            read()
          })
          .catch((error) => {
            onError(error.message)
          })
      }

      read()
    })
    .catch((error) => {
      onError(error.message)
    })

  return () => {
    controller.abort()
  }
}
