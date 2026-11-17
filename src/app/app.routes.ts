import { Routes } from '@angular/router';
import { DashboardComponent } from './features/expenses/dashboard.component';
import { ExpenseFormComponent } from './features/expenses/expense-form.component';
import { ExpenseDetailComponent } from './features/expenses/expense-detail.component';
import { NotFoundComponent } from './features/expenses/not-found.component';
export const routes: Routes = [
  { path: '', component: DashboardComponent, title: 'Bee Keeper · Dashboard' },
  { path: 'expenses/new', component: ExpenseFormComponent, title: 'New expense · Bee Keeper' },
  { path: 'expenses/:id/edit', component: ExpenseFormComponent, title: 'Edit expense · Bee Keeper' },
  { path: 'expenses/:id', component: ExpenseDetailComponent, title: 'Expense details · Bee Keeper' },
  { path: '**', component: NotFoundComponent, title: 'Page not found · Bee Keeper' }
];
