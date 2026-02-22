// src/app/shared/directives/swipe.directive.ts

import { Directive, ElementRef, EventEmitter, OnInit, OnDestroy, Output } from '@angular/core';

export type SwipeDirection = 'left' | 'right';

@Directive({
  selector: '[prisionConnectSwipe]',
  standalone: true
})
export class SwipeDirective implements OnInit, OnDestroy {
  @Output() swipe = new EventEmitter<SwipeDirection>();

  private touchStartX = 0;
  private touchStartY = 0;
  private touchEndX = 0;
  private touchEndY = 0;
  private minSwipeDistance = 50; // Distancia mínima para considerar swipe
  private maxVerticalDistance = 100; // Máxima distancia vertical permitida

  private boundTouchStart: (e: TouchEvent) => void;
  private boundTouchEnd: (e: TouchEvent) => void;

  constructor(private el: ElementRef) {
    this.boundTouchStart = this.onTouchStart.bind(this);
    this.boundTouchEnd = this.onTouchEnd.bind(this);
  }

  ngOnInit(): void {
    const element = this.el.nativeElement;
    element.addEventListener('touchstart', this.boundTouchStart, { passive: true });
    element.addEventListener('touchend', this.boundTouchEnd, { passive: true });
  }

  ngOnDestroy(): void {
    const element = this.el.nativeElement;
    element.removeEventListener('touchstart', this.boundTouchStart);
    element.removeEventListener('touchend', this.boundTouchEnd);
  }

  private onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0].screenX;
    this.touchStartY = event.changedTouches[0].screenY;
  }

  private onTouchEnd(event: TouchEvent): void {
    this.touchEndX = event.changedTouches[0].screenX;
    this.touchEndY = event.changedTouches[0].screenY;
    this.handleSwipe();
  }

  private handleSwipe(): void {
    const horizontalDistance = this.touchEndX - this.touchStartX;
    const verticalDistance = Math.abs(this.touchEndY - this.touchStartY);

    // Solo considerar swipe si el movimiento vertical es mínimo
    if (verticalDistance > this.maxVerticalDistance) {
      return;
    }

    // Swipe hacia la derecha
    if (horizontalDistance > this.minSwipeDistance) {
      this.swipe.emit('right');
    }
    // Swipe hacia la izquierda
    else if (horizontalDistance < -this.minSwipeDistance) {
      this.swipe.emit('left');
    }
  }
}