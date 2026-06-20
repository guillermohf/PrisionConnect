import { ChangeDetectionStrategy, Component, inject, signal, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { VisitantesService } from '@core/services/visitantes.service';
import { NotificacionService } from '@core/services/notificacion.service';
import { CrearVisitanteDTO, Visitante } from '@core/models';
import { ModalComponent } from "@shared/modal/modal.component";
import { CedulaMaskDirective } from "@shared/directives/cedula-mask.directive";
import { TelefonoMaskDirective } from "@shared/directives/telefono.mask.directive";
import { cedulaDominicanaValidator, emailValidator, telefonoDominicanoValidator } from '@shared/validators/custom.validators';
import { InputComponent } from '@shared/input/input.component';
import { ButtonComponent } from '@shared/button/buttton.component';

@Component({
  selector: 'prisionConnect-visitante-agregar-modal',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalComponent,
    CedulaMaskDirective,
    TelefonoMaskDirective,
    InputComponent,
    ButtonComponent
],
  templateUrl: './visitante-agregar-modal.component.html',
})
export class VisitanteAgregarModalComponent {
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
  modoEdicion = signal(false);

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
      this.modoEdicion.set(true);
      this.cargarDatos(this.visitanteEditar);
    }
  }

  ngOnChanges() {
    if (this.visitanteEditar) {
      this.modoEdicion.set(true);
      this.cargarDatos(this.visitanteEditar);
    } else {
      this.modoEdicion.set(false);
      this.visitanteForm.reset();
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

    aplicarMascaraCedula(event: any): void {
    let valor = event.target.value.replace(/\D/g, '');
    if (valor.length > 11) valor = valor.substring(0, 11);
    if (valor.length >= 3) valor = valor.substring(0, 3) + '-' + valor.substring(3);
    if (valor.length >= 11) valor = valor.substring(0, 11) + '-' + valor.substring(11);
    this.visitanteForm.patchValue({ cedula: valor }, { emitEvent: false });
  }

  aplicarMascaraTelefono(event: any): void {
    let valor = event.target.value.replace(/\D/g, '');
    if (valor.length > 10) valor = valor.substring(0, 10);
    if (valor.length >= 3) valor = '(' + valor.substring(0, 3) + ') ' + valor.substring(3);
    if (valor.length >= 9) {
      const parts = valor.split(') ');
      if (parts[1] && parts[1].length > 3) {
        valor = parts[0] + ') ' + parts[1].substring(0, 3) + '-' + parts[1].substring(3);
      }
    }
    this.visitanteForm.patchValue({ telefono: valor }, { emitEvent: false });
  }

  /**
   * Cerrar modal
   */
  closeModal(): void {
    this.visitanteForm.reset();
    this.modoEdicion.set(false);
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
      await this.crear();
  }

  /**
   * Crear nuevo visitante
   */
  async crear(): Promise<void> {
    this.guardando.set(true);

    const dto: CrearVisitanteDTO = {
      cedula: this.visitanteForm.value.cedula,
      nombre: this.visitanteForm.value.nombre,
      apellido: this.visitanteForm.value.apellido,
      telefono: this.visitanteForm.value.telefono,
      direccion: this.visitanteForm.value.direccion,
      email: this.visitanteForm.value.email || undefined,
      fotoUrl: undefined
    };

    const resultado = await this.visitantesService.crear(dto);

    this.guardando.set(false);

    if (resultado.exito) {
      this.notificacion.success(resultado.mensaje || 'Visitante creado exitosamente');
      this.guardado.emit(resultado.data!);
      this.closeModal();
    } else {
      await this.notificacion.error(
        resultado.mensaje,
        'Error al crear visitante'
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

  /**
   * Verificar si ya existe un visitante con esa cédula
   */
  async verificarCedulaDuplicada(): Promise<void> {
    const cedula = this.visitanteForm.get('cedula')?.value;
    
    if (!cedula || this.modoEdicion()) return;

    const existe = await this.visitantesService.existePorCedula(cedula);
    
    if (existe) {
      this.notificacion.warning(
        'Ya existe un visitante registrado con esta cédula',
        'Cédula Duplicada'
      );
      this.visitanteForm.get('cedula')?.setErrors({ duplicado: true });
    }
  }
}