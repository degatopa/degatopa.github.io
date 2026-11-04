// Reproductor de video de DEGA OS: OSD tipo VHS, ruido VHS, LCD con créditos,
// controles propios, lista de reproducción y atajos de teclado.
// Los videos se cargan solo al reproducir (preload="none" con portada).
import { glifo } from './pixel.js';
import * as prefs from '../prefs.js';

const COLORES = ['#2233FF', '#0000E8', '#14141B', '#FFE500', '#E30613', '#2A1250', '#E8E2CE', '#14141B', '#E30613', '#39D353'];
// Sobre estos fondos el texto de "sin señal" va en tinta oscura.
const CLAROS = new Set(['#FFE500', '#E8E2CE', '#39D353']);

// Solo suena un video a la vez: al reproducir uno, los demás se pausan.
const videos = new Set();

/**
 * Reproduce con sonido. Si el navegador no deja sonar audio antes de que el visitante toque la página,
 * arranca en silencio y el sonido se activa solo con el primer clic, toque o tecla.
 */
function reproducirConSonido(video, alActivar) {
  video.muted = false;
  return video.play().catch((error) => {
    if (error.name !== 'NotAllowedError') return;
    video.muted = true;
    video.play().catch(() => {});
    const espera = new AbortController();
    const activar = () => {
      // Chrome solo deja quitar el silencio durante un gesto real (no al terminar de desplazar la página).
      if (navigator.userActivation && !navigator.userActivation.isActive) return;
      espera.abort();
      if (!video.isConnected || !video.muted) return;
      video.muted = false;
      if (video.paused) video.play().catch(() => {});
      alActivar();
    };
    for (const evento of ['click', 'touchend', 'keydown']) {
      window.addEventListener(evento, activar, { capture: true, signal: espera.signal });
    }
  });
}

let manifiesto;
/** Datos de los videos codificados (assets/videos/videos.json, lo escribe scripts/codificar-videos.sh). */
export function cargarManifiesto() {
  manifiesto ??= fetch('assets/videos/videos.json')
    .then((r) => (r.ok ? r.json() : {}))
    .catch(() => ({}));
  return manifiesto;
}

/** El reel más todos los proyectos, en el orden de la lista de reproducción. */
export function listaDeVideos(datos) {
  const { sitio, proyectos } = datos;
  return [
    { id: 'reel', archivo: sitio.reel.archivo, video: sitio.reel.video, proyecto: null },
    ...proyectos.proyectos.map((p) => ({ id: p.id, archivo: p.archivo, video: p.video, proyecto: p })),
  ].map((item, i) => ({ ...item, color: COLORES[i % COLORES.length] }));
}

// Desde dónde se sirven los videos (data/sitio.json → videos.base). La lista videos.json siempre es local.
let baseVideos = 'assets/videos/';
export const configurarVideos = (base) => (baseVideos = base || baseVideos);
const rutaVideo = (video, sufijo) => `${baseVideos}${video}${sufijo}`;

/** <source> de un video, solo con las versiones que existen (videos.json → variantes). */
function fuentes(video, info) {
  const variantes = info.variantes || ['720', 'webm'];
  return [
    variantes.includes('720') && `<source src="${rutaVideo(video, '-720.mp4')}" type="video/mp4" media="(max-width: 1023px)">`,
    variantes.includes('webm') && `<source src="${rutaVideo(video, '.webm')}" type='video/webm; codecs="vp9, opus"'>`,
    `<source src="${rutaVideo(video, '-1080.mp4')}" type="video/mp4">`,
  ]
    .filter(Boolean)
    .join('');
}

const dosDigitos = (n) => String(Math.floor(n)).padStart(2, '0');
const mmss = (s = 0) => `${dosDigitos(s / 60)}:${dosDigitos(s % 60)}`;
const hmmss = (s = 0) => `${Math.floor(s / 3600)}:${dosDigitos((s / 60) % 60)}:${dosDigitos(s % 60)}`;
export const mb = (bytes) => `${(bytes / 1048576).toFixed(1).replace('.', ',')} MB`;
export { rutaVideo };
const reducido = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let n = 0;

