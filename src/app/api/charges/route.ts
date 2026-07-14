import { db } from "@/db";
import { chargeSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const data = await db.select().from(chargeSettings).orderBy(chargeSettings.displayOrder);
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, rate, isActive } = body;

  if (!id || rate === undefined) {
    return NextResponse.json({ error: "ID and rate are required" }, { status: 400 });
  }

  const [updated] = await db
    .update(chargeSettings)
    .set({ rate: parseFloat(rate), isActive: isActive ?? true })
    .where(eq(chargeSettings.id, id))
    .returning();

  return NextResponse.json(updated);
}
