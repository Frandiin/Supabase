import Image from "next/image";
import Link from "next/link";
import { Star, Eye, Tag } from "lucide-react";
import { formatPrice, getConditionLabel, getConditionColor } from "@/lib/utils";
import type { CardWithSeller } from "@/types/database";

interface CardCardProps {
  card: CardWithSeller;
}

export function CardCard({ card }: CardCardProps) {
  const conditionColor = getConditionColor(card.condition);

  return (
    <Link href={`/marketplace/${card.id}`} className="pokemon-card block group">
      {/* Image */}
      <div className="relative h-48 overflow-hidden rounded-t-xl bg-muted/30">
        {card.image_urls[0] ? (
          <Image
            src={card.image_urls[0]}
            alt={card.name}
            fill
            className="object-contain p-4 transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-4xl opacity-30">🃏</div>
          </div>
        )}
        {/* Overlay badge */}
        <div className="absolute top-2 right-2">
          <span className={`badge bg-card/80 backdrop-blur-sm border border-border/50 ${conditionColor}`}>
            {getConditionLabel(card.condition)}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground truncate">{card.name}</h3>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Tag className="h-3 w-3" />
          <span>{card.set_name}</span>
        </div>

        {/* Seller */}
        <div className="mt-2 flex items-center gap-1.5">
          <Star className="h-3 w-3 text-yellow-400" />
          <span className="text-xs text-muted-foreground">
            {card.seller?.username ?? "Vendedor"} —{" "}
            {card.seller?.reputation_score ?? 0}/100
          </span>
        </div>

        {/* Price + CTA */}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-lg font-black text-gradient">
            {formatPrice(card.price_cents)}
          </span>
          <div className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-yellow-400 transition-all group-hover:bg-primary/20">
            <Eye className="h-3 w-3" />
            Ver
          </div>
        </div>
      </div>
    </Link>
  );
}
