// FUNCIÓN PARA AGREGAR AL COMPONENT
// src/app/features/reclusos/components/recluso-agregar-modal/recluso-agregar-modal.component.ts

import { Component, EventEmitter, Input, Output, inject, signal, OnInit, SimpleChanges, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Timestamp } from '@angular/fire/firestore';
import { ReclusosService } from '@core/services/reclusos.service';
import { NotificacionService } from '@core/services/notificacion.service';
import { SituacionLegal, EstadoCivil, EstadoRecluso } from '@core/models/enums.interface';
import { ModalComponent } from '@shared/modal/modal.component';
import { CedulaMaskDirective } from "@shared/directives/cedula-mask.directive";
import { TelefonoMaskDirective } from "@shared/directives/telefono.mask.directive";
import { cedulaDominicanaValidator, telefonoDominicanoValidator } from '@shared/validators/custom.validators';
import { InputComponent } from '@shared/input/input.component';
import { ButtonComponent } from "@shared/button/buttton.component";

@Component({
  selector: 'prisionConnect-recluso-agregar-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalComponent,
    CedulaMaskDirective,
    TelefonoMaskDirective,
    InputComponent,
    ButtonComponent
  ],
  templateUrl: './reclusos-agregar-modal.component.html'
})
export class ReclusoAgregarModalComponent implements OnChanges  {  // ✅ AGREGAR OnInit
  @Input() showModal = false;
  @Output() showModalChange = new EventEmitter<boolean>();
  @Output() reclusoAgregado = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private reclusosService = inject(ReclusosService);
  private notificacionService = inject(NotificacionService);

  form: FormGroup;
  guardando = false;
  generandoId = false;  // ✅ NUEVO

  // Enums para el template
  SituacionLegal = SituacionLegal;
  EstadoRecluso = EstadoRecluso;
  EstadoCivil = EstadoCivil;

  constructor() {
    this.form = this.fb.group({
      // Identificación
      numeroIdentificacion: [{ value: '', disabled: true }, Validators.required],  // ✅ DISABLED
      numeroExpediente: [''],
      cedula: ['', [Validators.required, cedulaDominicanaValidator()]],

      // Información Personal
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      fechaNacimiento: ['', Validators.required],
      sexo: ['', Validators.required],
      nacionalidad: ['', Validators.required],
      estadoCivil: [''],

      // Contacto
      direccion: ['', Validators.required],
      telefono: ['', telefonoDominicanoValidator()],
      nombreContactoEmergencia: ['', Validators.required],
      telefonoEmergencia: ['', telefonoDominicanoValidator()],

      // Ubicación
      pabellon: ['', Validators.required],
      celda: ['', Validators.required],

      // Información Penal
      fechaIngreso: ['', Validators.required],
      situacionLegal: ['', Validators.required],
      estado: ['', Validators.required],
      delito: [''],
      sentencia: [''],

      // Otros
      observaciones: ['']
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Se ejecuta cada vez que showModal cambia a true
    if (changes['showModal']?.currentValue === true) {
      this.generarIdPenitenciario();
    }
  }


  // ========================================
  // ✅ NUEVA FUNCIÓN: Generar ID Automático
  // ========================================
  async generarIdPenitenciario(): Promise<void> {
    const anioActual = new Date().getFullYear();
    const prefijo = `R-${anioActual}-`;

    const idsExistentes = this.reclusosService.reclusos()
      .map(r => r.numeroIdentificacion)
      .filter(id => id?.startsWith(prefijo));

    const ultimoNumero = idsExistentes.reduce((max, id) => {
      const partes = id.split('-');
      const correlativo = parseInt(partes[2], 10);
      return correlativo > max ? correlativo : max;
    }, 0);

    const nuevoCorrelativo = (ultimoNumero + 1).toString().padStart(5, '0');
    const numeroIdentificacion = `${prefijo}${nuevoCorrelativo}`;

    // ✅ Habilitar temporalmente para asegurar que el valor se aplica
    const control = this.form.get('numeroIdentificacion');
    control?.enable();
    control?.setValue(numeroIdentificacion);
    control?.disable();
  }

  // ========================================
  // MÉTODOS EXISTENTES (sin cambios)
  // ========================================

  aplicarMascaraCedula(event: any): void {
    let valor = event.target.value.replace(/\D/g, '');
    if (valor.length > 11) valor = valor.substring(0, 11);
    if (valor.length >= 3) valor = valor.substring(0, 3) + '-' + valor.substring(3);
    if (valor.length >= 11) valor = valor.substring(0, 11) + '-' + valor.substring(11);
    this.form.patchValue({ cedula: valor }, { emitEvent: false });
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
    this.form.patchValue({ telefono: valor }, { emitEvent: false });
  }

  async guardar(): Promise<void> {
    if (!this.form.valid) {
      this.notificacionService.error('Por favor completa todos los campos requeridos');
      return;
    }

    this.guardando = true;

    try {
      // ✅ IMPORTANTE: Obtener el valor incluso si está disabled
      const formValue = this.form.getRawValue();  // getRawValue() incluye campos disabled

      const recluso = {
        ...formValue,
        fechaNacimiento: Timestamp.fromDate(new Date(formValue.fechaNacimiento)),
        fechaIngreso: Timestamp.fromDate(new Date(formValue.fechaIngreso)),
        sentencia: formValue.sentencia ? Number(formValue.sentencia) : null
      };

      const resultado = await this.reclusosService.agregarRecluso(recluso);

      if (resultado.success) {
        this.notificacionService.success(resultado.message);
        // ✅ No hacer form.reset() aquí, cerrar() ya lo hace
        this.reclusoAgregado.emit();
        this.cerrar();
      }
    } catch (error) {
      this.notificacionService.error('Error inesperado al guardar');
      console.error(error);
    } finally {
      this.guardando = false;
    }
  }

  cerrar(): void {
    this.showModal = false;
    this.showModalChange.emit(false);
    this.form.reset();  // ✅ Resetear para próxima apertura
  }
}