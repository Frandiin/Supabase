export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TradeStatus =
  | "negotiating"
  | "payment_pending"
  | "payment_held"
  | "shipped"
  | "delivered"
  | "completed"
  | "disputed"
  | "cancelled";

export type TransactionType =
  | "deposit"
  | "withdrawal"
  | "payment"
  | "receipt"
  | "escrow_hold"
  | "escrow_release";

export type CardCondition = "mint" | "near_mint" | "excellent" | "good" | "played" | "poor";
export type MessageType = "text" | "offer" | "system";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          avatar_url: string | null;
          reputation_score: number;
          is_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          avatar_url?: string | null;
          reputation_score?: number;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          avatar_url?: string | null;
          reputation_score?: number;
          updated_at?: string;
        };
      };
      cards: {
        Row: {
          id: string;
          seller_id: string;
          name: string;
          set_name: string;
          condition: CardCondition;
          price_cents: number;
          description: string | null;
          image_urls: string[];
          status: "available" | "reserved" | "sold";
          verified_by_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          seller_id: string;
          name: string;
          set_name: string;
          condition: CardCondition;
          price_cents: number;
          description?: string | null;
          image_urls?: string[];
          status?: "available" | "reserved" | "sold";
          verified_by_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          set_name?: string;
          condition?: CardCondition;
          price_cents?: number;
          description?: string | null;
          image_urls?: string[];
          status?: "available" | "reserved" | "sold";
          verified_by_admin?: boolean;
          updated_at?: string;
        };
      };
      trades: {
        Row: {
          id: string;
          card_id: string;
          buyer_id: string;
          seller_id: string;
          status: TradeStatus;
          agreed_price_cents: number | null;
          payment_deadline: string | null;
          shipping_deadline: string | null;
          delivery_deadline: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          card_id: string;
          buyer_id: string;
          seller_id: string;
          status?: TradeStatus;
          agreed_price_cents?: number | null;
          payment_deadline?: string | null;
          shipping_deadline?: string | null;
          delivery_deadline?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: TradeStatus;
          agreed_price_cents?: number | null;
          payment_deadline?: string | null;
          shipping_deadline?: string | null;
          delivery_deadline?: string | null;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          trade_id: string;
          sender_id: string;
          content: string;
          type: MessageType;
          offer_amount_cents: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          trade_id: string;
          sender_id: string;
          content: string;
          type?: MessageType;
          offer_amount_cents?: number | null;
          created_at?: string;
        };
        Update: never;
      };
      wallets: {
        Row: {
          id: string;
          user_id: string;
          balance_cents: number;
          escrow_cents: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          balance_cents?: number;
          escrow_cents?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          balance_cents?: number;
          escrow_cents?: number;
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          wallet_id: string;
          user_id: string;
          type: TransactionType;
          amount_cents: number;
          description: string;
          trade_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          wallet_id: string;
          user_id: string;
          type: TransactionType;
          amount_cents: number;
          description: string;
          trade_id?: string | null;
          created_at?: string;
        };
        Update: never;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      trade_status: TradeStatus;
      transaction_type: TransactionType;
      card_condition: CardCondition;
      message_type: MessageType;
    };
  };
}

// Convenience types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Card = Database["public"]["Tables"]["cards"]["Row"];
export type Trade = Database["public"]["Tables"]["trades"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type Wallet = Database["public"]["Tables"]["wallets"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];

export type CardWithSeller = Card & { seller: Profile };
export type TradeWithDetails = Trade & {
  card: Card;
  buyer: Profile;
  seller: Profile;
};
export type MessageWithSender = Message & { sender: Profile };
