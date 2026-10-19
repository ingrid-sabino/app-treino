# CLAUDE.md — app-treino

## O projeto

PWA de acompanhamento de treino (musculação + cardio + yoga), inspirado no Hevy, com Rotação automática, importação de Programas gerados por IA e evolução de força/corpo. A fonte da verdade é o PRD: `docs/prd/prd-app-treino.md`. Leia-o antes de qualquer tarefa de produto e use os termos do Glossário (§3) exatamente como estão (Sessão, Série, Template, Rotação, Próximo treino, Programa, Volume, Duração...).

## Idioma e voz

- Conversa, documentação, textos da interface e mensagens de commit: português do Brasil.
- Nomes de código (tabelas, variáveis, componentes): inglês.
- Ao se referir ao dono do projeto, Ingrid, use pronomes masculinos (ele/dele), como no PRD.

## Stack (PRD §7)

- React + Vite + TypeScript + Tailwind, `vite-plugin-pwa`
- Dados locais: Dexie (IndexedDB). Toda escrita durante a Sessão vai primeiro para o Dexie e sincroniza com o Supabase quando há rede (FR-8).
- Back-end: Supabase (Postgres + Auth magic link + Storage privado). Schema em `supabase/migrations/`.
- Validação: Zod (o schema do Programa também é usado nos Prompts-modelo).
- Gráficos: Recharts. Deploy: Vercel.
- Custo zero: não adicionar serviços pagos nem chamadas a APIs de IA no MVP.

## Regras de produto que não podem quebrar

- Duração da Sessão é calculada pelo horário de início salvo, nunca por um timer em memória (FR-25).
- Volume = soma de peso × reps das Séries feitas; Séries puladas não contam (FR-26).
- Próximo treino vem da última Sessão concluída da Rotação ativa (FR-1).
- Row Level Security em toda tabela nova. Dados de hormonização, Exames, medidas e Fotos de progresso nunca ficam acessíveis fora do próprio dono (PRD §8, FR-33).
- Sem contador de macros nem diário de alimentos (FR-28).

## Método: BMAD

O projeto segue o BMAD Method (v7, skills). Fluxo: `bmad-prd` (PRD já existe; use modo Update/Validate) → `bmad-ux` → `bmad-architecture` → `bmad-build` por história → `bmad-retrospective` no Dia 7. Veja `docs/kickoff-claude-code.md` para instalar.

## Roteiro do MVP

Dia 1 (19/10) feito em parte: PRD, este arquivo e o schema SQL. Pendente do Dia 1: instalar o BMAD e criar o projeto no Supabase. Depois, Dias 2 a 7 conforme o §6.3 do PRD. Marque o checklist do PRD conforme avançar.
