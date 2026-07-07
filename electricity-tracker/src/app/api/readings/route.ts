import { db } from "@/db";
import { readings } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
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
  readingDate.setHours(0, 0, 0, 0);

  // Get previous reading to calculate consumption
  const previousReadings = await db
    .select()
    .from(readings)
    .where(eq(readings.date, new Date(readingDate.getTime() - 86400000)))
    .limit(1);

  // Also check for the most recent reading before this date
  let consumption = 0;
  if (previousReadings.length > 0) {
    consumption = Math.max(0, readingValue - previousReadings[0].meterReading);
  } else {
    const allPrev = await db
      .select()
      .from(readings)
      .orderBy(desc(readings.date))
      .limit(1);
    if (allPrev.length > 0 && allPrev[0].date < readingDate) {
      consumption = Math.max(0, readingValue - allPrev[0].meterReading);
    }
  }

  // Check if reading already exists for this date
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
