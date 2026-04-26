import httpx
import asyncio
import xml.etree.ElementTree as ET

async def test():
    # Test Semantic Scholar
    print("=== Semantic Scholar ===")
    try:
        async with httpx.AsyncClient() as c:
            r = await c.get(
                "https://api.semanticscholar.org/graph/v1/paper/search",
                params={"query": "AI agriculture", "limit": 3, "fields": "title,abstract,url,year,authors"},
                timeout=15.0
            )
            print(f"Status: {r.status_code}")
            if r.status_code == 200:
                data = r.json()
                papers = data.get("data", [])
                print(f"Papers returned: {len(papers)}")
                for p in papers:
                    print(f"  - {p.get('title', 'no title')} | abstract: {'YES' if p.get('abstract') else 'NO'}")
            else:
                print(f"Error body: {r.text[:400]}")
    except Exception as e:
        print(f"Exception: {e}")

    # Test arXiv
    print("\n=== arXiv ===")
    try:
        async with httpx.AsyncClient() as c:
            r = await c.get(
                "http://export.arxiv.org/api/query",
                params={"search_query": "all:AI agriculture", "start": 0, "max_results": 3},
                timeout=15.0
            )
            print(f"Status: {r.status_code}")
            root = ET.fromstring(r.text)
            ns = {"atom": "http://www.w3.org/2005/Atom"}
            entries = root.findall("atom:entry", ns)
            print(f"Entries returned: {len(entries)}")
            for e in entries:
                title = e.find("atom:title", ns)
                abstract = e.find("atom:summary", ns)
                print(f"  - {title.text.strip()[:80] if title is not None else 'no title'}")
    except Exception as e:
        print(f"Exception: {e}")

asyncio.run(test())
