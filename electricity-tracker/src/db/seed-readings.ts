import { db } from "./index";
import { readings } from "./schema";

async function seedReadings() {
  const existing = await db.select().from(readings);
  if (existing.length > 0) {
    console.log("Readings already exist.");
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sampleData = [];
  let currentReading = 1200;

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Random daily consumption between 8-25 kWh
    const consumption = 8 + Math.random() * 17;
    currentReading += consumption;

    sampleData.push({
      date,
      meterReading: Number(currentReading.toFixed(2)),
      consumption: Number(consumption.toFixed(2)),
    });
  }

  await db.insert(readings).values(sampleData);
  console.log(`Seeded ${sampleData.length} sample readings.`);
}

seedReadings().catch(console.error);
