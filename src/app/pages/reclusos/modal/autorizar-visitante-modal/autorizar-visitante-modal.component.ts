// src/app/features/reclusos/components/autorizar-visitante-modal/autorizar-visitante-modal.component.ts

import { Component, EventEmitter, Input, Output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { RelacionesVisitantesService } from '@core/services/relaciones-Visitantes.service';
import { VisitantesService } from '@core/services/visitantes.service';
import { NotificacionService } from '@core/services/notificacion.service';
import { Recluso } from '@core/models/recluso.interface';
import { Visitante } from '@core/models/visitante.interface';
import { Parentesco } from '@core/models/enums.interface';
import { ModalComponent } from '@shared/modal/modal.component';
import { ButtonComponent } from '@shared/button/buttton.component';
import { InputComponent } from '@shared/input/input.component';

interface VisitanteSeleccionado {
  visitante: Visitante;
  parentesco: Parentesco;
  fechaVencimiento?: Date;
  observaciones?: string;
}

@Component({
  selector: 'prisionConnect-autorizar-visitante-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ModalComponent
],
  templateUrl: './autorizar-visitante-modal.component.html'
})
export class AutorizarVisitanteModalComponent implements OnInit {
  @Input() showModal = false;
  @Input() recluso: Recluso | null = null;
  @Output() showModalChange = new EventEmitter<boolean>();
  @Output() visitanteAutorizado = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private relacionesService = inject(RelacionesVisitantesService);
  private visitantesService = inject(VisitantesService);
  private notificacionService = inject(NotificacionService);

  // Lista de visitantes disponibles
  visitantesDisponibles: Visitante[] = [];
  visitantesFiltrados: Visitante[] = [];
  busquedaVisitante = '';

  // ⭐ NUEVO: Lista de visitantes seleccionados
  visitantesSeleccionados: VisitanteSeleccionado[] = [];
  
  // ⭐ NUEVO: Modo de autorización
  modoAutorizacion: 'individual' | 'multiple' = 'individual';

  guardando = false;

  // Formulario individual
  form: FormGroup;

  // Enum para el template
  Parentesco = Parentesco;

  constructor() {
    this.form = this.fb.group({
      visitanteId: ['', Validators.required],
      parentesco: ['', Validators.required],
      fechaVencimiento: [''],
      observaciones: ['']
    });
  }

  async ngOnInit(): Promise<void> {
    await this.cargarVisitantes();
  }

  async cargarVisitantes(): Promise<void> {
    this.visitantesDisponibles = this.visitantesService.visitantes()
      .filter(v => v.activo);
    
    this.visitantesFiltrados = [...this.visitantesDisponibles];
  }

  filtrarVisitantes(): void {
    const busqueda = this.busquedaVisitante.toLowerCase();
    
    if (!busqueda) {
      this.visitantesFiltrados = [...this.visitantesDisponibles];
      return;
    }

    this.visitantesFiltrados = this.visitantesDisponibles.filter(v =>
      v.nombreCompleto.toLowerCase().includes(busqueda) ||
      (v.cedula && v.cedula.includes(busqueda))
    );
  }

  // ⭐ NUEVO: Cambiar modo de autorización
  cambiarModo(modo: 'individual' | 'multiple'): void {
    this.modoAutorizacion = modo;
    
    // Limpiar al cambiar de modo
    if (modo === 'individual') {
      this.visitantesSeleccionados = [];
    } else {
      this.form.reset();
    }
  }

  // ⭐ NUEVO: Agregar visitante a la lista múltiple
  agregarVisitante(): void {
    const visitanteId = this.form.get('visitanteId')?.value;
    const parentesco = this.form.get('parentesco')?.value;

    if (!visitanteId || !parentesco) {
      this.notificacionService.error('Debes seleccionar visitante y parentesco');
      return;
    }

    const visitante = this.visitantesDisponibles.find(v => v.id === visitanteId);
    
    if (!visitante) {
      this.notificacionService.error('Visitante no encontrado');
      return;
    }

    // Verificar si ya está en la lista
    const yaExiste = this.visitantesSeleccionados.some(
      vs => vs.visitante.id === visitanteId
    );

    if (yaExiste) {
      this.notificacionService.error('Este visitante ya está en la lista');
      return;
    }

    // Agregar a la lista
    this.visitantesSeleccionados.push({
      visitante,
      parentesco,
      fechaVencimiento: this.form.get('fechaVencimiento')?.value,
      observaciones: this.form.get('observaciones')?.value
    });

    // Limpiar formulario
    this.form.patchValue({
      visitanteId: '',
      parentesco: '',
      fechaVencimiento: '',
      observaciones: ''
    });

    this.notificacionService.success(`${visitante.nombreCompleto} agregado a la lista`);
  }

