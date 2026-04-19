// ============================================================================
// ROI / Upside calculator — transparent formulas, editable assumptions
// ----------------------------------------------------------------------------
// Outputs are framed as estimates based on the editable inputs, not promises.
// Low/Base/High scenarios are 0.7x / 1.0x / 1.3x of the Base run.
// ============================================================================

import type { RoiInputs, RoiOutputs } from "@/lib/types";

export function computeRoi(inputs: RoiInputs): RoiOutputs {
  const {
    sessions_per_week,
    ritual_mix_35,
    ritual_mix_60,
    ritual_mix_90,
    avg_price_35,
    avg_price_60,
    avg_price_90,
    retail_attach_rate,
    avg_retail_basket,
    repeat_booking_rate,
    utilization_ramp,
  } = inputs;

  const mixTotal = ritual_mix_35 + ritual_mix_60 + ritual_mix_90 || 1;
  const m35 = ritual_mix_35 / mixTotal;
  const m60 = ritual_mix_60 / mixTotal;
  const m90 = ritual_mix_90 / mixTotal;

  const sessionsPerMonth = sessions_per_week * 4.3 * utilization_ramp;

  const avgSessionPrice = m35 * avg_price_35 + m60 * avg_price_60 + m90 * avg_price_90;
  const monthly_service_revenue = Math.round(sessionsPerMonth * avgSessionPrice);

  // Retail attaches to a share of sessions + repeat-booking lift
  const retailSessions = sessionsPerMonth * retail_attach_rate;
  const repeatLift = 1 + repeat_booking_rate * 0.25; // capped lift assumption
  const monthly_retail_revenue = Math.round(retailSessions * avg_retail_basket * repeatLift);

  const monthly_total_upside = monthly_service_revenue + monthly_retail_revenue;
  const annualized_upside = monthly_total_upside * 12;

  return {
    monthly_service_revenue,
    monthly_retail_revenue,
    monthly_total_upside,
    annualized_upside,
    scenario_low: Math.round(annualized_upside * 0.7),
    scenario_base: annualized_upside,
    scenario_high: Math.round(annualized_upside * 1.3),
  };
}
