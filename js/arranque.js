// Pantalla de arranque. Está escrita en index.html (#arranque) para que sea lo primero que se pinta.
// La barra avanza con la carga real: main.js avisa cada paso (datos, fuentes, escritorio, reel) y la
// barra se llena bloque a bloque hasta ese punto, sin correr más rápido que DURACION_MINIMA, para que
// la animación se vea completa. Un clic la adelanta (con teclado: Enter sobre el botón "Entrar").
// Con "Saltar intro la próxima vez" no aparece al entrar (sí al Apagar).
// Mientras carga suena la música de arranque. Los navegadores no dejan sonar audio hasta que el
// visitante hace clic o toca una tecla, así que si la bloquean, empieza con esa primera interacción.
const MUSICA = 'assets/sonidos/arranque.mp3';

const PASOS = {
  datos: 'Cargando datos…',
  fuentes: 'Cargando fuentes…',
  escritorio: 'Preparando escritorio…',
  reel: 'Cargando reel…',
};
const BLOQUES = 12;
const DURACION_MINIMA = 2200; // ms que tarda la barra de 0 a 100 % aunque todo cargue antes
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Muestra el arranque y devuelve los controles para que main.js marque la carga real.
 * @param {object} o
 * @param {object} o.prefs
 * @param {boolean} [o.forzar]  mostrarlo aunque el visitante haya elegido saltarlo (al Apagar)
 */
export function iniciarArranque({ prefs, forzar = false }) {
  const el = document.getElementById('arranque');
  const pasos = new Set();
  let lineas = [];
  let mostrado = 0; // porcentaje que dibuja la barra
  let adelantar = false;
  let saliendo = false;
  let terminar;
  const listo = new Promise((r) => (terminar = r));

  if (!forzar && prefs.obtener().saltarIntro) {
    el.hidden = true;
    terminar();
    return { paso() {}, textos() {}, listo };
  }

  // Estado inicial (al Apagar, la misma pantalla se vuelve a usar).
  document.documentElement.classList.remove('sin-intro');
  el.hidden = false;
  el.classList.remove('arranque--sale');
  const registro = el.querySelector('.arranque__registro');
  const barra = el.querySelector('.arranque__barra');
  const relleno = barra.querySelector('span');
  const estado = el.querySelector('.arranque__estado');
  const casilla = el.querySelector('.arranque__saltar input');
  registro.replaceChildren();
  el.querySelector('[data-crt]').textContent = prefs.obtener().crt ? 'ON' : 'OFF';
  casilla.checked = prefs.obtener().saltarIntro;
  casilla.onchange = () => prefs.guardar({ saltarIntro: casilla.checked });
  el.querySelector('.arranque__entrar').focus({ preventScroll: true });

  // La música sigue sonando sobre el escritorio hasta terminar; si nadie interactuó antes de entrar, no suena.
  const musica = new Audio(MUSICA);
  musica.volume = 0.7;
  const esperaGesto = new AbortController();
  const tocar = () => {
    esperaGesto.abort();
    musica.play().catch(() => {});
  };
  musica.play().catch(() => {
    for (const evento of ['pointerdown', 'keydown']) window.addEventListener(evento, tocar, { signal: esperaGesto.signal });
  });
  // Si un video empieza a sonar mientras suena la música de arranque, el video baja de volumen
  // hasta que la música termina y después sube despacio, para que no se encimen.
  const bajados = new Map(); // video → su volumen de antes
  const esperaVideo = new AbortController();
  const bajarVideo = (e) => {
    const video = e.target;
    if (!(video instanceof HTMLVideoElement) || video.muted || musica.paused || bajados.has(video)) return;
    bajados.set(video, video.volume);
    video.volume = Math.min(video.volume, 0.15);
  };
  for (const evento of ['playing', 'volumechange']) document.addEventListener(evento, bajarVideo, { capture: true, signal: esperaVideo.signal });
  const subirVideos = () => {
    esperaVideo.abort();
    bajados.forEach((antes, video) => {
      const desde = video.volume;
      let i = 0;
      const subir = setInterval(() => {
        video.volume = desde + (antes - desde) * (++i / 10);
        if (i === 10) clearInterval(subir);
      }, 60);
    });
  };
  musica.addEventListener('ended', subirVideos);
  musica.addEventListener('error', subirVideos);

  const objetivo = () => (pasos.size / Object.keys(PASOS).length) * 100;

  function escribirLineas() {
    // Cada línea del registro aparece cuando la barra pasa su parte proporcional.
    const cuantas = Math.min(lineas.length, Math.ceil((mostrado / 100) * lineas.length));
    while (registro.childElementCount < cuantas) {
      const i = registro.childElementCount;
      const ultima = i === lineas.length - 1;
      const span = document.createElement('span');
      span.className = ultima ? 'arranque__linea arranque__linea--ultima' : 'arranque__linea';
      // El "_" final del texto se vuelve el cursor que parpadea.
      span.textContent = ultima ? lineas[i].replace(/_$/, '') : lineas[i];
      registro.append(span);
    }
  }

  function dibujar() {
    const bloques = Math.floor((mostrado / 100) * BLOQUES);
    const ancho = barra.clientWidth - 6; // menos el relleno interno de la barra
    relleno.style.setProperty('--bloque', `${ancho / BLOQUES}px`);
    relleno.style.width = `${(bloques * ancho) / BLOQUES}px`;
    barra.setAttribute('aria-valuenow', String(Math.round(mostrado)));
    escribirLineas();
  }

  // La barra persigue a la carga real, a una velocidad máxima que garantiza ver la animación.
  let antes = performance.now();
  let ultimoCuadro = antes;
  let pedido = false;
  const programar = () => {
    if (pedido) return;
    pedido = true;
    requestAnimationFrame((t) => {
      pedido = false;
      cuadro(t);
    });
  };
  function cuadro(ahora) {
    if (saliendo) return;
    ultimoCuadro = performance.now();
    const paso = ((ahora - antes) / DURACION_MINIMA) * 100;
    antes = ahora;
    mostrado = adelantar ? objetivo() : Math.min(objetivo(), mostrado + paso);
    dibujar();
    if (mostrado >= 100) {
      estado.textContent = 'Listo.';
      salir();
      return;
    }
    programar();
  }
  programar();
  // Si el navegador deja de dar cuadros de animación (pestaña en segundo plano), este respaldo sigue avanzando.
  const respaldo = setInterval(() => {
    if (performance.now() - ultimoCuadro > 200) cuadro(performance.now());
  }, 100);

  const alSaltar = (e) => {
    // Usar la casilla no cuenta como "entrar".
    if (e.target.closest('.arranque__saltar')) return;
    adelantar = true;
  };
  el.addEventListener('click', alSaltar);

  async function salir() {
    if (saliendo) return;
    saliendo = true;
    clearInterval(respaldo);
    el.removeEventListener('click', alSaltar);
    await esperar(adelantar ? 0 : 350);
    esperaGesto.abort();
    el.classList.add('arranque--sale');
    await esperar(160);
    el.hidden = true;
    terminar();
  }

  return {
    /** Marca un paso de la carga como terminado. */
    paso(nombre) {
      pasos.add(nombre);
      const siguiente = Object.keys(PASOS).find((p) => !pasos.has(p));
      estado.textContent = siguiente ? PASOS[siguiente] : 'Iniciando…';
    },
    /** Pone los textos de data/sitio.json (líneas del registro y lema). */
    textos({ lineas: l, lema }) {
      lineas = l;
      el.querySelector('.arranque__lema').textContent = lema;
      escribirLineas();
    },
    listo,
  };
}
