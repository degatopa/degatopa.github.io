// Software: 5 cajas de CD en una repisa (CSS 3D). Al elegir una, la caja avanza y se endereza
// y el disco sale de lado girando. Debajo: propiedades del disco y un reproductor de CD.
// Teclado: flechas para cambiar de disco, Enter o Espacio para sacarlo.
import { glifo } from '../ui/pixel.js';
import { t } from '../ui/html.js';

const dos = (n) => String(n).padStart(2, '0');

let n = 0;

export function crear(cuerpo, { datos, navegar, ventana, cargarFuentes }) {
  cargarFuentes('family=Permanent+Marker');
  const id = `cd-${++n}`;
  const discos = datos.software.discos;
  const proyectos = datos.proyectos.proyectos;
  let elegido = -1;
  let enfocado = 0;
  let reloj = null;
  let segundos = 0;

  cuerpo.innerHTML = `
    <div class="unidad">
      <div class="unidad__escena">
        <p class="unidad__marca marca" aria-hidden="true">Software</p>
        <h3 class="unidad__titulo">D:\\ ${discos.length} DISCOS</h3>
        <p class="unidad__ayuda" id="${id}-ayuda">Haz clic en un CD para sacarlo de la caja.</p>
        <div class="repisa" role="radiogroup" aria-labelledby="${id}-ayuda">
          ${discos.map((d, i) => `
            <button type="button" class="cd" role="radio" aria-checked="false" tabindex="${i ? -1 : 0}" data-i="${i}"
              style="--color:${d.color};--tinta:${d.tinta};--i:${i}" aria-label="${t(d.nombre)}: ${t(d.uso)}">
              <span class="cd__disco" aria-hidden="true"><span class="cd__giro"><span class="cd__rotulo">${t(d.etiqueta)}</span></span></span>
              <span class="cd__caja" aria-hidden="true">
                <span class="cd__portada">
                  <span class="cd__nombre">${t(d.nombre)}</span>
                  <span class="cd__datos">CD-R · 700 MB · ${t(d.tag)}</span>
                </span>
              </span>
            </button>`).join('')}
        </div>
        <div class="repisa__tabla" aria-hidden="true"></div>
        <p class="unidad__bandeja">EN LA BANDEJA: <span data-bandeja>VACÍA</span></p>
        <p class="unidad__pista" data-pista></p>
      </div>

      <div class="unidad__abajo">
        <section class="unidad__panel" aria-labelledby="${id}-props">
          <h3 class="unidad__cabeza" id="${id}-props">Propiedades</h3>
          <div class="unidad__props hundido" data-props></div>
        </section>
        <section class="unidad__panel unidad__panel--lector" aria-labelledby="${id}-lector">
          <h3 class="unidad__cabeza" id="${id}-lector">Reproductor de CD</h3>
          <div class="lector">
            <div class="lector__lcd" aria-live="off">
              <span data-lcd-pista>[--] 00:00</span>
              <span class="lector__texto"><span data-lcd-texto>SIN DISCO</span></span>
            </div>
            <div class="lector__botones">
              <button type="button" class="rep__boton" data-accion="anterior" aria-label="Disco anterior">${glifo('anterior')}</button>
              <button type="button" class="rep__boton" data-accion="play" aria-label="Reproducir">${glifo('play')}</button>
              <button type="button" class="rep__boton" data-accion="stop" aria-label="Detener">${glifo('stop')}</button>
              <button type="button" class="rep__boton" data-accion="siguiente" aria-label="Disco siguiente">${glifo('siguiente')}</button>
              <button type="button" class="rep__boton" data-accion="expulsar" aria-label="Expulsar el disco">${glifo('expulsar')}</button>
            </div>
            <button type="button" class="btn-amarillo" data-accion="trabajos" disabled>VER TRABAJOS HECHOS CON ESTE PROGRAMA</button>
          </div>
        </section>
      </div>
      <p class="explorador__estado" role="status"></p>
    </div>`;

  const $ = (sel) => cuerpo.querySelector(sel);
  const cds = [...cuerpo.querySelectorAll('.cd')];

  function detenerReloj() {
    clearInterval(reloj);
    reloj = null;
    $('.unidad').classList.remove('sonando');
  }

  function pintarLcd() {
    const d = discos[elegido];
    $('[data-lcd-pista]').textContent = d ? `[${dos(elegido + 1)}] ${dos(Math.floor(segundos / 60))}:${dos(segundos % 60)}` : '[--] 00:00';
    $('[data-lcd-texto]').textContent = d ? `${d.nombre.toUpperCase()} — ${d.uso}` : 'SIN DISCO';
  }

  function elegir(i) {
    detenerReloj();
    segundos = 0;
    elegido = i;
    cds.forEach((cd, k) => cd.setAttribute('aria-checked', String(k === i)));
    const d = discos[i];
    $('.unidad').classList.toggle('con-disco', !!d);
    $('[data-bandeja]').textContent = d ? d.nombre.toUpperCase() : 'VACÍA';
    $('[data-pista]').textContent = d ? `PISTA ${dos(i + 1)} / ${dos(discos.length)}` : '';
    $('[data-accion="trabajos"]').disabled = !d;
    $('#' + `${id}-props`).textContent = d ? `Propiedades de ${d.nombre.toUpperCase().replace(/\s+/g, '_')}.CDR` : 'Propiedades';
    $('.explorador__estado').innerHTML = `<span>${discos.length} discos</span><span>${d ? `${t(d.nombre.toUpperCase())} en la bandeja` : 'Bandeja vacía'}</span>`;

    if (d) {
      const usados = proyectos.filter((p) => p.herramientas.includes(d.nombre)).map((p) => p.archivo);
      $('[data-props]').innerHTML = `
        <dl class="props">
          <div><dt>Etiqueta</dt><dd class="props__mano">${t(d.nombre)}</dd></div>
          <div><dt>Para qué lo uso</dt><dd><b>${t(d.uso)}</b></dd></div>
          <div><dt>Lo usé en</dt><dd>${usados.length ? usados.map(t).join(' · ') : '[proyectos]'}</dd></div>
          <div><dt>Desde</dt><dd>${t(d.desde)}</dd></div>
          <div><dt>Tipo</dt><dd>CD-R grabado a mano · 700 MB</dd></div>
        </dl>`;
    } else {
      $('[data-props]').innerHTML = '<p class="props__vacio">Elige un disco de la repisa para ver sus propiedades.</p>';
    }
    pintarLcd();
  }

  function enfocar(i) {
    enfocado = (i + discos.length) % discos.length;
    cds.forEach((cd, k) => (cd.tabIndex = k === enfocado ? 0 : -1));
    cds[enfocado].focus();
  }

  // ---------- Eventos ----------

  $('.repisa').addEventListener('click', (e) => {
    const cd = e.target.closest('.cd');
    if (!cd) return;
    const i = Number(cd.dataset.i);
    enfocado = i;
    elegir(elegido === i ? -1 : i);
  });

  $('.repisa').addEventListener('keydown', (e) => {
    const mover = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (mover) {
      e.preventDefault();
      enfocar(enfocado + mover);
      elegir(enfocado);
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      enfocar(e.key === 'Home' ? 0 : discos.length - 1);
      elegir(enfocado);
    }
  });

  cuerpo.addEventListener('click', (e) => {
    const accion = e.target.closest('[data-accion]')?.dataset.accion;
    if (!accion) return;
    if (accion === 'anterior') elegir(((elegido < 0 ? 0 : elegido) - 1 + discos.length) % discos.length);
    if (accion === 'siguiente') elegir(((elegido < 0 ? -1 : elegido) + 1) % discos.length);
    if (accion === 'expulsar') elegir(-1);
    if (accion === 'stop') {
      detenerReloj();
      segundos = 0;
      pintarLcd();
    }
    if (accion === 'play') {
      if (elegido < 0) elegir(0);
      if (reloj) return;
      $('.unidad').classList.add('sonando');
      reloj = setInterval(() => {
        segundos++;
        pintarLcd();
      }, 1000);
    }
    if (accion === 'trabajos' && discos[elegido]) navegar('trabajos', { herramienta: discos[elegido].nombre });
  });

  ventana.alCerrar.push(detenerReloj);
  elegir(-1);
}
