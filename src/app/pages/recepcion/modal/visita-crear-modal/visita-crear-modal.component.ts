// src/app/features/visitas/components/visita-crear-modal/visita-crear-modal.component.ts

import { Component, EventEmitter, Input, Output, OnChanges, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Firestore, collection, query, where, getDocs, Timestamp } from '@angular/fire/firestore';
import { VisitasService } from '@core/services/visitas.service';
import { ReclusosService } from '@core/services/reclusos.service';
import { ConfiguracionService } from '@core/services/configuracion.service';
import { NotificacionService } from '@core/services/notificacion.service';
import { TipoVisita } from '@core/models/enums.interface';
import { CrearVisitaDTO } from '@core/models/visitas.interface';
import { ModalComponent } from '@shared/modal/modal.component';

@Component({
  selector: 'prisionConnect-visita-crear-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ModalComponent],
  templateUrl: './visita-crear-modal.component.html'
})
export class VisitaCrearModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Output() isOpenChange = new EventEmitter<boolean>();
  @Output() visitaCreada = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private firestore = inject(Firestore);
  private visitasService = inject(VisitasService);
  private reclusosService = inject(ReclusosService);
  private configuracionService = inject(ConfiguracionService);
  private notificacionService = inject(NotificacionService);

  TipoVisita = TipoVisita;

  form: FormGroup;
  guardando = false;

  reclusos = this.reclusosService.reclusos;
  visitantes: any[] = [];
  abogados: any[] = [];
  areas: string[] = [];
  amigos: any[] = [];

  searchRecluso = '';
  searchVisitante = '';
  searchAbogado = '';

  reclusosFiltrados = computed(() => {
    const search = this.searchRecluso.toLowerCase();
    if (!search) return this.reclusos();
    
    return this.reclusos().filter(r => 
      r.nombreCompleto.toLowerCase().includes(search) ||
      r.cedula?.toLowerCase().includes(search) ||
      r.pabellon?.toLowerCase().includes(search) ||
      r.celda?.toLowerCase().includes(search)
    );
  });

  get visitantesFiltrados() {
    const search = this.searchVisitante.toLowerCase();
    if (!search) return this.visitantes;
    
    return this.visitantes.filter(v => 
      v.nombre.toLowerCase().includes(search) ||
      v.cedula?.toLowerCase().includes(search) ||
      v.parentesco?.toLowerCase().includes(search)
    );
  }

  get abogadosFiltrados() {
    const search = this.searchAbogado.toLowerCase();
    if (!search) return this.abogados;
    
    return this.abogados.filter(a => 
      a.nombre.toLowerCase().includes(search) ||
      a.exequatur?.toLowerCase().includes(search)
    );
  }

  constructor() {
    this.form = this.fb.group({
      tipo: [TipoVisita.FAMILIAR, Validators.required],
      reclusoId: ['', Validators.required],
      visitantes: [[]],
      abogadoId: [''],
      fechaVisita: ['', Validators.required],
      horaInicioProgramada: ['', Validators.required],
      horaFinProgramada: ['', Validators.required],
      areaVisita: ['', Validators.required],
      observaciones: ['']
    });

    this.form.get('tipo')?.valueChanges.subscribe((tipo) => {
      this.actualizarValidaciones(tipo);
    });

    this.form.get('reclusoId')?.valueChanges.subscribe((reclusoId) => {
      if (reclusoId) {
        this.cargarDatosRecluso(reclusoId);
      }
    });
  }

  ngOnChanges(): void {
    if (this.isOpen) {
      this.cargarDatos();
      this.form.reset({ tipo: TipoVisita.FAMILIAR, visitantes: [], abogadoId: '' });
      this.searchRecluso = '';
      this.searchVisitante = '';
      this.searchAbogado = '';
      this.actualizarValidaciones(TipoVisita.FAMILIAR);
    }
  }

  private async cargarDatos(): Promise<void> {
    const config = this.configuracionService.configuracion();
    if (config) {
      this.areas = config.areasVisita;
    }
  }

  private actualizarValidaciones(tipo: TipoVisita): void {
    const visitantesControl = this.form.get('visitantes');
    const abogadoControl = this.form.get('abogadoId');

    visitantesControl?.clearValidators();
    abogadoControl?.clearValidators();

    if (tipo === TipoVisita.FAMILIAR || tipo === TipoVisita.AMISTADES) {
      visitantesControl?.setValidators([Validators.required, Validators.minLength(1)]);
      abogadoControl?.setValue('');
    } else {
      abogadoControl?.setValidators([Validators.required]);
      visitantesControl?.setValue([]);
    }

    visitantesControl?.updateValueAndValidity();
    abogadoControl?.updateValueAndValidity();
  }

  private async cargarDatosRecluso(reclusoId: string): Promise<void> {
    try {
      const relacionesVisitantesRef = collection(this.firestore, 'relaciones_visitantes');
      const qVisitantes = query(
        relacionesVisitantesRef,
        where('reclusoId', '==', reclusoId),
        where('autorizado', '==', true),
        where('activo', '==', true)
      );
      
      const visitantesSnap = await getDocs(qVisitantes);
      this.visitantes = visitantesSnap.docs.map(doc => ({
        visitanteId: doc.data()['visitanteId'],
        nombre: doc.data()['visitanteNombre'],
        cedula: doc.data()['visitanteCedula'] || '',
        parentesco: doc.data()['parentesco']
      }));

      const relacionesAbogadosRef = collection(this.firestore, 'relaciones_abogados');
      const qAbogados = query(
        relacionesAbogadosRef,
        where('reclusoId', '==', reclusoId),
        where('activo', '==', true)
      );
      
      const abogadosSnap = await getDocs(qAbogados);
      this.abogados = abogadosSnap.docs.map(doc => ({
        abogadoId: doc.data()['abogadoId'],
        nombre: doc.data()['abogadoNombre'],
        exequatur: doc.data()['abogadoExequatur']
      }));
    } catch (error) {
      console.error('Error cargando datos del recluso:', error);
      this.visitantes = [];
      this.abogados = [];
    }
  }

  toggleVisitante(visitanteId: string): void {
    const visitantesActuales = [...(this.form.get('visitantes')?.value || [])];
    const index = visitantesActuales.indexOf(visitanteId);

    if (index > -1) {
      visitantesActuales.splice(index, 1);
    } else {
      visitantesActuales.push(visitanteId);
    }

    this.form.patchValue({ visitantes: visitantesActuales });
    this.form.get('visitantes')?.markAsTouched();
  }

  estaSeleccionado(visitanteId: string): boolean {
    const visitantesActuales = this.form.get('visitantes')?.value || [];
    return visitantesActuales.includes(visitanteId);
  }

  esFormularioValido(): boolean {
    const tipo = this.form.get('tipo')?.value;
    const reclusoId = this.form.get('reclusoId')?.value;
    const fechaVisita = this.form.get('fechaVisita')?.value;
    const horaInicio = this.form.get('horaInicioProgramada')?.value;
    const horaFin = this.form.get('horaFinProgramada')?.value;
    const area = this.form.get('areaVisita')?.value;

    if (!reclusoId || !fechaVisita || !horaInicio || !horaFin || !area) {
      return false;
    }

    if (tipo === TipoVisita.FAMILIAR) {
      const visitantes = this.form.get('visitantes')?.value || [];
      return visitantes.length > 0;
    } else {
      const abogadoId = this.form.get('abogadoId')?.value;
      return !!abogadoId;
    }
  }

