"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  ActionResult,
  Loan,
  LoanPayment,
  LoanFilters,
  LoanWithSummary,
  LoanMonthRow,
} from "@/lib/types";
import {
  loanSchema,
  loanMovementSchema,
  type LoanFormData,
  type LoanMovementFormData,
} from "@/lib/validations/loan";
import { addMonths, format } from "date-fns";
import { convertAmount, type RateMap } from "@/lib/currency";
import type { SupportedCurrency } from "@/lib/types";

// --- Interest calculation helpers ---

function parseDateParts(dateStr: string): { year: number; month: number } {
  const [year, month] = dateStr.split("-").map(Number);
  return { year, month: month - 1 }; // month 0-indexed for JS consistency
}

function calendarMonthsDiff(fromDate: string, to: Date): number {
  const { year: fromYear, month: fromMonth } = parseDateParts(fromDate);
  return (to.getFullYear() - fromYear) * 12 + (to.getMonth() - fromMonth);
}

function calendarMonthsDiffStr(fromDate: string, toDate: string): number {
  const from = parseDateParts(fromDate);
  const to = parseDateParts(toDate);
  return (to.year - from.year) * 12 + (to.month - from.month);
}

function calculateCurrentBalance(
  principal: number,
  interestRate: number,
  startDate: string,
  payments: LoanPayment[]
): number {
  const sortedPayments = [...payments].sort(
    (a, b) => new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime()
  );
  const lastPayment = sortedPayments[sortedPayments.length - 1];
  const baseBalance = lastPayment ? lastPayment.remaining_balance : principal;
  const baseDate = lastPayment ? lastPayment.payment_date : startDate;
  const months = calendarMonthsDiff(baseDate, new Date());
  if (months <= 0 || interestRate <= 0) return baseBalance;
  return baseBalance * Math.pow(1 + interestRate / 100, months);
}

function computeMonthlyBreakdown(
  loan: Loan,
  payments: LoanPayment[]
): LoanMonthRow[] {
  const rows: LoanMonthRow[] = [];
  const sortedPayments = [...payments].sort(
    (a, b) => new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime()
  );

  const { year: startYear, month: startMonthIdx } = parseDateParts(loan.start_date);
  const now = new Date();
  let balance = loan.principal;
  let currentMonth = new Date(startYear, startMonthIdx, 1);
  const endMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  while (currentMonth <= endMonth) {
    const monthStr = format(currentMonth, "yyyy-MM");
    const balanceBefore = balance;
    const isStartMonth = currentMonth.getFullYear() === startYear
      && currentMonth.getMonth() === startMonthIdx;
    const interest = (!isStartMonth && loan.interest_rate > 0)
      ? balance * (loan.interest_rate / 100)
      : 0;
    const monthMovements = sortedPayments.filter(
      (p) => p.payment_date.slice(0, 7) === monthStr
    );
    const payment = monthMovements
      .filter((m) => (m.type ?? "payment") === "payment")
      .reduce((sum, p) => sum + p.amount, 0);
    const addition = monthMovements
      .filter((m) => m.type === "addition")
      .reduce((sum, p) => sum + p.amount, 0);
    const balanceAfter = balanceBefore + interest - payment + addition;

    rows.push({
      month: monthStr,
      balanceBefore: Math.round(balanceBefore * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      payment: Math.round(payment * 100) / 100,
      addition: Math.round(addition * 100) / 100,
      balanceAfter: Math.round(balanceAfter * 100) / 100,
    });

    balance = balanceAfter;
    currentMonth = addMonths(currentMonth, 1);
  }

  return rows;
}

function calculateBalanceAtDate(
  principal: number,
  interestRate: number,
  startDate: string,
  payments: LoanPayment[],
  targetDate: string
): number {
  const sortedPayments = [...payments].sort(
    (a, b) => new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime()
  );
  const lastPayment = sortedPayments[sortedPayments.length - 1];
  const baseBalance = lastPayment ? lastPayment.remaining_balance : principal;
  const baseDate = lastPayment ? lastPayment.payment_date : startDate;
  const months = calendarMonthsDiffStr(baseDate, targetDate);
  if (months <= 0 || interestRate <= 0) return baseBalance;
  return baseBalance * Math.pow(1 + interestRate / 100, months);
}

// --- CRUD Actions ---

export async function createLoan(
  data: LoanFormData
): Promise<ActionResult<Loan>> {
  const parsed = loanSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Não autenticado" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const { data: loan, error } = await supabase
    .from("loans")
    .insert({
      ...parsed.data,
      user_id: user.id,
      description: parsed.data.description || null,
      due_date: parsed.data.due_date || null,
      notes: parsed.data.notes || null,
      created_by_name: profile?.full_name ?? "Desconhecido",
    })
    .select()
    .single();

  if (error) {
    console.error("createLoan error:", error.message, error.code);
    return { success: false, error: `Erro ao criar empréstimo: ${error.message}` };
  }

  revalidatePath("/loans");
  return { success: true, data: loan };
}

export async function updateLoan(
  id: string,
  data: LoanFormData
): Promise<ActionResult<Loan>> {
  const parsed = loanSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Não autenticado" };
  }

  const { data: loan, error } = await supabase
    .from("loans")
    .update({
      ...parsed.data,
      description: parsed.data.description || null,
      due_date: parsed.data.due_date || null,
      notes: parsed.data.notes || null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("updateLoan error:", error.message, error.code);
    return { success: false, error: `Erro ao atualizar empréstimo: ${error.message}` };
  }

  revalidatePath("/loans");
  revalidatePath(`/loans/${id}`);
  return { success: true, data: loan };
}

export async function deleteLoan(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Não autenticado" };
  }

  const { error } = await supabase
    .from("loans")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("deleteLoan error:", error.message, error.code);
    return { success: false, error: `Erro ao excluir empréstimo: ${error.message}` };
  }

  revalidatePath("/loans");
  return { success: true };
}

