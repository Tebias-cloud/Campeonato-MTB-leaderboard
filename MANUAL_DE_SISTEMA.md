# 📖 Manual Completo del Sistema: Campeonato MTB Leaderboard

Bienvenido a la plataforma integral de gestión del campeonato. Este documento cubre todas las funciones del sistema, desde la inscripción inicial hasta la premiación final.

---

## 🏗️ 1. Arquitectura del Sistema
El programa se divide en dos mundos que trabajan juntos:
1.  **Página Pública:** Donde los corredores ven el ranking, sus perfiles y se inscriben a las carreras.
2.  **Panel Administrativo:** Donde tú controlas todo. Se accede vía `/admin`.

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

## ⏱️ 5. El Juez Virtual (Resultados)
Es el motor que calcula el ranking. Funciona mediante la integración con **RaceTime**.
*   **Importación Inteligente:** Puedes subir el PDF de resultados o pegar el texto directamente.
*   **Asignación de Puntos:** El sistema asigna puntos automáticamente según la posición (100 al 1°, 90 al 2°, etc.).
*   **Dorsales:** Es CRÍTICO que el dorsal en RaceTime coincida con el asignado en el panel de Riders para esa fecha.

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
