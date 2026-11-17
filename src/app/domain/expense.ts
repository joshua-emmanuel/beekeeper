export type PaymentStatus = 'unpaid' | 'paid';
export interface ExpenseMember { id: string; name: string; status: PaymentStatus }
export interface Expense { id: string; title: string; totalKobo: number; members: ExpenseMember[]; createdAt: string; updatedAt: string }
export interface MemberShare extends ExpenseMember { shareKobo: number }
export interface Progress { collectedKobo: number; outstandingKobo: number; paidCount: number; percent: number }

export const normalizeName = (name: string) => name.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
export function parseNaira(input: string): number | null {
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(input)) return null;
  const [whole, fraction = ''] = input.split('.');
  const kobo = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(kobo) && kobo >= 1 && kobo <= 100_000_000 ? kobo : null;
}
export function splitKobo(total: number, count: number): number[] {
  if (!Number.isInteger(total) || !Number.isInteger(count) || count < 1) return [];
  const base = Math.floor(total / count), remainder = total % count;
  return Array.from({ length: count }, (_, index) => base + (index < remainder ? 1 : 0));
}
export function formatNaira(kobo: number): string {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(kobo / 100);
}
export function sharesFor(expense: Expense): MemberShare[] {
  return expense.members.map((member, index) => ({ ...member, shareKobo: splitKobo(expense.totalKobo, expense.members.length)[index] }));
}
export function progressFor(expense: Expense): Progress {
  const collectedKobo = sharesFor(expense).filter(member => member.status === 'paid').reduce((sum, member) => sum + member.shareKobo, 0);
  const outstandingKobo = expense.totalKobo - collectedKobo;
  const rounded = Math.round(collectedKobo / expense.totalKobo * 1000) / 10;
  return { collectedKobo, outstandingKobo, paidCount: expense.members.filter(member => member.status === 'paid').length, percent: outstandingKobo > 0 ? Math.min(99.9, rounded) : 100 };
}
export function validateExpense(title: string, amount: string, names: string[]): string[] {
  const errors: string[] = [];
  if (!title.trim() || title.trim().length > 80) errors.push('Add a title between 1 and 80 characters.');
  if (names.length < 1 || names.length > 20) errors.push('Add between 1 and 20 members.');
  if (names.some(n => !n.trim() || n.trim().length > 40)) errors.push('Each member name must be between 1 and 40 characters.');
  const seen = new Set<string>();
  names.forEach(name => { const normalized = normalizeName(name); if (normalized && seen.has(normalized)) errors.push(`“${name.trim()}” duplicates another member.`); seen.add(normalized); });
  const total = parseNaira(amount);
  if (total === null) errors.push('Enter an amount from ₦0.01 to ₦1,000,000.00 with up to two decimal places.');
  else if (names.length && total < names.length) errors.push('Every member must receive at least ₦0.01.');
  return errors;
}
const isIsoUtc = (value: unknown): value is string => typeof value === 'string' &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
export function validSnapshot(value: unknown): value is { version: 1; expenses: Expense[] } {
  if (!value || typeof value !== 'object') return false;
  const snapshot = value as { version?: unknown; expenses?: unknown };
  if (snapshot.version !== 1 || !Array.isArray(snapshot.expenses)) return false;
  const ids = new Set<string>();
  return snapshot.expenses.every((item: unknown) => {
    if (!item || typeof item !== 'object') return false;
    const e = item as Expense;
    if (typeof e.id !== 'string' || !e.id || ids.has(e.id) || typeof e.title !== 'string' || !e.title.trim() || e.title.length > 80 || !Number.isInteger(e.totalKobo) || e.totalKobo < 1 || e.totalKobo > 100_000_000 || !Array.isArray(e.members) || e.members.length < 1 || e.members.length > 20 || e.totalKobo < e.members.length || !isIsoUtc(e.createdAt) || !isIsoUtc(e.updatedAt)) return false;
    ids.add(e.id); const memberIds = new Set<string>(), names = new Set<string>();
    return e.members.every(m => !!m && typeof m.id === 'string' && !!m.id && !memberIds.has(m.id) && typeof m.name === 'string' && !!m.name.trim() && m.name.trim().length <= 40 && !names.has(normalizeName(m.name)) && (m.status === 'paid' || m.status === 'unpaid') && (memberIds.add(m.id), names.add(normalizeName(m.name)), true));
  });
}
export function updatePaidStatuses(oldExpense: Expense, title: string, totalKobo: number, members: ExpenseMember[]): ExpenseMember[] {
  const oldShares = sharesFor(oldExpense); const byId = new Map(oldShares.map(member => [member.id, member]));
  const nextShares = splitKobo(totalKobo, members.length);
  return members.map((member, index) => {
    const old = byId.get(member.id);
    return { ...member, status: old?.status === 'paid' && normalizeName(old.name) === normalizeName(member.name) && old.shareKobo === nextShares[index] ? 'paid' : 'unpaid' };
  });
}
