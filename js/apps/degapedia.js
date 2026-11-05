// Cómo trabajo: "DEGApedia, la enciclopedia del VJ", una enciclopedia de los 2000 (original)
// dentro de una ventana de navegador. Vistas: Artículo, Discusión, Editar y Ver historial.
import { glifo } from '../ui/pixel.js';
import { t, marcador } from '../ui/html.js';

const PASOS = /\b(escucho|propongo|adapto|opero)\b/g;

let n = 0;

export function crear(cuerpo, { datos, navegar, ventana, wm, cargarFuentes }) {
  cargarFuentes('family=Arimo:wght@400;700&family=Libertinus+Serif:ital,wght@0,400;0,600;1,400');
  const id = `wiki-${++n}`;
  const w = datos.sitio.degapedia;
  const ancla = (s) => `${id}-${s}`;

  // Introducción: "Dega" y "Pablo Gaitán" en negrita, los cuatro pasos enlazan a su sección y cada párrafo lleva su referencia.
  const intro = w.introduccion
    .map((p, i) => {
      let html = t(p)
        .replace('Dega', '<b>Dega</b>')
        .replace('Pablo Gaitán', '<b>Pablo Gaitán</b>')
        .replace(PASOS, (paso) => `<a href="#/como-trabajo" data-ancla="${paso}">${paso}</a>`);
      if (w.referencias[i]) html += `<sup><a href="#/como-trabajo" data-ancla="referencias">[${i + 1}]</a></sup>`;
      return `<p>${html}</p>`;
    })
    .join('');

  const filasFicha = w.ficha
    .map(({ campo, valor }) => {
      let v = t(valor);
      if (campo === 'Herramientas') v = `<a href="#/software">${v}</a>`;
      if (campo === 'Formación') v = v.split('; ').join('<br>') + '<br><a href="#/titulos">Ver títulos</a>';
      return `<tr><th scope="row">${t(campo)}</th><td>${v}</td></tr>`;
    })
    .join('');

  const indice = [
    ...w.secciones.map((s, i) => `<li><a href="#/como-trabajo" data-ancla="${s.id}"><span>${i + 1}</span> ${t(s.titulo)}</a>
      ${s.fichaTecnica ? `<ol><li><a href="#/como-trabajo" data-ancla="ficha-tecnica"><span>${i + 1}.1</span> Ficha técnica</a></li></ol>` : ''}</li>`),
    `<li><a href="#/como-trabajo" data-ancla="referencias"><span>${w.secciones.length + 1}</span> Referencias</a></li>`,
  ].join('');

  const seccion = (s, i) => `
    <section class="wiki__seccion" id="${ancla(s.id)}" aria-labelledby="${ancla(s.id)}-h">
      <h3 id="${ancla(s.id)}-h">${i + 1}. ${t(s.titulo)}</h3>
      ${s.veaseTambien ? `<p class="wiki__vease">Véase también: <a href="#/${s.veaseTambien.ruta}">${t(s.veaseTambien.texto)}</a></p>` : ''}
      ${s.paleta ? `<figure class="wiki__figura"><div class="wiki__paleta">${s.paleta.map((c) => `<span style="background:${c}"></span>`).join('')}</div><figcaption>${t(s.piePaleta)}</figcaption></figure>` : ''}
      ${s.id === 'opero' ? `<figure class="wiki__figura">${s.foto ? `<img src="${t(s.foto)}" alt="${t(s.pie)}" loading="lazy">` : marcador('[ FOTO DEL SHOW ]', 'marcador--azul')}<figcaption>${t(s.pie)}</figcaption></figure>` : ''}
      <p>${t(s.texto)}</p>
      ${s.fichaTecnica ? `
        <h4 id="${ancla('ficha-tecnica')}">${i + 1}.1 Ficha técnica</h4>
        <table class="wiki__tabla">
          ${s.fichaTecnica.map(({ campo, valor }) => `<tr><th scope="row">${t(campo)}</th><td>${campo === 'Software' ? `<a href="#/software">${t(valor)}</a>` : t(valor)}</td></tr>`).join('')}
        </table>` : ''}
      ${s.boton ? `<p><button type="button" class="wiki__demo" data-accion="demo">${t(s.boton)}</button></p>` : ''}
    </section>`;

  cuerpo.innerHTML = `
    <div class="navegador">
      <div class="explorador__barra" role="toolbar" aria-label="Navegador">
        <button type="button" class="herr" data-accion="atras">${glifo('atras')}<span>Atrás</span></button>
        <button type="button" class="herr" data-accion="adelante">${glifo('adelante')}<span>Adelante</span></button>
        <button type="button" class="herr" data-accion="actualizar">${glifo('arriba')}<span>Inicio</span></button>
      </div>
      <div class="explorador__direccion">
        <span class="explorador__etiqueta" id="${id}-dir">Dirección</span>
        <output class="campo explorador__ruta" aria-labelledby="${id}-dir"></output>
      </div>

      <div class="navegador__pagina" tabindex="-1">
        <div class="wiki">
          <aside class="wiki__lateral">
            <a class="wiki__logo" href="#/como-trabajo" data-ancla="arriba" aria-label="DEGApedia, ir al inicio del artículo">
              <span class="wiki__esfera" aria-hidden="true">D</span>
              <span class="wiki__nombre">DEGA<span>pedia</span></span>
              <span class="wiki__lema">La enciclopedia del VJ</span>
            </a>
            <nav class="wiki__menu" aria-labelledby="${id}-nav">
              <h3 id="${id}-nav">Navegación</h3>
              <ul>
                <li><a href="#/como-trabajo" data-ancla="arriba">Portada</a></li>
                ${datos.sitio.secciones
                  .filter((s) => !['como-trabajo', 'pantalla'].includes(s.id))
                  .map((s) => `<li><a href="#/${s.id}">${t(s.menu)}</a></li>`)
                  .join('')}
              </ul>
            </nav>
            <nav class="wiki__menu" aria-labelledby="${id}-herr">
              <h3 id="${id}-herr">Herramientas</h3>
              <ul>
                <li><button type="button" class="wiki__enlace" data-accion="permanente">Enlace permanente</button></li>
                <li><a href="simple.html">Versión simple</a></li>
              </ul>
            </nav>
            <form class="wiki__buscar" role="search">
              <label for="${id}-q">Buscar</label>
              <input type="search" class="campo" id="${id}-q" placeholder="Buscar en DEGApedia">
              <button type="submit" class="btn">Buscar</button>
            </form>
          </aside>

          <article class="wiki__contenido" aria-labelledby="${id}-titulo">
            <div class="wiki__pestanas">
              <div class="wiki__grupo" role="group" aria-label="Espacio de nombres">
                <button type="button" class="wiki__pestana" data-vista="articulo">Artículo</button>
                <button type="button" class="wiki__pestana" data-vista="discusion">Discusión</button>
              </div>
              <div class="wiki__grupo" role="group" aria-label="Vistas">
                <button type="button" class="wiki__pestana" data-vista="articulo" data-leer>Leer</button>
                <button type="button" class="wiki__pestana" data-vista="editar">Editar</button>
                <button type="button" class="wiki__pestana" data-vista="historial">Ver historial</button>
              </div>
            </div>

            <div class="wiki__vista" data-panel="articulo">
              ${w.aviso ? `<p class="wiki__aviso"><span class="wiki__alerta" aria-hidden="true">!</span><span><b>${t(w.aviso.split('.')[0])}.</b> ${t(w.aviso.split('. ').slice(1).join('. '))}</span></p>` : ''}
              <h2 class="wiki__titulo" id="${id}-titulo">${t(w.titulo)}</h2>
              <p class="wiki__de">${t(w.subtitulo)}</p>

              <table class="wiki__ficha">
                <caption>Dega</caption>
                <tr><td colspan="2" class="wiki__ficha-foto">
                  ${w.foto ? `<img src="${t(w.foto)}" alt="${t(w.pieFoto)}" loading="lazy">` : marcador('[ FOTO TUYA EN CABINA ]')}
                  <span>${t(w.pieFoto)}</span>
                </td></tr>
                ${filasFicha}
              </table>

              ${intro}

              <nav class="wiki__indice" aria-labelledby="${id}-indice">
                <p class="wiki__indice-titulo"><b id="${id}-indice">Contenido</b> [<button type="button" class="wiki__enlace" data-accion="indice" aria-expanded="true">ocultar</button>]</p>
                <ol>${indice}</ol>
              </nav>

              ${w.secciones.map(seccion).join('')}

              <section class="wiki__seccion" id="${ancla('referencias')}" aria-labelledby="${ancla('referencias')}-h">
                <h3 id="${ancla('referencias')}-h">Referencias</h3>
                <ol class="wiki__refs">
                  ${w.referencias.map((r) => `<li><a href="#/${r.ruta}">«${t(r.titulo)}»</a>. ${t(r.fuente)}.</li>`).join('')}
                </ol>
              </section>
              <p class="wiki__categorias">Categorías: ${w.categorias.map((c) => `<span>${t(c)}</span>`).join(' | ')}</p>
            </div>

            <div class="wiki__vista" data-panel="discusion" hidden>
              <h2 class="wiki__titulo">Discusión: ${t(w.titulo)}</h2>
              <p class="wiki__de">${t(w.subtitulo)}</p>
              <p>¿Tienes una pregunta sobre cómo trabajo o quieres hablar de tu show? Esta discusión sigue por correo.</p>
              <p><a href="#/contacto">Escríbeme para tu fecha</a></p>
            </div>

            <div class="wiki__vista" data-panel="editar" hidden>
              <h2 class="wiki__titulo">Editar: ${t(w.titulo)}</h2>
              <p class="wiki__aviso"><span class="wiki__alerta" aria-hidden="true">!</span><span>Esta página está protegida: solo Dega puede editarla.</span></p>
              <p>¿Viste algo que falta o que se puede mejorar? <a href="#/contacto">Cuéntamelo</a>.</p>
            </div>

            <div class="wiki__vista" data-panel="historial" hidden>
              <h2 class="wiki__titulo">Historial: ${t(w.titulo)}</h2>
              <p class="wiki__de">Las ediciones más importantes de esta carrera.</p>
              <ul class="wiki__historial">
                ${[...w.historial].reverse().map((h) => `<li><span class="wiki__fecha">${t(h.fecha)}</span> · ${t(h.texto)}</li>`).join('')}
              </ul>
            </div>
          </article>
        </div>
        <footer class="wiki__pie">
          <span>Esta página se editó por última vez el ${t(w.ultimaEdicion)}.</span>
          <a href="#/sobre-mi">Acerca de DEGApedia</a>
          <a href="#/contacto">Contacto</a>
          <button type="button" class="wiki__enlace" data-accion="escritorio">Volver al escritorio</button>
        </footer>
      </div>
      <p class="explorador__estado" role="status"><span data-estado>Listo</span></p>
    </div>`;

  const $ = (sel) => cuerpo.querySelector(sel);
  const pagina = $('.navegador__pagina');
  const estado = $('[data-estado]');

  // ---------- Historial interno (vistas y anclas) ----------

  let historial = [{ vista: 'articulo', ancla: null }];
  let posicion = 0;

  function mostrar({ vista, ancla: destino }, guardar = true) {
    cuerpo.querySelectorAll('[data-panel]').forEach((p) => (p.hidden = p.dataset.panel !== vista));
    cuerpo.querySelectorAll('.wiki__pestana').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.vista === vista)));
    $('.explorador__ruta').textContent = `${w.direccion}${vista !== 'articulo' ? `?accion=${vista}` : ''}${destino && destino !== 'arriba' ? `#${destino}` : ''}`;
    if (guardar) {
      historial = historial.slice(0, posicion + 1);
      historial.push({ vista, ancla: destino });
      posicion = historial.length - 1;
    }
    $('[data-accion="atras"]').disabled = posicion === 0;
    $('[data-accion="adelante"]').disabled = posicion === historial.length - 1;
    const objetivo = destino && destino !== 'arriba' ? cuerpo.querySelector(`#${ancla(destino)}`) : null;
    if (objetivo) {
      // Se desplaza solo la página del navegador: scrollIntoView también movería el escritorio.
      pagina.scrollTop += objetivo.getBoundingClientRect().top - pagina.getBoundingClientRect().top - 8;
      // El título de la sección recibe el foco, para que el teclado siga desde ahí.
      const titulo = objetivo.matches('h3, h4') ? objetivo : objetivo.querySelector('h3');
      titulo.tabIndex = -1;
      titulo.focus({ preventScroll: true });
    } else {
      pagina.scrollTop = 0;
    }
  }

  // ---------- Eventos ----------

  cuerpo.addEventListener('click', async (e) => {
    const enlace = e.target.closest('[data-ancla]');
    if (enlace) {
      e.preventDefault();
      mostrar({ vista: 'articulo', ancla: enlace.dataset.ancla });
      return;
    }
    const pestana = e.target.closest('[data-vista]');
    if (pestana) mostrar({ vista: pestana.dataset.vista, ancla: null });

    const accion = e.target.closest('[data-accion]')?.dataset.accion;
    if (accion === 'atras' && posicion > 0) mostrar(historial[--posicion], false);
    if (accion === 'adelante' && posicion < historial.length - 1) mostrar(historial[++posicion], false);
    if (accion === 'actualizar') mostrar({ vista: 'articulo', ancla: null });
    if (accion === 'demo') navegar('contacto', { demo: true });
    if (accion === 'escritorio') wm.cerrar(ventana.id);
    if (accion === 'indice') {
      const boton = e.target.closest('button');
      const lista = $('.wiki__indice ol');
      lista.hidden = !lista.hidden;
      boton.textContent = lista.hidden ? 'mostrar' : 'ocultar';
      boton.setAttribute('aria-expanded', String(!lista.hidden));
    }
    if (accion === 'permanente') {
      const url = `${location.origin}${location.pathname}#/como-trabajo`;
      try {
        await navigator.clipboard.writeText(url);
        estado.textContent = 'Enlace copiado al portapapeles.';
      } catch {
        estado.textContent = `Enlace: ${url}`;
      }
    }
  });

  // Buscar: salta a la primera sección del artículo que contiene el texto.
  $('.wiki__buscar').addEventListener('submit', (e) => {
    e.preventDefault();
    const q = $('.wiki__buscar input').value.trim().toLowerCase();
    if (!q) return;
    const secciones = [...cuerpo.querySelectorAll('[data-panel="articulo"] .wiki__seccion')];
    const hallada = secciones.find((s) => s.textContent.toLowerCase().includes(q));
    if (hallada) {
      mostrar({ vista: 'articulo', ancla: hallada.id.replace(`${id}-`, '') });
      estado.textContent = `Resultado para «${q}»: ${hallada.querySelector('h3').textContent}.`;
    } else {
      estado.textContent = `No hay resultados para «${q}» en este artículo.`;
    }
  });

  mostrar(historial[0], false);
}
