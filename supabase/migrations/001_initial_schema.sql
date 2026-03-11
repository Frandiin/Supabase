-- =============================================
-- PokéTrade Marketplace - Initial Schema
-- =============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- ENUMS
-- =============================================

CREATE TYPE trade_status AS ENUM (
  'negotiating',
  'payment_pending',
  'payment_held',
  'shipped',
  'delivered',
  'completed',
  'disputed',
  'cancelled'
);

CREATE TYPE transaction_type AS ENUM (
  'deposit',
  'withdrawal',
  'payment',
  'receipt',
  'escrow_hold',
  'escrow_release'
);

CREATE TYPE card_condition AS ENUM (
  'mint',
  'near_mint',
  'excellent',
  'good',
  'played',
  'poor'
);

CREATE TYPE message_type AS ENUM (
  'text',
  'offer',
  'system'
);

CREATE TYPE card_status AS ENUM (
  'available',
  'reserved',
  'sold'
);

-- =============================================
-- TABLES
-- =============================================

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  reputation_score INTEGER DEFAULT 50 CHECK (reputation_score >= 0 AND reputation_score <= 100),
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cards
CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  set_name TEXT NOT NULL,
  condition card_condition NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents > 0),
  description TEXT,
  image_urls TEXT[] DEFAULT '{}',
  status card_status DEFAULT 'available',
  verified_by_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trades
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE RESTRICT,
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  status trade_status DEFAULT 'negotiating',
  agreed_price_cents INTEGER CHECK (agreed_price_cents > 0),
  payment_deadline TIMESTAMPTZ,
  shipping_deadline TIMESTAMPTZ,
  delivery_deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT buyer_seller_different CHECK (buyer_id != seller_id)
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type message_type DEFAULT 'text',
  offer_amount_cents INTEGER CHECK (offer_amount_cents > 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wallets
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  balance_cents INTEGER DEFAULT 0 CHECK (balance_cents >= 0),
  escrow_cents INTEGER DEFAULT 0 CHECK (escrow_cents >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  description TEXT NOT NULL,
  trade_id UUID REFERENCES trades(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_cards_seller_id ON cards(seller_id);
CREATE INDEX idx_cards_status ON cards(status);
CREATE INDEX idx_cards_verified ON cards(verified_by_admin);
CREATE INDEX idx_cards_name ON cards USING gin(to_tsvector('portuguese', name));
CREATE INDEX idx_trades_buyer ON trades(buyer_id);
CREATE INDEX idx_trades_seller ON trades(seller_id);
CREATE INDEX idx_trades_card ON trades(card_id);
CREATE INDEX idx_messages_trade ON messages(trade_id);
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_wallet ON transactions(wallet_id);

-- =============================================
-- UPDATED_AT TRIGGER
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cards_updated_at BEFORE UPDATE ON cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON trades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT USING (TRUE);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- CARDS policies
CREATE POLICY "Available verified cards are viewable by everyone"
  ON cards FOR SELECT
  USING (status = 'available' AND verified_by_admin = TRUE OR seller_id = auth.uid());

CREATE POLICY "Sellers can insert their own cards"
  ON cards FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their own cards"
  ON cards FOR UPDATE USING (auth.uid() = seller_id);

-- TRADES policies
CREATE POLICY "Trade participants can view their trades"
  ON trades FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Buyers can create trades"
  ON trades FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Trade participants can update trades"
  ON trades FOR UPDATE
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- MESSAGES policies
CREATE POLICY "Trade participants can view messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trades
      WHERE trades.id = messages.trade_id
      AND (trades.buyer_id = auth.uid() OR trades.seller_id = auth.uid())
    )
  );

CREATE POLICY "Trade participants can insert messages"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM trades
      WHERE trades.id = messages.trade_id
      AND (trades.buyer_id = auth.uid() OR trades.seller_id = auth.uid())
    )
  );

-- WALLETS policies
CREATE POLICY "Users can view their own wallet"
  ON wallets FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallet"
  ON wallets FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet"
  ON wallets FOR UPDATE USING (auth.uid() = user_id);

-- TRANSACTIONS policies
CREATE POLICY "Users can view their own transactions"
  ON transactions FOR SELECT USING (auth.uid() = user_id);

-- =============================================
-- REALTIME
-- =============================================

ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE trades;

-- =============================================
-- STORAGE BUCKETS
-- =============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('card-images', 'card-images', TRUE)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view card images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'card-images');

CREATE POLICY "Authenticated users can upload card images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'card-images' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own card images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'card-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- =============================================
-- SEED DATA (Demo)
-- =============================================

-- Note: In production, remove this seed data
-- Admin user profile is created via Supabase Dashboard