export async function getLoans(
  filters?: LoanFilters
): Promise<ActionResult<LoanWithSummary[]>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Não autenticado" };
  }

  let query = supabase
    .from("loans")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (filters?.direction) {
    query = query.eq("direction", filters.direction);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.search) {
    query = query.ilike("counterparty", `%${filters.search}%`);
  }

  const { data: loans, error } = await query;

  if (error) {
    console.error("getLoans error:", error.message, error.code);
    return { success: false, error: `Erro ao buscar empréstimos: ${error.message}` };
  }

  // Fetch all payments for these loans
  const loanIds = (loans ?? []).map((l) => l.id);
  let allPayments: LoanPayment[] = [];
  if (loanIds.length > 0) {
    const { data: payments } = await supabase
      .from("loan_payments")
      .select("*")
      .in("loan_id", loanIds)
      .order("payment_date", { ascending: true });
    allPayments = payments ?? [];
  }

  const loansWithSummary: LoanWithSummary[] = (loans ?? []).map((loan) => {
    const loanPayments = allPayments.filter((p) => p.loan_id === loan.id);
    const totalPaid = loanPayments
      .filter((p) => (p.type ?? "payment") === "payment")
      .reduce((sum, p) => sum + p.amount, 0);
    const currentBalance = loan.status === "paid_off"
      ? 0
      : calculateCurrentBalance(loan.principal, loan.interest_rate, loan.start_date, loanPayments);

    return {
      ...loan,
      total_paid: totalPaid,
      current_balance: Math.round(currentBalance * 100) / 100,
    };
  });

  return { success: true, data: loansWithSummary };
}

export async function getLoan(
  id: string
): Promise<ActionResult<{ loan: Loan; payments: LoanPayment[] }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Não autenticado" };
  }

  const [loanResult, paymentsResult] = await Promise.all([
    supabase.from("loans").select("*").eq("id", id).single(),
    supabase
      .from("loan_payments")
      .select("*")
      .eq("loan_id", id)
      .order("payment_date", { ascending: true }),
  ]);

  if (loanResult.error) {
    return { success: false, error: "Empréstimo não encontrado" };
  }

  return {
    success: true,
    data: {
      loan: loanResult.data,
      payments: paymentsResult.data ?? [],
    },
  };
}

