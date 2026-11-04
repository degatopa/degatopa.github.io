// Dega, el pez guía: vive abajo a la derecha, nada en 3D y habla con un globo.
// Al entrar presenta el sitio (reemplaza a Bienvenido.exe) y, al abrir cada sección por primera vez
// en la visita, da un consejo corto. Clic en el pez: menú de ayuda. Los textos están en sitio.json → guia.
import { crearPez } from './ui/pez3d.js';
import { t } from './ui/html.js';
import { sonar } from './sonidos.js';

const CLAVE_VISTOS = 'dega-os:guia-vistos';
const reducido = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// sessionStorage: los consejos se muestran una vez por visita. Si el navegador lo bloquea, se repiten.
function leerVistos() {
  try {
    return new Set(JSON.parse(sessionStorage.getItem(CLAVE_VISTOS)) || []);
  } catch {
    return new Set();
  }
}
function guardarVistos(vistos) {
  try {
    sessionStorage.setItem(CLAVE_VISTOS, JSON.stringify([...vistos]));
  } catch {
    /* sin almacenamiento: no pasa nada */
  }
}

/**
 * @param {object} ctx  contexto de main.js (datos, navegar, prefs)
 */
export function crearGuia({ datos, navegar, prefs }) {
  const g = datos.sitio.guia;
  const b = datos.sitio.bienvenido;
  const vistos = leerVistos();
  let silenciado = vistos.has('__silencio');
  let actual = null; // { importante, alCerrar }
  let pez = null;

  const el = document.createElement('div');
  el.className = 'guia';
  el.innerHTML = `
    <section class="guia__globo" aria-labelledby="guia-nombre" hidden>
      <button type="button" class="guia__cerrar" aria-label="Cerrar el mensaje de ${t(g.nombre)}">×</button>
      <p class="guia__nombre" id="guia-nombre">${t(g.nombre.toUpperCase())}</p>
      <div class="guia__contenido" aria-live="polite"></div>
    </section>
    <button type="button" class="guia__pez" aria-label="${t(g.nombre)}, tu guía. Clic para pedir ayuda" aria-expanded="false">
      <canvas width="120" height="90"></canvas>
    </button>`;
  document.body.append(el);

  const globo = el.querySelector('.guia__globo');
  const contenido = el.querySelector('.guia__contenido');
  const botonPez = el.querySelector('.guia__pez');

  crearPez(el.querySelector('canvas'), g.modelo, { quieto: reducido() })
    .then((p) => (pez = p))
    .catch(() => el.classList.add('guia--sin-3d'));

  /**
   * Muestra un mensaje en el globo.
   * @param {object} m
   * @param {string} [m.etiqueta]   línea pequeña amarilla
   * @param {string} [m.titulo]     letra grande
   * @param {string} [m.texto]
   * @param {{ texto: string, principal?: boolean, accion: () => void }[]} [m.botones]
   * @param {boolean} [m.importante]  un consejo automático no lo reemplaza
   * @param {() => void} [m.alCerrar]
   */
  function decir(m) {
    actual = { importante: !!m.importante, alCerrar: m.alCerrar };
    contenido.innerHTML = `
      ${m.etiqueta ? `<p class="guia__etiqueta">${t(m.etiqueta)}</p>` : ''}
      ${m.titulo ? `<p class="guia__titulo">${t(m.titulo)}</p>` : ''}
      ${m.texto ? `<p class="guia__texto">${t(m.texto)}</p>` : ''}
      ${m.botones?.length ? `<div class="guia__botones">${m.botones
        .map((bt, i) => `<button type="button" class="${bt.principal ? 'btn-principal guia__principal' : 'btn'}" data-i="${i}">${t(bt.texto)}</button>`)
        .join('')}</div>` : ''}`;
    contenido.querySelectorAll('[data-i]').forEach((boton) =>
      boton.addEventListener('click', () => {
        const bt = m.botones[Number(boton.dataset.i)];
        callar();
        bt.accion();
      }),
    );
    globo.hidden = false;
    globo.classList.remove('guia__globo--entra');
    void globo.offsetWidth; // reinicia la animación de entrada
    globo.classList.add('guia__globo--entra');
    botonPez.setAttribute('aria-expanded', 'true');
    pez?.animar(1);
    sonar.abrir();
  }

  function callar() {
    if (globo.hidden) return;
    globo.hidden = true;
    botonPez.setAttribute('aria-expanded', 'false');
    const alCerrar = actual?.alCerrar;
    actual = null;
    alCerrar?.();
  }

  /** La presentación del inicio: el titular de Bienvenido.exe y el botón de contacto, nada más. */
  function presentar() {
    decir({
      titulo: b.titular,
      importante: true,
      botones: [{ texto: b.botonPrincipal, principal: true, accion: () => navegar('contacto') }],
      // En la primera visita, al cerrar la presentación cuenta lo del filtro CRT.
      // Si para entonces otro mensaje ocupa el globo, el aviso espera a la próxima visita.
      alCerrar: () => {
        if (prefs.obtener().globoVisto || !prefs.obtener().crt) return;
        setTimeout(() => {
          if (!globo.hidden) return;
          prefs.guardar({ globoVisto: true });
          decir({ texto: g.crt });
        }, 600);
      },
    });
  }

  /** Consejo de una sección, una vez por visita. No interrumpe la presentación ni un mensaje importante. */
  function consejo(app) {
    const texto = g.consejos[app];
    if (!texto || silenciado || vistos.has(app)) return;
    if (actual?.importante && !globo.hidden) return;
    vistos.add(app);
    guardarVistos(vistos);
    const botones =
      app === 'proyecto'
        ? [{ texto: 'PEDIR UNA DEMO', principal: true, accion: () => navegar('contacto', { demo: true }) }]
        : [];
    decir({ texto, botones });
  }

  function menu() {
    decir({
      titulo: g.menu,
      botones: [
        { texto: b.botonPrincipal, principal: true, accion: () => navegar('contacto') },
        { texto: 'Ver trabajos', accion: () => navegar('trabajos') },
        { texto: 'Cómo trabajo', accion: () => navegar('como-trabajo') },
        {
          texto: silenciado ? 'Volver a darme consejos' : 'No más consejos',
          accion: () => {
            silenciado = !silenciado;
            if (silenciado) vistos.add('__silencio');
            else vistos.delete('__silencio');
            guardarVistos(vistos);
          },
        },
      ],
    });
  }

  botonPez.addEventListener('click', () => {
    sonar.clic();
    if (globo.hidden) menu();
    else callar();
  });
  el.querySelector('.guia__cerrar').addEventListener('click', callar);
  // Esc cierra el globo sin cerrar la ventana de atrás.
  el.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || globo.hidden) return;
    e.preventDefault();
    callar();
    botonPez.focus();
  });
  // En el celular el globo tapa media pantalla: se cierra al tocar cualquier otra parte.
  const movil = window.matchMedia('(max-width: 767px)');
  document.addEventListener('pointerdown', (e) => {
    if (movil.matches && !globo.hidden && !el.contains(e.target)) callar();
  });

  return { decir, callar, presentar, consejo };
}
