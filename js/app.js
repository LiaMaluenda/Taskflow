// Clase para definir el formato de cada tarea
class Tarea {
  constructor(id, descripcion, estado = false, fechaCreacion = new Date().toISOString(), fechaLimite = null) {
    this.id = id;
    this.descripcion = descripcion;
    this.estado = estado;
    this.fechaCreacion = fechaCreacion;
    this.fechaLimite = fechaLimite;
  }

  // Cambiar entre completado o pendiente
  toggleEstado() {
    this.estado = !this.estado;
  }
}

// Controlador principal para manejar la lista y las llamadas
class GestorTareas {
  constructor() {
    this.tareas = [];
    this.apiUrl = 'https://jsonplaceholder.typicode.com/todos';
  }

  agregarTarea(tarea) {
    this.tareas = [...this.tareas, tarea];
    this.guardarLocalStorage();
  }

  eliminarTarea(id) {
    this.tareas = this.tareas.filter(tarea => tarea.id !== id);
    this.guardarLocalStorage();
  }

  obtenerTarea(id) {
    return this.tareas.find(tarea => tarea.id === id);
  }

  guardarLocalStorage() {
    localStorage.setItem('taskflow_tareas', JSON.stringify(this.tareas));
  }

  cargarLocalStorage() {
    const datos = localStorage.getItem('taskflow_tareas');
    if (datos) {
      const parsed = JSON.parse(datos);
      this.tareas = parsed.map(
        ({ id, descripcion, estado, fechaCreacion, fechaLimite }) => 
          new Tarea(id, descripcion, estado, fechaCreacion, fechaLimite)
      );
    }
  }

  // Traer tareas externas de la API (GET)
  async recuperarTareasAPI() {
    try {
      const res = await fetch(`${this.apiUrl}?_limit=3`);
      if (!res.ok) throw new Error('Falló la conexión con el servidor');

      const datos = await res.json();
      const tareasRecuperadas = datos.map(item => new Tarea(`api-${item.id}`, item.title, item.completed));

      // Filtrar para no repetir si ya las cargamos antes
      const idsActuales = new Set(this.tareas.map(t => t.id));
      const unicas = tareasRecuperadas.filter(t => !idsActuales.has(t.id));

      this.tareas = [...this.tareas, ...unicas];
      this.guardarLocalStorage();
      return true;
    } catch (err) {
      console.error('Error al traer datos:', err.message);
      throw err;
    }
  }

  // Enviar tarea creada a la API (POST)
  async guardarTareaAPI(tarea) {
    try {
      const res = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: tarea.descripcion,
          completed: tarea.estado,
          userId: 1
        })
      });

      if (!res.ok) throw new Error('No se pudo guardar dinámicamente en la API');

      const data = await res.json();
      console.log('Respuesta recibida del servidor:', data);
      return data;
    } catch (err) {
      console.error('Error al enviar datos:', err.message);
      throw err;
    }
  }
}

// Variables globales y selección de elementos del HTML
const gestor = new GestorTareas();

const formTarea = document.getElementById('form-tarea');
const inputDescripcion = document.getElementById('input-descripcion');
const inputLimite = document.getElementById('input-limite');
const listaTareas = document.getElementById('lista-tareas');
const inputBusqueda = document.getElementById('input-busqueda');
const contadorCaracteres = document.getElementById('contador-caracteres');
const notificacion = document.getElementById('notificacion');
const btnSync = document.getElementById('btn-sync');

// Cargar todo al abrir la página
document.addEventListener('DOMContentLoaded', () => {
  gestor.cargarLocalStorage();
  renderizarTareas(gestor.tareas);
  iniciarContadorRegresivo();
});

// Función para reescribir la lista en el DOM
const renderizarTareas = (lista) => {
  listaTareas.innerHTML = '';

  lista.forEach(tarea => {
    const { id, descripcion, estado, fechaLimite } = tarea;

    const li = document.createElement('li');
    li.className = `tarea-item ${estado ? 'completada' : ''}`;
    li.dataset.id = id;

    const textoLimite = fechaLimite 
      ? `<span class="fecha-limite" id="timer-${id}">Calculando tiempo...</span>`
      : '<span class="fecha-limite">Sin límite</span>';

    li.innerHTML = `
      <div class="info-tarea">
        <span class="descripcion">${descripcion}</span>
        ${textoLimite}
      </div>
      <div class="acciones">
        <button class="btn-completar">${estado ? 'Pendiente' : 'Completar'}</button>
        <button class="btn-eliminar">Eliminar</button>
      </div>
    `;

    listaTareas.appendChild(li);
  });
};

