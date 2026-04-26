from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
from services.llm import refine_query, summarize_paper, analyze_gaps_and_ideas
from services.papers import fetch_papers
from database import queries_collection
import datetime

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
    print(f"DEBUG: User query: {user_query}")
    
    # 1. Refine Query
    refined = await refine_query(user_query)
    print(f"DEBUG: Refined query: {refined}")
    
    # 2. Fetch Papers
    raw_papers = await fetch_papers(refined, limit=5)
    print(f"DEBUG: Fetched {len(raw_papers)} papers")
    
    if not raw_papers:
        raise HTTPException(status_code=404, detail="No papers found for this query.")
        
    # 3. Summarize Papers (Run sequentially for simplicity, could be gathered concurrently)
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

async def store_query(data: dict):
    data["timestamp"] = datetime.datetime.utcnow()
    try:
        await queries_collection.insert_one(data)
    except Exception as e:
        print(f"Failed to store query: {e}")
