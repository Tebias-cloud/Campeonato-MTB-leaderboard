# Guía Rápida: Administración de Eventos MTB

Guía operativa para gestionar una fecha del campeonato en 4 pasos.

---

### 1. Configurar la Carrera (Antes de abrir inscripciones)
* Ve a **Eventos** (`/admin/events`) y haz clic en el botón **Ajustes** de la carrera correspondiente (o en **+ NUEVA CARRERA** para crear una).
* **Configuración:** Completa el nombre, slogan, fecha oficial, precio e información de transferencia bancaria.
* **Estado:** Selecciona **"Abierta"** para habilitar el formulario público de inscripción.
* **Vista Previa:** Usa la pestaña **"Vista Previa"** para verificar cómo verán los corredores el formulario en dispositivos móviles y de escritorio.
* **Confirmar:** Haz clic en **"GUARDAR CAMBIOS"** al final del formulario.

---

### 2. Asignar Números (Dorsales)
* Ve a **Riders** (`/admin/riders`).
* **Filtro:** En la barra de filtros, selecciona la **Fecha** específica (este filtro es obligatorio para habilitar la gestión de dorsales del evento).
* **Asignación masiva:** Haz clic en el botón **"Asignación en Bloque"**.
* Selecciona la categoría y define el número inicial (ej: 100). El sistema verificará los dorsales ocupados y asignará correlativos saltando colisiones.
* **Asignación manual:** También puedes editar el número directamente en la columna **DORSAL** de cada corredor en la tabla.

---

### 3. Exportar para Cronometraje
* En la sección **Riders**, asegurándote de tener la fecha seleccionada en los filtros.
* Haz clic en el botón **"PARA RACETIME"**.
* El sistema descargará un archivo CSV en formato estándar UTF-8 con las columnas `BIB`, `NAME`, `CATEGORY`, `TEAM` y `BIRTHDATE`, listo para importar en el software de cronometraje.

---

### 4. Cargar Resultados (Al finalizar la carrera)
* Ve a **Juez** (`/admin/results`).
* Selecciona el **Evento** y la **Categoría**.
* Haz clic en el botón **"IMPORTAR"**.
* En el asistente, sube el archivo de cronometraje en formato PDF, Excel (`.xls` / `.xlsx`) o CSV.
* El sistema identificará dorsales y tiempos automáticamente:
  - Los corredores validados aparecerán marcados como listos.
  - Si existen números sospechosos o no vinculados, aparecerán en la sección de revisión para asignar o corregir el corredor correspondiente.
* Haz clic en el botón **"Guardar Resultados"** (que indica la cantidad de registros validados). Las posiciones, marcas y el ranking global se calcularán de inmediato.

---

### Consejos Operativos
* **Edición de datos de corredor:** En la tabla de **Riders**, usa el botón **EDITAR** de cada fila para actualizar información personal o club.
* **Inscripciones tardías:** Para registrar un corredor fuera de plazo, usa **+ NUEVO RIDER** antes de asignar su dorsal para la fecha.
