# PokéTrade Marketplace

> Marketplace completo de cartas Pokémon com chat em tempo real e pagamento interno seguro.

## 🚀 Stack

- **Framework:** Next.js 14 (App Router)
- **Linguagem:** TypeScript
- **Estilo:** Tailwind CSS (dark theme custom)
- **Backend:** Supabase (Auth, Database, Storage, Realtime, Edge Functions)
- **Queries:** TanStack Query v5

---

## ⚡ Configuração

### 1. Variáveis de ambiente

Copie o arquivo de exemplo e preencha:
```bash
cp .env.local.example .env.local
```

Preencha com os valores do seu projeto Supabase:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 2. Banco de dados

Execute o migration no Supabase:
- Acesse o **SQL Editor** no dashboard do Supabase
- Copie e cole o conteúdo de `supabase/migrations/001_initial_schema.sql`
- Execute

### 3. Storage

O bucket `card-images` já é criado pelo migration SQL. Verifique em **Storage** no dashboard.

### 4. Edge Functions

Deploy das funções:
```bash
npx supabase functions deploy create-trade
npx supabase functions deploy process-payment
npx supabase functions deploy release-payment
npx supabase functions deploy verify-card
```

### 5. Rodar localmente

```bash
npm run dev
```

Acesse em `http://localhost:3000`

---

## 📁 Estrutura

```
app/
├── (auth)/          # Login e Register
├── (dashboard)/     # Área protegida
│   ├── marketplace/ # Listagem e detalhe de cartas
│   ├── trades/      # Negociações com chat
│   ├── wallet/      # Carteira e transações
│   └── upload/      # Anunciar carta
components/
├── cards/           # CardGrid, CardCard, Filters
├── chat/            # ChatBox com realtime
├── trades/          # TradeActions
├── wallet/          # BalanceDisplay, TransactionList
└── ui/              # Sidebar, Skeleton
lib/
├── supabase/        # client, server, realtime
├── queries/         # TanStack Query hooks
└── utils/           # Formatação, helpers
supabase/
├── functions/       # Edge Functions (Deno)
│   ├── create-trade/
│   ├── process-payment/
│   ├── release-payment/
│   └── verify-card/
└── migrations/      # SQL Schema
types/
└── database.ts      # Tipos TypeScript do banco
```

---

## 🛡️ Funcionalidades Anti-Golpe

| Feature | Implementação |
|---|---|
| Reputação mínima para vender | ≥50 checado no `create-trade` |
| Pagamento em custódia | `process-payment` → escrow |
| Prazo para pagar | 24h automático |
| Prazo para enviar | 72h após pagamento |
| Prazo para confirmar | 72h após envio |
| Sistema de disputa | Status `disputed` |
| Verificação de cartas | `verified_by_admin = true` |
| Chat em tempo real | Supabase Realtime |

---

## 🗄️ Banco de Dados

### Tabelas principais:
- **profiles** — username, avatar, reputation_score
- **cards** — cartas com status, condition, imagens
- **trades** — negociações com status e prazos
- **messages** — chat (text/offer/system)
- **wallets** — saldo e escrow em centavos
- **transactions** — histórico completo

### Edge Functions:
- `create-trade` — valida e inicia negociação
- `process-payment` — move saldo para escrow
- `release-payment` — libera para vendedor após confirmação
- `verify-card` — admin verifica cartas

---

## 📝 Notas Importantes

- Todo dinheiro é em **centavos** para evitar erros float
- Realtime usa `postgres_changes` no Supabase
- Card compression via `browser-image-compression` antes do upload
- RLS (Row Level Security) protege todos os dados
