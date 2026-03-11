"use client";

import { useRef, useCallback } from "react";
import { useCards } from "@/lib/queries/cards";
import { CardCard } from "./CardCard";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { Loader2, PackageSearch } from "lucide-react";

interface CardGridProps {
  filters?: {
    name?: string;
    set?: string;
    condition?: string;
    minPrice?: number;
    maxPrice?: number;
  };
}

export function CardGrid({ filters }: CardGridProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useCards(filters);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage]
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-muted-foreground">Erro ao carregar cartas</p>
      </div>
    );
  }

  const allCards = data?.pages.flat() ?? [];

  if (allCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <PackageSearch className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-foreground font-semibold">Nenhuma carta encontrada</p>
        <p className="text-sm text-muted-foreground mt-1">
          Tente ajustar os filtros de busca
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {allCards.map((card) => (
          <CardCard key={card.id} card={card} />
        ))}
      </div>

      {/* Infinite scroll trigger */}
      <div ref={loadMoreRef} className="flex justify-center py-8">
        {isFetchingNextPage && (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        )}
        {!hasNextPage && allCards.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Todas as cartas foram carregadas
          </p>
        )}
      </div>
    </>
  );
}
