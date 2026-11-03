// Utilidades para armar HTML a partir de los textos de los JSON.

/** Escapa texto antes de meterlo en una plantilla HTML. */
export const t = (texto = '') =>
  String(texto).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/** Recuadro de reemplazo para una imagen que todavía no existe. */
export const marcador = (texto, clase = '') => `<div class="marcador ${clase}" role="img" aria-label="${t(texto)}"><span>${t(texto)}</span></div>`;
