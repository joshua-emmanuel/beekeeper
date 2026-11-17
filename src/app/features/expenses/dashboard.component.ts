import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ExpenseStore } from '../../data/expense.store';
import { Expense, formatNaira, progressFor } from '../../domain/expense';
@Component({ standalone: true, imports: [RouterLink, DatePipe], template: `
  <section class="page-wrap">
    <div class="page-topline"><div><div class="eyebrow">YOUR HOUSEHOLD</div><h1>Expenses</h1><p class="page-lede">A clear view of the things you share.</p></div><a class="button primary desktop-add" routerLink="/expenses/new"><span>＋</span> New expense</a></div>
    @if (!store.recovery()) {
      @if (store.expenses().length) {
        <section class="dashboard-tools"><label class="search-box"><span>⌕</span><input type="search" placeholder="Search expenses" aria-label="Search expenses" [value]="query()" (input)="query.set($any($event.target).value)"></label><div class="filter-pills" aria-label="Filter by payment status"><button [class.selected]="filter() === 'All'" (click)="filter.set('All')">All</button><button [class.selected]="filter() === 'Outstanding'" (click)="filter.set('Outstanding')">Outstanding</button><button [class.selected]="filter() === 'Fully paid'" (click)="filter.set('Fully paid')">Fully paid</button></div></section>
        @if (visible().length) { <div class="expense-list">@for (expense of visible(); track expense.id) { <a class="expense-card" [routerLink]="['/expenses', expense.id]">
          <div class="expense-card-main"><div class="expense-icon">{{iconFor(expense.title)}}</div><div class="expense-title-wrap"><div class="expense-title">{{expense.title}}</div><div class="expense-subline">{{expense.members.length}} members <span>·</span> {{expense.createdAt | date:'d MMM yyyy'}}</div></div><div class="expense-total">{{money(expense.totalKobo)}}</div><div class="card-chevron">›</div></div>
          <div class="expense-card-progress"><div class="progress-label"><span>{{progress(expense).paidCount}} of {{expense.members.length}} paid</span><strong>{{progress(expense).percent}}%</strong></div><div class="progress-track"><span [style.width.%]="progress(expense).percent"></span></div></div>
        </a> }</div> } @else { <div class="empty-state compact"><div class="empty-mark">⌕</div><h2>No matching expenses</h2><p>Try another search or change your payment filter.</p><button class="text-button" (click)="clearFilters()">Clear filters</button></div> }
      } @else { <div class="welcome-card"><div class="welcome-copy"><div class="welcome-icon">✳</div><div class="eyebrow">A FRESH START</div><h2>Shared costs,<br>sorted simply.</h2><p>Keep track of who owes what. Add a shared expense, split it fairly, and record payments as they come in.</p><a class="button primary" routerLink="/expenses/new">＋&nbsp; Add your first expense</a><button class="sample-button" (click)="store.loadSamples()">Or explore with sample expenses <span>→</span></button></div><div class="welcome-art" aria-hidden="true"><div class="sun"></div><div class="art-card"><div class="mini-icon">✳</div><div class="mini-line"></div><div class="mini-line short"></div><div class="mini-progress"><i></i></div><span>3 of 5 paid</span></div><div class="floating-coin">₦</div><div class="flower flower-one">✳</div><div class="flower flower-two">✴</div><div class="hive">⬡</div></div></div> }
    }
    <div class="manual-note"><span>ⓘ</span> Payments happen outside Bee Keeper. Status is recorded manually.</div>
  </section>
` })
export class DashboardComponent {
  readonly store = inject(ExpenseStore); readonly query = signal(''); readonly filter = signal('All');
  readonly visible = computed(() => this.store.expenses().slice().sort((a,b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id)).filter(e => e.title.toLocaleLowerCase().includes(this.query().trim().toLocaleLowerCase())).filter(e => this.filter() === 'All' || (this.filter() === 'Fully paid' ? progressFor(e).outstandingKobo === 0 : progressFor(e).outstandingKobo > 0)));
  money = formatNaira; progress = progressFor; clearFilters(): void { this.query.set(''); this.filter.set('All'); }
  iconFor(title: string): string { return /ride|drive|taxi/i.test(title) ? '↗' : /grocer|food|market/i.test(title) ? '◈' : /light|electric|power/i.test(title) ? 'ϟ' : '✳'; }
}
