import os
from google import genai
from google.genai import types
from dotenv import load_dotenv
import json

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    # Use a dummy client or mock if no key is provided just for startup, but it will fail on call
    client = None
else:
    client = genai.Client(api_key=api_key)

MODEL_ID = "gemini-2.5-flash"

async def refine_query(user_input: str) -> str:
    if not client: return user_input
    prompt = f"Refine the following user project idea into a concise academic search query (max 5 words) suitable for finding research papers on Semantic Scholar or arXiv. Only return the refined query string.\n\nUser Input: {user_input}"
    response = await client.aio.models.generate_content(
        model=MODEL_ID,
        contents=prompt
    )
    return response.text.strip()

async def summarize_paper(title: str, abstract: str) -> dict:
    if not client: return {"summary": "No API Key"}
    prompt = f"""
    Analyze the following research paper title and abstract.
    Title: {title}
    Abstract: {abstract}
    
    Summarize this research paper in simple terms. Extract the problem, method, and result clearly.
    Return the response ONLY as a JSON object with the following keys:
    - simple_explanation: A student-friendly 1-2 sentence explanation.
    - problem_statement: The main problem the paper addresses.
    - methodology: The approach or method used.
    - key_results: The main findings or results.
    """
    try:
        response = await client.aio.models.generate_content(
            model=MODEL_ID,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            )
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Error summarizing paper: {e}")
        return {
            "simple_explanation": "Error generating summary.",
            "problem_statement": "N/A",
            "methodology": "N/A",
            "key_results": "N/A"
        }

async def analyze_gaps_and_ideas(papers: list) -> dict:
    if not client: return {"gaps": "No API Key"}
    
    paper_texts = "\n\n".join([f"Title: {p['title']}\nAbstract: {p['abstract']}" for p in papers])
    
    prompt = f"""
    Given these research papers:
    {paper_texts}
    
    Perform two tasks and return the result ONLY as a JSON object:
    
    Task 1: Identify common approaches, limitations, and research gaps. Suggest improvements.
    Task 2: Based on these research gaps, suggest 3 mini project ideas and 1 major project idea with tech stack.
    
    Return the JSON with exactly this structure:
    {{
        "gap_analysis": {{
            "common_approaches": ["point 1", "point 2"],
            "limitations": ["point 1", "point 2"],
            "research_gaps": ["point 1", "point 2"],
            "suggested_improvements": ["point 1", "point 2"]
        }},
        "ideas": {{
            "mini_projects": [
                {{"title": "Idea 1", "description": "Desc", "tech_stack": ["tech1", "tech2"]}},
                {{"title": "Idea 2", "description": "Desc", "tech_stack": ["tech1", "tech2"]}},
                {{"title": "Idea 3", "description": "Desc", "tech_stack": ["tech1", "tech2"]}}
            ],
            "major_project": {{
                "title": "Major Idea",
                "description": "Desc",
                "tech_stack": ["tech1", "tech2"]
            }}
        }}
    }}
    """
    try:
        response = await client.aio.models.generate_content(
            model=MODEL_ID,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            )
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Error analyzing gaps: {e}")
        return {}
