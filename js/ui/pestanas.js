// Pestañas accesibles: clic, flechas izquierda/derecha, Inicio y Fin.
// Espera botones [role="tab"] con aria-controls que apuntan a sus paneles [role="tabpanel"].

export function conectarPestanas(lista, { alCambiar } = {}) {
  const pestanas = [...lista.querySelectorAll('[role="tab"]')];
  const panel = (p) => document.getElementById(p.getAttribute('aria-controls'));

  function activar(pestana, enfocar = false) {
    pestanas.forEach((p) => {
      const activa = p === pestana;
      p.setAttribute('aria-selected', String(activa));
      p.tabIndex = activa ? 0 : -1;
      panel(p).hidden = !activa;
    });
    if (enfocar) pestana.focus();
    alCambiar?.(pestana);
  }

  lista.addEventListener('click', (e) => {
    const p = e.target.closest('[role="tab"]');
    if (p) activar(p);
  });
  lista.addEventListener('keydown', (e) => {
    const i = pestanas.indexOf(document.activeElement);
    if (i < 0) return;
    const destino = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: pestanas.length - 1 }[e.key];
    if (destino === undefined) return;
    e.preventDefault();
    activar(pestanas[(destino + pestanas.length) % pestanas.length], true);
  });

  activar(pestanas.find((p) => p.getAttribute('aria-selected') === 'true') || pestanas[0]);
  return { activar: (indice) => activar(pestanas[indice]) };
}
