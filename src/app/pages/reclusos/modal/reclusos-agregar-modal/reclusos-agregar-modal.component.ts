// src/app/pages/reclusos/modal/reclusos-agregar-modal/reclusos-agregar-modal.component.ts

import {
  Component, EventEmitter, Input, Output,
  inject, signal, OnChanges, SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Timestamp } from '@angular/fire/firestore';
import { ReclusosService } from '@core/services/reclusos.service';
import { NotificacionService } from '@core/services/notificacion.service';
import { ConfiguracionService } from '@core/services/configuracion.service';
import { UbicacionRDService, Municipio, Sector, Barrio } from '@core/services/ubicacion-rd.service';
import { SituacionLegal, EstadoCivil, EstadoRecluso } from '@core/models/enums.interface';
import { PabellonConfig } from '@core/models/configuracion.interface';
import { ModalComponent } from '@shared/modal/modal.component';
import { TelefonoMaskDirective } from '@shared/directives/telefono.mask.directive';
import {
  cedulaDominicanaValidator,
  telefonoDominicanoValidator,
  mayorDeEdadValidator,
  fechaNoFuturaValidator,
  pasaporteValidator
} from '@shared/validators/custom.validators';
import { InputComponent } from '@shared/input/input.component';
import { ButtonComponent } from '@shared/button/buttton.component';

@Component({
  selector: 'prisionConnect-recluso-agregar-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalComponent,
    TelefonoMaskDirective,
    InputComponent,
    ButtonComponent
  ],
  templateUrl: './reclusos-agregar-modal.component.html'
})
export class ReclusoAgregarModalComponent implements OnChanges {
  @Input() showModal = false;
  @Output() showModalChange = new EventEmitter<boolean>();
  @Output() reclusoAgregado = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private reclusosService = inject(ReclusosService);
  private notificacionService = inject(NotificacionService);
  private configuracionService = inject(ConfiguracionService);
  private ubicacionService = inject(UbicacionRDService);

  form: FormGroup;
  guardando = false;
  generandoId = false;

  // Enums
  SituacionLegal = SituacionLegal;
  EstadoRecluso = EstadoRecluso;
  EstadoCivil = EstadoCivil;

  // Ubicación
  provincias = this.ubicacionService.provincias;
  cargandoUbicacion = this.ubicacionService.cargando;
  municipiosFiltrados = signal<Municipio[]>([]);
  sectoresAutocomplete = signal<Sector[]>([]);
  barriosAutocomplete = signal<Barrio[]>([]);
  sectorTexto = signal('');
  barrioTexto = signal('');
  mostrarSugerenciasSector = signal(false);
  mostrarSugerenciasBarrio = signal(false);

  // Nacionalidades
  nacionalidades = this.ubicacionService.nacionalidades;
  cargandoNacionalidades = this.ubicacionService.cargandoNacionalidades;

  // Pabellones y celdas
  get pabellonesConfig(): PabellonConfig[] {
    const cfg = this.configuracionService.configuracion();
    if (cfg?.pabellonesConfig?.length) return cfg.pabellonesConfig;
    return (cfg?.pabellones ?? []).map(nombre => ({
      nombre, celdaInicio: 1, celdaFin: 30, capacidadPorCelda: 2
    }));
  }

  celdaSeleccionada: string | null = null;
  capacidadCeldaInfo: { ocupados: number; capacidad: number } | null = null;
  verificandoCapacidad = false;

  /** Rango de celdas del pabellón seleccionado */
  get celdasDelPabellon(): string[] {
    const pabNombre = this.form.get('pabellon')?.value;
    const pab = this.pabellonesConfig.find(p => p.nombre === pabNombre);
    if (!pab) return [];
    const celdas: string[] = [];
    for (let i = pab.celdaInicio; i <= pab.celdaFin; i++) {
      celdas.push(String(i).padStart(2, '0'));
    }
    return celdas;
  }

  /** Capacidad de la celda actualmente seleccionada */
  get capacidadPorCelda(): number {
    const pabNombre = this.form.get('pabellon')?.value;
    const pab = this.pabellonesConfig.find(p => p.nombre === pabNombre);
    return pab?.capacidadPorCelda ?? 2;
  }

  /** Reclusos activos en la celda seleccionada */
  get ocupantesActuales(): number {
    const pab = this.form.get('pabellon')?.value;
    const cel = this.form.get('celda')?.value;
    if (!pab || !cel) return 0;
    return this.reclusosService.reclusos().filter(
      r => r.pabellon === pab && r.celda === cel && r.activo
    ).length;
  }

  /** True si la celda ya está llena */
  get celdaLlena(): boolean {
    return this.ocupantesActuales >= this.capacidadPorCelda;
  }

  onPabellonChange(): void {
    // Resetear celda al cambiar pabellón
    this.form.patchValue({ celda: '' });
    this.capacidadCeldaInfo = null;
  }

  onCeldaChange(): void {
    // Actualizar info de capacidad al cambiar celda
    this.capacidadCeldaInfo = this.celdaLlena
      ? { ocupados: this.ocupantesActuales, capacidad: this.capacidadPorCelda }
      : null;
  }

