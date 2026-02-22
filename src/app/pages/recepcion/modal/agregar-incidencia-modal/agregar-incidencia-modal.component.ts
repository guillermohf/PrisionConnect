// src/app/features/visitas/components/agregar-incidencia-modal/agregar-incidencia-modal.component.ts

import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { VisitasService } from '@core/services/visitas.service';
import { NotificacionService } from '@core/services/notificacion.service';
import { Visita, AgregarIncidenciaDTO } from '@core/models/visitas.interface';
import { TipoIncidencia, GravedadIncidencia } from '@core/models/enums.interface';
import { ModalComponent } from "@shared/modal/modal.component";

@Component({
  selector: 'prisionConnect-agregar-incidencia-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './agregar-incidencia-modal.component.html'
})
export class AgregarIncidenciaModalComponent {
  @Input() isOpen = false;
  @Input() visita: Visita | null = null;
  @Output() isOpenChange = new EventEmitter<boolean>();
  @Output() incidenciaAgregada = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private visitasService = inject(VisitasService);
  private notificacionService = inject(NotificacionService);

  TipoIncidencia = TipoIncidencia;
  GravedadIncidencia = GravedadIncidencia;

  form: FormGroup;
  guardando = false;

  constructor() {
    this.form = this.fb.group({
      tipo: ['', Validators.required],
      descripcion: ['', [Validators.required, Validators.minLength(10)]],
      gravedad: [GravedadIncidencia.LEVE, Validators.required]
    });
  }

  ngOnChanges(): void {
    if (this.isOpen) {
      this.form.reset({ gravedad: GravedadIncidencia.LEVE });
    }
  }

  async guardar(): Promise<void> {
    if (this.form.invalid || !this.visita) return;

    this.guardando = true;

    const dto: AgregarIncidenciaDTO = {
      visitaId: this.visita.id!,
      tipo: this.form.value.tipo,
      descripcion: this.form.value.descripcion,
      gravedad: this.form.value.gravedad
    };

    const resultado = await this.visitasService.agregarIncidencia(dto);

    if (resultado.success) {
      this.incidenciaAgregada.emit();
      this.cerrar();
    } else {
      this.notificacionService.error(resultado.message);
    }

    this.guardando = false;
  }

  cerrar(): void {
    this.isOpen = false;
    this.isOpenChange.emit(false);
    this.form.reset({ gravedad: GravedadIncidencia.LEVE });
  }
}