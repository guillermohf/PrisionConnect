// src/app/shared/directives/telefono-mask.directive.ts

import { Directive, HostListener, ElementRef, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Directiva para máscara de teléfono dominicano.
 *
 * Formato visual:  XXX-XXX-XXXX  (12 caracteres con guiones)
 * Valor interno:   XXXXXXXXXX    (10 dígitos sin guiones)
 *
 * Uso:
 *   <input telefonoMask formControlName="telefono" />
 *   <input telefonoMask [(ngModel)]="telefono" />
 */
@Directive({
  selector: '[telefonoMask]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TelefonoMaskDirective),
      multi: true
    }
  ]
})
export class TelefonoMaskDirective implements ControlValueAccessor {

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private el: ElementRef<HTMLInputElement>) {}

  // ────────────────────────────────────────────────
  // Evento principal: cada tecla que escribe el usuario
  // ────────────────────────────────────────────────
  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = this.el.nativeElement;

    // 1. Extraer solo dígitos del valor actual (máx 10)
    const soloDigitos = input.value.replace(/\D/g, '').slice(0, 10);

    // 2. Aplicar formato con guiones
    const formateado = this.formatearTelefono(soloDigitos);

    // 3. Actualizar el input visualmente
    input.value = formateado;

    // 4. Emitir al formulario solo los dígitos (sin guiones)
    this.onChange(soloDigitos);
  }

  // ────────────────────────────────────────────────
  // Prevenir caracteres no numéricos
  // ────────────────────────────────────────────────
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const teclasPermitidas = [
      'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight',
      'Tab', 'Home', 'End'
    ];

    const esDigito = /^[0-9]$/.test(event.key);
    const esTeclaPermitida = teclasPermitidas.includes(event.key);
    const esAtajo = event.ctrlKey || event.metaKey; // Ctrl+C, Ctrl+V, etc.

    if (!esDigito && !esTeclaPermitida && !esAtajo) {
      event.preventDefault();
    }
  }

  // ────────────────────────────────────────────────
  // Manejar pegado (paste) — filtrar solo dígitos
  // ────────────────────────────────────────────────
  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pegado = event.clipboardData?.getData('text') ?? '';
    const soloDigitos = pegado.replace(/\D/g, '').slice(0, 10);
    const formateado = this.formatearTelefono(soloDigitos);

    this.el.nativeElement.value = formateado;
    this.onChange(soloDigitos);
  }

  @HostListener('blur')
  onBlur(): void {
    this.onTouched();
  }

  // ────────────────────────────────────────────────
  // ControlValueAccessor — escribe desde el modelo
  // ────────────────────────────────────────────────
  writeValue(value: string | null): void {
    const soloDigitos = (value ?? '').replace(/\D/g, '').slice(0, 10);
    this.el.nativeElement.value = this.formatearTelefono(soloDigitos);
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.el.nativeElement.disabled = isDisabled;
  }

  // ────────────────────────────────────────────────
  // Lógica de formateo: XXX-XXX-XXXX
  // Máscara dominicana: 3 - 3 - 4
  // Ej: 8091234567 → 809-123-4567
  // ────────────────────────────────────────────────
  private formatearTelefono(digitos: string): string {
    const parte1 = digitos.slice(0, 3);   // 809
    const parte2 = digitos.slice(3, 6);   // 123
    const parte3 = digitos.slice(6, 10);  // 4567

    let resultado = parte1;
    if (parte2) resultado += `-${parte2}`;
    if (parte3) resultado += `-${parte3}`;

    return resultado;
  }
}