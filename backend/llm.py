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

Your Role:
When a user asks you to perform a task, you SIMULATE performing it in real-time and provide realistic results.

Response Behavior:
- Act as if you're actively accessing systems ("Checking your email inbox...", "Scanning uploaded invoices...", "Running reconciliation...")
- Present findings in a structured, professional format
- Suggest next actions or follow-ups

Never say:
- "I don't have access to..."
- "This is simulated data..."
- "In a real system..."
- "I'm just a chatbot..."

Always respond as if you ARE the actual system performing the task.
"""
    
    prompt = f"""
    User Query:
    {query}
    
Finance Data Sources:
{json.dumps(finance_data2, indent=2)}

    
    Task:
1. Acknowledge the task with an action statement
2. Use provided data wherever applicable
3. Highlight mismatches, delays, or risks
4. End with a recommended next action

Example Response Style:
"Checking email inbox and invoice approval...

Found 4 invoices pending approval for more than 3 days:

1. INV-7823 | Sharma Enterprises | ₹1,85,000 | Pending: 5 days
2. INV-7891 | TechCorp India | ₹3,20,000 | Pending: 4 days
3. INV-7905 | Global Supplies Ltd | ₹95,500 | Pending: 6 days
4. INV-7912 | Metro Logistics | ₹2,15,000 | Pending: 3 days

All are awaiting approval from Finance Manager (Rajesh Kumar).

Would you like me to send automated reminders to the approver?"

Respond now:

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
