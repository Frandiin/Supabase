"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTradeMessages, useSendMessage } from "@/lib/queries/trades";
import { useTradeMessages as useRealtimeMessages } from "@/lib/supabase/realtime";
import { useQueryClient } from "@tanstack/react-query";
import { formatPrice, timeAgo } from "@/lib/utils";
import { Send, DollarSign, Loader2 } from "lucide-react";
import type { MessageWithSender } from "@/types/database";

interface ChatBoxProps {
  tradeId: string;
  currentUserId: string;
  cardPriceCents: number;
}

export function ChatBox({ tradeId, currentUserId, cardPriceCents }: ChatBoxProps) {
  const queryClient = useQueryClient();
  const { data: messages, isLoading } = useTradeMessages(tradeId);
  const sendMessage = useSendMessage();
  const [text, setText] = useState("");
  const [showOffer, setShowOffer] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Realtime subscription
  const handleNewMessage = useCallback(
    (msg: { id: string; trade_id: string; sender_id: string; content: string; type: string; offer_amount_cents: number | null; created_at: string }) => {
      queryClient.setQueryData(
        ["trade-messages", tradeId],
        (old: MessageWithSender[] | undefined) => {
          const existing = old ?? [];
          if (existing.some((m) => m.id === msg.id)) return existing;
          // The realtime payload won't have sender, treat as partial
          return [...existing, msg as MessageWithSender];
        }
      );
    },
    [queryClient, tradeId]
  );

  useRealtimeMessages(tradeId, handleNewMessage);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !showOffer) return;

    setText("");
    await sendMessage.mutateAsync({
      trade_id: tradeId,
      content: text.trim() || `Oferta: ${formatPrice(parseFloat(offerAmount) * 100)}`,
      type: "text",
    });
  };

  const handleOffer = async () => {
    if (!offerAmount) return;
    const cents = Math.round(parseFloat(offerAmount) * 100);
    if (isNaN(cents) || cents <= 0) return;

    await sendMessage.mutateAsync({
      trade_id: tradeId,
      content: `💰 Oferta de ${formatPrice(cents)}`,
      type: "offer",
      offer_amount_cents: cents,
    });

    setOfferAmount("");
    setShowOffer(false);
  };

  return (
    <div className="flex flex-col h-[500px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-4xl mb-2">💬</p>
            <p className="text-sm text-muted-foreground">
              Inicie a conversa para negociar
            </p>
          </div>
        ) : (
          messages?.map((msg) => {
            const isMe = msg.sender_id === currentUserId;

            if (msg.type === "system") {
              return (
                <div key={msg.id} className="system-message">
                  {msg.content}
                </div>
              );
            }

            if (msg.type === "offer") {
              return (
                <div key={msg.id} className="offer-bubble">
                  <p className="text-yellow-400 font-black text-lg">
                    {msg.content}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isMe ? "Você fez uma oferta" : `${msg.sender?.username} fez uma oferta`} ·{" "}
                    {timeAgo(msg.created_at)}
                  </p>
                </div>
              );
            }

            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                {!isMe && (
                  <p className="text-xs text-muted-foreground mb-1 ml-1">
                    {msg.sender?.username}
                  </p>
                )}
                <div className={isMe ? "message-bubble-mine" : "message-bubble-other"}>
                  {msg.content}
                </div>
                <p className="text-xs text-muted-foreground mt-1 mx-1">
                  {timeAgo(msg.created_at)}
                </p>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Offer panel */}
      {showOffer && (
        <div className="border-t border-border/50 p-3 bg-card/50">
          <p className="text-xs text-muted-foreground mb-2">
            Faça uma oferta (preço pedido:{" "}
            {formatPrice(cardPriceCents)})
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                R$
              </span>
              <input
                id="offer-amount"
                type="number"
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
                placeholder="0,00"
                min="0"
                step="0.01"
                className="input-field pl-9 text-sm"
              />
            </div>
            <button onClick={handleOffer} className="btn-primary" id="send-offer-btn">
              Enviar Oferta
            </button>
            <button onClick={() => setShowOffer(false)} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border/50 p-3">
        <form onSubmit={handleSend} className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowOffer(!showOffer)}
            className="btn-secondary px-3"
            title="Fazer oferta"
            id="offer-btn"
          >
            <DollarSign className="h-4 w-4 text-yellow-400" />
          </button>
          <input
            id="chat-input"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Digite uma mensagem..."
            className="input-field flex-1 text-sm"
          />
          <button
            type="submit"
            disabled={!text.trim() || sendMessage.isPending}
            className="btn-primary px-3"
            id="send-message-btn"
          >
            {sendMessage.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
