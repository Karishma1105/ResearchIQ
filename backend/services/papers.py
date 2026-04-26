import httpx
import xml.etree.ElementTree as ET

SEMANTIC_SCHOLAR_URL = "https://api.semanticscholar.org/graph/v1/paper/search"

async def fetch_papers(query: str, limit: int = 5) -> list:
    """Fetch papers from Semantic Scholar and fallback to arXiv."""
    papers = []

    # Try Semantic Scholar First
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
                    if item.get("abstract"):  # Only include papers with abstracts
                        papers.append({
                            "source": "Semantic Scholar",
                            "title": item.get("title", ""),
                            "abstract": item.get("abstract", ""),
                            "url": item.get("url", ""),
                            "year": item.get("year", ""),
                            "authors": [a.get("name") for a in item.get("authors", [])][:3]
                        })
            elif response.status_code == 429:
                print("Semantic Scholar rate limited (429), falling back to arXiv.")
            else:
                print(f"Semantic Scholar returned status {response.status_code}")
    except Exception as e:
        print(f"Semantic Scholar API error: {e}")

    # If we didn't get enough papers, use arXiv as fallback
    if len(papers) < limit:
        try:
            # NOTE: Use https:// — http:// returns a 301 redirect that httpx won't follow by default
            async with httpx.AsyncClient(follow_redirects=True) as client:
                response = await client.get(
                    "https://export.arxiv.org/api/query",
                    params={
                        "search_query": f"all:{query}",
                        "start": 0,
                        "max_results": limit - len(papers)
                    },
                    headers={"User-Agent": "ResearchIQ/1.0 (research assistant app)"},
                    timeout=15.0
                )
                print(f"arXiv status: {response.status_code}, body length: {len(response.text)}")
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
            print(f"arXiv API error: {e}")

    print(f"Total papers fetched: {len(papers)}")
    return papers[:limit]
