import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'prisionConnect-button',
  standalone: true, 
  templateUrl: './button.component.html',
  imports: [CommonModule],
})
export class ButtonComponent {
  @Input() icon?: string;
  @Input() label?: string;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() variant: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info' | 'outline' | 'ghost' | 'link' = 'primary';
  @Input() size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() fullWidth: boolean = false;
  @Input() width?: string;
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() iconOnly: boolean = false;
  @Input() customClass?: string;

  @Output() click = new EventEmitter<void>();

  onClick(event: Event) {
    if (!this.disabled && !this.loading) {
      // Para submit, dejamos que el evento natural del form se ejecute
      if (this.type !== 'submit') {
        event.preventDefault();
        this.click.emit();
      }
      // Para submit, no hacemos preventDefault y el form se enviará normalmente
    } else {
      event.preventDefault();
    }
  }

  getButtonClasses(): string {
    const baseClasses = this.getBaseClasses();
    const variantClasses = this.getVariantClasses();
    const sizeClasses = this.getSizeClasses();
    const widthClasses = this.getWidthClasses();
    const stateClasses = this.getStateClasses();
    const customClasses = this.customClass || '';

    return [
      baseClasses,
      variantClasses,
      sizeClasses,
      widthClasses,
      stateClasses,
      customClasses
    ].filter(className => className).join(' ');
  }

  private getBaseClasses(): string {
    return [
      'inline-flex',
      'items-center',
      'justify-center',
      'font-medium',
      'rounded-lg',
      'transition-all',
      'duration-200',
      'ease-in-out',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-offset-2',
      'gap-2'
    ].join(' ');
  }

  private getVariantClasses(): string {
    const variants = {
      primary: [
        'text-white',
        'bg-teal-600',
        'border',
        'border-teal-600',
        'hover:bg-teal-700',
        'hover:border-teal-700',
        'focus:ring-teal-500',
        'active:bg-teal-800',
        'shadow-sm'
      ].join(' '),
      
      secondary: [
        'text-gray-700',
        'bg-white',
        'border',
        'border-gray-300',
        'hover:bg-gray-50',
        'hover:border-gray-400',
        'focus:ring-gray-500',
        'active:bg-gray-100',
        'shadow-sm'
      ].join(' '),
      
      danger: [
        'text-white',
        'bg-red-600',
        'border',
        'border-red-600',
        'hover:bg-red-700',
        'hover:border-red-700',
        'focus:ring-red-500',
        'active:bg-red-800',
        'shadow-sm'
      ].join(' '),
      
      success: [
        'text-white',
        'bg-green-600',
        'border',
        'border-green-600',
        'hover:bg-green-700',
        'hover:border-green-700',
        'focus:ring-green-500',
        'active:bg-green-800',
        'shadow-sm'
      ].join(' '),
      
      warning: [
        'text-white',
        'bg-yellow-600',
        'border',
        'border-yellow-600',
        'hover:bg-yellow-700',
        'hover:border-yellow-700',
        'focus:ring-yellow-500',
        'active:bg-yellow-800',
        'shadow-sm'
      ].join(' '),
      
      info: [
        'text-white',
        'bg-blue-600',
        'border',
        'border-blue-600',
        'hover:bg-blue-700',
        'hover:border-blue-700',
        'focus:ring-blue-500',
        'active:bg-blue-800',
        'shadow-sm'
      ].join(' '),
      
      outline: [
        'text-teal-600',
        'bg-transparent',
        'border',
        'border-teal-600',
        'hover:bg-teal-50',
        'hover:text-teal-700',
        'hover:border-teal-700',
        'focus:ring-teal-500',
        'active:bg-teal-100'
      ].join(' '),
      
      ghost: [
        'text-teal-600',
        'bg-transparent',
        'border',
        'border-transparent',
        'hover:bg-teal-50',
        'hover:text-teal-700',
        'focus:ring-teal-500',
        'active:bg-teal-100'
      ].join(' '),
      
      link: [
        'text-teal-600',
        'bg-transparent',
        'border',
        'border-transparent',
        'hover:text-teal-700',
        'focus:ring-teal-500',
        'underline',
        'shadow-none'
      ].join(' ')
    };

    return variants[this.variant] || variants.primary;
  }

  private getSizeClasses(): string {
    if (this.iconOnly) {
      const iconOnlySizes = {
        xs: 'p-1',
        sm: 'p-1.5',
        md: 'p-2',
        lg: 'p-2.5',
        xl: 'p-3'
      };
      return iconOnlySizes[this.size];
    }

    const sizes = {
      xs: 'px-2 py-1 text-xs',
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-5 py-2.5 text-base',
      xl: 'px-6 py-3 text-lg'
    };

    return sizes[this.size];
  }

  private getWidthClasses(): string {
    if (this.width) {
      return '';
    }
    return this.fullWidth ? 'w-full' : '';
  }

  private getStateClasses(): string {
    const classes: string[] = [];

    if (this.disabled || this.loading) {
      classes.push('opacity-50', 'cursor-not-allowed');
    } else {
      classes.push('cursor-pointer');
    }

    if (this.loading) {
      classes.push('pointer-events-none');
    }

    return classes.join(' ');
  }

  getIconSize(): string {
    const sizes = {
      xs: 'text-sm',
      sm: 'text-base',
      md: 'text-lg',
      lg: 'text-xl',
      xl: 'text-2xl'
    };

    return sizes[this.size];
  }
}