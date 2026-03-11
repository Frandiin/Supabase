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

    const { trade_id, action } = await req.json();
    // action: 'release' | 'dispute'
    if (!trade_id) {
      return new Response(JSON.stringify({ error: "trade_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: trade, error: tradeError } = await supabase
      .from("trades")
      .select("*")
      .eq("id", trade_id)
      .single();

    if (tradeError || !trade) {
      return new Response(JSON.stringify({ error: "Trade not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (trade.buyer_id !== user.id) {
      return new Response(JSON.stringify({ error: "Only buyer can confirm" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!["shipped", "delivered"].includes(trade.status)) {
      return new Response(
        JSON.stringify({ error: "Trade must be in shipped or delivered status" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "dispute") {
      await supabase.from("trades").update({ status: "disputed" }).eq("id", trade_id);
      await supabase.from("messages").insert({
        trade_id,
        sender_id: user.id,
        content: "⚠️ Disputa aberta pelo comprador. Nossa equipe irá analisar.",
        type: "system",
      });
      return new Response(JSON.stringify({ success: true, action: "disputed" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Release payment to seller
    // Get buyer wallet (escrow)
    const { data: buyerWallet } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", trade.buyer_id)
      .single();

    // Get seller wallet
    const { data: sellerWallet } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", trade.seller_id)
      .single();

    const amount = trade.agreed_price_cents;

    if (buyerWallet) {
      await supabase.from("wallets")
        .update({ escrow_cents: Math.max(0, buyerWallet.escrow_cents - amount) })
        .eq("id", buyerWallet.id);

      await supabase.from("transactions").insert({
        wallet_id: buyerWallet.id,
        user_id: trade.buyer_id,
        type: "payment",
        amount_cents: amount,
        description: `Pagamento liberado ao vendedor - Trade ${trade_id.slice(0, 8)}`,
        trade_id,
      });
    }

    if (sellerWallet) {
      await supabase.from("wallets")
        .update({ balance_cents: sellerWallet.balance_cents + amount })
        .eq("id", sellerWallet.id);

      await supabase.from("transactions").insert({
        wallet_id: sellerWallet.id,
        user_id: trade.seller_id,
        type: "receipt",
        amount_cents: amount,
        description: `Recebimento de venda - Trade ${trade_id.slice(0, 8)}`,
        trade_id,
      });
    }

    // Update card to sold
    await supabase.from("cards").update({ status: "sold" }).eq("id", trade.card_id);

    // Update trade to completed
    await supabase.from("trades").update({ status: "completed" }).eq("id", trade_id);

    // System message
    await supabase.from("messages").insert({
      trade_id,
      sender_id: user.id,
      content: "🎉 Recebimento confirmado! Trade concluída com sucesso.",
      type: "system",
    });

    // Update seller reputation
    const { data: sellerProfile } = await supabase
      .from("profiles")
      .select("reputation_score")
      .eq("id", trade.seller_id)
      .single();

    if (sellerProfile) {
      const newScore = Math.min(100, sellerProfile.reputation_score + 2);
      await supabase.from("profiles").update({ reputation_score: newScore }).eq("id", trade.seller_id);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
