"use client";

import { useMemo, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { DEFAULT_ROI_INPUTS, type RoiInputs } from "@/lib/types";
import { computeRoi } from "@/lib/scoring/roi";
import { formatCurrency } from "@/lib/utils";

export function MicrositeRoi({ prospectName }: { prospectName: string }) {
  const [inputs, setInputs] = useState<RoiInputs>(DEFAULT_ROI_INPUTS);
  const outputs = useMemo(() => computeRoi(inputs), [inputs]);

  const update = <K extends keyof RoiInputs>(key: K, value: number) =>
    setInputs((prev) => ({ ...prev, [key]: value }));

  return (
    <section className="bg-bone-100/50">
      <div className="mx-auto max-w-5xl px-8 py-20">
        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-charcoal-500">
          Opportunity · Estimate
        </p>
        <h2 className="mt-4 max-w-2xl font-serif text-4xl leading-tight tracking-tight text-charcoal-900">
          What this could mean for {prospectName}.
        </h2>
        <p className="mt-4 max-w-2xl text-[15px] leading-[1.75] text-charcoal-700">
          Built from a premium ritual mix and retail continuity. Every number is editable — this is a frame for a
          conversation, not a forecast.
        </p>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.1fr,0.9fr]">
          {/* Inputs */}
          <div className="card-surface bg-bone-50 p-8 space-y-6">
            <Slider
              label="Sessions per week"
              min={2}
              max={40}
              step={1}
              value={inputs.sessions_per_week}
              onChange={(e) => update("sessions_per_week", Number(e.currentTarget.value))}
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <Slider
                label="35-min mix"
                min={0}
                max={1}
                step={0.05}
                value={inputs.ritual_mix_35}
                onChange={(e) => update("ritual_mix_35", Number(e.currentTarget.value))}
                format={(v) => `${Math.round(v * 100)}%`}
              />
              <Slider
                label="60-min mix"
                min={0}
                max={1}
                step={0.05}
                value={inputs.ritual_mix_60}
                onChange={(e) => update("ritual_mix_60", Number(e.currentTarget.value))}
                format={(v) => `${Math.round(v * 100)}%`}
              />
              <Slider
                label="90-min mix"
                min={0}
                max={1}
                step={0.05}
                value={inputs.ritual_mix_90}
                onChange={(e) => update("ritual_mix_90", Number(e.currentTarget.value))}
                format={(v) => `${Math.round(v * 100)}%`}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Slider
                label="Price · 35m"
                min={60}
                max={220}
                step={5}
                value={inputs.avg_price_35}
                onChange={(e) => update("avg_price_35", Number(e.currentTarget.value))}
                format={formatCurrency}
              />
              <Slider
                label="Price · 60m"
                min={90}
                max={320}
                step={5}
                value={inputs.avg_price_60}
                onChange={(e) => update("avg_price_60", Number(e.currentTarget.value))}
                format={formatCurrency}
              />
              <Slider
                label="Price · 90m"
                min={120}
                max={440}
                step={5}
                value={inputs.avg_price_90}
                onChange={(e) => update("avg_price_90", Number(e.currentTarget.value))}
                format={formatCurrency}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Slider
                label="Retail attach"
                min={0}
                max={0.8}
                step={0.05}
                value={inputs.retail_attach_rate}
                onChange={(e) => update("retail_attach_rate", Number(e.currentTarget.value))}
                format={(v) => `${Math.round(v * 100)}%`}
              />
              <Slider
                label="Retail basket"
                min={40}
                max={180}
                step={5}
                value={inputs.avg_retail_basket}
                onChange={(e) => update("avg_retail_basket", Number(e.currentTarget.value))}
                format={formatCurrency}
              />
              <Slider
                label="Utilization"
                min={0.3}
                max={1}
                step={0.05}
                value={inputs.utilization_ramp}
                onChange={(e) => update("utilization_ramp", Number(e.currentTarget.value))}
                format={(v) => `${Math.round(v * 100)}%`}
              />
            </div>
          </div>

          {/* Outputs */}
          <div className="space-y-5">
            <OutputCard
              label="Monthly service revenue"
              value={formatCurrency(outputs.monthly_service_revenue)}
            />
            <OutputCard
              label="Monthly retail revenue"
              value={formatCurrency(outputs.monthly_retail_revenue)}
            />
            <div className="card-surface bg-bone-50 p-8">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-charcoal-500">
                Annualized upside · Base
              </p>
              <p className="mt-3 font-serif text-5xl leading-none tracking-tight text-charcoal-900 tabular-nums">
                {formatCurrency(outputs.annualized_upside)}
              </p>
              <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
                <Scenario label="Low" value={outputs.scenario_low} />
                <Scenario label="Base" value={outputs.scenario_base} active />
                <Scenario label="High" value={outputs.scenario_high} />
              </div>
              <p className="mt-6 text-[11px] leading-relaxed text-charcoal-500">
                Estimates based on the assumptions above. Not a forecast. Scenario band is ±30% of base.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function OutputCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-surface bg-bone-50 p-6">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-charcoal-500">{label}</p>
      <p className="mt-2 font-serif text-3xl tracking-tight text-charcoal-900 tabular-nums">{value}</p>
    </div>
  );
}

function Scenario({ label, value, active }: { label: string; value: number; active?: boolean }) {
  return (
    <div
      className={`rounded-md border px-3 py-2 text-center ${
        active ? "border-accent-500/40 bg-accent-500/5" : "border-border"
      }`}
    >
      <p className="text-[10px] uppercase tracking-[0.18em] text-charcoal-500">{label}</p>
      <p className="mt-1 font-serif text-lg text-charcoal-900 tabular-nums">{formatCurrency(value)}</p>
    </div>
  );
}
