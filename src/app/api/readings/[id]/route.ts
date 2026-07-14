import { db } from "@/db";
import { readings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const readingId = parseInt(id);
  if (isNaN(readingId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  await db.delete(readings).where(eq(readings.id, readingId));
  return NextResponse.json({ success: true });
}
