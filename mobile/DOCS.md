# Priority List Mobile

App React Native com widget Android que lista despesas pendentes (vencidas + próximos 3 dias) de um orçamento familiar. Permite marcar como concluída, adicionar lançamentos, e navegar para o app principal — tudo diretamente do widget na home screen.

## Stack Tecnológico

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Framework | React Native | 0.84.1 |
| UI Library | React | 19.2.3 |
| Linguagem | TypeScript | 5.8.3 |
| Backend/DB | Supabase (PostgreSQL + Auth) | 2.99.1 |
| Widget | react-native-android-widget | 0.20.1 |
| Navegação | React Navigation (native-stack) | 7.14.5 |
| Storage Local | AsyncStorage | 3.0.1 |
| Deep Linking | Custom scheme `prioritylist://` | — |

## Endpoints / Queries Supabase

| Operação | Tabela | Query |
|----------|--------|-------|
| Listar despesas do widget | `expenses` | `SELECT * WHERE orcamento_id=? AND status≠'completed' AND due_date IS NOT NULL AND due_date <= hoje+3d ORDER BY due_date ASC` |
| Buscar despesa por ID | `expenses` | `SELECT * WHERE id=? SINGLE` |
| Adicionar lançamento | `expenses` | `UPDATE expense_entries, executed_amount WHERE id=?` |
| Concluir despesa | `expenses` | `UPDATE status='completed', completed_at=now WHERE id=?` |
| Criar próxima recorrência | `expenses` | `INSERT nova despesa com due_date calculado` |
| Buscar perfil | `profiles` | `SELECT * WHERE id=userId SINGLE` |
| Auth login | Supabase Auth | `signInWithPassword(email, password)` |
| Auth logout | Supabase Auth | `signOut()` |

## Modelo de Dados — Expense

```
id, user_id, orcamento_id, name, description, amount, executed_amount,
expense_entries[], currency (BRL|USD|PYG), category, custom_category,
type (recorrente|esporadico|imprevisto), priority, urgency,
status (pending|in_progress|completed), due_date, notes,
recurrence_frequency (weekly|monthly|yearly), cost_center,
created_by_name, completed_at, created_at, updated_at
```

## Fluxo do Widget

1. Android dispara evento (`WIDGET_ADDED` / `WIDGET_UPDATE` / `WIDGET_RESIZED` / `WIDGET_CLICK`)
2. `widgetTaskHandler` recebe o evento
3. `fetchWidgetData()` aguarda auth → busca sessão → query Supabase
4. `ExpensesWidget` renderiza até 5 despesas com checkbox, nome, valor, categoria, vencimento
5. Ações: `REFRESH`, `CONFIRM_START`/`YES`/`CANCEL`, `ADD_ENTRY`, `OPEN_APP`
