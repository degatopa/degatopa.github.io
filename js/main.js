// DEGA OS 2000: carga los datos, arma el escritorio, la barra de tareas, el menú Inicio
// y conecta las rutas con hash (#/trabajos, #/trabajos/fep-2025, ...) con las ventanas.
import { GestorVentanas, esMovil } from './wm.js';
import * as prefs from './prefs.js';
import { icono } from './ui/pixel.js';
import { sonar } from './sonidos.js';
import { configurarVideos, cargarManifiesto } from './ui/reproductor.js';
import { iniciarArranque } from './arranque.js';
import { crearGuia } from './guia.js';

// La pantalla de arranque ya está pintada (index.html); desde aquí su barra sigue la carga real.
const arranque = iniciarArranque({ prefs });

/** Espera a que lleguen las fuentes de Google (o 4 s, si la red no responde). */
function esperarFuentes() {
  const hoja = document.querySelector('link[href*="fonts.googleapis.com/css2"]');
  const hojaLista = new Promise((listo) => {
    if (!hoja || hoja.sheet) return listo();
    hoja.addEventListener('load', listo, { once: true });
    hoja.addEventListener('error', listo, { once: true });
  });
  const fuentes = hojaLista.then(() =>
    Promise.all(['400 1em "Pirata One"', '400 1em VT323', '400 1em "IBM Plex Mono"'].map((f) => document.fonts.load(f))),
  );
  return Promise.race([fuentes, new Promise((r) => setTimeout(r, 4000))]).catch(() => {});
}
esperarFuentes().then(() => arranque.paso('fuentes'));

// Cada app vive en su propio módulo y se carga solo cuando se abre su ventana.
const APPS = {
  bienvenido: { modulo: './apps/bienvenido.js', ancho: 600, alto: 540, x: 112, y: 48 },
  reel: { modulo: './apps/reel.js', ancho: 1040, alto: 640 },
  trabajos: { modulo: './apps/trabajos.js', ancho: 1180, alto: 720, x: 60, y: 24 },
  proyecto: { modulo: './apps/proyecto.js', ancho: 1240, alto: 760, x: 40, y: 16 },
  'como-trabajo': { modulo: './apps/degapedia.js', ancho: 1240, alto: 780, x: 50, y: 12 },
  software: { modulo: './apps/software.js', ancho: 1180, alto: 780, x: 60, y: 14 },
  titulos: { modulo: './apps/titulos.js', ancho: 1240, alto: 780, x: 50, y: 14 },
  contacto: { modulo: './apps/contacto.js', ancho: 860, alto: 780, x: 100, y: 20 },
  'hoja-de-vida': { modulo: './apps/hoja-de-vida.js', ancho: 780, alto: 760, x: 110, y: 20 },
  pantalla: { modulo: './apps/pantalla.js', ancho: 640, alto: 640, botones: ['ayuda', 'cerrar'] },
  // Solo en local, con el servidor de scripts/servir.mjs (ver editorDisponible).
  editor: { modulo: './apps/editor.js', ancho: 1120, alto: 760, x: 70, y: 16, titulo: 'Editor de contenido', icono: 'documento' },
};

// El editor existe solo cuando el sitio corre en tu computador con scripts/servir.mjs.
// En la web publicada ni siquiera se pregunta, para no dejar errores en la consola.
const esLocal = ['127.0.0.1', 'localhost'].includes(location.hostname);
const editorDisponible = esLocal
  ? await fetch('__editor/estado', { cache: 'no-store' }).then((r) => r.ok).catch(() => false)
  : false;

async function cargarDatos() {
  const nombres = ['sitio', 'proyectos', 'software', 'titulos'];
  const respuestas = await Promise.all(nombres.map((n) => fetch(`data/${n}.json`).then((r) => r.json())));
  return Object.fromEntries(nombres.map((n, i) => [n, respuestas[i]]));
}

const datos = await cargarDatos();
arranque.textos(datos.sitio.arranque);
arranque.paso('datos');
const { sitio } = datos;
const secciones = Object.fromEntries(sitio.secciones.map((s) => [s.id, s]));

prefs.aplicar();
configurarVideos(sitio.videos?.base);

// ---------- Rutas ----------

const rutaActual = () => location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);

// Datos que una ventana le pasa a otra al abrirla (por ejemplo, Contacto con "pedir demo" marcado).
const paramsPendientes = new Map();

