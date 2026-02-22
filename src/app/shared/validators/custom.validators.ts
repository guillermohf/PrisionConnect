// src/app/shared/validators/custom.validators.ts

import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validador de cédula dominicana.
 * Acepta el valor SIN guiones (11 dígitos puros)
 * porque la directiva CedulaMaskDirective emite solo dígitos al formulario.
 *
 * Formato esperado internamente: XXXXXXXXXXX (11 dígitos)
 * Formato visual en el input:    XXX-XXXXXXX-X (13 caracteres)
 */
export function cedulaDominicanaValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor: string = (control.value ?? '').replace(/\D/g, '');

    // Campo vacío → dejar que 'required' lo maneje
    if (!valor) return null;

    // Debe tener exactamente 11 dígitos
    if (valor.length !== 11) {
      return {
        cedulaInvalida: {
          mensaje: 'La cédula debe tener 11 dígitos (formato: XXX-XXXXXXX-X)',
          digitosActuales: valor.length
        }
      };
    }

    // Solo dígitos (ya garantizado por la directiva, pero validamos igual)
    if (!/^\d{11}$/.test(valor)) {
      return { cedulaInvalida: { mensaje: 'La cédula solo debe contener números' } };
    }

    return null; // ✅ Válido
  };
}

/**
 * Validador de teléfono dominicano.
 * Acepta el valor SIN guiones (10 dígitos puros)
 * porque la directiva TelefonoMaskDirective emite solo dígitos al formulario.
 *
 * Formato esperado internamente: XXXXXXXXXX (10 dígitos)
 * Formato visual en el input:    XXX-XXX-XXXX (12 caracteres)
 *
 * Códigos de área válidos en RD: 809, 829, 849
 */
export function telefonoDominicanoValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor: string = (control.value ?? '').replace(/\D/g, '');

    // Campo vacío → dejar que 'required' lo maneje
    if (!valor) return null;

    // Debe tener exactamente 10 dígitos
    if (valor.length !== 10) {
      return {
        telefonoInvalido: {
          mensaje: 'El teléfono debe tener 10 dígitos (formato: XXX-XXX-XXXX)',
          digitosActuales: valor.length
        }
      };
    }

    // Validar código de área dominicano: 809, 829, 849
    const codigoArea = valor.slice(0, 3);
    const codigosValidos = ['809', '829', '849'];

    if (!codigosValidos.includes(codigoArea)) {
      return {
        telefonoInvalido: {
          mensaje: `Código de área inválido (${codigoArea}). Use 809, 829 o 849`
        }
      };
    }

    return null; // ✅ Válido
  };
}


export function emailValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor: string = (control.value ?? '').trim();

    // Campo vacío → dejar que 'required' lo maneje
    if (!valor) return null;

    // Regex robusta para email
    const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(valor)) {
      // Mensajes específicos según el error
      if (!valor.includes('@')) {
        return { emailInvalido: { mensaje: 'El correo debe contener @' } };
      }
      if ((valor.match(/@/g) ?? []).length > 1) {
        return { emailInvalido: { mensaje: 'El correo solo puede tener un @' } };
      }
      const partes = valor.split('@');
      if (!partes[1]?.includes('.')) {
        return { emailInvalido: { mensaje: 'El dominio debe contener un punto (ej: gmail.com)' } };
      }
      return { emailInvalido: { mensaje: 'Formato de correo inválido (ej: nombre@dominio.com)' } };
    }

    return null; // ✅ Válido
  };
}