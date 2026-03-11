"use client";

import { useEffect, useRef } from "react";
import { createClient } from "./client";
import type { Message } from "@/types/database";

export function useTradeMessages(
  tradeId: string,
  onNewMessage: (message: Message) => void
) {
  const supabase = createClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel(`trade-messages-${tradeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `trade_id=eq.${tradeId}`,
        },
        (payload) => {
          onNewMessage(payload.new as Message);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [tradeId, onNewMessage, supabase]);
}

export function useTradeStatusUpdates(
  tradeId: string,
  onStatusChange: (status: string) => void
) {
  const supabase = createClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel(`trade-status-${tradeId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "trades",
          filter: `id=eq.${tradeId}`,
        },
        (payload) => {
          const updated = payload.new as { status: string };
          onStatusChange(updated.status);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [tradeId, onStatusChange, supabase]);
}
