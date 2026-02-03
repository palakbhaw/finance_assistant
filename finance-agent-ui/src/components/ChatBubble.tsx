import React from "react"

type Props = {
  role: "user" | "agent"
  content: string
  onActionClick?: (action: string) => void
}

function splitLines(text: string) {
  return text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
}

function stripLeadingBullet(text: string) {
  return text.replace(/^[-\u2022]\s*/u, "").trim()
}

function stripLeadingArrow(text: string) {
  return text.replace(/^(?:\u2192|-)\s*/u, "").trim()
}

function parseAgentResponse(text: string) {
  const normalized = text.replace(/^data:\s*/i, "").trim()
  const lines = splitLines(normalized)

  const idxInsights = lines.findIndex(l => /^INSIGHTS\b/i.test(l))
  const idxActions = lines.findIndex(l => /^(SUGGESTED ACTIONS|ACTIONS)\b/i.test(l))
  const idxFollowUp = lines.findIndex(l => /^FOLLOW[-\s]*UP\b/i.test(l))

  const nextOf = (idx: number) => {
    const candidates = [idxInsights, idxActions, idxFollowUp]
      .filter(i => i > idx)
      .sort((a, b) => a - b)
    return candidates.length ? candidates[0] : lines.length
  }

  const resultEnd = Math.min(
    idxInsights === -1 ? lines.length : idxInsights,
    idxActions === -1 ? lines.length : idxActions,
    idxFollowUp === -1 ? lines.length : idxFollowUp
  )

  const result = lines.slice(0, resultEnd).join("\n").trim()
  const insights =
    idxInsights === -1 ? "" : lines.slice(idxInsights + 1, nextOf(idxInsights)).join("\n").trim()
  const actions =
    idxActions === -1 ? "" : lines.slice(idxActions + 1, nextOf(idxActions)).join("\n").trim()
  const followUp =
    idxFollowUp === -1 ? "" : lines.slice(idxFollowUp + 1).join("\n").trim()

  return { result, insights, actions, followUp, normalized }
}

const ChatBubble: React.FC<Props> = ({ role, content, onActionClick }) => {
  if (role === "user") {
    return (
      <div className="bubble user">
        {content}
      </div>
    )
  }

  const { result, insights, actions, followUp, normalized } = parseAgentResponse(content)
  const hasSections = Boolean(result || insights || actions || followUp)

  const renderLines = (text: string) =>
    splitLines(text).map((line, idx) => <div key={idx}>{line}</div>)

  return (
    <div className="bubble agent">
      {!hasSections && (
        <div className="agent-raw">
          {renderLines(normalized)}
        </div>
      )}

      {result && (
        <div className="agent-result">
          {renderLines(result)}
        </div>
      )}

      {insights && (
        <div className="agent-insights">
          <div className="section-title">Insights</div>
          <ul>
            {splitLines(insights)
              .map(stripLeadingBullet)
              .filter(Boolean)
              .map((i, idx) => (
                <li key={idx}>{i}</li>
              ))}
          </ul>
        </div>
      )}

      {actions && (
        <div className="agent-actions">
          {splitLines(actions)
            .map(stripLeadingArrow)
            .filter(Boolean)
            .map((a, idx) => (
              <button
                key={idx}
                className="action-chip"
                onClick={() => onActionClick?.(a.trim())}
              >
                {a.trim()}
              </button>
            ))}
        </div>
      )}

      {followUp && (
        <div className="agent-followup">
          {"Follow-up: "} {stripLeadingBullet(followUp)}
        </div>
      )}
    </div>
  )
}

export default ChatBubble
