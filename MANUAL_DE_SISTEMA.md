# 📖 Manual Completo: Plataforma de Campeonato MTB

Este manual explica cómo usar todas las herramientas del sistema para gestionar el campeonato de forma profesional y sin errores.

---

## 🏗️ 1. ¿Cómo funciona el sistema?
El programa tiene dos partes principales:
1.  **Página para el Público:** Es lo que ven los corredores (Ranking, Perfiles e Inscripciones).
2.  **Panel de Control (Admin):** Es tu oficina virtual. Se accede entrando a la dirección de la web y agregando `/admin` al final.

---

## 📥 2. Gestión de Solicitudes (La "Puerta de Entrada")
Cuando un corredor llena el formulario de inscripción, sus datos llegan a la sección **Solicitudes**.
*   **Revisión:** Debes verificar el comprobante de pago que te llegará por WhatsApp/Email.
*   **Aprobación:** Al hacer clic en "Aprobar", el sistema hace dos cosas:
    1.  Crea o actualiza el perfil permanente del corredor (**Rider**).
    2.  Lo inscribe oficialmente en la fecha seleccionada.
*   **Rechazo:** Úsalo solo si los datos son falsos o el pago no existe. Esto borra la solicitud.

---

## 👥 3. Base de Datos de Riders (El Histórico)
En la sección **Riders** se guardan todos los corredores que han participado alguna vez.
*   **Perfiles:** Aquí puedes corregir nombres, clubes o categorías si un corredor se equivocó.
*   **Detección de Duplicados:** El sistema usa el RUT para asegurar que nadie tenga dos perfiles.
*   **Historial:** Al entrar al perfil de un Rider, verás todas sus participaciones y puntos acumulados.

---

## 📅 4. Gestión de Eventos y Editor Profesional
Esta sección controla el calendario del campeonato.
*   **Configuración por Fecha:** Cada carrera puede tener su propio precio, slogan y cuenta bancaria de destino.
*   **Live Preview (Vista Previa):** Antes de abrir inscripciones, usa la pestaña de Vista Previa para ver el formulario tal cual lo verá el público.
*   **Estados de Carrera:**
    *   **Abierta:** Permite inscripciones públicas.
    *   **Programada:** Aparece en el calendario pero no deja inscribirse aún.
    *   **Finalizada:** Cierra el proceso y marca la fecha como concluida.

---

## ⏱️ 5. El "Puente" con RaceTime (Cronometraje)
Esta es la parte más importante para el día de la carrera. El sistema y el programa de cronometraje (RaceTime) deben hablar el mismo idioma.

### Paso A: Enviar los datos a RaceTime (Antes de la carrera)
Para que el juez sepa quién es quién, debes pasarle la lista de inscritos:
1.  En el panel, ve a **Riders**.
2.  Filtra por tu **Evento** (ej: 2ª Fecha).
3.  Asegúrate de que todos tengan su **Dorsal** (número de placa) asignado.
4.  Haz clic en el botón azul **"PARA RACETIME"**.
5.  Se descargará un archivo `.csv`. **No lo abras**. Envíalo por correo o pendrive al encargado del cronometraje para que lo cargue en su programa.

### Paso B: Traer los resultados a la Web (Después de la carrera)
Cuando termine la carrera, el juez te dará los resultados. Así los subes:
1.  En el panel, ve a **Juez**.
2.  Selecciona el **Evento** y la **Categoría** (ej: Elite).
3.  Haz clic en **"⚡ IMPORTAR RACETIME"**.
4.  **Cómo cargar los datos:**
    *   **Opción 1 (Archivo):** Sube el PDF que te dio el juez.
    *   **Opción 2 (Copiar/Pegar):** Abre el archivo de resultados, selecciona el texto (Dorsal y Tiempo), cópialo y pégalo en el cuadro negro.
5.  Haz clic en **"Verificar Datos"**:
    *   Si sale en **VERDE**, el sistema reconoció al corredor.
    *   Si sale en **ROJO**, es porque ese número de placa no estaba inscrito en esa fecha. Revisa si el juez escribió bien el número.
6.  Haz clic en **"Guardar Resultados"**. En ese instante, el ranking se actualiza solo.

---

## 🏆 6. Ranking y Leaderboard
El ranking se calcula en tiempo real basándose en los resultados guardados por el Juez.
*   **Desempates:** El sistema prioriza al corredor con mejores posiciones recientes.
*   **Categorías:** Los resultados están separados por categorías oficiales (Elite, Master, Novicios, etc.).
*   **Transparencia:** Cualquier cambio en el Juez se refleja instantáneamente en la web pública.

---

## 🛠️ 7. Resolución de Problemas (Troubleshooting)
*   **"No veo los cambios recién hechos":** El navegador a veces guarda versiones viejas. Usa `Ctrl + F5` para limpiar el caché.
*   **"Un corredor no aparece en el Juez":** Asegúrate de que el corredor esté aprobado para esa fecha específica y tenga un dorsal asignado.
*   **"El ranking suma mal":** Revisa que el corredor no tenga dos perfiles (RUTs distintos). Si es así, elimina el duplicado y deja el correcto.

---

**Soporte Técnico:** Si el sistema presenta un error crítico de código, contacta al desarrollador. Para uso diario, guíate por este manual y el `MANUAL_RAPIDO.md`.
