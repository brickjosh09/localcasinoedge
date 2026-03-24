import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const revalidate = 60;

export async function GET() {
  try {
    const res = await sql`
      SELECT sport, COUNT(*) as event_count
      FROM events
      WHERE start_time > NOW()
      GROUP BY sport
      ORDER BY event_count DESC
    `;
    return NextResponse.json(res.rows);
  } catch {
    return NextResponse.json([]);
  }
}
