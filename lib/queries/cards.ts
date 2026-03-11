"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Card, CardWithSeller, Profile } from "@/types/database";

export function useProfile() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data as Profile;
    },
  });
}

export function useCards(filters?: {
  name?: string;
  set?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
}) {
  const supabase = createClient();

  return useInfiniteQuery({
    queryKey: ["cards", filters],
    queryFn: async ({ pageParam = 0 }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase as any)
        .from("cards")
        .select(
          `
          *,
          seller:profiles!cards_seller_id_fkey(*)
        `
        )
        .eq("status", "available")
        .eq("verified_by_admin", true)
        .range(pageParam, pageParam + 11)
        .order("created_at", { ascending: false });

      if (filters?.name) {
        query = query.ilike("name", `%${filters.name}%`);
      }
      if (filters?.set) {
        query = query.ilike("set_name", `%${filters.set}%`);
      }
      if (filters?.condition) {
        query = query.eq("condition", filters.condition);
      }
      if (filters?.minPrice !== undefined) {
        query = query.gte("price_cents", filters.minPrice * 100);
      }
      if (filters?.maxPrice !== undefined) {
        query = query.lte("price_cents", filters.maxPrice * 100);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CardWithSeller[];
    },
    getNextPageParam: (lastPage: CardWithSeller[], allPages: CardWithSeller[][]) => {
      if (lastPage.length < 12) return undefined;
      return allPages.length * 12;
    },
    initialPageParam: 0,
  });
}

export function useCard(id: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["card", id],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("cards")
        .select(
          `
          *,
          seller:profiles!cards_seller_id_fkey(*)
        `
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as CardWithSeller;
    },
  });
}

export function useMyCards() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["my-cards"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("cards")
        .select("*")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Card[];
    },
  });
}

export function useUploadCard() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cardData: {
      name: string;
      set_name: string;
      condition: string;
      price_cents: number;
      description?: string;
      image_urls: string[];
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("cards")
        .insert({
          name: cardData.name,
          set_name: cardData.set_name,
          condition: cardData.condition,
          price_cents: cardData.price_cents,
          description: cardData.description,
          image_urls: cardData.image_urls,
          seller_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Card;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards"] });
      queryClient.invalidateQueries({ queryKey: ["my-cards"] });
    },
  });
}

export function useUnverifiedCards() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["unverified-cards"],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("cards")
        .select(`
          *,
          seller:profiles!cards_seller_id_fkey(*)
        `)
        .eq("verified_by_admin", false)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as CardWithSeller[];
    },
  });
}

export function useApproveCard() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cardId: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("cards")
        .update({ 
          verified_by_admin: true,
          status: "available" 
        })
        .eq("id", cardId);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unverified-cards"] });
      queryClient.invalidateQueries({ queryKey: ["cards"] });
    },
  });
}
