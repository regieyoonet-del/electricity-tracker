"use client";

import { useEffect, useState } from "react";
import { Save, ToggleLeft, ToggleRight, Info, Gauge } from "lucide-react";

interface ChargeSetting {
  id: number;
  name: string;
  description: string | null;
  rate: number;
  unit: string;
  isActive: boolean;
  isVatApplicable: boolean;
  displayOrder: number;
}

interface AppSetting {
  id: number;
  key: string;
  value: string;
  label: string;
  description: string | null;
  displayOrder: number;
}

export default function SettingsPage() {
  const [charges, setCharges] = useState<ChargeSetting[]>([]);
  const [appSettings, setAppSettings] = useState<AppSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [savingSettingKey, setSavingSettingKey] = useState<string | null>(null);
  const [editedRates, setEditedRates] = useState<Record<number, string>>({});
  const [editedSettingValues, setEditedSettingValues] = useState<Record<string, string>>({});

  async function fetchData() {
    try {
      const [chargesRes, settingsRes] = await Promise.all([
        fetch("/api/charges"),
        fetch("/api/settings"),
      ]);

      const chargesData = await chargesRes.json();
      const settingsData = await settingsRes.json();

      setCharges(chargesData);
      setAppSettings(settingsData);

      const rates: Record<number, string> = {};
      chargesData.forEach((c: ChargeSetting) => {
        rates[c.id] = c.rate.toString();
      });
      setEditedRates(rates);

      const settingValues: Record<string, string> = {};
      settingsData.forEach((setting: AppSetting) => {
        settingValues[setting.key] = setting.value;
      });
      setEditedSettingValues(settingValues);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function updateCharge(id: number, updates: Partial<ChargeSetting>) {
    setSaving(id);
    try {
      const payload: Record<string, unknown> = { id };
      if (updates.rate !== undefined) payload.rate = updates.rate;
      if (updates.isActive !== undefined) payload.isActive = updates.isActive;

      const res = await fetch("/api/charges", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const updated = await res.json();
        setCharges((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(null);
    }
  }

  async function updateAppSetting(key: string, value: string) {
    setSavingSettingKey(key);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (res.ok) {
        const updated = await res.json();
        setAppSettings((prev) => prev.map((setting) => (setting.key === key ? { ...setting, ...updated } : setting)));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingSettingKey(null);
    }
  }

  async function saveRate(id: number) {
    const rate = parseFloat(editedRates[id]);
    if (isNaN(rate) || rate < 0) return;
    await updateCharge(id, { rate });
  }

  async function saveAppSetting(key: string) {
    const value = editedSettingValues[key];
    if (value === undefined || value === "") return;
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue < 0) return;
    await updateAppSetting(key, String(numericValue));
  }

  function handleRateChange(id: number, value: string) {
    setEditedRates((prev) => ({ ...prev, [id]: value }));
  }

  function handleSettingValueChange(key: string, value: string) {
    setEditedSettingValues((prev) => ({ ...prev, [key]: value }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const perKwhCharges = charges.filter((c) => c.unit === "per_kwh");
  const fixedCharges = charges.filter((c) => c.unit !== "per_kwh");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Charge Settings</h1>
        <p className="text-slate-500 mt-1">
          Customize the electricity charge rates used in bill calculations
        </p>
      </div>

      <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-primary-900">About Charge Rates</p>
          <p className="text-sm text-primary-700 mt-1">
            These rates are based on PENELCO&apos;s residential rate structure. You can adjust the
            monthly effective kWh rate and the individual bill components to match your actual bill.
            Charges marked with <span className="font-medium">VAT</span> are included in the 12%
            VAT calculation.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent-50 flex items-center justify-center">
              <Gauge className="w-5 h-5 text-accent-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Monthly kWh Rate</h2>
              <p className="text-sm text-slate-500 mt-1">
                Update this whenever PENELCO changes its published monthly effective rate.
              </p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {appSettings.map((setting) => {
            const currentValue = editedSettingValues[setting.key] ?? setting.value;
            const isChanged = currentValue !== setting.value;

            return (
              <div key={setting.key} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 md:flex-row md:items-end md:justify-between">
                <div className="max-w-2xl">
                  <div className="font-medium text-slate-900">{setting.label}</div>
                  <div className="text-sm text-slate-500 mt-1">{setting.description}</div>
                </div>
                <div className="flex items-end gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Rate</label>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-xs">₱</span>
                      <input
                        type="number"
                        step="0.0001"
                        min="0"
                        value={currentValue}
                        onChange={(e) => handleSettingValueChange(setting.key, e.target.value)}
                        className={`w-32 px-3 py-2 border rounded text-right text-sm font-mono focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none ${
                          isChanged ? "border-primary-300 bg-primary-50" : "border-slate-300"
                        }`}
                      />
                      <span className="text-slate-400 text-xs">/kWh</span>
                    </div>
                  </div>
                  <button
                    onClick={() => saveAppSetting(setting.key)}
                    disabled={!isChanged || savingSettingKey === setting.key}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    {savingSettingKey === setting.key ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Per kWh Charges</h2>
          <p className="text-sm text-slate-500 mt-1">
            These charges are calculated based on your total consumption
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3 px-6 font-semibold text-slate-600">Component</th>
                <th className="text-left py-3 px-6 font-semibold text-slate-600">Description</th>
                <th className="text-center py-3 px-6 font-semibold text-slate-600">VAT</th>
                <th className="text-right py-3 px-6 font-semibold text-slate-600">Rate (₱/kWh)</th>
                <th className="text-center py-3 px-6 font-semibold text-slate-600">Active</th>
                <th className="text-right py-3 px-6 font-semibold text-slate-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {perKwhCharges.map((charge) => (
                <ChargeRow
                  key={charge.id}
                  charge={charge}
                  editedRate={editedRates[charge.id] || ""}
                  onRateChange={(v) => handleRateChange(charge.id, v)}
                  onSave={() => saveRate(charge.id)}
                  onToggleActive={() => updateCharge(charge.id, { isActive: !charge.isActive, rate: charge.rate })}
                  saving={saving === charge.id}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Fixed Charges</h2>
          <p className="text-sm text-slate-500 mt-1">
            These charges are applied as flat fees per billing period
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3 px-6 font-semibold text-slate-600">Component</th>
                <th className="text-left py-3 px-6 font-semibold text-slate-600">Description</th>
                <th className="text-center py-3 px-6 font-semibold text-slate-600">VAT</th>
                <th className="text-right py-3 px-6 font-semibold text-slate-600">Rate (₱)</th>
                <th className="text-center py-3 px-6 font-semibold text-slate-600">Active</th>
                <th className="text-right py-3 px-6 font-semibold text-slate-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {fixedCharges.map((charge) => (
                <ChargeRow
                  key={charge.id}
                  charge={charge}
                  editedRate={editedRates[charge.id] || ""}
                  onRateChange={(v) => handleRateChange(charge.id, v)}
                  onSave={() => saveRate(charge.id)}
                  onToggleActive={() => updateCharge(charge.id, { isActive: !charge.isActive, rate: charge.rate })}
                  saving={saving === charge.id}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ChargeRow({
  charge,
  editedRate,
  onRateChange,
  onSave,
  onToggleActive,
  saving,
}: {
  charge: ChargeSetting;
  editedRate: string;
  onRateChange: (v: string) => void;
  onSave: () => void;
  onToggleActive: () => void;
  saving: boolean;
}) {
  const rateChanged = editedRate !== charge.rate.toString();

  return (
    <tr
      className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
        !charge.isActive ? "opacity-50" : ""
      }`}
    >
      <td className="py-3.5 px-6">
        <div className="font-medium text-slate-900">{charge.name}</div>
      </td>
      <td className="py-3.5 px-6 text-slate-500 max-w-sm">{charge.description}</td>
      <td className="py-3.5 px-6 text-center">
        {charge.isVatApplicable ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-warn-50 text-warn-700 border border-warn-100">
            Yes
          </span>
        ) : (
          <span className="text-slate-400">—</span>
        )}
      </td>
      <td className="py-3.5 px-6 text-right">
        <div className="flex items-center justify-end gap-2">
          <span className="text-slate-400 text-xs">₱</span>
          <input
            type="number"
            step="0.0001"
            min="0"
            value={editedRate}
            onChange={(e) => onRateChange(e.target.value)}
            disabled={!charge.isActive}
            className={`w-28 px-2 py-1.5 border rounded text-right text-sm font-mono focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none ${
              rateChanged ? "border-primary-300 bg-primary-50" : "border-slate-300"
            }`}
          />
          <span className="text-slate-400 text-xs">{charge.unit === "per_kwh" ? "/kWh" : "/mo"}</span>
        </div>
      </td>
      <td className="py-3.5 px-6 text-center">
        <button
          onClick={onToggleActive}
          className="inline-flex items-center justify-center"
          title={charge.isActive ? "Deactivate" : "Activate"}
        >
          {charge.isActive ? (
            <ToggleRight className="w-6 h-6 text-accent-500" />
          ) : (
            <ToggleLeft className="w-6 h-6 text-slate-400" />
          )}
        </button>
      </td>
      <td className="py-3.5 px-6 text-right">
        <button
          onClick={onSave}
          disabled={!rateChanged || saving || !charge.isActive}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Save className="w-3.5 h-3.5" />
          {saving ? "Saving..." : "Save"}
        </button>
      </td>
    </tr>
  );
}
