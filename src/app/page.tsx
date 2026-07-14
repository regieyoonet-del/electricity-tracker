"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  Zap,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Activity,
} from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Clock } from "lucide-react";

interface Reading {
  id: number;
  date: string;
  meterReading: number;
  consumption: number;
}

interface BillData {
  totalConsumption: number;
  totalAmount: number;
  effectiveRate: number;
  currentKwhRate: number;
  chargeBreakdown: Array<{
    name: string;
    amount: number;
    unit: string;
  }>;
}

export default function Dashboard() {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [bill, setBill] = useState<BillData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const readingsRes = await fetch("/api/readings");
        const readingsData = await readingsRes.json();
        setReadings(readingsData);

        if (readingsData.length > 0) {
          const start = format(new Date(readingsData[readingsData.length - 1].date), "yyyy-MM-dd");
          const end = format(new Date(readingsData[0].date), "yyyy-MM-dd");
          const billRes = await fetch(`/api/bills?start=${start}&end=${end}`);
          const billData = await billRes.json();
          setBill(billData);
        } else {
          const now = new Date();
          const start = format(startOfMonth(now), "yyyy-MM-dd");
          const end = format(endOfMonth(now), "yyyy-MM-dd");
          const billRes = await fetch(`/api/bills?start=${start}&end=${end}`);
          const billData = await billRes.json();
          setBill(billData);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const chartData = [...readings]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-30)
    .map((r) => ({
      date: format(new Date(r.date), "MMM dd"),
      consumption: Number(r.consumption.toFixed(2)),
      reading: Number(r.meterReading.toFixed(2)),
    }));

  const latestReading = readings[0];
  const previousReading = readings[1];
  const avgConsumption =
    readings.length > 0
      ? readings.reduce((s, r) => s + r.consumption, 0) / readings.length
      : 0;

  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const monthReadings = readings.filter((r) => {
    const d = new Date(r.date);
    return d >= monthStart && d <= monthEnd;
  });
  const monthConsumption = monthReadings.reduce((s, r) => s + r.consumption, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">
          Overview of your electricity consumption and estimated bills
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Latest Reading"
          value={latestReading ? `${latestReading.meterReading.toFixed(2)} kWh` : "—"}
          subtitle={latestReading ? format(new Date(latestReading.date), "MMM dd, yyyy") : "No data"}
          icon={<Zap className="w-5 h-5 text-primary-600" />}
          color="primary"
        />
        <StatCard
          title="Today's Consumption"
          value={latestReading ? `${latestReading.consumption.toFixed(2)} kWh` : "—"}
          subtitle={
            previousReading
              ? `${(
                  ((latestReading.consumption - previousReading.consumption) /
                    (previousReading.consumption || 1)) *
                  100
                ).toFixed(1)}% vs yesterday`
              : ""
          }
          icon={<Activity className="w-5 h-5 text-accent-600" />}
          color="accent"
          trend={
            previousReading
              ? latestReading.consumption > previousReading.consumption
                ? "up"
                : "down"
              : undefined
          }
        />
        <StatCard
          title="Month-to-Date"
          value={`${monthConsumption.toFixed(2)} kWh`}
          subtitle={`${monthReadings.length} day${monthReadings.length !== 1 ? "s" : ""} recorded`}
          icon={<Calendar className="w-5 h-5 text-warn-600" />}
          color="warn"
        />
        <StatCard
          title="Estimated Bill"
          value={bill ? `₱${bill.totalAmount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
          subtitle={bill ? `PENELCO ref: ₱${bill.currentKwhRate.toFixed(4)}/kWh` : ""}
          icon={<DollarSign className="w-5 h-5 text-danger-600" />}
          color="danger"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Daily Consumption Trend</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorConsumption" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} />
                <YAxis
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  axisLine={{ stroke: "#e2e8f0" }}
                  label={{ value: "kWh", angle: -90, position: "insideLeft", style: { fill: "#64748b" } }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="consumption"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorConsumption)"
                  name="Consumption (kWh)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-400">
              No readings recorded yet
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Charge Breakdown</h2>
          {bill && bill.chargeBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={bill.chargeBreakdown
                  .filter((c) => c.amount > 0)
                  .map((c) => ({
                    name: c.name.split(":")[0].replace(" Charge", "").replace(" System", ""),
                    amount: Number(c.amount.toFixed(2)),
                  }))}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#64748b" }} width={100} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                  }}
                  formatter={(value) => [`₱${Number(value).toFixed(2)}`, "Amount"]}
                />
                <Bar dataKey="amount" fill="#22c55e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-400">
              No bill data available
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Readings</h2>
        {readings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-medium text-slate-500">Date & Time</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-500">Meter Reading</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-500">Consumption</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-500">Est. Cost</th>
                </tr>
              </thead>
              <tbody>
                {readings.slice(0, 10).map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900">
                          {format(new Date(r.date), "MMM dd, yyyy")}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="w-3 h-3" />
                          {format(new Date(r.date), "h:mm a")}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-medium">{r.meterReading.toFixed(2)} kWh</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`inline-flex items-center gap-1 ${r.consumption > avgConsumption * 1.2 ? "text-danger-600" : "text-accent-600"}`}>
                        {r.consumption > avgConsumption * 1.2 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {r.consumption.toFixed(2)} kWh
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600">
                      {bill ? `₱${(r.consumption * bill.effectiveRate).toFixed(2)}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400">
            <Zap className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>No readings recorded yet. Go to Daily Readings to add your first entry.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
  trend,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  color: "primary" | "accent" | "warn" | "danger";
  trend?: "up" | "down";
}) {
  const colorMap = {
    primary: "bg-primary-50 border-primary-100",
    accent: "bg-accent-50 border-accent-100",
    warn: "bg-warn-50 border-warn-100",
    danger: "bg-danger-50 border-danger-100",
  };

  return (
    <div className={`rounded-xl border p-5 ${colorMap[color]}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-600">{title}</span>
        <div className="w-9 h-9 rounded-lg bg-white/80 flex items-center justify-center shadow-sm">{icon}</div>
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="flex items-center gap-1 mt-1">
        {trend === "up" && <TrendingUp className="w-3 h-3 text-danger-500" />}
        {trend === "down" && <TrendingDown className="w-3 h-3 text-accent-500" />}
        <span className="text-xs text-slate-500">{subtitle}</span>
      </div>
    </div>
  );
}
