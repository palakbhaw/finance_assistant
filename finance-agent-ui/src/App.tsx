import { useEffect, useState, useRef } from "react"
import ChatBubble from "./components/ChatBubble"
import type { Message } from "./types"
import "./App.css"
import {
  Search, Paperclip, CalendarCheck, AlertOctagon, Download, Upload,
  Trash2
} from "lucide-react"

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [selectedAction, setSelectedAction] = useState<string | null>(null)

  const chatBodyRef = useRef<HTMLDivElement>(null)

  /* 🔄 Finance-style typing messages */
  const statusMessages = [
    "Running reconciliation…",
    "Checking invoice status…",
    "Matching bank transactions…"
  ]
  const [statusIndex, setStatusIndex] = useState(0)

  /* Auto-scroll */
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight
    }
  }, [messages, isStreaming])

  /* Typing animation */
  useEffect(() => {
    if (!isStreaming) return
    const id = setInterval(() => {
      setStatusIndex(i => (i + 1) % statusMessages.length)
    }, 1500)
    return () => clearInterval(id)
  }, [isStreaming])

  /* 🔥 Core send logic */
  const sendMessage = async (text?: string) => {
    const finalText = text ?? input
    if (!finalText.trim() || isStreaming) return

    setIsStreaming(true)
    setInput("")

    setMessages(prev => [...prev, { role: "user", content: finalText }])

    const response = await fetch("http://127.0.0.1:8000/chat/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: finalText })
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
        await new Promise(r => setTimeout(r, 250))
      }
    }

    setIsStreaming(false)
  }

  /* 🔁 Called when user clicks an ACTION chip */
  const handleAgentAction = (actionText: string) => {
    sendMessage(actionText)
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
            <ChatBubble
              key={i}
              role={m.role}
              content={m.content}
              onActionClick={handleAgentAction}
            />
          ))}

          {isStreaming && (
            <div className="typing">
              ⏳ {statusMessages[statusIndex]}
            </div>
          )}
        </section>

        {/* Input */}
        <div className="chat-input">
          <div className="input-box">
            {/* Main Input Field */}
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your finance question..."
              disabled={isStreaming}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
            />

            {/* Footer with Action Grid and Send Section */}
            <div className="input-footer">
              {/* LEFT: Action Buttons Grid (3 buttons in a grid) */}
              <div className="actions-grid">
                {/* Reminder Button */}
                <button
                  className={`grid-action-btn ${selectedAction === "reminder" ? "selected" : ""}`}
                  onClick={() => setSelectedAction(selectedAction === "reminder" ? null : "reminder")}
                  data-label="Send Reminder"
                  type="button"
                >
                  <CalendarCheck size={18} />
                </button>

                {/* Escalate Button */}
                <button
                  className={`grid-action-btn ${selectedAction === "escalate" ? "selected" : ""}`}
                  onClick={() => setSelectedAction(selectedAction === "escalate" ? null : "escalate")}
                  data-label="Escalate"
                  type="button"
                  style={{
                    backgroundColor: selectedAction === "reminder" ? '#2563eb' : '#f9fafb',
                    border: `1px solid ${selectedAction === "reminder" ? '#2563eb' : '#e5e7eb'}`,
                    color: selectedAction === "reminder" ? 'white' : '#374151'
                  }}
                >
                  <AlertOctagon size={18} />
                </button>

                {/* Download Button */}
                <button
                  className={`grid-action-btn ${selectedAction === "download" ? "selected" : ""}`}
                  onClick={() => setSelectedAction(selectedAction === "download" ? null : "download")}
                  data-label="Download Report"
                  type="button"
                >
                  <Download size={18} />
                </button>
              </div>

              {/* RIGHT: Send Section with Utility Buttons */}
              <div className="send-section">
                {/* Utility Buttons (2 buttons beside Send) */}
                <div className="utility-buttons">
                  {/* Upload Button */}
                  <button
                    className="utility-btn"
                    data-label="Upload File"
                    onClick={() => console.log("Upload clicked")}
                    type="button"
                  >
                    <Upload size={18} />
                  </button>

                  {/* Clear Button */}
                  <button
                    className="utility-btn"
                    data-label="Clear Chat"
                    onClick={() => {
                      setMessages([]);
                      setInput("");
                    }}
                    type="button"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* Send Button */}
                <button
                  className="send-btn"
                  onClick={() => sendMessage()}
                  disabled={isStreaming || !input.trim()}
                  type="button"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}

export default App
