import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ExpenseStore } from './data/expense.store';
@Component({ selector: 'app-root', standalone: true, imports: [RouterOutlet, RouterLink], template: `
  <div class="app-frame">
    <aside class="sidebar">
      <a class="brand" routerLink="/" aria-label="Bee Keeper dashboard"><span class="brand-mark">✳</span><span>Bee Keeper<small>Shared costs, in good order</small></span></a>
      <div class="side-label">WORKSPACE</div><a class="nav-link active" routerLink="/"><span class="nav-icon">▦</span> Expenses</a>
      <div class="sidebar-bottom"><div class="bee-note"><div class="bee-note-icon">✳</div><strong>Little by little,<br>it all adds up.</strong><span>Keep your shared spending clear and easy.</span></div><div class="local-note"><span class="status-dot"></span>Saved in this browser</div></div>
    </aside>
    <main class="main-area"><header class="mobile-header"><a class="brand" routerLink="/"><span class="brand-mark">✳</span><span>Bee Keeper</span></a><a class="mobile-add" routerLink="/expenses/new" aria-label="New expense">＋</a></header>
      @if (store.recovery(); as problem) { <section class="recovery" role="alert"><div><strong>We couldn’t load your saved expenses</strong><p>{{problem}}</p></div><div class="recovery-actions"><button class="button secondary small" (click)="store.retry()">Retry loading</button><button class="button danger small" (click)="confirmReset()">Reset local data</button></div></section> }
      <router-outlet />
    </main>
  </div>
  <dialog #resetDialog class="confirm-dialog"><div class="dialog-icon">!</div><h2>Reset local data?</h2><p>This removes only Bee Keeper’s saved expenses in this browser. This cannot be undone.</p><div class="dialog-actions"><button class="button secondary" (click)="resetDialog.close()">Cancel</button><button class="button danger" (click)="store.reset(); resetDialog.close()">Reset data</button></div></dialog>
  <div class="toast" aria-live="polite" aria-atomic="true">{{store.notice()}}</div>
` })
export class AppComponent {
  readonly store = inject(ExpenseStore);
  confirmReset(): void { document.querySelector<HTMLDialogElement>('.confirm-dialog')?.showModal(); }
}
