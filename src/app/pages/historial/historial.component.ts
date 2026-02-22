// src/app/pages/historial/historial.component.ts
// 🎨 BRANDING: #006666, #008080, #1A2626

import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VisitasService } from '@core/services/visitas.service';
import { Visita, FiltrosVisitas } from '@core/models/visitas.interface';
import { EstadoVisita, TipoVisita } from '@core/models/enums.interface';
import { DataTableComponent } from '@shared/datatable/datatable.component';
import { VisitaDetalleModalComponent } from '../recepcion/modal/visita-detalle-modal/visita-detalle-modal.component';
import { NotificacionService } from '@core/services/notificacion.service';

@Component({
  selector: 'prisionConnect-historial',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DataTableComponent,
    VisitaDetalleModalComponent
  ],
  templateUrl: './historial.component.html'
})
export default class HistorialComponent implements OnInit {
  private visitasService = inject(VisitasService);
  private notificacionService = inject(NotificacionService);
  
  EstadoVisita = EstadoVisita;
  TipoVisita = TipoVisita;

  loading = this.visitasService.loading;

  // Solo visitas finalizadas o canceladas
  visitasHistorial = computed(() => 
    this.visitasService.visitas().filter(v => 
      v.estado === EstadoVisita.FINALIZADA || 
      v.estado === EstadoVisita.CANCELADA
    )
  );

  // Filtros
  filtros: FiltrosVisitas = {};
  visitasFiltradas: Visita[] = [];
  busqueda: string = '';

  // Rango de fechas
  fechaInicio: string = '';
  fechaFin: string = '';

  // Modal
  mostrarModalDetalle = false;
  visitaSeleccionada: Visita | null = null;

  // Columnas
  columnas = [
    { key: 'id', label: 'ID', hidden: true },
    { key: 'fechaVisita', label: 'FECHA' },
    { key: 'reclusoNombre', label: 'RECLUSO' },
    { key: 'tipo', label: 'TIPO' },
    { key: 'estado', label: 'ESTADO' },
    { key: 'duracionVisitaReal', label: 'DURACIÓN (min)' },
    { key: 'areaVisita', label: 'ÁREA' },
    { key: 'visitantesPresentes', label: 'VISITANTES' }
  ];

  // Estadísticas del historial
  totalVisitas = computed(() => this.visitasFiltradas.length);
  
  visitasFinalizadas = computed(() => 
    this.visitasFiltradas.filter(v => v.estado === EstadoVisita.FINALIZADA).length
  );
  
  visitasCanceladas = computed(() => 
    this.visitasFiltradas.filter(v => v.estado === EstadoVisita.CANCELADA).length
  );
  
  visitasConIncidencias = computed(() => 
    this.visitasFiltradas.filter(v => v.incidencias && v.incidencias.length > 0).length
  );

  duracionPromedio = computed(() => {
    const visitasConDuracion = this.visitasFiltradas.filter(v => v.duracionVisitaReal);
    if (visitasConDuracion.length === 0) return 0;
    const suma = visitasConDuracion.reduce((acc, v) => acc + (v.duracionVisitaReal || 0), 0);
    return Math.round(suma / visitasConDuracion.length);
  });

  ngOnInit(): void {
    this.inicializarFechas();
    this.aplicarFiltros();
  }

  inicializarFechas(): void {
    const hoy = new Date();
    const hace30Dias = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    this.fechaInicio = this.formatearFechaInput(hace30Dias);
    this.fechaFin = this.formatearFechaInput(hoy);
  }

  formatearFechaInput(fecha: Date): string {
    return fecha.toISOString().split('T')[0];
  }

  aplicarFiltros(): void {
    let resultado = this.visitasHistorial();

    // Filtro por estado
    if (this.filtros.estado) {
      resultado = resultado.filter(v => v.estado === this.filtros.estado);
    }

    // Filtro por tipo
    if (this.filtros.tipo) {
      resultado = resultado.filter(v => v.tipo === this.filtros.tipo);
    }

    // Filtro por rango de fechas
    if (this.fechaInicio) {
      const inicio = new Date(this.fechaInicio);
      resultado = resultado.filter(v => {
        const fecha = v.fechaVisita instanceof Date ? v.fechaVisita : v.fechaVisita.toDate();
        return fecha >= inicio;
      });
    }

    if (this.fechaFin) {
      const fin = new Date(this.fechaFin);
      fin.setHours(23, 59, 59);
      resultado = resultado.filter(v => {
        const fecha = v.fechaVisita instanceof Date ? v.fechaVisita : v.fechaVisita.toDate();
        return fecha <= fin;
      });
    }

    // Búsqueda por texto
    if (this.busqueda.trim()) {
      const busquedaLower = this.busqueda.toLowerCase();
      resultado = resultado.filter(v => 
        v.reclusoNombre.toLowerCase().includes(busquedaLower) ||
        v.areaVisita.toLowerCase().includes(busquedaLower) ||
        (v.id && v.id.toLowerCase().includes(busquedaLower))
      );
    }

    // Ordenar por fecha descendente (más reciente primero)
    resultado.sort((a, b) => {
      const fechaA = a.fechaVisita instanceof Date ? a.fechaVisita : a.fechaVisita.toDate();
      const fechaB = b.fechaVisita instanceof Date ? b.fechaVisita : b.fechaVisita.toDate();
      return fechaB.getTime() - fechaA.getTime();
    });

    this.visitasFiltradas = resultado;
  }

  limpiarFiltros(): void {
    this.filtros = {};
    this.busqueda = '';
    this.inicializarFechas();
    this.aplicarFiltros();
  }

  verDetalle(visita: Visita): void {
    this.visitaSeleccionada = visita;
    this.mostrarModalDetalle = true;
  }

    exportarCSV(): void {
      if (this.visitasFiltradas.length === 0) {
        this.notificacionService.warning(
          'Sin datos',
          'No hay datos para exportar'
        );
        return;
      }
    

    const headers = ['Fecha', 'Recluso', 'Tipo', 'Estado', 'Duración (min)', 'Área', 'Visitantes'];
    const rows = this.visitasFiltradas.map(v => [
      this.formatearFecha(v.fechaVisita),
      v.reclusoNombre,
      v.tipo,
      v.estado,
      v.duracionVisitaReal || 'N/A',
      v.areaVisita,
      v.visitantesPresentes || 0
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `historial_visitas_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  obtenerColorEstado(estado: EstadoVisita): string {
    return this.visitasService.obtenerColorEstado(estado);
  }

  formatearFecha(fecha: any): string {
    if (!fecha) return 'N/A';
    try {
      const fechaObj = fecha instanceof Date ? fecha : fecha.toDate();
      return fechaObj.toLocaleDateString('es-DO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  }
}