/** Cambia el hash; la ventana se abre al reaccionar a hashchange. */
export function navegar(ruta, params) {
  if (params) {
    const abierta = wm.obtener(ruta);
    if (abierta?.alRecibir) abierta.alRecibir(params);
    else paramsPendientes.set(ruta, params);
  }
  if (location.hash === `#/${ruta}`) alCambiarRuta();
  else location.hash = `/${ruta}`;
}

/** Carga familias de Google Fonts la primera vez que una ventana las necesita. */
const fuentesCargadas = new Set();
function cargarFuentes(consulta) {
  if (fuentesCargadas.has(consulta)) return;
  fuentesCargadas.add(consulta);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?${consulta}&display=swap`;
  document.head.append(link);
}

function reemplazarHash(ruta) {
  const nuevo = ruta ? `#/${ruta}` : '#/';
  if (location.hash !== nuevo) history.replaceState(null, '', nuevo);
}

const wm = new GestorVentanas({
  contenedor: document.querySelector('[data-ventanas]'),
  tareas: document.querySelector('[data-tareas]'),
  // La ventana activa define el hash, sin crear una entrada nueva en el historial.
  alCambiarActiva: (v) => reemplazarHash(v?.ruta ?? ''),
});

// Posición y tamaño que hereda la próxima ventana (al pasar de un proyecto al siguiente).
let cajaHeredada = null;

/** Cierra una ventana y abre otra ruta en el mismo lugar y con el mismo tamaño. */
function reemplazarVentana(ventana, ruta) {
  cajaHeredada = { x: ventana.x, y: ventana.y, ancho: ventana.el.offsetWidth, alto: ventana.el.offsetHeight };
  wm.cerrar(ventana.id);
  navegar(ruta);
}

const contexto = { datos, wm, navegar, prefs, esMovil, reemplazarVentana, cargarFuentes };

// Dega, el pez guía (js/guia.js).
const guia = crearGuia(contexto);

async function abrirApp(app, { ruta = null, params = {}, titulo, iconoApp, caja = {} } = {}) {
  const def = APPS[app];
  const seccion = secciones[app];
  const id = ruta || app;
  if (wm.existe(id)) {
    wm.restaurar(id);
    return;
  }
  if (paramsPendientes.has(id)) {
    params = { ...params, ...paramsPendientes.get(id) };
    paramsPendientes.delete(id);
  }
  caja = { ...cajaHeredada, ...caja };
  cajaHeredada = null;
  const modulo = await import(def.modulo);
  await wm.abrir({
    id,
    ruta,
    titulo: titulo || seccion?.titulo || def.titulo || app,
    icono: iconoApp || seccion?.icono || def.icono || 'documento',
    ancho: caja.ancho ?? def.ancho,
    alto: caja.alto ?? def.alto,
    x: caja.x ?? def.x,
    y: caja.y ?? def.y,
    botones: def.botones,
    contenido: (cuerpo, ventana) => modulo.crear(cuerpo, { ...contexto, app, def, params, ventana }),
  });
  guia.consejo(app);
}

function alCambiarRuta() {
  // Sobre mí ahora vive en la DEGApedia: los enlaces viejos llevan allá.
  if (rutaActual()[0] === 'sobre-mi') reemplazarHash('como-trabajo');
  const [seccion, sub] = rutaActual();
  if (!seccion) {
    // En móvil, volver a "#/" equivale a salir de la ventana a pantalla completa.
    if (esMovil() && wm.activa()) wm.cerrar(wm.activa().id);
    return;
  }
  if (seccion === 'trabajos' && sub) {
    const proyecto = datos.proyectos.proyectos.find((p) => p.id === sub);
    if (!proyecto) return reemplazarHash('trabajos');
    return abrirApp('proyecto', {
      ruta: `trabajos/${sub}`,
      params: { proyecto },
      titulo: `${proyecto.archivo} — Proyecto`,
      iconoApp: 'reel',
    });
  }
  if (APPS[seccion] && seccion !== 'proyecto' && seccion !== 'bienvenido' && (seccion !== 'editor' || editorDisponible)) {
    return abrirApp(seccion, { ruta: seccion });
  }
  reemplazarHash('');
}

window.addEventListener('hashchange', alCambiarRuta);

// ---------- Escritorio ----------

