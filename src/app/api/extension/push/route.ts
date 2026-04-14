import { createServiceClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const admin = createServiceClient();

  try {
    const body = await request.json();
    const { staffId, rows, dateStart, dateEnd } = body;

    if (!staffId) {
      return NextResponse.json({ error: "Staff ID is required" }, { status: 400 });
    }
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No data rows provided" }, { status: 400 });
    }
    if (!dateStart || !dateEnd) {
      return NextResponse.json({ error: "Date range is required" }, { status: 400 });
    }

    // Look up user by staff ID
    const { data: user, error: userError } = await admin
      .from("users")
      .select("id, company_id, role, full_name, id_staff")
      .eq("id_staff", staffId.toUpperCase().trim())
      .eq("is_active", true)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "Invalid Staff ID. Please check and try again." }, { status: 401 });
    }

    // Create import record
    const { data: importRecord, error: importError } = await admin
      .from("data_imports")
      .insert({
        company_id: user.company_id,
        marketer_id: user.id,
        file_name: `extension_push_${new Date().toISOString()}`,
        row_count: rows.length,
        date_start: dateStart,
        date_end: dateEnd,
        status: "processing",
      })
      .select()
      .single();

    if (importError) {
      return NextResponse.json({ error: importError.message }, { status: 500 });
    }

    // Insert ad data rows in batches
    const batchSize = 100;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize).map((row: Record<string, unknown>) => ({
        company_id: user.company_id,
        marketer_id: user.id,
        import_id: importRecord.id,
        date_start: dateStart,
        date_end: dateEnd,
        data: row,
      }));

      const { error: insertError } = await admin.from("ad_data").insert(batch);
      if (insertError) {
        await admin
          .from("data_imports")
          .update({ status: "failed", error_message: insertError.message })
          .eq("id", importRecord.id);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    // Mark import as completed
    await admin
      .from("data_imports")
      .update({ status: "completed" })
      .eq("id", importRecord.id);

    // Calculate marketer scores
    await calculateScores(admin, user.company_id, user.id, dateStart, dateEnd);

    // Check alert rules
    await checkAlerts(admin, user.company_id, user.id);

    return NextResponse.json({
      success: true,
      message: `${rows.length} records imported for ${user.full_name} (${user.id_staff})`,
      importId: importRecord.id,
      rowCount: rows.length,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function calculateScores(
  admin: ReturnType<typeof createServiceClient>,
  companyId: string,
  marketerId: string,
  dateStart: string,
  dateEnd: string
) {
  const { data: adRows } = await admin
    .from("ad_data")
    .select("data")
    .eq("company_id", companyId)
    .eq("marketer_id", marketerId)
    .gte("date_start", dateStart)
    .lte("date_end", dateEnd);

  if (!adRows || adRows.length === 0) return;

  let totalSpend = 0, totalImpressions = 0, totalClicks = 0;
  let totalLeads = 0, totalPurchases = 0, totalRevenue = 0;
  const campaignsSet = new Set<string>();

  for (const row of adRows) {
    const d = row.data as Record<string, unknown>;
    totalSpend += parseFloat(String(d.spend || 0));
    totalImpressions += parseInt(String(d.impressions || 0));
    totalClicks += parseInt(String(d.clicks || 0));
    totalLeads += parseInt(String(d["actions:lead"] || d["actions:onsite_conversion.lead_grouped"] || 0));
    totalPurchases += parseInt(String(d["actions:purchase"] || d["actions:omni_purchase"] || 0));
    totalRevenue += parseFloat(String(d["action_values:purchase"] || d["action_values:omni_purchase"] || 0));
    if (d.campaign_name) campaignsSet.add(String(d.campaign_name));
  }

  const avgCpa = totalLeads > 0 ? totalSpend / totalLeads : null;
  const avgRoas = totalSpend > 0 ? totalRevenue / totalSpend : null;
  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : null;
  const avgCpc = totalClicks > 0 ? totalSpend / totalClicks : null;

  let rating = "neutral";
  if (avgRoas !== null) {
    if (avgRoas >= 3) rating = "excellent";
    else if (avgRoas >= 2) rating = "good";
    else if (avgRoas >= 1) rating = "neutral";
    else if (avgRoas >= 0.5) rating = "warning";
    else rating = "danger";
  }

  await admin.from("marketer_scores").upsert(
    {
      company_id: companyId,
      marketer_id: marketerId,
      score_date: dateStart,
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
}

async function checkAlerts(
  admin: ReturnType<typeof createServiceClient>,
  companyId: string,
  marketerId: string
) {
  const { data: rules } = await admin
    .from("alert_rules")
    .select("*")
    .eq("company_id", companyId)
    .eq("is_active", true);

  if (!rules || rules.length === 0) return;

  const { data: latestScore } = await admin
    .from("marketer_scores")
    .select("*")
    .eq("marketer_id", marketerId)
    .order("score_date", { ascending: false })
    .limit(1)
    .single();

  if (!latestScore) return;

  const metrics: Record<string, number | null> = {
    cpa: latestScore.avg_cpa,
    roas: latestScore.avg_roas,
    ctr: latestScore.avg_ctr,
    daily_spend: latestScore.total_spend,
  };

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
