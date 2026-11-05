// Hoja de vida: el documento en una hoja blanca dentro de la ventana, con el botón para bajar el PDF.
// La versión pública no lleva número de cédula ni firma: no los agregues a sitio.json.
import { t } from '../ui/html.js';

/** Arma el HTML de la hoja. También lo usa scripts/generar-hoja-de-vida.mjs para crear el PDF. */
export function htmlHoja(h, correo) {
  const bloque = (titulo, contenido) => `
    <section class="hoja__bloque">
      <h4 class="hoja__seccion">${t(titulo)}</h4>
      <div class="hoja__contenido">${contenido}</div>
    </section>`;
  const punto = (p) => (typeof p === 'string' ? `<li>${t(p)}</li>` : `<li><b><i>${t(p.destacado)}:</i></b> ${t(p.texto)}</li>`);
  const conPuntos = (lista) => lista.map((x) => `
        <h5 class="hoja__titulo">${t(x.titulo)}</h5>
        <ul class="hoja__puntos">${x.puntos.map(punto).join('')}</ul>`).join('');
  return `
    <header class="hoja__cabeza">
      <h3 class="hoja__nombre">${t(h.nombre)}</h3>
      <p class="hoja__cargo">${t(h.cargo)}</p>
    </header>
    ${bloque('Perfil Profesional', h.perfil.map((p) => `<p>${t(p)}</p>`).join(''))}
    ${bloque('Educación', h.educacion.map((e) => `
        <h5 class="hoja__titulo">${t(e.titulo)}</h5>
        <p>${t(e.detalle)}</p>`).join(''))}
    ${bloque('Experiencia Laboral', conPuntos(h.experiencia))}
    ${bloque('Competencias', conPuntos(h.competencias))}
    ${bloque('Habilidades', `<p>${h.habilidades.map(t).join(' | ')}</p>`)}
    ${bloque('Contacto', `<p>${t(h.nombre)} | ${t(h.edad)}</p><p><a href="mailto:${t(correo)}">${t(correo)}</a></p>`)}`;
}

export function crear(cuerpo, { datos, cargarFuentes }) {
  cargarFuentes('family=Libertinus+Serif:ital,wght@0,400;0,600;1,400');
  const h = datos.sitio.hojaDeVida;
  cuerpo.innerHTML = `
    <div class="hoja">
      <div class="hoja__barra">
        <a class="btn-amarillo" href="${t(h.pdf)}" download="Hoja de vida - ${t(h.nombre)}.pdf"><span aria-hidden="true">↓</span> DESCARGAR PDF</a>
      </div>
      <div class="hoja__visor hundido" tabindex="0" role="region" aria-label="Hoja de vida de ${t(h.nombre)}">
        <article class="hoja__pagina">${htmlHoja(h, datos.sitio.contacto.correo)}</article>
      </div>
    </div>`;
}
