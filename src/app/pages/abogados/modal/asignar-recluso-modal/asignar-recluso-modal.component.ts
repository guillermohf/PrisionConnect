// src/app/features/abogados/components/asignar-recluso-modal/asignar-recluso-modal.component.ts

import { Component, EventEmitter, Input, Output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { RelacionesAbogadosService } from '@core/services/relaciones-abogados.service';
import { ReclusosService } from '@core/services/reclusos.service';
import { NotificacionService } from '@core/services/notificacion.service';
import { Abogado } from '@core/models/abogado.interface';
import { Recluso } from '@core/models/recluso.interface';
import { ModalComponent } from '@shared/modal/modal.component';
import { ButtonComponent } from "@shared/button/buttton.component";
import { InputComponent } from '@shared/input/input.component';

interface ReclusoSeleccionado {
  recluso: Recluso;
  numeroCaso: string;
  fechaVencimiento?: Date;
  observaciones?: string;
}

@Component({
  selector: 'prisionConnect-asignar-recluso-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ModalComponent,
    ButtonComponent,
    InputComponent
],
  templateUrl: './asignar-recluso-modal.component.html'
})
export class AsignarReclusoModalComponent implements OnInit {
  @Input() isOpen = false;
  @Input() abogado: Abogado | null = null;
  @Output() isOpenChange = new EventEmitter<boolean>();
  @Output() reclusoAsignado = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private relacionesService = inject(RelacionesAbogadosService);
  private reclusosService = inject(ReclusosService);
  private notificacionService = inject(NotificacionService);

  // Lista de reclusos disponibles
  reclusosDisponibles: Recluso[] = [];
  reclusosFiltrados: Recluso[] = [];
  busquedaRecluso = '';

  // Modo de asignación
  modoAsignacion: 'individual' | 'multiple' = 'individual';

  // Lista de reclusos seleccionados (modo múltiple)
  reclusosSeleccionados: ReclusoSeleccionado[] = [];
  
  guardando = false;

  // Formulario individual
  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      reclusoId: ['', Validators.required],
      numeroCaso: ['', Validators.required],
      fechaVencimiento: [''],
      observaciones: ['']
    });
  }

  async ngOnInit(): Promise<void> {
    await this.cargarReclusos();
  }

  async cargarReclusos(): Promise<void> {
    this.reclusosDisponibles = this.reclusosService.reclusos()
      .filter(r => r.activo);
    
    this.reclusosFiltrados = [...this.reclusosDisponibles];
  }

  filtrarReclusos(): void {
    const busqueda = this.busquedaRecluso.toLowerCase();
    
    if (!busqueda) {
      this.reclusosFiltrados = [...this.reclusosDisponibles];
      return;
    }

    this.reclusosFiltrados = this.reclusosDisponibles.filter(r =>
      r.nombreCompleto.toLowerCase().includes(busqueda) ||
      (r.cedula && r.cedula.includes(busqueda)) ||
      (r.numeroIdentificacion && r.numeroIdentificacion.includes(busqueda))
    );
  }

  // Cambiar modo de asignación
  cambiarModo(modo: 'individual' | 'multiple'): void {
    this.modoAsignacion = modo;
    
    if (modo === 'individual') {
      this.reclusosSeleccionados = [];
    } else {
      this.form.reset();
    }
  }

  onBuscarRecluso(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  this.busquedaRecluso = value;
  this.filtrarReclusos();
}

