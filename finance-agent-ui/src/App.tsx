import { useEffect, useState, useRef } from "react"
import ChatBubble from "./components/ChatBubble"
import type { Message } from "./types"
import "./App.css"
import {
  CalendarCheck, AlertOctagon, Download, Upload,
  Trash2
} from "lucide-react"

import toast, { Toaster } from 'react-hot-toast'

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  const [hasData, setHasData] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<{
    status: 'idle' | 'uploading' | 'success' | 'error',
    message: string
  }>({ status: 'idle', message: '' })


  const chatBodyRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /* 🔄 Finance-style typing messages */
  const statusMessages = [
    "Running reconciliation…",
    "Checking invoice status…",
    "Matching bank transactions…"
  ]
  const [statusIndex, setStatusIndex] = useState(0)

  /* Check data status on mount */
  useEffect(() => {
    checkDataStatus()
  }, [])


  /* File Upload Handler - UPDATED with toast messages */
  const handleFileUpload = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) return

    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      toast.error('Please upload Excel file (.xlsx, .xls)')
      return
    }

    const uploadToast = toast.loading('Uploading file...')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('http://127.0.0.1:8000/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(`File uploaded: ${file.name}`, { id: uploadToast })
        setHasData(true)
      } else {
        toast.error(`Upload failed: ${result.error}`, { id: uploadToast })
      }
    } catch (error) {
      toast.error('Network error. Please try again.', { id: uploadToast })
    }
  }

  const checkDataStatus = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/data-status')
      const data = await response.json()
      setHasData(data.has_data)
      if (data.has_data) {
        toast.success('Excel file is loaded and ready', { duration: 3000 })
      }
    } catch (error) {
      console.error("Failed to check data status:", error)
    }
  }

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

    // Check if data is uploaded
    if (!hasData) {
      setMessages(prev => [...prev, {
        role: 'agent',
        content: '⚠️ Please upload an Excel file first. Click the Upload button to add your data.'
      }])
      return
    }

    setIsStreaming(true)
    setInput("")

    setMessages(prev => [...prev, { role: "user", content: finalText }])

    try {
      // Create FormData instead of JSON
      const formData = new FormData()
      formData.append('message', finalText)

      const response = await fetch("http://127.0.0.1:8000/chat/stream", {
        method: "POST",
        body: formData  // Send FormData, not JSON
        // Don't set Content-Type header - browser sets it automatically for FormData
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
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'agent',
        content: '❌ Error connecting to server'
      }])
    } finally {
      setIsStreaming(false)
    }
  }

  /* 🔁 Called when user clicks an ACTION chip */
  const handleAgentAction = (actionText: string) => {
    sendMessage(actionText)
  }

  const handleClearData = async () => {
    try {
      await fetch('http://127.0.0.1:8000/clear-data', { method: 'POST' })
      setHasData(false)
      setMessages([])
      setInput("")
    } catch (error) {
      console.error("Failed to clear data:", error)
    }
  }

  return (
    <div className="app">
      {/* Add Toaster component at the top */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
          loading: {
            duration: Infinity,
          },
        }}
      />

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".xlsx,.xls"
        style={{ display: 'none' }}
      />

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
              placeholder={
                hasData
                  ? "Ask about your Excel data..."
                  : "Upload Excel file to begin..."
              }
              disabled={isStreaming}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
            />

            {/* Footer with Action Grid and Send Section */}
            <div className="input-footer">
              {/* LEFT: Action Buttons Grid */}
              <div className="actions-grid">
                {/* Reminder Button */}
                <button
                  className={`grid-action-btn ${selectedAction === "reminder" ? "selected" : ""}`}
                  onClick={() => setSelectedAction(selectedAction === "reminder" ? null : "reminder")}
                  data-label="Send Reminder"
                  type="button"
                  disabled={!hasData || isStreaming}
                >
                  <CalendarCheck size={18} />
                </button>

                {/* Escalate Button */}
                <button
                  className={`grid-action-btn ${selectedAction === "escalate" ? "selected" : ""}`}
                  onClick={() => setSelectedAction(selectedAction === "escalate" ? null : "escalate")}
                  data-label="Escalate"
                  type="button"
                  disabled={!hasData || isStreaming}
                >
                  <AlertOctagon size={18} />
                </button>

                {/* Download Button */}
                <button
                  className={`grid-action-btn ${selectedAction === "download" ? "selected" : ""}`}
                  onClick={() => setSelectedAction(selectedAction === "download" ? null : "download")}
                  data-label="Download Report"
                  type="button"
                  disabled={!hasData || isStreaming}
                >
                  <Download size={18} />
                </button>
              </div>

              {/* RIGHT: Send Section with Utility Buttons */}
              <div className="send-section">
                {/* Utility Buttons */}
                <div className="utility-buttons">
                  {/* Upload Button - UPDATED */}
                  <button
                    className="utility-btn"
                    data-label="Upload Excel"
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                    disabled={isStreaming}
                  >
                    <Upload size={18} />
                  </button>

                  {/* Clear Button - UPDATED to clear data */}
                  <button
                    className="utility-btn"
                    data-label="Clear Data"
                    onClick={handleClearData}
                    type="button"
                    disabled={isStreaming}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* Send Button */}
                <button
                  className="send-btn"
                  onClick={() => sendMessage()}
                  disabled={isStreaming || !input.trim() || !hasData}
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
