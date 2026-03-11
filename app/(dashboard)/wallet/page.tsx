"use client";

import { useWallet, useTransactions, useDeposit } from "@/lib/queries/wallet";
import { formatPrice, formatDate } from "@/lib/utils";
import {
  Wallet as WalletIcon,
  TrendingUp,
  TrendingDown,
  Lock,
  Plus,
  Loader2,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import { useState } from "react";

const TRANSACTION_ICONS: Record<string, React.ElementType> = {
  deposit: ArrowDownLeft,
  withdrawal: ArrowUpRight,
  payment: ArrowUpRight,
  receipt: ArrowDownLeft,
  escrow_hold: Lock,
  escrow_release: TrendingUp,
};

const TRANSACTION_COLORS: Record<string, string> = {
  deposit: "text-emerald-400",
  withdrawal: "text-red-400",
  payment: "text-red-400",
  receipt: "text-emerald-400",
  escrow_hold: "text-purple-400",
  escrow_release: "text-blue-400",
};

export default function WalletPage() {
  const { data: wallet, isLoading: walletLoading } = useWallet();
  const { data: transactions, isLoading: txLoading } = useTransactions();
  const deposit = useDeposit();
  const [depositAmount, setDepositAmount] = useState("");
  const [showDeposit, setShowDeposit] = useState(false);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) return;

    await deposit.mutateAsync(Math.round(amount * 100));
    setDepositAmount("");
    setShowDeposit(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <WalletIcon className="h-5 w-5 text-yellow-400" />
          <h1 className="text-2xl font-black">Carteira</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Seu saldo e histórico de transações
        </p>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="pokemon-card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">Saldo disponível</p>
            <WalletIcon className="h-5 w-5 text-yellow-400" />
          </div>
          {walletLoading ? (
            <div className="shimmer h-8 w-32 rounded" />
          ) : (
            <p className="text-3xl font-black text-gradient">
              {formatPrice(wallet?.balance_cents ?? 0)}
            </p>
          )}
          <button
            onClick={() => setShowDeposit(!showDeposit)}
            className="btn-primary mt-3 w-full"
            id="deposit-btn"
          >
            <Plus className="h-4 w-4" />
            Depositar
          </button>

          {showDeposit && (
            <form onSubmit={handleDeposit} className="mt-3 flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  R$
                </span>
                <input
                  id="deposit-amount"
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0,00"
                  min="1"
                  step="0.01"
                  className="input-field pl-9 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={deposit.isPending}
                className="btn-primary px-3"
                id="confirm-deposit-btn"
              >
                {deposit.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "OK"
                )}
              </button>
            </form>
          )}
        </div>

        <div className="pokemon-card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">Em custódia (Escrow)</p>
            <Lock className="h-5 w-5 text-purple-400" />
          </div>
          {walletLoading ? (
            <div className="shimmer h-8 w-32 rounded" />
          ) : (
            <p className="text-3xl font-black text-purple-400">
              {formatPrice(wallet?.escrow_cents ?? 0)}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-3">
            Valor retido em trades ativas. Liberado após confirmação.
          </p>
        </div>
      </div>

      {/* Transactions */}
      <div>
        <h2 className="text-lg font-bold mb-3">Histórico de Transações</h2>

        {txLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="shimmer h-14 rounded-xl" />
            ))}
          </div>
        ) : !transactions || transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <TrendingUp className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">Nenhuma transação ainda</p>
            <p className="text-xs text-muted-foreground mt-1">
              Faça um depósito para começar a negociar
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => {
              const Icon = TRANSACTION_ICONS[tx.type] ?? TrendingUp;
              const color = TRANSACTION_COLORS[tx.type] ?? "text-muted-foreground";
              const isPositive = ["deposit", "receipt", "escrow_release"].includes(tx.type);

              return (
                <div
                  key={tx.id}
                  className="pokemon-card flex items-center gap-4 p-4"
                  id={`tx-${tx.id}`}
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full bg-muted/30 border border-border/50 ${color}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {tx.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(tx.created_at)}
                    </p>
                  </div>
                  <p
                    className={`text-sm font-bold flex-shrink-0 ${
                      isPositive ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {isPositive ? "+" : "-"}
                    {formatPrice(tx.amount_cents)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
