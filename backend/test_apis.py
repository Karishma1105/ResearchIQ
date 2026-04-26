import httpx
import asyncio
import xml.etree.ElementTree as ET

async def test():
    print("=== Semantic Scholar ===")
    try:
        async with httpx.AsyncClient(follow_redirects=True) as c:
            r = await c.get(
                "https://api.semanticscholar.org/graph/v1/paper/search",
                params={"query": "AI in healthcare", "limit": 3, "fields": "title,abstract,url,year,authors"},
                timeout=15.0
            )
            print(f"Status: {r.status_code}")
            if r.status_code == 200:
                data = r.json()
                papers = data.get("data", [])
                print(f"Papers returned: {len(papers)}")
                for p in papers:
                    print(f"  - {p.get('title', 'no title')[:60]} | abstract: {'YES' if p.get('abstract') else 'NO'}")
            else:
                print(f"Response: {r.text[:300]}")
    except Exception as e:
        print(f"Exception: {e}")

    print("\n=== arXiv (https) ===")
    try:
        async with httpx.AsyncClient(follow_redirects=True) as c:
            r = await c.get(
                "https://export.arxiv.org/api/query",
                params={"search_query": "all:AI healthcare", "start": 0, "max_results": 3},
                headers={"User-Agent": "ResearchIQ/1.0"},
                timeout=15.0
            )
            print(f"Status: {r.status_code}, Body length: {len(r.text)}")
            if r.status_code == 200 and r.text.strip():
                root = ET.fromstring(r.text)
                ns = {"atom": "http://www.w3.org/2005/Atom"}
                entries = root.findall("atom:entry", ns)
                print(f"Entries returned: {len(entries)}")
                for e in entries:
                    title = e.find("atom:title", ns)
                    print(f"  - {title.text.strip()[:70] if title is not None else 'no title'}")
            else:
                print(f"Bad response body: {r.text[:200]}")
    except Exception as e:
        print(f"Exception: {e}")

asyncio.run(test())
