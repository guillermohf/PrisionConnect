// src/app/features/reclusos/components/recluso-editar-modal/recluso-editar-modal.component.ts

import { Component, EventEmitter, Input, Output, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Timestamp } from '@angular/fire/firestore';
import { ReclusosService } from '@core/services/reclusos.service';
import { NotificacionService } from '@core/services/notificacion.service';
import { Recluso } from '@core/models/recluso.interface';
import { SituacionLegal, EstadoCivil, EstadoRecluso } from '@core/models/enums.interface';
import { InputComponent } from '@shared/input/input.component';
import { ModalComponent } from '@shared/modal/modal.component';
import { ButtonComponent } from '@shared/button/buttton.component';
import { TelefonoMaskDirective } from "@shared/directives/telefono.mask.directive";
import { telefonoDominicanoValidator } from '@shared/validators/custom.validators';

@Component({
  selector: 'prisionConnect-recluso-editar-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalComponent,
    TelefonoMaskDirective
],
  templateUrl: './reclusos-editar-modal.component.html'
})
export class ReclusoEditarModalComponent implements OnChanges {
  @Input() showModal = false;
  @Input() recluso: Recluso | null = null;
  @Output() showModalChange = new EventEmitter<boolean>();
  @Output() reclusoActualizado = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private reclusosService = inject(ReclusosService);
  private notificacionService = inject(NotificacionService);

  form: FormGroup;
  guardando = false;

  // Enums para el template
  SituacionLegal = SituacionLegal;
  EstadoRecluso = EstadoRecluso;
  EstadoCivil = EstadoCivil;

  constructor() {
    this.form = this.fb.group({
      // Identificación
      numeroIdentificacion: ['', Validators.required],
      numeroExpediente: [''],
      cedula: ['', Validators.required],
      
      // Información Personal
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      fechaNacimiento: ['', Validators.required],
      sexo: ['', Validators.required],
      nacionalidad: ['', Validators.required],
      estadoCivil: [''],
      
      // Contacto
      direccion: ['', Validators.required],
      telefono: ['', [ telefonoDominicanoValidator()]],
      nombreContactoEmergencia: ['', Validators.required],
      telefonoEmergencia: ['', [Validators.required, telefonoDominicanoValidator()]],
      
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
    if (changes['recluso'] && this.recluso) {
      this.cargarDatos();
    }
  }

  private cargarDatos(): void {
    if (!this.recluso) return;

    this.form.patchValue({
      numeroIdentificacion: this.recluso.numeroIdentificacion,
      numeroExpediente: this.recluso.numeroExpediente || '',
      cedula: this.recluso.cedula || '',
      nombre: this.recluso.nombre,
      apellido: this.recluso.apellido,
      fechaNacimiento: this.formatDate(this.recluso.fechaNacimiento),
      sexo: this.recluso.sexo || '',
      nacionalidad: this.recluso.nacionalidad || '',
      estadoCivil: this.recluso.estadoCivil || '',
      direccion: this.recluso.direccion || '',
      telefono: this.recluso.telefono || '',
      nombreContactoEmergencia: this.recluso.nombreContactoEmergencia || '',
      telefonoEmergencia: this.recluso.telefonoEmergencia || '',
      pabellon: this.recluso.pabellon,
      celda: this.recluso.celda,
      fechaIngreso: this.formatDate(this.recluso.fechaIngreso),
      situacionLegal: this.recluso.situacionLegal,
      estado: this.recluso.estado || EstadoRecluso.ACTIVO,
      delito: this.recluso.delito || '',
      sentencia: this.recluso.sentencia || '',
      observaciones: this.recluso.observaciones || ''
    });
  }

  private formatDate(timestamp: any): string {
    if (!timestamp) return '';
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    return date.toISOString().split('T')[0];
  }

  async guardar(): Promise<void> {
    if (!this.form.valid || !this.recluso?.id) {
      this.notificacionService.error('Por favor completa todos los campos requeridos');
      return;
    }

    this.guardando = true;

    try {
      const formValue = this.form.value;
      
      const datosActualizados = {
        ...formValue,
        fechaNacimiento: Timestamp.fromDate(new Date(formValue.fechaNacimiento)),
        fechaIngreso: Timestamp.fromDate(new Date(formValue.fechaIngreso)),
        sentencia: formValue.sentencia ? Number(formValue.sentencia) : null
      };

      const resultado = await this.reclusosService.actualizarRecluso(
        this.recluso.id,
        datosActualizados
      );

      if (resultado.success) {
        this.notificacionService.success(resultado.message);
        this.reclusoActualizado.emit();
        this.cerrar();
      } else {
        this.notificacionService.error(resultado.message);
      }
    } catch (error) {
      this.notificacionService.error('Error inesperado al actualizar');
      console.error(error);
    } finally {
      this.guardando = false;
    }
  }

  cerrar(): void {
    this.showModal = false;
    this.showModalChange.emit(false);
    this.form.reset();
  }
}