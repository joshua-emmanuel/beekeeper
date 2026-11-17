import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ExpenseStore } from './data/expense.store';
@Component({ selector: 'app-root', standalone: true, imports: [RouterOutlet, RouterLink, RouterLinkActive], template: `
  <div class="app-frame">
    <aside class="sidebar">
      <div class="sidebar-top"><a class="brand" routerLink="/" aria-label="Bee Keeper home"><span class="brand-mark">♧</span><span>Bee Keeper<small>Shared expenses</small></span></a>
        <nav class="side-nav" aria-label="Main navigation"><a class="nav-link" routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}"><span class="nav-icon">⌂</span> Home</a><a class="nav-link" routerLink="/" fragment="plans"><span class="nav-icon">▧</span> My plans</a></nav>
      </div>
      <div class="sidebar-bottom"><div class="profile-card"><span class="profile-hex">FA</span><span><strong>Funnito A.</strong><small>Personal workspace</small></span></div><div class="local-note"><span class="status-dot"></span>Saved in this browser</div></div>
    </aside>
    <main class="main-area"><header class="desktop-topbar"><div class="breadcrumbs"><span>Workspace</span><b>›</b><strong>{{crumb}}</strong></div><div class="topbar-actions"><button class="notification-button" aria-label="Notifications">♧</button><span class="profile-hex small-hex">FA</span></div></header><header class="mobile-header"><a class="brand" routerLink="/"><span class="brand-mark">♧</span><span>Bee Keeper</span></a><a class="mobile-add" routerLink="/expenses/new" aria-label="New expense">＋</a></header>
      @if (store.recovery(); as problem) { <section class="recovery" role="alert"><div><strong>We couldn’t load your saved expenses</strong><p>{{problem}}</p></div><div class="recovery-actions"><button class="button secondary small" (click)="store.retry()">Retry loading</button><button class="button danger small" (click)="confirmReset()">Reset local data</button></div></section> }
      <router-outlet />
    </main>
  </div>
  <dialog #resetDialog class="confirm-dialog"><div class="dialog-icon">!</div><h2>Reset local data?</h2><p>This removes only Bee Keeper’s saved expenses in this browser. This cannot be undone.</p><div class="dialog-actions"><button class="button secondary" (click)="resetDialog.close()">Cancel</button><button class="button danger" (click)="store.reset(); resetDialog.close()">Reset data</button></div></dialog>
  <div class="toast" aria-live="polite" aria-atomic="true">{{store.notice()}}</div>
` })
export class AppComponent {
  readonly store = inject(ExpenseStore);
  private readonly router = inject(Router);
  get crumb(): string { const url = this.router.url; return url.includes('/new') ? 'New Honey Drop' : url.includes('/edit') ? 'Edit Honey Drop' : url.includes('/expenses/') ? 'Honey Drop Summary' : 'Home'; }
  confirmReset(): void { document.querySelector<HTMLDialogElement>('.confirm-dialog')?.showModal(); }
}
