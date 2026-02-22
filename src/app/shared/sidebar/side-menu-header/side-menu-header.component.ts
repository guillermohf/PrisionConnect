// src/app/shared/components/sidebar/side-menu-header/side-menu-header.component.ts

import { Component, input, output, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'prisionConnect-side-menu-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './side-menu-header.component.html',
  styleUrls: ['./side-menu-header.component.scss']
})
export class SideMenuHeaderComponent {
  
  private authService = inject(AuthService);

  // Inputs
  expanded = input.required<boolean>();

  // Outputs
  toggle = output<void>();

  // Usuario actual
  user = computed(() => this.authService.currentUser());

  onToggle(): void {
    this.toggle.emit();
  }
}