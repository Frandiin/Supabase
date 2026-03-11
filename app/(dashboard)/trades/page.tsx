"use client";

import { useMyTrades } from "@/lib/queries/trades";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import {
  formatPrice,
  getTradeStatusLabel,
  getTradeStatusColor,
  formatDate,
} from "@/lib/utils";
import {
  ArrowLeftRight,
  Loader2,
  MessageSquare,
  Package,
} from "lucide-react";
import type { TradeWithDetails } from "@/types/database";

export default function TradesPage() {
  const { data: trades, isLoading } = useMyTrades();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id ?? null);
    });
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ArrowLeftRight className="h-5 w-5 text-yellow-400" />
          <h1 className="text-2xl font-black">Minhas Trades</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Gerencie suas negociações de cartas
        </p>
      </div>

      {!trades || trades.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="font-semibold">Nenhuma negociação ainda</p>
          <p className="text-sm text-muted-foreground mt-1">
            Acesse o marketplace para encontrar cartas
          </p>
          <Link href="/marketplace" className="btn-primary mt-4">
            Ir para o Marketplace
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {trades.map((trade: TradeWithDetails) => {
            const isbuyer = trade.buyer_id === currentUserId;
            const opponent = isbuyer ? trade.seller : trade.buyer;
            const statusColor = getTradeStatusColor(trade.status);

            return (
              <Link
                key={trade.id}
                href={`/trades/${trade.id}`}
                className="pokemon-card flex items-center gap-4 p-4 hover:border-yellow-400/20 transition-all"
                id={`trade-${trade.id}`}
              >
                {/* Card image thumbnail */}
                <div className="h-14 w-10 flex-shrink-0 rounded-lg bg-muted/30 border border-border/50 flex items-center justify-center text-xl">
                  🃏
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{trade.card?.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isbuyer ? "Comprando de" : "Vendendo para"}{" "}
                    <span className="text-foreground font-medium">
                      {opponent?.username}
                    </span>
                  </p>
                </div>

                {/* Status + Price */}
                <div className="text-right flex-shrink-0">
                  <p className={`text-xs font-semibold ${statusColor}`}>
                    {getTradeStatusLabel(trade.status)}
                  </p>
                  {trade.agreed_price_cents ? (
                    <p className="text-sm font-black text-gradient mt-0.5">
                      {formatPrice(trade.agreed_price_cents)}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatPrice(trade.card?.price_cents ?? 0)}
                    </p>
                  )}
                </div>

                {/* Chat icon */}
                <div className="text-muted-foreground hover:text-foreground transition-colors">
                  <MessageSquare className="h-4 w-4" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
