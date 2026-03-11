"use client";

import { useUpdateTradeStatus, useSendMessage } from "@/lib/queries/trades";
import { formatPrice } from "@/lib/utils";
import {
  CreditCard,
  PackageCheck,
  Truck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  DollarSign,
} from "lucide-react";
import type { TradeWithDetails } from "@/types/database";
import { createClient } from "@/lib/supabase/client";

interface TradeActionsProps {
  trade: TradeWithDetails;
  currentUserId: string;
}

export function TradeActions({ trade, currentUserId }: TradeActionsProps) {
  const updateStatus = useUpdateTradeStatus();
  const sendMessage = useSendMessage();

  const isBuyer = trade.buyer_id === currentUserId;
  const isSeller = trade.seller_id === currentUserId;

  const handleAction = async (action: string) => {
    try {
      const supabase = createClient();
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (action === "pay") {
        // Call process-payment Edge Function
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/process-payment`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ trade_id: trade.id }),
          }
        );
        const result = await response.json();
        if (!response.ok) {
          alert(result.error || "Erro ao processar pagamento");
          return;
        }
      } else if (action === "ship") {
        await updateStatus.mutateAsync({ tradeId: trade.id, status: "shipped" });
        await sendMessage.mutateAsync({
          trade_id: trade.id,
          content: "📦 Carta marcada como enviada pelo vendedor",
          type: "system",
        });
      } else if (action === "confirm-receipt") {
        // Call release-payment Edge Function
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/release-payment`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ trade_id: trade.id, action: "release" }),
          }
        );
        const result = await response.json();
        if (!response.ok) {
          alert(result.error || "Erro ao confirmar recebimento");
          return;
        }
      } else if (action === "dispute") {
        await updateStatus.mutateAsync({ tradeId: trade.id, status: "disputed" });
        await sendMessage.mutateAsync({
          trade_id: trade.id,
          content: "⚠️ Disputa aberta. Nossa equipe irá analisar o caso.",
          type: "system",
        });
      } else if (action === "cancel") {
        await updateStatus.mutateAsync({ tradeId: trade.id, status: "cancelled" });
        await sendMessage.mutateAsync({
          trade_id: trade.id,
          content: "❌ Negociação cancelada",
          type: "system",
        });
      }
    } catch (err) {
      console.error(err);
      alert("Ocorreu um erro");
    }
  };

  const isLoading = updateStatus.isPending || sendMessage.isPending;

  const renderButtons = () => {
    switch (trade.status) {
      case "negotiating":
        return (
          <div className="flex flex-wrap gap-2">
            {isBuyer && (
              <button
                onClick={() => handleAction("cancel")}
                disabled={isLoading}
                className="btn-danger flex-1"
                id="cancel-trade-btn"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                Cancelar
              </button>
            )}
            {isSeller && trade.agreed_price_cents && (
              <div className="text-xs text-muted-foreground text-center w-full">
                Aguardando o comprador pagar{" "}
                <span className="text-foreground font-semibold">
                  {formatPrice(trade.agreed_price_cents)}
                </span>
              </div>
            )}
          </div>
        );

      case "payment_pending":
        return (
          <div className="space-y-2">
            {isBuyer && trade.agreed_price_cents && (
              <button
                onClick={() => handleAction("pay")}
                disabled={isLoading}
                className="btn-primary w-full"
                id="pay-now-btn"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                Pagar {formatPrice(trade.agreed_price_cents)} Agora
              </button>
            )}
            {isBuyer && (
              <p className="text-xs text-center text-muted-foreground">
                ⏰ Prazo: 24h para realizar o pagamento
              </p>
            )}
            {isSeller && (
              <p className="text-xs text-center text-muted-foreground">
                Aguardando pagamento do comprador...
              </p>
            )}
          </div>
        );

      case "payment_held":
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-lg border border-purple-400/20 bg-purple-400/5 p-3">
              <DollarSign className="h-4 w-4 text-purple-400 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                <span className="text-purple-400 font-semibold">Pagamento em custódia.</span>{" "}
                O dinheiro será liberado após confirmação.
              </p>
            </div>
            {isSeller && (
              <button
                onClick={() => handleAction("ship")}
                disabled={isLoading}
                className="btn-primary w-full"
                id="mark-shipped-btn"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Truck className="h-4 w-4" />
                )}
                Marcar como Enviado
              </button>
            )}
            {isBuyer && (
              <p className="text-xs text-center text-muted-foreground">
                Aguardando o vendedor enviar a carta...
              </p>
            )}
          </div>
        );

      case "shipped":
        return (
          <div className="space-y-2">
            {isBuyer && (
              <>
                <button
                  onClick={() => handleAction("confirm-receipt")}
                  disabled={isLoading}
                  className="btn-primary w-full"
                  id="confirm-receipt-btn"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  Confirmar Recebimento
                </button>
                <button
                  onClick={() => handleAction("dispute")}
                  disabled={isLoading}
                  className="btn-danger w-full"
                  id="open-dispute-btn"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Abrir Disputa
                </button>
              </>
            )}
            {isSeller && (
              <div className="text-center">
                <PackageCheck className="h-6 w-6 text-cyan-400 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">
                  Carta enviada. Aguardando confirmação do comprador...
                </p>
              </div>
            )}
          </div>
        );

      case "completed":
        return (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/5 p-4">
            <CheckCircle className="h-5 w-5 text-emerald-400" />
            <p className="text-sm font-semibold text-emerald-400">
              Trade concluído com sucesso!
            </p>
          </div>
        );

      case "disputed":
        return (
          <div className="flex items-center gap-2 rounded-lg border border-red-400/20 bg-red-400/5 p-3">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <p className="text-xs text-muted-foreground">
              <span className="text-red-400 font-semibold">Disputa em análise.</span>{" "}
              Nossa equipe entrará em contato.
            </p>
          </div>
        );

      case "cancelled":
        return (
          <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/20 p-3">
            <XCircle className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Esta negociação foi cancelada.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted-foreground">AÇÕES</p>
      {renderButtons()}
    </div>
  );
}
