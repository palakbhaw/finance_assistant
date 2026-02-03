import { useEffect, useState, useRef } from "react"
import ChatBubble from "./components/ChatBubble"
import type { Message } from "./types"
import "./App.css"
import { Search, Paperclip, CalendarCheck, AlertOctagon, Download } from "lucide-react";

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)

  const chatBodyRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [selectedAction, setSelectedAction] = useState<string | null>(null);



  /* 🔄 Finance-style typing messages */
  const statusMessages = [
    "Running reconciliation…",
    "Checking invoice status…",
    "Matching bank transactions…"
  ]
  const [statusIndex, setStatusIndex] = useState(0)

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight
    }
  }, [messages, isStreaming]) // Also trigger when streaming starts/stops

  useEffect(() => {
    if (!isStreaming) return
    const id = setInterval(() => {
      setStatusIndex(i => (i + 1) % statusMessages.length)
    }, 1500)
    return () => clearInterval(id)
  }, [isStreaming])

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

  /* 🧪 Dummy action handlers */
  const addSystemMessage = (text: string) => {
    setMessages(p => [...p, { role: "agent", content: text }])
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
          <span>💼 Finance AI Chat</span>

        </header>

        <section className="chat-body" ref={chatBodyRef}>
          {messages.map((m, i) => (
            <ChatBubble key={i} role={m.role} content={m.content} />
          ))}

          {isStreaming && (
            <div className="typing">
              ⏳ {statusMessages[statusIndex]}
            </div>
          )}

          <div ref={messagesEndRef} />
        </section>
        <div className="chat-input">
          <div className="input-box">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your finance question..."
              disabled={isStreaming}
            />

            {/* Action buttons inside input box */}
            <div className="input-actions">

              {/* Three primary action buttons grouped */}
              <div className="primary-actions">
                <div
                  className={`icon-btn action-btn ${selectedAction === "reminder" ? "selected" : ""}`}
                  onClick={() => setSelectedAction("reminder")}
                  data-label="Send Reminder"
                >
                  <CalendarCheck size={20} />
                </div>

                <div
                  className={`icon-btn action-btn ${selectedAction === "escalate" ? "selected" : ""}`}
                  onClick={() => setSelectedAction("escalate")}
                  data-label="Escalate"
                >
                  <AlertOctagon size={20} />
                </div>

                <div
                  className={`icon-btn action-btn ${selectedAction === "download" ? "selected" : ""}`}
                  onClick={() => setSelectedAction("download")}
                  data-label="Download"
                >
                  <Download size={20} />
                </div>
              </div>

              {/* Text input */}
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your finance question..."
                disabled={isStreaming}
              />

              {/* Bottom icons + send */}
              <div className="bottom-row">
                <div className="utilities">
                  <div className="icon-btn" data-label="Web Search">
                    <Search size={20} />
                  </div>
                  <div className="icon-btn" data-label="Attach File">
                    <Paperclip size={20} />
                  </div>
                </div>

                <button className="send-btn" onClick={sendMessage}>
                  Send
                </button>
              </div>
            </div>
          </div>

      </main>
    </div>
  )
}

export default App
