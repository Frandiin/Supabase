import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

export function getConditionLabel(condition: string): string {
  const labels: Record<string, string> = {
    mint: "Mint",
    near_mint: "Near Mint",
    excellent: "Excelente",
    good: "Boa",
    played: "Jogada",
    poor: "Ruim",
  };
  return labels[condition] || condition;
}

export function getConditionColor(condition: string): string {
  const colors: Record<string, string> = {
    mint: "text-emerald-400",
    near_mint: "text-green-400",
    excellent: "text-blue-400",
    good: "text-yellow-400",
    played: "text-orange-400",
    poor: "text-red-400",
  };
  return colors[condition] || "text-gray-400";
}

export function getTradeStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    negotiating: "Negociando",
    payment_pending: "Aguardando Pagamento",
    payment_held: "Pagamento em Custódia",
    shipped: "Enviado",
    delivered: "Entregue",
    completed: "Concluído",
    disputed: "Em Disputa",
    cancelled: "Cancelado",
  };
  return labels[status] || status;
}

export function getTradeStatusColor(status: string): string {
  const colors: Record<string, string> = {
    negotiating: "text-blue-400",
    payment_pending: "text-yellow-400",
    payment_held: "text-purple-400",
    shipped: "text-cyan-400",
    delivered: "text-teal-400",
    completed: "text-emerald-400",
    disputed: "text-red-400",
    cancelled: "text-gray-400",
  };
  return colors[status] || "text-gray-400";
}

export function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes}m atrás`;
  if (hours < 24) return `${hours}h atrás`;
  return `${days}d atrás`;
}