  // ⭐ NUEVO: Eliminar visitante de la lista
  eliminarDeLista(index: number): void {
    this.visitantesSeleccionados.splice(index, 1);
  }

  // Guardar individual (modo original)
  async guardarIndividual(): Promise<void> {
    if (!this.form.valid || !this.recluso?.id) {
      this.notificacionService.error('Por favor completa todos los campos requeridos');
      return;
    }

    this.guardando = true;

    try {
      const formValue = this.form.value;
      const visitante = this.visitantesDisponibles.find(v => v.id === formValue.visitanteId);
      
      if (!visitante) {
        this.notificacionService.error('Visitante no encontrado');
        this.guardando = false;
        return;
      }

      const resultado = await this.relacionesService.autorizarVisitante({
        reclusoId: this.recluso.id,
        reclusoNombre: this.recluso.nombreCompleto,
        visitanteId: formValue.visitanteId,
        visitanteNombre: visitante.nombreCompleto,
        parentesco: formValue.parentesco,
        fechaVencimiento: formValue.fechaVencimiento || undefined,
        observaciones: formValue.observaciones
      });

      if (resultado.success) {
        this.notificacionService.success(resultado.message);
        this.form.reset();
        this.visitanteAutorizado.emit();
        this.cerrar();
      } else {
        this.notificacionService.error(resultado.message);
      }
    } catch (error) {
      this.notificacionService.error('Error inesperado al autorizar visitante');
      console.error(error);
    } finally {
      this.guardando = false;
    }
  }

  // ⭐ NUEVO: Guardar múltiples visitantes
  async guardarMultiple(): Promise<void> {
    if (this.visitantesSeleccionados.length === 0) {
      this.notificacionService.error('Debes agregar al menos un visitante a la lista');
      return;
    }

    if (!this.recluso?.id) {
      this.notificacionService.error('No se puede identificar el recluso');
      return;
    }

    this.guardando = true;

    try {
      let autorizados = 0;
      let errores = 0;

      // Autorizar cada visitante
      for (const vs of this.visitantesSeleccionados) {
        const resultado = await this.relacionesService.autorizarVisitante({
          reclusoId: this.recluso.id,
          reclusoNombre: this.recluso.nombreCompleto,
          visitanteId: vs.visitante.id!,
          visitanteNombre: vs.visitante.nombreCompleto,
          parentesco: vs.parentesco,
          fechaVencimiento: vs.fechaVencimiento || undefined,
          observaciones: vs.observaciones
        });

        if (resultado.success) {
          autorizados++;
        } else {
          errores++;
        }
      }

      // Mostrar resultado
      if (errores === 0) {
        this.notificacionService.success(
          `✅ ${autorizados} visitante${autorizados > 1 ? 's' : ''} autorizado${autorizados > 1 ? 's' : ''} exitosamente`
        );
        this.visitantesSeleccionados = [];
        this.visitanteAutorizado.emit();
        this.cerrar();
      } else {
        this.notificacionService.error(
          `⚠️ ${autorizados} autorizados, ${errores} errores (posibles duplicados)`
        );
      }
    } catch (error) {
      this.notificacionService.error('Error inesperado al autorizar visitantes');
      console.error(error);
    } finally {
      this.guardando = false;
    }
  }

  // Guardar según el modo
  async guardar(): Promise<void> {
    if (this.modoAutorizacion === 'individual') {
      await this.guardarIndividual();
    } else {
      await this.guardarMultiple();
    }
  }

  cerrar(): void {
    this.showModal = false;
    this.showModalChange.emit(false);
    this.form.reset();
    this.busquedaVisitante = '';
    this.visitantesSeleccionados = [];
    this.modoAutorizacion = 'individual';
  }
}