import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
@Component({standalone:true,imports:[RouterLink],template:`<section class="missing-record route-missing"><div class="empty-mark">⌁</div><div class="eyebrow">404 · WRONG TURN</div><h1>We can’t find that page.</h1><p>The page may have moved, or the address may be mistyped.</p><a routerLink="/" class="button primary">Back to dashboard</a></section>`})
export class NotFoundComponent {}
