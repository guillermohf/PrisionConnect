// src/app/features/abogados/components/abogado-editar-modal/abogado-editar-modal.component.ts

import { Component, EventEmitter, Input, Output, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AbogadosService } from '@core/services/abogados.service';
import { NotificacionService } from '@core/services/notificacion.service';
import { Abogado, ActualizarAbogadoDTO } from '@core/models/abogado.interface';
import { ModalComponent } from '@shared/modal/modal.component';
import { ButtonComponent } from "@shared/button/buttton.component";
import { InputComponent } from '@shared/input/input.component';
import { emailValidator, telefonoDominicanoValidator } from '@shared/validators/custom.validators';
import { TelefonoMaskDirective } from "@shared/directives/telefono.mask.directive";

@Component({
  selector: 'prisionConnect-abogado-editar-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalComponent,
    ButtonComponent,
    InputComponent,
    TelefonoMaskDirective
],
  templateUrl: './abogados-editar-modal.component.html'
})
export class AbogadoEditarModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() abogado: Abogado | null = null;
  @Output() isOpenChange = new EventEmitter<boolean>();
  @Output() abogadoActualizado = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private abogadosService = inject(AbogadosService);
  private notificacionService = inject(NotificacionService);

  guardando = false;

  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      institucion: ['', [Validators.required, Validators.minLength(3)]],
      telefono: ['', [Validators.required, telefonoDominicanoValidator()]],
      email: ['', [Validators.required, emailValidator()]],
      activo: [true],
      observaciones: ['']
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['abogado'] && this.abogado) {
      this.cargarDatos();
    }
  }

  cargarDatos(): void {
    if (!this.abogado) return;

    this.form.patchValue({
      institucion: this.abogado.institucion,
      telefono: this.abogado.telefono,
      email: this.abogado.email,
      activo: this.abogado.activo,
      observaciones: this.abogado.observaciones || ''
    });
  }

  // Máscara para teléfono
  aplicarMascaraTelefono(event: any): void {
    let valor = event.target.value.replace(/\D/g, '');
    
    if (valor.length > 10) {
      valor = valor.substring(0, 10);
    }
    
    if (valor.length >= 3) {
      valor = '(' + valor.substring(0, 3) + ') ' + valor.substring(3);
    }
    if (valor.length >= 9) {
      const parts = valor.split(') ');
      if (parts[1] && parts[1].length > 3) {
        valor = parts[0] + ') ' + parts[1].substring(0, 3) + '-' + parts[1].substring(3);
      }
    }
    
    this.form.patchValue({ telefono: valor }, { emitEvent: false });
  }

  async guardar(): Promise<void> {
    if (!this.form.valid || !this.abogado?.id) {
      this.notificacionService.error('Por favor completa todos los campos correctamente');
      this.form.markAllAsTouched();
      return;
    }

    this.guardando = true;

    try {
      const datos: ActualizarAbogadoDTO = this.form.value;
      const resultado = await this.abogadosService.actualizarAbogado(this.abogado.id, datos);

      if (resultado.success) {
        this.notificacionService.success(resultado.message);
        this.abogadoActualizado.emit();
        this.cerrar();
      } else {
        this.notificacionService.error(resultado.message);
      }
    } catch (error) {
      this.notificacionService.error('Error inesperado al actualizar abogado');
      console.error(error);
    } finally {
      this.guardando = false;
    }
  }

  cerrar(): void {
    this.isOpen = false;
    this.isOpenChange.emit(false);
    this.form.reset();
  }

  // Helper para validación
  campoInvalido(campo: string): boolean {
    const control = this.form.get(campo);
    return !!(control && control.invalid && control.touched);
  }

  obtenerMensajeError(campo: string): string {
    const control = this.form.get(campo);
    
    if (control?.hasError('required')) {
      return 'Este campo es obligatorio';
    }
    if (control?.hasError('pattern')) {
      if (campo === 'telefono') return 'Formato: (000) 000-0000';
    }
    if (control?.hasError('email')) {
      return 'Email inválido';
    }
    if (control?.hasError('minlength')) {
      return `Mínimo ${control.errors?.['minlength'].requiredLength} caracteres`;
    }
    
    return '';
  }
}