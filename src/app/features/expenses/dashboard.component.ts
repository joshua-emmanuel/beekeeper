import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ExpenseStore } from '../../data/expense.store';
import { Expense, formatNaira, progressFor, sharesFor } from '../../domain/expense';
@Component({ standalone: true, imports: [RouterLink], template: `
  <section class="page-wrap dashboard-page">
    <div class="page-topline"><div><h1>Hi, Funnito</h1><p class="page-lede">Let’s see what’s owed today.</p></div><a class="button primary desktop-add" routerLink="/expenses/new">＋ New Honey Drop</a></div>
    @if (!store.recovery()) {
      <section class="balance-overview" aria-label="Balance overview">
        <div class="balance-total"><span>You owe this month</span><strong>{{money(outstanding())}}</strong><div class="balance-progress"><i [style.width.%]="collectionPercent()"></i></div><small>{{money(collected())}} of {{money(total())}} collected across {{store.expenses().length}} {{store.expenses().length === 1 ? 'plan' : 'plans'}}</small></div>
        <div class="balance-members"><div class="mini-avatars">@for (name of activeMembers(); track name) { <span class="avatar-hex">{{initials(name)}}</span> } @empty { <span class="avatar-hex">BK</span> }</div><span>{{store.expenses().length}} active {{store.expenses().length === 1 ? 'plan' : 'plans'}}</span></div>
        <div class="honeycomb-art" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
      </section>
      <section class="quick-start"><h2>Start something new</h2><div class="shortcut-grid"><a class="shortcut-card" routerLink="/expenses/new"><span class="shortcut-icon">♧</span><span><strong>Honey Drop</strong><small>Split a quick, one-off cost.</small></span><b>→</b></a><a class="shortcut-card" href="#plans"><span class="shortcut-icon">♙</span><span><strong>My plans</strong><small>See how your shared costs are going.</small></span><b>→</b></a></div></section>
      @if (store.expenses().length) {
        <section class="dashboard-tools"><label class="search-box"><span>⌕</span><input type="search" placeholder="Search plans" aria-label="Search plans" [value]="query()" (input)="query.set($any($event.target).value)"></label><div class="filter-pills" aria-label="Filter by payment status"><button [class.selected]="filter() === 'All'" (click)="filter.set('All')">All</button><button [class.selected]="filter() === 'Outstanding'" (click)="filter.set('Outstanding')">Outstanding</button><button [class.selected]="filter() === 'Fully paid'" (click)="filter.set('Fully paid')">Fully paid</button></div></section>
      }
      @if (store.expenses().length && !visible().length) {
        <div class="empty-state compact"><h2>No matching plans</h2><p>Try another search or change your payment filter.</p><button class="text-button" (click)="clearFilters()">Clear filters</button></div>
      } @else {
        <section class="dashboard-panels" id="plans">
          <div class="dashboard-panel"><div class="panel-heading"><h2>My plans</h2><a routerLink="/" fragment="plans">View all</a></div>
            @if (visible().length) { <div class="plan-list">@for (expense of visible().slice(0, 3); track expense.id) { <a class="plan-row" [routerLink]="['/expenses', expense.id]"><span class="plan-icon">{{iconFor(expense.title)}}</span><span class="plan-info"><strong>{{expense.title}}</strong><small>Honey Drop · {{expense.members.length}} members</small></span><strong class="plan-amount">{{money(progress(expense).collectedKobo)}} / {{money(expense.totalKobo)}}</strong><span class="plan-progress"><i [style.width.%]="progress(expense).percent"></i></span></a> }</div> }
            @else { <div class="panel-empty"><span class="shortcut-icon">♧</span><p>Your shared plans will appear here.</p><a routerLink="/expenses/new">Create your first plan →</a><button class="text-button" (click)="store.loadSamples()">Explore with sample plans</button></div> }
          </div>
          <div class="dashboard-panel"><div class="panel-heading"><h2>Recent activity</h2></div>
            @if (recentMembers().length) { <div class="activity-list">@for (entry of recentMembers().slice(0, 5); track entry.key) { <a class="activity-row" [routerLink]="['/expenses', entry.expense.id]"><span class="activity-icon">{{iconFor(entry.expense.title)}}</span><span class="activity-info"><strong>{{entry.expense.title}}</strong><small>{{entry.member.name}} · {{money(entry.share)}}</small></span><span class="status-chip" [class.is-paid]="entry.member.status === 'paid'">{{entry.member.status === 'paid' ? '✓ Paid' : '◷ Pending'}}</span></a> }</div> }
            @else { <div class="panel-empty"><span class="shortcut-icon">◷</span><p>Payment updates will show up here.</p><span>Record a payment from a plan.</span></div> }
          </div>
        </section>
      }
    }
    <div class="manual-note"><span>ⓘ</span> Payments happen outside Bee Keeper. Status is recorded manually.</div>
  </section>
` })
export class DashboardComponent {
  readonly store = inject(ExpenseStore); readonly query = signal(''); readonly filter = signal('All');
  readonly visible = computed(() => this.store.expenses().slice().sort((a,b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id)).filter(e => e.title.toLocaleLowerCase().includes(this.query().trim().toLocaleLowerCase())).filter(e => this.filter() === 'All' || (this.filter() === 'Fully paid' ? progressFor(e).outstandingKobo === 0 : progressFor(e).outstandingKobo > 0)));
  readonly total = computed(() => this.store.expenses().reduce((sum, expense) => sum + expense.totalKobo, 0));
  readonly collected = computed(() => this.store.expenses().reduce((sum, expense) => sum + progressFor(expense).collectedKobo, 0));
  readonly outstanding = computed(() => this.total() - this.collected());
  readonly collectionPercent = computed(() => this.total() ? Math.round(this.collected() * 100 / this.total()) : 0);
  readonly activeMembers = computed(() => [...new Set(this.store.expenses().filter(e => progressFor(e).outstandingKobo > 0).flatMap(e => e.members.map(m => m.name)))].slice(0, 3));
  readonly recentMembers = computed(() => this.visible().flatMap(expense => sharesFor(expense).map(member => ({key: `${expense.id}-${member.id}`, expense, member, share: member.shareKobo}))));
  money = formatNaira; progress = progressFor; clearFilters(): void { this.query.set(''); this.filter.set('All'); }
  initials(name: string): string { return name.trim().split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase(); }
  iconFor(title: string): string { return /ride|drive|taxi/i.test(title) ? '↗' : /grocer|food|market/i.test(title) ? '◈' : /light|electric|power/i.test(title) ? 'ϟ' : '✳'; }
}
