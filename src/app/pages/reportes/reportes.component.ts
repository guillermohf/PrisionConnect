import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { VisitasService } from '../../core/services/visitas.service';
import { AbogadosService } from '../../core/services/abogados.service';
import { ReclusosService } from '../../core/services/reclusos.service';
import { VisitantesService } from '../../core/services/visitantes.service';

interface FiltrosReporte {
  fechaInicio: string;
  fechaFin: string;
  tipoVisita?: string;      // Familiar, Legal
  isRequisa?: string;       // true/false
  abogadoId?: string;
  colegioAbogados?: string;
  matricula?: string;
  tipoDelito?: string;
  estadoRecluso?: string;   // Activo, Trasladado, Libre, Suspendido
  cedula?: string;
  nacionalidad?: string;
  genero?: string;          // M, F
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
export default class ReportesComponent implements OnInit, OnDestroy {

  private visitasService = inject(VisitasService);
  private abogadosService = inject(AbogadosService);
  private reclusosService = inject(ReclusosService);
  private visitantesService = inject(VisitantesService);

  tipoReporteSeleccionado = signal<string>('');
  generando = signal<boolean>(false);
  formatoGenerando = signal<string>('');

  filtros: FiltrosReporte = { fechaInicio: '', fechaFin: '' };

  abogados: any[] = [];
  reclusos: any[] = [];
  datosReporte: any[] = [];
  columnasReporte: Columna[] = [];
  tituloReporte: string = '';

  private subscripciones: Subscription = new Subscription();

  private readonly INSTITUCION = 'PRISION CONNECT';
  private readonly SUBTITULO   = 'CCR Najayo (Hombres y Mujeres)';
  private readonly LOGO_PATH   = 'assets/logo.png';

  ngOnInit(): void { 
    this.inicializarFechas(); 
    this.cargarListasFiltros();
  }

  ngOnDestroy(): void {
    this.subscripciones.unsubscribe();
  }

  inicializarFechas(): void {
    const hoy = new Date();
    const hace30 = new Date(); hace30.setDate(hoy.getDate() - 30);
    this.filtros.fechaInicio = this.toInputDate(hace30);
    this.filtros.fechaFin    = this.toInputDate(hoy);
  }

  cargarListasFiltros(): void {
    this.subscripciones.add(this.abogadosService.obtenerTodos().subscribe(data => this.abogados = data));
    this.subscripciones.add(this.reclusosService.obtenerTodos().subscribe(data => this.reclusos = data));
  }

  toInputDate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  seleccionarTipoReporte(tipo: string): void {
    this.tipoReporteSeleccionado.set(tipo);
    this.limpiarFiltrosEspecificos();
    this.cargarDatosReporte();
  }

  limpiarFiltrosEspecificos(): void {
    this.filtros = { fechaInicio: this.filtros.fechaInicio, fechaFin: this.filtros.fechaFin };
  }

  limpiarFiltros(): void {
    this.inicializarFechas();
    this.limpiarFiltrosEspecificos();
    this.cargarDatosReporte();
  }

  cargarDatosReporte(): void {
    this.datosReporte = []; 

    switch (this.tipoReporteSeleccionado()) {
      case 'visitas':    this.cargarReporteVisitas();    break;
      case 'abogados':   this.cargarReporteAbogados();   break;
      case 'reclusos':   this.cargarReporteReclusos();   break;
      case 'visitantes': this.cargarReporteVisitantes(); break;
    }
  }

  cargarReporteVisitas(): void {
    this.tituloReporte = 'Reporte de Check-In y Check-Out';
    this.columnasReporte = [
      { key: 'fecha',          label: 'FECHA' },
      { key: 'hora_entrada',   label: 'ENTRADA' },
      { key: 'hora_salida',    label: 'SALIDA' },
      { key: 'visitante',      label: 'PERSONA' },
      { key: 'recluso',        label: 'RECLUSO' },
      { key: 'tipo_visita',    label: 'TIPO' },
      { key: 'requisaTexto',   label: 'REQUISA' }
    ];
    
    this.subscripciones.add(
      this.visitasService.obtenerReporte(this.filtros).subscribe({
        next: (datos) => {
          this.datosReporte = datos.map((v: any) => ({
            ...v,
            requisaTexto: v.isRequisa ? 'Sí' : 'No'
          }));
        },
        error: (err) => console.error('Error cargando reporte de visitas:', err)
      })
    );
  }

