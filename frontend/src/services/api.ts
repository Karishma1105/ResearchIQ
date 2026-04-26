import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export interface Paper {
  title: string;
  abstract: string;
  url: string;
  source: string;
  summary: {
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
    mini_projects: Array<{title: string, description: string, tech_stack: string[]}>;
    major_project: {title: string, description: string, tech_stack: string[]};
  };
}

export const sendChatQuery = async (query: string): Promise<ChatResponse> => {
  const response = await axios.post(`${API_URL}/chat`, { query });
  return response.data;
};
