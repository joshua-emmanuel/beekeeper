import { Component, computed, inject, viewChild, ElementRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ExpenseStore } from '../../data/expense.store';
import { Expense, formatNaira, progressFor, sharesFor } from '../../domain/expense';
@Component({ standalone: true, imports: [RouterLink, DatePipe], template: `
<section class="page-wrap detail-page">
  @if (expense(); as item) { <a class="back-link" routerLink="/">←&nbsp; All expenses</a>
    <div class="detail-title-row"><div><div class="eyebrow">EXPENSE DETAILS</div><h1>{{item.title}}</h1><div class="detail-meta">Added {{item.createdAt | date:'d MMMM yyyy'}} <span>·</span> {{item.members.length}} members</div></div><div class="detail-actions"><a class="button secondary" [routerLink]="['/expenses', item.id, 'edit']">✎ <span class="action-label">Edit</span></a><button class="button secondary delete-button" (click)="openDelete()">⌫ <span class="action-label">Delete</span></button></div></div>
    <div class="detail-summary"><div class="summary-head"><div><span class="summary-label">TOTAL EXPENSE</span><div class="summary-total">{{money(item.totalKobo)}}</div></div><div class="summary-stamp">✳</div></div><div class="summary-stats"><div><span>Collected</span><strong>{{money(progress().collectedKobo)}}</strong></div><div><span>Still outstanding</span><strong>{{money(progress().outstandingKobo)}}</strong></div></div><div class="summary-progress-label"><span>{{progress().paidCount}} of {{item.members.length}} members paid</span><strong>{{progress().percent}}%</strong></div><div class="summary-progress"><span [style.width.%]="progress().percent"></span></div></div>
    <div class="members-heading"><div><div class="eyebrow">THE GROUP</div><h2>Member shares <span class="heading-count">{{item.members.length}}</span></h2><p>Record payments as they happen outside the app.</p></div><div class="status-legend"><span class="legend-paid">● Paid</span><span class="legend-unpaid">● Unpaid</span></div></div>
    <div class="member-table"><div class="member-table-head"><span>MEMBER</span><span>SHARE</span><span>STATUS</span><span>ACTION</span></div>
      @for (member of shares(); track member.id; let i = $index) {<div class="member-table-row"><div class="member-cell"><span class="avatar-hex" [attr.data-tone]="i % 5">{{initials(member.name)}}</span><div><strong>{{member.name}}</strong><small>Member {{i + 1}}</small></div></div><strong class="member-share">{{money(member.shareKobo)}}</strong><div><span class="status-chip" [class.is-paid]="member.status === 'paid'"><span>{{member.status === 'paid' ? '✓' : '○'}}</span>{{member.status === 'paid' ? 'Paid' : 'Unpaid'}}</span></div><div><button class="status-toggle" [class.mark-unpaid]="member.status === 'paid'" (click)="toggle(item, member.id, member.status === 'paid' ? 'unpaid' : 'paid')">{{member.status === 'paid' ? 'Mark unpaid' : 'Mark paid'}} <span>→</span></button></div></div>}
    </div>
    <div class="detail-footnote"><span>ⓘ</span><p>Payment statuses are recorded manually. Bee Keeper doesn’t move or verify money.</p></div>
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
