import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "Missing 'text' field" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are a financial document parser. You receive raw text extracted from a Brazilian credit card invoice PDF. Extract all structured data from the invoice.

Rules:
- Dates must be in YYYY-MM-DD format. The invoice text usually shows dates as DD/MM or DD/MM/YYYY. Use the invoice month/year context to determine the full date.
- Amounts must be positive numbers (no currency symbols).
- For installment purchases (e.g., "03/06" means installment 3 of 6), extract current_installment and total_installments.
- For non-installment purchases, set current_installment=1 and total_installments=1.
- The card name should be clean (e.g., "SANTANDER SX MASTERCARD").
- Extract the last 4 digits of the card number.
- Extract the credit limit, closing day, and due day.
- All transactions from the invoice are EXPENSES.
- Ignore payment entries (pagamentos) and financial charges (encargos).
- If there are multiple cards in the invoice, use the primary/main card.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Extract the structured data from this credit card invoice:\n\n${text}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_invoice_data",
              description: "Extract structured credit card invoice data",
              parameters: {
                type: "object",
                properties: {
                  card: {
                    type: "object",
                    properties: {
                      name: { type: "string", description: "Card name (e.g., SANTANDER SX MASTERCARD)" },
                      last_digits: { type: "string", description: "Last 4 digits of card number" },
                      limit_amount: { type: "number", description: "Credit limit in BRL" },
                      closing_day: { type: "integer", description: "Invoice closing day of month" },
                      due_day: { type: "integer", description: "Payment due day of month" },
                    },
                    required: ["name", "last_digits", "limit_amount", "closing_day", "due_day"],
                  },
                  transactions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        date: { type: "string", description: "Transaction date in YYYY-MM-DD format" },
                        description: { type: "string", description: "Transaction description" },
                        amount: { type: "number", description: "Transaction amount (positive)" },
                        current_installment: { type: "integer", description: "Current installment number (1 if not installment)" },
                        total_installments: { type: "integer", description: "Total installments (1 if not installment)" },
                      },
                      required: ["date", "description", "amount", "current_installment", "total_installments"],
                    },
                  },
                },
                required: ["card", "transactions"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_invoice_data" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI Gateway error:", response.status, errText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Failed to process invoice" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "AI did not return structured data" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-invoice error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
