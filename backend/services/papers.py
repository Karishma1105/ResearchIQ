import httpx
import xml.etree.ElementTree as ET
import logging

logger = logging.getLogger(__name__)

SEMANTIC_SCHOLAR_URL = "https://api.semanticscholar.org/graph/v1/paper/search"
OPENALEX_URL = "https://api.openalex.org/works"
ARXIV_URL = "https://export.arxiv.org/api/query"

def reconstruct_abstract(inverted_index: dict) -> str:
    """Reconstructs an abstract from OpenAlex's inverted index format."""
    if not inverted_index:
        return ""
    word_positions = []
    for word, positions in inverted_index.items():
        for pos in positions:
            word_positions.append((pos, word))
    # Sort by position to rebuild the sentence in order
    word_positions.sort(key=lambda x: x[0])
    return " ".join([word for pos, word in word_positions])

async def fetch_papers(query: str, limit: int = 10) -> list:
    """Fetch papers with a 3-tier fallback: Semantic Scholar -> OpenAlex -> arXiv."""
    papers = []

    # --- 1. Try Semantic Scholar First ---
    try:
        async with httpx.AsyncClient(follow_redirects=True) as client:
            response = await client.get(
                SEMANTIC_SCHOLAR_URL,
                params={
                    "query": query,
                    "limit": limit,
                    "fields": "title,abstract,url,year,authors"
                },
                timeout=10.0
            )
            if response.status_code == 200:
                data = response.json()
                for item in data.get("data", []):
                    if item.get("abstract"):
                        papers.append({
                            "source": "Semantic Scholar",
                            "title": item.get("title", ""),
                            "abstract": item.get("abstract", ""),
                            "url": item.get("url", ""),
                            "year": item.get("year", ""),
                            "authors": [a.get("name") for a in item.get("authors", [])][:3]
                        })
            elif response.status_code == 429:
                logger.warning("Semantic Scholar rate limited (429), falling back to OpenAlex.")
            else:
                logger.warning(f"Semantic Scholar returned status {response.status_code}")
    except Exception as e:
        logger.error(f"Semantic Scholar API error: {e}")

    # --- 2. Fallback to OpenAlex (Free, No Key, Massive Database) ---
    if len(papers) < limit:
        try:
            async with httpx.AsyncClient(follow_redirects=True) as client:
                response = await client.get(
                    OPENALEX_URL,
                    params={
                        "search": query,
                        "per-page": limit - len(papers),
                        "select": "id,doi,title,abstract_inverted_index,publication_year,authorships,primary_location",
                        # Adding an email puts you in the "polite pool" for faster responses
                        "mailto": "researchiq@example.com" 
                    },
                    timeout=10.0
                )
                if response.status_code == 200:
                    data = response.json()
                    for item in data.get("results", []):
                        # OpenAlex stores abstracts as an inverted index, so we must rebuild it
                        abstract = reconstruct_abstract(item.get("abstract_inverted_index"))
                        
                        if abstract: # Only include papers that have an abstract
                            # Get the best available URL (DOI -> Landing Page -> OpenAlex ID)
                            url = item.get("doi")
                            if not url and item.get("primary_location") and item["primary_location"].get("landing_page_url"):
                                url = item["primary_location"]["landing_page_url"]
                            elif not url:
                                url = item.get("id", "")
                            
                            authors = [a["author"]["display_name"] for a in item.get("authorships", []) if a.get("author")][:3]
                            
                            papers.append({
                                "source": "OpenAlex",
                                "title": item.get("title", ""),
                                "abstract": abstract,
                                "url": url,
                                "year": item.get("publication_year", ""),
                                "authors": authors
                            })
                else:
                    logger.warning(f"OpenAlex returned status {response.status_code}")
        except Exception as e:
            logger.error(f"OpenAlex API error: {e}")

    # --- 3. Final Fallback to arXiv ---
    if len(papers) < limit:
        try:
            async with httpx.AsyncClient(follow_redirects=True) as client:
                response = await client.get(
                    ARXIV_URL,
                    params={
                        "search_query": f"all:{query}",
                        "start": 0,
                        "max_results": limit - len(papers)
                    },
                    headers={"User-Agent": "ResearchIQ/1.0 (research assistant app)"},
                    timeout=15.0
                )
                if response.status_code == 200 and response.text.strip():
                    root = ET.fromstring(response.text)
                    namespace = {"atom": "http://www.w3.org/2005/Atom"}
                    for entry in root.findall("atom:entry", namespace):
                        title_el = entry.find("atom:title", namespace)
                        abstract_el = entry.find("atom:summary", namespace)
                        url_el = entry.find("atom:id", namespace)
                        if title_el is None or abstract_el is None:
                            continue
                        
                        papers.append({
                            "source": "arXiv",
                            "title": title_el.text.replace("\n", " ").strip(),
                            "abstract": abstract_el.text.replace("\n", " ").strip(),
                            "url": url_el.text if url_el is not None else "",
                            "year": "",
                            "authors": []
                        })
        except Exception as e:
            logger.error(f"arXiv API error: {e}")

    logger.info(f"Total papers fetched: {len(papers)}")
    return papers[:limit]