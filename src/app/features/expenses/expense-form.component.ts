import { Component, inject } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ExpenseStore } from '../../data/expense.store';
import { Expense, ExpenseMember, formatNaira, normalizeName, parseNaira, splitKobo, updatePaidStatuses, validateExpense } from '../../domain/expense';

@Component({ standalone: true, imports: [ReactiveFormsModule, RouterLink], template: `
<section class="page-wrap form-page">
  <a class="back-link" routerLink="/">←&nbsp; All expenses</a>
  <div class="form-heading"><div><div class="eyebrow">{{existing ? 'UPDATE THE RECORD' : 'ADD A SHARED COST'}}</div><h1>{{existing ? 'Edit expense' : 'New expense'}}</h1><p class="page-lede">{{existing ? 'Make changes to this shared expense.' : 'A few details, then everyone knows their share.'}}</p></div></div>
  @if (!existing && store.expenses().length === 0) { <div class="demo-hint"><span>✳</span> Tip: You can use fictional names. Members don’t need accounts.</div> }
  <form [formGroup]="form" (ngSubmit)="save()" novalidate>
    <div class="form-layout"><div class="form-column">
      <section class="form-section"><div class="section-number">01</div><div class="section-content"><h2>Expense details</h2><p>What was the shared cost?</p><label class="field-label" for="title">Expense name</label><input id="title" class="text-input" formControlName="title" placeholder="e.g. In-Drive to campus" maxlength="80" [attr.aria-invalid]="showTitleError" [attr.aria-describedby]="showTitleError ? 'title-error' : null" (blur)="touched.add('title')"><div class="field-meta"><span>Keep it short and clear</span><span>{{form.controls.title.value.length}}/80</span></div>@if (showTitleError) { <div class="field-error" id="title-error">{{titleError}}</div> }
        <label class="field-label amount-label" for="amount">Total amount</label><div class="amount-input"><span>₦</span><input id="amount" inputmode="decimal" autocomplete="off" formControlName="amount" placeholder="0.00" [attr.aria-invalid]="showAmountError" [attr.aria-describedby]="showAmountError ? 'amount-error' : null" (blur)="touched.add('amount')"></div><div class="field-meta"><span>Up to ₦1,000,000</span><span>NGN</span></div>@if (showAmountError) { <div class="field-error" id="amount-error">{{amountError}}</div> }
      </div></section>
      <section class="form-section members-section"><div class="section-number">02</div><div class="section-content"><div class="section-title-row"><div><h2>Who’s sharing?</h2><p>Add each person splitting the cost.</p></div><span class="member-count">{{members.length}} / 20</span></div>
        <div formArrayName="members" class="member-inputs">@for (control of members.controls; track $index; let i = $index) { <div class="member-input-row"><span class="member-row-number">{{i + 1}}</span><input class="text-input" [formControlName]="i" [attr.aria-label]="'Member ' + (i + 1) + ' name'" [placeholder]="'Member ' + (i + 1)" (blur)="touched.add('member-' + i)"><button type="button" class="remove-member" [disabled]="members.length <= 1" (click)="removeMember(i)" [attr.aria-label]="'Remove member ' + (i + 1)">×</button>@if (duplicates.has(i)) {<small class="duplicate-note">This name is already on the list</small>}</div> }</div>
        @if (members.length < 20) { <button type="button" class="add-member" (click)="addMember()"><span>＋</span> Add another person</button> }
        @if (showMemberError) { <div class="field-error">{{memberError}}</div> }
      </div></section>
      @if (affected().length) { <div class="reset-warning" role="status"><span>↻</span><div><strong>Some paid statuses will reset</strong><p>{{affected().length}} previously paid {{affected().length === 1 ? 'share will' : 'shares will'}} become unpaid because the amount or member share changed.</p><ul>@for (member of affected(); track member.id) {<li>{{member.name}}</li>}</ul></div></div> }
      <div class="form-actions"><a class="button secondary" [routerLink]="existing ? ['/expenses', existing.id] : ['/']">Cancel</a><button class="button primary" type="submit" [disabled]="saving">{{saving ? 'Saving…' : (existing ? 'Save changes' : 'Save expense')}} <span>→</span></button></div>
    </div>
    <aside class="preview-panel"><div class="preview-kicker"><span>✳</span> SPLIT PREVIEW</div><h2>Everyone’s share</h2><p class="preview-caption">Equal split, with any extra kobo shared fairly.</p>
      @if (validInput) { <div class="preview-total"><span>Total</span><strong>{{money(previewTotal()!)}}</strong></div><div class="preview-divider"></div><div class="preview-list">@for (share of previewShares(); track share.index) {<div class="preview-person"><span class="avatar-hex" [attr.data-tone]="share.index % 5">{{initials(share.name)}}</span><span class="preview-person-name">{{share.name}}</span><strong>{{money(share.kobo)}}</strong></div>}</div><div class="preview-foot"><span>✳</span> {{members.length}} {{members.length === 1 ? 'person' : 'people'}} · split evenly</div> }
      @else { <div class="preview-empty"><div class="preview-empty-icon">⌁</div><strong>Your split will appear here</strong><span>Enter an amount and add at least one member to see the breakdown.</span></div> }
    </aside></div>
  </form><div class="manual-note"><span>ⓘ</span> Bee Keeper keeps the record. Payments happen directly between you.</div>
</section>
` })
export class ExpenseFormComponent {
  private readonly fb = inject(FormBuilder).nonNullable; readonly store = inject(ExpenseStore); private readonly router = inject(Router); private readonly route = inject(ActivatedRoute);
  readonly existing?: Expense; readonly form = this.fb.group({ title: [''], amount: [''], members: this.fb.array([this.fb.control('')]) });
  readonly touched = new Set<string>(); saving = false; private memberIds: string[] = [];
  constructor() { const id = this.route.snapshot.paramMap.get('id'); this.existing = id ? this.store.expenses().find(e => e.id === id) : undefined;
    if (id && !this.existing) this.router.navigate(['/']);
    if (id && this.existing) { this.form.controls.title.setValue(this.existing.title); this.form.controls.amount.setValue((this.existing.totalKobo / 100).toFixed(2)); this.form.setControl('members', this.fb.array(this.existing.members.map(m => this.fb.control(m.name)))); this.memberIds = this.existing.members.map(m => m.id); }
  }
  get members(): FormArray { return this.form.controls.members; }
  private get memberNames(): string[] { return this.members.controls.map(c => c.value); }
  get validInput(): boolean { return validateExpense(this.form.controls.title.value, this.form.controls.amount.value, this.memberNames).length === 0; }
  previewTotal(): number | null { return parseNaira(this.form.controls.amount.value); }
  previewShares(): {index:number;name:string;kobo:number}[] { const total = this.previewTotal(); return total === null ? [] : splitKobo(total, this.members.length).map((kobo,index) => ({ index, name: this.memberNames[index].trim(), kobo })); }
  money = formatNaira; initials(name: string): string { return name.trim().split(/\s+/).map(x => x[0]).join('').slice(0,2).toUpperCase(); }
  get duplicates(): Set<number> { const seen = new Map<string, number>(), result = new Set<number>(); this.memberNames.forEach((name, i) => { const n = normalizeName(name); if (n && seen.has(n)) { result.add(i); result.add(seen.get(n)!); } else if (n) seen.set(n, i); }); return result; }
  get showTitleError(): boolean { const title=this.form.controls.title.value.trim(); return (this.touched.has('title') || this.saving) && (!title || title.length > 80); }
  get titleError(): string { const title=this.form.controls.title.value.trim(); return !title ? 'Add an expense name.' : title.length > 80 ? 'Keep the name to 80 characters or fewer.' : ''; }
  get showAmountError(): boolean { return this.touched.has('amount') || this.saving ? parseNaira(this.form.controls.amount.value) === null || (this.previewTotal() !== null && this.previewTotal()! < this.members.length) : false; }
  get amountError(): string { return this.previewTotal() !== null && this.previewTotal()! < this.members.length ? 'Every member must receive at least ₦0.01.' : 'Enter an amount up to ₦1,000,000 with no more than two decimal places.'; }
  get showMemberError(): boolean { return this.saving && (this.members.length < 1 || this.members.length > 20 || this.memberNames.some(n => !n.trim() || n.trim().length > 40) || this.duplicates.size > 0); }
  get memberError(): string { if (this.duplicates.size) return 'Member names must be unique, ignoring case and extra spaces.'; if (this.members.length > 20) return 'You can add up to 20 members.'; return 'Enter a name from 1 to 40 characters for each person.'; }
  addMember(): void { if (this.members.length < 20) { this.members.push(this.fb.control('')); this.memberIds.push(crypto.randomUUID()); } }
  removeMember(index: number): void { if (this.members.length > 1) { this.members.removeAt(index); this.memberIds.splice(index, 1); this.touched.clear(); } }
  affected(): ExpenseMember[] { if (!this.existing || !this.validInput) return []; const total = parseNaira(this.form.controls.amount.value)!; const next = this.memberNames.map((name,i) => ({ id: this.memberIds[i] ?? crypto.randomUUID(), name: name.trim(), status: 'unpaid' as const })); const statuses = updatePaidStatuses(this.existing, this.form.controls.title.value, total, next); return this.existing.members.filter(m => m.status === 'paid' && statuses.find(n => n.id === m.id)?.status !== 'paid'); }
  save(): void {
    this.saving = true;
    const title = this.form.controls.title.value.trim(), amountText = this.form.controls.amount.value, names = this.memberNames.map(n => n.trim());
    const errors = validateExpense(title, amountText, names);
    if (errors.length) { if (!title || title.length > 80) { this.touched.add('title'); document.getElementById('title')?.focus(); } else if (parseNaira(amountText) === null || (parseNaira(amountText) ?? 0) < names.length) { this.touched.add('amount'); document.getElementById('amount')?.focus(); } else document.querySelector<HTMLInputElement>('.member-input-row input')?.focus(); return; }
    const now = new Date().toISOString(), totalKobo = parseNaira(amountText)!;
    let saved: boolean;
    if (this.existing) {
      const members = names.map((name, i) => ({ id: this.memberIds[i] ?? crypto.randomUUID(), name, status: 'unpaid' as const }));
      const preserved = updatePaidStatuses(this.existing, title, totalKobo, members);
      saved = this.store.update({...this.existing, title, totalKobo, members: preserved, updatedAt: now});
    } else {
      const expense: Expense = { id: crypto.randomUUID(), title, totalKobo, members: names.map(name => ({ id: crypto.randomUUID(), name, status: 'unpaid' })), createdAt: now, updatedAt: now };
      saved = this.store.create(expense);
      if (saved) { this.router.navigate(['/expenses', expense.id]); return; }
    }
    if (saved && this.existing) this.router.navigate(['/expenses', this.existing.id]); else this.saving = false;
  }
}
