import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Get reports from last 24 hours
    const { data: reports, error } = await supabase
      .from("disease_reports")
      .select("*")
      .gte("created_at", twentyFourHoursAgo);

    if (error) throw error;

    // Group by disease + location
    const clusters: Record<string, { disease: string; location: string; count: number }> = {};
    
    for (const report of reports || []) {
      const disease = report.suspected_disease || "Unknown";
      const key = `${disease}::${report.location}`;
      if (!clusters[key]) {
        clusters[key] = { disease, location: report.location, count: 0 };
      }
      clusters[key].count++;
    }

    const newAlerts: any[] = [];

    for (const cluster of Object.values(clusters)) {
      let alertLevel: string | null = null;
      if (cluster.count >= 50) alertLevel = "emergency";
      else if (cluster.count >= 25) alertLevel = "critical";
      else if (cluster.count >= 10) alertLevel = "warning";

      if (alertLevel) {
        // Check if alert already exists
        const { data: existing } = await supabase
          .from("alerts")
          .select("id")
          .eq("disease", cluster.disease)
          .eq("location", cluster.location)
          .eq("is_active", true)
          .single();

        if (existing) {
          // Update existing alert
          await supabase.from("alerts").update({
            case_count: cluster.count,
            alert_level: alertLevel,
          }).eq("id", existing.id);
        } else {
          // Create new alert
          const { data } = await supabase.from("alerts").insert({
            disease: cluster.disease,
            location: cluster.location,
            case_count: cluster.count,
            alert_level: alertLevel,
          }).select().single();
          
          if (data) newAlerts.push(data);
        }
      }
    }

    return new Response(JSON.stringify({
      processed: Object.keys(clusters).length,
      newAlerts: newAlerts.length,
      clusters: Object.values(clusters),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("outbreak-detection error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
