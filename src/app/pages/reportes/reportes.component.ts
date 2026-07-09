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
import { NotificacionService } from '../../core/services/notificacion.service';

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
  estadoVisita?: string;    // En Curso, Finalizada, etc.
}

interface Columna {
  key: string;
  label: string;
}

interface EstadisticaVista {
  label: string;
  value: number;
  colorHex: string;
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
  private notificacionService = inject(NotificacionService);

  tipoReporteSeleccionado = signal<string>('');
  generando = signal<boolean>(false);
  formatoGenerando = signal<string>('');

  filtros: FiltrosReporte = { fechaInicio: '', fechaFin: '' };

  abogados: any[] = [];
  reclusos: any[] = [];
  datosReporte: any[] = [];
  columnasReporte: Columna[] = [];
  tituloReporte: string = '';

  /** Estadísticas para las tarjetas en pantalla (vista previa). Se recalculan cada vez que cambian los datos. */
  estadisticas: EstadisticaVista[] = [];

  private subscripciones: Subscription = new Subscription();

  private readonly INSTITUCION = 'PRISION CONNECT';
  private readonly SUBTITULO = 'CCR Najayo (Hombres y Mujeres)';
  private readonly LOGO_PATH = 'assets/logo.png';

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
    this.filtros.fechaFin = this.toInputDate(hoy);
  }

  cargarListasFiltros(): void {
    this.subscripciones.add(this.abogadosService.obtenerTodos().subscribe(data => this.abogados = data));
    this.subscripciones.add(this.reclusosService.obtenerTodos().subscribe(data => this.reclusos = data));
  }

  toInputDate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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
    this.estadisticas = [];

    switch (this.tipoReporteSeleccionado()) {
      case 'visitas': this.cargarReporteVisitas(); break;
      case 'abogados': this.cargarReporteAbogados(); break;
      case 'reclusos': this.cargarReporteReclusos(); break;
      case 'visitantes': this.cargarReporteVisitantes(); break;
    }
  }

  cargarReporteVisitas(): void {
    this.tituloReporte = 'Reporte de Check-In y Check-Out';
    this.columnasReporte = [
      { key: 'fecha', label: 'FECHA' },
      { key: 'hora_entrada', label: 'ENTRADA' },
      { key: 'hora_salida', label: 'SALIDA' },
      { key: 'visitante', label: 'PERSONA' },
      { key: 'recluso', label: 'RECLUSO' },
      { key: 'tipo_visita', label: 'TIPO' },
      { key: 'estado_visita', label: 'ESTADO' },
      { key: 'requisaTexto', label: 'REQUISA' }
    ];

    this.subscripciones.add(
      this.visitasService.obtenerReporte(this.filtros).subscribe({
        next: (datos) => {
          this.datosReporte = datos.map((v: any) => ({
            ...v,
            requisaTexto: v.isRequisa ? 'Sí' : 'No'
          }));
          this.calcularEstadisticasVista();
        },
        error: (err) => console.error('Error cargando reporte de visitas:', err)
      })
    );
  }

  cargarReporteVisitantes(): void {
    this.tituloReporte = 'Padrón de Visitantes Autorizados';
    this.columnasReporte = [
      { key: 'nombreCompleto', label: 'NOMBRE COMPLETO' },
      { key: 'cedula', label: 'CÉDULA' },
      { key: 'telefono', label: 'TELÉFONO' },
      { key: 'parentescoConRecluso', label: 'PARENTESCO' },
      { key: 'nacionalidad', label: 'NACIONALIDAD' },
      { key: 'genero', label: 'GÉNERO' }
    ];

    this.subscripciones.add(
      this.visitantesService.obtenerReporte(this.filtros).subscribe({
        next: (datos) => {
          this.datosReporte = datos;
          this.calcularEstadisticasVista();
        },
        error: (err) => console.error('Error cargando reporte de visitantes:', err)
      })
    );
  }

  cargarReporteAbogados(): void {
    this.tituloReporte = 'Listado Oficial de Abogados';
    this.columnasReporte = [
      { key: 'nombreCompleto', label: 'ABOGADO' },
      { key: 'cedula', label: 'CÉDULA' },
      { key: 'matricula_abogado', label: 'MATRÍCULA' },
      { key: 'colegio_abogados', label: 'COLEGIO' },
      { key: 'telefono', label: 'TELÉFONO' }
    ];

    this.subscripciones.add(
      this.abogadosService.obtenerReporte(this.filtros).subscribe({
        next: (datos) => {
          this.datosReporte = datos;
          this.calcularEstadisticasVista();
        },
        error: (err) => console.error('Error cargando reporte de abogados:', err)
      })
    );
  }

  cargarReporteReclusos(): void {
    this.tituloReporte = 'Población Penitenciaria';
    this.columnasReporte = [
      { key: 'numeroInterno', label: 'ID INTERNO' },
      { key: 'nombreCompleto', label: 'NOMBRE COMPLETO' },
      { key: 'delito', label: 'DELITO' },
      { key: 'tiempoCondena', label: 'CONDENA' },
      { key: 'estado', label: 'ESTADO ACTUAL' }
    ];

    this.subscripciones.add(
      this.reclusosService.obtenerReporte(this.filtros).subscribe({
        next: (datos) => {
          this.datosReporte = datos;
          this.calcularEstadisticasVista();
        },
        error: (err) => console.error('Error cargando reporte de reclusos:', err)
      })
    );
  }

  async generarReporte(formato: 'pdf' | 'excel'): Promise<void> {
    if (!this.tipoReporteSeleccionado()) { this.notificacionService.toast('Selecciona un tipo de reporte', 'warning'); return; }
    if (this.datosReporte.length === 0) { this.notificacionService.toast('No hay datos para exportar', 'warning'); return; }

    this.generando.set(true);
    this.formatoGenerando.set(formato);

    try {
      formato === 'pdf' ? await this.generarPDF() : await this.generarExcel();
    } catch (e) {
      console.error(e);
      this.notificacionService.error('Error al generar el reporte. Intenta nuevamente.');
    } finally {
      this.generando.set(false);
      this.formatoGenerando.set('');
    }
  }

  async generarPDF(): Promise<void> {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    // ── Paleta institucional (reducida a 3 colores semánticos + neutrales) ──
    const tealDark: [number, number, number] = [0, 77, 77];
    const tealMid: [number, number, number] = [0, 102, 102];
    const tealLight: [number, number, number] = [0, 128, 128];
    const white: [number, number, number] = [255, 255, 255];
    const grayLight: [number, number, number] = [248, 250, 252];
    const grayText: [number, number, number] = [71, 85, 105];
    const grayBorder: [number, number, number] = [203, 213, 225];
    const gold: [number, number, number] = [180, 140, 50];
    const green: [number, number, number] = [22, 128, 61];
    const greenBg: [number, number, number] = [220, 245, 230];
    const red: [number, number, number] = [180, 35, 35];
    const redBg: [number, number, number] = [252, 226, 226];
    const amber: [number, number, number] = [173, 95, 5];
    const amberBg: [number, number, number] = [253, 237, 209];

    // Mapa de estados → badge (fondo claro + texto oscuro). Solo 3 colores semánticos en todo el documento
    // (antes eran 5 —verde/rojo/azul/ámbar/rosado— compitiendo entre sí; azul y rosado se consolidaron aquí).
    const badgeMap: Record<string, { bg: [number, number, number]; fg: [number, number, number] }> = {
      'Activo': { bg: greenBg, fg: green }, 'Aprobada': { bg: greenBg, fg: green },
      'Sí': { bg: greenBg, fg: green }, 'Finalizada': { bg: greenBg, fg: green },
      'Público': { bg: greenBg, fg: green }, 'Libertad Condicional': { bg: greenBg, fg: green },
      'Liberado': { bg: greenBg, fg: green },
      'Trasladado': { bg: redBg, fg: red }, 'Fugado': { bg: redBg, fg: red },
      'Rechazada': { bg: redBg, fg: red }, 'Cancelada': { bg: redBg, fg: red },
      'Fallecido': { bg: redBg, fg: red },
      'En Curso': { bg: amberBg, fg: amber }, 'Registrada': { bg: amberBg, fg: amber },
      'En Tránsito': { bg: amberBg, fg: amber }, 'Procesado': { bg: amberBg, fg: amber },
      'Prisión Preventiva': { bg: amberBg, fg: amber },
      'En Requisa Entrada': { bg: amberBg, fg: amber }, 'Pendiente Requisa Salida': { bg: amberBg, fg: amber },
      'Privado': { bg: amberBg, fg: amber }
    };

    // ── Metadatos del reporte ─────────────────────────────────────────
    const reportCode = this.generarCodigoReporte();
    const generatedAt = new Date();
    const stats = this.calcularEstadisticas();

    let logo: string | null = null;
    try { logo = await this.loadImageAsBase64(this.LOGO_PATH); } catch { }

    // ── ENCABEZADO (blanco, para que el logo tenga contraste; se re-dibuja en cada página) ──
    const drawHeader = (pageNum: number, totalPages: number) => {
      // Banda principal blanca
      doc.setFillColor(...white);
      doc.rect(0, 0, pageW, 32, 'F');
      // Acento teal oscuro que separa el header del resto
      doc.setFillColor(...tealDark);
      doc.rect(0, 32, pageW, 1.8, 'F');

      if (logo) doc.addImage(logo, 'PNG', 5, 6, 34, 17);

      const tx = logo ? 44 : 10;
      doc.setTextColor(26, 38, 38);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
      doc.text('MINISTERIO DE JUSTICIA Y PAZ', tx, 11);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(...grayText); doc.setFontSize(9);
      doc.text(this.SUBTITULO, tx, 17);
      doc.setFontSize(7.5); doc.setTextColor(130, 145, 145);
      doc.text('Dirección General de Prisiones · Sistema de Control de Visitas', tx, 23);

      // Derecha: código + fecha + página
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...tealDark);
      doc.text(`Código: ${reportCode}`, pageW - 8, 10, { align: 'right' });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...grayText);
      doc.text(`Generado: ${generatedAt.toLocaleDateString('es-DO')}`, pageW - 8, 16, { align: 'right' });
      doc.text(generatedAt.toLocaleTimeString('es-DO'), pageW - 8, 21, { align: 'right' });
      doc.setFont('helvetica', 'bold'); doc.setTextColor(...tealDark);
      doc.text(`Pág. ${pageNum} / ${totalPages}`, pageW - 8, 27, { align: 'right' });

      // Sub-banda con título — la barra se dibuja como rectángulo (no como carácter Unicode,
      // que en fuentes base de jsPDF puede no tener el glifo y salir roto en el PDF final).
      doc.setFillColor(...tealLight);
      doc.rect(0, 33.8, pageW, 11, 'F');
      const tituloTexto = this.tituloReporte.toUpperCase();
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
      const textW = doc.getTextWidth(tituloTexto);
      const startX = pageW / 2 - textW / 2 - 4;
      doc.setFillColor(...gold);
      doc.rect(startX, 36.6, 1.3, 5, 'F');
      doc.setTextColor(...white);
      doc.text(tituloTexto, startX + 4, 41.3);
    };

    // ── MARCA DE AGUA (muy sutil, detrás de la tabla) ─────────────────
    const drawWatermark = () => {
      doc.saveGraphicsState();
      (doc as any).setGState(new (doc as any).GState({ opacity: 0.035 }));
      doc.setFont('helvetica', 'bold'); doc.setFontSize(70);
      doc.setTextColor(...tealDark);
      doc.text('CONFIDENCIAL', pageW / 2, pageH / 2, { align: 'center', angle: 30 });
      doc.restoreGraphicsState();
    };

    // ── PIE DE PÁGINA ────────────────────────────────────────────────
    const drawFooter = () => {
      doc.setFillColor(...tealDark);
      doc.rect(0, pageH - 10, pageW, 10, 'F');
      doc.setFillColor(...gold);
      doc.rect(0, pageH - 10, pageW, 0.8, 'F');
      doc.setFont('helvetica', 'italic'); doc.setFontSize(6.5);
      doc.setTextColor(180, 220, 220);
      doc.text('DOCUMENTO OFICIAL — USO EXCLUSIVO DEL PERSONAL AUTORIZADO — INFORMACIÓN CONFIDENCIAL', pageW / 2, pageH - 5.5, { align: 'center' });
      doc.text(`Código de verificación: ${reportCode}  ·  ${this.INSTITUCION}  ·  PrisionConnect v1.0`, pageW / 2, pageH - 2, { align: 'center' });
    };

    // ── Dibuja encabezado en página 1 ────────────────────────────────
    drawHeader(1, 1);
    let currentY = 47;

    // ── CAJA DE FILTROS ──────────────────────────────────────────────
    const parts: string[] = [];
    if (this.filtros.fechaInicio && this.filtros.fechaFin)
      parts.push(`Período: ${this.toReadableDate(this.filtros.fechaInicio)} — ${this.toReadableDate(this.filtros.fechaFin)}`);
    if (this.filtros.tipoVisita) parts.push(`Tipo: ${this.filtros.tipoVisita}`);
    if (this.filtros.isRequisa) parts.push(`Requisa: ${this.filtros.isRequisa === 'true' ? 'Sí' : 'No'}`);
    if (this.filtros.estadoRecluso) parts.push(`Estado: ${this.filtros.estadoRecluso}`);
    if (this.filtros.tipoDelito) parts.push(`Delito: ${this.filtros.tipoDelito}`);
    if (this.filtros.nacionalidad) parts.push(`Nac.: ${this.filtros.nacionalidad}`);
    if (this.filtros.colegioAbogados) parts.push(`Colegio: ${this.filtros.colegioAbogados}`);

    doc.setFillColor(...grayLight);
    doc.roundedRect(6, currentY, pageW - 12, 13, 2, 2, 'F');
    doc.setDrawColor(...grayBorder);
    doc.roundedRect(6, currentY, pageW - 12, 13, 2, 2, 'S');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(...tealDark);
    doc.text('FILTROS APLICADOS:', 10, currentY + 5);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...grayText);
    doc.text(parts.length > 0 ? parts.join('   ·   ') : 'Sin filtros adicionales — Todos los registros', 53, currentY + 5);
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...tealMid);
    doc.text(`Total de registros: ${this.datosReporte.length}`, 10, currentY + 10);
    currentY += 16;

    // ── TARJETAS ESTADÍSTICAS ─────────────────────────────────────────
    if (stats.length > 0) {
      const cardW = (pageW - 12 - (stats.length - 1) * 3) / stats.length;
      stats.forEach((stat, i) => {
        const x = 6 + i * (cardW + 3);
        const [r, g, b] = stat.color as [number, number, number];
        doc.setFillColor(...white);
        doc.setDrawColor(...grayBorder);
        doc.roundedRect(x, currentY, cardW, 18, 2, 2, 'FD');
        // barra lateral coloreada
        doc.setFillColor(r, g, b);
        doc.roundedRect(x, currentY, 3.5, 18, 1, 1, 'F');
        // valor numérico grande
        doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
        doc.setTextColor(r, g, b);
        doc.text(String(stat.value), x + cardW / 2 + 1.5, currentY + 11, { align: 'center' });
        // etiqueta
        doc.setFont('helvetica', 'normal'); doc.setFontSize(5.8);
        doc.setTextColor(...grayText);
        doc.text(stat.label.toUpperCase(), x + cardW / 2 + 1.5, currentY + 16, { align: 'center' });
      });
      currentY += 21;
    }

    // ── TABLA PRINCIPAL ───────────────────────────────────────────────
    autoTable(doc, {
      head: [this.columnasReporte.map(c => c.label)],
      body: this.datosReporte.map(row =>
        this.columnasReporte.map(c => row[c.key] ?? 'N/A')
      ),
      startY: currentY,
      margin: { left: 6, right: 6, bottom: 14 },
      styles: {
        fontSize: 7.5,
        cellPadding: { top: 2.8, bottom: 2.8, left: 4, right: 4 },
        overflow: 'linebreak',
        valign: 'middle',
        lineColor: grayBorder,
        lineWidth: 0.2,
        textColor: [30, 41, 59]
      },
      headStyles: {
        fillColor: tealDark,
        textColor: white,
        fontStyle: 'bold',
        halign: 'center',
        fontSize: 7.5
      },
      alternateRowStyles: { fillColor: [250, 250, 249] },
      didParseCell: (data: any) => {
        if (data.section !== 'body') return;
        const val = String(data.cell.raw ?? '');
        // Se vacía el texto por defecto; el badge se dibuja manualmente en didDrawCell.
        if (badgeMap[val]) data.cell.text = [''];
      },
      didDrawCell: (data: any) => {
        if (data.section !== 'body') return;
        const val = String(data.cell.raw ?? '');
        const badge = badgeMap[val];
        if (!badge) return;
        const padX = 2.2;
        doc.setFont('helvetica', 'bold'); doc.setFontSize(7);
        const textW = doc.getTextWidth(val);
        const bx = data.cell.x + (data.cell.width - textW) / 2 - padX;
        const by = data.cell.y + (data.cell.height - 4.6) / 2;
        doc.setFillColor(...badge.bg);
        doc.roundedRect(bx, by, textW + padX * 2, 4.6, 2.3, 2.3, 'F');
        doc.setTextColor(...badge.fg);
        doc.text(val, data.cell.x + data.cell.width / 2, by + 3.3, { align: 'center' });
      }
    });

    // ── SECCIÓN DE FIRMAS (última página) ────────────────────────────
    const lastY: number = (doc as any).lastAutoTable?.finalY ?? currentY + 10;
    const sigSectionY = lastY + 6;

    if (sigSectionY < pageH - 38) {
      // Línea divisoria
      doc.setDrawColor(...grayBorder); doc.setLineWidth(0.3);
      doc.line(6, sigSectionY, pageW - 6, sigSectionY);
      // Etiqueta sección
      doc.setFillColor(...grayLight);
      doc.roundedRect(6, sigSectionY + 2, pageW - 12, 6, 1, 1, 'F');
      const firmaLabel = 'AUTORIZACIÓN Y FIRMA DEL REPORTE';
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7);
      doc.setTextColor(...grayText);
      const firmaTextW = doc.getTextWidth(firmaLabel);
      const firmaStartX = pageW / 2 - firmaTextW / 2 - 3;
      doc.setFillColor(...tealDark);
      doc.rect(firmaStartX, sigSectionY + 3, 1.2, 4, 'F');
      doc.text(firmaLabel, firmaStartX + 3.5, sigSectionY + 6);

      const sigY = sigSectionY + 12;
      const numSigs = 3;
      const sigW = (pageW - 30) / numSigs;
      const sigs = [
        { label: 'Director del Centro Penitenciario', role: 'Firma y Sello Oficial' },
        { label: 'Supervisor de Turno', role: 'Supervisión Operativa' },
        { label: 'Responsable del Sistema', role: 'Verificación de Datos' }
      ];
      sigs.forEach((sig, i) => {
        const x = 10 + i * (sigW + 5);
        const mid = x + (sigW - 5) / 2;
        doc.setDrawColor(...tealMid); doc.setLineWidth(0.5);
        doc.line(x, sigY + 12, x + sigW - 5, sigY + 12);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...tealDark);
        doc.text(sig.label, mid, sigY + 16, { align: 'center' });
        doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(...grayText);
        doc.text(sig.role, mid, sigY + 20, { align: 'center' });
        doc.setDrawColor(...grayBorder); doc.setLineWidth(0.2);
        doc.line(x, sigY + 25, x + sigW - 5, sigY + 25);
        doc.setFontSize(6);
        doc.text('Fecha: _________________________', x, sigY + 29);
      });
    }

    // ── Aplicar encabezado, marca de agua y pie a TODAS las páginas ──
    const total = (doc as any).internal.getNumberOfPages();
    for (let p = 1; p <= total; p++) {
      doc.setPage(p);
      drawHeader(p, total);
      drawWatermark();
      drawFooter();
    }

    doc.save(`${reportCode}_${this.tipoReporteSeleccionado()}_${this.formatearFechaArchivo()}.pdf`);
  }

  /** Calcula estadísticas de resumen (formato RGB) usadas dentro del PDF con jsPDF. No tocar: la usa generarPDF/generarExcel. */
  private calcularEstadisticas(): Array<{ label: string; value: number; color: number[] }> {
    const tipo = this.tipoReporteSeleccionado();
    const datos = this.datosReporte;
    const stats: Array<{ label: string; value: number; color: number[] }> = [];

    stats.push({ label: 'Total Registros', value: datos.length, color: [0, 102, 102] });

    if (tipo === 'visitas') {
      stats.push({ label: 'Visitas Familiares', value: datos.filter((d: any) => d.tipo_visita === 'Familiar').length, color: [22, 163, 74] });
      stats.push({ label: 'Visitas Legales', value: datos.filter((d: any) => d.tipo_visita === 'Legal').length, color: [37, 99, 235] });
      stats.push({ label: 'Con Requisa', value: datos.filter((d: any) => d.requisaTexto === 'Sí').length, color: [217, 119, 6] });
    } else if (tipo === 'reclusos') {
      const activos = datos.filter((d: any) => d.estado === 'Activo').length;
      const trasladados = datos.filter((d: any) => d.estado === 'Trasladado').length;
      stats.push({ label: 'Activos', value: activos, color: [22, 163, 74] });
      stats.push({ label: 'Trasladados', value: trasladados, color: [220, 38, 38] });
      stats.push({ label: 'Otros', value: datos.length - activos - trasladados, color: [217, 119, 6] });
    } else if (tipo === 'visitantes') {
      stats.push({ label: 'Masculinos', value: datos.filter((d: any) => ['M', 'Masculino'].includes(d.genero)).length, color: [37, 99, 235] });
      stats.push({ label: 'Femeninos', value: datos.filter((d: any) => ['F', 'Femenino'].includes(d.genero)).length, color: [219, 39, 119] });
    } else if (tipo === 'abogados') {
      stats.push({ label: 'Públicos', value: datos.filter((d: any) => d.tipo === 'Público').length, color: [22, 163, 74] });
      stats.push({ label: 'Privados', value: datos.filter((d: any) => d.tipo === 'Privado').length, color: [37, 99, 235] });
    }
    return stats;
  }

  /** Igual que calcularEstadisticas() pero en hex, para las tarjetas de la vista previa en pantalla. */
  private calcularEstadisticasVista(): void {
    this.estadisticas = this.calcularEstadisticas().map(s => ({
      label: s.label,
      value: s.value,
      colorHex: this.rgbToHex(s.color)
    }));
  }

  private rgbToHex([r, g, b]: number[]): string {
    return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Código de verificación determinístico: mismo tipo + mismos filtros + mismo día = mismo código.
   * Antes era `RPT-${año}-${random 4 dígitos}`, que cambiaba en cada clic aunque el reporte fuera idéntico,
   * lo que lo hacía inútil como código de verificación real.
   */
  private generarCodigoReporte(): string {
    const tipo = (this.tipoReporteSeleccionado() || 'GEN').toUpperCase().substring(0, 3);
    const fecha = this.formatearFechaArchivo().split('_')[0]; // YYYYMMDD
    const base = tipo + fecha + JSON.stringify(this.filtros);
    let hash = 0;
    for (let i = 0; i < base.length; i++) {
      hash = ((hash << 5) - hash + base.charCodeAt(i)) | 0;
    }
    const hashStr = Math.abs(hash).toString(36).toUpperCase().padStart(5, '0').slice(0, 5);
    return `RPT-${tipo}-${fecha}-${hashStr}`;
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
    const reportCode = this.generarCodigoReporte();

    // ── Hoja 1: Datos ────────────────────────────────────────────────
    const ws = XLSX.utils.json_to_sheet(this.datosReporte);
    this.columnasReporte.forEach((col, i) => {
      const cell = XLSX.utils.encode_cell({ c: i, r: 0 });
      if (ws[cell]) ws[cell].v = col.label;
    });
    ws['!cols'] = this.columnasReporte.map(c => ({ wch: Math.max(c.label.length + 4, 20) }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, this.tituloReporte.substring(0, 31));

    // ── Hoja 2: Resumen estadístico ───────────────────────────────────
    const stats = this.calcularEstadisticas();
    const resumenData: any[][] = [
      ['MINISTERIO DE JUSTICIA Y PAZ'],
      [this.SUBTITULO],
      [''],
      ['REPORTE:', this.tituloReporte],
      ['CÓDIGO:', reportCode],
      ['GENERADO:', new Date().toLocaleString('es-DO')],
      ['TOTAL REGISTROS:', this.datosReporte.length],
      [''],
      ['── FILTROS APLICADOS ──'],
    ];
    if (this.filtros.fechaInicio) resumenData.push(['Desde:', this.toReadableDate(this.filtros.fechaInicio)]);
    if (this.filtros.fechaFin) resumenData.push(['Hasta:', this.toReadableDate(this.filtros.fechaFin)]);
    if (this.filtros.tipoVisita) resumenData.push(['Tipo de visita:', this.filtros.tipoVisita]);
    if (this.filtros.estadoRecluso) resumenData.push(['Estado recluso:', this.filtros.estadoRecluso]);
    if (this.filtros.tipoDelito) resumenData.push(['Tipo de delito:', this.filtros.tipoDelito]);
    if (this.filtros.nacionalidad) resumenData.push(['Nacionalidad:', this.filtros.nacionalidad]);
    if (this.filtros.colegioAbogados) resumenData.push(['Colegio:', this.filtros.colegioAbogados]);
    resumenData.push([''], ['── ESTADÍSTICAS ──']);
    stats.forEach(s => resumenData.push([s.label + ':', s.value]));
    resumenData.push([''], ['── FIRMAS ──'], ['Director del Centro:', '___________________________'], ['Supervisor de Turno:', '___________________________'], ['Fecha:', '___________________________']);

    const wsRes = XLSX.utils.aoa_to_sheet(resumenData);
    wsRes['!cols'] = [{ wch: 26 }, { wch: 42 }];
    XLSX.utils.book_append_sheet(wb, wsRes, 'Resumen y Metadatos');

    XLSX.writeFile(wb, `${reportCode}_${this.tipoReporteSeleccionado()}_${this.formatearFechaArchivo()}.xlsx`);
  }

  formatearFechaArchivo(): string {
    const f = new Date();
    return `${f.getFullYear()}${String(f.getMonth() + 1).padStart(2, '0')}${String(f.getDate()).padStart(2, '0')}_${String(f.getHours()).padStart(2, '0')}${String(f.getMinutes()).padStart(2, '0')}`;
  }

  private delay(ms: number): Promise<void> { return new Promise(r => setTimeout(r, ms)); }
}