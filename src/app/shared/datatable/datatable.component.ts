// src/shared/components/datatable/datatable.component.ts

import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ContentChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'prisionConnect-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './datatable.component.html'
})
export class DataTableComponent implements OnInit, OnChanges {
  @Input() columns: { key: string; label: string }[] = [];
  @Input() data: any[] = [];

  // 🔥 FLAGS DE ACCIONES
  @Input() showActions: boolean = true;
  @Input() showEdit: boolean = true;
  @Input() showDelete: boolean = true;
  
  @Output() edit = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();
  @Output() detail = new EventEmitter<any>();
  @Output() updateHoraSalida = new EventEmitter<{ row: any; nuevaHora: string }>();

  // ⭐ NUEVO: Soporte para template personalizado de acciones
  @ContentChild('customActions') customActionsTemplate?: TemplateRef<any>;

  searchTerm: string = '';
  paginaActual: number = 0;
  rowsPerPage: number = 10;

  datosFiltrados: any[] = [];
  datosPaginados: any[] = [];
  Math = Math;

  ngOnInit() {
    console.log('📷 DataTable ngOnInit - data recibida:', this.data);
    this.filtrarDatos();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data']) {
      console.log('🔄 DataTable ngOnChanges - nueva data:', this.data);
      this.filtrarDatos();
    }
  }

  filtrarDatos() {
    console.log('🔍 Filtrando datos. Total:', this.data?.length || 0);
    
    if (!this.data || this.data.length === 0) {
      this.datosFiltrados = [];
      this.datosPaginados = [];
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.datosFiltrados = this.data.filter(row =>
      Object.values(row).some(value =>
        value?.toString().toLowerCase().includes(term)
      )
    );
    
    console.log('✅ Datos filtrados:', this.datosFiltrados.length);
    
    this.paginaActual = 0;
    this.actualizarPaginacion();
  }

  actualizarPaginacion() {
    const start = this.paginaActual * this.rowsPerPage;
    const end = start + this.rowsPerPage;
    this.datosPaginados = this.datosFiltrados.slice(start, end);
    console.log('📄 Datos paginados:', this.datosPaginados.length);
  }

  cambiarPagina(offset: number) {
    const nuevaPagina = this.paginaActual + offset;
    const totalPaginas = Math.ceil(this.datosFiltrados.length / this.rowsPerPage);
    if (nuevaPagina >= 0 && nuevaPagina < totalPaginas) {
      this.paginaActual = nuevaPagina;
      this.actualizarPaginacion();
    }
  }

  onDetails(row: any) {
    this.detail.emit(row);
  }

  onEdit(row: any) {
    this.edit.emit(row);
  }

  onDelete(row: any) {
    this.delete.emit(row);
  }

  // ⭐ NUEVO - Determinar si una columna es de tipo badge
  isBadgeColumn(key: string): boolean {
    return key === 'activo' || key === 'estado' || key === 'estatus';
  }

  // ⭐ NUEVO - Determinar si una columna es de tipo fecha
  isDateColumn(key: string): boolean {
    const dateKeys = [
      'fecha',
      'fechavisita',
      'fechanacimiento',
      'fechaingreso',
      'fecharegistro',
      'fechaasignacion',
      'fechacreacion',
      'fechaactualizacion',
      'ultimoacceso',
      'checkin',
      'checkout',
      'checkinprincipal',
      'checkoutfinal'
    ];
    return dateKeys.includes(key.toLowerCase());
  }

  // ⭐ NUEVO - Formatear fecha para celdas de la tabla
  formatearFechaTabla(value: any): string {
    if (!value) return '-';
    try {
      let dateObj: Date;
      if (value instanceof Date) {
        dateObj = value;
      } else if (typeof value.toDate === 'function') {
        dateObj = value.toDate();
      } else if (value.seconds !== undefined) {
        dateObj = new Date(value.seconds * 1000);
      } else {
        const strVal = String(value);
        const matchT = strVal.match(/Timestamp\(seconds=(\d+)/);
        if (matchT) {
          dateObj = new Date(parseInt(matchT[1]) * 1000);
        } else {
          dateObj = new Date(value);
        }
      }
      
      if (isNaN(dateObj.getTime())) {
        return String(value);
      }
      
      const d = String(dateObj.getDate()).padStart(2, '0');
      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
      const y = dateObj.getFullYear();
      return `${d}/${m}/${y}`;
    } catch {
      return String(value);
    }
  }

  // ⭐ NUEVO - Obtener clase para badge de estado
  getBadgeClass(value: any): string {
    if (typeof value === 'boolean') {
      return value 
        ? 'bg-green-100 text-green-800' 
        : 'bg-red-100 text-red-800';
    }
    
    const valueStr = value?.toString().toLowerCase();
    
    if (valueStr === 'activo' || valueStr === 'active') {
      return 'bg-green-100 text-green-800';
    }
    if (valueStr === 'inactivo' || valueStr === 'inactive') {
      return 'bg-red-100 text-red-800';
    }
    if (valueStr === 'pendiente' || valueStr === 'pending') {
      return 'bg-yellow-100 text-yellow-800';
    }
    if (valueStr === 'en curso' || valueStr === 'in progress') {
      return 'bg-blue-100 text-blue-800';
    }
    
    return 'bg-gray-100 text-gray-800';
  }

  // ⭐ NUEVO - Obtener texto para badge
  getBadgeText(value: any): string {
    if (typeof value === 'boolean') {
      return value ? 'Activo' : 'Inactivo';
    }
    return value?.toString() || '';
  }

  // Convertir de "hh:mm AM/PM" a "HH:mm" (formato 24h para input type="time")
  convertirA24Horas(hora12: string | undefined): string {
    if (!hora12) return '';
    
    // Si ya está en formato 24h, devolver tal cual
    if (!hora12.includes('AM') && !hora12.includes('PM')) {
      return hora12;
    }
    
    try {
      const [time, period] = hora12.trim().split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      
      if (period === 'PM' && hours !== 12) {
        hours += 12;
      }
      if (period === 'AM' && hours === 12) {
        hours = 0;
      }
      
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    } catch (error) {
      console.error('Error al convertir hora:', hora12, error);
      return '';
    }
  }

  // Convertir de "HH:mm" (24h) a "hh:mm AM/PM" (12h)
  formatoHora12(hora24: string): string {
    if (!hora24) return '';
    
    const [hours, minutes] = hora24.split(':');
    let hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    
    hour = hour % 12;
    hour = hour ? hour : 12; // La hora '0' debe ser '12'
    
    const hourStr = hour.toString().padStart(2, '0');
    return `${hourStr}:${minutes} ${ampm}`;
  }

  onHoraSalidaChange(row: any, event: Event) {
    const input = event.target as HTMLInputElement;
    const value24 = input.value; // formato "HH:mm"

    if (!value24) {
      console.warn('⚠️ No se ingresó hora de salida');
      return;
    }

    console.log('🕐 Hora ingresada (24h):', value24);
    
    // Convertir a formato 12 horas
    const value12 = this.formatoHora12(value24);
    console.log('🕐 Hora convertida (12h):', value12);

    // Actualizar localmente primero para feedback inmediato
    row['horaSalida'] = value12;
    row.lockedHoraSalida = true;
    row.estatus = 'Finalizada';

    // Emitir evento al componente padre
    console.log('📤 Emitiendo evento updateHoraSalida');
    this.updateHoraSalida.emit({ 
      row: { ...row }, 
      nuevaHora: value12
    });
  }

  focusHoraSalidaInput(event: MouseEvent) {
    const btn = event.target as HTMLElement;
    const cell = btn.closest('td');
    const input = cell?.querySelector('input[type="time"]') as HTMLInputElement | null;
    input?.focus();
  }

  getEstatusClass(row: any): string {
    if (row.estatus === 'Activo') {
      return 'text-green-600 font-semibold';
    }
    if (row.estatus === 'Finalizada') {
      const tiempoRestante = this.getTiempoRestante(row);
      if (tiempoRestante === 'Expirando...') {
        return 'text-red-600 font-semibold';
      }
      return 'text-orange-600 font-semibold';
    }
    return 'text-gray-600';
  }

  getTiempoRestante(visita: any): string {
    if (visita.estatus !== 'Finalizada' || !visita.horaSalida) {
      return '';
    }
    
    const ahora = new Date().getTime();
    const horaSalida = new Date(visita.horaSalida).getTime();
    const TIEMPO_VISIBLE = 24 * 60 * 60 * 1000;
    const tiempoDesdeHoraSalida = ahora - horaSalida;
    const tiempoRestante = TIEMPO_VISIBLE - tiempoDesdeHoraSalida;
    
    if (tiempoRestante <= 0) return 'Expirando...';
    
    const horas = Math.floor(tiempoRestante / (1000 * 60 * 60));
    const minutos = Math.floor((tiempoRestante % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${horas}h ${minutos}m`;
  }
}