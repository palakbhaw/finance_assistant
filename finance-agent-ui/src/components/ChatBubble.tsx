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
        background: role === "user" ? "#396eeb" : "#e6e7eb",
        color: role === "user" ? "#fff" : "#000",
        padding: "8px 12px",
        borderRadius: "14px",
        maxWidth: "75%",
        whiteSpace: "pre-wrap"
      }}
    >
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
}