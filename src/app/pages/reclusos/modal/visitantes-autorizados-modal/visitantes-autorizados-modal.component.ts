// src/app/features/reclusos/components/visitantes-autorizados/visitantes-autorizados.component.ts

import { Component, Input, OnInit, inject, OnChanges, SimpleChanges, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RelacionesVisitantesService } from '@core/services/relaciones-Visitantes.service';
import { NotificacionService } from '@core/services/notificacion.service';
import { Recluso } from '@core/models/recluso.interface';
import { RelacionVisitante } from '@core/models/relacion.interface';
import { ModalComponent } from '@shared/modal/modal.component';
import { AutorizarVisitanteModalComponent } from '../autorizar-visitante-modal/autorizar-visitante-modal.component';
import { ButtonComponent } from '@shared/button/buttton.component';

@Component({
  selector: 'prisionConnect-visitantes-autorizados-modal',
  standalone: true,
  imports: [
    CommonModule,
    ModalComponent,
    AutorizarVisitanteModalComponent
],
  templateUrl: './visitantes-autorizados-modal.component.html'
})
export class VisitantesAutorizadosComponent implements OnInit, OnChanges {
  @Input() recluso: Recluso | null = null;
  @Input() showModal = false;
  @Output() showModalChange = new EventEmitter<boolean>();

  private relacionesService = inject(RelacionesVisitantesService);
  private notificacionService = inject(NotificacionService);

  visitantesAutorizados: RelacionVisitante[] = [];
  loading = false;
  mostrarModalAutorizar = signal(false);

  ngOnInit(): void {
    if (this.recluso?.id && this.showModal) {
      this.cargarVisitantes();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Cargar cuando se abre el modal o cambia el recluso
    if (changes['showModal'] && this.showModal && this.recluso?.id) {
      this.cargarVisitantes();
    } else if (changes['recluso'] && this.recluso?.id && this.showModal) {
      this.cargarVisitantes();
    }
  }

  async cargarVisitantes(): Promise<void> {
    if (!this.recluso?.id) return;

    this.loading = true;
    try {
      this.visitantesAutorizados = await this.relacionesService.obtenerVisitantesDeRecluso(
        this.recluso.id
      );
    } catch (error) {
      console.error('Error cargando visitantes:', error);
      this.notificacionService.error('Error al cargar visitantes autorizados');
    } finally {
      this.loading = false;
    }
  }

  abrirModalAutorizar(): void {
    this.mostrarModalAutorizar.set(true);
  }

  async onVisitanteAutorizado(): Promise<void> {
    this.mostrarModalAutorizar.set(false);
    await this.cargarVisitantes();
  }

  async desautorizar(relacion: RelacionVisitante): Promise<void> {
    const confirmar = await this.notificacionService.confirmar(
      'Remover Visitante',
      `¿Estás seguro de desautorizar a ${relacion.visitanteNombre}?`,
      'Sí, remover',
      'Cancelar'
    );

    if (confirmar && relacion.id) {
      const resultado = await this.relacionesService.desautorizarVisitante(relacion.id);
      
      if (resultado.success) {
        this.notificacionService.success(resultado.message);
        await this.cargarVisitantes();
      } else {
        this.notificacionService.error(resultado.message);
      }
    }
  }

  formatearFecha(timestamp: any): string {
    if (!timestamp) return 'N/A';
    const fecha = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return fecha.toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  estaVencida(relacion: RelacionVisitante): boolean {
    if (!relacion.fechaVencimiento) return false;
    
    const fechaVenc = relacion.fechaVencimiento as any;
    const fecha = fechaVenc.toDate ? fechaVenc.toDate() : new Date(fechaVenc);
    return fecha < new Date();
  }

  cerrar(): void {
    this.showModal = false;
    this.showModalChange.emit(false);
  }
}