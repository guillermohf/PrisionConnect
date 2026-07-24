// src/app/features/visitas/components/visita-detalle-modal/visita-detalle-modal.component.ts

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Visita } from '@core/models/visitas.interface';
import { EstadoVisita, TipoVisita } from '@core/models/enums.interface';
import { Timestamp } from '@angular/fire/firestore';
import { ModalComponent } from "@shared/modal/modal.component";

@Component({
  selector: 'prisionConnect-visita-detalle-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './visita-detalle-modal.component.html'
})
export class VisitaDetalleModalComponent {
  @Input() isOpen = false;
  @Input() visita: Visita | null = null;
  @Output() isOpenChange = new EventEmitter<boolean>();

  EstadoVisita = EstadoVisita;
  TipoVisita = TipoVisita;

  cerrar(): void {
    this.isOpen = false;
    this.isOpenChange.emit(false);
  }

  imprimirTicket(): void {
    if (!this.visita) return;
    const v = this.visita;
    const codigo = v.codigoVisita || '---';
    const visitante = v.tipo === TipoVisita.LEGAL ? (v.abogado?.nombre || '---') : (v.visitantes?.length ? v.visitantes[0].nombre : '---');
    const recluso = v.reclusoNombre || '---';
    const area = v.areaVisita || '---';
    const hora = v.horaInicioProgramada || '---';
    const tipo = v.tipo || '---';
    const fecha = this.formatearFecha(v.fechaVisita);

    const ventana = window.open('', '_blank', 'width=400,height=600');
    if (!ventana) return;
    ventana.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ticket ${codigo}</title>
          <style>
            body { font-family: monospace; font-size: 12px; display: flex; justify-content: center; padding: 20px; text-align: center; }
            .ticket { width: 280px; border: 1px dashed #333; padding: 16px; border-radius: 8px; }
            .header { font-size: 16px; font-weight: bold; margin-bottom: 4px; font-family: sans-serif; }
            .sub { font-size: 10px; color: #555; margin-bottom: 10px; text-transform: uppercase; }
            .code { font-size: 22px; font-weight: bold; color: #0f766e; margin: 8px 0; letter-spacing: 2px; }
            .line { border: none; border-top: 1px dashed #666; margin: 10px 0; }
            .info { text-align: left; font-size: 11px; line-height: 1.6; }
            .footer { font-size: 9px; color: #777; margin-top: 12px; }
            @media print {
              body { padding: 0; }
              .ticket { border: none; }
            }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="header">PRISION CONNECT</div>
            <div class="sub">Comprobante de Visita</div>
            <div class="line"></div>
            <div style="font-size: 10px; color: #555;">CÓDIGO TICKET</div>
            <div class="code">${codigo}</div>
            <div class="line"></div>
            <div class="info">
              <div><strong>Visitante:</strong> ${visitante}</div>
              <div><strong>Recluso:</strong> ${recluso}</div>
              <div><strong>Área:</strong> ${area}</div>
              <div><strong>Hora:</strong> ${hora}</div>
              <div><strong>Fecha:</strong> ${fecha}</div>
              <div><strong>Tipo:</strong> ${tipo}</div>
            </div>
            <div class="line"></div>
            <div class="footer">Conserve este comprobante durante su permanencia.</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    ventana.document.close();
  }

  formatearFecha(fecha: any): string {
    if (!fecha) return 'N/A';
    try {
      const fechaObj = fecha instanceof Date ? fecha : (fecha as Timestamp).toDate();
      return fechaObj.toLocaleDateString('es-DO', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  }

  formatearHora(fecha: any): string {
    if (!fecha) return 'N/A';
    try {
      const fechaObj = fecha instanceof Date ? fecha : (fecha as Timestamp).toDate();
      return fechaObj.toLocaleTimeString('es-DO', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  }

  obtenerColorEstado(estado: EstadoVisita): string {
    const colores: Record<EstadoVisita, string> = {
      [EstadoVisita.REGISTRADA]: 'bg-yellow-100 text-yellow-800',
      [EstadoVisita.EN_REQUISA_ENTRADA]: 'bg-blue-100 text-blue-800',
      [EstadoVisita.RECHAZADA_EN_REQUISA]: 'bg-red-100 text-red-800',
      [EstadoVisita.EN_TRANSITO]: 'bg-purple-100 text-purple-800',
      [EstadoVisita.EN_CURSO]: 'bg-green-100 text-green-800',
      [EstadoVisita.PENDIENTE_REQUISA_SALIDA]: 'bg-orange-100 text-orange-800',
      [EstadoVisita.FINALIZADA]: 'bg-gray-100 text-gray-800',
      [EstadoVisita.CANCELADA]: 'bg-red-100 text-red-800'
    };
    return colores[estado] || '';
  }

  obtenerColorGravedad(gravedad: string): string {
    const colores: Record<string, string> = {
      'Leve': 'bg-yellow-100 text-yellow-800',
      'Moderada': 'bg-orange-100 text-orange-800',
      'Grave': 'bg-red-100 text-red-800'
    };
    return colores[gravedad] || 'bg-gray-100 text-gray-800';
  }
}