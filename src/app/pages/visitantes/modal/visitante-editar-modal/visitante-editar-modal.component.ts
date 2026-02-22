import {  Component, inject, signal, Input, Output, EventEmitter, input } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { VisitantesService } from '@core/services/visitantes.service';
import { NotificacionService } from '@core/services/notificacion.service';
import { ActualizarVisitanteDTO, Visitante } from '@core/models';
import { ModalComponent } from "src/app/shared/modal/modal.component";
import { cedulaDominicanaValidator, emailValidator, telefonoDominicanoValidator } from '@shared/validators/custom.validators';

@Component({
  selector: 'prisionConnect-visitante-editar-modal',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalComponent
],
  templateUrl: './visitante-editar-modal.component.html',
})

export class VisitanteEditarModalComponent {
  private fb = inject(FormBuilder);
  private visitantesService = inject(VisitantesService);
  private notificacion = inject(NotificacionService);

  // Inputs
  @Input() showModal = false;
  @Input() visitanteEditar: Visitante | null = null;

  // Outputs
  @Output() close = new EventEmitter<void>();
  @Output() guardado = new EventEmitter<Visitante>();

  // Señales
  guardando = signal(false);
  modoEdicion = signal(true); // Siempre en modo edición

  // Formulario
  visitanteForm: FormGroup;

  constructor() {
    this.visitanteForm = this.fb.group({
      // Datos personales
      cedula: ['', [
        Validators.required, 
        cedulaDominicanaValidator()
      ]],
      nombre: ['', [
        Validators.required, 
        Validators.minLength(2)
      ]],
      apellido: ['', [
        Validators.required, 
        Validators.minLength(2)
      ]],

      // Contacto
      telefono: ['', [
        Validators.required,
        telefonoDominicanoValidator()
      ]],
      email: ['', [emailValidator()]],

      // Dirección
      direccion: ['', [
        Validators.required,
        Validators.minLength(10)
      ]],

      // Observaciones
      observaciones: ['']
    });
  }

  ngOnInit() {
    if (this.visitanteEditar) {
      this.cargarDatos(this.visitanteEditar);
    }
  }

  ngOnChanges() {
    if (this.visitanteEditar) {
      this.cargarDatos(this.visitanteEditar);
    }
  }

  /**
   * Cargar datos del visitante en el formulario
   */
  cargarDatos(visitante: Visitante): void {
    this.visitanteForm.patchValue({
      cedula: visitante.cedula,
      nombre: visitante.nombre,
      apellido: visitante.apellido,
      telefono: visitante.telefono,
      email: visitante.email || '',
      direccion: visitante.direccion,
      observaciones: visitante.observaciones || ''
    });

    // Deshabilitar cédula en modo edición
    this.visitanteForm.get('cedula')?.disable();
  }

  /**
   * Cerrar modal
   */
  closeModal(): void {
    this.visitanteForm.reset();
    this.visitanteForm.get('cedula')?.enable();
    this.close.emit();
  }

  /**
   * Enviar formulario
   */
  async onSubmit(): Promise<void> {
    if (this.visitanteForm.invalid) {
      this.marcarCamposComoTocados();
      this.notificacion.warning(
        'Por favor completa todos los campos requeridos',
        'Formulario Incompleto'
      );
      return;
    }

    await this.actualizar();
  }

  /**
   * Actualizar visitante existente
   */
  async actualizar(): Promise<void> {
    if (!this.visitanteEditar?.id) return;

    this.guardando.set(true);

    const dto: ActualizarVisitanteDTO = {
      telefono: this.visitanteForm.value.telefono,
      direccion: this.visitanteForm.value.direccion,
      email: this.visitanteForm.value.email || undefined,
      observaciones: this.visitanteForm.value.observaciones || undefined
    };

    const resultado = await this.visitantesService.actualizar(
      this.visitanteEditar.id,
      dto
    );

    this.guardando.set(false);

    if (resultado.exito) {
      this.notificacion.toast('Visitante actualizado', 'success');
      this.guardado.emit(resultado.data!);
      this.closeModal();
    } else {
      this.notificacion.error(
        resultado.mensaje,
        'Error al actualizar'
      );
    }
  }

  /**
   * Marcar todos los campos como tocados
   */
  private marcarCamposComoTocados(): void {
    Object.keys(this.visitanteForm.controls).forEach(key => {
      this.visitanteForm.get(key)?.markAsTouched();
    });
  }
}