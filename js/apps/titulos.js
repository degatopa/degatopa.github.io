// Títulos: museo en perspectiva de un punto. Al elegir un cuadro, la cámara viaja hasta él
// (translate + scale del contenedor, 0,9 s). Flechas: cuadro anterior/siguiente. Esc: alejar.
import { glifo } from '../ui/pixel.js';
import { t } from '../ui/html.js';

// La sala se dibuja en un espacio de 1200 × 640 unidades y se escala para llenar la ventana.
const ANCHO = 1200;
const ALTO = 640;
const FUGA = { x: 600, y: 255 };
const PARED = { x0: 190, x1: 1010, arriba: 50, abajo: 470 };

// Posición de cada cuadro: los tres de la pared del fondo y uno en cada pared lateral.
const CAJAS = {
  fondo: [
    { x: 205, y: 180, w: 220, h: 165 },
    { x: 450, y: 150, w: 300, h: 210 },
    { x: 775, y: 180, w: 220, h: 165 },
  ],
  izquierda: { x: -40, y: 196, w: 200, h: 150 },
  derecha: { x: 1040, y: 196, w: 200, h: 150 },
};

/** Piso a cuadros crema y negro que converge hacia el punto de fuga. */
function piso() {
  const columnas = 12;
  const paso = (PARED.x1 - PARED.x0) / columnas;
  const filas = 7;
  const z = Array.from({ length: filas + 1 }, (_, i) => 1 - (i * 0.58) / filas);
  const y = (prof) => FUGA.y + (PARED.abajo - FUGA.y) / prof;
  const x = (xb, prof) => FUGA.x + (xb - FUGA.x) / prof;
  let baldosas = '';
  for (let f = 0; f < filas; f++) {
    for (let c = -6; c < columnas + 6; c++) {
      const xa = PARED.x0 + c * paso;
      const xb = xa + paso;
      const puntos = [
        [x(xa, z[f]), y(z[f])],
        [x(xb, z[f]), y(z[f])],
        [x(xb, z[f + 1]), y(z[f + 1])],
        [x(xa, z[f + 1]), y(z[f + 1])],
      ];
      const color = (c + f) % 2 ? '#111116' : '#EFE8D3';
      baldosas += `<polygon points="${puntos.map((p) => p.map((n) => n.toFixed(1)).join(',')).join(' ')}" fill="${color}"/>`;
    }
  }
  return baldosas;
}

/** La sala, con una lámpara sobre cada cuadro de la pared del fondo. */
function salaSVG(enFondo) {
  const conos = enFondo
    .map((c) => {
      const lx = c.x + c.w / 2;
      return `<polygon points="${lx - 14},${PARED.arriba} ${lx + 14},${PARED.arriba} ${c.x + c.w + 40},${PARED.abajo} ${c.x - 40},${PARED.abajo}" fill="url(#cono)"/>
        <rect x="${lx - 22}" y="${PARED.arriba - 4}" width="44" height="8" fill="#222"/>`;
    })
    .join('');
  return `
    <svg class="sala__fondo" viewBox="0 0 ${ANCHO} ${ALTO}" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <pattern id="rayas" width="9" height="10" patternUnits="userSpaceOnUse">
          <rect width="9" height="10" fill="#1830D8"/><rect width="1" height="10" fill="#2a44f0"/>
        </pattern>
        <linearGradient id="cono" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#fff" stop-opacity="0.28"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="lateral-i" x1="0" x2="1"><stop offset="0" stop-color="#050E70"/><stop offset="1" stop-color="#0D1DB0"/></linearGradient>
        <linearGradient id="lateral-d" x1="1" x2="0"><stop offset="0" stop-color="#050E70"/><stop offset="1" stop-color="#0D1DB0"/></linearGradient>
      </defs>
      ${piso()}
      <rect x="${PARED.x0}" y="${PARED.arriba}" width="${PARED.x1 - PARED.x0}" height="${PARED.abajo - PARED.arriba}" fill="url(#rayas)"/>
      <polygon points="0,-45 ${PARED.x0},${PARED.arriba} ${PARED.x0},${PARED.abajo} 0,570" fill="url(#lateral-i)"/>
      <polygon points="${ANCHO},-45 ${PARED.x1},${PARED.arriba} ${PARED.x1},${PARED.abajo} ${ANCHO},570" fill="url(#lateral-d)"/>
      <polygon points="0,0 ${ANCHO},0 ${PARED.x1},${PARED.arriba} ${PARED.x0},${PARED.arriba}" fill="#020744"/>
      <rect x="${PARED.x0}" y="${PARED.abajo - 6}" width="${PARED.x1 - PARED.x0}" height="6" fill="#0A1590"/>
      ${conos}
    </svg>`;
}

