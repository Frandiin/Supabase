import Link from "next/link";
import { Zap } from "lucide-react";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      {/* Animated background orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-yellow-400/10 blur-3xl animate-float" />
        <div
          className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl animate-float"
          style={{ animationDelay: "1.5s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-purple-600/5 blur-3xl animate-float"
          style={{ animationDelay: "0.75s" }}
        />
      </div>

      <div className="relative z-10 max-w-3xl">
        {/* Logo */}
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-yellow-400/30 bg-yellow-400/10 animate-pulse-glow">
            <Zap className="h-8 w-8 text-yellow-400" />
          </div>
        </div>

        <h1 className="mb-4 text-6xl font-black tracking-tight">
          <span className="text-gradient">PokéTrade</span>
        </h1>
        <p className="mb-2 text-xl font-semibold text-foreground">
          Marketplace de Cartas Pokémon
        </p>
        <p className="mb-10 text-muted-foreground max-w-lg mx-auto">
          Compre, venda e negocie cartas com segurança. Chat em tempo real,
          pagamento em custódia e sistema anti-golpe integrado.
        </p>

        {/* Feature badges */}
        <div className="mb-10 flex flex-wrap justify-center gap-3">
          {[
            "🔒 Pagamento Seguro",
            "💬 Chat em Tempo Real",
            "⭐ Sistema de Reputação",
            "🛡️ Escrow Anti-Golpe",
          ].map((feature) => (
            <span key={feature} className="badge-blue text-sm px-4 py-1.5">
              {feature}
            </span>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/register" className="btn-primary px-8 py-3 text-base">
            Criar Conta Grátis
          </Link>
          <Link href="/login" className="btn-secondary px-8 py-3 text-base">
            Entrar
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-3 gap-8">
          {[
            { value: "10k+", label: "Cartas Listadas" },
            { value: "5k+", label: "Traders Ativos" },
            { value: "99%", label: "Trades Seguros" },
          ].map((stat) => (
            <div key={stat.label} className="glass-panel p-4">
              <div className="text-2xl font-black text-gradient">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
