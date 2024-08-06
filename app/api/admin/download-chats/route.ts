import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

export async function GET() {
  try {
    // Execute the shell script
    await execAsync('sh ./export_data_to_csv.sh')

    // Read the generated CSV file
    const csvPath = path.join(process.cwd(), 'user_questions.csv')
    const csvContent = await fs.readFile(csvPath, 'utf-8')

    // Return the CSV content as a download
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=user_questions.csv'
      }
    })
  } catch (error) {
    console.error('Error executing script or reading CSV:', error)
    return NextResponse.json({ error: 'Failed to generate CSV' }, { status: 500 })
  }
}