// Crear nueva tarea con pequeña demora simulada
formTarea.addEventListener('submit', (e) => {
  e.preventDefault();

  const descripcion = inputDescripcion.value.trim();
  const fechaLimite = inputLimite.value ? new Date(inputLimite.value).toISOString() : null;

  if (!descripcion) return;

  // Un pequeño retardo para simular procesamiento
  setTimeout(async () => {
    const nuevaTarea = new Tarea(Date.now().toString(), descripcion, false, new Date().toISOString(), fechaLimite);
    
    gestor.agregarTarea(nuevaTarea);
    renderizarTareas(gestor.tareas);

    // Intentar subirla a la API en segundo plano
    try {
      await gestor.guardarTareaAPI(nuevaTarea);
    } catch (err) {
      console.log('Guardada solo en local por fallo de red.');
    }

    formTarea.reset();
    contadorCaracteres.textContent = '0 caracteres';

    mostrarNotificacion('Tarea guardada con éxito.');
  }, 500);
});

// Contador de texto según se escribe
inputDescripcion.addEventListener('keyup', (e) => {
  contadorCaracteres.textContent = `${e.target.value.length} caracteres`;
});

// Filtrado rápido al tipear en la búsqueda
inputBusqueda.addEventListener('keyup', (e) => {
  const termino = e.target.value.toLowerCase();
  const filtradas = gestor.tareas.filter(t => t.descripcion.toLowerCase().includes(termino));
  renderizarTareas(filtradas);
});

// Detectar clics en los botones de las tareas agregadas
listaTareas.addEventListener('click', (e) => {
  const item = e.target.closest('.tarea-item');
  if (!item) return;

  const id = item.dataset.id;
  const tarea = gestor.obtenerTarea(id);

  if (e.target.classList.contains('btn-completar')) {
    if (tarea) {
      tarea.toggleEstado();
      gestor.guardarLocalStorage();
      renderizarTareas(gestor.tareas);
    }
  }

  if (e.target.classList.contains('btn-eliminar')) {
    gestor.eliminarTarea(id);
    renderizarTareas(gestor.tareas);
    mostrarNotificacion('Tarea eliminada.');
  }
});

// Resaltar elemento al pasar el mouse por encima
listaTareas.addEventListener('mouseover', (e) => {
  const item = e.target.closest('.tarea-item');
  if (item) item.classList.add('hovered');
});

listaTareas.addEventListener('mouseout', (e) => {
  const item = e.target.closest('.tarea-item');
  if (item) item.classList.remove('hovered');
});

// Botón para traer datos desde la API
btnSync.addEventListener('click', async () => {
  try {
    mostrarNotificacion('Cargando tareas remotas...');
    await gestor.recuperarTareasAPI();
    renderizarTareas(gestor.tareas);
    mostrarNotificacion('Tareas recuperadas con éxito.');
  } catch (err) {
    mostrarNotificacion('No se pudo conectar con la API.');
  }
});

// Ocultar el mensaje flotante después de 2 segundos
function mostrarNotificacion(mensaje) {
  notificacion.textContent = mensaje;
  notificacion.classList.remove('oculta');

  setTimeout(() => {
    notificacion.classList.add('oculta');
  }, 2000);
}

