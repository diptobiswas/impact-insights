import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface CaseStudy {
  title: string;
  description: string;
  domain: string;
  link: string;
  embedding: number[];
}

let caseStudies: CaseStudy[] = [];

async function loadCaseStudies() {
  if (caseStudies.length === 0) {
    try {
      const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : process.env.NEXT_PUBLIC_API_URL;
      const fullUrl = `${apiUrl}/api/case-studies`;
      console.log('Fetching case studies from:', fullUrl);

      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      });
      
      //console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      //console.log('Received data:', data);
      
      if (Array.isArray(data) && data.length > 0) {
        caseStudies = data;
      } else {
        console.warn('Loaded case studies array is empty or not an array');
      }
    } catch (error) {
      console.error('Failed to load case studies:', error);
      caseStudies = [];
    }
  }
}

async function getEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text,
  });
  return response.data[0].embedding;
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, _, i) => sum + a[i] * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

export async function retrieveRelevantCaseStudies(query: string): Promise<CaseStudy[]> {
  await loadCaseStudies();
  
  if (caseStudies.length === 0) {
    return [];
  }

  const queryEmbedding = await getEmbedding(query);
  
  const relevantCaseStudies = caseStudies.map((study) => ({
    ...study,
    similarity: cosineSimilarity(queryEmbedding, study.embedding)
  }));

  return relevantCaseStudies
    .filter(study => study.similarity > 0.85)
    .sort((a, b) => b.similarity - a.similarity);
}