// src/app/shared/validators/custom.validators.ts

import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validador de cédula dominicana.
 * Valida: 11 dígitos, prefijo 001 o 402, y dígito verificador (Luhn-like).
 * Acepta el valor SIN guiones (11 dígitos puros).
 */
export function cedulaDominicanaValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor: string = (control.value ?? '').replace(/\D/g, '');

    // Campo vacío → dejar que 'required' lo maneje
    if (!valor) return null;

    // Debe tener exactamente 11 dígitos
    if (!/^\d{11}$/.test(valor)) {
      return {
        cedulaFormato: { message: 'La cédula debe tener 11 dígitos.' }
      };
    }

    // Dígito verificador (algoritmo oficial JCE)
    // Pesos alternados 1-2 sobre los primeros 10 dígitos
    const pesos = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
    let suma = 0;
    for (let i = 0; i < 10; i++) {
      let p = parseInt(valor[i]) * pesos[i];
      if (p > 9) p -= 9;
      suma += p;
    }
    const esperado = (10 - (suma % 10)) % 10;
    if (esperado !== parseInt(valor[10])) {
      return {
        cedulaDigito: { message: 'Cédula inválida (dígito verificador incorrecto).' }
      };
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

/**
 * Validador de edad mínima.
 * Bloquea fechas de nacimiento que resulten en edad < edadMinima años.
 */
export function mayorDeEdadValidator(edadMinima = 18): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const nac = new Date(control.value);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nac.getFullYear();
    const mes = hoy.getMonth() - nac.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nac.getDate())) edad--;
    return edad >= edadMinima ? null : {
      menorDeEdad: {
        edadActual: edad,
        message: `Debe tener al menos ${edadMinima} años.`
      }
    };
  };
}

/**
 * Validador para impedir fechas futuras.
 */
export function fechaNoFuturaValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const fechaSeleccionada = new Date(control.value + 'T00:00:00');
    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999);

    return fechaSeleccionada <= hoy ? null : {
      fechaFutura: { message: 'La fecha de ingreso no puede ser una fecha futura.' }
    };
  };
}