// Bucle que revisa los tiempos restantes cada segundo
function iniciarContadorRegresivo() {
  setInterval(() => {
    gestor.tareas.forEach(tarea => {
      if (!tarea.fechaLimite) return;

      const visor = document.getElementById(`timer-${tarea.id}`);
      if (!visor) return;

      const falta = new Date(tarea.fechaLimite).getTime() - new Date().getTime();

      if (falta <= 0) {
        visor.textContent = 'Plazo vencido';
        visor.style.color = 'var(--danger-color)';
      } else {
        const h = Math.floor((falta % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((falta % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((falta % (1000 * 60)) / 1000);

        visor.textContent = `Quedan: ${h}h ${m}m ${s}s`;
      }
    });
  }, 1000);
}// Clase para definir el formato de cada tarea
class Tarea {
  constructor(id, descripcion, estado = false, fechaCreacion = new Date().toISOString(), fechaLimite = null) {
    this.id = id;
    this.descripcion = descripcion;
    this.estado = estado;
    this.fechaCreacion = fechaCreacion;
    this.fechaLimite = fechaLimite;
  }

  // Cambiar entre completado o pendiente
  toggleEstado() {
    this.estado = !this.estado;
  }
}

// Controlador principal para manejar la lista y las llamadas
class GestorTareas {
  constructor() {
    this.tareas = [];
    this.apiUrl = 'https://jsonplaceholder.typicode.com/todos';
  }

  agregarTarea(tarea) {
    this.tareas = [...this.tareas, tarea];
    this.guardarLocalStorage();
  }

  eliminarTarea(id) {
    this.tareas = this.tareas.filter(tarea => tarea.id !== id);
    this.guardarLocalStorage();
  }

  obtenerTarea(id) {
    return this.tareas.find(tarea => tarea.id === id);
  }

  guardarLocalStorage() {
    localStorage.setItem('taskflow_tareas', JSON.stringify(this.tareas));
  }

  cargarLocalStorage() {
    const datos = localStorage.getItem('taskflow_tareas');
    if (datos) {
      const parsed = JSON.parse(datos);
      this.tareas = parsed.map(
        ({ id, descripcion, estado, fechaCreacion, fechaLimite }) => 
          new Tarea(id, descripcion, estado, fechaCreacion, fechaLimite)
      );
    }
  }

  // Traer tareas externas de la API (GET)
  async recuperarTareasAPI() {
    try {
      const res = await fetch(`${this.apiUrl}?_limit=3`);
      if (!res.ok) throw new Error('Falló la conexión con el servidor');

      const datos = await res.json();
      const tareasRecuperadas = datos.map(item => new Tarea(`api-${item.id}`, item.title, item.completed));

      // Filtrar para no repetir si ya las cargamos antes
      const idsActuales = new Set(this.tareas.map(t => t.id));
      const unicas = tareasRecuperadas.filter(t => !idsActuales.has(t.id));

      this.tareas = [...this.tareas, ...unicas];
      this.guardarLocalStorage();
      return true;
    } catch (err) {
      console.error('Error al traer datos:', err.message);
      throw err;
    }
  }

  // Enviar tarea creada a la API (POST)
  async guardarTareaAPI(tarea) {
    try {
      const res = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: tarea.descripcion,
          completed: tarea.estado,
          userId: 1
        })
      });

      if (!res.ok) throw new Error('No se pudo guardar dinámicamente en la API');

      const data = await res.json();
      console.log('Respuesta recibida del servidor:', data);
      return data;
    } catch (err) {
      console.error('Error al enviar datos:', err.message);
      throw err;
    }
  }
}

// Variables globales y selección de elementos del HTML
const gestor = new GestorTareas();

const formTarea = document.getElementById('form-tarea');
const inputDescripcion = document.getElementById('input-descripcion');
const inputLimite = document.getElementById('input-limite');
const listaTareas = document.getElementById('lista-tareas');
const inputBusqueda = document.getElementById('input-busqueda');
const contadorCaracteres = document.getElementById('contador-caracteres');
const notificacion = document.getElementById('notificacion');
const btnSync = document.getElementById('btn-sync');

// Cargar todo al abrir la página
document.addEventListener('DOMContentLoaded', () => {
  gestor.cargarLocalStorage();
  renderizarTareas(gestor.tareas);
  iniciarContadorRegresivo();
});

// Función para reescribir la lista en el DOM
const renderizarTareas = (lista) => {
  listaTareas.innerHTML = '';

  lista.forEach(tarea => {
    const { id, descripcion, estado, fechaLimite } = tarea;

    const li = document.createElement('li');
    li.className = `tarea-item ${estado ? 'completada' : ''}`;
    li.dataset.id = id;

    const textoLimite = fechaLimite 
      ? `<span class="fecha-limite" id="timer-${id}">Calculando tiempo...</span>`
      : '<span class="fecha-limite">Sin límite</span>';

    li.innerHTML = `
      <div class="info-tarea">
        <span class="descripcion">${descripcion}</span>
        ${textoLimite}
      </div>
      <div class="acciones">
        <button class="btn-completar">${estado ? 'Pendiente' : 'Completar'}</button>
        <button class="btn-eliminar">Eliminar</button>
      </div>
    `;

    listaTareas.appendChild(li);
  });
};

// Crear nueva tarea con pequeña demora simulada
formTarea.addEventListener('submit', (e) => {
  e.preventDefault();

  const descripcion = inputDescripcion.value.trim();
  const fechaLimite = inputLimite.value ? new Date(inputLimite.value).toISOString() : null;

  if (!descripcion) return;

  // Un pequeño retardo para simular procesamiento
  setTimeout(async () => {
    const nuevaTarea = new Tarea(Date.now().toString(), descripcion, false, new Date().toISOString(), fechaLimite);
    
    gestor.agregarTarea(nuevaTarea);
    renderizarTareas(gestor.tareas);

    // Intentar subirla a la API en segundo plano
    try {
      await gestor.guardarTareaAPI(nuevaTarea);
    } catch (err) {
      console.log('Guardada solo en local por fallo de red.');
    }

    formTarea.reset();
    contadorCaracteres.textContent = '0 caracteres';

    mostrarNotificacion('Tarea guardada con éxito.');
  }, 500);
});

// Contador de texto según se escribe
inputDescripcion.addEventListener('keyup', (e) => {
  contadorCaracteres.textContent = `${e.target.value.length} caracteres`;
});

// Filtrado rápido al tipear en la búsqueda
inputBusqueda.addEventListener('keyup', (e) => {
  const termino = e.target.value.toLowerCase();
  const filtradas = gestor.tareas.filter(t => t.descripcion.toLowerCase().includes(termino));
  renderizarTareas(filtradas);
});

// Detectar clics en los botones de las tareas agregadas
listaTareas.addEventListener('click', (e) => {
  const item = e.target.closest('.tarea-item');
  if (!item) return;

  const id = item.dataset.id;
  const tarea = gestor.obtenerTarea(id);

  if (e.target.classList.contains('btn-completar')) {
    if (tarea) {
      tarea.toggleEstado();
      gestor.guardarLocalStorage();
      renderizarTareas(gestor.tareas);
    }
  }

  if (e.target.classList.contains('btn-eliminar')) {
    gestor.eliminarTarea(id);
    renderizarTareas(gestor.tareas);
    mostrarNotificacion('Tarea eliminada.');
  }
});

// Resaltar elemento al pasar el mouse por encima
listaTareas.addEventListener('mouseover', (e) => {
  const item = e.target.closest('.tarea-item');
  if (item) item.classList.add('hovered');
});

listaTareas.addEventListener('mouseout', (e) => {
  const item = e.target.closest('.tarea-item');
  if (item) item.classList.remove('hovered');
});

// Botón para traer datos desde la API
btnSync.addEventListener('click', async () => {
  try {
    mostrarNotificacion('Cargando tareas remotas...');
    await gestor.recuperarTareasAPI();
    renderizarTareas(gestor.tareas);
    mostrarNotificacion('Tareas recuperadas con éxito.');
  } catch (err) {
    mostrarNotificacion('No se pudo conectar con la API.');
  }
});

// Ocultar el mensaje flotante después de 2 segundos
function mostrarNotificacion(mensaje) {
  notificacion.textContent = mensaje;
  notificacion.classList.remove('oculta');

  setTimeout(() => {
    notificacion.classList.add('oculta');
  }, 2000);
}

