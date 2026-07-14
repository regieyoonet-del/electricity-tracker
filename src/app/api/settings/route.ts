import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const data = await db.select().from(appSettings).orderBy(appSettings.displayOrder);
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { key, value } = body;

  if (!key || value === undefined || value === null) {
    return NextResponse.json({ error: "Key and value are required" }, { status: 400 });
  }

  const [updated] = await db
    .update(appSettings)
    .set({ value: String(value) })
    .where(eq(appSettings.key, key))
    .returning();

  return NextResponse.json(updated);
}