/**
 * @param {HTMLElement} raiz
 * @param {object} o
 * @param {object[]} o.lista       ver listaDeVideos()
 * @param {number} [o.indice]
 * @param {'completo'|'proyecto'|'compacto'} [o.modo]  completo: con menú, LCD, lista y barra de estado;
 *                                proyecto: pantalla y controles; compacto: solo la pantalla
 * @param {boolean} [o.autoplay]   arranca solo, con sonido (no si el visitante pidió menos movimiento)
 * @param {boolean} [o.bucle]
 * @param {string} [o.creditos]    texto que se desplaza en la pantalla LCD
 * @param {HTMLElement} [o.teclas] elemento que escucha los atajos (por defecto, la pantalla)
 * @param {(ruta: string) => void} [o.navegar]
 * @param {(item: object) => void} [o.alCambiar]
 */
export async function crearReproductor(raiz, o) {
  const datosVideos = await cargarManifiesto();
  const id = `rep-${++n}`;
  const modo = o.modo || 'completo';
  const completo = modo === 'completo';
  const conControles = modo !== 'compacto';
  const varios = o.lista.length > 1;
  let indice = o.indice || 0;
  let arrastrando = false;
  let avisoTimer;

  raiz.innerHTML = `
    <div class="rep rep--${modo}">
      ${completo ? `
      <div class="rep__menu" role="toolbar" aria-label="Opciones del reproductor">
        <button type="button" class="rep__menu-item" data-accion="alternar">Reproducir</button>
        <button type="button" class="rep__menu-item" data-accion="vhs">Efectos</button>
        <button type="button" class="rep__menu-item" data-accion="lista" aria-expanded="true" aria-controls="${id}-lateral">Lista</button>
        <button type="button" class="rep__menu-item" data-accion="completa">Pantalla completa</button>
      </div>` : ''}
      <div class="rep__principal">
        <div class="rep__izq">
          <div class="rep__pantalla" tabindex="0" role="group" aria-roledescription="reproductor de video">
            <video playsinline preload="none"></video>
            <div class="rep__senal">
              <p class="rep__senal-titulo">[ SIN SEÑAL ]</p>
              <p class="rep__senal-texto"></p>
            </div>
            <div class="vhs-ruido" aria-hidden="true"></div>
            <span class="rep__gran-play" aria-hidden="true">${glifo('play')}</span>
            <div class="rep__osd" aria-hidden="true">
              <span class="rep__osd-estado"></span>
              <span class="rep__osd-sp"></span>
              <span class="rep__osd-norma">${conControles ? 'NTSC' : ''}</span>
              <span class="rep__osd-archivo"></span>
              <span class="rep__osd-aviso"></span>
            </div>
          </div>
          ${completo ? `
          <div class="rep__lcd">
            <span class="rep__lcd-tiempo">00:00</span>
            <span class="rep__barras" aria-hidden="true">${'<i></i>'.repeat(9)}</span>
            <div class="rep__marquesina"><div class="rep__marquesina-pista"><span></span><span aria-hidden="true"></span></div></div>
          </div>` : ''}
          ${conControles ? `
          <div class="rep__controles">
            <div class="rep__grupo">
              ${varios ? `<button type="button" class="rep__boton" data-accion="anterior" aria-label="Video anterior">${glifo('anterior')}</button>` : ''}
              <button type="button" class="rep__boton" data-accion="play" aria-label="Reproducir">${glifo('play')}</button>
              <button type="button" class="rep__boton" data-accion="pausa" aria-label="Pausa">${glifo('pausa')}</button>
              <button type="button" class="rep__boton" data-accion="stop" aria-label="Detener">${glifo('stop')}</button>
              ${varios ? `<button type="button" class="rep__boton" data-accion="siguiente" aria-label="Video siguiente">${glifo('siguiente')}</button>` : ''}
            </div>
            <input type="range" class="rep__avance" min="0" max="1000" value="0" step="1" aria-label="Avance del video">
            <span class="rep__tiempo">00:00 / 00:00</span>
            <div class="rep__grupo">
              <button type="button" class="rep__boton rep__boton--texto" data-accion="vhs" title="Ruido VHS sobre el video">VHS</button>
              <button type="button" class="rep__boton rep__boton--texto" data-accion="crt" title="Filtro CRT de la pantalla">CRT</button>
              <button type="button" class="rep__boton" data-accion="completa" aria-label="Pantalla completa (F)">${glifo('completa')}</button>
            </div>
            <div class="rep__volumen">
              <button type="button" class="rep__boton rep__boton--plano" data-accion="silencio" aria-label="Activar sonido (M)">${glifo('silencio')}</button>
              <input type="range" class="rep__nivel" min="0" max="100" value="80" aria-label="Volumen">
            </div>
          </div>` : ''}
        </div>
        ${completo ? `
        <aside class="rep__lateral" id="${id}-lateral">
          <h3 class="rep__lateral-titulo"></h3>
          <ol class="rep__lista hundido"></ol>
          <div class="rep__info">
            <h4>Información del archivo</h4>
            <dl></dl>
          </div>
          <button type="button" class="btn rep__abrir" data-accion="abrir">Abrir el proyecto completo</button>
        </aside>` : ''}
      </div>
      ${completo ? '<p class="rep__estado" aria-live="polite"></p>' : ''}
    </div>`;

  const $ = (sel) => raiz.querySelector(sel);
  const rep = $('.rep');
  const video = $('video');
  const pantalla = $('.rep__pantalla');
  const avance = $('.rep__avance');
  const nivel = $('.rep__nivel');
  const osd = {
    estado: $('.rep__osd-estado'),
    sp: $('.rep__osd-sp'),
    archivo: $('.rep__osd-archivo'),
    aviso: $('.rep__osd-aviso'),
  };

  video.loop = o.bucle ?? true;
  video.muted = false;
  video.volume = 0.8;

  if (completo && o.creditos) {
    raiz.querySelectorAll('.rep__marquesina-pista span').forEach((s) => (s.textContent = `*** ${o.creditos} ***`));
  }

  // ---------- Carga de un video ----------

  function cargar(i, reproducir = false) {
    indice = (i + o.lista.length) % o.lista.length;
    const item = o.lista[indice];
    const info = datosVideos[item.video];
    video.pause();
    video.removeAttribute('src');
    video.replaceChildren();
    video.load();
    rep.classList.toggle('sin-video', !info);
    pantalla.style.setProperty('--color-senal', item.color);
    pantalla.classList.toggle('senal-clara', CLAROS.has(item.color));
    pantalla.setAttribute('aria-label', `Video ${item.archivo}. Espacio: reproducir o pausar. Flechas: 5 segundos. M: sonido. F: pantalla completa.`);
    osd.archivo.textContent = completo ? `ARCHIVO ${String(indice + 1).padStart(5, '0')}` : item.archivo;
    $('.rep__senal-texto').textContent = info ? '' : `${item.archivo} · video pendiente`;

    if (info) {
      video.poster = rutaVideo(item.video, '-portada.webp');
      video.innerHTML = fuentes(item.video, info);
      if (reproducir) reproducirConSonido(video, () => (activadoEn = performance.now()));
    } else {
      video.removeAttribute('poster');
    }
    pintarLista();
    pintarInfo(item, info);
    pintarEstado();
    pintarTiempo();
    o.alCambiar?.(item);
  }

  // ---------- Acciones ----------

  const hayVideo = () => !rep.classList.contains('sin-video');

  function alternar() {
    if (!hayVideo()) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  }

  function detener() {
    video.pause();
    if (video.readyState) video.currentTime = 0;
    rep.classList.add('detenido');
    pintarEstado();
  }

  function saltar(segundos) {
    if (!hayVideo() || !video.duration) return;
    video.currentTime = Math.min(Math.max(0, video.currentTime + segundos), video.duration);
    avisar(segundos > 0 ? `►► +${segundos}s` : `◄◄ ${segundos}s`);
  }

  function alternarSonido() {
    video.muted = !video.muted;
    if (!video.muted && video.volume === 0) video.volume = 0.8;
    avisar(video.muted ? 'MUTE' : 'SONIDO ON');
    pintarEstado();
  }

  function pantallaCompleta() {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (pantalla.requestFullscreen) pantalla.requestFullscreen().catch(() => {});
    else video.webkitEnterFullscreen?.();
  }

  function avisar(texto) {
    osd.aviso.textContent = texto;
    osd.aviso.classList.add('visible');
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(() => osd.aviso.classList.remove('visible'), 900);
  }

  const acciones = {
    alternar,
    play: () => hayVideo() && video.play().catch(() => {}),
    pausa: () => video.pause(),
    stop: detener,
    anterior: () => cargar(indice - 1, !video.paused),
    siguiente: () => cargar(indice + 1, !video.paused),
    silencio: alternarSonido,
    completa: pantallaCompleta,
    vhs: () => prefs.guardar({ vhs: !prefs.obtener().vhs }),
    crt: () => prefs.guardar({ crt: !prefs.obtener().crt }),
    lista: () => {
      const oculta = rep.classList.toggle('sin-lista');
      $('[data-accion="lista"]').setAttribute('aria-expanded', String(!oculta));
    },
    abrir: () => {
      const item = o.lista[indice];
      if (item.proyecto) o.navegar?.(`trabajos/${item.proyecto.id}`);
    },
  };

  video.addEventListener('play', () => rep.classList.add('iniciado'));

  rep.addEventListener('click', (e) => {
    const accion = e.target.closest('[data-accion]')?.dataset.accion;
    if (accion) acciones[accion]?.();
    const fila = e.target.closest('[data-indice]');
    if (fila) cargar(Number(fila.dataset.indice), true);
  });

  // Clic en la pantalla: si está en silencio, activa el sonido; si no, pausa o reproduce.
  // El clic que acaba de activar el sonido solo (ver reproducirConSonido) no pausa el video.
  let activadoEn = 0;
  const recienActivado = () => performance.now() - activadoEn < 600;
  pantalla.addEventListener('click', () => {
    if (!hayVideo() || recienActivado()) return;
    if (video.muted && !video.paused) alternarSonido();
    else alternar();
  });

  (o.teclas || pantalla).addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    const campo = e.target.matches('input, textarea, select');
    const boton = e.target.matches('button, a');
    const tecla = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (tecla === ' ' && !campo && !boton) alternar();
    else if (tecla === 'ArrowRight' && !campo) saltar(5);
    else if (tecla === 'ArrowLeft' && !campo) saltar(-5);
    else if (tecla === 'm' && !campo) recienActivado() || alternarSonido();
    else if (tecla === 'f' && !campo) pantallaCompleta();
    else return;
    e.preventDefault();
  });

  // ---------- Barra de avance y volumen ----------

  if (avance) {
    avance.addEventListener('pointerdown', () => (arrastrando = true));
    avance.addEventListener('pointerup', () => (arrastrando = false));
    avance.addEventListener('change', () => (arrastrando = false));
    avance.addEventListener('input', () => {
      if (!video.duration) return;
      video.currentTime = (avance.value / 1000) * video.duration;
      pintarTiempo();
    });
  }
  nivel?.addEventListener('input', () => {
    video.volume = nivel.value / 100;
    video.muted = video.volume === 0;
    pintarEstado();
  });

  // ---------- Pintado ----------

  function pintarTiempo() {
    const t = video.currentTime || 0;
    const total = video.duration || datosVideos[o.lista[indice].video]?.duracion || 0;
    osd.sp.textContent = hayVideo() ? `SP ${hmmss(t)}` : '';
    if (completo) $('.rep__lcd-tiempo').textContent = mmss(t);
    if (!conControles) return;
    $('.rep__tiempo').textContent = `${mmss(t)} / ${mmss(total)}`;
    if (!arrastrando) {
      const fraccion = total ? t / total : 0;
      avance.value = Math.round(fraccion * 1000);
      avance.setAttribute('aria-valuetext', `${mmss(t)} de ${mmss(total)}`);
    }
    avance.style.setProperty('--progreso', `${(avance.value / 10).toFixed(1)}%`);
  }

  function pintarEstado() {
    const sonando = !video.paused && !video.ended;
    if (sonando) rep.classList.remove('detenido');
    rep.classList.toggle('sonando', sonando);
    const detenido = rep.classList.contains('detenido') || (!sonando && !video.currentTime);
    osd.estado.textContent = !hayVideo() ? 'STOP ■' : sonando ? 'PLAY ►' : detenido ? 'STOP ■' : 'PAUSA ❚❚';
    if (!conControles) return;

    const pulsado = (accion, valor) => $(`.rep__controles [data-accion="${accion}"]`).setAttribute('aria-pressed', String(valor));
    pulsado('play', sonando);
    pulsado('pausa', !sonando && !detenido && hayVideo());
    pulsado('vhs', prefs.obtener().vhs);
    pulsado('crt', prefs.obtener().crt);
    raiz.querySelectorAll('.rep__controles button, .rep__avance, .rep__nivel').forEach((c) => {
      if (!['vhs', 'crt', 'anterior', 'siguiente'].includes(c.dataset.accion)) c.disabled = !hayVideo();
    });

    const silencio = $('[data-accion="silencio"]');
    silencio.innerHTML = glifo(video.muted ? 'silencio' : 'volumen');
    silencio.setAttribute('aria-label', video.muted ? 'Activar sonido (M)' : 'Silenciar (M)');
    nivel.value = video.muted ? 0 : Math.round(video.volume * 100);
    if (!completo) return;

    const estado = !hayVideo() ? 'Sin video' : sonando ? 'Reproduciendo' : detenido ? 'Detenido' : 'En pausa';
    $('.rep__estado').innerHTML = `<span>${estado}</span><span>Bucle: ${video.loop ? 'activado' : 'apagado'}</span><span>Sonido: ${video.muted ? 'apagado (clic en el video para activarlo)' : 'encendido'}</span>`;
  }

  function pintarLista() {
    if (!completo) return;
    $('.rep__lateral-titulo').textContent = `Lista de reproducción · ${o.lista.length} videos`;
    $('.rep__lista').innerHTML = o.lista
      .map((item, i) => {
        const info = datosVideos[item.video];
        const duracion = info ? mmss(Math.round(info.duracion)) : '--:--';
        const actual = i === indice ? ' aria-current="true"' : '';
        return `<li><button type="button" class="rep__fila" data-indice="${i}"${actual}>
          <span class="rep__miniatura" style="--color:${item.color}">${info ? `<img src="${rutaVideo(item.video, '-portada.webp')}" alt="" loading="lazy">` : ''}</span>
          <span class="rep__fila-nombre">${String(i + 1).padStart(2, '0')} · ${item.archivo}</span>
          <span class="rep__fila-duracion">[${duracion}]</span>
        </button></li>`;
      })
      .join('');
  }

  function pintarInfo(item, info) {
    if (!completo) return;
    const filas = info
      ? [
          ['Formato', 'MP4 (H.264) + WebM'],
          ['Resolución', `${info.ancho} × ${info.alto}`],
          ['Peso', `${mb(info.bytes)} · carga progresiva`],
          ['Portada', 'primer fotograma (WebP)'],
        ]
      : [['Estado', 'Video pendiente de codificar']];
    $('.rep__info dl').innerHTML = filas.map(([k, v]) => `<div><dt>${k}:</dt> <dd>${v}</dd></div>`).join('');
    const abrir = $('.rep__abrir');
    abrir.hidden = !item.proyecto;
  }

  ['play', 'pause', 'ended', 'loadedmetadata'].forEach((ev) => video.addEventListener(ev, pintarEstado));
  ['timeupdate', 'durationchange', 'seeked'].forEach((ev) => video.addEventListener(ev, pintarTiempo));
  video.addEventListener('waiting', () => (osd.estado.textContent = 'BUSCANDO…'));
  video.addEventListener('playing', pintarEstado);
  video.addEventListener('volumechange', pintarEstado);
  videos.add(video);
  video.addEventListener('play', () => videos.forEach((otro) => otro !== video && !otro.paused && otro.pause()));
  const dejar = prefs.suscribir(pintarEstado);

  cargar(indice, o.autoplay && !reducido());

  return {
    video,
    cargar,
    destruir() {
      dejar();
      videos.delete(video);
      video.pause();
      video.removeAttribute('src');
      video.replaceChildren();
      video.load();
    },
  };
}
