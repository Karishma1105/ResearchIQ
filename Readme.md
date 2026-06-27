# ResearchIQ

AI-powered research paper analysis tool.

## Features
- Search academic papers from multiple sources
- AI-powered paper summaries
- Research gap analysis
- Project idea generation
- Deep dive chat with papers
- PDF export
- Local history & bookmarks

## Tech Stack
- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: FastAPI, Python
- **AI**: Groq (Llama 3.3)
- **APIs**: Semantic Scholar, OpenAlex, arXiv

## Setup

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload