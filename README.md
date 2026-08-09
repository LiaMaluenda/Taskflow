# TaskFlow - Aplicación de Gestión de Tareas

Aplicación web interactiva desarrollada para la evaluación del **Módulo #5: Programación avanzada en JavaScript**. El proyecto implementa gestión de tareas aplicando Programación Orientada a Objetos (POO), manipulación dinámica del DOM, eventos del navegador, funciones asíncronas con temporizadores, almacenamiento local y comunicación con una API remota.

---

##  Estructura del Proyecto

* **`index.html`**: Estructura semántica de la interfaz, formularios y contenedores dinámicos.
* **`styles.css`**: Estilos globales, variables CSS, layout responsivo y estados visuales interactivos.
* **`app.js`**: Lógica de la aplicación con clases POO, controladores de eventos, manejo de `localStorage` y peticiones a la API.

---

##  Funcionalidades

* **Gestión completa de tareas:** Creación, cambio de estado (pendiente/completada) y eliminación.
* **Sincronización remota:** 
  * Recuperación de tareas iniciales desde la API externa (`GET`).
  * Simulación de envío y guardado de nuevas tareas en el servidor (`POST`).
* **Persistencia local:** Guardado automático en `localStorage` para no perder la información al recargar la página.
* **Búsqueda y métricas en tiempo real:**
  * Contador de caracteres mientras se escribe la descripción (`keyup`).
  * Filtro de tareas dinámico según el texto ingresado (`keyup`).
* **Temporizadores y asincronía:**
  * Notificaciones flotantes que desaparecen tras 2 segundos (`setTimeout`).
  * Cuenta regresiva en vivo para tareas que incluyen fecha límite (`setInterval`).
* **Efectos interactivos:** Resaltado visual al pasar el cursor sobre los elementos de la lista (`mouseover` / `mouseout`).

---

## Tecnologías y Conceptos Aplicados

* **JavaScript ES6+:**
  * Clases (`Tarea` y `GestorTareas`).
  * Variables de ámbito de bloque (`const`, `let`).
  * Funciones flecha (*Arrow Functions*).
  * Plantillas de cadena (*Template Literals*).
  * Desestructuración (*Destructuring*) y Operador de Propagación (*Spread Operator*).
* **Asincronía & Fetch API:** Uso de `async/await` con bloques `try/catch` para peticiones HTTP.
* **Manipulación del DOM:** Delegación de eventos y generación dinámica de nodos HTML.

---

##  Cumplimiento de Requerimientos

| Requerimiento | Implementación |
| **POO** | Clases `Tarea` (instancia de datos y cambio de estado) y `GestorTareas` (controlador del arreglo y lógica). |
| **Sintaxis ES6+** | Uso exclusivo de `const`/`let`, arrow functions, destructuring y template literals. |
| **Eventos del DOM** | Implementación de `submit`, `click` (delegación), `keyup` y `mouseover`/`mouseout`. |
| **Asincronía** | Retardo simulado con `setTimeout` (2s para notificaciones) y ciclo continuo con `setInterval` (contador). |
| **Consumo de APIs** | Función `recuperarTareasAPI()` (GET) y función `guardarTareaAPI()` (POST) mediante `fetch()` con `try/catch`. |
| **Persistencia** | Métodos `guardarLocalStorage()` y `cargarLocalStorage()` integrados en la clase principal. |

---

##  Instrucciones de Ejecución

1. Descargar o clonar el repositorio en tu equipo local.
2. Asegurarse de que los archivos `index.html`, `styles.css` y `app.js` se encuentren en el mismo directorio.
3. Abrir el archivo `index.html` directamente en cualquier navegador web moderno o mediante una extensión de servidor local (como Live Server en VS Code).