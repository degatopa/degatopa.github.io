// Sobre mí: "Propiedades del sistema" (pestañas General, Historial, Hardware y Perfiles de usuario)
// y, a su lado, el "Administrador de dispositivos" con premios, estudios, colectivos y shows.
// En móvil el árbol va dentro de la misma ventana.
import { conectarPestanas } from '../ui/pestanas.js';
import { crearArbol } from '../ui/arbol.js';
import { t, marcador } from '../ui/html.js';

const PESTANAS = ['General', 'Historial', 'Hardware', 'Perfiles de usuario'];
const ID_DISPOSITIVOS = 'dispositivos';

let n = 0;

export async function crear(cuerpo, { datos, navegar, ventana, wm, esMovil }) {
  const id = `sistema-${++n}`;
  const s = datos.sitio.sobreMi;
  const { contacto, otros, degapedia } = datos.sitio;
  const ficha = degapedia.secciones.find((x) => x.fichaTecnica)?.fichaTecnica || [];

  cuerpo.innerHTML = `
    <div class="sistema">
      <div class="pestanas" role="tablist" aria-label="Propiedades del sistema">
        ${PESTANAS.map((p, k) => `<button type="button" class="pestana" role="tab" id="${id}-t${k}" aria-controls="${id}-p${k}" aria-selected="${k === 0}">${p}</button>`).join('')}
      </div>
      <div class="panel-pestana sistema__panel">
        <div role="tabpanel" id="${id}-p0" aria-labelledby="${id}-t0" class="sistema__general">
          <div class="sistema__cabeza">
            <div class="sistema__foto">${s.foto ? `<img src="${t(s.foto)}" alt="Pablo Gaitán, Dega">` : marcador('[ TU FOTO ]', 'marcador--azul marcador--retrato')}</div>
            <div class="sistema__datos">
              <p class="sistema__logo"><span class="marca">Dega</span> <span>OS 2000</span></p>
              <dl>
                <dt>Sistema:</dt><dd>${t(s.sistema).replace(', ', '<br>')}</dd>
                <dt>Registrado a:</dt><dd>${t(s.registradoA).replace(', ', '<br>')}</dd>
                <dt>Equipo:</dt><dd>${t(s.equipo)}</dd>
              </dl>
            </div>
          </div>
          <div class="sistema__bio hundido">${s.bio.map((p) => `<p>${t(p)}</p>`).join('')}</div>
          <div class="sistema__acciones">
            <a class="btn-amarillo" href="${t(s.dossier)}" download><span aria-hidden="true">↓</span> DESCARGAR DOSSIER (PDF)</a>
            <a class="btn" href="#/como-trabajo">Cómo trabajo</a>
          </div>
        </div>

        <div role="tabpanel" id="${id}-p1" aria-labelledby="${id}-t1" hidden>
          <h3 class="sistema__subtitulo">Historial</h3>
          <ul class="sistema__linea">
            ${degapedia.historial.map((h) => `<li><span>${t(h.fecha)}</span>${t(h.texto)}</li>`).join('')}
          </ul>
        </div>

        <div role="tabpanel" id="${id}-p2" aria-labelledby="${id}-t2" hidden>
          <h3 class="sistema__subtitulo">Hardware</h3>
          <table class="wiki__tabla sistema__tabla">
            ${ficha.map(({ campo, valor }) => `<tr><th scope="row">${t(campo)}</th><td>${t(valor)}</td></tr>`).join('')}
          </table>
          ${esMovil() ? '' : '<p><button type="button" class="btn" data-accion="dispositivos">Administrador de dispositivos…</button></p>'}
        </div>

        <div role="tabpanel" id="${id}-p3" aria-labelledby="${id}-t3" hidden>
          <h3 class="sistema__subtitulo">Perfiles de usuario</h3>
          <ul class="sistema__perfiles">
            <li><b>${t(datos.sitio.marca.nombre)}</b> · <a href="${t(contacto.instagramUrl)}" target="_blank" rel="noopener">${t(contacto.instagram)}</a></li>
            ${otros.map((o) => `<li><b>${t(o.nombre)}</b> · ${t(o.tipo)}</li>`).join('')}
          </ul>
        </div>

        ${esMovil() ? `<section class="sistema__arbol-movil" aria-labelledby="${id}-dm"><h3 class="sistema__subtitulo" id="${id}-dm">Administrador de dispositivos</h3><div class="hundido" data-arbol></div></section>` : ''}
      </div>
      <div class="sistema__botones">
        <button type="button" class="btn" data-accion="cerrar">Aceptar</button>
        <button type="button" class="btn" data-accion="cerrar">Cancelar</button>
        <button type="button" class="btn" data-accion="escribir">Escríbeme</button>
      </div>
    </div>`;

  conectarPestanas(cuerpo.querySelector('[role="tablist"]'));

  const abrirDispositivos = async () => {
    const ancho = 480;
    await wm.abrir({
      id: ID_DISPOSITIVOS,
      titulo: 'Administrador de dispositivos',
      icono: 'monitor',
      botones: ['cerrar'],
      ancho,
      alto: 640,
      x: Math.min(ventana.x + ventana.el.offsetWidth - 10, window.innerWidth - ancho - 12),
      y: ventana.y + 40,
      contenido: (c) => {
        c.innerHTML = '<div class="dispositivos hundido"></div><p class="explorador__estado"><span>Categorías: ' + s.dispositivos.length + '</span></p>';
        crearArbol(c.firstElementChild, { raiz: `DEGA (${datos.sitio.marca.nombreReal})`, grupos: s.dispositivos, etiqueta: 'Dispositivos de Dega' });
      },
    });
  };

  cuerpo.addEventListener('click', (e) => {
    const accion = e.target.closest('[data-accion]')?.dataset.accion;
    if (accion === 'cerrar') wm.cerrar(ventana.id);
    if (accion === 'escribir') navegar('contacto');
    if (accion === 'dispositivos') abrirDispositivos();
  });
  ventana.el.addEventListener('ayuda', () => navegar('como-trabajo'));

  if (esMovil()) {
    crearArbol(cuerpo.querySelector('[data-arbol]'), { raiz: `DEGA (${datos.sitio.marca.nombreReal})`, grupos: s.dispositivos, etiqueta: 'Dispositivos de Dega' });
  } else {
    // Las dos ventanas se abren juntas; la principal queda al frente.
    ventana.alCerrar.push(() => wm.cerrar(ID_DISPOSITIVOS));
    setTimeout(async () => {
      await abrirDispositivos();
      wm.enfocar(ventana.id);
    }, 0);
  }
}
