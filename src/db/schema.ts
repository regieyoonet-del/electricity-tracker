import { pgTable, serial, timestamp, real, text, boolean, integer } from "drizzle-orm/pg-core";

export const readings = pgTable("readings", {
  id: serial("id").primaryKey(),
  date: timestamp("date", { mode: "date" }).notNull().unique(),
  meterReading: real("meter_reading").notNull(),
  consumption: real("consumption").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const chargeSettings = pgTable("charge_settings", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  rate: real("rate").notNull(),
  unit: text("unit").notNull(), // 'per_kwh' | 'fixed_monthly'
  isActive: boolean("is_active").default(true).notNull(),
  isVatApplicable: boolean("is_vat_applicable").default(false).notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
});

export type Reading = typeof readings.$inferSelect;
export type NewReading = typeof readings.$inferInsert;
export type ChargeSetting = typeof chargeSettings.$inferSelect;
export type NewChargeSetting = typeof chargeSettings.$inferInsert;
