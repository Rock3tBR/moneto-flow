/**
 * Calculates the used credit limit for a card in a given reference month.
 * 
 * Logic: The FULL original purchase amount (amount × installments) blocks the limit
 * until ALL installments have been invoiced. Once the last installment's invoice month
 * has passed, the purchase no longer blocks the limit.
 * 
 * Only considers the first installment row (current_installment === 1) or single purchases
 * to avoid double-counting.
 */

type Transaction = {
  card_id: string | null;
  type: string;
  date: string;
  amount: number;
  installments: number | null;
  current_installment: number | null;
};

type RecurringExpense = {
  active: boolean;
  card_id: string | null;
  amount: number;
  created_at: string | null;
};

function getInvoiceAbsMonth(txDate: Date, closingDay: number): number {
  const year = txDate.getFullYear();
  const month = txDate.getMonth();
  // On or after closing day → next month's invoice
  if (txDate.getDate() >= closingDay) {
    return (month === 11 ? year + 1 : year) * 12 + ((month + 1) % 12);
  }
  return year * 12 + month;
}

export function calculateCardUsedLimit(
  card: { id: string; closing_day: number },
  transactions: Transaction[],
  recurringExpenses: RecurringExpense[],
  refMonth: number,
  refYear: number
): number {
  const refAbsMonth = refYear * 12 + refMonth;

  const cardUsed = transactions
    .filter((t) =>
      t.card_id === card.id &&
      t.type === 'EXPENSE' &&
      (t.current_installment === 1 || !t.installments || t.installments <= 1)
    )
    .reduce((sum, t) => {
      const [y, m, d] = t.date.split('-').map(Number);
      const txDate = new Date(y, m - 1, d);
      const firstInvoiceAbs = getInvoiceAbsMonth(txDate, card.closing_day);
      const totalInstallments = t.installments || 1;
      const lastInvoiceAbs = firstInvoiceAbs + totalInstallments - 1;

      // Purchase still blocks limit if last installment is in current or future month
      if (lastInvoiceAbs >= refAbsMonth) {
        return sum + Number(t.amount) * totalInstallments;
      }
      return sum;
    }, 0);

  const recurringTotal = recurringExpenses
    .filter((r) => r.active && r.card_id === card.id)
    .filter((r) => {
      if (!r.created_at) return true;
      const createdDate = new Date(r.created_at);
      const createdAbsMonth = createdDate.getFullYear() * 12 + createdDate.getMonth();
      return refAbsMonth >= createdAbsMonth;
    })
    .reduce((s, r) => s + Number(r.amount), 0);

  return cardUsed + recurringTotal;
}

/**
 * Calculate used limit for ALL cards combined.
 */
export function calculateTotalUsedLimit(
  creditCards: Array<{ id: string; closing_day: number }>,
  transactions: Transaction[],
  recurringExpenses: RecurringExpense[],
  refMonth: number,
  refYear: number
): number {
  return creditCards.reduce(
    (total, card) => total + calculateCardUsedLimit(card, transactions, recurringExpenses, refMonth, refYear),
    0
  );
}