// Bucle que revisa los tiempos restantes cada segundo
function iniciarContadorRegresivo() {
  setInterval(() => {
    gestor.tareas.forEach(tarea => {
      if (!tarea.fechaLimite) return;

      const visor = document.getElementById(`timer-${tarea.id}`);
      if (!visor) return;

      const falta = new Date(tarea.fechaLimite).getTime() - new Date().getTime();

      if (falta <= 0) {
        visor.textContent = 'Plazo vencido';
        visor.style.color = 'var(--danger-color)';
      } else {
        const h = Math.floor((falta % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((falta % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((falta % (1000 * 60)) / 1000);

        visor.textContent = `Quedan: ${h}h ${m}m ${s}s`;
      }
    });
  }, 1000);
}// Clase para definir el formato de cada tarea
class Tarea {
  constructor(id, descripcion, estado = false, fechaCreacion = new Date().toISOString(), fechaLimite = null) {
    this.id = id;
    this.descripcion = descripcion;
    this.estado = estado;
    this.fechaCreacion = fechaCreacion;
    this.fechaLimite = fechaLimite;
  }

  // Cambiar entre completado o pendiente
  toggleEstado() {
    this.estado = !this.estado;
  }
}

// Controlador principal para manejar la lista y las llamadas
class GestorTareas {
  constructor() {
    this.tareas = [];
    this.apiUrl = 'https://jsonplaceholder.typicode.com/todos';
  }

  agregarTarea(tarea) {
    this.tareas = [...this.tareas, tarea];
    this.guardarLocalStorage();
  }

  eliminarTarea(id) {
    this.tareas = this.tareas.filter(tarea => tarea.id !== id);
    this.guardarLocalStorage();
  }

  obtenerTarea(id) {
    return this.tareas.find(tarea => tarea.id === id);
  }

  guardarLocalStorage() {
    localStorage.setItem('taskflow_tareas', JSON.stringify(this.tareas));
  }

  cargarLocalStorage() {
    const datos = localStorage.getItem('taskflow_tareas');
    if (datos) {
      const parsed = JSON.parse(datos);
      this.tareas = parsed.map(
        ({ id, descripcion, estado, fechaCreacion, fechaLimite }) => 
          new Tarea(id, descripcion, estado, fechaCreacion, fechaLimite)
      );
    }
  }

  // Traer tareas externas de la API (GET)
  async recuperarTareasAPI() {
    try {
      const res = await fetch(`${this.apiUrl}?_limit=3`);
      if (!res.ok) throw new Error('Falló la conexión con el servidor');

      const datos = await res.json();
      const tareasRecuperadas = datos.map(item => new Tarea(`api-${item.id}`, item.title, item.completed));

      // Filtrar para no repetir si ya las cargamos antes
      const idsActuales = new Set(this.tareas.map(t => t.id));
      const unicas = tareasRecuperadas.filter(t => !idsActuales.has(t.id));

      this.tareas = [...this.tareas, ...unicas];
      this.guardarLocalStorage();
      return true;
    } catch (err) {
      console.error('Error al traer datos:', err.message);
      throw err;
    }
  }

  // Enviar tarea creada a la API (POST)
  async guardarTareaAPI(tarea) {
    try {
      const res = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: tarea.descripcion,
          completed: tarea.estado,
          userId: 1
        })
      });

      if (!res.ok) throw new Error('No se pudo guardar dinámicamente en la API');

      const data = await res.json();
      console.log('Respuesta recibida del servidor:', data);
      return data;
    } catch (err) {
      console.error('Error al enviar datos:', err.message);
      throw err;
    }
  }
}

// Variables globales y selección de elementos del HTML
const gestor = new GestorTareas();

const formTarea = document.getElementById('form-tarea');
const inputDescripcion = document.getElementById('input-descripcion');
const inputLimite = document.getElementById('input-limite');
const listaTareas = document.getElementById('lista-tareas');
const inputBusqueda = document.getElementById('input-busqueda');
const contadorCaracteres = document.getElementById('contador-caracteres');
const notificacion = document.getElementById('notificacion');
const btnSync = document.getElementById('btn-sync');

// Cargar todo al abrir la página
document.addEventListener('DOMContentLoaded', () => {
  gestor.cargarLocalStorage();
  renderizarTareas(gestor.tareas);
  iniciarContadorRegresivo();
});

// Función para reescribir la lista en el DOM
const renderizarTareas = (lista) => {
  listaTareas.innerHTML = '';

  lista.forEach(tarea => {
    const { id, descripcion, estado, fechaLimite } = tarea;

    const li = document.createElement('li');
    li.className = `tarea-item ${estado ? 'completada' : ''}`;
    li.dataset.id = id;

    const textoLimite = fechaLimite 
      ? `<span class="fecha-limite" id="timer-${id}">Calculando tiempo...</span>`
      : '<span class="fecha-limite">Sin límite</span>';

    li.innerHTML = `
      <div class="info-tarea">
        <span class="descripcion">${descripcion}</span>
        ${textoLimite}
      </div>
      <div class="acciones">
        <button class="btn-completar">${estado ? 'Pendiente' : 'Completar'}</button>
        <button class="btn-eliminar">Eliminar</button>
      </div>
    `;

    listaTareas.appendChild(li);
  });
};

// Crear nueva tarea con pequeña demora simulada
formTarea.addEventListener('submit', (e) => {
  e.preventDefault();

  const descripcion = inputDescripcion.value.trim();
  const fechaLimite = inputLimite.value ? new Date(inputLimite.value).toISOString() : null;

  if (!descripcion) return;

  // Un pequeño retardo para simular procesamiento
  setTimeout(async () => {
    const nuevaTarea = new Tarea(Date.now().toString(), descripcion, false, new Date().toISOString(), fechaLimite);
    
    gestor.agregarTarea(nuevaTarea);
    renderizarTareas(gestor.tareas);

    // Intentar subirla a la API en segundo plano
    try {
      await gestor.guardarTareaAPI(nuevaTarea);
    } catch (err) {
      console.log('Guardada solo en local por fallo de red.');
    }

    formTarea.reset();
    contadorCaracteres.textContent = '0 caracteres';

    mostrarNotificacion('Tarea guardada con éxito.');
  }, 500);
});

// Contador de texto según se escribe
inputDescripcion.addEventListener('keyup', (e) => {
  contadorCaracteres.textContent = `${e.target.value.length} caracteres`;
});

// Filtrado rápido al tipear en la búsqueda
inputBusqueda.addEventListener('keyup', (e) => {
  const termino = e.target.value.toLowerCase();
  const filtradas = gestor.tareas.filter(t => t.descripcion.toLowerCase().includes(termino));
  renderizarTareas(filtradas);
});

// Detectar clics en los botones de las tareas agregadas
listaTareas.addEventListener('click', (e) => {
  const item = e.target.closest('.tarea-item');
  if (!item) return;

  const id = item.dataset.id;
  const tarea = gestor.obtenerTarea(id);

  if (e.target.classList.contains('btn-completar')) {
    if (tarea) {
      tarea.toggleEstado();
      gestor.guardarLocalStorage();
      renderizarTareas(gestor.tareas);
    }
  }

  if (e.target.classList.contains('btn-eliminar')) {
    gestor.eliminarTarea(id);
    renderizarTareas(gestor.tareas);
    mostrarNotificacion('Tarea eliminada.');
  }
});

// Resaltar elemento al pasar el mouse por encima
listaTareas.addEventListener('mouseover', (e) => {
  const item = e.target.closest('.tarea-item');
  if (item) item.classList.add('hovered');
});

listaTareas.addEventListener('mouseout', (e) => {
  const item = e.target.closest('.tarea-item');
  if (item) item.classList.remove('hovered');
});

// Botón para traer datos desde la API
btnSync.addEventListener('click', async () => {
  try {
    mostrarNotificacion('Cargando tareas remotas...');
    await gestor.recuperarTareasAPI();
    renderizarTareas(gestor.tareas);
    mostrarNotificacion('Tareas recuperadas con éxito.');
  } catch (err) {
    mostrarNotificacion('No se pudo conectar con la API.');
  }
});

// Ocultar el mensaje flotante después de 2 segundos
function mostrarNotificacion(mensaje) {
  notificacion.textContent = mensaje;
  notificacion.classList.remove('oculta');

  setTimeout(() => {
    notificacion.classList.add('oculta');
  }, 2000);
}

