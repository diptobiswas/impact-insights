import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  const res = await fetch('http://localhost:3000/case_studies.json');
  const data = await res.json();
  return NextResponse.json(data);
}