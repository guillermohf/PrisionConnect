  // src/app/core/services/configuracion.service.ts

  import { Injectable, inject, signal } from '@angular/core';
  import {
    Firestore,
    doc,
    getDoc,
    setDoc,
    updateDoc
  } from '@angular/fire/firestore';
  import { 
    Configuracion, 
    ActualizarConfiguracionDTO,
    HorarioDia,
    DiaSemana,
    PabellonConfig
  } from '@core/models/configuracion.interface';
  import { AuditService } from './audit.service';

  @Injectable({
    providedIn: 'root'
  })
  export class ConfiguracionService {
    private firestore = inject(Firestore);
    private auditService = inject(AuditService);
    private readonly CONFIGURACION_DOC_ID = 'sistema';
    private configuracionDocRef = doc(this.firestore, `configuracion/${this.CONFIGURACION_DOC_ID}`);

    // Signals reactivos
    configuracion = signal<Configuracion | null>(null);
    loading = signal(false);
    error = signal<string | null>(null);

    // Configuración por defecto
    private readonly CONFIGURACION_DEFAULT: Configuracion = {
      horarioVisitas: {
        lunes:     { inicio: '09:00', fin: '17:00', activo: true },
        martes:    { inicio: '09:00', fin: '17:00', activo: true },
        miercoles: { inicio: '09:00', fin: '17:00', activo: true },
        jueves:    { inicio: '09:00', fin: '17:00', activo: true },
        viernes:   { inicio: '09:00', fin: '17:00', activo: true },
        sabado:    { inicio: '09:00', fin: '13:00', activo: false },
        domingo:   { inicio: '09:00', fin: '13:00', activo: false }
      },
      duracionMaximaVisita: 120,  // 2 horas
      visitantesPorDia: 100,
      visitantesPorRecluso: 5,
      tiempoAdvertencia: 15,
      intervaloRevisionMonitor: 15,
      maxVisitasSimultaneasRecluso: 1,
      diasSancionIncidencia: 30,
      edadMinimaAdulto: 18,
      areasVisita: [
        'Sala de Visitas General',
        'Sala de Visitas Privadas',
        'Área Legal',
        'Patio de Visitas'
      ],
      pabellones: [
        'Pabellón A',
        'Pabellón B',
        'Pabellón C',
        'Pabellón D'
      ],
      pabellonesConfig: [
        { nombre: 'Pabellón A', celdaInicio: 1, celdaFin: 30, capacidadPorCelda: 2 },
        { nombre: 'Pabellón B', celdaInicio: 1, celdaFin: 30, capacidadPorCelda: 2 },
        { nombre: 'Pabellón C', celdaInicio: 1, celdaFin: 30, capacidadPorCelda: 2 },
        { nombre: 'Pabellón D', celdaInicio: 1, celdaFin: 30, capacidadPorCelda: 2 }
      ]
    };

    constructor() {
      this.cargarConfiguracion();
    }

    /**
     * Cargar configuración del sistema
     */
    async cargarConfiguracion(): Promise<void> {
      try {
        this.loading.set(true);
        this.error.set(null);

        const docSnap = await getDoc(this.configuracionDocRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as Configuracion;
          this.configuracion.set({ id: docSnap.id, ...data });
          console.log('✅ Configuración cargada');
        } else {
          // Si no existe, crear con valores por defecto
          console.log('⚠️ No existe configuración, creando por defecto...');
          await this.inicializarConfiguracion();
        }
      } catch (error: any) {
        console.error('❌ Error cargando configuración:', error);
        this.error.set('Error al cargar configuración');
      } finally {
        this.loading.set(false);
      }
    }

    /**
     * Inicializar configuración con valores por defecto
     */
    private async inicializarConfiguracion(): Promise<void> {
      try {
        await setDoc(this.configuracionDocRef, this.CONFIGURACION_DEFAULT);
        this.configuracion.set({ 
          id: this.CONFIGURACION_DOC_ID, 
          ...this.CONFIGURACION_DEFAULT 
        });
        console.log('✅ Configuración inicializada con valores por defecto');
      } catch (error: any) {
        console.error('❌ Error inicializando configuración:', error);
        throw error;
      }
    }

    /**
     * Actualizar configuración completa
     */
    async actualizarConfiguracion(
      datos: ActualizarConfiguracionDTO
    ): Promise<{ success: boolean; message: string }> {
      try {
        // Validaciones
        const validacion = this.validarConfiguracion(datos);
        if (!validacion.valido) {
          return {
            success: false,
            message: validacion.mensaje
          };
        }

        this.loading.set(true);

        await updateDoc(this.configuracionDocRef, { ...datos });

        // Recargar configuración
        await this.cargarConfiguracion();

        console.log('✅ Configuración actualizada');
        await this.auditService.registrarAccion(
          'Configuración', 'ACTUALIZAR_CONFIGURACION',
          'Configuración del sistema actualizada',
          'WARNING'
        );
        return {
          success: true,
          message: 'Configuración actualizada exitosamente'
        };
      } catch (error: any) {
        console.error('❌ Error actualizando configuración:', error);
        await this.auditService.registrarAccion('Configuración', 'ERROR_ACTUALIZAR_CONFIGURACION', `Error: ${error.message}`, 'ERROR');
        return {
          success: false,
          message: 'Error al actualizar configuración: ' + error.message
        };
      } finally {
        this.loading.set(false);
      }
    }

    /**
     * Actualizar horario de un día específico
     */
    async actualizarHorarioDia(
      dia: DiaSemana,
      horario: Partial<HorarioDia>
    ): Promise<{ success: boolean; message: string }> {
      try {
        const config = this.configuracion();
        if (!config) {
          return { success: false, message: 'No hay configuración cargada' };
        }

        // Validar horario
        if (horario.inicio && horario.fin) {
          if (!this.validarHorario(horario.inicio, horario.fin)) {
            return {
              success: false,
              message: 'Horario inválido: la hora de inicio debe ser menor que la hora de fin'
            };
          }
        }

        this.loading.set(true);

        const nuevoHorario = {
          ...config.horarioVisitas[dia],
          ...horario
        };

        await updateDoc(this.configuracionDocRef, {
          [`horarioVisitas.${dia}`]: nuevoHorario
        });

        await this.cargarConfiguracion();

        console.log(`✅ Horario de ${dia} actualizado`);
        await this.auditService.registrarAccion(
          'Configuración', 'ACTUALIZAR_HORARIO',
          `Horario del día "${dia}" actualizado`,
          'WARNING'
        );
        return {
          success: true,
          message: `Horario de ${dia} actualizado exitosamente`
        };
      } catch (error: any) {
        console.error('❌ Error actualizando horario:', error);
        await this.auditService.registrarAccion('Configuración', 'ERROR_ACTUALIZAR_HORARIO', `Error al actualizar horario de ${dia}: ${error.message}`, 'ERROR');
        return {
          success: false,
          message: 'Error al actualizar horario: ' + error.message
        };
      } finally {
        this.loading.set(false);
      }
    }

    /**
     * Agregar área de visita
     */
    async agregarArea(area: string): Promise<{ success: boolean; message: string }> {
      try {
        const config = this.configuracion();
        if (!config) {
          return { success: false, message: 'No hay configuración cargada' };
        }

        // Validar área
        const areaLimpia = area.trim();
        if (!areaLimpia || areaLimpia.length < 3) {
          return {
            success: false,
            message: 'El nombre del área debe tener al menos 3 caracteres'
          };
        }

        if (config.areasVisita.includes(areaLimpia)) {
          return {
            success: false,
            message: 'Esta área ya existe'
          };
        }

        if (config.areasVisita.length >= 20) {
          return {
            success: false,
            message: 'No se pueden agregar más de 20 áreas'
          };
        }

        this.loading.set(true);

        const nuevasAreas = [...config.areasVisita, areaLimpia];

        await updateDoc(this.configuracionDocRef, {
          areasVisita: nuevasAreas
        });

        await this.cargarConfiguracion();

        console.log('✅ Área agregada:', areaLimpia);
        await this.auditService.registrarAccion(
          'Configuración', 'AGREGAR_AREA_VISITA',
          `Área de visita agregada: "${areaLimpia}"`,
          'WARNING'
        );
        return {
          success: true,
          message: 'Área agregada exitosamente'
        };
      } catch (error: any) {
        console.error('❌ Error agregando área:', error);
        await this.auditService.registrarAccion('Configuración', 'ERROR_AGREGAR_AREA', `Error: ${error.message}`, 'ERROR');
        return {
          success: false,
          message: 'Error al agregar área: ' + error.message
        };
      } finally {
        this.loading.set(false);
      }
    }

    /**
     * Eliminar área de visita
     */
    async eliminarArea(area: string): Promise<{ success: boolean; message: string }> {
      try {
        const config = this.configuracion();
        if (!config) {
          return { success: false, message: 'No hay configuración cargada' };
        }

        if (config.areasVisita.length <= 1) {
          return {
            success: false,
            message: 'Debe existir al menos 1 área de visita'
          };
        }

        this.loading.set(true);

        const nuevasAreas = config.areasVisita.filter(a => a !== area);

        await updateDoc(this.configuracionDocRef, {
          areasVisita: nuevasAreas
        });

        await this.cargarConfiguracion();

        console.log('✅ Área eliminada:', area);

        return {
          success: true,
          message: 'Área eliminada exitosamente'
        };
      } catch (error: any) {
        console.error('❌ Error eliminando área:', error);
        return {
          success: false,
          message: 'Error al eliminar área: ' + error.message
        };
      } finally {
        this.loading.set(false);
      }
    }

    /**
     * Editar nombre de área
     */
    async editarArea(
      areaAntigua: string,
      areaNueva: string
    ): Promise<{ success: boolean; message: string }> {
      try {
        const config = this.configuracion();
        if (!config) {
          return { success: false, message: 'No hay configuración cargada' };
        }

        const areaNuevaLimpia = areaNueva.trim();
        if (!areaNuevaLimpia || areaNuevaLimpia.length < 3) {
          return {
            success: false,
            message: 'El nombre del área debe tener al menos 3 caracteres'
          };
        }

        if (config.areasVisita.includes(areaNuevaLimpia) && areaAntigua !== areaNuevaLimpia) {
          return {
            success: false,
            message: 'Ya existe un área con este nombre'
          };
        }

        this.loading.set(true);

        const nuevasAreas = config.areasVisita.map(a => 
          a === areaAntigua ? areaNuevaLimpia : a
        );

        await updateDoc(this.configuracionDocRef, {
          areasVisita: nuevasAreas
        });

        await this.cargarConfiguracion();

        console.log('✅ Área editada:', areaAntigua, '→', areaNuevaLimpia);

        return {
          success: true,
          message: 'Área editada exitosamente'
        };
      } catch (error: any) {
        console.error('❌ Error editando área:', error);
        return {
          success: false,
          message: 'Error al editar área: ' + error.message
        };
      } finally {
        this.loading.set(false);
      }
    }

    /**
     * Validar configuración
     */
    private validarConfiguracion(config: ActualizarConfiguracionDTO): {
      valido: boolean;
      mensaje: string;
    } {
      // Validar duración máxima de visita
      if (config.duracionMaximaVisita !== undefined) {
        if (config.duracionMaximaVisita < 30 || config.duracionMaximaVisita > 480) {
          return {
            valido: false,
            mensaje: 'La duración debe estar entre 30 y 480 minutos'
          };
        }
      }

      // Validar visitantes por día
      if (config.visitantesPorDia !== undefined) {
        if (config.visitantesPorDia < 10 || config.visitantesPorDia > 500) {
          return {
            valido: false,
            mensaje: 'Los visitantes por día deben estar entre 10 y 500'
          };
        }
      }

      // Validar visitantes por recluso
      if (config.visitantesPorRecluso !== undefined) {
        if (config.visitantesPorRecluso < 1 || config.visitantesPorRecluso > 10) {
          return {
            valido: false,
            mensaje: 'Los visitantes por recluso deben estar entre 1 y 10'
          };
        }
      }

      // Validar tiempo de advertencia
      if (config.tiempoAdvertencia !== undefined) {
        if (config.tiempoAdvertencia < 5 || config.tiempoAdvertencia > 60) {
          return {
            valido: false,
            mensaje: 'El tiempo de advertencia debe estar entre 5 y 60 minutos'
          };
        }
      }

      // Validar intervalo de revisión del monitor
      if (config.intervaloRevisionMonitor !== undefined) {
        if (config.intervaloRevisionMonitor < 5 || config.intervaloRevisionMonitor > 60) {
          return {
            valido: false,
            mensaje: 'El intervalo de revisión del monitor debe estar entre 5 y 60 segundos'
          };
        }
      }

      // Validar máximo de visitas simultáneas por recluso
      if (config.maxVisitasSimultaneasRecluso !== undefined) {
        if (config.maxVisitasSimultaneasRecluso < 1 || config.maxVisitasSimultaneasRecluso > 5) {
          return {
            valido: false,
            mensaje: 'El número de visitas simultáneas por recluso debe estar entre 1 y 5'
          };
        }
      }

      // Validar días de sanción por incidencia
      if (config.diasSancionIncidencia !== undefined) {
        if (config.diasSancionIncidencia < 1 || config.diasSancionIncidencia > 180) {
          return {
            valido: false,
            mensaje: 'Los días de sanción deben estar entre 1 y 180 días'
          };
        }
      }

      // Validar edad mínima para adulto
      if (config.edadMinimaAdulto !== undefined) {
        if (config.edadMinimaAdulto < 18 || config.edadMinimaAdulto > 21) {
          return {
            valido: false,
            mensaje: 'La edad mínima debe estar entre 18 y 21 años'
          };
        }
      }

      return { valido: true, mensaje: '' };
    }

    /**
     * Validar horario
     */
    private validarHorario(inicio: string, fin: string): boolean {
      const [horaInicio, minInicio] = inicio.split(':').map(Number);
      const [horaFin, minFin] = fin.split(':').map(Number);

      const minutosInicio = horaInicio * 60 + minInicio;
      const minutosFin = horaFin * 60 + minFin;

      return minutosFin > minutosInicio;
    }

    /**
     * Verificar si un día está activo
     */
    diaEstaActivo(dia: DiaSemana): boolean {
      const config = this.configuracion();
      return config?.horarioVisitas[dia]?.activo || false;
    }

    /**
     * Obtener horario de un día
     */
    obtenerHorarioDia(dia: DiaSemana): HorarioDia | null {
      const config = this.configuracion();
      return config?.horarioVisitas[dia] || null;
    }

    /**
     * Obtener lista de áreas
     */
    obtenerAreas(): string[] {
      return this.configuracion()?.areasVisita || [];
    }

    /**
     * Obtener lista de pabellones
     */
    obtenerPabellones(): string[] {
      return this.configuracion()?.pabellones || [];
    }

    /**
     * Agregar pabellón
     */
    async agregarPabellon(pabellon: string): Promise<{ success: boolean; message: string }> {
      try {
        const config = this.configuracion();
        if (!config) return { success: false, message: 'No hay configuración cargada' };

        const pabellonLimpio = pabellon.trim();
        if (!pabellonLimpio || pabellonLimpio.length < 2)
          return { success: false, message: 'El nombre debe tener al menos 2 caracteres' };

        if ((config.pabellones || []).some(p => p.toLowerCase() === pabellonLimpio.toLowerCase()))
          return { success: false, message: 'Este pabellón ya existe' };

        this.loading.set(true);
        const nuevos = [...(config.pabellones || []), pabellonLimpio];
        await updateDoc(this.configuracionDocRef, { pabellones: nuevos });
        await this.cargarConfiguracion();
        await this.auditService.registrarAccion('Configuración', 'AGREGAR_PABELLON', `Pabellón agregado: "${pabellonLimpio}"`, 'WARNING');
        return { success: true, message: 'Pabellón agregado exitosamente' };
      } catch (e: any) {
        return { success: false, message: 'Error al agregar pabellón: ' + e.message };
      } finally {
        this.loading.set(false);
      }
    }

    /**
     * Agregar pabellón con configuración completa (celdas + capacidad)
     */
    async agregarPabellonConfig(cfg: PabellonConfig): Promise<{ success: boolean; message: string }> {
      try {
        const config = this.configuracion();
        if (!config) return { success: false, message: 'No hay configuración cargada' };

        const nombre = cfg.nombre.trim();
        if (!nombre || nombre.length < 2)
          return { success: false, message: 'El nombre debe tener al menos 2 caracteres' };
        if (cfg.celdaInicio < 1 || cfg.celdaFin < cfg.celdaInicio)
          return { success: false, message: 'Rango de celdas inválido' };
        if (cfg.capacidadPorCelda < 1)
          return { success: false, message: 'La capacidad debe ser mínimo 1 persona' };

        const pabellonesConfig = [...(config.pabellonesConfig || [])];
        if (pabellonesConfig.some(p => p.nombre.toLowerCase() === nombre.toLowerCase()))
          return { success: false, message: 'Este pabellón ya existe' };

        pabellonesConfig.push({ ...cfg, nombre });

        // Sincronizar también pabellones (string[])
        const pabellones = [...(config.pabellones || [])]
        if (!pabellones.includes(nombre)) pabellones.push(nombre);

        this.loading.set(true);
        await updateDoc(this.configuracionDocRef, { pabellonesConfig, pabellones });
        await this.cargarConfiguracion();
        await this.auditService.registrarAccion('Configuración', 'AGREGAR_PABELLON', `Pabellón con celdas agregado: "${nombre}"`, 'WARNING');
        return { success: true, message: 'Pabellón agregado exitosamente' };
      } catch (e: any) {
        return { success: false, message: 'Error al agregar pabellón: ' + e.message };
      } finally {
        this.loading.set(false);
      }
    }

    /**
     * Eliminar pabellón
     */
    async eliminarPabellon(pabellon: string): Promise<{ success: boolean; message: string }> {
      try {
        const config = this.configuracion();
        if (!config) return { success: false, message: 'No hay configuración cargada' };

        if ((config.pabellones || []).length <= 1)
          return { success: false, message: 'Debe existir al menos 1 pabellón' };

        this.loading.set(true);
        const pabellones = (config.pabellones || []).filter(p => p !== pabellon);
        const pabellonesConfig = (config.pabellonesConfig || []).filter(p => p.nombre !== pabellon);
        await updateDoc(this.configuracionDocRef, { pabellones, pabellonesConfig });
        await this.cargarConfiguracion();
        return { success: true, message: 'Pabellón eliminado exitosamente' };
      } catch (e: any) {
        return { success: false, message: 'Error al eliminar pabellón: ' + e.message };
      } finally {
        this.loading.set(false);
      }
    }

    /**
     * Editar nombre de pabellón
     */
    async editarPabellon(antiguo: string, nuevo: string): Promise<{ success: boolean; message: string }> {
      try {
        const config = this.configuracion();
        if (!config) return { success: false, message: 'No hay configuración cargada' };

        const nuevoLimpio = nuevo.trim();
        if (!nuevoLimpio || nuevoLimpio.length < 2)
          return { success: false, message: 'El nombre debe tener al menos 2 caracteres' };

        if (antiguo === nuevoLimpio) return { success: true, message: 'Sin cambios' };

        this.loading.set(true);
        const nuevos = (config.pabellones || []).map(p => p === antiguo ? nuevoLimpio : p);
        await updateDoc(this.configuracionDocRef, { pabellones: nuevos });
        await this.cargarConfiguracion();
        return { success: true, message: 'Pabellón editado exitosamente' };
      } catch (e: any) {
        return { success: false, message: 'Error al editar pabellón: ' + e.message };
      } finally {
        this.loading.set(false);
      }
    }

    /**
     * Actualizar configuración completa de un pabellón
     */
    async actualizarPabellonConfig(nombreAntiguo: string, cfg: PabellonConfig): Promise<{ success: boolean; message: string }> {
      try {
        const config = this.configuracion();
        if (!config) return { success: false, message: 'No hay configuración cargada' };
        if (cfg.celdaInicio < 1 || cfg.celdaFin < cfg.celdaInicio)
          return { success: false, message: 'Rango de celdas inválido' };
        if (cfg.capacidadPorCelda < 1)
          return { success: false, message: 'La capacidad debe ser mínimo 1 persona' };

        this.loading.set(true);
        const pabellonesConfig = (config.pabellonesConfig || []).map(p =>
          p.nombre === nombreAntiguo ? { ...cfg } : p
        );
        // Sincronizar nombre en string[]
        const pabellones = (config.pabellones || []).map(p => p === nombreAntiguo ? cfg.nombre : p);
        await updateDoc(this.configuracionDocRef, { pabellonesConfig, pabellones });
        await this.cargarConfiguracion();
        return { success: true, message: 'Pabellón actualizado exitosamente' };
      } catch (e: any) {
        return { success: false, message: 'Error al actualizar pabellón: ' + e.message };
      } finally {
        this.loading.set(false);
      }
    }

    /**
     * Resetear a configuración por defecto
     */
    async resetearConfiguracion(): Promise<{ success: boolean; message: string }> {
      try {
        this.loading.set(true);

        await setDoc(this.configuracionDocRef, this.CONFIGURACION_DEFAULT);
        await this.cargarConfiguracion();

        console.log('✅ Configuración reseteada');

        return {
          success: true,
          message: 'Configuración reseteada a valores por defecto'
        };
      } catch (error: any) {
        console.error('❌ Error reseteando configuración:', error);
        return {
          success: false,
          message: 'Error al resetear configuración: ' + error.message
        };
      } finally {
        this.loading.set(false);
      }
    }
  }