// Bucle que revisa los tiempos restantes cada segundo
function iniciarContadorRegresivo() {
  setInterval(() => {
    gestor.tareas.forEach(tarea => {
      if (!tarea.fechaLimite) return;

      const visor = document.getElementById(`timer-${tarea.id}`);
      if (!visor) return;

      const falta = new Date(tarea.fechaLimite).getTime() - new Date().getTime();

      if (falta <= 0) {
        visor.textContent = 'Plazo vencido';
        visor.style.color = 'var(--danger-color)';
      } else {
        const h = Math.floor((falta % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((falta % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((falta % (1000 * 60)) / 1000);

        visor.textContent = `Quedan: ${h}h ${m}m ${s}s`;
      }
    });
  }, 1000);
}// Clase para definir el formato de cada tarea
class Tarea {
  constructor(id, descripcion, estado = false, fechaCreacion = new Date().toISOString(), fechaLimite = null) {
    this.id = id;
    this.descripcion = descripcion;
    this.estado = estado;
    this.fechaCreacion = fechaCreacion;
    this.fechaLimite = fechaLimite;
  }

  // Cambiar entre completado o pendiente
  toggleEstado() {
    this.estado = !this.estado;
  }
}

// Controlador principal para manejar la lista y las llamadas
class GestorTareas {
  constructor() {
    this.tareas = [];
    this.apiUrl = 'https://jsonplaceholder.typicode.com/todos';
  }

  agregarTarea(tarea) {
    this.tareas = [...this.tareas, tarea];
    this.guardarLocalStorage();
  }

  eliminarTarea(id) {
    this.tareas = this.tareas.filter(tarea => tarea.id !== id);
    this.guardarLocalStorage();
  }

  obtenerTarea(id) {
    return this.tareas.find(tarea => tarea.id === id);
  }

  guardarLocalStorage() {
    localStorage.setItem('taskflow_tareas', JSON.stringify(this.tareas));
  }

  cargarLocalStorage() {
    const datos = localStorage.getItem('taskflow_tareas');
    if (datos) {
      const parsed = JSON.parse(datos);
      this.tareas = parsed.map(
        ({ id, descripcion, estado, fechaCreacion, fechaLimite }) => 
          new Tarea(id, descripcion, estado, fechaCreacion, fechaLimite)
      );
    }
  }

  // Traer tareas externas de la API (GET)
  async recuperarTareasAPI() {
    try {
      const res = await fetch(`${this.apiUrl}?_limit=3`);
      if (!res.ok) throw new Error('Falló la conexión con el servidor');

      const datos = await res.json();
      const tareasRecuperadas = datos.map(item => new Tarea(`api-${item.id}`, item.title, item.completed));

      // Filtrar para no repetir si ya las cargamos antes
      const idsActuales = new Set(this.tareas.map(t => t.id));
      const unicas = tareasRecuperadas.filter(t => !idsActuales.has(t.id));

      this.tareas = [...this.tareas, ...unicas];
      this.guardarLocalStorage();
      return true;
    } catch (err) {
      console.error('Error al traer datos:', err.message);
      throw err;
    }
  }

  // Enviar tarea creada a la API (POST)
  async guardarTareaAPI(tarea) {
    try {
      const res = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: tarea.descripcion,
          completed: tarea.estado,
          userId: 1
        })
      });

      if (!res.ok) throw new Error('No se pudo guardar dinámicamente en la API');

      const data = await res.json();
      console.log('Respuesta recibida del servidor:', data);
      return data;
    } catch (err) {
      console.error('Error al enviar datos:', err.message);
      throw err;
    }
  }
}

// Variables globales y selección de elementos del HTML
const gestor = new GestorTareas();

const formTarea = document.getElementById('form-tarea');
const inputDescripcion = document.getElementById('input-descripcion');
const inputLimite = document.getElementById('input-limite');
const listaTareas = document.getElementById('lista-tareas');
const inputBusqueda = document.getElementById('input-busqueda');
const contadorCaracteres = document.getElementById('contador-caracteres');
const notificacion = document.getElementById('notificacion');
const btnSync = document.getElementById('btn-sync');

// Cargar todo al abrir la página
document.addEventListener('DOMContentLoaded', () => {
  gestor.cargarLocalStorage();
  renderizarTareas(gestor.tareas);
  iniciarContadorRegresivo();
});

// Función para reescribir la lista en el DOM
const renderizarTareas = (lista) => {
  listaTareas.innerHTML = '';

  lista.forEach(tarea => {
    const { id, descripcion, estado, fechaLimite } = tarea;

    const li = document.createElement('li');
    li.className = `tarea-item ${estado ? 'completada' : ''}`;
    li.dataset.id = id;

    const textoLimite = fechaLimite 
      ? `<span class="fecha-limite" id="timer-${id}">Calculando tiempo...</span>`
      : '<span class="fecha-limite">Sin límite</span>';

    li.innerHTML = `
      <div class="info-tarea">
        <span class="descripcion">${descripcion}</span>
        ${textoLimite}
      </div>
      <div class="acciones">
        <button class="btn-completar">${estado ? 'Pendiente' : 'Completar'}</button>
        <button class="btn-eliminar">Eliminar</button>
      </div>
    `;

    listaTareas.appendChild(li);
  });
};

