// Trabajos: explorador de archivos con filtros por tipo, búsqueda, dos vistas
// y vista previa en video al pasar el mouse. Clic en un proyecto abre #/trabajos/<id>.
import { cargarManifiesto, listaDeVideos, rutaVideo } from '../ui/reproductor.js';
import { icono, glifo } from '../ui/pixel.js';

const TODO = 'Todo';
const reducido = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const conMouse = () => window.matchMedia('(hover: hover)').matches;

let n = 0;

export async function crear(cuerpo, { datos, ventana, params }) {
  const id = `trabajos-${++n}`;
  const manifiesto = await cargarManifiesto();
  const { filtros, proyectos, descripcion } = datos.proyectos;
  const colores = Object.fromEntries(listaDeVideos(datos).map((v) => [v.id, v.color]));

  // Estado navegable con Atrás y Adelante, como un explorador.
  let estado = { filtro: TODO, herramienta: null, busqueda: '' };
  const historial = [estado];
  let posicion = 0;
  let vista = 'miniaturas';

  cuerpo.innerHTML = `
    <div class="explorador">
      <div class="explorador__barra" role="toolbar" aria-label="Navegación de Trabajos">
        <button type="button" class="herr" data-accion="atras">${glifo('atras')}<span>Atrás</span></button>
        <button type="button" class="herr" data-accion="adelante">${glifo('adelante')}<span>Adelante</span></button>
        <button type="button" class="herr" data-accion="arriba" title="Ver todos los trabajos">${glifo('arriba')}<span>Arriba</span></button>
        <span class="herr__separador" aria-hidden="true"></span>
        <button type="button" class="herr" data-accion="buscar" aria-expanded="false" aria-controls="${id}-busqueda">${glifo('lupa')}<span>Buscar</span></button>
        <button type="button" class="herr" data-accion="vista">${glifo('vistas')}<span class="herr__vista">Vistas: Miniaturas</span></button>
      </div>
      <div class="explorador__direccion">
        <span class="explorador__etiqueta" id="${id}-dir">Dirección</span>
        <output class="campo explorador__ruta" aria-labelledby="${id}-dir"></output>
      </div>
      <div class="explorador__busqueda" id="${id}-busqueda" hidden>
        <label for="${id}-q">Buscar en Trabajos</label>
        <input type="search" class="campo" id="${id}-q" placeholder="Nombre, artista o tipo">
      </div>
      <div class="explorador__cuerpo">
        <aside class="explorador__panel">
          <span class="explorador__carpeta">${icono('carpeta')}</span>
          <h3 class="explorador__titulo marca">Trabajos</h3>
          <p class="explorador__descripcion"></p>
          <h4 class="explorador__subtitulo" id="${id}-tipos">Ver por tipo</h4>
          <ul class="filtros" aria-labelledby="${id}-tipos"></ul>
          <section class="detalles" aria-live="polite">
            <h4 class="explorador__subtitulo">Detalles</h4>
            <div class="detalles__cuerpo"></div>
          </section>
        </aside>
        <div class="explorador__contenido">
          <p class="explorador__cabeza-movil"><span class="marca">Trabajos</span><span class="explorador__contador"></span></p>
          <ul class="cuadricula" aria-label="Proyectos"></ul>
        </div>
      </div>
      <p class="explorador__estado" role="status"></p>
    </div>`;

  const $ = (sel) => cuerpo.querySelector(sel);
  $('.explorador__descripcion').textContent = descripcion;

  const cuenta = (f) => (f === TODO ? proyectos.length : proyectos.filter((p) => p.filtro === f).length);

  function visibles() {
    const q = estado.busqueda.trim().toLowerCase();
    return proyectos.filter(
      (p) =>
        (estado.filtro === TODO || p.filtro === estado.filtro) &&
        (!estado.herramienta || p.herramientas.includes(estado.herramienta)) &&
        (!q || [p.archivo, p.titulo, p.artista, p.tipo].join(' ').toLowerCase().includes(q)),
    );
  }

  function pintar() {
    const lista = visibles();

    // Una categoría sin proyectos no se muestra (vuelve a aparecer cuando algún proyecto la use).
    $('.filtros').innerHTML = [TODO, ...filtros.filter((f) => cuenta(f) > 0)]
      .map((f) => `<li><button type="button" class="filtro" data-filtro="${f}" aria-pressed="${f === estado.filtro}">
          <span>${f}</span><span class="filtro__cuenta">${cuenta(f)}</span></button></li>`)
      .join('');

    $('.cuadricula').classList.toggle('cuadricula--lista', vista === 'lista');
    $('.cuadricula').innerHTML = lista.length
      ? lista.map(miniatura).join('')
      : '<li class="cuadricula__vacia">No hay trabajos con este filtro.</li>';

    const partes = [estado.filtro !== TODO && estado.filtro, estado.herramienta].filter(Boolean);
    $('.explorador__ruta').textContent = ['C:\\DEGA\\Trabajos', ...partes].join('\\');
    $('.explorador__contador').textContent = `${lista.length} OBJETOS`;
    $('.explorador__estado').innerHTML = [
      `<span>${lista.length} ${lista.length === 1 ? 'objeto' : 'objetos'}</span>`,
      `<span>Filtro: ${estado.filtro}</span>`,
      estado.herramienta && `<span>Programa: ${estado.herramienta}</span>`,
      estado.busqueda && `<span>Búsqueda: «${estado.busqueda.replace(/[<>&]/g, '')}»</span>`,
    ]
      .filter(Boolean)
      .join('');

    $('[data-accion="atras"]').disabled = posicion === 0;
    $('[data-accion="adelante"]').disabled = posicion === historial.length - 1;
    $('[data-accion="arriba"]').disabled = estado.filtro === TODO && !estado.herramienta && !estado.busqueda;
    $('.herr__vista').textContent = `Vistas: ${vista === 'lista' ? 'Lista' : 'Miniaturas'}`;
    mostrarDetalles(lista[0]);
  }

  function miniatura(p) {
    const info = manifiesto[p.video];
    const etiqueta = p.carpeta ? '[ CARPETA ]' : '[ FRAME ]';
    return `<li>
      <a class="archivo" href="#/trabajos/${p.id}" data-id="${p.id}">
        <span class="archivo__miniatura" style="--color:${colores[p.id]}">
          ${info ? `<img src="${rutaVideo(p.video, '-portada.webp')}" alt="" loading="lazy" decoding="async">` : ''}
          ${info ? '' : `<span class="archivo__etiqueta" aria-hidden="true">${etiqueta}</span>`}
        </span>
        <span class="archivo__texto">
          <span class="archivo__nombre">${p.archivo}</span>
          <span class="archivo__tipo">${p.tipo}</span>
        </span>
      </a>
    </li>`;
  }

  function mostrarDetalles(p) {
    const caja = $('.detalles__cuerpo');
    if (!p) {
      caja.innerHTML = '';
      return;
    }
    caja.innerHTML = `
      <p class="detalles__archivo"></p>
      <p data-campo="artista"></p>
      <p data-campo="tipo"></p>
      <p data-campo="fecha"></p>
      <p data-campo="rol"></p>`;
    caja.querySelector('.detalles__archivo').textContent = p.archivo;
    caja.querySelector('[data-campo="artista"]').textContent = p.artista;
    caja.querySelector('[data-campo="tipo"]').textContent = p.tipo;
    caja.querySelector('[data-campo="fecha"]').textContent = `Fecha: ${p.fecha}`;
    caja.querySelector('[data-campo="rol"]').textContent = `Rol: ${p.rol}`;
  }

  function ir(cambios) {
    estado = { ...estado, ...cambios };
    historial.splice(posicion + 1, historial.length, estado);
    posicion = historial.length - 1;
    pintar();
  }

  // ---------- Eventos ----------

  $('.explorador__barra').addEventListener('click', (e) => {
    const accion = e.target.closest('[data-accion]')?.dataset.accion;
    if (accion === 'atras' && posicion > 0) {
      estado = historial[--posicion];
      $('input[type="search"]').value = estado.busqueda;
      pintar();
    }
    if (accion === 'adelante' && posicion < historial.length - 1) {
      estado = historial[++posicion];
      $('input[type="search"]').value = estado.busqueda;
      pintar();
    }
    if (accion === 'arriba') {
      $('input[type="search"]').value = '';
      ir({ filtro: TODO, herramienta: null, busqueda: '' });
    }
    if (accion === 'buscar') {
      const caja = $('.explorador__busqueda');
      caja.hidden = !caja.hidden;
      e.target.closest('button').setAttribute('aria-expanded', String(!caja.hidden));
      if (!caja.hidden) caja.querySelector('input').focus();
    }
    if (accion === 'vista') {
      vista = vista === 'lista' ? 'miniaturas' : 'lista';
      pintar();
    }
  });

  $('.filtros').addEventListener('click', (e) => {
    const boton = e.target.closest('[data-filtro]');
    if (boton && boton.dataset.filtro !== estado.filtro) ir({ filtro: boton.dataset.filtro });
  });

  // La búsqueda filtra mientras se escribe, sin llenar el historial con cada letra.
  $('input[type="search"]').addEventListener('input', (e) => {
    estado = { ...estado, busqueda: e.target.value };
    historial[posicion] = estado;
    pintar();
  });

  const cuadricula = $('.cuadricula');
  const proyecto = (el) => proyectos.find((p) => p.id === el?.closest('.archivo')?.dataset.id);

  cuadricula.addEventListener('focusin', (e) => mostrarDetalles(proyecto(e.target)));
  cuadricula.addEventListener('pointerover', (e) => {
    const p = proyecto(e.target);
    if (!p) return;
    mostrarDetalles(p);
    previa(e.target.closest('.archivo'), p);
  });
  cuadricula.addEventListener('pointerout', (e) => {
    const archivo = e.target.closest('.archivo');
    if (archivo && !archivo.contains(e.relatedTarget)) archivo.querySelector('video')?.pause();
  });

  /** Loop de 4 s sin sonido sobre la miniatura; se crea la primera vez que el mouse pasa por encima. */
  function previa(archivo, p) {
    if (!manifiesto[p.video] || reducido() || !conMouse()) return;
    let video = archivo.querySelector('video');
    if (!video) {
      video = document.createElement('video');
      Object.assign(video, { muted: true, loop: true, playsInline: true, preload: 'none' });
      video.src = rutaVideo(p.video, '-loop.mp4');
      video.setAttribute('aria-hidden', 'true');
      archivo.querySelector('.archivo__miniatura').append(video);
    }
    video.play().catch(() => {});
  }

  // Otras ventanas (por ejemplo Software) pueden pedir un filtro por programa.
  ventana.alRecibir = ({ herramienta }) => {
    $('input[type="search"]').value = '';
    ir({ filtro: TODO, herramienta: herramienta || null, busqueda: '' });
  };

  if (params.herramienta) estado = historial[0] = { ...estado, herramienta: params.herramienta };
  pintar();
}
