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

    const { trade_id } = await req.json();
    if (!trade_id) {
      return new Response(JSON.stringify({ error: "trade_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get trade
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
      return new Response(JSON.stringify({ error: "Only the buyer can pay" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (trade.status !== "payment_pending") {
      return new Response(
        JSON.stringify({ error: "Trade is not in payment_pending status" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!trade.agreed_price_cents) {
      return new Response(JSON.stringify({ error: "No agreed price" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get buyer wallet
    const { data: buyerWallet, error: walletError } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (walletError || !buyerWallet) {
      return new Response(JSON.stringify({ error: "Wallet not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (buyerWallet.balance_cents < trade.agreed_price_cents) {
      return new Response(JSON.stringify({ error: "Insufficient balance" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Move to escrow
    const { error: updateWalletError } = await supabase
      .from("wallets")
      .update({
        balance_cents: buyerWallet.balance_cents - trade.agreed_price_cents,
        escrow_cents: buyerWallet.escrow_cents + trade.agreed_price_cents,
      })
      .eq("id", buyerWallet.id);

    if (updateWalletError) throw updateWalletError;

    // Record escrow_hold transaction
    await supabase.from("transactions").insert({
      wallet_id: buyerWallet.id,
      user_id: user.id,
      type: "escrow_hold",
      amount_cents: trade.agreed_price_cents,
      description: `Pagamento retido em custódia - Trade ${trade_id.slice(0, 8)}`,
      trade_id,
    });

    // Update trade status
    const shippingDeadline = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
    const { error: updateTradeError } = await supabase
      .from("trades")
      .update({
        status: "payment_held",
        shipping_deadline: shippingDeadline,
      })
      .eq("id", trade_id);

    if (updateTradeError) throw updateTradeError;

    // System message
    await supabase.from("messages").insert({
      trade_id,
      sender_id: user.id,
      content: `✅ Pagamento de R$ ${(trade.agreed_price_cents / 100).toFixed(2)} em custódia. Vendedor pode enviar a carta.`,
      type: "system",
    });

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