export async function addLoanMovement(
  loanId: string,
  data: LoanMovementFormData
): Promise<ActionResult<LoanPayment>> {
  const parsed = loanMovementSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Não autenticado" };
  }

  // Get loan and existing payments
  const [loanResult, paymentsResult] = await Promise.all([
    supabase.from("loans").select("*").eq("id", loanId).single(),
    supabase
      .from("loan_payments")
      .select("*")
      .eq("loan_id", loanId)
      .order("payment_date", { ascending: true }),
  ]);

  if (loanResult.error || !loanResult.data) {
    return { success: false, error: "Empréstimo não encontrado" };
  }

  const loan = loanResult.data as Loan;
  const existingPayments = (paymentsResult.data ?? []) as LoanPayment[];

  // Calculate balance at movement date with interest
  const balanceAtDate = calculateBalanceAtDate(
    loan.principal,
    loan.interest_rate,
    loan.start_date,
    existingPayments,
    parsed.data.payment_date
  );

  const movementType = parsed.data.type ?? "payment";

  const remainingBalance = movementType === "payment"
    ? Math.round((balanceAtDate - parsed.data.amount) * 100) / 100
    : Math.round((balanceAtDate + parsed.data.amount) * 100) / 100;

  const { data: payment, error } = await supabase
    .from("loan_payments")
    .insert({
      loan_id: loanId,
      amount: parsed.data.amount,
      remaining_balance: movementType === "payment" ? Math.max(0, remainingBalance) : remainingBalance,
      payment_date: parsed.data.payment_date,
      type: movementType,
      notes: parsed.data.notes || null,
    })
    .select()
    .single();

  if (error) {
    console.error("addLoanMovement error:", error.message, error.code);
    return { success: false, error: `Erro ao registrar movimentação: ${error.message}` };
  }

  // Auto mark as paid_off if payment and remaining balance <= 0
  if (movementType === "payment" && remainingBalance <= 0) {
    await supabase
      .from("loans")
      .update({ status: "paid_off" })
      .eq("id", loanId);
  }

  // Reactivate loan if it was paid_off and an addition comes in
  if (movementType === "addition" && loan.status === "paid_off") {
    await supabase
      .from("loans")
      .update({ status: "active" })
      .eq("id", loanId);
  }

  revalidatePath("/loans");
  revalidatePath(`/loans/${loanId}`);
  return { success: true, data: payment };
}

export async function deleteLoanMovement(
  paymentId: string,
  loanId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Não autenticado" };
  }

  const { error } = await supabase
    .from("loan_payments")
    .delete()
    .eq("id", paymentId);

  if (error) {
    console.error("deleteLoanMovement error:", error.message, error.code);
    return { success: false, error: `Erro ao excluir movimentação: ${error.message}` };
  }

  // Recalculate status: check if loan should be reactivated
  const { data: remainingPayments } = await supabase
    .from("loan_payments")
    .select("*")
    .eq("loan_id", loanId)
    .order("payment_date", { ascending: true });

  const { data: loan } = await supabase
    .from("loans")
    .select("*")
    .eq("id", loanId)
    .single();

  if (loan) {
    const payments = (remainingPayments ?? []) as LoanPayment[];
    const currentBalance = calculateCurrentBalance(
      loan.principal,
      loan.interest_rate,
      loan.start_date,
      payments
    );

    if (currentBalance > 0.01 && loan.status === "paid_off") {
      await supabase
        .from("loans")
        .update({ status: "active" })
        .eq("id", loanId);
    }
  }

  revalidatePath("/loans");
  revalidatePath(`/loans/${loanId}`);
  return { success: true };
}

export async function getLoanMovements(
  loanId: string
): Promise<ActionResult<LoanPayment[]>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Não autenticado" };
  }

  const { data, error } = await supabase
    .from("loan_payments")
    .select("*")
    .eq("loan_id", loanId)
    .order("payment_date", { ascending: true });

  if (error) {
    return { success: false, error: `Erro ao buscar movimentações: ${error.message}` };
  }

  return { success: true, data: data ?? [] };
}

export interface LoansSummary {
  totalGiven: number;
  totalReceived: number;
  totalToReceive: number;
  totalOwed: number;
  totalPaidByMe: number;
  totalReceivedFromOthers: number;
}

