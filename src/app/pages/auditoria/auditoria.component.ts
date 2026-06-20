import { Component, inject, OnInit, OnDestroy, computed, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditService } from '@core/services/audit.service';
import { AuditLog } from '@core/models/audit.interface';

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [DatePipe],
  templateUrl: './auditoria.component.html'
})
export default class AuditoriaComponent implements OnInit, OnDestroy {
  private auditService = inject(AuditService);
  private datePipe = inject(DatePipe);

  // Módulos disponibles para filtrar
  modulosFiltro = ['Todos', 'Reclusos', 'Recepción', 'Requisa', 'Configuración', 'Usuarios', 'Sistema'];
  nivelesFiltro = ['Todos', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'];

  moduloSeleccionado = signal<string>('Todos');
  nivelSeleccionado = signal<string>('Todos');

  // Loading
  loading = signal(true);

  // Estadísticas por nivel
  estadisticas = computed(() => {
    const logs = this.auditService.logs();
    return {
      total: logs.length,
      info: logs.filter(l => l.nivel === 'INFO').length,
      warning: logs.filter(l => l.nivel === 'WARNING').length,
      error: logs.filter(l => l.nivel === 'ERROR').length,
      critical: logs.filter(l => l.nivel === 'CRITICAL').length
    };
  });

  // Computed para filtrar la data
  dataFiltrada = computed(() => {
    let logs = this.auditService.logs();
    const modulo = this.moduloSeleccionado();
    const nivel = this.nivelSeleccionado();

    if (modulo !== 'Todos') {
      logs = logs.filter(log => log.modulo === modulo);
    }
    if (nivel !== 'Todos') {
      logs = logs.filter(log => log.nivel === nivel);
    }

    return logs.map(log => {
      let fechaFormat = '';
      if (log.fecha?.seconds) {
        fechaFormat = this.datePipe.transform(log.fecha.toDate(), 'dd/MM/yyyy HH:mm:ss') || '';
      } else if (log.fecha) {
        fechaFormat = String(log.fecha);
      }

      return {
        id: log.id,
        fecha: fechaFormat,
        modulo: log.modulo,
        accion: log.accion,
        usuarioNombre: log.usuarioNombre,
        rolUsuario: log.rolUsuario,
        nivel: log.nivel,
        detalles: log.detalles
      };
    });
  });

  // Paginación
  paginaActual = signal(0);
  rowsPerPage = signal(15);

  datosPaginados = computed(() => {
    const data = this.dataFiltrada();
    const start = this.paginaActual() * this.rowsPerPage();
    const end = start + this.rowsPerPage();
    return data.slice(start, end);
  });

  totalPaginas = computed(() => {
    return Math.ceil(this.dataFiltrada().length / this.rowsPerPage()) || 1;
  });

  Math = Math;

  ngOnInit() {
    this.auditService.escucharLogs(500);
    // Dar un breve tiempo para la carga inicial
    setTimeout(() => this.loading.set(false), 1500);
  }

  ngOnDestroy() {
    this.auditService.detenerEscuchaLogs();
  }

  // Filtrado
  onModuloChange(valor: string) {
    this.moduloSeleccionado.set(valor);
    this.paginaActual.set(0);
  }

  onNivelChange(valor: string) {
    this.nivelSeleccionado.set(valor);
    this.paginaActual.set(0);
  }

  limpiarFiltros() {
    this.moduloSeleccionado.set('Todos');
    this.nivelSeleccionado.set('Todos');
    this.paginaActual.set(0);
  }

  // Paginación
  cambiarPagina(offset: number) {
    const nueva = this.paginaActual() + offset;
    if (nueva >= 0 && nueva < this.totalPaginas()) {
      this.paginaActual.set(nueva);
    }
  }

  // Badge de nivel
  getBadgeClass(nivel: string): string {
    switch (nivel) {
      case 'INFO':     return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'WARNING':  return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'ERROR':    return 'bg-red-100 text-red-800 border border-red-200';
      case 'CRITICAL': return 'bg-purple-100 text-purple-800 border border-purple-200';
      default:         return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  }

  // Icono de módulo
  getModuloIcon(modulo: string): string {
    const iconMap: { [key: string]: string } = {
      'Reclusos':       'person_off',
      'Recepción':      'pending_actions',
      'Requisa':        'search',
      'Configuración':  'settings',
      'Usuarios':       'admin_panel_settings',
      'Sistema':        'computer',
      'Visitantes':     'group',
      'Abogados':       'gavel'
    };
    return iconMap[modulo] || 'article';
  }
}
