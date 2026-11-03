// Ventana de proyecto: cabecera, pestañas (Video, Proceso, Fotos, Créditos),
// LÉAME.TXT con la ficha y pie para pasar al proyecto anterior o siguiente.
import { cargarManifiesto, crearReproductor, listaDeVideos, rutaVideo, mb } from '../ui/reproductor.js';
import { conectarPestanas } from '../ui/pestanas.js';
import { glifo } from '../ui/pixel.js';
import { t } from '../ui/html.js';

const PESTANAS = ['Video', 'Proceso', 'Fotos', 'Créditos'];
const COLORES_TIRA = ['#0000E8', '#14141B', '#E30613', '#FFE500', '#1d1d26', '#2A1250'];

let n = 0;

export async function crear(cuerpo, { datos, navegar, ventana, params, wm, reemplazarVentana }) {
  const id = `proyecto-${++n}`;
  const p = params.proyecto;
  const todos = datos.proyectos.proyectos;
  const i = todos.indexOf(p);
  const anterior = todos[(i - 1 + todos.length) % todos.length];
  const siguiente = todos[(i + 1) % todos.length];
  const manifiesto = await cargarManifiesto();
  const info = manifiesto[p.video];
  const pasos = datos.sitio.degapedia.secciones.slice(0, 4);

  const herramientas = p.herramientas.length
    ? p.herramientas.join(' · ') + (p.herramientasConfirmadas === false ? ' (por confirmar)' : '')
    : '[herramientas]';
  const ideaCorta = p.idea.split(/\.\s/)[0].replace(/\.$/, '');

  const fichas = [
    ['Proyecto', p.titulo],
    ['Artista', p.artista],
    ['Fecha', p.fecha],
    ['Reconocimiento', p.reconocimiento],
    ['Mi rol', p.rol],
    ['Herramientas', herramientas],
    ['Operación', p.operacion],
    ['Pantalla', p.pantalla],
  ].filter(([, valor]) => valor != null); // los campos en null no aplican a ese proyecto (por ejemplo, Pantalla en un videoclip)

  const tira = info?.fotogramas
    ? Array.from({ length: info.fotogramas }, (_, k) => `
        <li><button type="button" class="tira__cuadro" data-fotograma="${k}" aria-label="Ir al fotograma ${k + 1}">
          <img src="${rutaVideo(p.video, `-f${k + 1}.webp`)}" alt="" loading="lazy"><span>${String(k + 1).padStart(2, '0')}</span>
        </button></li>`).join('')
    : COLORES_TIRA.map((c, k) => `<li><span class="tira__cuadro tira__cuadro--vacio" style="--color:${c}"><span>${String(k + 1).padStart(2, '0')}</span></span></li>`).join('');

  cuerpo.innerHTML = `
    <div class="proyecto">
      <div class="proyecto__arriba">
        <div class="pestanas" role="tablist" aria-label="Secciones del proyecto">
          ${PESTANAS.map((nombre, k) => `<button type="button" class="pestana" role="tab" id="${id}-t${k}" aria-controls="${id}-p${k}" aria-selected="${k === 0}">${nombre}</button>`).join('')}
        </div>
        <button type="button" class="btn proyecto__volver" data-accion="volver">${glifo('atras')} Volver a Trabajos</button>
      </div>

      <div class="proyecto__cuerpo">
        <div class="proyecto__principal">
          <header class="proyecto__cabecera">
            <p class="proyecto__tipo">${t(p.tipo)}</p>
            <h2 class="proyecto__titulo">${t(p.titulo)}</h2>
            <p class="proyecto__meta">${[p.artista, p.fecha, ideaCorta].map(t).join(' · ')}</p>
            ${p.reconocimiento ? `<p class="proyecto__premio">★ ${t(p.reconocimiento)}</p>` : ''}
          </header>

          <div class="proyecto__panel" role="tabpanel" id="${id}-p0" aria-labelledby="${id}-t0">
            <div class="proyecto__video"></div>
            <h3 class="proyecto__subtitulo">Fotogramas</h3>
            <ul class="tira">${tira}</ul>
            ${info?.fotogramas ? '' : '<p class="sr-only">Los fotogramas de este proyecto están pendientes.</p>'}
          </div>

          <div class="proyecto__panel proyecto__panel--claro" role="tabpanel" id="${id}-p1" aria-labelledby="${id}-t1" hidden>
            <ol class="pasos">
              ${pasos.map((s, k) => `<li><span class="pasos__num">${String(k + 1).padStart(2, '0')}</span><div><h3>${t(s.titulo)}</h3><p>${t(s.texto)}</p></div></li>`).join('')}
            </ol>
            <p><a href="#/como-trabajo">Ver cómo trabajo en DEGApedia</a></p>
          </div>

          <div class="proyecto__panel proyecto__panel--claro" role="tabpanel" id="${id}-p2" aria-labelledby="${id}-t2" hidden>
            ${p.fotos.length
              ? `<ul class="fotos">${p.fotos.map((f) => `<li><img src="${t(f.src)}" alt="${t(f.alt)}" loading="lazy"></li>`).join('')}</ul>`
              : '<p class="proyecto__vacio">Todavía no hay fotos de este proyecto.</p>'}
          </div>

          <div class="proyecto__panel proyecto__panel--claro" role="tabpanel" id="${id}-p3" aria-labelledby="${id}-t3" hidden>
            ${p.creditos.length
              ? `<dl class="creditos">${p.creditos.map((c) => `<div><dt>${t(c.rol)}</dt><dd>${t(c.nombre)}</dd></div>`).join('')}</dl>`
              : '<p class="proyecto__vacio">[créditos]</p>'}
          </div>
        </div>

        <aside class="leeme" aria-labelledby="${id}-leeme">
          <h3 class="leeme__titulo" id="${id}-leeme">LÉAME.TXT — Bloc de notas</h3>
          <div class="leeme__texto">
            <dl class="leeme__ficha">
              ${fichas.map(([k, v]) => `<div><dt>${k.toUpperCase()}</dt><dd>${t(v)}</dd></div>`).join('')}
            </dl>
            <h4>== LA IDEA ==</h4>
            <p>${t(p.idea)}</p>
            <h4>== EL PROCESO ==</h4>
            <ol class="leeme__pasos">${pasos.map((s, k) => `<li>${String(k + 1).padStart(2, '0')} ${t(s.titulo)}</li>`).join('')}</ol>
            <p><a href="#/como-trabajo">Ver cómo trabajo en DEGApedia</a></p>
            ${p.frase == null ? '' : `<h4>== LO QUE DIJO LA BANDA ==</h4>
            <p>«${t(p.frase)}»</p>`}
          </div>
        </aside>
      </div>

      <footer class="proyecto__pie">
        <button type="button" class="btn" data-ir="${anterior.id}">${glifo('atras')} Anterior: ${t(anterior.archivo)}</button>
        <p class="proyecto__peso">${info ? `Video alojado en servidor propio · MP4 ${info.alto}p · ${mb(info.bytes)}` : 'Video pendiente de codificar'}</p>
        <button type="button" class="btn" data-ir="${siguiente.id}">Siguiente: ${t(siguiente.archivo)} ${glifo('adelante')}</button>
      </footer>
    </div>`;

  const item = listaDeVideos(datos).find((v) => v.id === p.id);
  const reproductor = await crearReproductor(cuerpo.querySelector('.proyecto__video'), {
    lista: [item],
    modo: 'proyecto',
    bucle: false,
    teclas: cuerpo.querySelector(`#${id}-p0`),
  });
  ventana.alCerrar.push(reproductor.destruir);

  conectarPestanas(cuerpo.querySelector('[role="tablist"]'), {
    // Al salir de la pestaña Video, el video se pausa.
    alCambiar: (pestana) => pestana.id !== `${id}-t0` && reproductor.video.pause(),
  });

  cuerpo.addEventListener('click', (e) => {
    const fotograma = e.target.closest('[data-fotograma]');
    if (fotograma && info) {
      const k = Number(fotograma.dataset.fotograma);
      reproductor.video.currentTime = (info.duracion * (k + 0.5)) / info.fotogramas;
    }
    const destino = e.target.closest('[data-ir]')?.dataset.ir;
    if (destino) reemplazarVentana(ventana, `trabajos/${destino}`);
    if (e.target.closest('[data-accion="volver"]')) {
      wm.cerrar(ventana.id);
      navegar('trabajos');
    }
  });
}
