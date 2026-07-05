import { ChangeDetectionStrategy, Component, inject, signal, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { VisitantesService } from '@core/services/visitantes.service';
import { NotificacionService } from '@core/services/notificacion.service';
import { UbicacionRDService, Municipio, Sector, Barrio } from '@core/services/ubicacion-rd.service';
import { CrearVisitanteDTO, Visitante } from '@core/models';
import { ModalComponent } from "@shared/modal/modal.component";
import { CedulaMaskDirective } from "@shared/directives/cedula-mask.directive";
import { TelefonoMaskDirective } from "@shared/directives/telefono.mask.directive";
import { cedulaDominicanaValidator, emailValidator, telefonoDominicanoValidator } from '@shared/validators/custom.validators';
import { InputComponent } from '@shared/input/input.component';
import { ButtonComponent } from '@shared/button/buttton.component';

@Component({
  selector: 'prisionConnect-visitante-agregar-modal',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalComponent,
    CedulaMaskDirective,
    TelefonoMaskDirective,
    InputComponent,
    ButtonComponent
],
  templateUrl: './visitante-agregar-modal.component.html',
})
export class VisitanteAgregarModalComponent {
  private fb = inject(FormBuilder);
  private visitantesService = inject(VisitantesService);
  private notificacion = inject(NotificacionService);
  private ubicacionService = inject(UbicacionRDService);

  @Input() showModal = false;
  @Input() visitanteEditar: Visitante | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() guardado = new EventEmitter<Visitante>();

  guardando = signal(false);
  modoEdicion = signal(false);

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

  visitanteForm: FormGroup;

  constructor() {
    this.visitanteForm = this.fb.group({
      // Datos personales
      cedula: ['', [
        Validators.required, 
        cedulaDominicanaValidator()
      ]],
      nombre: ['', [
        Validators.required, 
        Validators.minLength(2)
      ]],
      apellido: ['', [
        Validators.required, 
        Validators.minLength(2)
      ]],

      // Contacto
      telefono: ['', [
        Validators.required,
        telefonoDominicanoValidator()
      ]],
      email: ['', [emailValidator()]],

      // Dirección en cascada
      _provinciaId: [''],
      _provinciaNombre: [''],
      _municipioNombre: [''],
      _sectorNombre: [''],
      _barrioNombre: [''],
      _calle: ['', [Validators.required, Validators.minLength(5)]],

      // Observaciones
      observaciones: ['']
    });
  }

  ngOnInit() {
    this.ubicacionService.cargarTodo();
    if (this.visitanteEditar) {
      this.modoEdicion.set(true);
      this.cargarDatos(this.visitanteEditar);
    }
  }

  ngOnChanges() {
    if (this.visitanteEditar) {
      this.modoEdicion.set(true);
      this.cargarDatos(this.visitanteEditar);
    } else {
      this.modoEdicion.set(false);
      this.visitanteForm.reset();
    }
  }

  /**
   * Cargar datos del visitante en el formulario
   */
  cargarDatos(visitante: Visitante): void {
    this.visitanteForm.patchValue({
      cedula: visitante.cedula,
      nombre: visitante.nombre,
      apellido: visitante.apellido,
      telefono: visitante.telefono,
      email: visitante.email || '',
      _calle: visitante.direccion || '',
      observaciones: visitante.observaciones || ''
    });
    this.visitanteForm.get('cedula')?.disable();
  }

  // ── Dirección en cascada ─────────────────────────────────────
  onProvinciaChange(provinciaId: string): void {
    const id = Number(provinciaId);
    const prov = this.provincias().find(p => p.id === id);
    this.municipiosFiltrados.set(this.ubicacionService.municipiosDeProvincia(id));
    this.visitanteForm.patchValue({ _provinciaNombre: prov?.nombre ?? '', _municipioNombre: '', _sectorNombre: '', _barrioNombre: '' });
    this.sectorTexto.set('');
    this.barrioTexto.set('');
    this.sectoresAutocomplete.set([]);
    this.barriosAutocomplete.set([]);
  }

  onMunicipioChange(municipioNombre: string): void {
    this.visitanteForm.patchValue({ _municipioNombre: municipioNombre, _sectorNombre: '', _barrioNombre: '' });
    this.sectorTexto.set('');
    this.barrioTexto.set('');
    this.sectoresAutocomplete.set([]);
    this.barriosAutocomplete.set([]);
  }

  onSectorInput(texto: string): void {
    this.sectorTexto.set(texto);
    this.visitanteForm.patchValue({ _sectorNombre: texto });
    const municipioNombre = this.visitanteForm.get('_municipioNombre')?.value;
    const provinciaId = Number(this.visitanteForm.get('_provinciaId')?.value);
    if (municipioNombre) {
      const resultados = this.ubicacionService.buscarSectores(municipioNombre, provinciaId, texto);
      this.sectoresAutocomplete.set(resultados);
      this.mostrarSugerenciasSector.set(resultados.length > 0);
    }
  }

  seleccionarSector(sector: Sector): void {
    this.sectorTexto.set(sector.nombre);
    this.visitanteForm.patchValue({ _sectorNombre: sector.nombre });
    this.mostrarSugerenciasSector.set(false);
    this.sectoresAutocomplete.set([]);
    this.barrioTexto.set('');
    this.visitanteForm.patchValue({ _barrioNombre: '' });
  }

