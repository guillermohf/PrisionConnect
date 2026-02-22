// src/app/features/abogados/abogados.component.ts

import {
  Component,
  inject,
  OnInit,
  computed,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AbogadosService } from '@core/services/abogados.service';
import { NotificacionService } from '@core/services/notificacion.service';

import { Abogado } from '@core/models/abogado.interface';
import { TipoAbogado } from '@core/models/enums.interface';

import { DataTableComponent } from '@shared/datatable/datatable.component';
import { AbogadoAgregarModalComponent } from './modal/abogados-agregar-modal/abogados-agregar-modal.component';
import { AbogadoEditarModalComponent } from './modal/abogados-editar-modal/abogados-editar-modal.component';
import { AbogadoDetalleModalComponent } from './modal/abogados-detalle-modal/abogados-detalle-modal.component';
import { ReclusosAsignadosComponent } from './modal/reclusos-asignados-modal/reclusos-asignados-modal.component';

interface FiltrosAbogados {
  busqueda: string;
  tipo?: TipoAbogado;
  activo: boolean;
}

@Component({
  selector: 'prisionConnect-abogados',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DataTableComponent,
    AbogadoAgregarModalComponent,
    AbogadoEditarModalComponent,
    AbogadoDetalleModalComponent,
    ReclusosAsignadosComponent
  ],
  templateUrl: './abogados.component.html'
})
export default class AbogadosComponent implements OnInit {

  // ========================
  // Inyecciones
  // ========================
  private abogadosService = inject(AbogadosService);
  private notificacionService = inject(NotificacionService);

  // ========================
  // Enums / Expuestos al HTML
  // ========================
  TipoAbogado = TipoAbogado;

  // ========================
  // Signals del servicio
  // ========================
  abogados = this.abogadosService.abogados;
  loading = this.abogadosService.loading;

  estadisticas = computed(() =>
    this.abogadosService.obtenerEstadisticas()
  );

  // ========================
  // Filtros (SIGNAL)
  // ========================
  filtros = signal<FiltrosAbogados>({
    busqueda: '',
    tipo: undefined,
    activo: true
  });

  // ========================
  // Lista filtrada (COMPUTED)
  // ========================
  abogadosFiltrados = computed<Abogado[]>(() => {
    return this.abogadosService.obtenerAbogadosFiltrados(
      this.filtros()
    );
  });

  // ========================
  // Estado UI
  // ========================
  mostrarModalAgregar = false;
  mostrarModalEditar = false;
  mostrarModalDetalle = false;
  mostrarModalReclusos = false;

  abogadoSeleccionado: Abogado | null = null;

  // ========================
  // Columnas DataTable
  // ========================
  columnas = [
    { key: 'cedula', label: 'CÉDULA' },
    { key: 'nombreCompleto', label: 'NOMBRE COMPLETO' },
    { key: 'exequatur', label: 'EXEQUATUR' },
    { key: 'tipo', label: 'TIPO' },
    { key: 'institucion', label: 'INSTITUCIÓN' },
    { key: 'telefono', label: 'TELÉFONO' },
    { key: 'activo', label: 'ESTADO' }
  ];

  ngOnInit(): void {
    // Nada que hacer aquí 🎉
  }

  // ========================
  // Filtros
  // ========================
  actualizarFiltro<K extends keyof FiltrosAbogados>(
    key: K,
    value: FiltrosAbogados[K]
  ): void {
    this.filtros.update(f => ({
      ...f,
      [key]: value
    }));
  }

  limpiarFiltros(): void {
    this.filtros.set({
      busqueda: '',
      tipo: undefined,
      activo: true
    });
  }

  // ========================
  // Acciones
  // ========================
  abrirModalAgregar(): void {
    this.mostrarModalAgregar = true;
  }

  verDetalle(abogado: Abogado): void {
    this.abogadoSeleccionado = abogado;
    this.mostrarModalDetalle = true;
  }

  editarAbogado(abogado: Abogado): void {
    this.abogadoSeleccionado = abogado;
    this.mostrarModalEditar = true;
  }

  verReclusosAsignados(abogado: Abogado): void {
    this.abogadoSeleccionado = abogado;
    this.mostrarModalReclusos = true;
  }

  async confirmarEliminar(abogado: Abogado): Promise<void> {
    const confirmar = await this.notificacionService.confirmar(
      'Eliminar abogado',
      `¿Estás seguro de que deseas eliminar al abogado ${abogado.nombreCompleto}?`,
      'Sí, eliminar',
      'Cancelar'
    );

    if (!confirmar || !abogado.id) return;

    const resultado = await this.abogadosService.eliminarAbogado(abogado.id);

    if (resultado.success) {
      this.notificacionService.success(
        resultado.message || 'Abogado eliminado correctamente'
      );
      // NO hay que refrescar nada 😎
    } else {
      this.notificacionService.error(
        resultado.message || 'Error al eliminar el abogado'
      );
    }
  }

  // ========================
  // Callbacks de modales
  // ========================
  onAbogadoAgregado(): void {
    this.notificacionService.success('Abogado registrado exitosamente');
  }

  onAbogadoActualizado(): void {
    this.notificacionService.success('Abogado actualizado exitosamente');
  }
}
