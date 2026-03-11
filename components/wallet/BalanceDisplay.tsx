import { formatPrice } from "@/lib/utils";
import { Wallet, Lock } from "lucide-react";
import type { Wallet as WalletType } from "@/types/database";

interface BalanceDisplayProps {
  wallet: WalletType;
}

export function BalanceDisplay({ wallet }: BalanceDisplayProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-2">
          <Wallet className="h-4 w-4 text-yellow-400" />
          <p className="text-xs text-muted-foreground">Disponível</p>
        </div>
        <p className="text-xl font-black text-gradient">
          {formatPrice(wallet.balance_cents)}
        </p>
      </div>
      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-2">
          <Lock className="h-4 w-4 text-purple-400" />
          <p className="text-xs text-muted-foreground">Em Custódia</p>
        </div>
        <p className="text-xl font-black text-purple-400">
          {formatPrice(wallet.escrow_cents)}
        </p>
      </div>
    </div>
  );
}