function contenidoCuadro(c) {
  if (c.imagen) return `<img src="${t(c.imagen)}" alt="" loading="lazy">`;
  if (c.reservado) return '<span class="cuadro__reservado"></span>';
  if (c.destacado) {
    return `<span class="cuadro__diseno cuadro__diseno--oscuro">
      <span class="cuadro__encabezado">${t(c.encabezado)}</span>
      <span class="cuadro__sub">${t(c.titulo)}</span>
      <span class="cuadro__marca marca">${t(c.institucion)}</span>
      <span class="cuadro__falta">[ TU DISEÑO ]</span>
    </span>`;
  }
  return `<span class="cuadro__diseno">
    <span class="cuadro__encabezado cuadro__encabezado--serif">${t(c.encabezado)}</span>
    <span class="cuadro__nombre">${t(c.corto)}</span>
    <span class="cuadro__falta">[ TU DISEÑO ]</span>
    <span class="cuadro__sello" aria-hidden="true"></span>
  </span>`;
}

let n = 0;

export function crear(cuerpo, { datos, ventana, cargarFuentes }) {
  cargarFuentes('family=Libertinus+Serif:ital,wght@0,400;0,600;1,400');
  const id = `sala-${++n}`;
  const { cuadros, sala, descripcion } = datos.titulos;
  // El cuadro destacado va en el marco grande del centro; los demás de la pared del fondo, en los lados.
  const lateral = (c) => c.pared === 'izquierda' || c.pared === 'derecha';
  const libres = cuadros.some((c) => c.destacado && !lateral(c)) ? [0, 2] : [0, 1, 2];
  const cajas = cuadros.map((c) => (lateral(c) ? CAJAS[c.pared] : CAJAS.fondo[c.destacado ? 1 : libres.shift()]));
  let actual = -1;
  const tituloBase = ventana.titulo;

  cuerpo.innerHTML = `
    <div class="galeria">
      <div class="sala" tabindex="-1">
        <div class="sala__mundo">
          <div class="sala__camara">
            ${salaSVG(cajas.filter((k) => CAJAS.fondo.includes(k)))}
            ${cuadros.map((c, i) => {
              const k = cajas[i];
              const lado = c.pared === 'derecha' || c.pared === 'izquierda' ? ` cuadro--${c.pared}` : '';
              return `
                <button type="button" class="cuadro${lado}${c.destacado ? ' cuadro--destacado' : ''}${c.reservado ? ' cuadro--vacio' : ''}" data-i="${i}"
                  style="left:${k.x}px;top:${k.y}px;width:${k.w}px;height:${k.h}px"
                  aria-label="${t(c.corto)}, ${t(c.institucion)}, ${t(c.anio)}. Acercar la cámara.">
                  <span class="cuadro__cuerda" aria-hidden="true"></span>
                  <span class="cuadro__marco"><span class="cuadro__paspartu">${contenidoCuadro(c)}</span></span>
                </button>
                ${lado ? '' : `<p class="placa" style="left:${k.x + k.w / 2}px;top:${k.y + k.h + 14}px" aria-hidden="true">${t(c.corto)} · ${t(c.placa || c.institucion)} · ${t(c.anio)}</p>`}`;
            }).join('')}
          </div>
        </div>

        <div class="sala__hud" aria-hidden="true">
          <p class="sala__modo"></p>
          <p class="sala__ayuda"></p>
        </div>
        <p class="sala__nombre" aria-hidden="true">${t(sala)}</p>
        <div class="minimapa" aria-hidden="true">
          <p>MAPA · ${t(sala.split('·')[0].trim())}</p>
          <div class="minimapa__muro">${cuadros.map((c, i) => `<span class="minimapa__c${c.pared === 'derecha' || c.pared === 'izquierda' ? ` minimapa__c--lado minimapa__c--${c.pared}` : ''}${c.destacado ? ' minimapa__c--grande' : ''}" data-m="${i}"></span>`).join('')}</div>
          <p class="minimapa__aqui">▲ ESTÁS AQUÍ</p>
        </div>
        <aside class="ficha-museo" aria-live="polite"></aside>
      </div>

      <div class="galeria__controles">
        <button type="button" class="btn galeria__btn" data-accion="anterior">${glifo('atras')} <span>Anterior</span></button>
        <button type="button" class="btn galeria__btn" data-accion="muro">Ver el muro completo</button>
        <button type="button" class="btn galeria__btn" data-accion="siguiente"><span>Siguiente</span> ${glifo('adelante')}</button>
        <output class="campo galeria__texto"></output>
        <button type="button" class="btn galeria__btn" data-accion="completa">Pantalla completa</button>
      </div>
      <p class="explorador__estado" role="status"></p>
    </div>`;

  const $ = (sel) => cuerpo.querySelector(sel);
  const salaEl = $('.sala');
  const mundo = $('.sala__mundo');
  const camara = $('.sala__camara');

  // Escala el mundo de 1200 × 640 para que quepa en la ventana.
  const ajustar = () => {
    const k = Math.min(salaEl.clientWidth / ANCHO, salaEl.clientHeight / ALTO);
    mundo.style.transform = `translate(-50%, -50%) scale(${k})`;
  };
  const observador = new ResizeObserver(ajustar);
  observador.observe(salaEl);
  ventana.alCerrar.push(() => observador.disconnect());

  function pintar() {
    const c = cuadros[actual];
    const zoom = c ? camaraHacia(cajas[actual]) : 1;
    salaEl.classList.toggle('acercada', !!c);
    cuerpo.querySelectorAll('.cuadro').forEach((b, i) => b.setAttribute('aria-current', String(i === actual)));
    cuerpo.querySelectorAll('[data-m]').forEach((m, i) => m.classList.toggle('actual', i === actual));
    $('.sala__modo').textContent = c ? `ZOOM ${zoom.toFixed(1)}X` : 'VISTA GENERAL';
    $('.sala__ayuda').textContent = c ? 'La cámara viaja hasta el cuadro elegido' : 'Haz clic en un cuadro para acercarte';
    $('.galeria__texto').textContent = c ? `${c.corto} · ${c.institucion} · ${c.anio}` : descripcion;
    $('[data-accion="muro"]').textContent = c ? 'Alejar' : 'Ver el muro completo';
    $('[data-accion="muro"]').disabled = !c;
    $('.explorador__estado').innerHTML = c
      ? `<span>Cuadro ${actual + 1} de ${cuadros.length}</span><span>Cámara: acercada</span><span class="estado__der">Usa las flechas del teclado para pasar de cuadro</span>`
      : `<span>${cuadros.length} cuadros</span><span>Cámara: vista general</span><span class="estado__der">Esc aleja la cámara</span>`;
    $('.ficha-museo').innerHTML = c
      ? `<p class="ficha-museo__num">CUADRO ${String(actual + 1).padStart(2, '0')} / ${String(cuadros.length).padStart(2, '0')}</p>
         <h3>${t(c.titulo)}</h3>
         <p>${t(c.institucion)}<br>${t(c.anio)}${c.detalle ? ` · ${t(c.detalle)}` : ''}</p>
         <p class="ficha-museo__linea">${t(c.linea)}</p>`
      : '';
    ventana.el.querySelector('.ventana__texto').textContent = c ? `${tituloBase} — ${c.institucion}` : tituloBase;
  }

  /** Mueve la cámara para que la caja quede a la izquierda del centro, con espacio para la ficha. Devuelve el zoom. */
  function camaraHacia(caja) {
    const zoom = Math.min((ANCHO * 0.5) / caja.w, (ALTO * 0.68) / caja.h, 3.4);
    const destino = { x: ANCHO * 0.4, y: ALTO * 0.5 };
    const tx = destino.x - zoom * (caja.x + caja.w / 2);
    const ty = destino.y - zoom * (caja.y + caja.h / 2);
    camara.style.transform = `translate(${tx}px, ${ty}px) scale(${zoom})`;
    return zoom;
  }

  function ir(i) {
    actual = i;
    if (i < 0) camara.style.transform = '';
    pintar();
  }
  const mover = (paso) => ir(((actual < 0 ? (paso > 0 ? -1 : 0) : actual) + paso + cuadros.length) % cuadros.length);

  // ---------- Eventos ----------

  cuerpo.addEventListener('click', (e) => {
    const cuadro = e.target.closest('.cuadro');
    if (cuadro) {
      const i = Number(cuadro.dataset.i);
      ir(i === actual ? -1 : i);
      return;
    }
    const accion = e.target.closest('[data-accion]')?.dataset.accion;
    if (accion === 'anterior') mover(-1);
    if (accion === 'siguiente') mover(1);
    if (accion === 'muro') ir(-1);
    if (accion === 'completa') {
      if (document.fullscreenElement) document.exitFullscreen();
      else salaEl.requestFullscreen?.().catch(() => {});
    }
  });

  ventana.el.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea')) return;
    if (e.key === 'ArrowRight') mover(1);
    else if (e.key === 'ArrowLeft') mover(-1);
    else if (e.key === 'Escape' && actual >= 0) ir(-1);
    else return;
    e.preventDefault();
  });

  // Deslizar con el dedo pasa de cuadro.
  let inicioX = null;
  salaEl.addEventListener('pointerdown', (e) => (inicioX = e.pointerType === 'touch' ? e.clientX : null));
  salaEl.addEventListener('pointerup', (e) => {
    if (inicioX === null) return;
    const dx = e.clientX - inicioX;
    if (Math.abs(dx) > 50) mover(dx < 0 ? 1 : -1);
    inicioX = null;
  });

  pintar();
}
