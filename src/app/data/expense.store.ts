import { Injectable, signal } from '@angular/core';
import { Expense, ExpenseMember, validSnapshot } from '../domain/expense';

const KEY = 'bee-keeper:expenses:v1';
@Injectable({ providedIn: 'root' })
export class ExpenseStore {
  readonly expenses = signal<Expense[]>([]);
  readonly recovery = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  constructor() { this.load(); }
  private load(): void {
    try {
      const value = localStorage.getItem(KEY);
      if (value === null) return;
      let parsed: unknown;
      try { parsed = JSON.parse(value); } catch { this.recovery.set('Saved data is unreadable JSON. Retry loading or reset Bee Keeper data.'); return; }
      if (!validSnapshot(parsed)) { this.recovery.set('Saved data is invalid or uses an unsupported version. Retry loading or reset Bee Keeper data.'); return; }
      this.expenses.set(parsed.expenses);
    } catch { this.recovery.set('Browser storage could not be read. Check your browser settings, then retry.'); }
  }
  retry(): void { this.recovery.set(null); this.expenses.set([]); this.load(); }
  reset(): boolean {
    try { localStorage.removeItem(KEY); this.expenses.set([]); this.recovery.set(null); this.notice.set('Bee Keeper data reset.'); return true; }
    catch { this.recovery.set('Reset failed. Browser storage is unavailable; saved data has been left untouched.'); return false; }
  }
  private commit(next: Expense[]): boolean {
    try { localStorage.setItem(KEY, JSON.stringify({ version: 1, expenses: next })); this.expenses.set(next); this.recovery.set(null); this.notice.set('Changes saved in this browser.'); return true; }
    catch { this.notice.set('Could not save. Check browser storage space or permissions, then try again.'); return false; }
  }
  create(expense: Expense): boolean { return this.commit([expense, ...this.expenses()]); }
  update(expense: Expense): boolean { return this.commit(this.expenses().map(item => item.id === expense.id ? expense : item)); }
  remove(id: string): boolean { return this.commit(this.expenses().filter(item => item.id !== id)); }
  setStatus(id: string, memberId: string, status: 'paid' | 'unpaid'): boolean {
    const expense = this.expenses().find(item => item.id === id); if (!expense) return false;
    if (expense.members.find(m => m.id === memberId)?.status === status) return true;
    return this.update({ ...expense, members: expense.members.map((m: ExpenseMember) => m.id === memberId ? { ...m, status } : m), updatedAt: new Date().toISOString() });
  }
  loadSamples(): boolean {
    if (this.expenses().length || this.recovery()) return false;
    const now = new Date().toISOString();
    const samples: Expense[] = [
      { id: crypto.randomUUID(), title: 'In-Drive', totalKobo: 2_500_000, members: ['Amara','Tobi','Nneka','Chidi','Zara'].map((name, i) => ({ id: crypto.randomUUID(), name, status: i < 3 ? 'paid' : 'unpaid' })), createdAt: now, updatedAt: now },
      { id: crypto.randomUUID(), title: 'Saturday groceries', totalKobo: 18_400_00, members: ['Maya','Femi','Ife'].map(name => ({ id: crypto.randomUUID(), name, status: 'unpaid' })), createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: now },
      { id: crypto.randomUUID(), title: 'Water refill', totalKobo: 6_000_00, members: ['Kemi','David'].map(name => ({ id: crypto.randomUUID(), name, status: 'paid' })), createdAt: new Date(Date.now() - 172800000).toISOString(), updatedAt: now }
    ];
    return this.commit(samples);
  }
}