export async function getLoansSummary(
  rates?: RateMap,
  preferredCurrency?: SupportedCurrency
): Promise<ActionResult<LoansSummary>> {
  const result = await getLoans();
  if (!result.success || !result.data) {
    return { success: false, error: result.error };
  }

  const loans = result.data;
  const summary: LoansSummary = {
    totalGiven: 0,
    totalReceived: 0,
    totalToReceive: 0,
    totalOwed: 0,
    totalPaidByMe: 0,
    totalReceivedFromOthers: 0,
  };

  const convert = (amount: number, loanCurrency: string) =>
    rates && preferredCurrency
      ? convertAmount(amount, loanCurrency as SupportedCurrency, preferredCurrency, rates)
      : amount;

  for (const loan of loans) {
    const cur = loan.currency ?? "BRL";
    if (loan.direction === "given") {
      summary.totalGiven += convert(loan.principal, cur);
      summary.totalToReceive += convert(loan.current_balance, cur);
      summary.totalReceivedFromOthers += convert(loan.total_paid, cur);
    } else {
      summary.totalReceived += convert(loan.principal, cur);
      summary.totalOwed += convert(loan.current_balance, cur);
      summary.totalPaidByMe += convert(loan.total_paid, cur);
    }
  }

  return { success: true, data: summary };
}

export async function getLoanMonthlyBreakdown(
  loanId: string
): Promise<ActionResult<LoanMonthRow[]>> {
  const result = await getLoan(loanId);
  if (!result.success || !result.data) {
    return { success: false, error: result.error };
  }

  const { loan, payments } = result.data;
  const rows = computeMonthlyBreakdown(loan, payments);

  return { success: true, data: rows };
}

export interface CounterpartyGroup {
  counterparty: string;
  direction: "given" | "received";
  loans: (LoanWithSummary & { monthlyBreakdown: LoanMonthRow[] })[];
  totalPrincipal: number;
  totalPaid: number;
  totalBalance: number;
}

export async function getLoansConsolidation(
  rates?: RateMap,
  preferredCurrency?: SupportedCurrency
): Promise<ActionResult<CounterpartyGroup[]>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Não autenticado" };
  }

  const { data: loans, error } = await supabase
    .from("loans")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, error: `Erro ao buscar empréstimos: ${error.message}` };
  }

  const loanIds = (loans ?? []).map((l) => l.id);
  let allPayments: LoanPayment[] = [];
  if (loanIds.length > 0) {
    const { data: payments } = await supabase
      .from("loan_payments")
      .select("*")
      .in("loan_id", loanIds)
      .order("payment_date", { ascending: true });
    allPayments = payments ?? [];
  }

  // Group by counterparty + direction
  const groupMap = new Map<string, CounterpartyGroup>();

  for (const loan of loans ?? []) {
    const key = `${loan.counterparty}::${loan.direction}`;
    const loanPayments = allPayments.filter((p) => p.loan_id === loan.id);
    const totalPaid = loanPayments
      .filter((p) => (p.type ?? "payment") === "payment")
      .reduce((sum, p) => sum + p.amount, 0);
    const currentBalance = loan.status === "paid_off"
      ? 0
      : calculateCurrentBalance(loan.principal, loan.interest_rate, loan.start_date, loanPayments);
    const monthlyBreakdown = computeMonthlyBreakdown(loan as Loan, loanPayments);

    const loanWithSummary = {
      ...loan,
      total_paid: totalPaid,
      current_balance: Math.round(currentBalance * 100) / 100,
      monthlyBreakdown,
    };

    if (!groupMap.has(key)) {
      groupMap.set(key, {
        counterparty: loan.counterparty,
        direction: loan.direction,
        loans: [],
        totalPrincipal: 0,
        totalPaid: 0,
        totalBalance: 0,
      });
    }

    const group = groupMap.get(key)!;
    group.loans.push(loanWithSummary);
    const cur = (loan.currency ?? "BRL") as SupportedCurrency;
    const convertC = (amount: number) =>
      rates && preferredCurrency
        ? convertAmount(amount, cur, preferredCurrency, rates)
        : amount;
    group.totalPrincipal += convertC(loan.principal);
    group.totalPaid += convertC(totalPaid);
    group.totalBalance += convertC(Math.round(currentBalance * 100) / 100);
  }

  const groups = Array.from(groupMap.values()).sort((a, b) =>
    a.counterparty.localeCompare(b.counterparty)
  );

  return { success: true, data: groups };
}
