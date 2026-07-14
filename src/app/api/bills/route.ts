import { db } from "@/db";
import { readings, chargeSettings } from "@/db/schema";
import { and, gte, lte, desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (!start || !end) {
    return NextResponse.json({ error: "Start and end dates are required" }, { status: 400 });
  }

  const startDate = new Date(start);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setHours(23, 59, 59, 999);

  const [periodReadings, charges] = await Promise.all([
    db
      .select()
      .from(readings)
      .where(and(gte(readings.date, startDate), lte(readings.date, endDate)))
      .orderBy(readings.date),
    db.select().from(chargeSettings).where(eq(chargeSettings.isActive, true)),
  ]);

  const totalConsumption = periodReadings.reduce((sum, r) => sum + r.consumption, 0);
  const totalDays = periodReadings.length;

  const chargeBreakdown: Array<{
    name: string;
    description: string | null;
    rate: number;
    unit: string;
    amount: number;
    isVatApplicable: boolean;
  }> = [];

  let subtotal = 0;
  let vatBase = 0;

  for (const charge of charges) {
    let amount = 0;
    if (charge.unit === "per_kwh") {
      amount = charge.rate * totalConsumption;
    } else if (charge.unit === "fixed_monthly") {
      amount = charge.rate;
    } else if (charge.unit === "fixed_daily") {
      amount = charge.rate * totalDays;
    }

    chargeBreakdown.push({
      name: charge.name,
      description: charge.description,
      rate: charge.rate,
      unit: charge.unit,
      amount: Number(amount.toFixed(4)),
      isVatApplicable: charge.isVatApplicable,
    });

    subtotal += amount;
    if (charge.isVatApplicable) {
      vatBase += amount;
    }
  }

  const vatAmount = vatBase * 0.12;
  const totalAmount = subtotal + vatAmount;

  return NextResponse.json({
    period: { start: startDate.toISOString(), end: endDate.toISOString() },
    totalConsumption: Number(totalConsumption.toFixed(4)),
    totalDays,
    readings: periodReadings,
    chargeBreakdown,
    subtotal: Number(subtotal.toFixed(4)),
    vatBase: Number(vatBase.toFixed(4)),
    vatAmount: Number(vatAmount.toFixed(4)),
    totalAmount: Number(totalAmount.toFixed(4)),
    effectiveRate: totalConsumption > 0 ? Number((totalAmount / totalConsumption).toFixed(4)) : 0,
  });
}
