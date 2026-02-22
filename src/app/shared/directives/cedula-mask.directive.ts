// src/app/shared/directives/cedula-mask.directive.ts

import { Directive, HostListener, ElementRef, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';


@Directive({
  selector: '[cedulaMask]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CedulaMaskDirective),
      multi: true
    }
  ]
})
export class CedulaMaskDirective implements ControlValueAccessor {

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private el: ElementRef<HTMLInputElement>) {}

  // ────────────────────────────────────────────────
  // Evento principal: cada tecla que escribe el usuario
  // ────────────────────────────────────────────────
  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = this.el.nativeElement;

    // 1. Extraer solo dígitos del valor actual
    const soloDigitos = input.value.replace(/\D/g, '').slice(0, 11);

    // 2. Aplicar formato con guiones
    const formateado = this.formatearCedula(soloDigitos);

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
    const teclas_permitidas = [
      'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight',
      'Tab', 'Home', 'End'
    ];

    const esDigito = /^[0-9]$/.test(event.key);
    const esTeclaPermitida = teclas_permitidas.includes(event.key);
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
    const soloDigitos = pegado.replace(/\D/g, '').slice(0, 11);
    const formateado = this.formatearCedula(soloDigitos);

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
    const soloDigitos = (value ?? '').replace(/\D/g, '').slice(0, 11);
    this.el.nativeElement.value = this.formatearCedula(soloDigitos);
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
  // Lógica de formateo: XXX-XXXXXXX-X
  // ────────────────────────────────────────────────
  private formatearCedula(digitos: string): string {
    // Máscara dominicana: 3 - 7 - 1
    const parte1 = digitos.slice(0, 3);        // 001
    const parte2 = digitos.slice(3, 10);       // 1234567
    const parte3 = digitos.slice(10, 11);      // 8

    let resultado = parte1;
    if (parte2) resultado += `-${parte2}`;
    if (parte3) resultado += `-${parte3}`;

    return resultado;
  }
}