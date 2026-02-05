import datetime
import json
import base64
import pandas as pd
from openai import OpenAI
import io
import os


client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

uploaded_data = None

def convert_to_serializable(obj):
    """Convert pandas Timestamp and other non-serializable objects to strings"""
    if pd.isna(obj):
        return None
    elif isinstance(obj, pd.Timestamp):
        return obj.strftime('%Y-%m-%d')
    elif isinstance(obj, datetime):
        return obj.strftime('%Y-%m-%d')
    elif isinstance(obj, pd.Series):
        return obj.tolist()
    else:
        return obj


def process_excel_from_base64(base64_data: str):
    """Process uploaded Excel file from base64"""
    try:
        # Decode base64
        file_bytes = base64.b64decode(base64_data)
        
        # Read Excel file
        excel_data = pd.read_excel(io.BytesIO(file_bytes))
        
        # Convert datetime columns to string
        for col in excel_data.columns:
            if pd.api.types.is_datetime64_any_dtype(excel_data[col]):
                excel_data[col] = excel_data[col].dt.strftime('%Y-%m-%d')
                
        # Convert to list of dictionaries with proper serialization
        data_preview = []
        for _, row in excel_data.head(100).iterrows():
            row_dict = {}
            for col in excel_data.columns:
                val = row[col]
                if pd.isna(val):
                    row_dict[col] = None
                elif isinstance(val, pd.Timestamp):
                    row_dict[col] = val.strftime('%Y-%m-%d')
                elif isinstance(val, datetime.datetime):
                    row_dict[col] = val.strftime('%Y-%m-%d')
                else:
                    row_dict[col] = val
            data_preview.append(row_dict)
        
        # Convert to dictionary format for LLM
        result = {
            "filename": "uploaded_file.xlsx",
            "total_rows": len(excel_data),
            "total_columns": len(excel_data.columns),
            "column_names": list(excel_data.columns),
            "data_preview": data_preview
        }
        
        return result
    except Exception as e:
        return {"error": str(e)}
    

def Load_json(filepath: str):
    with open(filepath,"r", encoding="utf-8") as j:
        return json.load(j)
    

def Chat_Completion(query: str) -> str:
    global uploaded_data
    
    if not uploaded_data:
        return "No data uploaded. Please upload an Excel file first."
    
    System_message = f"""
   You are an intelligent finance assistant operating as a coordinated team of finance agents:

    • Accounts Receivable Agent – handles collections, overdue, payments
    • Compliance Agent – monitors GST, TDS, statutory obligations
    • Finance Controller – reviews summaries, trends, and management insights

    You work together silently and present a single, clear response to the user.

    ────────────────────────
    OPERATING PRINCIPLES
    ────────────────────────

    1. ALWAYS complete the user's primary request first.
    2. After completing the task, add value by:
       - highlighting important observations
       - suggesting 1–2 meaningful next actions
    3. Ask AT MOST ONE follow-up question — only if it clearly advances the work.
    4. Do NOT ask follow-ups for trivial choices.
    5. Avoid verbosity, but do not be shallow.

    ────────────────────────
    RESPONSE STRUCTURE (DEFAULT)
    ────────────────────────

    [Result / data requested]

    INSIGHTS
    • 1–2 observations that matter

    SUGGESTED ACTIONS
    → 1–2 concrete actions you can take next

    FOLLOW-UP (optional, only one)
    • Ask one question that helps continue the workflow

    ────────────────────────
    DATA SOURCE INFORMATION
    ────────────────────────

    Current data source: Uploaded Excel file
    Columns available: {uploaded_data.get('column_names', [])}
    Total rows: {uploaded_data.get('total_rows', 0)}

    ────────────────────────
    SPECIAL CASES
    ────────────────────────

    • If the user asks ONLY for a report → keep insights brief.
    • If the user asks for an action → confirm action, then suggest what else can be done.
    • If the user asks for MIS → provide structured management-ready summary.

    ────────────────────────
    STRICT RULES
    ────────────────────────

    • Use ONLY the provided Excel data - DO NOT use any external knowledge
    • If data doesn't contain requested information, say so clearly
    • Never fabricate or assume data that isn't present
    • Use ₹ for currency and Indian date formats
    • Be confident and professional
    • Provide insights based ONLY on the actual data provided
    • Refer to specific columns by their exact names from the data
    """
    
    prompt =  f"""
    USER QUERY: {query}

    EXCEL DATA STRUCTURE:
    - File: {uploaded_data.get('filename', 'Unknown')}
    - Total Rows: {uploaded_data.get('total_rows', 0)}
    - Total Columns: {uploaded_data.get('total_columns', 0)}
    - Column Names: {uploaded_data.get('column_names', [])}

    DATA PREVIEW (first {len(uploaded_data.get('data_preview', []))} rows):
    {json.dumps(uploaded_data.get('data_preview', []), indent=2)}

     IMPORTANT INSTRUCTIONS:
    1. Analyze ONLY the data provided above
    2. If the query asks about something not in the data, say: "This information is not available in the uploaded file."
    3. Use exact column names as shown above
    4. Provide numerical analysis where possible
    5. For calculations, show your reasoning

    CRITICAL FILTERING RULES:
    - When asked about "pending", "overdue", "balance due", "unpaid", etc., ONLY include records where:
      • "Balance due" column is GREATER THAN 0, OR
      • "Amount Received" is LESS THAN "Total Amount", OR  
      • Payment status indicates pending/overdue
    - DO NOT include settled/paid records (where balance due is 0 or amount received equals total amount)
    - If a record shows ₹0 balance due, it's settled - DO NOT list it
    - If "Amount Received" equals "Total Amount", the invoice is paid - DO NOT list it
    - Report only actual pending/overdue items

    EXAMPLE: If user asks "Show pending invoices", filter to show only invoices with balance due > 0

    FORMATTING REQUIREMENTS:
    - Use clean, concise bullet points
    - Include relevant details: Client, Invoice Number, Balance Due
    - Do not add explanations for excluded items
    - If all invoices are paid, say "All invoices are settled. No pending balances."
    """

    response = client.chat.completions.create(
        model = "gpt-4.1-nano",
        messages=[
            {
                "role": "system", "content": System_message
            },
            {
                "role": "user", "content": prompt
            }
        ],
        temperature=0.1
    )
    answer = response.choices[0].message.content
    print(answer)
    return answer

def set_uploaded_data(data):
    global uploaded_data
    uploaded_data = data

def clear_uploaded_data():
    """Clear uploaded data"""
    global uploaded_data
    uploaded_data = None
