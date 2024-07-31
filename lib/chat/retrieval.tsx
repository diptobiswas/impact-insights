

import OpenAI from 'openai';
import csv from 'csv-parser';
import fs from 'fs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface CaseStudy {
  title: string;
  description: string;
  domain: string;
  link: string;
  embedding?: number[];
}

let caseStudies: CaseStudy[] = [];

async function loadCaseStudies() {
  if (caseStudies.length === 0) {
    await new Promise<void>((resolve) => {
      fs.createReadStream('data/case_studies.csv')
        .pipe(csv())
        .on('data', (row) => caseStudies.push(row))
        .on('end', async () => {
          // Generate embeddings for all case studies
          for (const study of caseStudies) {
            if (!study.embedding) {
              const combinedText = `${study.title} ${study.description}`;
              study.embedding = await getEmbedding(combinedText);
            }
          }
          resolve();
        });
    });
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
    similarity: cosineSimilarity(queryEmbedding, study.embedding!)
  }));

  return relevantCaseStudies
    .filter(study => study.similarity > 0.80)
    .sort((a, b) => b.similarity - a.similarity);
}