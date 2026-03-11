"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

interface MarketplaceFiltersProps {
  onFilterChange: (filters: {
    name?: string;
    set?: string;
    condition?: string;
    minPrice?: number;
    maxPrice?: number;
  }) => void;
}

const CONDITIONS = [
  { value: "", label: "Todas" },
  { value: "mint", label: "Mint" },
  { value: "near_mint", label: "Near Mint" },
  { value: "excellent", label: "Excelente" },
  { value: "good", label: "Boa" },
  { value: "played", label: "Jogada" },
  { value: "poor", label: "Ruim" },
];

export function MarketplaceFilters({ onFilterChange }: MarketplaceFiltersProps) {
  const [name, setName] = useState("");
  const [set, setSet] = useState("");
  const [condition, setCondition] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const applyFilters = () => {
    onFilterChange({
      name: name || undefined,
      set: set || undefined,
      condition: condition || undefined,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    });
  };

  const clearAll = () => {
    setName("");
    setSet("");
    setCondition("");
    setMinPrice("");
    setMaxPrice("");
    onFilterChange({});
  };

  const hasFilters = name || set || condition || minPrice || maxPrice;

  return (
    <div className="space-y-3">
      {/* Search bar row */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            id="search-cards"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              onFilterChange({
                name: e.target.value || undefined,
                set: set || undefined,
                condition: condition || undefined,
                minPrice: minPrice ? parseFloat(minPrice) : undefined,
                maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
              });
            }}
            placeholder="Buscar cartas por nome..."
            className="input-field pl-10"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-secondary gap-2 ${showFilters ? "border-primary/50 text-primary" : ""}`}
          id="toggle-filters"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
          {hasFilters && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-yellow-400 text-[10px] font-black text-background">
              !
            </span>
          )}
        </button>
        {hasFilters && (
          <button onClick={clearAll} className="btn-secondary text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="glass-panel p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Coleção (Set)
            </label>
            <input
              id="filter-set"
              type="text"
              value={set}
              onChange={(e) => setSet(e.target.value)}
              placeholder="Ex: Base Set"
              className="input-field text-sm"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Condição
            </label>
            <select
              id="filter-condition"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="input-field text-sm"
            >
              {CONDITIONS.map((c) => (
                <option key={c.value} value={c.value} className="bg-card">
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Preço mín. (R$)
            </label>
            <input
              id="filter-min-price"
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="0"
              min="0"
              className="input-field text-sm"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Preço máx. (R$)
            </label>
            <input
              id="filter-max-price"
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="9999"
              min="0"
              className="input-field text-sm"
            />
          </div>

          <div className="col-span-2 md:col-span-4 flex justify-end">
            <button onClick={applyFilters} className="btn-primary" id="apply-filters">
              Aplicar Filtros
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
