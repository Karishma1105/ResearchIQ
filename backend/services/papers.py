import httpx
import xml.etree.ElementTree as ET

SEMANTIC_SCHOLAR_URL = "https://api.semanticscholar.org/graph/v1/paper/search"
ARXIV_URL = "http://export.arxiv.org/api/query"

async def fetch_papers(query: str, limit: int = 5) -> list:
    """Fetch papers from Semantic Scholar and fallback to arXiv."""
    papers = []
    
    # Try Semantic Scholar First
    try:
        async with httpx.AsyncClient() as client:
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
                    if item.get("abstract"): # Only include papers with abstracts
                        papers.append({
                            "source": "Semantic Scholar",
                            "title": item.get("title", ""),
                            "abstract": item.get("abstract", ""),
                            "url": item.get("url", ""),
                            "year": item.get("year", ""),
                            "authors": [a.get("name") for a in item.get("authors", [])][:3]
                        })
    except Exception as e:
        print(f"Semantic Scholar API error: {e}")

    # If we didn't get enough papers, try arXiv
    if len(papers) < limit:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    ARXIV_URL,
                    params={
                        "search_query": f"all:{query}",
                        "start": 0,
                        "max_results": limit - len(papers)
                    },
                    timeout=10.0
                )
                if response.status_code == 200:
                    root = ET.fromstring(response.text)
                    namespace = {'atom': 'http://www.w3.org/2005/Atom'}
                    for entry in root.findall("atom:entry", namespace):
                        title = entry.find("atom:title", namespace).text.replace('\n', ' ')
                        abstract = entry.find("atom:summary", namespace).text.replace('\n', ' ')
                        url = entry.find("atom:id", namespace).text
                        papers.append({
                            "source": "arXiv",
                            "title": title.strip(),
                            "abstract": abstract.strip(),
                            "url": url,
                            "year": "",
                            "authors": []
                        })
        except Exception as e:
            print(f"arXiv API error: {e}")
            
    return papers[:limit]
