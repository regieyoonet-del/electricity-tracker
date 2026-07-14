import { db } from "@/db";
import { readings } from "@/db/schema";
import { desc, eq, lt } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const data = await db.select().from(readings).orderBy(desc(readings.date));
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { date, meterReading } = body;

  if (!date || meterReading === undefined || meterReading === null) {
    return NextResponse.json({ error: "Date and meter reading are required" }, { status: 400 });
  }

  const readingValue = parseFloat(meterReading);
  if (isNaN(readingValue) || readingValue < 0) {
    return NextResponse.json({ error: "Invalid meter reading" }, { status: 400 });
  }

  const readingDate = new Date(date);

  // Find the most recent reading before this date/time to calculate consumption
  const previous = await db
    .select()
    .from(readings)
    .where(lt(readings.date, readingDate))
    .orderBy(desc(readings.date))
    .limit(1);

  let consumption = 0;
  if (previous.length > 0) {
    consumption = Math.max(0, readingValue - previous[0].meterReading);
  }

  // Check if a reading already exists for this exact timestamp (or close to it)
  // For simplicity, we check exact match, or we could allow multiple readings per day.
  // Let's check if there's a reading within the same minute to prevent accidental duplicates, 
  // otherwise just insert.
  const existing = await db
    .select()
    .from(readings)
    .where(eq(readings.date, readingDate))
    .limit(1);

  if (existing.length > 0) {
    const [updated] = await db
      .update(readings)
      .set({ meterReading: readingValue, consumption })
      .where(eq(readings.id, existing[0].id))
      .returning();
    return NextResponse.json(updated);
  }

  const [newReading] = await db
    .insert(readings)
    .values({ date: readingDate, meterReading: readingValue, consumption })
    .returning();

  return NextResponse.json(newReading, { status: 201 });
}
