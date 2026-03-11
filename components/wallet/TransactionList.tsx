"use client";

import { formatPrice, formatDate } from "@/lib/utils";
import { ArrowDownLeft, ArrowUpRight, Lock, TrendingUp } from "lucide-react";
import type { Transaction } from "@/types/database";

interface TransactionListProps {
  transactions: Transaction[];
}

const ICONS: Record<string, React.ElementType> = {
  deposit: ArrowDownLeft,
  withdrawal: ArrowUpRight,
  payment: ArrowUpRight,
  receipt: ArrowDownLeft,
  escrow_hold: Lock,
  escrow_release: TrendingUp,
};

const COLORS: Record<string, string> = {
  deposit: "text-emerald-400",
  withdrawal: "text-red-400",
  payment: "text-red-400",
  receipt: "text-emerald-400",
  escrow_hold: "text-purple-400",
  escrow_release: "text-blue-400",
};

export function TransactionList({ transactions }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        Nenhuma transação encontrada
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx) => {
        const Icon = ICONS[tx.type] ?? TrendingUp;
        const color = COLORS[tx.type] ?? "text-muted-foreground";
        const isPositive = ["deposit", "receipt", "escrow_release"].includes(tx.type);

        return (
          <div
            key={tx.id}
            className="flex items-center gap-3 p-3 rounded-lg border border-border/30 hover:bg-muted/20 transition-colors"
          >
            <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-muted/20 ${color}`}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{tx.description}</p>
              <p className="text-xs text-muted-foreground">{formatDate(tx.created_at)}</p>
            </div>
            <p className={`text-sm font-bold ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
              {isPositive ? "+" : "-"}{formatPrice(tx.amount_cents)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
