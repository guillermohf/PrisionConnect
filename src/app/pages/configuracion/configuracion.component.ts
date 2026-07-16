// src/app/features/configuracion/configuracion.component.ts

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfiguracionService } from '@core/services/configuracion.service';
import { NotificacionService } from '@core/services/notificacion.service';

import { Auth } from '@angular/fire/auth';
import { HorariosVisitaModalComponent } from "./modal/horarios-visita-modal/horarios-visita-modal.component";
import { ParametrosSistemaModalComponent } from "./modal/parametros-sistema-modal/parametros-sistema-modal.component";
import { AreasVisitaModalComponent } from "./modal/areas-visita-modal/areas-visita-modal.component";
import { PabellonesModalComponent } from "./modal/pabellones-modal/pabellones-modal.component";

type TabActivo = 'horarios' | 'parametros' | 'areas' | 'pabellones';

@Component({
  selector: 'prisionConnect-configuracion',
  standalone: true,
  imports: [
    CommonModule,
    HorariosVisitaModalComponent,
    ParametrosSistemaModalComponent,
    AreasVisitaModalComponent,
    PabellonesModalComponent
  ],
  templateUrl: './configuracion.component.html'
})
export default class ConfiguracionComponent implements OnInit {
  private configuracionService = inject(ConfiguracionService);
  private notificacionService = inject(NotificacionService);
  private auth = inject(Auth);

  configuracion = this.configuracionService.configuracion;
  loading = this.configuracionService.loading;

  tabActivo: TabActivo = 'horarios';
  hayCambios = false;

  ngOnInit(): void {
    // Ya se carga automáticamente en el constructor del servicio
  }

async cambiarTab(tab: TabActivo): Promise<void> {
  if (this.hayCambios) {
    const confirmar = await this.notificacionService.confirmar(
      'Cambios sin guardar',
      'Tienes cambios sin guardar. ¿Deseas cambiar de pestaña sin guardar?',
      'Sí, cambiar',
      'Quedarme'
    );

    if (!confirmar) return;
  }

  this.tabActivo = tab;
  this.hayCambios = false;
}


  marcarCambios(): void {
    this.hayCambios = true;
  }

  async guardarCambios(): Promise<void> {
    try {
      // Los cambios ya se guardan automáticamente desde los componentes hijos
      this.notificacionService.success('Cambios guardados exitosamente');
      this.hayCambios = false;
    } catch (error) {
      this.notificacionService.error('Error al guardar cambios');
    }
  }

async resetearConfiguracion(): Promise<void> {
  const confirmar = await this.notificacionService.confirmar(
    'Resetear configuración',
    '¿Estás seguro de que deseas resetear toda la configuración a valores por defecto? Esta acción no se puede deshacer.',
    'Sí, resetear',
    'Cancelar'
  );

  if (!confirmar) return;

  const resultado = await this.configuracionService.resetearConfiguracion();

  if (resultado.success) {
    this.notificacionService.success(resultado.message);
    this.hayCambios = false;
  } else {
    this.notificacionService.error(resultado.message);
  }
}



  obtenerUsuarioActual(): string {
    return this.auth.currentUser?.email || 'Usuario';
  }
}