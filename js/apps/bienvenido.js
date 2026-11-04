// Bienvenido.exe: la presentación y la llamada a escribir.
// En escritorio es una ventana junto al reproductor; en móvil va en la portada con el reel dentro.
import { crearReproductor, listaDeVideos } from '../ui/reproductor.js';

function contenido(b) {
  const el = document.createElement('div');
  el.className = 'bienvenido';
  el.innerHTML = `
    <p class="bienvenido__rec"></p>
    <h2 class="bienvenido__titular"></h2>
    <p class="bienvenido__texto"></p>
    <div class="bienvenido__acciones">
      <button type="button" class="btn-principal" data-ir="contacto"></button>
      <button type="button" class="btn" data-ir="trabajos"></button>
    </div>`;
  el.querySelector('.bienvenido__rec').textContent = b.rec;
  el.querySelector('.bienvenido__titular').textContent = b.titular;
  el.querySelector('.bienvenido__texto').textContent = b.texto;
  el.querySelector('[data-ir="contacto"]').textContent = b.botonPrincipal;
  el.querySelector('[data-ir="trabajos"]').textContent = b.botonSecundario;
  return el;
}

/** Ventana de escritorio. */
export function crear(cuerpo, { datos, navegar }) {
  const el = contenido(datos.sitio.bienvenido);
  el.addEventListener('click', (e) => {
    const ir = e.target.closest('[data-ir]')?.dataset.ir;
    if (ir) navegar(ir);
  });
  cuerpo.append(el);
}

/** Bloque de la portada móvil: marco de ventana, reel en bucle con sonido, titular y botón. */
export async function crearMovil(contenedor, { datos, navegar }) {
  const b = datos.sitio.bienvenido;
  contenedor.innerHTML = `
    <section class="ventana ventana--fija es-activa" aria-labelledby="bienvenido-movil-titulo">
      <header class="ventana__titulo">
        <h2 class="ventana__texto" id="bienvenido-movil-titulo"></h2>
      </header>
      <div class="bienvenido-movil">
        <div class="bienvenido-movil__reel"></div>
        <p class="bienvenido-movil__titular"></p>
        <button type="button" class="btn-principal btn-principal--ancho" data-ir="contacto"></button>
      </div>
    </section>`;
  contenedor.querySelector('.ventana__texto').textContent = b.titulo;
  contenedor.querySelector('.bienvenido-movil__titular').textContent = b.titular;
  contenedor.querySelector('[data-ir]').textContent = b.botonPrincipal;
  contenedor.querySelector('[data-ir]').addEventListener('click', () => navegar('contacto'));

  const lista = listaDeVideos(datos);
  await crearReproductor(contenedor.querySelector('.bienvenido-movil__reel'), {
    lista: lista.slice(0, 1),
    modo: 'compacto',
    autoplay: true,
    bucle: true,
  });
}
