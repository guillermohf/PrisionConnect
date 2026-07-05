// src/app/core/services/ubicacion-rd.service.ts

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface Provincia {
  id: number;
  nombre: string;
}

export interface Municipio {
  nombre: string;
  provinciaId: number;
}

export interface Sector {
  id: number;
  nombre: string;
  municipioId: number;
  distritoId?: number | null;
}

export interface Barrio {
  id: number;
  nombre: string;
  seccionId: number; // seccionId = sector.id
}

@Injectable({ providedIn: 'root' })
export class UbicacionRDService {
  private http = inject(HttpClient);
  private readonly BASE = 'assets/data';

  // Estado interno
  private _provincias = signal<Provincia[]>([]);
  private _municipios = signal<Municipio[]>([]);
  private _sectores = signal<Sector[]>([]);
  private _barrios = signal<Barrio[]>([]);
  private _cargado = signal(false);
  private _nacionalidades = signal<string[]>([]);

  // Públicos
  readonly provincias = this._provincias.asReadonly();
  readonly cargando = signal(false);
  readonly cargandoNacionalidades = signal(false);
  readonly nacionalidades = this._nacionalidades.asReadonly();

  // Filtrar municipios por provincia (devuelve array simple)
  municipiosDeProvincia(provinciaId: number): Municipio[] {
    return this._municipios().filter(m => m.provinciaId === provinciaId);
  }

  // Filtrar sectores por municipio (usa el nombre del municipio como referencia)
  // El JSON de sectores usa municipioId que coincide con provinciaId+índice
  // Alternativa: filtrar por municipioId que en secciones.json es el índice base 1 dentro de la provincia
  // NOTA: El repo mapea municipioId al orden del municipio en todo el array (1-based global index)
  sectorenDeMunicipio(municipioNombre: string, provinciaId: number): Sector[] {
    // Encontrar el índice global del municipio (1-based)
    const allMunicipios = this._municipios();
    const idx = allMunicipios.findIndex(
      m => m.nombre === municipioNombre && m.provinciaId === provinciaId
    );
    if (idx === -1) return [];
    const municipioId = idx + 1; // 1-based global index
    return this._sectores().filter(s => s.municipioId === municipioId);
  }

  // Autocomplete sectores
  buscarSectores(municipioNombre: string, provinciaId: number, texto: string): Sector[] {
    if (!texto || texto.length < 2) return [];
    const lower = texto.toLowerCase();
    const sectores = this.sectorenDeMunicipio(municipioNombre, provinciaId);
    return sectores
      .filter(s => s.nombre.toLowerCase().includes(lower))
      .slice(0, 10);
  }

  // Autocomplete barrios por sectorId
  buscarBarrios(sectorId: number, texto: string): Barrio[] {
    if (!texto || texto.length < 2) return [];
    const lower = texto.toLowerCase();
    return this._barrios()
      .filter(b => b.seccionId === sectorId && b.nombre.toLowerCase().includes(lower))
      .slice(0, 10);
  }

  // Carga única de los 4 JSONs
  async cargarTodo(): Promise<void> {
    if (this._cargado()) return;
    this.cargando.set(true);
    try {
      const [provincias, municipios, sectores, barrios] = await Promise.all([
        firstValueFrom(this.http.get<Provincia[]>(`${this.BASE}/provincias.json`)),
        firstValueFrom(this.http.get<Municipio[]>(`${this.BASE}/municipios.json`)),
        firstValueFrom(this.http.get<Sector[]>(`${this.BASE}/sectores.json`)),
        firstValueFrom(this.http.get<Barrio[]>(`${this.BASE}/barrios.json`))
      ]);
      this._provincias.set(provincias);
      this._municipios.set(municipios);
      this._sectores.set(sectores);
      this._barrios.set(barrios);
      this._cargado.set(true);
    } catch (error) {
      console.error('Error cargando datos de ubicación:', error);
    } finally {
      this.cargando.set(false);
    }
  }

  // Carga de nacionalidades desde countries.dev
  async cargarNacionalidades(): Promise<void> {
    if (this._nacionalidades().length > 0) return;
    this.cargandoNacionalidades.set(true);
    try {
      const data = await firstValueFrom(
        this.http.get<any[]>('https://countries.dev/api/countries')
      );
      const lista: string[] = data
        .map(p => p.demonyms?.spa?.f ?? p.translations?.spa?.common ?? p.name)
        .filter(Boolean)
        .sort((a: string, b: string) => a.localeCompare(b, 'es'));

      const prioritarias = ['Dominicana', 'Haitiana'];
      const resto = lista.filter((n: string) => !prioritarias.includes(n));
      this._nacionalidades.set([...prioritarias, ...resto]);
    } catch {
      // Fallback
      this._nacionalidades.set([
        'Dominicana', 'Haitiana', 'Estadounidense', 'Española', 'Venezolana', 'Colombiana'
      ]);
    } finally {
      this.cargandoNacionalidades.set(false);
    }
  }
}
