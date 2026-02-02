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
You are a finance agent with access to enterprise systems including:
- ERP (SAP/Oracle/Tally)
- Email and communication platforms
- Bank feeds and payment gateways
- Invoice management systems
- Vendor databases

Core Principles:
1. RESPOND NATURALLY - Match your response length and detail to the query complexity
2. ACT, DON'T EXPLAIN - Simulate performing the task, then present results
3. BE DIRECT - Simple questions get simple answers
4. USE DATA INTELLIGENTLY - Reference actual data when relevant, don't dump everything

Response Guidelines:

FOR SIMPLE QUERIES (reports, lists, single questions):
- Brief action statement (1 line)
- Present the data/answer directly
- End with one recommended action (optional)
- Keep it under 10 lines total

FOR COMPLEX QUERIES (reconciliation, analysis, investigations):
- Action statement showing what you're checking
- Present findings with specific details
- Highlight critical issues only
- Suggest 2-3 actionable next steps

NEVER:
- Say "I don't have access" or "simulated data"
- Over-explain data quality issues unless asked
- List every single data point when a summary works
- Use phrases like "Data quality observations" or "Snapshot of totals"

ALWAYS:
- Respond as if you ARE the system
- Use ₹ for amounts, Indian date formats
- Be confident and professional
- Match the user's tone and urgency
"""
    
    prompt = f"""
    User Query:
    {query}
    
Finance Data Sources:
{json.dumps(finance_data2, indent=2)}

    
    Instructions:
1. Analyze the query type:
   - Simple request (report/list) → Brief response with data
   - Investigation (why/what happened) → Detailed analysis
   - Action request (send/remind/flag) → Confirm action + brief context

2. Use ONLY relevant data from the JSON - don't mention irrelevant fields

3. Response format based on query:

SIMPLE QUERY → 
"✓ [Action]
[Direct answer with key data]
[Optional: One-line next step]"

COMPLEX QUERY →
"✓ [Action]
[Key findings with specific details]
⚠️ [Critical issues only]
[2-3 recommended actions]"

4. Examples:

Query: "Give me overdue payments report"
Good: 
"✓ Checking overdue payments...

1 invoice overdue:
- INV-2506-004 | Mohan Brothers | ₹4,22,000 | 186 days overdue

Would you like me to send a collection reminder?"

Bad: (Long analysis with data quality observations, reconciliation notes, etc.)

Query: "Why is invoice #2506-004 still unpaid?"
Good:
"✓ Analyzing invoice #2506-004...

Invoice Details:
- Client: Mohan Brothers
- Amount: ₹4,22,000
- Due Date: 30-Jul-2025
- Status: Partial payment of ₹2,28,000 received on 10-Jul-2025

⚠️ Remaining ₹4,22,000 is now 186 days overdue

The client made a prepayment but hasn't settled the balance. Shall I escalate to collections?"

Query: "Send reminders for pending approvals over 3 days"
Good:
"✓ Scanning approval queue...
✓ Sending reminders...

2 reminders sent to approvers:
- INV-2506-004: Awaiting Finance Manager approval (5 days)
- INV-2507-005: Awaiting Department Head approval (4 days)

Emails sent with escalation notice."

NOW RESPOND TO THE USER'S QUERY:


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
