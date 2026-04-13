import { getCurrentUser } from "@/lib/actions";
import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

interface CreativeGroup {
  title: string;
  body: string;
  imageUrl: string;
  ctaType: string;
  spend: number;
  clicks: number;
  impressions: number;
  leads: number;
  ctr: number;
  cpa: number;
}

export default async function CreativesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const { data: adData } = await supabase.from("ad_data").select("data");

  // Group by creative title and aggregate metrics
  const creativeMap = new Map<string, CreativeGroup>();

  (adData || []).forEach((row) => {
    const d = row.data as Record<string, unknown>;
    const title = String(d.creative_title || d.ad_name || "Untitled Creative");
    const body = String(d.creative_body || "");
    const imageUrl = String(d.creative_image_url || d.image_url || "");
    const ctaType = String(d.creative_cta_type || "");

    const key = title;
    const existing = creativeMap.get(key) || {
      title,
      body,
      imageUrl,
      ctaType,
      spend: 0,
      clicks: 0,
      impressions: 0,
      leads: 0,
      ctr: 0,
      cpa: 0,
    };

    existing.spend += parseFloat(String(d.spend || 0));
    existing.clicks += parseInt(String(d.clicks || 0));
    existing.impressions += parseInt(String(d.impressions || 0));
    existing.leads += parseInt(
      String(d["actions:lead"] || d["actions:onsite_conversion.lead_grouped"] || 0)
    );

    creativeMap.set(key, existing);
  });

  // Calculate derived metrics and sort by CTR
  const creatives = Array.from(creativeMap.values())
    .map((c) => ({
      ...c,
      ctr: c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0,
      cpa: c.leads > 0 ? c.spend / c.leads : 0,
    }))
    .sort((a, b) => b.ctr - a.ctr);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Creative Scoreboard</h1>
        <p className="text-gray-500">Top performing creatives ranked by CTR</p>
      </div>

      {creatives.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-8 text-center text-gray-400 text-sm">
          No creative data available. Import ad data with creative fields first.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {creatives.map((creative, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border overflow-hidden">
              {/* Image preview */}
              {creative.imageUrl && creative.imageUrl !== "undefined" && creative.imageUrl !== "" ? (
                <div className="h-40 bg-gray-100 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={creative.imageUrl}
                    alt={creative.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2">
                    <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                      #{i + 1}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="h-20 bg-gray-100 flex items-center justify-center relative">
                  <span className="text-gray-300 text-sm">No image</span>
                  <div className="absolute top-2 left-2">
                    <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                      #{i + 1}
                    </span>
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-1 truncate">{creative.title}</h3>
                {creative.body && (
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{creative.body}</p>
                )}
                {creative.ctaType && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded mb-3 inline-block">
                    {creative.ctaType}
                  </span>
                )}

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500">CTR</p>
                    <p className="text-sm font-bold text-blue-600">{creative.ctr.toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Spend</p>
                    <p className="text-sm font-semibold text-gray-700">RM {creative.spend.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">CPA</p>
                    <p className="text-sm font-semibold text-gray-700">
                      {creative.cpa > 0 ? `RM ${creative.cpa.toFixed(2)}` : "---"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Clicks</p>
                    <p className="text-sm font-semibold text-gray-700">{creative.clicks.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Impressions</p>
                    <p className="text-sm font-semibold text-gray-700">{creative.impressions.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Leads</p>
                    <p className="text-sm font-semibold text-gray-700">{creative.leads.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