async guardar(): Promise<void> {
  if (this.guardando) return; // Prevenir doble submit
  this.guardando = true;

  const formValue = this.form.value;

  // Creamos la fecha asegurándonos de que no tenga horas/minutos extraños
  const fechaSeleccionada = new Date(formValue.fechaVisita + 'T12:00:00'); 

  const dto: CrearVisitaDTO = {
    tipo: formValue.tipo,
    reclusoId: formValue.reclusoId,
    visitantes: formValue.tipo === TipoVisita.FAMILIAR ? formValue.visitantes : undefined,
    abogadoId: formValue.tipo === TipoVisita.LEGAL ? formValue.abogadoId : undefined,
    
    // CAMBIO AQUÍ: Convertimos a Timestamp de Firestore antes de enviar
    fechaVisita: Timestamp.fromDate(fechaSeleccionada) as any, 
    
    horaInicioProgramada: formValue.horaInicioProgramada,
    horaFinProgramada: formValue.horaFinProgramada,
    areaVisita: formValue.areaVisita,
    observaciones: formValue.observaciones
  };

  const resultado = await this.visitasService.crearVisita(dto);
  // ... rest of the code

    if (resultado.success) {
      // Intentar obtener el nombre del recluso para el ticket
      const reclusoSeleccionado = this.reclusos().find(r => r.id === formValue.reclusoId);
      const nombreRecluso = reclusoSeleccionado ? reclusoSeleccionado.nombreCompleto : 'Recluso';
      const areaDestino = formValue.areaVisita;
      const hora = formValue.horaInicioProgramada;

      // Generar tarjeta HTML tipo Ticket
      const html = `
        <div style="background: #f8fafc; border-radius: 12px; padding: 16px; margin-top: 10px; border: 1px dashed #94a3b8; text-align: center;">
          <div style="color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Ticket de Entrada</div>
          <div style="font-size: 24px; font-weight: bold; color: #0f172a; margin-bottom: 12px;">${nombreRecluso}</div>
          
          <div style="display: flex; justify-content: space-between; border-top: 1px dashed #cbd5e1; padding-top: 12px; margin-top: 12px; text-align: left;">
            <div>
              <div style="color: #64748b; font-size: 12px;">Área</div>
              <div style="color: #0f766e; font-weight: bold; font-size: 14px;">${areaDestino}</div>
            </div>
            <div style="text-align: right;">
              <div style="color: #64748b; font-size: 12px;">Hora Inicio</div>
              <div style="color: #0f172a; font-weight: bold; font-size: 14px;">${hora}</div>
            </div>
          </div>
          
          <div style="margin-top: 12px; font-size: 13px; color: #64748b; font-weight: 500;">
            Tipo: ${formValue.tipo}
          </div>
        </div>
      `;

      this.notificacionService.successCard('Visita Registrada', html);
      this.visitaCreada.emit();
      this.cerrar();
    } else {
      this.notificacionService.error(resultado.message);
    }

    this.guardando = false;
  }

  cerrar(): void {
    this.isOpen = false;
    this.isOpenChange.emit(false);
    this.form.reset({ tipo: TipoVisita.FAMILIAR, visitantes: [], abogadoId: '' });
    this.visitantes = [];
    this.abogados = [];
    this.searchRecluso = '';
    this.searchVisitante = '';
    this.searchAbogado = '';
  }
}