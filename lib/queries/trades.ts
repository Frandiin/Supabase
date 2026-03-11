"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Trade, TradeWithDetails, MessageWithSender } from "@/types/database";

export function useMyTrades() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["my-trades"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("trades")
        .select(
          `
          *,
          card:cards(*),
          buyer:profiles!trades_buyer_id_fkey(*),
          seller:profiles!trades_seller_id_fkey(*)
        `
        )
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data as TradeWithDetails[];
    },
  });
}

export function useTrade(id: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["trade", id],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("trades")
        .select(
          `
          *,
          card:cards(*),
          buyer:profiles!trades_buyer_id_fkey(*),
          seller:profiles!trades_seller_id_fkey(*)
        `
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as TradeWithDetails;
    },
  });
}

export function useTradeMessages(tradeId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["trade-messages", tradeId],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("messages")
        .select(
          `
          *,
          sender:profiles!messages_sender_id_fkey(*)
        `
        )
        .eq("trade_id", tradeId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as MessageWithSender[];
    },
  });
}

export function useSendMessage() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (msgData: {
      trade_id: string;
      content: string;
      type?: "text" | "offer" | "system";
      offer_amount_cents?: number;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: msg, error } = await (supabase as any)
        .from("messages")
        .insert({
          trade_id: msgData.trade_id,
          sender_id: user.id,
          content: msgData.content,
          type: msgData.type || "text",
          offer_amount_cents: msgData.offer_amount_cents ?? null,
        })
        .select(
          `
          *,
          sender:profiles!messages_sender_id_fkey(*)
        `
        )
        .single();

      if (error) throw error;
      return msg as MessageWithSender;
    },
    onSuccess: (data: MessageWithSender) => {
      queryClient.setQueryData(
        ["trade-messages", data.trade_id],
        (old: MessageWithSender[] | undefined) => [...(old || []), data]
      );
    },
  });
}

export function useUpdateTradeStatus() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tradeId,
      status,
      agreePrice,
    }: {
      tradeId: string;
      status: Trade["status"];
      agreePrice?: number;
    }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updates: Record<string, any> = { status };
      if (agreePrice !== undefined) {
        updates.agreed_price_cents = agreePrice;
      }

      const now = new Date();
      if (status === "payment_pending") {
        const deadline = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        updates.payment_deadline = deadline.toISOString();
      }
      if (status === "payment_held") {
        const deadline = new Date(now.getTime() + 72 * 60 * 60 * 1000);
        updates.shipping_deadline = deadline.toISOString();
      }
      if (status === "shipped") {
        const deadline = new Date(now.getTime() + 72 * 60 * 60 * 1000);
        updates.delivery_deadline = deadline.toISOString();
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("trades")
        .update(updates)
        .eq("id", tradeId)
        .select()
        .single();

      if (error) throw error;
      return data as Trade;
    },
    onSuccess: (data: Trade) => {
      queryClient.invalidateQueries({ queryKey: ["trade", data.id] });
      queryClient.invalidateQueries({ queryKey: ["my-trades"] });
    },
  });
}
