import { useState } from "react"
import ChatBubble from "./components/ChatBubble"
import type { Message } from "./types"
import "./App.css"

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return
    setIsStreaming(true)

    setMessages(prev => [...prev, { role: "user", content: input }])
    setInput("")

    const response = await fetch("http://127.0.0.1:8000/chat/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input })
    })

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const events = chunk.split("\n\n")

      for (const event of events) {
        if (!event.startsWith("data:")) continue
        const text = event.replace("data:", "").trim()
        if (!text) continue

        setMessages(prev => [...prev, { role: "agent", content: text }])
        await new Promise(r => setTimeout(r, 300))
      }
    }

    setIsStreaming(false)
  }

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2 className="logo">Finance AI</h2>
        <nav>
          <button className="active">💬 Chat</button>
          <button>📄 Invoice Analysis</button>
          <button>📊 Reports</button>
        </nav>
      </aside>

      {/* Chat Area */}
      <main className="chat-container">
        <header className="chat-header">
          💼 Finance AI Chat
        </header>

        <section className="chat-body">
          {messages.map((m, i) => (
            <ChatBubble key={i} role={m.role} content={m.content} />
          ))}

          {isStreaming && (
            <div className="typing">Finance AI is working</div>
          )}
        </section>

        <footer className="chat-input">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your finance question..."
            onKeyDown={e => e.key === "Enter" && sendMessage()}
          />
          <button onClick={sendMessage} disabled={isStreaming}>
            Send
          </button>
        </footer>
      </main>
    </div>
  )
}

export default App
