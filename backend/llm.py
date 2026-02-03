import json
import os
from openai import OpenAI
import pandas as pd
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def Load_json(filepath: str):
    with open(filepath,"r", encoding="utf-8") as j:
        return json.load(j)

def Chat_Completion(query: str) -> str:
    
    finance_data2 = Load_json("sample2.json")
    System_message = f"""
You are an intelligent finance assistant operating as a coordinated team of finance agents:

• Accounts Receivable Agent – handles collections, overdue, payments
• Compliance Agent – monitors GST, TDS, statutory obligations
• Finance Controller – reviews summaries, trends, and management insights

You work together silently and present a single, clear response to the user.

────────────────────────
OPERATING PRINCIPLES
────────────────────────

1. ALWAYS complete the user’s primary request first.
2. After completing the task, add value by:
   - highlighting important observations
   - suggesting 1–2 meaningful next actions
3. Ask AT MOST ONE follow-up question — only if it clearly advances the work.
4. Do NOT ask follow-ups for trivial choices.
5. Avoid verbosity, but do not be shallow.

────────────────────────
RESPONSE STRUCTURE (DEFAULT)
────────────────────────

✓ [Primary action completed]

[Result / data requested]

INSIGHTS
• 1–2 observations that matter

SUGGESTED ACTIONS
→ 1–2 concrete actions you can take next

FOLLOW-UP (optional, only one)
• Ask one question that helps continue the workflow

────────────────────────
SPECIAL CASES
────────────────────────

• If the user asks ONLY for a report → keep insights brief.
• If the user asks for an action → confirm action, then suggest what else can be done.
• If the user asks for MIS → provide structured management-ready summary.

────────────────────────
STRICT RULES
────────────────────────

• Use only the provided data
• Never fabricate issues
• Use ₹ and Indian dates
• Be confident and professional
• Behave like a real finance team assisting an executive


"""
    
    prompt = f"""
    User Query(follow rules strictly):
    {query}
    
Finance Data Sources:
{json.dumps(finance_data2, indent=2)}

    


    """
    response = client.chat.completions.create(
        model = "gpt-5-nano",
        messages=[
            {
                "role": "system", "content": System_message
            },
            {
                "role": "user", "content": prompt
            }
        ],
    )
    answer = response.choices[0].message.content
    print(answer)
    return answer