  cerrarSugerenciasSector(): void {
    setTimeout(() => this.mostrarSugerenciasSector.set(false), 200);
  }

  cerrarSugerenciasBarrio(): void {
    setTimeout(() => this.mostrarSugerenciasBarrio.set(false), 200);
  }

  onBarrioInput(texto: string): void {
    this.barrioTexto.set(texto);
    this.visitanteForm.patchValue({ _barrioNombre: texto });
    const municipioNombre = this.visitanteForm.get('_municipioNombre')?.value;
    const provinciaId = Number(this.visitanteForm.get('_provinciaId')?.value);
    if (municipioNombre) {
      const resultados = this.ubicacionService.buscarBarriosPorMunicipio(municipioNombre, provinciaId, texto);
      this.barriosAutocomplete.set(resultados);
      this.mostrarSugerenciasBarrio.set(resultados.length > 0);
    }
  }

  seleccionarBarrio(barrio: Barrio): void {
    this.barrioTexto.set(barrio.nombre);
    this.visitanteForm.patchValue({ _barrioNombre: barrio.nombre });
    
    // Auto-completar el sector asociado a este barrio
    const sec = this.ubicacionService.obtenerSectorPorId(barrio.seccionId);
    if (sec) {
      this.sectorTexto.set(sec.nombre);
      this.visitanteForm.patchValue({ _sectorNombre: sec.nombre });
    }
    
    this.mostrarSugerenciasBarrio.set(false);
    this.barriosAutocomplete.set([]);
  }

    aplicarMascaraCedula(event: any): void {
    let valor = event.target.value.replace(/\D/g, '');
    if (valor.length > 11) valor = valor.substring(0, 11);
    if (valor.length >= 3) valor = valor.substring(0, 3) + '-' + valor.substring(3);
    if (valor.length >= 11) valor = valor.substring(0, 11) + '-' + valor.substring(11);
    this.visitanteForm.patchValue({ cedula: valor }, { emitEvent: false });
  }

  aplicarMascaraTelefono(event: any): void {
    let valor = event.target.value.replace(/\D/g, '');
    if (valor.length > 10) valor = valor.substring(0, 10);
    if (valor.length >= 3) valor = '(' + valor.substring(0, 3) + ') ' + valor.substring(3);
    if (valor.length >= 9) {
      const parts = valor.split(') ');
      if (parts[1] && parts[1].length > 3) {
        valor = parts[0] + ') ' + parts[1].substring(0, 3) + '-' + parts[1].substring(3);
      }
    }
    this.visitanteForm.patchValue({ telefono: valor }, { emitEvent: false });
  }

  /**
   * Cerrar modal
   */
  closeModal(): void {
    this.visitanteForm.reset();
    this.modoEdicion.set(false);
    this.visitanteForm.get('cedula')?.enable();
    this.municipiosFiltrados.set([]);
    this.sectorTexto.set('');
    this.barrioTexto.set('');
    this.close.emit();
  }

  /**
   * Enviar formulario
   */
  async onSubmit(): Promise<void> {
    if (this.visitanteForm.invalid) {
      this.marcarCamposComoTocados();
      this.notificacion.warning(
        'Por favor completa todos los campos requeridos',
        'Formulario Incompleto'
      );
      return;
    }
      await this.crear();
  }

  /**
   * Crear nuevo visitante
   */
  async crear(): Promise<void> {
    this.guardando.set(true);
    const fv = this.visitanteForm.value;
    const partesDireccion = [fv._calle, fv._barrioNombre, fv._sectorNombre, fv._municipioNombre, fv._provinciaNombre].filter(Boolean);
    const direccion = partesDireccion.join(', ') || fv._calle || '';

    const dto: CrearVisitanteDTO = {
      cedula: this.visitanteForm.value.cedula,
      nombre: fv.nombre,
      apellido: fv.apellido,
      telefono: fv.telefono,
      direccion,
      email: fv.email || undefined,
      fotoUrl: undefined
    };

    const resultado = await this.visitantesService.crear(dto);
    this.guardando.set(false);

    if (resultado.exito) {
      this.notificacion.success(resultado.mensaje || 'Visitante creado exitosamente');
      this.guardado.emit(resultado.data!);
      this.closeModal();
    } else {
      await this.notificacion.error(resultado.mensaje, 'Error al crear visitante');
    }
  }

  
  /**
   * Marcar todos los campos como tocados
   */
  private marcarCamposComoTocados(): void {
    Object.keys(this.visitanteForm.controls).forEach(key => {
      this.visitanteForm.get(key)?.markAsTouched();
    });
  }

  /**
   * Verificar si ya existe un visitante con esa cédula
   */
  async verificarCedulaDuplicada(): Promise<void> {
    const cedula = this.visitanteForm.get('cedula')?.value;
    
    if (!cedula || this.modoEdicion()) return;

    const existe = await this.visitantesService.existePorCedula(cedula);
    
    if (existe) {
      this.notificacion.warning(
        'Ya existe un visitante registrado con esta cédula',
        'Cédula Duplicada'
      );
      this.visitanteForm.get('cedula')?.setErrors({ duplicado: true });
    }
  }
}