# Manual de Usuario - PrisionConnect

Bienvenido a **PrisionConnect**, el sistema de gestión integral de centros penitenciarios enfocado en el monitoreo en tiempo real, la gestión de expedientes y el control de accesos y visitas. Este manual te guiará paso a paso para utilizar el sistema de la forma más efectiva.

---

## 1. Acceso y Dashboard Principal

Al iniciar sesión, lo primero que verás será el **Dashboard principal**. Esta es tu torre de control.

- **Indicadores Rápidos**: Muestran en tiempo real la cantidad de visitas que hay el día de hoy, cuántas de esas visitas se encuentran **En Curso**, y otros indicadores vitales sin necesidad de entrar a ningún modulo.
- **Botones de Acción**: Te permiten acceder en un solo clic a las áreas más concurrentes (Visitas Activas, Recepción, Reclusos, etc.).

---

## 2. Gestión de Reclusos

El corazón de los expedientes. Como administrador, este módulo te permite dar de alta y mantener actualizado el estado jurídico y físico de cada privado de libertad.

1. **Registrar un Recluso**: Haz clic en "Agregar Recluso". El sistema generará automáticamente un *Número de Identificación Penitenciaria*.
2. **Información Penal**: Indica en qué pabellón y celda se encuentra, su estado legal actual (Preventivo, Condenado) y otra información crucial.
3. **Edición Segura**: Si un recluso es trasladado o su situación jurídica cambia, puedes editar su perfil manteniendo un rastreo auditable en el sistema.

---

## 3. Módulo de Recepción y Control de Visitas

Este módulo consta de dos pantallas gemelas: **Recepción** (para el registro y filtrado histórico del día) y **Visitas Activas** (para el monitoreo rápido de los que aún están dentro).

### 3.1 Registrar una Nueva Visita
1. Ve a la sección **Recepción** y haz clic en "Nueva Visita".
2. **Selecciona el Tipo**:
   - **Familiar/Amistad**: Muestra a las personas que tienen un vínculo de sangre pre-aprobado.
   - **Legal**: Requiere seleccionar el abogado asignado al recluso.
3. El sistema solicitará confirmación, y una vez aprobada, la visita pasa al estado de `Registrada`.

### 3.2 El Control de Accesos (Check-In y Check-Out)
Las visitas en el penal no son instantáneas. Requieren pasar por un control riguroso de requisa antes de entrar al patio de visita:
- **Check-In (Entrada)**: Registra la hora exacta en la que un visitante físicamente cruzó la requisa y entró. El sistema cambiará el estado a `En Curso`.
- **Check-Out (Salida)**: Registra el fin de la visita. Una vez que el último asociado a esa visita hace su check-out, el sistema pasará el estado total de la visita a `Finalizada`.

> [!TIP]
> **Modificación de Tiempos**: En **Visitas Activas**, visualizarás colores diferentes por estado (Verde: En Curso, Naranja: Pendiente, etc.) e indicadores como `1/3` visitantes presentes en tiempo real para un control exacto.

### 3.3 Cancelaciones e Incidencias
- Si ocurre algún percance (un visitante viene ebrio o hay problemas), puedes usar el botón de **Incidencia** para adjuntar un reporte grave directamente anexado a esa visita.

---

## 4. Directorio: Visitantes y Abogados

Estos dos módulos sirven como bases de datos estáticas para gestionar **"Quién es Quién"** fuera de la prisión.

- **Visitantes**: Contiene la foto, parentescos, número de teléfono y registros de cédula de los individuos.
- **Abogados**: Administra credenciales delicadas. Guarda en el sistema la matrícula (exequatur) y el colegio de abogados al que pertenece. Todo abogado debe estar en este registro para que el sistema permita programarle una Visita Legal.

---

## 5. Reportes y Estadística

Diseñado para las auditorías, directores del centro y revisiones legales.

1. Selecciona a la izquierda el tipo de reporte deseado (Ej. Reporte de Visitas).
2. **Usa los Filtros Superiores**: Puedes filtrar por fecha de inicio y fin, o exigir que solo se muestren visitas que fueron revisadas en requisa. 
3. Haz clic en **Aplicar Filtros** para refrescar la tabla inferior.
4. **Generar PDF o Excel**: Usa los botones de exportación ubicados en la zona superior derecha de la tabla. El PDF incluye cabeceras y logos oficiales adecuados para impresos legales.

---

> [!IMPORTANT]
> **Cierre de Sesión Seguro**
> PrisionConnect está diseñado bajo requerimientos estrictos de sincronización y memoria. Si debes compartir el dispositivo con otro oficial o secretario, siempre utiliza el botón de **Cerrar Sesión** en el panel lateral. El sistema se encargará de purgar todos los datos de visitantes y abogados de la memoria RAM automáticamente garantizando que la próxima persona inicie con una interfaz limpia y segura.
