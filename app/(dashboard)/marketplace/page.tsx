"use client";

import { useState } from "react";
import { CardGrid } from "@/components/cards/CardGrid";
import { MarketplaceFilters } from "@/components/cards/MarketplaceFilters";
import { LayoutGrid, Sparkles } from "lucide-react";

export default function MarketplacePage() {
  const [filters, setFilters] = useState<{
    name?: string;
    set?: string;
    condition?: string;
    minPrice?: number;
    maxPrice?: number;
  }>({});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LayoutGrid className="h-5 w-5 text-yellow-400" />
            <h1 className="text-2xl font-black">Marketplace</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Compre cartas Pokémon verificadas com segurança
          </p>
        </div>
        <div className="flex items-center gap-2 badge-yellow">
          <Sparkles className="h-3 w-3" />
          Apenas cartas verificadas
        </div>
      </div>

      {/* Filters */}
      <MarketplaceFilters onFilterChange={setFilters} />

      {/* Grid */}
      <CardGrid filters={filters} />
    </div>
  );
}
