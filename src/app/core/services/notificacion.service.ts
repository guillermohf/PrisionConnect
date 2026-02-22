// src/app/core/services/notificacion.service.ts

import { Injectable } from '@angular/core';
import Swal, { SweetAlertIcon, SweetAlertResult } from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class NotificacionService {

  /**
   * Mostrar notificación de éxito
   */
  success(mensaje: string, titulo: string = '¡Éxito!'): Promise<SweetAlertResult> {
    return Swal.fire({
      title: titulo,
      text: mensaje,
      icon: 'success',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#10b981'
    });
  }

  /**
   * Mostrar notificación de error
   */
  error(mensaje: string, titulo: string = 'Error'): Promise<SweetAlertResult> {
    return Swal.fire({
      title: titulo,
      text: mensaje,
      icon: 'error',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#ef4444'
    });
  }

  /**
   * Mostrar notificación de advertencia
   */
  warning(mensaje: string, titulo: string = 'Advertencia'): Promise<SweetAlertResult> {
    return Swal.fire({
      title: titulo,
      text: mensaje,
      icon: 'warning',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#f59e0b'
    });
  }

  /**
   * Mostrar notificación de información
   */
  info(mensaje: string, titulo: string = 'Información'): Promise<SweetAlertResult> {
    return Swal.fire({
      title: titulo,
      text: mensaje,
      icon: 'info',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#3b82f6'
    });
  }

  /**
   * Confirmar acción con el usuario
   */
  async confirmar(
    titulo: string,
    mensaje: string,
    textoConfirmar: string = 'Sí, continuar',
    textoCancelar: string = 'Cancelar'
  ): Promise<boolean> {
    const result = await Swal.fire({
      title: titulo,
      text: mensaje,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: textoConfirmar,
      cancelButtonText: textoCancelar,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280',
      reverseButtons: true
    });

    return result.isConfirmed;
  }

  /**
   * Confirmar eliminación
   */
  async confirmarEliminacion(
    entidad: string = 'este registro'
  ): Promise<boolean> {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `Se desactivará ${entidad}. Podrás reactivarlo después.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      reverseButtons: true
    });

    return result.isConfirmed;
  }

  /**
   * Confirmar eliminación permanente
   */
  async confirmarEliminacionPermanente(
    entidad: string = 'este registro'
  ): Promise<boolean> {
    const result = await Swal.fire({
      title: '⚠️ ¡ADVERTENCIA!',
      html: `
        <p>Estás a punto de <strong>eliminar permanentemente</strong> ${entidad}.</p>
        <p class="text-red-600 font-bold">Esta acción NO se puede deshacer.</p>
      `,
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar permanentemente',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      reverseButtons: true,
      focusCancel: true
    });

    return result.isConfirmed;
  }

  /**
   * Toast de notificación (esquina superior derecha)
   */
  toast(
    mensaje: string,
    tipo: SweetAlertIcon = 'success',
    duracion: number = 3000
  ): void {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: duracion,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });

    Toast.fire({
      icon: tipo,
      title: mensaje
    });
  }

  /**
   * Mostrar loading
   */
  loading(mensaje: string = 'Procesando...'): void {
    Swal.fire({
      title: mensaje,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  }

  /**
   * Cerrar loading
   */
  cerrarLoading(): void {
    Swal.close();
  }

  /**
   * Formulario de input
   */
  async input(
    titulo: string,
    placeholder: string = '',
    valorInicial: string = ''
  ): Promise<string | null> {
    const result = await Swal.fire({
      title: titulo,
      input: 'text',
      inputPlaceholder: placeholder,
      inputValue: valorInicial,
      showCancelButton: true,
      confirmButtonText: 'Aceptar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value) {
          return 'Este campo es requerido';
        }
        return null;
      }
    });

    return result.isConfirmed ? result.value : null;
  }

  /**
   * Formulario de textarea
   */
  async textarea(
    titulo: string,
    placeholder: string = '',
    valorInicial: string = ''
  ): Promise<string | null> {
    const result = await Swal.fire({
      title: titulo,
      input: 'textarea',
      inputPlaceholder: placeholder,
      inputValue: valorInicial,
      showCancelButton: true,
      confirmButtonText: 'Aceptar',
      cancelButtonText: 'Cancelar'
    });

    return result.isConfirmed ? result.value : null;
  }

  /**
   * Selector de opciones
   */
  async select(
    titulo: string,
    opciones: { [key: string]: string },
    valorInicial?: string
  ): Promise<string | null> {
    const result = await Swal.fire({
      title: titulo,
      input: 'select',
      inputOptions: opciones,
      inputValue: valorInicial,
      showCancelButton: true,
      confirmButtonText: 'Aceptar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value) {
          return 'Debes seleccionar una opción';
        }
        return null;
      }
    });

    return result.isConfirmed ? result.value : null;
  }

  /**
   * Progreso de operación
   */
  async conProgreso<T>(
    promesa: Promise<T>,
    mensajeCargando: string = 'Procesando...',
    mensajeExito: string = 'Operación completada',
    mensajeError: string = 'Ocurrió un error'
  ): Promise<T | null> {
    this.loading(mensajeCargando);

    try {
      const resultado = await promesa;
      this.cerrarLoading();
      await this.success(mensajeExito);
      return resultado;
    } catch (error: any) {
      this.cerrarLoading();
      await this.error(error.message || mensajeError);
      return null;
    }
  }
}