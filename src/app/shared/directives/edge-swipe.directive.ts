// src/app/shared/directives/edge-swipe.directive.ts

import { Directive, ElementRef, EventEmitter, OnInit, OnDestroy, Output } from '@angular/core';

@Directive({
  selector: '[prisionConnectEdgeSwipe]',
  standalone: true
})
export class EdgeSwipeDirective implements OnInit, OnDestroy {
  @Output() edgeSwipeRight = new EventEmitter<void>();

  private touchStartX = 0;
  private touchStartY = 0;
  private touchEndX = 0;
  private touchEndY = 0;
  private edgeZone = 30; // Zona del borde en px
  private minSwipeDistance = 80; // Distancia mínima para swipe
  private maxVerticalDistance = 100; // Máxima distancia vertical

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
    this.touchStartX = event.changedTouches[0].clientX;
    this.touchStartY = event.changedTouches[0].clientY;
  }

  private onTouchEnd(event: TouchEvent): void {
    this.touchEndX = event.changedTouches[0].clientX;
    this.touchEndY = event.changedTouches[0].clientY;
    this.handleEdgeSwipe();
  }

  private handleEdgeSwipe(): void {
    // Solo detectar si el toque comenzó en el borde izquierdo
    if (this.touchStartX > this.edgeZone) {
      return;
    }

    const horizontalDistance = this.touchEndX - this.touchStartX;
    const verticalDistance = Math.abs(this.touchEndY - this.touchStartY);

    // Verificar que el movimiento sea mayormente horizontal
    if (verticalDistance > this.maxVerticalDistance) {
      return;
    }

    // Swipe hacia la derecha desde el borde
    if (horizontalDistance > this.minSwipeDistance) {
      this.edgeSwipeRight.emit();
    }
  }
}