  cargarReporteVisitantes(): void {
    this.tituloReporte = 'Padrón de Visitantes Autorizados';
    this.columnasReporte = [
      { key: 'nombreCompleto',       label: 'NOMBRE COMPLETO' },
      { key: 'cedula',               label: 'CÉDULA' },
      { key: 'telefono',             label: 'TELÉFONO' },
      { key: 'parentescoConRecluso', label: 'PARENTESCO' },
      { key: 'nacionalidad',         label: 'NACIONALIDAD' },
      { key: 'genero',               label: 'GÉNERO' }
    ];
    
    this.subscripciones.add(
      this.visitantesService.obtenerReporte(this.filtros).subscribe({
        next: (datos) => this.datosReporte = datos,
        error: (err) => console.error('Error cargando reporte de visitantes:', err)
      })
    );
  }

  cargarReporteAbogados(): void {
    this.tituloReporte = 'Listado Oficial de Abogados';
    this.columnasReporte = [
      { key: 'nombreCompleto',    label: 'ABOGADO' },
      { key: 'cedula',            label: 'CÉDULA' },
      { key: 'matricula_abogado', label: 'MATRÍCULA' },
      { key: 'colegio_abogados',  label: 'COLEGIO' },
      { key: 'telefono',          label: 'TELÉFONO' }
    ];
    
    this.subscripciones.add(
      this.abogadosService.obtenerReporte(this.filtros).subscribe({
        next: (datos) => this.datosReporte = datos,
        error: (err) => console.error('Error cargando reporte de abogados:', err)
      })
    );
  }

  cargarReporteReclusos(): void {
    this.tituloReporte = 'Población Penitenciaria';
    this.columnasReporte = [
      { key: 'numeroInterno',  label: 'ID INTERNO' },
      { key: 'nombreCompleto', label: 'NOMBRE COMPLETO' },
      { key: 'delito',         label: 'DELITO' },
      { key: 'tiempoCondena',  label: 'CONDENA' },
      { key: 'estado',         label: 'ESTADO ACTUAL' }
    ];
    
    this.subscripciones.add(
      this.reclusosService.obtenerReporte(this.filtros).subscribe({
        next: (datos) => this.datosReporte = datos,
        error: (err) => console.error('Error cargando reporte de reclusos:', err)
      })
    );
  }

  async generarReporte(formato: 'pdf' | 'excel'): Promise<void> {
    if (!this.tipoReporteSeleccionado()) { alert('Selecciona un tipo de reporte'); return; }
    if (this.datosReporte.length === 0)  { alert('No hay datos para exportar');     return; }
    
    this.generando.set(true);
    this.formatoGenerando.set(formato);
    
    try {
      formato === 'pdf' ? await this.generarPDF() : await this.generarExcel();
    } catch (e) {
      console.error(e);
      alert('Error al generar el reporte. Intenta nuevamente.');
    } finally {
      this.generando.set(false);
      this.formatoGenerando.set('');
    }
  }

