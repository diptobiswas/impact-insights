import fs from 'fs';
import csv from 'csv-parser';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function getEmbedding(text) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text,
  });
  return response.data[0].embedding;
}

async function generateCaseStudies() {
  let existingCaseStudies = [];
  const newCaseStudies = [];

  // Check if the file exists and read existing case studies
  if (fs.existsSync('public/case_studies.json')) {
    existingCaseStudies = JSON.parse(fs.readFileSync('public/case_studies.json', 'utf8'));
  }

  await new Promise((resolve) => {
    fs.createReadStream('data/case_studies.csv')
      .pipe(csv())
      .on('data', (row) => newCaseStudies.push(row))
      .on('end', resolve);
  });

  // Filter out new case studies that don't exist in the current file
  const uniqueNewCaseStudies = newCaseStudies.filter(newStudy => 
    !existingCaseStudies.some(existingStudy => 
      existingStudy.title === newStudy.title && existingStudy.description === newStudy.description
    )
  );

  for (const study of uniqueNewCaseStudies) {
    const combinedText = `${study.title} ${study.description}`;
    study.embedding = await getEmbedding(combinedText);
  }

  const updatedCaseStudies = [...existingCaseStudies, ...uniqueNewCaseStudies];

  fs.writeFileSync('public/case_studies.json', JSON.stringify(updatedCaseStudies, null, 2));
  console.log('Case studies with embeddings have been updated and saved to public/case_studies.json');
}

generateCaseStudies();