get opcionesReclusos() {
  return this.reclusosFiltrados.map(r => ({
    value: r.id,
    label: `${r.nombreCompleto} - ${r.numeroIdentificacion}`
  }));
}


  // Agregar recluso a la lista múltiple
  agregarRecluso(): void {
    const reclusoId = this.form.get('reclusoId')?.value;
    const numeroCaso = this.form.get('numeroCaso')?.value;

    if (!reclusoId || !numeroCaso) {
      this.notificacionService.error('Debes seleccionar recluso y número de caso');
      return;
    }

    const recluso = this.reclusosDisponibles.find(r => r.id === reclusoId);
    
    if (!recluso) {
      this.notificacionService.error('Recluso no encontrado');
      return;
    }

    // Verificar si ya está en la lista
    const yaExiste = this.reclusosSeleccionados.some(
      rs => rs.recluso.id === reclusoId
    );

    if (yaExiste) {
      this.notificacionService.error('Este recluso ya está en la lista');
      return;
    }

    // Agregar a la lista
    this.reclusosSeleccionados.push({
      recluso,
      numeroCaso,
      fechaVencimiento: this.form.get('fechaVencimiento')?.value,
      observaciones: this.form.get('observaciones')?.value
    });

    // Limpiar formulario
    this.form.patchValue({
      reclusoId: '',
      numeroCaso: '',
      fechaVencimiento: '',
      observaciones: ''
    });

    this.notificacionService.success(`${recluso.nombreCompleto} agregado a la lista`);
  }

  // Eliminar recluso de la lista
  eliminarDeLista(index: number): void {
    this.reclusosSeleccionados.splice(index, 1);
  }

  // Guardar individual
  async guardarIndividual(): Promise<void> {
    if (!this.form.valid || !this.abogado?.id) {
      this.notificacionService.error('Por favor completa todos los campos requeridos');
      return;
    }

    this.guardando = true;

    try {
      const formValue = this.form.value;
      const recluso = this.reclusosDisponibles.find(r => r.id === formValue.reclusoId);
      
      if (!recluso) {
        this.notificacionService.error('Recluso no encontrado');
        this.guardando = false;
        return;
      }

      const resultado = await this.relacionesService.asignarAbogado({
        abogadoId: this.abogado.id,
        abogadoNombre: this.abogado.nombreCompleto,
        reclusoId: formValue.reclusoId,
        reclusoNombre: recluso.nombreCompleto,
        numeroCaso: formValue.numeroCaso,
        fechaVencimiento: formValue.fechaVencimiento || undefined,
        observaciones: formValue.observaciones
      });

      if (resultado.success) {
        this.notificacionService.success(resultado.message);
        this.form.reset();
        this.reclusoAsignado.emit();
        this.cerrar();
      } else {
        this.notificacionService.error(resultado.message);
      }
    } catch (error) {
      this.notificacionService.error('Error inesperado al asignar recluso');
      console.error(error);
    } finally {
      this.guardando = false;
    }
  }

  // Guardar múltiples reclusos
  async guardarMultiple(): Promise<void> {
    if (this.reclusosSeleccionados.length === 0) {
      this.notificacionService.error('Debes agregar al menos un recluso a la lista');
      return;
    }

    if (!this.abogado?.id) {
      this.notificacionService.error('No se puede identificar el abogado');
      return;
    }

    this.guardando = true;

    try {
      let asignados = 0;
      let errores = 0;

      // Asignar cada recluso
      for (const rs of this.reclusosSeleccionados) {
        const resultado = await this.relacionesService.asignarAbogado({
          abogadoId: this.abogado.id,
          abogadoNombre: this.abogado.nombreCompleto,
          reclusoId: rs.recluso.id!,
          reclusoNombre: rs.recluso.nombreCompleto,
          numeroCaso: rs.numeroCaso,
          fechaVencimiento: rs.fechaVencimiento || undefined,
          observaciones: rs.observaciones
        });

        if (resultado.success) {
          asignados++;
        } else {
          errores++;
        }
      }

      // Mostrar resultado
      if (errores === 0) {
        this.notificacionService.success(
          `✅ ${asignados} recluso${asignados > 1 ? 's' : ''} asignado${asignados > 1 ? 's' : ''} exitosamente`
        );
        this.reclusosSeleccionados = [];
        this.reclusoAsignado.emit();
        this.cerrar();
      } else {
        this.notificacionService.error(
          `⚠️ ${asignados} asignados, ${errores} errores (posibles duplicados)`
        );
      }
    } catch (error) {
      this.notificacionService.error('Error inesperado al asignar reclusos');
      console.error(error);
    } finally {
      this.guardando = false;
    }
  }

  // Guardar según el modo
  async guardar(): Promise<void> {
    if (this.modoAsignacion === 'individual') {
      await this.guardarIndividual();
    } else {
      await this.guardarMultiple();
    }
  }

  cerrar(): void {
    this.isOpen = false;
    this.isOpenChange.emit(false);
    this.form.reset();
    this.busquedaRecluso = '';
    this.reclusosSeleccionados = [];
    this.modoAsignacion = 'individual';
  }
}