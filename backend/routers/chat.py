"""Chat router module for handling research query processing and paper analysis."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from services.llm import refine_query, summarize_paper, analyze_gaps_and_ideas, client, MODEL_ID
from services.papers import fetch_papers
import logging
import asyncio

logger = logging.getLogger(__name__)

router = APIRouter()

class ChatRequest(BaseModel):
    query: str

class PaperResponse(BaseModel):
    title: str
    abstract: str
    url: str
    source: str
    summary: dict

class ChatResponse(BaseModel):
    original_query: str
    refined_query: str
    papers: List[PaperResponse]
    gap_analysis: dict
    ideas: dict

class DeepDiveRequest(BaseModel):
    paper: dict
    question: str

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    user_query = request.query
    logger.info(f"Received query: {user_query}")

    try:
        # 1. Refine Query
        refined = await refine_query(user_query)
        logger.info(f"Refined query: {refined}")

        # 2. Fetch Papers
        raw_papers = await fetch_papers(refined, limit=10)
        logger.info(f"Fetched {len(raw_papers)} papers")

        if not raw_papers:
            raise HTTPException(status_code=404, detail="No papers found for this query. Try a different topic.")

        # 3. Summarize Papers (Concurrently using asyncio.gather)
        tasks = [summarize_paper(p["title"], p["abstract"]) for p in raw_papers]
        summaries = await asyncio.gather(*tasks)

        summarized_papers = []
        for p, summary in zip(raw_papers, summaries):
            summarized_papers.append(PaperResponse(
                title=p["title"],
                abstract=p["abstract"],
                url=p["url"],
                source=p["source"],
                summary=summary
            ))

        # 4. Analyze Gaps and Generate Ideas
        analysis = await analyze_gaps_and_ideas(raw_papers)
        gap_analysis = analysis.get("gap_analysis", {})
        ideas = analysis.get("ideas", {})

        return ChatResponse(
            original_query=user_query,
            refined_query=refined,
            papers=summarized_papers,
            gap_analysis=gap_analysis,
            ideas=ideas
        )

    except HTTPException:
        raise
    except RuntimeError as e:
        logger.error(f"Configuration error: {e}")
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.exception(f"Unexpected error processing query '{user_query}': {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


# --- NEW DEEP DIVE ENDPOINT (Properly placed at router level!) ---
@router.post("/deep-dive")
async def deep_dive_endpoint(request: DeepDiveRequest):
    """Answer questions about a specific research paper."""
    paper = request.paper
    question = request.question
    
    if not client:
        raise HTTPException(status_code=503, detail="AI service is not configured.")
    
    logger.info(f"Deep dive question for paper: {paper.get('title', 'Unknown')}")
    
    prompt = f"""
You are an expert research assistant discussing this specific academic paper with a student.

Paper Title: {paper.get('title', 'Unknown')}
Paper Abstract: {paper.get('abstract', 'No abstract available.')}

The student has asked the following question about this paper:
"{question}"

Instructions:
- Answer ONLY based on the information in this paper's abstract and title.
- If the answer is not clear from the abstract, honestly say "The abstract doesn't explicitly mention this, but based on the paper's focus..."
- Keep the answer clear, concise, and student-friendly (max 3-4 sentences).
- Do not make up information that isn't implied by the paper.
"""
    
    try:
        response = await client.chat.completions.create(
            model=MODEL_ID,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5
        )
        
        answer = response.choices[0].message.content
        return {"answer": answer}
        
    except Exception as e:
        logger.error(f"Deep dive error: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating answer: {str(e)}")