// Crear nueva tarea con pequeña demora simulada
formTarea.addEventListener('submit', (e) => {
  e.preventDefault();

  const descripcion = inputDescripcion.value.trim();
  const fechaLimite = inputLimite.value ? new Date(inputLimite.value).toISOString() : null;

  if (!descripcion) return;

  // Un pequeño retardo para simular procesamiento
  setTimeout(async () => {
    const nuevaTarea = new Tarea(Date.now().toString(), descripcion, false, new Date().toISOString(), fechaLimite);
    
    gestor.agregarTarea(nuevaTarea);
    renderizarTareas(gestor.tareas);

    // Intentar subirla a la API en segundo plano
    try {
      await gestor.guardarTareaAPI(nuevaTarea);
    } catch (err) {
      console.log('Guardada solo en local por fallo de red.');
    }

    formTarea.reset();
    contadorCaracteres.textContent = '0 caracteres';

    mostrarNotificacion('Tarea guardada con éxito.');
  }, 500);
});

// Contador de texto según se escribe
inputDescripcion.addEventListener('keyup', (e) => {
  contadorCaracteres.textContent = `${e.target.value.length} caracteres`;
});

// Filtrado rápido al tipear en la búsqueda
inputBusqueda.addEventListener('keyup', (e) => {
  const termino = e.target.value.toLowerCase();
  const filtradas = gestor.tareas.filter(t => t.descripcion.toLowerCase().includes(termino));
  renderizarTareas(filtradas);
});

// Detectar clics en los botones de las tareas agregadas
listaTareas.addEventListener('click', (e) => {
  const item = e.target.closest('.tarea-item');
  if (!item) return;

  const id = item.dataset.id;
  const tarea = gestor.obtenerTarea(id);

  if (e.target.classList.contains('btn-completar')) {
    if (tarea) {
      tarea.toggleEstado();
      gestor.guardarLocalStorage();
      renderizarTareas(gestor.tareas);
    }
  }

  if (e.target.classList.contains('btn-eliminar')) {
    gestor.eliminarTarea(id);
    renderizarTareas(gestor.tareas);
    mostrarNotificacion('Tarea eliminada.');
  }
});

// Resaltar elemento al pasar el mouse por encima
listaTareas.addEventListener('mouseover', (e) => {
  const item = e.target.closest('.tarea-item');
  if (item) item.classList.add('hovered');
});

listaTareas.addEventListener('mouseout', (e) => {
  const item = e.target.closest('.tarea-item');
  if (item) item.classList.remove('hovered');
});

// Botón para traer datos desde la API
btnSync.addEventListener('click', async () => {
  try {
    mostrarNotificacion('Cargando tareas remotas...');
    await gestor.recuperarTareasAPI();
    renderizarTareas(gestor.tareas);
    mostrarNotificacion('Tareas recuperadas con éxito.');
  } catch (err) {
    mostrarNotificacion('No se pudo conectar con la API.');
  }
});

// Ocultar el mensaje flotante después de 2 segundos
function mostrarNotificacion(mensaje) {
  notificacion.textContent = mensaje;
  notificacion.classList.remove('oculta');

  setTimeout(() => {
    notificacion.classList.add('oculta');
  }, 2000);
}

// Bucle que revisa los tiempos restantes cada segundo
function iniciarContadorRegresivo() {
  setInterval(() => {
    gestor.tareas.forEach(tarea => {
      if (!tarea.fechaLimite) return;

      const visor = document.getElementById(`timer-${tarea.id}`);
      if (!visor) return;

      const falta = new Date(tarea.fechaLimite).getTime() - new Date().getTime();

      if (falta <= 0) {
        visor.textContent = 'Plazo vencido';
        visor.style.color = 'var(--danger-color)';
      } else {
        const h = Math.floor((falta % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((falta % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((falta % (1000 * 60)) / 1000);

        visor.textContent = `Quedan: ${h}h ${m}m ${s}s`;
      }
    });
  }, 1000);
}