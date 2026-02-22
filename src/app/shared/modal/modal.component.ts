// src/app/shared/components/modal/modal.component.ts

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'prisionConnect-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styles: [`
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .animate-fadeIn {
      animation: fadeIn 0.2s ease-out;
    }
  `]
})
export class ModalComponent {
  @Input() title: string = 'Título del Modal';
  @Input() isOpen: boolean = false;

  @Output() close = new EventEmitter<void>();

  onClose() {
    this.isOpen = false;
    this.close.emit();
  }
} 