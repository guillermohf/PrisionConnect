import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'prisionConnect-form-layout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './form-layout.component.html'
})
export class FormLayoutComponent {
  @Input() showDivider: boolean = true;
  @Input() padding: string = 'p-6';
  @Output() formSubmit = new EventEmitter<void>();
  @Output() formCancel = new EventEmitter<void>();

  onSubmit(): void {
    this.formSubmit.emit();
  }

  onCancel(): void {
    this.formCancel.emit();
  }
}