# Priority List

Gestor de finanças pessoais multi-moeda: despesas por prioridade, receitas, orçamentos, empréstimos e cotações, com dashboard consolidado e acesso compartilhado por orçamento.

**Demo:** https://priority-list-psi.vercel.app

## O que faz

Organiza a vida financeira em torno de uma pergunta prática: *com o dinheiro que entra este mês, o que eu pago primeiro?* Cada despesa carrega uma prioridade e um status, e o dashboard mostra o que sobra depois de cada faixa.

### Despesas
- Cadastro com prioridade, centro de custo, categoria e vencimento
- Recorrência automática e lançamentos parcelados (*expense entries*)
- Adiamento de despesa com histórico preservado
- Importação em lote a partir de planilha
- Filtros por período, status, categoria e centro de custo

### Receitas
- Lançamento de entradas com moeda própria
- Resumo do total previsto e realizado no período

### Orçamentos
- Orçamento é o escopo compartilhado: várias pessoas lançam no mesmo caixa
- Seletor de orçamento no cabeçalho, com isolamento por RLS no banco
- Metas por categoria com barra de progresso contra o realizado

### Empréstimos
- Controle de empréstimos com movimentações de entrada e saída
- Consolidação por contraparte
- Visão mensal do fluxo de amortização
- Valores exibidos na moeda preferida e na moeda original

### Cotações
- Histórico de câmbio com gráfico de variação
- Importação automática diária via cron job
- Conversão aplicada em todos os módulos

### Pendências
- Lista de itens em aberto que ainda não viraram despesa
- Importação em lote e acompanhamento de status

### Dashboard
- Cards de totais do período
- Gráficos por categoria, centro de custo, prioridade, fluxo diário, maiores despesas e visão anual

### Acesso
- Login por e-mail/senha e OAuth via Supabase Auth
- Fluxo de aprovação: conta nova entra como pendente até liberação do admin
- Painel admin para gestão de usuários e orçamentos
- **Modo sensível:** oculta todos os valores da tela com um clique, protegido por senha

## Stack

| Camada | Tecnologia |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Actions) |
| UI | React 19, Tailwind CSS, shadcn/ui, Base UI |
| Gráficos | Recharts |
| Formulários | React Hook Form + Zod |
| Banco e Auth | Supabase (PostgreSQL com Row Level Security) |
| Deploy | Vercel, com cron job para importação de cotações |

## Rodando localmente

```bash
pnpm install
pnpm dev
```

Variáveis necessárias em `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

As migrações ficam em `supabase/migrations/` e são aplicadas em ordem.
