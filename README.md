# Lava Jato Redenção - Cardápio Digital & Agendamento

Cardápio digital e sistema de agendamento para Lava Jato Redenção com seleção de veículo, lavagens, serviços adicionais, cálculo em tempo real e envio do pedido via WhatsApp.

## Stack

- **Frontend:** React 19 + Vite + TypeScript + Tailwind CSS
- **Banco de dados:** Supabase (PostgreSQL) com fallback para `localStorage`
- **Deploy:** Vercel

## Rodando localmente

1. Instale as dependências:
   ```
   npm install
   ```

2. Crie um arquivo `.env.local` na raiz com as credenciais do seu projeto Supabase:
   ```
   VITE_SUPABASE_URL="https://SEU-PROJETO.supabase.co"
   VITE_SUPABASE_ANON_KEY="SUA_CHAVE_ANON"
   ```

3. Rode o app:
   ```
   npm run dev
   ```

> O app funciona mesmo sem Supabase configurado (usa `localStorage` como fallback).

## Banco de dados (Supabase)

O schema está em `supabase/migrations/0001_init.sql`. Ele cria as tabelas `appointments` e `settings` com Row Level Security habilitado e políticas públicas de leitura/escrita (o app não usa autenticação).

## Deploy na Vercel

1. Configure as variáveis de ambiente no painel da Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

2. Deploy:
   ```
   vercel --prod
   ```

## Link do cliente

Compartilhe o link da loja com `?mode=cliente` (ou `?agendar=true`) para o cliente ver **apenas o formulário de agendamento**, sem acesso ao painel da loja.
