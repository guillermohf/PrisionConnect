// visitantes.component.ts

import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VisitantesService } from '@core/services/visitantes.service';
import { NotificacionService } from '@core/services/notificacion.service';
import { Visitante } from '@core/models';

// ⭐ IMPORTANTE: Importar los componentes de modales
import { VisitanteAgregarModalComponent } from './modal/visitante-agregar-modal/visitante-agregar-modal.component';
import { VisitanteEditarModalComponent } from './modal/visitante-editar-modal/visitante-editar-modal.component';
import { VisitanteDetalleModalComponent } from './modal/visitante-detalle-modal/visitante-detalle-modal.component';
import { DataTableComponent } from 'src/app/shared/datatable/datatable.component';
import { VisitaDetalleModalComponent } from "../recepcion/modal/visita-detalle-modal/visita-detalle-modal.component";

// ⭐ IMPORTANTE: Importar el DataTable

@Component({
  selector: 'prisionConnect-visitantes',
  standalone: true,
  imports: [
    CommonModule,
    DataTableComponent,
    VisitanteDetalleModalComponent,
    VisitanteEditarModalComponent,
    VisitanteAgregarModalComponent
],
  templateUrl: './visitantes.component.html'
})
export default class VisitantesComponent implements OnInit {
  private visitantesService = inject(VisitantesService);
  private notificacion = inject(NotificacionService);

  // Señales reactivas
  visitantes = this.visitantesService.visitantes;
  loading = this.visitantesService.loading;

  // Estados de modales
  showAgregarModal = signal(false);
  showEditarModal = signal(false);
  showDetalleModal = signal(false);
  visitanteSeleccionado = signal<Visitante | null>(null);

  // Filtros
  filtroEstado = signal<'todos' | 'activos' | 'inactivos'>('activos');

  // Computed - Visitantes filtrados
  visitantesFiltrados = computed(() => {
    const todos = this.visitantes();
    
    switch (this.filtroEstado()) {
      case 'activos':
        return todos.filter(v => v.activo);
      case 'inactivos':
        return todos.filter(v => !v.activo);
      default:
        return todos;
    }
  });

  // Computed - Estadísticas
  totalVisitantes = computed(() => this.visitantes().length);
  
  totalActivos = computed(() => 
    this.visitantes().filter(v => v.activo).length
  );
  
  totalInactivos = computed(() => 
    this.visitantes().filter(v => !v.activo).length
  );
  
  totalVisitasRealizadas = computed(() => 
    this.visitantes().reduce((total, v) => total + v.totalVisitas, 0)
  );

  ngOnInit(): void {
    this.recargarDatos();
  }

  // ============================================
  // GESTIÓN DE MODALES
  // ============================================

  abrirAgregar(): void {
    this.visitanteSeleccionado.set(null);
    this.showAgregarModal.set(true);
  }

  cerrarAgregar(): void {
    this.showAgregarModal.set(false);
    this.visitanteSeleccionado.set(null);
  }

  editarVisitante(visitante: Visitante): void {
    this.visitanteSeleccionado.set(visitante);
    this.showEditarModal.set(true);
  }

  cerrarEditar(): void {
    this.showEditarModal.set(false);
    this.visitanteSeleccionado.set(null);
  }

  verDetalle(visitante: Visitante): void {
    this.visitanteSeleccionado.set(visitante);
    this.showDetalleModal.set(true);
  }

  cerrarDetalle(): void {
    this.showDetalleModal.set(false);
    this.visitanteSeleccionado.set(null);
  }

  editarDesdeDetalle(visitante: Visitante): void {
    this.cerrarDetalle();
    this.editarVisitante(visitante);
  }

  onVisitanteGuardado(visitante: Visitante): void {
    console.log('Visitante guardado:', visitante);
  }

  // ============================================
  // ACCIONES
  // ============================================

  async eliminarVisitante(visitante: Visitante): Promise<void> {
    const confirmar = await this.notificacion.confirmarEliminacion(
      `al visitante ${visitante.nombreCompleto}`
    );

    if (!confirmar) return;

    const resultado = await this.visitantesService.desactivar(visitante.id!);

    if (resultado.exito) {
      this.notificacion.toast('Visitante desactivado', 'success');
    } else {
      this.notificacion.error(resultado.mensaje);
    }
  }

  async activarVisitante(visitante: Visitante): Promise<void> {
    const confirmar = await this.notificacion.confirmar(
      '¿Activar visitante?',
      `Se activará a ${visitante.nombreCompleto}`,
      'Sí, activar'
    );

    if (!confirmar) return

    const resultado = await this.visitantesService.activar(visitante.id!);

    if (resultado.exito) {
      this.notificacion.toast('Visitante activado', 'success');
    } else {
      this.notificacion.error(resultado.mensaje);
    }
  }

  // ============================================
  // FILTROS
  // ============================================

  cambiarFiltro(filtro: 'todos' | 'activos' | 'inactivos'): void {
    this.filtroEstado.set(filtro);
  }

  // ============================================
  // UTILIDADES
  // ============================================

  async recargarDatos(): Promise<void> {
    // El servicio ya carga automáticamente en el constructor
  }

  exportarCSV(): void {
    const visitantes = this.visitantesFiltrados();
    
    const headers = ['Cédula', 'Nombre', 'Apellido', 'Teléfono', 'Email', 'Estado', 'Total Visitas'];
    const rows = visitantes.map(v => [
      v.cedula,
      v.nombre,
      v.apellido,
      v.telefono,
      v.email || '',
      v.activo ? 'Activo' : 'Inactivo',
      v.totalVisitas.toString()
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visitantes-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    this.notificacion.toast('CSV exportado', 'success');
  }
}