import { Component, Input, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrackByFunction } from '@angular/core';

@Component({
  selector: 'prisionConnect-responsive-cards',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cards.component.html',
})
export class CardsComponent<T = any> {

  @Input({ required: true }) items: T[] = [];

  @Input({ required: true }) cardTemplate!: TemplateRef<any>;

  /** TrackBy siempre definido */
  @Input() trackBy: TrackByFunction<T> = this.defaultTrackBy;

  /** TrackBy por defecto */
  defaultTrackBy(index: number, _item: T): number {
    return index;
  }
}
