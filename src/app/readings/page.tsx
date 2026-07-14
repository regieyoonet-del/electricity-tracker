"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Plus,
  Trash2,
  Calendar,
  Zap,
  TrendingUp,
  TrendingDown,
  Search,
} from "lucide-react";

interface Reading {
  id: number;
  date: string;
  meterReading: number;
  consumption: number;
}

export default function ReadingsPage() {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [meterReading, setMeterReading] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  async function fetchReadings() {
    try {
      const res = await fetch("/api/readings");
      const data = await res.json();
      setReadings(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReadings();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !meterReading) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/readings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, meterReading: parseFloat(meterReading) }),
      });

      if (res.ok) {
        setDate(format(new Date(), "yyyy-MM-dd"));
        setMeterReading("");
        setShowForm(false);
        fetchReadings();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this reading?")) return;
    try {
      await fetch(`/api/readings/${id}`, { method: "DELETE" });
      fetchReadings();
    } catch (e) {
      console.error(e);
    }
  }

  const avgConsumption =
    readings.length > 0
      ? readings.reduce((s, r) => s + r.consumption, 0) / readings.length
      : 0;

  const filteredReadings = readings.filter((r) => {
    const query = searchQuery.toLowerCase();
    return (
      format(new Date(r.date), "MMM dd, yyyy").toLowerCase().includes(query) ||
      r.meterReading.toString().includes(query) ||
      r.consumption.toString().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Daily Readings</h1>
          <p className="text-slate-500 mt-1">
            Log and manage your daily electricity meter readings
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors shadow-md shadow-primary-600/20"
        >
          <Plus className="w-4 h-4" />
          Add Reading
        </button>
      </div>

      {/* Add Reading Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            New Reading
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  max={format(new Date(), "yyyy-MM-dd")}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                  required
                />
              </div>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Meter Reading (kWh)
              </label>
              <div className="relative">
                <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={meterReading}
                  onChange={(e) => setMeterReading(e.target.value)}
                  placeholder="e.g. 1250.50"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                  required
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 text-sm"
              >
                {submitting ? "Saving..." : "Save Reading"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search readings..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
        />
      </div>

      {/* Readings Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {filteredReadings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left py-3.5 px-5 font-semibold text-slate-600">
                    Date
                  </th>
                  <th className="text-right py-3.5 px-5 font-semibold text-slate-600">
                    Meter Reading
                  </th>
                  <th className="text-right py-3.5 px-5 font-semibold text-slate-600">
                    Consumption
                  </th>
                  <th className="text-center py-3.5 px-5 font-semibold text-slate-600">
                    Status
                  </th>
                  <th className="text-right py-3.5 px-5 font-semibold text-slate-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredReadings.map((r, index) => {
                  const prevReading =
                    index < filteredReadings.length - 1
                      ? filteredReadings[index + 1]
                      : null;
                  const isHigh = r.consumption > avgConsumption * 1.2;
                  const isLow = r.consumption < avgConsumption * 0.8;
                  const isTrendUp = prevReading && r.consumption > prevReading.consumption;

                  return (
                    <tr
                      key={r.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span className="font-medium text-slate-900">
                            {format(new Date(r.date), "MMM dd, yyyy")}
                          </span>
                          <span className="text-xs text-slate-400">
                            {format(new Date(r.date), "EEEE")}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono text-slate-700">
                        {r.meterReading.toFixed(2)} kWh
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isTrendUp ? (
                            <TrendingUp className="w-3.5 h-3.5 text-danger-500" />
                          ) : (
                            <TrendingDown className="w-3.5 h-3.5 text-accent-500" />
                          )}
                          <span
                            className={`font-medium ${
                              isHigh
                                ? "text-danger-600"
                                : isLow
                                ? "text-accent-600"
                                : "text-slate-700"
                            }`}
                          >
                            {r.consumption.toFixed(2)} kWh
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        {isHigh ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-danger-50 text-danger-700 border border-danger-100">
                            High
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent-50 text-accent-700 border border-accent-100">
                            Low
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700 border border-primary-100">
                            Normal
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="p-1.5 text-slate-400 hover:text-danger-500 hover:bg-danger-50 rounded-lg transition-colors"
                          title="Delete reading"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-slate-400">
            <Zap className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium text-slate-600 mb-1">
              No readings found
            </p>
            <p>
              {searchQuery
                ? "Try adjusting your search query"
                : "Add your first daily meter reading to get started"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