  get fechaMaxNacimiento(): string {
    const f = new Date();
    f.setFullYear(f.getFullYear() - 18);
    return f.toISOString().split('T')[0];
  }

  // Fecha máxima de ingreso (hoy)
  get fechaMaxIngreso(): string {
    return new Date().toISOString().split('T')[0];
  }

  esDominicano = signal<boolean>(true);

  private actualizarCampoIdentificacion(nacionalidad: string): void {
    const esDom = !nacionalidad || nacionalidad === 'Dominicana';
    this.esDominicano.set(esDom);
    const cedulaCtrl = this.form.get('cedula')!;
    const pasaporteCtrl = this.form.get('pasaporte')!;

    if (esDom) {
      cedulaCtrl.setValidators([Validators.required, cedulaDominicanaValidator()]);
      pasaporteCtrl.clearValidators();
      pasaporteCtrl.setValue('');
    } else {
      cedulaCtrl.clearValidators();
      cedulaCtrl.setValue('');
      pasaporteCtrl.setValidators([Validators.required, pasaporteValidator()]);
    }
    cedulaCtrl.updateValueAndValidity();
    pasaporteCtrl.updateValueAndValidity();
  }

  constructor() {
    this.form = this.fb.group({
      // Identificación
      numeroIdentificacion: [{ value: '', disabled: true }, Validators.required],
      numeroExpediente: [''],
      cedula: ['', [Validators.required, cedulaDominicanaValidator()]],
      pasaporte: [''],

      // Información Personal
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      fechaNacimiento: ['', [Validators.required, mayorDeEdadValidator()]],
      sexo: ['', Validators.required],
      nacionalidad: ['Dominicana', Validators.required],
      estadoCivil: [''],

      // Contacto — Dirección en cascada
      _provinciaId: [''],
      _provinciaNombre: [''],
      _municipioNombre: [''],
      _sectorNombre: [''],
      _barrioNombre: [''],
      _calle: ['', Validators.required],
      telefono: ['', telefonoDominicanoValidator()],
      nombreContactoEmergencia: ['', Validators.required],
      telefonoEmergencia: ['', telefonoDominicanoValidator()],

      // Ubicación penal
      pabellon: ['', Validators.required],
      celda: ['', Validators.required],

      // Información Penal
      fechaIngreso: ['', [Validators.required, fechaNoFuturaValidator()]],
      situacionLegal: ['', Validators.required],
      estado: ['', Validators.required],
      delito: [''],
      sentencia: [''],

      observaciones: ['']
    });

    this.form.get('nacionalidad')?.valueChanges.subscribe(nac => this.actualizarCampoIdentificacion(nac));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['showModal']?.currentValue === true) {
      this.generarIdPenitenciario();
      this.ubicacionService.cargarTodo();
      this.ubicacionService.cargarNacionalidades();
    }
  }

  async generarIdPenitenciario(): Promise<void> {
    const anioActual = new Date().getFullYear();
    const prefijo = `R-${anioActual}-`;
    const idsExistentes = this.reclusosService.reclusos()
      .map(r => r.numeroIdentificacion)
      .filter(id => id?.startsWith(prefijo));
    const ultimoNumero = idsExistentes.reduce((max, id) => {
      const partes = id.split('-');
      const correlativo = parseInt(partes[2], 10);
      return correlativo > max ? correlativo : max;
    }, 0);
    const nuevoCorrelativo = (ultimoNumero + 1).toString().padStart(5, '0');
    const numeroIdentificacion = `${prefijo}${nuevoCorrelativo}`;
    const control = this.form.get('numeroIdentificacion');
    control?.enable();
    control?.setValue(numeroIdentificacion);
    control?.disable();
  }

  // ── Dirección en cascada ──────────────────────────────────────
  onProvinciaChange(provinciaId: string): void {
    const id = Number(provinciaId);
    const prov = this.provincias().find(p => p.id === id);
    this.municipiosFiltrados.set(this.ubicacionService.municipiosDeProvincia(id));
    this.form.patchValue({ _provinciaNombre: prov?.nombre ?? '', _municipioNombre: '', _sectorNombre: '', _barrioNombre: '' });
    this.sectorTexto.set('');
    this.barrioTexto.set('');
    this.sectoresAutocomplete.set([]);
    this.barriosAutocomplete.set([]);
  }

  onMunicipioChange(municipioNombre: string): void {
    this.form.patchValue({ _municipioNombre: municipioNombre, _sectorNombre: '', _barrioNombre: '' });
    this.sectorTexto.set('');
    this.barrioTexto.set('');
    this.sectoresAutocomplete.set([]);
    this.barriosAutocomplete.set([]);
  }

  onSectorInput(texto: string): void {
    this.sectorTexto.set(texto);
    this.form.patchValue({ _sectorNombre: texto });
    const municipioNombre = this.form.get('_municipioNombre')?.value;
    const provinciaId = Number(this.form.get('_provinciaId')?.value);
    if (municipioNombre) {
      const resultados = this.ubicacionService.buscarSectores(municipioNombre, provinciaId, texto);
      this.sectoresAutocomplete.set(resultados);
      this.mostrarSugerenciasSector.set(resultados.length > 0);
    }
  }

  seleccionarSector(sector: Sector): void {
    this.sectorTexto.set(sector.nombre);
    this.form.patchValue({ _sectorNombre: sector.nombre });
    this.mostrarSugerenciasSector.set(false);
    this.sectoresAutocomplete.set([]);
    this.barrioTexto.set('');
    this.form.patchValue({ _barrioNombre: '' });
  }

  cerrarSugerenciasSector(): void {
    setTimeout(() => this.mostrarSugerenciasSector.set(false), 200);
  }

  cerrarSugerenciasBarrio(): void {
    setTimeout(() => this.mostrarSugerenciasBarrio.set(false), 200);
  }

  onBarrioInput(texto: string): void {
    this.barrioTexto.set(texto);
    this.form.patchValue({ _barrioNombre: texto });
    const municipioNombre = this.form.get('_municipioNombre')?.value;
    const provinciaId = Number(this.form.get('_provinciaId')?.value);
    if (municipioNombre) {
      const resultados = this.ubicacionService.buscarBarriosPorMunicipio(municipioNombre, provinciaId, texto);
      this.barriosAutocomplete.set(resultados);
      this.mostrarSugerenciasBarrio.set(resultados.length > 0);
    }
  }

  seleccionarBarrio(barrio: Barrio): void {
    this.barrioTexto.set(barrio.nombre);
    this.form.patchValue({ _barrioNombre: barrio.nombre });
    
    // Auto-completar el sector asociado a este barrio
    const sec = this.ubicacionService.obtenerSectorPorId(barrio.seccionId);
    if (sec) {
      this.sectorTexto.set(sec.nombre);
      this.form.patchValue({ _sectorNombre: sec.nombre });
    }
    
    this.mostrarSugerenciasBarrio.set(false);
    this.barriosAutocomplete.set([]);
  }

  // ── Guardar ───────────────────────────────────────────────────
  async guardar(): Promise<void> {
    if (!this.form.valid) {
      this.notificacionService.error('Por favor completa todos los campos requeridos');
      this.form.markAllAsTouched();
      return;
    }

    if (this.celdaLlena) {
      this.notificacionService.error(`La celda ${this.form.get('celda')?.value} del pabellón ${this.form.get('pabellon')?.value} ha alcanzado su capacidad máxima (${this.capacidadPorCelda} personas).`);
      return;
    }
    this.guardando = true;
    try {
      const fv = this.form.getRawValue();

      // Construir dirección concatenada (compatible con modelo actual)
      const partesDireccion = [
        fv._calle,
        fv._barrioNombre,
        fv._sectorNombre,
        fv._municipioNombre,
        fv._provinciaNombre
      ].filter(Boolean);
      const direccion = partesDireccion.join(', ');

      const reclusoBase = {
        numeroIdentificacion: fv.numeroIdentificacion,
        numeroExpediente: fv.numeroExpediente || '',
        nombre: fv.nombre,
        apellido: fv.apellido,
        fechaNacimiento: new Date(fv.fechaNacimiento),
        sexo: fv.sexo,
        nacionalidad: fv.nacionalidad,
        estadoCivil: fv.estadoCivil || '',
        direccion,
        telefono: fv.telefono || '',
        nombreContactoEmergencia: fv.nombreContactoEmergencia,
        telefonoEmergencia: fv.telefonoEmergencia || '',
        pabellon: fv.pabellon,
        celda: fv.celda,
        fechaIngreso: new Date(fv.fechaIngreso),
        situacionLegal: fv.situacionLegal,
        estado: fv.estado,
        delito: fv.delito || '',
        observaciones: fv.observaciones || ''
      };

      // Omitir cedula/pasaporte/sentencia si no aplican (Firestore rechaza undefined)
      const recluso: any = { ...reclusoBase };
      if (this.esDominicano() && fv.cedula) recluso['cedula'] = fv.cedula;
      if (!this.esDominicano() && fv.pasaporte) recluso['pasaporte'] = fv.pasaporte;
      if (fv.sentencia) recluso['sentencia'] = Number(fv.sentencia);

      const resultado = await this.reclusosService.agregarRecluso(recluso);
      if (resultado.success) {
        this.notificacionService.success(resultado.message);
        this.reclusoAgregado.emit();
        this.cerrar();
      } else {
        this.notificacionService.error(resultado.message || 'Error al guardar el recluso');
      }
    } catch (error) {
      this.notificacionService.error('Error inesperado al guardar');
      console.error(error);
    } finally {
      this.guardando = false;
    }
  }

  cerrar(): void {
    this.showModal = false;
    this.showModalChange.emit(false);
    this.form.reset();
    this.municipiosFiltrados.set([]);
    this.sectorTexto.set('');
    this.barrioTexto.set('');
    this.sectoresAutocomplete.set([]);
    this.barriosAutocomplete.set([]);
  }
}