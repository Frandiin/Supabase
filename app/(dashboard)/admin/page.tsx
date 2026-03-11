"use client";

import { useUnverifiedCards, useApproveCard, useProfile } from "@/lib/queries/cards";
import { Loader2, CheckCircle, XCircle, ShieldCheck, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function AdminPage() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: cards, isLoading: cardsLoading } = useUnverifiedCards();
  const approveCard = useApproveCard();

  if (profileLoading || cardsLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
      </div>
    );
  }

  if (!profile?.is_admin) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center">
        <XCircle className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-black">Acesso Negado</h1>
        <p className="text-muted-foreground mt-2">
          Você precisa de privilégios de administrador para acessar esta página.
        </p>
        <Link href="/marketplace" className="btn-primary mt-6 px-8">
          Voltar para Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="h-6 w-6 text-yellow-400" />
            <h1 className="text-3xl font-black">Painel Admin</h1>
          </div>
          <p className="text-muted-foreground">
            Aprovação de cartas pendentes para o Marketplace
          </p>
        </div>
        <div className="bg-muted/50 px-4 py-2 rounded-lg border border-border/50 text-sm">
          <span className="font-bold">{cards?.length || 0}</span> cartas pendentes
        </div>
      </div>

      {!cards || cards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/50 py-20 text-center">
          <CheckCircle className="h-12 w-12 text-emerald-400/50 mx-auto mb-4" />
          <h3 className="text-xl font-bold">Tudo limpo!</h3>
          <p className="text-muted-foreground">Não há cartas pendentes de aprovação.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <div 
              key={card.id} 
              className="group rounded-2xl border border-border/50 bg-card/30 overflow-hidden hover:border-yellow-400/50 transition-all duration-300"
            >
              <div className="relative aspect-[4/3] w-full bg-muted/20">
                <Image
                  src={card.image_urls[0] || "/placeholder-card.png"}
                  alt={card.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-1">
                   <div className="bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold uppercase text-yellow-400">
                    {card.condition.replace('_', ' ')}
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-black text-lg leading-tight">{card.name}</h3>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                    {card.set_name}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xl font-black text-yellow-500">
                    R$ {(card.price_cents / 100).toFixed(2)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    {card.seller.username}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => approveCard.mutate(card.id)}
                    disabled={approveCard.isPending}
                    className="w-full btn-primary py-2.5 flex items-center justify-center gap-2 group-hover:scale-[1.02] transition-transform"
                  >
                    {approveCard.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" />
                        Aprovar Carta
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
