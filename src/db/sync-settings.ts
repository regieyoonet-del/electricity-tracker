import { db } from "./index";
import { appSettings, chargeSettings } from "./schema";
import { eq } from "drizzle-orm";
import { CURRENT_KWH_RATE_KEY } from "@/lib/settings";

async function syncSettings() {
  const [existingRate] = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, CURRENT_KWH_RATE_KEY))
    .limit(1);

  if (!existingRate) {
    await db.insert(appSettings).values({
      key: CURRENT_KWH_RATE_KEY,
      value: "11.5123",
      label: "Current Effective kWh Rate",
      description:
        "Monthly all-in residential rate used for display and quick reference. Update this whenever PENELCO changes its effective monthly rate.",
      displayOrder: 1,
    });
    console.log("Inserted current_kwh_rate setting.");
  } else {
    console.log("current_kwh_rate setting already exists.");
  }

  await db
    .update(chargeSettings)
    .set({ description: "Cost of building and operating PENELCO's local network." })
    .where(eq(chargeSettings.name, "Distribution System Charge"));

  console.log("Updated PENELCO wording in charge settings.");
}

syncSettings().catch(console.error);
