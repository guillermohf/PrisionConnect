// src/app/shared/input/input.component.ts

import {
  Component,
  Input,
  Optional,
  Self,
  Output,
  EventEmitter
} from '@angular/core';
import {
  ControlValueAccessor,
  NgControl,
  AbstractControl
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';

interface SelectOption {
  value: any;
  label: string;
}

@Component({
  selector: 'prisionConnect-input',
  standalone: true,
  imports: [CommonModule, NgxMaskDirective],
  providers: [provideNgxMask()],
  templateUrl: './input.component.html'
})
export class InputComponent implements ControlValueAccessor {

  @Input() label!: string;
  @Input() type: string = 'text';
  @Input() placeholder: string = '';
  @Input() required: boolean = false;
  @Input() mask?: string;
  @Input() name!: string;
  @Input() readonly: boolean = false;
  @Input() rows: number = 3;
  @Input() class: string = '';
  @Input() options: SelectOption[] = [];
  @Input() formControl?: AbstractControl;
  @Input() max?: string;

  // 🔧 FIX: permitir binding [value]
  @Input() value: any = '';

  @Output() blur = new EventEmitter<void>();
  @Output() focus = new EventEmitter<void>();
  @Output() inputChange = new EventEmitter<Event>();

  disabled = false;

  onChange = (_: any) => {};
  onTouched = () => {};

  constructor(
    @Optional() @Self() public ngControl: NgControl
  ) {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  onInputChange(event: Event): void {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    this.value = target.value;
    this.onChange(this.value);
    this.inputChange.emit(event);
  }

  onBlur(): void {
    this.onTouched();
    this.blur.emit();
  }

  onFocus(): void {
    this.focus.emit();
  }

  writeValue(value: any): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  get invalid(): boolean {
    if (this.formControl) {
      return !!(this.formControl.invalid && this.formControl.touched);
    }
    return !!(
      this.ngControl &&
      this.ngControl.invalid &&
      this.ngControl.touched
    );
  }

  get errors() {
    if (this.formControl) {
      return this.formControl.errors || {};
    }
    return this.ngControl?.errors || {};
  }

  get isTextarea(): boolean {
    return this.type === 'textarea';
  }

  get isSelect(): boolean {
    return this.type === 'select';
  }

  get isReadonlyOrDisabled(): boolean {
    return this.readonly || this.disabled;
  }
}