function pintarIconos() {
  const lista = document.querySelector('[data-iconos]');
  lista.innerHTML = '';
  for (const s of sitio.secciones) {
    const li = document.createElement('li');
    li.className = 'iconos__item';
    if (s.escritorio === false) li.classList.add('solo-movil');
    if (s.movil === false) li.classList.add('solo-escritorio');
    li.innerHTML = `<button type="button" class="icono" data-ruta="${s.id}">
        ${icono(s.icono)}
        <span class="icono__texto" data-escritorio></span>
        <span class="icono__texto" data-movil></span>
      </button>`;
    li.querySelector('[data-escritorio]').textContent = s.etiqueta;
    li.querySelector('[data-movil]').textContent = s.etiquetaMovil || s.etiqueta;
    lista.append(li);
  }
  if (editorDisponible) {
    lista.insertAdjacentHTML('beforeend', `<li class="iconos__item"><button type="button" class="icono" data-ruta="editor">
        ${icono('documento')}<span class="icono__texto" data-escritorio>Editor.exe</span><span class="icono__texto" data-movil>Editor</span>
      </button></li>`);
  }
  lista.addEventListener('click', (e) => {
    const boton = e.target.closest('[data-ruta]');
    if (!boton) return;
    sonar.clic();
    navegar(boton.dataset.ruta);
  });
}

// ---------- Menú Inicio ----------

const botonInicio = document.querySelector('.inicio');
const menu = document.getElementById('menu-inicio');

function pintarMenu() {
  const lista = menu.querySelector('[data-menu]');
  const item = (nombreIcono, texto, atributos, etiqueta = 'button') =>
    `<${etiqueta} class="menu__item" role="menuitem" tabindex="-1" ${atributos}>${icono(nombreIcono)}<span>${texto}</span></${etiqueta}>`;
  lista.innerHTML = [
    item('bienvenido', sitio.bienvenido.titulo, 'type="button" data-accion="bienvenido"'),
    ...sitio.secciones.filter((s) => s.id !== 'pantalla').map((s) => item(s.icono, s.menu, `type="button" data-ruta="${s.id}"`)),
    '<div class="menu__separador" role="separator"></div>',
    item('monitor', secciones.pantalla.menu, 'type="button" data-ruta="pantalla"'),
    item('simple', 'Versión simple', 'href="simple.html"', 'a'),
    editorDisponible ? item('documento', 'Editor de contenido', 'type="button" data-ruta="editor"') : '',
    '<div class="menu__separador" role="separator"></div>',
    item('apagar', 'Apagar…', 'type="button" data-accion="apagar"'),
  ].join('');
}

const itemsMenu = () => [...menu.querySelectorAll('.menu__item')];

function abrirMenu() {
  // El menú se arma la primera vez que se abre: así la carga inicial lleva menos elementos.
  if (!menu.querySelector('.menu__item')) pintarMenu();
  menu.hidden = false;
  botonInicio.setAttribute('aria-expanded', 'true');
  itemsMenu()[0].focus();
}

function cerrarMenu(devolverFoco = true) {
  if (menu.hidden) return;
  menu.hidden = true;
  botonInicio.setAttribute('aria-expanded', 'false');
  if (devolverFoco) botonInicio.focus();
}

botonInicio.addEventListener('click', () => {
  sonar.clic();
  if (menu.hidden) abrirMenu();
  else cerrarMenu();
});

menu.addEventListener('click', (e) => {
  const item = e.target.closest('.menu__item');
  if (!item) return;
  cerrarMenu(false);
  if (item.dataset.ruta) navegar(item.dataset.ruta);
  if (item.dataset.accion === 'bienvenido') abrirBienvenido();
  if (item.dataset.accion === 'apagar') apagar();
});

menu.addEventListener('keydown', (e) => {
  const items = itemsMenu();
  const i = items.indexOf(document.activeElement);
  const mover = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: items.length - 1 }[e.key];
  if (mover !== undefined) {
    e.preventDefault();
    items[(mover + items.length) % items.length].focus();
  } else if (e.key === 'Escape') {
    e.preventDefault();
    cerrarMenu();
  } else if (e.key === 'Tab') {
    cerrarMenu(false);
  }
});

document.addEventListener('pointerdown', (e) => {
  if (!menu.hidden && !menu.contains(e.target) && !botonInicio.contains(e.target)) cerrarMenu(false);
});

