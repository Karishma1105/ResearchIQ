from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
from services.llm import refine_query, summarize_paper, analyze_gaps_and_ideas
from services.papers import fetch_papers
from database import queries_collection
import datetime
import logging

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

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest, background_tasks: BackgroundTasks):
    user_query = request.query
    logger.info(f"Received query: {user_query}")

    try:
        # 1. Refine Query
        refined = await refine_query(user_query)
        logger.info(f"Refined query: {refined}")

        # 2. Fetch Papers
        raw_papers = await fetch_papers(refined, limit=5)
        logger.info(f"Fetched {len(raw_papers)} papers")

        if not raw_papers:
            raise HTTPException(status_code=404, detail="No papers found for this query. Try a different topic.")

        # 3. Summarize Papers
        summarized_papers = []
        for p in raw_papers:
            summary = await summarize_paper(p["title"], p["abstract"])
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

        response_data = ChatResponse(
            original_query=user_query,
            refined_query=refined,
            papers=summarized_papers,
            gap_analysis=gap_analysis,
            ideas=ideas
        )

        # 5. Store in Database in background
        background_tasks.add_task(store_query, response_data.model_dump())

        return response_data

    except HTTPException:
        # Re-raise HTTP exceptions (like 404) as-is
        raise
    except RuntimeError as e:
        # Configuration errors (missing API key, etc.)
        logger.error(f"Configuration error: {e}")
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.exception(f"Unexpected error processing query '{user_query}': {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

async def store_query(data: dict):
    data["timestamp"] = datetime.datetime.utcnow()
    try:
        await queries_collection.insert_one(data)
    except Exception as e:
        print(f"Failed to store query: {e}")
