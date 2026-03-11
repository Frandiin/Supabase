"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTrade } from "@/lib/queries/trades";
import { ChatBox } from "@/components/chat/ChatBox";
import { TradeActions } from "@/components/trades/TradeActions";
import { createClient } from "@/lib/supabase/client";
import {
  formatPrice,
  getConditionLabel,
  getTradeStatusLabel,
  getTradeStatusColor,
} from "@/lib/utils";
import { ArrowLeft, Loader2, Star } from "lucide-react";
import Link from "next/link";

const STATUS_STEPS = [
  "negotiating",
  "payment_pending",
  "payment_held",
  "shipped",
  "delivered",
  "completed",
];

export default function TradeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: trade, isLoading } = useTrade(id);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setCurrentUserId(user.id);
    });
  }, [router]);

  if (isLoading || !currentUserId) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="font-semibold">Trade não encontrada</p>
        <Link href="/trades" className="btn-secondary mt-4">
          Voltar para trades
        </Link>
      </div>
    );
  }

  const isBuyer = trade.buyer_id === currentUserId;
  const opponent = isBuyer ? trade.seller : trade.buyer;
  const statusColor = getTradeStatusColor(trade.status);
  const currentStepIdx = STATUS_STEPS.indexOf(trade.status);

  return (
    <div className="space-y-6">
      <Link
        href="/trades"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para Trades
      </Link>

      {/* Status bar */}
      <div className="pokemon-card p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted-foreground">STATUS DA NEGOCIAÇÃO</p>
          <span className={`text-sm font-bold ${statusColor}`}>
            {getTradeStatusLabel(trade.status)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {STATUS_STEPS.map((step, idx) => (
            <div key={step} className="flex-1 flex items-center gap-1">
              <div
                className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${
                  idx <= currentStepIdx
                    ? idx === currentStepIdx
                      ? "bg-yellow-400"
                      : "bg-yellow-400/40"
                    : "bg-muted/30"
                }`}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat */}
        <div className="lg:col-span-2">
          <div className="pokemon-card overflow-hidden">
            <div className="border-b border-border/50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted border border-border/50 text-sm">
                  {opponent?.username?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-sm">{opponent?.username}</p>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-400" />
                    <span className="text-xs text-muted-foreground">
                      {opponent?.reputation_score}/100
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <ChatBox
              tradeId={trade.id}
              currentUserId={currentUserId}
              cardPriceCents={trade.card?.price_cents ?? 0}
            />
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          {/* Card info */}
          <div className="pokemon-card p-4 space-y-3">
            <p className="text-xs font-medium text-muted-foreground">CARTA</p>
            <div>
              <p className="font-bold">{trade.card?.name}</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {trade.card?.set_name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Condição:{" "}
                {getConditionLabel(trade.card?.condition ?? "good")}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {trade.agreed_price_cents
                  ? "Preço acordado"
                  : "Preço pedido"}
              </p>
              <p className="text-xl font-black text-gradient">
                {formatPrice(
                  trade.agreed_price_cents ?? trade.card?.price_cents ?? 0
                )}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {isBuyer ? "Comprando de" : "Vendendo para"}{" "}
              <span className="font-semibold text-foreground">
                {opponent?.username}
              </span>
            </p>
          </div>

          {/* Actions */}
          <div className="pokemon-card p-4">
            <TradeActions trade={trade} currentUserId={currentUserId} />
          </div>

          {/* Deadlines */}
          {(trade.payment_deadline ||
            trade.shipping_deadline ||
            trade.delivery_deadline) && (
            <div className="pokemon-card p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                PRAZOS
              </p>
              {trade.payment_deadline && (
                <div>
                  <p className="text-xs text-muted-foreground">
                    Pagamento até
                  </p>
                  <p className="text-xs text-yellow-400 font-medium">
                    {new Date(trade.payment_deadline).toLocaleString("pt-BR")}
                  </p>
                </div>
              )}
              {trade.shipping_deadline && (
                <div>
                  <p className="text-xs text-muted-foreground">Envio até</p>
                  <p className="text-xs text-yellow-400 font-medium">
                    {new Date(trade.shipping_deadline).toLocaleString("pt-BR")}
                  </p>
                </div>
              )}
              {trade.delivery_deadline && (
                <div>
                  <p className="text-xs text-muted-foreground">Entrega até</p>
                  <p className="text-xs text-yellow-400 font-medium">
                    {new Date(trade.delivery_deadline).toLocaleString("pt-BR")}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
