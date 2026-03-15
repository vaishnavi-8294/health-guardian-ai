import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { symptoms, age, gender, location, waterSource, sanitationCondition, reportId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = `Analyze this patient data and predict the most likely water-borne disease.

Patient Data:
- Symptoms: ${symptoms.join(', ')}
- Age: ${age}
- Gender: ${gender}
- Location: ${location}
- Water Source: ${waterSource || 'Unknown'}
- Sanitation Condition: ${sanitationCondition || 'Unknown'}

Possible diseases to consider: Cholera, Typhoid, Diarrhea, Dysentery, Hepatitis A

Analyze the symptoms and environmental factors carefully.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "You are a disease analysis AI for the HydroTrim health surveillance system. You analyze patient symptoms and environmental factors to predict water-borne diseases.",
          },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "predict_disease",
              description: "Return the disease prediction analysis",
              parameters: {
                type: "object",
                properties: {
                  predictedDisease: { type: "string", enum: ["Cholera", "Typhoid", "Diarrhea", "Dysentery", "Hepatitis A"] },
                  confidence: { type: "number", description: "Confidence percentage 0-100" },
                  severity: { type: "string", enum: ["Mild", "Moderate", "Severe", "Critical"] },
                  risk_level: { type: "string", enum: ["low", "medium", "high"] },
                  recommendation: { type: "string", description: "Medical recommendation for the ASHA worker" },
                },
                required: ["predictedDisease", "confidence", "severity", "risk_level", "recommendation"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "predict_disease" } },
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI analysis failed: ${response.status}`);
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      throw new Error("AI did not return structured prediction");
    }

    const prediction = JSON.parse(toolCall.function.arguments);

    // Save to database using service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from("ai_suggestions").insert({
      report_id: reportId,
      predicted_disease: prediction.predictedDisease,
      risk_level: prediction.risk_level,
      confidence_score: prediction.confidence,
      recommendation: prediction.recommendation,
    });

    // Update suspected disease on the report
    await supabase.from("disease_reports").update({
      suspected_disease: prediction.predictedDisease,
    }).eq("id", reportId);

    return new Response(JSON.stringify(prediction), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-disease error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
