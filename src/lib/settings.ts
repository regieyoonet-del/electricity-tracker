import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export const CURRENT_KWH_RATE_KEY = "current_kwh_rate";
export const DEFAULT_CURRENT_KWH_RATE = 11.5123;

export async function getCurrentKwhRate() {
  const [setting] = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, CURRENT_KWH_RATE_KEY))
    .limit(1);

  const parsed = setting ? Number(setting.value) : DEFAULT_CURRENT_KWH_RATE;
  return Number.isFinite(parsed) ? parsed : DEFAULT_CURRENT_KWH_RATE;
}
