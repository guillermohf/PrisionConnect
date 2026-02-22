import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';

interface FiltrosReporte {
  fechaInicio: string;
  fechaFin: string;
  tipoVisita?: string;
  estado?: string;
  abogadoId?: string;
  reclusoId?: string;
  tipoCaso?: string;
  tipoDelito?: string;
  situacionLegal?: string;
}

interface Columna {
  key: string;
  label: string;
}

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.component.html'
})
export default class ReportesComponent implements OnInit {

  tipoReporteSeleccionado = signal<string>('');
  generando = signal<boolean>(false);
  formatoGenerando = signal<string>('');

  filtros: FiltrosReporte = {
    fechaInicio: '',
    fechaFin: ''
  };

  abogados: any[] = [];
  reclusos: any[] = [];
  datosReporte: any[] = [];
  columnasReporte: Columna[] = [];
  tituloReporte: string = '';

  ngOnInit(): void {
    this.inicializarFechas();
  }

  inicializarFechas(): void {
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hoy.getDate() - 30);
    this.filtros.fechaInicio = this.formatearFechaInput(hace30Dias);
    this.filtros.fechaFin = this.formatearFechaInput(hoy);
  }

  formatearFechaInput(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  seleccionarTipoReporte(tipo: string): void {
    this.tipoReporteSeleccionado.set(tipo);
    this.limpiarFiltrosEspecificos();
    this.cargarDatosReporte();
  }

  limpiarFiltrosEspecificos(): void {
    this.filtros = {
      fechaInicio: this.filtros.fechaInicio,
      fechaFin: this.filtros.fechaFin
    };
  }

  limpiarFiltros(): void {
    this.inicializarFechas();
    this.limpiarFiltrosEspecificos();
    this.cargarDatosReporte();
  }

  cargarDatosReporte(): void {
    const tipo = this.tipoReporteSeleccionado();
    switch (tipo) {
      case 'visitas':
        this.cargarReporteVisitas();
        break;
      case 'abogados':
        this.cargarReporteAbogados();
        break;
      case 'reclusos':
        this.cargarReporteReclusos();
        break;
    }
  }

  cargarReporteVisitas(): void {
    this.tituloReporte = 'Reporte de Visitas';
    this.columnasReporte = [
      { key: 'fecha', label: 'FECHA' },
      { key: 'visitante', label: 'VISITANTE' },
      { key: 'recluso', label: 'RECLUSO' },
      { key: 'tipo', label: 'TIPO' },
      { key: 'estado', label: 'ESTADO' },
      { key: 'duracion', label: 'DURACIÓN' }
    ];
    this.datosReporte = [];
  }

  cargarReporteAbogados(): void {
    this.tituloReporte = 'Reporte de Abogados';
    this.columnasReporte = [
      { key: 'abogado', label: 'ABOGADO' },
      { key: 'exequatur', label: 'EXEQUATUR' },
      { key: 'tipo', label: 'TIPO' },
      { key: 'recluso', label: 'RECLUSO' },
      { key: 'tipoCaso', label: 'TIPO CASO' },
      { key: 'fechaAsignacion', label: 'FECHA ASIGNACIÓN' }
    ];
    this.datosReporte = [];
  }

  cargarReporteReclusos(): void {
    this.tituloReporte = 'Reporte de Reclusos';
    this.columnasReporte = [
      { key: 'nombreCompleto', label: 'NOMBRE COMPLETO' },
      { key: 'cedula', label: 'CÉDULA' },
      { key: 'delito', label: 'DELITO' },
      { key: 'situacionLegal', label: 'SITUACIÓN LEGAL' },
      { key: 'fechaIngreso', label: 'FECHA INGRESO' },
      { key: 'pabellon', label: 'PABELLÓN' },
      { key: 'celda', label: 'CELDA' }
    ];
    this.datosReporte = [];
  }

  async generarReporte(formato: 'pdf' | 'excel'): Promise<void> {
    if (!this.tipoReporteSeleccionado()) {
      alert('Por favor, selecciona un tipo de reporte');
      return;
    }
    if (this.datosReporte.length === 0) {
      alert('No hay datos para exportar');
      return;
    }
    this.generando.set(true);
    this.formatoGenerando.set(formato);
    try {
      if (formato === 'pdf') {
        await this.generarPDF();
      } else {
        await this.generarExcel();
      }
    } catch (error) {
      console.error('Error al generar reporte:', error);
      alert('Error al generar el reporte. Por favor, intenta nuevamente.');
    } finally {
      this.generando.set(false);
      this.formatoGenerando.set('');
    }
  }

  async generarPDF(): Promise<void> {
    await this.delay(1000);
    alert('Funcionalidad de PDF en desarrollo. Por favor, usa Excel por ahora.');
  }

  async generarExcel(): Promise<void> {
    await this.delay(500);
    try {
      const worksheet = XLSX.utils.json_to_sheet(this.datosReporte);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, this.tituloReporte.substring(0, 31));
      const columnWidths = this.columnasReporte.map(col => ({
        wch: Math.max(col.label.length, 15)
      }));
      worksheet['!cols'] = columnWidths;
      const fileName = `${this.tipoReporteSeleccionado()}_${this.formatearFechaArchivo()}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      console.log(`Excel generado exitosamente: ${fileName}`);
    } catch (error) {
      console.error('Error al generar Excel:', error);
      throw error;
    }
  }

  formatearFechaArchivo(): string {
    const fecha = new Date();
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    const hours = String(fecha.getHours()).padStart(2, '0');
    const minutes = String(fecha.getMinutes()).padStart(2, '0');
    return `${year}${month}${day}_${hours}${minutes}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}