// ---------- Bandeja: LED del CRT y reloj ----------

function pintarLed(estado) {
  document.querySelectorAll('[data-led]').forEach((led) => {
    led.setAttribute('aria-pressed', String(estado.crt));
    led.setAttribute('aria-label', estado.crt ? 'Filtro CRT encendido. Clic para apagarlo' : 'Filtro CRT apagado. Clic para encenderlo');
  });
}

document.querySelectorAll('[data-led]').forEach((led) =>
  led.addEventListener('click', () => {
    sonar.clic();
    prefs.guardar({ crt: !prefs.obtener().crt });
  }),
);
prefs.suscribir(pintarLed);
pintarLed(prefs.obtener());

function pintarReloj() {
  const ahora = new Date();
  document.querySelectorAll('[data-reloj]').forEach((el) => {
    const doce = el.dataset.reloj === '12';
    el.textContent = ahora.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit', hour12: doce });
    el.dateTime = ahora.toISOString();
  });
}
pintarReloj();
setInterval(pintarReloj, 15000);

// ---------- Bienvenido, apagar y arranque ----------

async function abrirBienvenido() {
  if (esMovil()) return; // en móvil, Bienvenido vive en la portada del inicio
  await abrirApp('bienvenido', { titulo: sitio.bienvenido.titulo, iconoApp: 'bienvenido' });
}

/**
 * Al entrar en escritorio: Dega se presenta con su globo (lo que antes decía Bienvenido.exe, que sigue
 * en el menú Inicio) y se abre el reproductor con el reel en bucle.
 * En móvil la portada ya trae el reel, el titular y el botón: Dega solo avisa lo del CRT la primera vez.
 */
async function abrirEntrada() {
  if (esMovil()) {
    const portada = document.querySelector('[data-bienvenido-movil]');
    if (!portada.childElementCount) {
      const { crearMovil } = await import('./apps/bienvenido.js');
      await crearMovil(portada, contexto);
    }
    if (!prefs.obtener().globoVisto && prefs.obtener().crt) {
      prefs.guardar({ globoVisto: true });
      setTimeout(() => guia.decir({ texto: sitio.guia.crtMovil ?? sitio.guia.crt }), 1500);
    }
    return;
  }
  guia.presentar();
  const ancho = Math.min(APPS.reel.ancho, window.innerWidth - 160);
  if (ancho >= 560) {
    await abrirApp('reel', { ruta: 'reel', caja: { ancho, alto: 600, x: 112, y: 40 } });
  }
}

async function apagar() {
  const pantalla = document.querySelector('[data-apagado]');
  wm.cerrarTodas();
  reemplazarHash('');
  pantalla.hidden = false;
  await new Promise((r) => setTimeout(r, 900));
  // Todo ya está cargado: la barra solo recorre su animación de 0 a 100 %.
  const reinicio = iniciarArranque({ prefs, forzar: true });
  reinicio.textos(sitio.arranque);
  ['datos', 'fuentes', 'escritorio', 'reel'].forEach((p) => reinicio.paso(p));
  pantalla.hidden = true;
  await reinicio.listo;
  iniciarEscritorio();
}

async function iniciarEscritorio() {
  const ruta = rutaActual();
  await abrirEntrada();
  // Si se entró con un enlace directo (#/trabajos/...), esa ventana queda encima.
  if (ruta.length) {
    reemplazarHash(ruta.join('/'));
    alCambiarRuta();
  }
}

pintarIconos();

// Escritorio: los módulos de las primeras ventanas quedan descargados antes de entrar.
await Promise.all([import('./apps/bienvenido.js'), import('./apps/reel.js')]);
arranque.paso('escritorio');

// Reel: la lista de videos y la portada del reel, para que se vea apenas se abra la ventana.
await cargarManifiesto();
await new Promise((listo) => {
  const portadaReel = new Image();
  portadaReel.onload = portadaReel.onerror = listo;
  portadaReel.src = `${sitio.videos?.base || 'assets/videos/'}${sitio.reel.video}-portada.webp`;
  setTimeout(listo, 4000); // si la red no responde, no se queda esperando
});
arranque.paso('reel');

await arranque.listo;
iniciarEscritorio();

// Utilidad para revisar el estado desde la consola durante el desarrollo.
window.__dega = { wm, datos, prefs, navegar };
