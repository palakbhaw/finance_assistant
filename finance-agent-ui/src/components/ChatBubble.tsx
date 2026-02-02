import React from "react"
import ReactMarkdown from "react-markdown"

type Props = {
  role: "user" | "agent"
  content: string
}

export default function ChatBubble({ role, content }: Props) {
  return (
    <div
      style={{
        alignSelf: role === "user" ? "flex-end" : "flex-start",
        background: role === "user" ? "#3468da" : "#4078d3",
        color: "#fff",
        padding: "12px 16px",
        borderRadius: "14px",
        maxWidth: "75%",
        whiteSpace: "pre-wrap"
      }}
    >
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
}