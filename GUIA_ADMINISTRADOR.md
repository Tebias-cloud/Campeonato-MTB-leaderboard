# 🚴‍♂️ Guía de Administración: Campeonato MTB Leaderboard

Esta guía explica los tres procesos críticos para gestionar una fecha del campeonato de forma exitosa.

---

## 1. Gestión de Dorsales (Pre-Carrera)
Los dorsales son **únicos por evento**. Esto permite que un corredor use el número 100 en la Fecha 1 y el 205 en la Fecha 2 si es necesario.

### Cómo asignar dorsales:
1.  Entra a la sección **Riders**.
2.  **Filtro Obligatorio:** En el menú superior, selecciona el **Evento** (ej: "2ª Fecha"). 
    *   *Nota: Si no seleccionas un evento, la columna "Dorsal" no aparecerá por seguridad.*
3.  **Asignación Manual:** Haz clic en el cuadro de la columna "Dorsal", escribe el número y presiona `Enter`.
4.  **Asignación Masiva (Recomendado):** 
    *   Haz clic en el botón naranja **"Asignación en Bloque"**.
    *   Selecciona la Categoría.
    *   Ingresa el número inicial (ej: 100).
    *   El sistema asignará automáticamente 100, 101, 102... a todos los inscritos de esa categoría.

---

## 2. Preparación para el Cronometraje (Exportar)
El sistema genera un archivo optimizado para el software **RaceTime**.

1.  En la sección **Riders**, asegúrate de tener seleccionado el **Evento**.
2.  Verifica que los corredores tengan sus dorsales asignados.
3.  Haz clic en el botón **"PARA RACETIME"**.
4.  Se descargará un archivo CSV. **No lo abras ni lo edites**, impórtalo directamente en el software de cronometraje.

---

## 3. Carga de Resultados (Post-Carrera)
Una vez terminada la competencia, el "Juez Virtual" procesa los tiempos.

1.  Entra a la sección **Juez**.
2.  Selecciona el **Evento** y la **Categoría** que vas a cargar.
3.  Haz clic en **"⚡ IMPORTAR RACETIME"**.
4.  **Elegir método:**
    *   **Subir PDF:** Selecciona el archivo de resultados original.
    *   **Pegar Texto:** Si el PDF falla, copia los datos (Dorsal y Tiempo) y pégalos en el cuadro negro.
5.  **Verificar:** Haz clic en el botón negro **"Verificar Datos"**.
    *   ✅ **Verde:** Corredor reconocido.
    *   ❌ **Rojo:** Dorsal no encontrado en la base de datos para esa fecha.
6.  **Finalizar:** Haz clic en **"Guardar Resultados"**. El ranking público se actualizará automáticamente.

---

## 4. Configuración de Nuevas Carreras
El sistema ahora incluye un editor profesional para que cada organizador gestione su propia fecha.

1.  Entra a **Eventos** y selecciona **Ajustes** (o "+ Nueva Carrera").
2.  **Pestaña Configuración:**
    *   **Título y Slogan:** Escribe el nombre de la carrera. La última palabra aparecerá automáticamente en naranja en la web.
    *   **Estado:** Cambia a "Abierta" para permitir inscripciones, o "Programada" para que solo aparezca el anuncio.
    *   **Datos Bancarios:** Asegúrate de que el "Contacto para Comprobantes" sea correcto (WhatsApp o Email), ya que ahí llegará el dinero.
3.  **Pestaña Vista Previa:**
    *   Antes de publicar, haz clic en "Vista Previa". Verás **exactamente** cómo le aparecerá el formulario a los corredores.
    *   Revisa que el precio y los datos de transferencia sean los correctos.
4.  **Publicar:** Haz clic en el botón negro gigante **"PUBLICAR CAMBIOS"**.

---

## 💡 Consejos de Oro
*   **Seguridad visual:** Si algo se ve mal en el celular, revisa la "Vista Previa" en el editor. El sistema está diseñado para que lo que ves ahí sea lo que se publica.
*   **Limpieza de Datos:** Si un corredor se inscribió mal (ej: nombre en minúsculas), puedes editarlo en el botón "EDITAR" de la lista de Riders.
*   **Actualización en Vivo:** Si la página no muestra un cambio reciente, usa `Ctrl + F5` para refrescar el caché del navegador.
*   **Inscripciones Nuevas:** Si llega un corredor de último minuto, regístralo primero en **"+ Nuevo Rider"** y asegúrate de inscribirlo en el evento actual para que aparezca en el Juez Virtual.
