"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Wallet, Transaction } from "@/types/database";

export function useWallet() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["wallet"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code === "PGRST116") {
        // Wallet doesn't exist yet, create it
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: newWallet, error: createError } = await (supabase as any)
          .from("wallets")
          .insert({ user_id: user.id })
          .select()
          .single();

        if (createError) throw createError;
        return newWallet as Wallet;
      }

      if (error) throw error;
      return data as Wallet;
    },
  });
}

export function useTransactions() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as Transaction[];
    },
  });
}

export function useDeposit() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (amountCents: number) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get wallet
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: wallet } = await (supabase as any)
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!wallet) throw new Error("Wallet not found");

      // Update balance
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: walletError } = await (supabase as any)
        .from("wallets")
        .update({ balance_cents: wallet.balance_cents + amountCents })
        .eq("id", wallet.id);

      if (walletError) throw walletError;

      // Record transaction
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: txError } = await (supabase as any).from("transactions").insert({
        wallet_id: wallet.id,
        user_id: user.id,
        type: "deposit",
        amount_cents: amountCents,
        description: `Depósito de R$ ${(amountCents / 100).toFixed(2)}`,
      });

      if (txError) throw txError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}
