import { createClient, createServiceClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const admin = createServiceClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  try {
    const body = await request.json();
    const { rows, fileName, dateStart, dateEnd, marketerId, brandId } = body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No data rows provided" }, { status: 400 });
    }

    // Determine which marketer this data belongs to
    const targetMarketerId = marketerId || user.id;

    // Create import record
    const { data: importRecord, error: importError } = await admin
      .from("data_imports")
      .insert({
        company_id: profile.company_id,
        marketer_id: targetMarketerId,
        file_name: fileName || "manual_import",
        row_count: rows.length,
        date_start: dateStart,
        date_end: dateEnd,
        brand_id: brandId || null,
        status: "processing",
      })
      .select()
      .single();

    if (importError) {
      return NextResponse.json({ error: importError.message }, { status: 500 });
    }

    // Insert ad data rows
    const adRows = rows.map((row: Record<string, unknown>) => ({
      company_id: profile.company_id,
      marketer_id: targetMarketerId,
      import_id: importRecord.id,
      brand_id: brandId || null,
      date_start: dateStart,
      date_end: dateEnd,
      data: row,
    }));

    // Insert in batches of 100
    const batchSize = 100;
    for (let i = 0; i < adRows.length; i += batchSize) {
      const batch = adRows.slice(i, i + batchSize);
      const { error: insertError } = await admin.from("ad_data").insert(batch);
      if (insertError) {
        await admin
          .from("data_imports")
          .update({ status: "failed", error_message: insertError.message })
          .eq("id", importRecord.id);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    // Update import status
    await admin
      .from("data_imports")
      .update({ status: "completed" })
      .eq("id", importRecord.id);

    // Calculate marketer scores for this import
    await calculateScores(admin, profile.company_id, targetMarketerId, dateStart, dateEnd, brandId);

    return NextResponse.json({
      success: true,
      importId: importRecord.id,
      rowCount: rows.length,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Calculate marketer scores from imported data
async function calculateScores(
  admin: ReturnType<typeof createServiceClient>,
  companyId: string,
  marketerId: string,
  dateStart: string,
  dateEnd: string,
  brandId?: string
) {
  // Get all ad data for this marketer in date range
  let query = admin
    .from("ad_data")
    .select("data")
    .eq("company_id", companyId)
    .eq("marketer_id", marketerId);

  if (dateStart) query = query.gte("date_start", dateStart);
  if (dateEnd) query = query.lte("date_end", dateEnd);
  if (brandId) query = query.eq("brand_id", brandId);

  const { data: adRows } = await query;
  if (!adRows || adRows.length === 0) return;

  // Aggregate metrics
  let totalSpend = 0, totalImpressions = 0, totalClicks = 0;
  let totalLeads = 0, totalPurchases = 0, totalRevenue = 0;
  const campaignsSet = new Set<string>();

  for (const row of adRows) {
    const d = row.data as Record<string, unknown>;
    totalSpend += parseFloat(String(d.spend || 0));
    totalImpressions += parseInt(String(d.impressions || 0));
    totalClicks += parseInt(String(d.clicks || 0));

    // Actions breakdown
    const actions = d as Record<string, unknown>;
    totalLeads += parseInt(String(actions["actions:lead"] || actions["actions:onsite_conversion.lead_grouped"] || 0));
    totalPurchases += parseInt(String(actions["actions:purchase"] || actions["actions:omni_purchase"] || 0));
    totalRevenue += parseFloat(String(actions["action_values:purchase"] || actions["action_values:omni_purchase"] || 0));

    if (d.campaign_name) campaignsSet.add(String(d.campaign_name));
  }

  const avgCpa = totalLeads > 0 ? totalSpend / totalLeads : null;
  const avgRoas = totalSpend > 0 ? totalRevenue / totalSpend : null;
  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : null;
  const avgCpc = totalClicks > 0 ? totalSpend / totalClicks : null;

  // Determine rating based on ROAS
  let rating = "neutral";
  if (avgRoas !== null) {
    if (avgRoas >= 3) rating = "excellent";
    else if (avgRoas >= 2) rating = "good";
    else if (avgRoas >= 1) rating = "neutral";
    else if (avgRoas >= 0.5) rating = "warning";
    else rating = "danger";
  }

  // Upsert score
  await admin.from("marketer_scores").upsert(
    {
      company_id: companyId,
      marketer_id: marketerId,
      brand_id: brandId || null,
      score_date: dateStart || new Date().toISOString().split("T")[0],
      total_spend: totalSpend,
      total_impressions: totalImpressions,
      total_clicks: totalClicks,
      total_leads: totalLeads,
      total_purchases: totalPurchases,
      total_revenue: totalRevenue,
      avg_cpa: avgCpa,
      avg_roas: avgRoas,
      avg_ctr: avgCtr,
      avg_cpc: avgCpc,
      score_rating: rating,
      campaigns_active: campaignsSet.size,
    },
    { onConflict: "marketer_id,score_date,brand_id" }
  );

  // Check alert rules
  await checkAlerts(admin, companyId, marketerId, {
    cpa: avgCpa, roas: avgRoas, ctr: avgCtr, daily_spend: totalSpend
  });
}

async function checkAlerts(
  admin: ReturnType<typeof createServiceClient>,
  companyId: string,
  marketerId: string,
  metrics: Record<string, number | null>
) {
  const { data: rules } = await admin
    .from("alert_rules")
    .select("*")
    .eq("company_id", companyId)
    .eq("is_active", true);

  if (!rules) return;

  for (const rule of rules) {
    const value = metrics[rule.metric];
    if (value === null || value === undefined) continue;

    let triggered = false;
    if (rule.condition === "above" && value > rule.threshold) triggered = true;
    if (rule.condition === "below" && value < rule.threshold) triggered = true;

    if (triggered) {
      await admin.from("alert_history").insert({
        company_id: companyId,
        rule_id: rule.id,
        marketer_id: marketerId,
        metric: rule.metric,
        current_value: value,
        threshold_value: rule.threshold,
        severity: rule.severity,
        message: `${rule.name}: ${rule.metric.toUpperCase()} is ${value.toFixed(2)} (threshold: ${rule.threshold})`,
      });
    }
  }
}
