import { Component, computed, inject, viewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ExpenseStore } from '../../data/expense.store';
import { Expense, formatNaira, progressFor, sharesFor } from '../../domain/expense';
@Component({ standalone: true, imports: [RouterLink], template: `
<section class="page-wrap detail-page">
  @if (expense(); as item) {
    <div class="detail-title-row"><div><h1>{{item.title}}</h1><div class="detail-meta">Honey Drop · Split equally among {{item.members.length}} members</div></div><div class="detail-actions"><button class="button danger-outline" (click)="openDelete()">Delete split</button><a class="button secondary" [routerLink]="['/expenses', item.id, 'edit']">Edit split</a></div></div>
    <div class="detail-layout"><section class="member-shares-panel"><div class="members-heading"><h2>Member shares</h2><span class="member-count">{{item.members.length}} members</span></div>
      <div class="member-table"><div class="member-table-head"><span>Member</span><span>Share</span><span>Status</span></div>
        @for (member of shares(); track member.id; let i = $index) {<div class="member-table-row"><div class="member-cell"><span class="avatar-hex" [attr.data-tone]="i % 5">{{initials(member.name)}}</span><div><strong>{{member.name}}</strong></div></div><strong class="member-share">{{money(member.shareKobo)}}</strong><div><button class="status-chip" [class.is-paid]="member.status === 'paid'" (click)="toggle(item, member.id, member.status === 'paid' ? 'unpaid' : 'paid')"><span>{{member.status === 'paid' ? '✓' : '◷'}}</span>{{member.status === 'paid' ? 'Paid' : 'Pending'}}</button></div></div>}
      </div>
    </section><aside class="detail-aside"><div class="detail-summary"><span class="summary-label">COLLECTION PROGRESS</span><div class="summary-total">{{money(progress().collectedKobo)}}</div><div class="summary-progress"><span [style.width.%]="progress().percent"></span></div><div class="summary-progress-label"><span>of {{money(item.totalKobo)}} total</span><strong>{{progress().percent}}%</strong></div></div>
      <div class="split-details"><h2>Split details</h2><div><span>Split method</span><strong>Equal share</strong></div><div><span>Per member</span><strong>{{money(shares()[0]?.shareKobo ?? 0)}}</strong></div><div><span>Still pending</span><strong>{{money(progress().outstandingKobo)}}</strong></div></div>
      <div class="detail-footnote"><span>ⓘ</span><p>{{progress().paidCount}} of {{item.members.length}} members have paid their share.</p></div>
    </aside></div>
    <dialog #deleteDialog class="confirm-dialog delete-dialog"><div class="dialog-icon danger-icon">!</div><h2>Delete this expense?</h2><p><strong>{{item.title}}</strong> and all of its member payment statuses will be removed from this browser. This cannot be undone.</p><div class="dialog-actions"><button class="button secondary" (click)="deleteDialog.close()">Keep expense</button><button class="button danger" (click)="remove(item.id, deleteDialog)">Delete expense</button></div></dialog>
  } @else { <div class="missing-record"><div class="empty-mark">⌁</div><div class="eyebrow">RECORD NOT FOUND</div><h1>This expense isn’t here.</h1><p>It may have been deleted or the link may be out of date.</p><a routerLink="/" class="button primary">Back to dashboard</a></div> }
</section>
` })
export class ExpenseDetailComponent {
  private readonly route=inject(ActivatedRoute); private readonly router=inject(Router); readonly store=inject(ExpenseStore); private readonly id=this.route.snapshot.paramMap.get('id') ?? '';
  readonly expense = computed(() => this.store.expenses().find(e => e.id === this.id));
  readonly shares = computed(() => this.expense() ? sharesFor(this.expense()!) : []);
  readonly progress = computed(() => this.expense() ? progressFor(this.expense()!) : {collectedKobo:0,outstandingKobo:0,paidCount:0,percent:0});
  readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('deleteDialog');
  money=formatNaira; initials(name:string):string{return name.trim().split(/\s+/).map(n=>n[0]).join('').slice(0,2).toUpperCase();}
  openDelete():void{this.dialog()?.nativeElement.showModal();}
  toggle(expense:Expense, memberId:string, status:'paid'|'unpaid'):void{this.store.setStatus(expense.id,memberId,status);}
  remove(id:string, dialog:HTMLDialogElement):void{if(this.store.remove(id)){dialog.close();this.router.navigate(['/']);}}
}
