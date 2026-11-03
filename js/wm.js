// Gestor de ventanas de DEGA OS: abrir, enfocar, arrastrar, minimizar, maximizar y cerrar,
// con un botón por ventana en la barra de tareas.
import { icono, glifo } from './ui/pixel.js';
import { sonar } from './sonidos.js';

const movil = window.matchMedia('(max-width: 767px)');
export const esMovil = () => movil.matches;

const limitar = (n, min, max) => Math.min(Math.max(n, min), max);

/** Aplica una clase de animación y espera a que termine (al instante si no hay animación). */
function animar(el, clase) {
  return new Promise((listo) => {
    el.classList.add(clase);
    const duracion = parseFloat(getComputedStyle(el).animationDuration) || 0;
    const fin = () => {
      el.classList.remove(clase);
      listo();
    };
    if (!duracion) fin();
    else el.addEventListener('animationend', fin, { once: true });
  });
}

let contador = 0;

export class GestorVentanas {
  /**
   * @param {object} o
   * @param {HTMLElement} o.contenedor  donde se insertan las ventanas
   * @param {HTMLElement} o.tareas      grupo de botones de la barra de tareas
   * @param {(v: object|null) => void} [o.alCambiarActiva]  se llama cuando cambia la ventana activa
   */
  constructor({ contenedor, tareas, alCambiarActiva = () => {} }) {
    this.contenedor = contenedor;
    this.tareas = tareas;
    this.alCambiarActiva = alCambiarActiva;
    this.ventanas = new Map();
    this.z = 10;
    this.activaId = null;

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      const activa = this.activa();
      if (activa) {
        e.preventDefault();
        this.cerrar(activa.id);
      }
    });
    window.addEventListener('resize', () => this.ventanas.forEach((v) => this.#posicionar(v, v.x, v.y)));
  }

  existe = (id) => this.ventanas.has(id);
  obtener = (id) => this.ventanas.get(id);
  activa = () => this.ventanas.get(this.activaId) || null;

  /**
   * Abre una ventana nueva o, si ya existe, la trae al frente.
   * @param {object} o
   * @param {string} o.id
   * @param {string} o.titulo
   * @param {string} o.icono       nombre de un ícono de ui/pixel.js
   * @param {string} [o.ruta]      ruta del hash que representa esta ventana
   * @param {number} [o.ancho]
   * @param {number} [o.alto]
   * @param {string[]} [o.botones] por defecto minimizar, maximizar y cerrar
   * @param {string} [o.clase]     clase extra para la ventana
   * @param {(cuerpo: HTMLElement, v: object) => (void|Promise<void>)} o.contenido
   */
  async abrir(o) {
    if (this.ventanas.has(o.id)) {
      this.restaurar(o.id);
      return this.ventanas.get(o.id);
    }
    const botones = o.botones || ['minimizar', 'maximizar', 'cerrar'];
    const n = ++contador;
    const el = document.createElement('section');
    el.className = `ventana ${o.clase || ''}`.trim();
    el.tabIndex = -1;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-labelledby', `vt-${n}`);
    el.innerHTML = `
      <header class="ventana__titulo">
        <button type="button" class="ventana__boton ventana__atras" aria-label="Atrás">${glifo('atras')}</button>
        <span class="ventana__icono">${icono(o.icono)}</span>
        <h2 class="ventana__texto" id="vt-${n}"></h2>
        <div class="ventana__botones">
          ${botones.map((b) => `<button type="button" class="ventana__boton" data-accion="${b}" aria-label="${ETIQUETAS[b]}" title="${ETIQUETAS[b]}">${glifo(b)}</button>`).join('')}
        </div>
      </header>
      <div class="ventana__cuerpo"></div>`;
    el.querySelector('.ventana__texto').textContent = o.titulo;

    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'tarea';
    boton.innerHTML = `<span class="tarea__icono">${icono(o.icono)}</span><span class="tarea__texto"></span>`;
    boton.querySelector('.tarea__texto').textContent = o.titulo;

    const v = {
      id: o.id,
      ruta: o.ruta ?? null,
      titulo: o.titulo,
      el,
      boton,
      cuerpo: el.querySelector('.ventana__cuerpo'),
      minimizada: false,
      maximizada: false,
      origen: document.activeElement,
      x: 0,
      y: 0,
      alCerrar: [],
    };
    this.ventanas.set(o.id, v);

    // Tamaño y posición en cascada, siempre dentro de la pantalla.
    const area = this.#area();
    el.style.width = `${Math.min(o.ancho || 640, area.ancho - 16)}px`;
    el.style.height = `${Math.min(o.alto || 460, area.alto - 16)}px`;
    this.contenedor.append(el);
    this.tareas.append(boton);
    const paso = (this.ventanas.size - 1) % 6;
    this.#posicionar(v, o.x ?? 140 + paso * 28, o.y ?? 40 + paso * 26);

    this.#conectar(v);
    this.enfocar(o.id);
    sonar.abrir();
    const animacion = animar(el, 'anim-abrir');
    await o.contenido?.(v.cuerpo, v);
    await animacion;
    return v;
  }

  enfocar(id) {
    const v = this.ventanas.get(id);
    if (!v) return;
    const cambia = this.activaId !== id;
    this.activaId = id;
    v.el.style.zIndex = ++this.z;
    this.ventanas.forEach((otra) => {
      const activa = otra === v;
      otra.el.classList.toggle('es-activa', activa);
      otra.boton.setAttribute('aria-pressed', String(activa && !otra.minimizada));
    });
    if (!v.el.contains(document.activeElement)) v.el.focus({ preventScroll: true });
    if (cambia) this.alCambiarActiva(v);
  }

  async minimizar(id) {
    const v = this.ventanas.get(id);
    if (!v || v.minimizada) return;
    await animar(v.el, 'anim-minimizar');
    v.minimizada = true;
    v.el.hidden = true;
    v.boton.setAttribute('aria-pressed', 'false');
    if (this.activaId === id) this.#enfocarSiguiente();
  }

  restaurar(id) {
    const v = this.ventanas.get(id);
    if (!v) return;
    if (v.minimizada) {
      v.minimizada = false;
      v.el.hidden = false;
      animar(v.el, 'anim-abrir');
    }
    this.enfocar(id);
  }

  alternarMaximizar(id) {
    const v = this.ventanas.get(id);
    if (!v || esMovil()) return;
    v.maximizada = !v.maximizada;
    v.el.classList.toggle('es-maximizada', v.maximizada);
    const boton = v.el.querySelector('[data-accion="maximizar"]');
    if (boton) {
      const etiqueta = v.maximizada ? 'Restaurar' : 'Maximizar';
      boton.innerHTML = glifo(v.maximizada ? 'restaurar' : 'maximizar');
      boton.setAttribute('aria-label', etiqueta);
      boton.title = etiqueta;
    }
  }

  async cerrar(id) {
    const v = this.ventanas.get(id);
    if (!v) return;
    this.ventanas.delete(id);
    v.alCerrar.forEach((fn) => fn());
    v.boton.remove();
    sonar.cerrar();
    if (this.activaId === id) this.#enfocarSiguiente(v.origen);
    await animar(v.el, 'anim-cerrar');
    v.el.remove();
  }

  cerrarTodas() {
    [...this.ventanas.keys()].forEach((id) => this.cerrar(id));
  }

  /** La ventana visible de más arriba pasa a ser la activa; si no queda ninguna, el foco vuelve a donde estaba. */
  #enfocarSiguiente(origen) {
    const visibles = [...this.ventanas.values()].filter((v) => !v.minimizada);
    visibles.sort((a, b) => Number(b.el.style.zIndex) - Number(a.el.style.zIndex));
    if (visibles[0]) {
      this.enfocar(visibles[0].id);
      return;
    }
    this.activaId = null;
    this.ventanas.forEach((v) => v.el.classList.remove('es-activa'));
    if (origen?.isConnected) origen.focus({ preventScroll: true });
    this.alCambiarActiva(null);
  }

  #area() {
    const barra = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--barra-alto')) || 40;
    return { ancho: window.innerWidth, alto: window.innerHeight - barra };
  }

  #posicionar(v, x, y) {
    const { ancho, alto } = this.#area();
    v.x = limitar(x, 0, Math.max(0, ancho - v.el.offsetWidth));
    v.y = limitar(y, 0, Math.max(0, alto - v.el.offsetHeight));
    v.el.style.left = `${v.x}px`;
    v.el.style.top = `${v.y}px`;
  }

  #conectar(v) {
    const { el, boton } = v;
    const titulo = el.querySelector('.ventana__titulo');

    el.addEventListener('pointerdown', () => this.activaId !== v.id && this.enfocar(v.id), true);
    el.addEventListener('focusin', () => this.activaId !== v.id && this.enfocar(v.id));

    el.querySelector('.ventana__botones').addEventListener('click', (e) => {
      const accion = e.target.closest('[data-accion]')?.dataset.accion;
      if (accion === 'minimizar') this.minimizar(v.id);
      if (accion === 'maximizar') this.alternarMaximizar(v.id);
      if (accion === 'cerrar') this.cerrar(v.id);
      if (accion === 'ayuda') el.dispatchEvent(new CustomEvent('ayuda'));
    });
    el.querySelector('.ventana__atras').addEventListener('click', () => this.cerrar(v.id));

    titulo.addEventListener('dblclick', (e) => {
      if (!e.target.closest('button')) this.alternarMaximizar(v.id);
    });

    titulo.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || e.target.closest('button') || v.maximizada || esMovil()) return;
      const dx = e.clientX - v.x;
      const dy = e.clientY - v.y;
      titulo.setPointerCapture(e.pointerId);
      el.classList.add('es-arrastrada');
      const mover = (ev) => this.#posicionar(v, ev.clientX - dx, ev.clientY - dy);
      const soltar = () => {
        el.classList.remove('es-arrastrada');
        titulo.removeEventListener('pointermove', mover);
        titulo.removeEventListener('pointerup', soltar);
        titulo.removeEventListener('pointercancel', soltar);
      };
      titulo.addEventListener('pointermove', mover);
      titulo.addEventListener('pointerup', soltar);
      titulo.addEventListener('pointercancel', soltar);
    });

    boton.addEventListener('click', () => {
      if (v.minimizada) this.restaurar(v.id);
      else if (this.activaId === v.id) this.minimizar(v.id);
      else this.enfocar(v.id);
    });
  }
}

const ETIQUETAS = {
  minimizar: 'Minimizar',
  maximizar: 'Maximizar',
  cerrar: 'Cerrar',
  ayuda: 'Ayuda',
};
