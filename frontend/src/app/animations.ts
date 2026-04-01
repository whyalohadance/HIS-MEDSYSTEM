import { trigger, transition, style, animate, query } from '@angular/animations';

export const routeAnimations = trigger('routeAnimations', [
  transition('* <=> *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(12px)' }),
      animate('300ms ease', style({ opacity: 1, transform: 'translateY(0)' }))
    ], { optional: true })
  ])
]);