  async generarPDF(): Promise<void> {
    const doc   = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    const teal      : [number,number,number] = [13, 148, 136];
    const tealDark  : [number,number,number] = [15, 118, 110];
    const white     : [number,number,number] = [255,255,255];
    const grayLight : [number,number,number] = [248,250,252];
    const grayText  : [number,number,number] = [71, 85, 105];
    const grayBorder: [number,number,number] = [226,232,240];

    let logo: string | null = null;
    try { logo = await this.loadImageAsBase64(this.LOGO_PATH); } catch { }

    const drawHeaderFooter = (pageNum: number, totalPages: number) => {
      doc.setFillColor(...teal);
      doc.rect(0, 0, pageW, 28, 'F');

      if (logo) doc.addImage(logo, 'PNG', 6, 3, 24, 22);

      const textX = logo ? 34 : 10;
      doc.setTextColor(...white);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(this.INSTITUCION, textX, 13);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(this.SUBTITULO, textX, 20);

      const now = new Date();
      doc.setFontSize(7);
      doc.text(`Generado: ${now.toLocaleDateString('es-DO')} ${now.toLocaleTimeString('es-DO')}`, pageW - 8, 13, { align: 'right' });
      doc.text(`Página ${pageNum} de ${totalPages}`, pageW - 8, 20, { align: 'right' });

      doc.setFillColor(...tealDark);
      doc.rect(0, 28, pageW, 10, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...white);
      doc.text(this.tituloReporte.toUpperCase(), pageW / 2, 35, { align: 'center' });

      doc.setFillColor(...grayBorder);
      doc.rect(0, pageH - 9, pageW, 9, 'F');
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(...grayText);
      doc.text(`${this.INSTITUCION} · Documento oficial de control y auditoría`, pageW / 2, pageH - 3, { align: 'center' });
    };

    const fY = 42;
    doc.setFillColor(...grayLight);
    doc.roundedRect(6, fY, pageW - 12, 13, 2, 2, 'F');
    doc.setDrawColor(...grayBorder);
    doc.roundedRect(6, fY, pageW - 12, 13, 2, 2, 'S');

    doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(...tealDark);
    doc.text('FILTROS APLICADOS:', 10, fY + 5);

    doc.setFont('helvetica','normal'); doc.setTextColor(...grayText);
    
    // Concatenación dinámica de filtros
    const parts = [];
    if (this.filtros.fechaInicio && this.filtros.fechaFin) {
      parts.push(`Período: ${this.toReadableDate(this.filtros.fechaInicio)} — ${this.toReadableDate(this.filtros.fechaFin)}`);
    }
    if (this.filtros.tipoVisita)      parts.push(`Visita: ${this.filtros.tipoVisita}`);
    if (this.filtros.isRequisa)       parts.push(`Requisa: ${this.filtros.isRequisa === 'true' ? 'Sí' : 'No'}`);
    if (this.filtros.estadoRecluso)   parts.push(`Estado Recluso: ${this.filtros.estadoRecluso}`);
    if (this.filtros.tipoDelito)      parts.push(`Delito: ${this.filtros.tipoDelito}`);
    if (this.filtros.nacionalidad)    parts.push(`Nacionalidad: ${this.filtros.nacionalidad}`);
    if (this.filtros.colegioAbogados) parts.push(`Colegio: ${this.filtros.colegioAbogados}`);
    
    doc.text(parts.length > 0 ? parts.join('   |   ') : 'Todos los registros', 45, fY + 5);
    doc.setFont('helvetica','bold');
    doc.text(`Total de registros obtenidos: ${this.datosReporte.length}`, 10, fY + 10);

    autoTable(doc, {
      head:   [this.columnasReporte.map(c => c.label)],
      body:   this.datosReporte.map(row => this.columnasReporte.map(c => row[c.key] ?? 'N/A')),
      startY: fY + 17,
      margin: { left: 6, right: 6, bottom: 13 },
      styles: {
        fontSize: 8,
        cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
        overflow: 'linebreak',
        valign: 'middle',
        lineColor: grayBorder,
        lineWidth: 0.2
      },
      headStyles: {
        fillColor: teal,
        textColor: white,
        fontStyle: 'bold',
        halign: 'center'
      },
      alternateRowStyles: { fillColor: [240, 253, 250] },
      didDrawPage: () => { }
    });

    const total = (doc as any).internal.getNumberOfPages();
    for (let p = 1; p <= total; p++) {
      doc.setPage(p);
      drawHeaderFooter(p, total);
    }

    doc.save(`${this.tipoReporteSeleccionado()}_${this.formatearFechaArchivo()}.pdf`);
  }

  private loadImageAsBase64(src: string): Promise<string> {
    return new Promise((res, rej) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        c.getContext('2d')!.drawImage(img, 0, 0);
        res(c.toDataURL('image/png'));
      };
      img.onerror = rej;
      img.src = src;
    });
  }

  private toReadableDate(iso: string): string {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  async generarExcel(): Promise<void> {
    await this.delay(300);
    const ws = XLSX.utils.json_to_sheet(this.datosReporte);

    this.columnasReporte.forEach((col, i) => {
      const cell = XLSX.utils.encode_cell({ c: i, r: 0 });
      if (ws[cell]) ws[cell].v = col.label;
    });
    ws['!cols'] = this.columnasReporte.map(c => ({ wch: Math.max(c.label.length + 4, 18) }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, this.tituloReporte.substring(0, 31));

    const meta: any[][] = [
      ['Reporte',          this.tituloReporte],
      ['Centro',           this.SUBTITULO],
      ['Generado',         new Date().toLocaleString('es-DO')],
      ['Total registros',  this.datosReporte.length]
    ];
    
    const wsInfo = XLSX.utils.aoa_to_sheet(meta);
    wsInfo['!cols'] = [{ wch: 20 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, wsInfo, 'Filtros y Metadatos');

    XLSX.writeFile(wb, `${this.tipoReporteSeleccionado()}_${this.formatearFechaArchivo()}.xlsx`);
  }

  formatearFechaArchivo(): string {
    const f = new Date();
    return `${f.getFullYear()}${String(f.getMonth()+1).padStart(2,'0')}${String(f.getDate()).padStart(2,'0')}_${String(f.getHours()).padStart(2,'0')}${String(f.getMinutes()).padStart(2,'0')}`;
  }

  private delay(ms: number): Promise<void> { return new Promise(r => setTimeout(r, ms)); }
}