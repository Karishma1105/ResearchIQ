// Use environment variable for production, fallback to localhost for development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Rest of your code stays exactly the same...
export interface Paper {
  title: string;
  abstract: string;
  url: string;
  source: string;
  year?: string;
  authors?: string[];
  summary?: {
    simple_explanation: string;
    problem_statement: string;
    methodology: string;
    key_results: string;
  };
}

export interface ChatResponse {
  original_query: string;
  refined_query: string;
  papers: Paper[];
  gap_analysis: {
    common_approaches: string[];
    limitations: string[];
    research_gaps: string[];
    suggested_improvements: string[];
  };
  ideas: {
    mini_projects: Array<{
      title: string;
      description: string;
      tech_stack: string[];
    }>;
    major_project: {
      title: string;
      description: string;
      tech_stack: string[];
    };
  };
}

export async function sendChatQuery(query: string): Promise<ChatResponse> {
  const response = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export async function deepDiveChat(paper: Paper, question: string): Promise<{ answer: string }> {
  const response = await fetch(`${API_URL}/api/deep-dive`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paper, question }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}