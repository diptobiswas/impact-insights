import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : process.env.NEXT_PUBLIC_API_URL;
  const res = await fetch(`${apiUrl}/case_studies.json`);
  const data = await res.json();
  return NextResponse.json(data);
}