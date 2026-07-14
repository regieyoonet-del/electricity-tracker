import { db } from "./index";
import { appSettings, chargeSettings } from "./schema";
import { CURRENT_KWH_RATE_KEY } from "@/lib/settings";

const defaultCharges = [
  {
    name: "Generation Charge",
    description: "Cost of electricity bought from power suppliers.",
    rate: 6.85,
    unit: "per_kwh",
    isActive: true,
    isVatApplicable: true,
    displayOrder: 1,
  },
  {
    name: "Transmission System Charge",
    description: "Cost of delivering power through the high-voltage grid (NGCP).",
    rate: 0.8,
    unit: "per_kwh",
    isActive: true,
    isVatApplicable: true,
    displayOrder: 2,
  },
  {
    name: "System Loss Charge",
    description: "Cost of technical and non-technical energy lost in transit.",
    rate: 0.5,
    unit: "per_kwh",
    isActive: true,
    isVatApplicable: false,
    displayOrder: 3,
  },
  {
    name: "Distribution System Charge",
    description: "Cost of building and operating PENELCO's local network.",
    rate: 1.35,
    unit: "per_kwh",
    isActive: true,
    isVatApplicable: true,
    displayOrder: 4,
  },
  {
    name: "Supply System Charge",
    description: "Cost of billing, collection, and customer service.",
    rate: 18,
    unit: "fixed_monthly",
    isActive: true,
    isVatApplicable: false,
    displayOrder: 5,
  },
  {
    name: "Metering System Charge",
    description: "Cost of reading and maintaining your physical electricity meter.",
    rate: 5,
    unit: "fixed_monthly",
    isActive: true,
    isVatApplicable: false,
    displayOrder: 6,
  },
  {
    name: "RFSC Charge",
    description: "Reinvestment Fund for Sustainable Capital used to upgrade local substations.",
    rate: 0.2989,
    unit: "per_kwh",
    isActive: true,
    isVatApplicable: false,
    displayOrder: 7,
  },
  {
    name: "Universal Charge: Missionary",
    description: "Mandated fund for energizing off-grid islands and remote areas.",
    rate: 0.2238,
    unit: "per_kwh",
    isActive: true,
    isVatApplicable: false,
    displayOrder: 8,
  },
  {
    name: "Universal Charge: Environmental",
    description: "Mandated fund allocated for watershed management and protection.",
    rate: 0.0025,
    unit: "per_kwh",
    isActive: true,
    isVatApplicable: false,
    displayOrder: 9,
  },
  {
    name: "FIT-All",
    description: "Feed-in Tariff Allowance used to incentivize renewable energy developers.",
    rate: 0.0838,
    unit: "per_kwh",
    isActive: true,
    isVatApplicable: false,
    displayOrder: 10,
  },
  {
    name: "Lifeline Subsidy Rate",
    description: "Fund collected to give discounts to low-income households.",
    rate: 0.07,
    unit: "per_kwh",
    isActive: true,
    isVatApplicable: false,
    displayOrder: 11,
  },
  {
    name: "Senior Citizen Subsidy",
    description: "Fund collected to subsidize discounts for registered elderly consumers.",
    rate: 0.001,
    unit: "per_kwh",
    isActive: true,
    isVatApplicable: false,
    displayOrder: 12,
  },
];

const defaultAppSettings = [
  {
    key: CURRENT_KWH_RATE_KEY,
    value: "11.5123",
    label: "Current Effective kWh Rate",
    description:
      "Monthly all-in residential rate used for display and quick reference. Update this whenever PENELCO changes its effective monthly rate.",
    displayOrder: 1,
  },
];

async function seed() {
  const existingCharges = await db.select().from(chargeSettings);
  if (existingCharges.length === 0) {
    await db.insert(chargeSettings).values(defaultCharges);
    console.log("Seeded default charge settings.");
  } else {
    console.log("Charge settings already seeded.");
  }

  const existingSettings = await db.select().from(appSettings);
  if (existingSettings.length === 0) {
    await db.insert(appSettings).values(defaultAppSettings);
    console.log("Seeded app settings.");
  } else {
    console.log("App settings already seeded.");
  }
}

seed().catch(console.error);
