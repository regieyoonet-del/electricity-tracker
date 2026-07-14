"use client";

import { useEffect, useState } from "react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { Clock } from "lucide-react";
import {
  Receipt,
  Calendar,
  Zap,
  Calculator,
  ChevronDown,
  ChevronUp,
  Download,
} from "lucide-react";

interface BillData {
  period: { start: string; end: string };
  totalConsumption: number;
  totalDays: number;
  readings: Array<{
    id: number;
    date: string;
    meterReading: number;
    consumption: number;
  }>;
  chargeBreakdown: Array<{
    name: string;
    description: string | null;
    rate: number;
    unit: string;
    amount: number;
    isVatApplicable: boolean;
  }>;
  subtotal: number;
  vatBase: number;
  vatAmount: number;
  totalAmount: number;
  effectiveRate: number;
  currentKwhRate: number;
}

export default function BillsPage() {
  const [startDate, setStartDate] = useState(
    format(startOfMonth(new Date()), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState(
    format(endOfMonth(new Date()), "yyyy-MM-dd")
  );
  const [bill, setBill] = useState<BillData | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedCharges, setExpandedCharges] = useState(false);

  async function calculateBill() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/bills?start=${startDate}&end=${endDate}`
      );
      const data = await res.json();
      setBill(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    calculateBill();
  }, []);

  function setThisMonth() {
    setStartDate(format(startOfMonth(new Date()), "yyyy-MM-dd"));
    setEndDate(format(endOfMonth(new Date()), "yyyy-MM-dd"));
  }

  function setLastMonth() {
    const lastMonth = subMonths(new Date(), 1);
    setStartDate(format(startOfMonth(lastMonth), "yyyy-MM-dd"));
    setEndDate(format(endOfMonth(lastMonth), "yyyy-MM-dd"));
  }

  const perKwhCharges = bill?.chargeBreakdown.filter((c) => c.unit === "per_kwh") || [];
  const fixedCharges = bill?.chargeBreakdown.filter((c) => c.unit !== "per_kwh") || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Bill Calculator</h1>
        <p className="text-slate-500 mt-1">
          Calculate your electricity bill for any period based on your readings
        </p>
      </div>

      {/* Date Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Start Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              End Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={setThisMonth}
              className="px-3 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              This Month
            </button>
            <button
              onClick={setLastMonth}
              className="px-3 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Last Month
            </button>
            <button
              onClick={calculateBill}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 shadow-md shadow-primary-600/20"
            >
              <Calculator className="w-4 h-4" />
              {loading ? "Calculating..." : "Calculate"}
            </button>
          </div>
        </div>
      </div>

      {bill && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary-600" />
                </div>
                <span className="text-sm font-medium text-slate-500">Total Consumption</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">
                {bill.totalConsumption.toFixed(2)}
                <span className="text-lg font-normal text-slate-400 ml-1">kWh</span>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Across {bill.totalDays} day{bill.totalDays !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-accent-50 flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-accent-600" />
                </div>
                <span className="text-sm font-medium text-slate-500">Total Amount Due</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">
                ₱{bill.totalAmount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-sm text-slate-500 mt-1">
                PENELCO monthly rate: ₱{bill.currentKwhRate.toFixed(4)}/kWh
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-warn-50 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-warn-600" />
                </div>
                <span className="text-sm font-medium text-slate-500">Billing Period</span>
              </div>
              <div className="text-lg font-bold text-slate-900">
                {format(new Date(bill.period.start), "MMM dd, yyyy")}
              </div>
              <p className="text-sm text-slate-500 mt-1">
                to {format(new Date(bill.period.end), "MMM dd, yyyy")}
              </p>
            </div>
          </div>

          {/* Charge Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                  Charge Breakdown
                </h2>
                <button
                  onClick={() => setExpandedCharges(!expandedCharges)}
                  className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  {expandedCharges ? (
                    <>
                      <ChevronUp className="w-4 h-4" /> Collapse
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" /> Expand
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left py-3 px-6 font-semibold text-slate-600">Charge Component</th>
                    <th className="text-left py-3 px-6 font-semibold text-slate-600">Description</th>
                    <th className="text-right py-3 px-6 font-semibold text-slate-600">Rate</th>
                    <th className="text-right py-3 px-6 font-semibold text-slate-600">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Per kWh Charges */}
                  {perKwhCharges.length > 0 && (
                    <tr className="bg-slate-50/50">
                      <td colSpan={4} className="py-2 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Per kWh Charges
                      </td>
                    </tr>
                  )}
                  {perKwhCharges.map((charge, i) => (
                    <tr
                      key={i}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="py-3 px-6 font-medium text-slate-900">
                        {charge.name}
                        {charge.isVatApplicable && (
                          <span className="ml-2 text-xs text-warn-600 bg-warn-50 px-1.5 py-0.5 rounded border border-warn-100">
                            VAT
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-6 text-slate-500 max-w-xs">
                        {expandedCharges ? charge.description : truncate(charge.description || "", 60)}
                      </td>
                      <td className="py-3 px-6 text-right text-slate-600">
                        ₱{charge.rate.toFixed(4)}/kWh
                      </td>
                      <td className="py-3 px-6 text-right font-medium text-slate-900">
                        ₱{charge.amount.toFixed(4)}
                      </td>
                    </tr>
                  ))}

                  {/* Fixed Charges */}
                  {fixedCharges.length > 0 && (
                    <tr className="bg-slate-50/50">
                      <td colSpan={4} className="py-2 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Fixed Charges
                      </td>
                    </tr>
                  )}
                  {fixedCharges.map((charge, i) => (
                    <tr
                      key={`fixed-${i}`}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="py-3 px-6 font-medium text-slate-900">
                        {charge.name}
                        {charge.isVatApplicable && (
                          <span className="ml-2 text-xs text-warn-600 bg-warn-50 px-1.5 py-0.5 rounded border border-warn-100">
                            VAT
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-6 text-slate-500 max-w-xs">
                        {expandedCharges ? charge.description : truncate(charge.description || "", 60)}
                      </td>
                      <td className="py-3 px-6 text-right text-slate-600">
                        {charge.unit === "fixed_monthly"
                          ? `₱${charge.rate.toFixed(2)}/month`
                          : `₱${charge.rate.toFixed(2)}`}
                      </td>
                      <td className="py-3 px-6 text-right font-medium text-slate-900">
                        ₱{charge.amount.toFixed(4)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50">
                  <tr className="border-t-2 border-slate-200">
                    <td colSpan={3} className="py-3 px-6 text-right font-semibold text-slate-700">
                      Subtotal
                    </td>
                    <td className="py-3 px-6 text-right font-semibold text-slate-900">
                      ₱{bill.subtotal.toFixed(4)}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td colSpan={3} className="py-3 px-6 text-right font-semibold text-slate-700">
                      VAT (12%) on applicable charges
                      <span className="block text-xs font-normal text-slate-400">
                        Base: ₱{bill.vatBase.toFixed(4)}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-right font-semibold text-slate-900">
                      ₱{bill.vatAmount.toFixed(4)}
                    </td>
                  </tr>
                  <tr className="bg-primary-50">
                    <td colSpan={3} className="py-4 px-6 text-right font-bold text-primary-900 text-base">
                      TOTAL AMOUNT DUE
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-primary-900 text-base">
                      ₱{bill.totalAmount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Daily Readings in Period */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Daily Readings in Period
            </h2>
            {bill.readings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-medium text-slate-500">Date & Time</th>
                      <th className="text-right py-3 px-4 font-medium text-slate-500">Meter Reading</th>
                      <th className="text-right py-3 px-4 font-medium text-slate-500">Consumption</th>
                      <th className="text-right py-3 px-4 font-medium text-slate-500">Est. Daily Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bill.readings.map((r) => (
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
                        <td className="py-3 px-4 text-right font-mono">
                          {r.meterReading.toFixed(2)} kWh
                        </td>
                        <td className="py-3 px-4 text-right">
                          {r.consumption.toFixed(2)} kWh
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600">
                          ₱{(r.consumption * bill.effectiveRate).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-400 text-center py-8">
                No readings found for the selected period
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function truncate(str: string, n: number) {
  return str.length > n ? str.substring(0, n - 1) + "..." : str;
}
