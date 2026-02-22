// src/app/pages/dashboard/dashboard.component.ts
// 🎨 BRANDING: #006666, #008080, #1A2626

import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { VisitasService } from '@core/services/visitas.service';
import { ReclusosService } from '@core/services/reclusos.service';
import { VisitantesService } from '@core/services/visitantes.service';
import { EstadoVisita, TipoVisita } from '@core/models/enums.interface';

@Component({
  selector: 'prisionConnect-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html'
})
export default class DashboardComponent implements OnInit {
  private visitasService = inject(VisitasService);
  private reclusosService = inject(ReclusosService);
  private visitantesService = inject(VisitantesService);
  private router = inject(Router);

  estadisticas = this.visitasService.estadisticas;
  loading = this.visitasService.loading;

  // Métricas adicionales
  totalReclusos = computed(() => this.reclusosService.reclusos().length);
  totalVisitantes = computed(() => this.visitantesService.visitantes().length);
  
  // Visitas por tipo
  visitasFamiliares = computed(() => 
    this.visitasService.visitas().filter(v => v.tipo === TipoVisita.FAMILIAR).length
  );
  
  visitasLegales = computed(() => 
    this.visitasService.visitas().filter(v => v.tipo === TipoVisita.LEGAL).length
  );

  // Tendencias
  visitasSemana = computed(() => {
    const hoy = new Date();
    const hace7Dias = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);
    return this.visitasService.visitas().filter(v => {
      const fecha = v.fechaVisita instanceof Date ? v.fechaVisita : v.fechaVisita.toDate();
      return fecha >= hace7Dias && fecha <= hoy;
    }).length;
  });

  visitasMes = computed(() => {
    const hoy = new Date();
    const mesActual = hoy.getMonth();
    const añoActual = hoy.getFullYear();
    return this.visitasService.visitas().filter(v => {
      const fecha = v.fechaVisita instanceof Date ? v.fechaVisita : v.fechaVisita.toDate();
      return fecha.getMonth() === mesActual && fecha.getFullYear() === añoActual;
    }).length;
  });

  // Alertas
  incidenciasMes = computed(() => {
    const hoy = new Date();
    const mesActual = hoy.getMonth();
    return this.visitasService.visitas()
      .filter(v => v.incidencias && v.incidencias.length > 0)
      .reduce((total, v) => {
        const incidenciasMes = v.incidencias!.filter(i => {
          const fecha = i.fecha instanceof Date ? i.fecha : i.fecha.toDate();
          return fecha.getMonth() === mesActual;
        });
        return total + incidenciasMes.length;
      }, 0);
  });

  ngOnInit(): void {
    // Los datos se cargan automáticamente por los signals
  }

  navegarA(ruta: string): void {
    this.router.navigate([ruta]);
  }

  obtenerPorcentajeCambio(actual: number, anterior: number): number {
    if (anterior === 0) return 100;
    return Math.round(((actual - anterior) / anterior) * 100);
  }
}