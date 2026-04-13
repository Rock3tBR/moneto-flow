

# Importar Fatura PDF - Plano de Implementação

## Resumo

Criar uma funcionalidade que permite ao usuario fazer upload de um PDF de fatura de cartao de credito, extrair automaticamente os dados (nome do cartao, limite, dia de fechamento/vencimento, e todas as transacoes) usando IA, e criar automaticamente o cartao e as transacoes no sistema.

## Estrutura do PDF (baseado na fatura Santander analisada)

O PDF contem:
- Nome do cartao: "SANTANDER SX MASTERCARD"
- Numero do cartao: 5201 XXXX XXXX 6915 (e um segundo: 5581 XXXX XXXX 0919)
- Limite: R$ 1.830,00
- Vencimento: dia 12
- Fechamento: dia 06
- Lista de despesas com data, descricao, parcela (ex: 03/06), valor
- Lista de parcelamentos com parcela atual/total
- Pagamentos de fatura anteriores

## Arquitetura

O processamento sera feito por uma **Edge Function** que recebe o texto extraido do PDF (extraido no frontend com `pdfjs-dist`) e usa a **Lovable AI Gateway** para interpretar os dados estruturadamente via JSON schema.

```text
Frontend (upload PDF)
    |
    v
pdfjs-dist (extrai texto do PDF no browser)
    |
    v
Edge Function "parse-invoice"
    |
    v
AI Gateway (extrai dados estruturados)
    |
    v
Retorna JSON com cartao + transacoes
    |
    v
Frontend exibe preview -> usuario confirma -> salva no Supabase
```

## Etapas de Implementacao

### 1. Criar Edge Function `parse-invoice`
- Recebe o texto bruto do PDF
- Envia para AI Gateway com schema estruturado pedindo: nome do cartao, ultimos 4 digitos, limite, dia fechamento, dia vencimento, e array de transacoes (data, descricao, valor, parcela atual, total parcelas, tipo)
- Retorna JSON estruturado

### 2. Instalar `pdfjs-dist` no frontend
- Usar para extrair texto do PDF no browser antes de enviar para a edge function

### 3. Criar componente `ImportInvoiceModal`
- Upload de arquivo PDF (drag & drop ou botao)
- Estado de loading enquanto processa
- Preview dos dados extraidos: cartao detectado e lista de transacoes
- Botao "Importar Tudo" que:
  - Cria o cartao se nao existir (pelo nome/ultimos digitos)
  - Cria todas as transacoes vinculadas ao cartao
- Permitir ao usuario revisar/editar antes de confirmar

### 4. Integrar na interface
- Adicionar botao "Importar Fatura" no Dashboard e/ou pagina de Transacoes
- Disponivel para plano **Plus+** (ja tem acesso a cartoes e faturas)

## Detalhes Tecnicos

**Edge Function** (`supabase/functions/parse-invoice/index.ts`):
- Valida JWT do usuario
- Recebe `{ text: string }` no body
- Chama AI Gateway com prompt + schema para extrair dados
- Retorna `{ card: { name, lastDigits, limit, closingDay, dueDay }, transactions: [{ date, description, amount, currentInstallment, totalInstallments }] }`

**Schema AI** pedira:
- `card_name`, `last_digits`, `limit_amount`, `closing_day`, `due_day`
- `transactions[]`: `date` (YYYY-MM-DD), `description`, `amount` (positivo), `current_installment`, `total_installments`

**Frontend** (`src/components/modals/ImportInvoiceModal.tsx`):
- Usa `pdfjs-dist` para extrair texto
- Chama `supabase.functions.invoke('parse-invoice', { body: { text } })`
- Mostra preview com card info + tabela de transacoes
- Ao confirmar, usa `addCreditCard()` + `addTransaction()` do FinanceContext

**Arquivos a criar/modificar**:
- `supabase/functions/parse-invoice/index.ts` (novo)
- `src/components/modals/ImportInvoiceModal.tsx` (novo)
- `src/pages/Dashboard.tsx` (adicionar botao de importar)
- `src/pages/TransactionsPage.tsx` (adicionar botao de importar)
- `package.json` (adicionar `pdfjs-dist`)

