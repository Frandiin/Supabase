import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { card_id } = await req.json();
    if (!card_id) {
      return new Response(JSON.stringify({ error: "card_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get card
    const { data: card, error: cardError } = await supabase
      .from("cards")
      .select("*, seller:profiles!cards_seller_id_fkey(*)")
      .eq("id", card_id)
      .single();

    if (cardError || !card) {
      return new Response(JSON.stringify({ error: "Card not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validations
    if (card.status !== "available") {
      return new Response(
        JSON.stringify({ error: "Card is not available" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!card.verified_by_admin) {
      return new Response(
        JSON.stringify({ error: "Card is not verified" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (card.seller_id === user.id) {
      return new Response(
        JSON.stringify({ error: "You cannot buy your own card" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if ((card.seller?.reputation_score ?? 0) < 50) {
      return new Response(
        JSON.stringify({ error: "Seller does not meet minimum reputation" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Reserve card
    const { error: reserveError } = await supabase
      .from("cards")
      .update({ status: "reserved" })
      .eq("id", card_id);

    if (reserveError) throw reserveError;

    // Create trade
    const { data: trade, error: tradeError } = await supabase
      .from("trades")
      .insert({
        card_id,
        buyer_id: user.id,
        seller_id: card.seller_id,
        status: "negotiating",
      })
      .select()
      .single();

    if (tradeError) {
      // Rollback card status
      await supabase.from("cards").update({ status: "available" }).eq("id", card_id);
      throw tradeError;
    }

    // Create system message
    await supabase.from("messages").insert({
      trade_id: trade.id,
      sender_id: user.id,
      content: "🎉 Negociação iniciada! Converse para chegar ao melhor preço.",
      type: "system",
    });

    return new Response(
      JSON.stringify({ trade_id: trade.id, success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
