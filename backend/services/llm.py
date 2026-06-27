import os
import re
import json
import logging
from dotenv import load_dotenv
from openai import AsyncOpenAI

load_dotenv()

logger = logging.getLogger(__name__)

api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    logger.warning("GROQ_API_KEY is not set. LLM calls will fail.")
    client = None
else:
    client = AsyncOpenAI(
        api_key=api_key,
        base_url="https://api.groq.com/openai/v1"
    )

MODEL_ID = "llama-3.3-70b-versatile"

def clean_json(text: str) -> str:
    """Strips out markdown code blocks that LLMs sometimes add."""
    if not isinstance(text, str):
        return ""
    text = re.sub(r'^```json\s*', '', text, flags=re.MULTILINE)
    text = re.sub(r'\s*```$', '', text, flags=re.MULTILINE)
    return text.strip()

async def refine_query(user_input: str) -> str:
    """Refine a raw user query into a clean academic search string."""
    if not client:
        raise RuntimeError("GROQ_API_KEY is not configured on the server.")
    
    prompt = (
        "Refine the following user project idea into a highly specific academic search query "
        "using exactly 3 to 4 core technical keywords. Avoid broad or generic terms. "
        "Only return the refined query string.\n\nUser Input: " + user_input
    )
    
    response = await client.chat.completions.create(
        model=MODEL_ID,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3
    )
    return response.choices[0].message.content.strip()

async def summarize_paper(title: str, abstract: str) -> dict:
    """Summarize a research paper using Groq."""
    if not client:
        raise RuntimeError("GROQ_API_KEY is not configured on the server.")
    
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
        response = await client.chat.completions.create(
            model=MODEL_ID,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        clean_text = clean_json(response.choices[0].message.content)
        return json.loads(clean_text)
    except Exception as e:
        logger.error(f"Error summarizing paper '{title}': {e}")
        return {
            "simple_explanation": "Error generating summary.",
            "problem_statement": "N/A",
            "methodology": "N/A",
            "key_results": "N/A"
        }

async def analyze_gaps_and_ideas(papers: list) -> dict:
    """Identify research gaps and generate project ideas from a list of papers."""
    if not client:
        raise RuntimeError("GROQ_API_KEY is not configured on the server.")
    
    # Limit to first 3 papers to prevent token overflow
    papers_to_analyze = papers[:3]
    paper_texts = "\n\n".join([f"Title: {p['title']}\nAbstract: {p['abstract'][:500]}" for p in papers_to_analyze])
    
    prompt = f"""
    Given these research papers:
    {paper_texts}
    
    Perform two tasks and return the result ONLY as a valid JSON object:
    
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
    
    IMPORTANT: Return ONLY valid JSON. No markdown, no explanations, just the JSON object.
    """
    
    try:
        response = await client.chat.completions.create(
            model=MODEL_ID,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.7
        )
        
        raw_content = response.choices[0].message.content
        logger.info(f"Raw AI response: {raw_content[:200]}...")
        
        # Clean and parse JSON
        clean_text = clean_json(raw_content)
        parsed = json.loads(clean_text)
        
        # Validate structure
        if "ideas" not in parsed:
            logger.warning("AI response missing 'ideas' key")
            return get_fallback_ideas()
        
        if "mini_projects" not in parsed["ideas"] or len(parsed["ideas"]["mini_projects"]) == 0:
            logger.warning("AI response has empty mini_projects")
            parsed["ideas"]["mini_projects"] = get_fallback_mini_projects()
        
        if "major_project" not in parsed["ideas"] or not parsed["ideas"]["major_project"].get("title"):
            logger.warning("AI response missing major_project")
            parsed["ideas"]["major_project"] = get_fallback_major_project()
        
        return parsed
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse AI JSON response: {e}")
        return get_fallback_ideas()
    except Exception as e:
        logger.error(f"Error analyzing gaps: {e}")
        return get_fallback_ideas()


def get_fallback_ideas() -> dict:
    """Return fallback ideas when AI fails."""
    return {
        "gap_analysis": {
            "common_approaches": ["Machine learning models", "Data analysis techniques"],
            "limitations": ["Limited dataset availability", "Computational constraints"],
            "research_gaps": ["Need for more comprehensive studies", "Integration with existing systems"],
            "suggested_improvements": ["Expand dataset collection", "Optimize algorithms"]
        },
        "ideas": {
            "mini_projects": get_fallback_mini_projects(),
            "major_project": get_fallback_major_project()
        }
    }


def get_fallback_mini_projects() -> list:
    return [
        {"title": "Literature Review Tool", "description": "Build a tool to automatically summarize and categorize research papers.", "tech_stack": ["Python", "NLP", "React"]},
        {"title": "Citation Manager", "description": "Create a simple citation management system for researchers.", "tech_stack": ["Node.js", "MongoDB", "Express"]},
        {"title": "Research Dashboard", "description": "Design a dashboard to visualize research trends and metrics.", "tech_stack": ["React", "D3.js", "Firebase"]}
    ]


def get_fallback_major_project() -> dict:
    return {
        "title": "AI-Powered Research Assistant",
        "description": "Develop a comprehensive platform that helps researchers discover, analyze, and synthesize academic papers using AI.",
        "tech_stack": ["Python", "FastAPI", "React", "OpenAI API", "PostgreSQL", "Docker"]
    }