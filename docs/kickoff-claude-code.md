# Kickoff no Claude Code

Passo a passo para continuar o projeto no Claude Code a partir do que já está no repositório (PRD, CLAUDE.md e schema do banco).

## 1. Clonar e abrir

```bash
git clone https://github.com/ingrid-sabino/app-treino.git
cd app-treino
claude
```

O Claude Code lê o `CLAUDE.md` automaticamente ao abrir a pasta.

## 2. Pré-requisitos

- Node.js 20.12+ e npm
- [uv](https://docs.astral.sh/uv/) (o BMAD usa para setup e scripts): `curl -LsSf https://astral.sh/uv/install.sh | sh`
- Conta gratuita no [Supabase](https://supabase.com) e na [Vercel](https://vercel.com) (pode entrar com o GitHub)

## 3. Instalar o BMAD (v7)

Dentro do Claude Code:

```text
/plugin marketplace add bmad-code-org/bmad-plugins
```

Instale os plugins `bmad-method` e `bmad-core-tools` e depois peça: `bmad setup`.

Alternativa pelo terminal, na pasta do projeto: `npx skills add bmad-code-org/BMAD-METHOD --skill '*'` (escolha Claude Code quando perguntar).

Se a v7 (alpha) der problema, use a estável: `npx bmad-method install`.

Durante o setup, aponte a pasta de saída dos documentos para `docs/` e crie uma iniciativa chamada `mvp`.

## 4. Criar o banco no Supabase

> **Feito em 19/10 pelo Claude Code (API do Supabase):** projeto `app-treino` (ref `yfksusawrjnhpoaxbjen`, região us-east-2), migrations `0001` e `0002` aplicadas, código com 6 dígitos, *Site URL* `https://app-treino.vercel.app` e *Redirect URLs* `https://app-treino.vercel.app/**` e `https://app-treino-*.vercel.app/**`. Se o domínio da Vercel for outro, ajuste em **Authentication → URL Configuration**.
>
> **Feito depois:** SMTP do Resend e template com o código (passo 3 abaixo).

1. Crie um projeto novo (região São Paulo, `sa-east-1`).
2. Abra **SQL Editor** e rode o conteúdo de `supabase/migrations/0001_init.sql`.
3. Em **Authentication → Providers**, deixe só e-mail (magic link) ligado.
   No plano grátis, o Supabase só deixa editar os e-mails com SMTP próprio. Em **Authentication → Emails → SMTP Settings**, ligue o SMTP do [Resend](https://resend.com) (grátis): host `smtp.resend.com`, porta `465`, usuário `resend`, senha = API key do Resend, remetente `onboarding@resend.dev`, nome `Tönus`. O remetente de teste só entrega para o e-mail da conta no Resend; para outras pessoas, é preciso um domínio próprio.

   Depois, em **Authentication → Emails → Magic Link** (e também em **Confirm signup**, usado no primeiro login), troque o corpo do e-mail para incluir o código, que é o que loga o app instalado no iPhone:

   ```html
   <h2>Seu código do Tönus</h2>
   <p style="font-size:32px;letter-spacing:6px"><strong>{{ .Token }}</strong></p>
   <p>Ou, no navegador, <a href="{{ .ConfirmationURL }}">entre por este link</a>.</p>
   ```

   Em **Authentication → URL Configuration**, coloque a URL da Vercel em *Site URL* e em *Redirect URLs* (inclua `https://*.vercel.app/**` para os previews).
4. Copie a URL do projeto e a `anon key` para um `.env.local` (nunca commitar):

```bash
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxx
```

## 5. Primeiro prompt para colar no Claude Code

```text
Leia o CLAUDE.md e o PRD em docs/prd/prd-app-treino.md.

1. Rode bmad-prd em modo Validate sobre o PRD e me mostre só os problemas que bloqueiam o MVP.
2. Depois, execute o Dia 2 do roteiro (§6.3): esqueleto do PWA com React + Vite + TypeScript + Tailwind
   + vite-plugin-pwa, login por magic link no Supabase (variáveis do .env.local), Dexie configurado
   e navegação inferior com as abas Hoje / Treinar / Evolução / Perfil.
3. Garanta que roda com `npm run dev`, que o build passa e que o manifest permite instalar no iPhone.
4. Faça commits pequenos em português e marque o Dia 2 no checklist do PRD.

Antes de criar telas, me pergunte sobre identidade visual (pergunta em aberto no §10 do PRD).
```

## 6. Deploy

Na Vercel: **Add New → Project → importar `app-treino`**, framework Vite, e adicionar as mesmas duas variáveis de ambiente (em Production e Preview). A cada push na `main`, o app atualiza. No iPhone: abrir a URL no Safari → Compartilhar → **Adicionar à Tela de Início**.
