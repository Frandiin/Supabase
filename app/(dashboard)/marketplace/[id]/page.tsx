"use client";

import { useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useCard } from "@/lib/queries/cards";
import { createClient } from "@/lib/supabase/client";
import {
  formatPrice,
  getConditionLabel,
  getConditionColor,
  formatDate,
} from "@/lib/utils";
import {
  ArrowLeft,
  Star,
  Tag,
  Shield,
  MessageSquare,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

export default function CardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();
  const { data: card, isLoading, isError } = useCard(id);
  const [selectedImage, setSelectedImage] = useState(0);
  const [startingTrade, setStartingTrade] = useState(false);

  const handleStartTrade = async () => {
    setStartingTrade(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      if (user.id === card?.seller_id) {
        alert("Você não pode comprar sua própria carta!");
        return;
      }

      // Use supabase.functions.invoke instead of manual fetch
      const { data, error: functionError } = await supabase.functions.invoke("create-trade", {
        body: { card_id: id },
      });

      if (functionError) {
        console.error("Function error:", functionError);
        alert(functionError.message || "Erro ao iniciar trade");
        return;
      }

      if (data?.error) {
        alert(data.error);
        return;
      }

      router.push(`/trades/${data.trade_id}`);
    } catch (err: any) {
      console.error("Trade start error:", err);
      alert(err.message || "Erro ao iniciar trade");
    } finally {
      setStartingTrade(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
      </div>
    );
  }

  if (isError || !card) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-foreground font-semibold">Carta não encontrada</p>
        <Link href="/marketplace" className="btn-secondary mt-4">
          Voltar ao marketplace
        </Link>
      </div>
    );
  }

  const conditionColor = getConditionColor(card.condition);

  return (
    <div className="space-y-6">
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao Marketplace
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div className="space-y-3">
          <div className="relative h-80 rounded-xl overflow-hidden bg-muted/20 border border-border/50">
            {card.image_urls[selectedImage] ? (
              <Image
                src={card.image_urls[selectedImage]}
                alt={card.name}
                fill
                className="object-contain p-6"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-6xl opacity-30">
                🃏
              </div>
            )}

            {card.image_urls.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setSelectedImage((prev) =>
                      prev === 0 ? card.image_urls.length - 1 : prev - 1
                    )
                  }
                  className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-card/80 backdrop-blur-sm border border-border/50 hover:bg-card transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() =>
                    setSelectedImage((prev) =>
                      prev === card.image_urls.length - 1 ? 0 : prev + 1
                    )
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-card/80 backdrop-blur-sm border border-border/50 hover:bg-card transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {card.image_urls.length > 1 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {card.image_urls.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`relative h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedImage === i
                      ? "border-yellow-400"
                      : "border-border/50"
                  }`}
                >
                  <Image
                    src={url}
                    alt={`${card.name} ${i + 1}`}
                    fill
                    className="object-contain"
                    sizes="64px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-5">
          <div>
            <h1 className="text-3xl font-black">{card.name}</h1>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Tag className="h-3.5 w-3.5" />
                {card.set_name}
              </div>
              <span className={`badge bg-card border border-border/50 ${conditionColor}`}>
                {getConditionLabel(card.condition)}
              </span>
            </div>
          </div>

          {/* Price */}
          <div className="glass-panel p-4">
            <p className="text-xs text-muted-foreground mb-1">Preço pedido</p>
            <p className="text-3xl font-black text-gradient">
              {formatPrice(card.price_cents)}
            </p>
          </div>

          {/* Seller info */}
          <div className="pokemon-card p-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              VENDEDOR
            </p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">
                  {card.seller?.username ?? "Anônimo"}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Star className="h-3.5 w-3.5 text-yellow-400" />
                  <span className="text-sm text-muted-foreground">
                    Reputação:{" "}
                    <span className="font-semibold text-foreground">
                      {card.seller?.reputation_score ?? 0}/100
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {card.description && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                DESCRIÇÃO
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {card.description}
              </p>
            </div>
          )}

          {/* Anti-fraud badge */}
          <div className="flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/5 p-3">
            <Shield className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              <span className="text-emerald-400 font-medium">
                Compra protegida:
              </span>{" "}
              pagamento fica em custódia até confirmação do recebimento
            </p>
          </div>

          {/* CTA */}
          <button
            onClick={handleStartTrade}
            disabled={startingTrade}
            className="btn-primary w-full py-4 text-base"
            id="start-trade-btn"
          >
            {startingTrade ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Iniciando negociação...
              </>
            ) : (
              <>
                <MessageSquare className="h-5 w-5" />
                Iniciar Negociação
              </>
            )}
          </button>

          <p className="text-center text-xs text-muted-foreground">
            Anunciado em {formatDate(card.created_at)}
          </p>
        </div>
      </div>
    </div>
  );
}
