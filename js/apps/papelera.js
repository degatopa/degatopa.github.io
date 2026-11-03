// Papelera (bocetos): muestra los bocetos de sitio.json o el aviso de que está vacía.
export function crear(cuerpo, { datos }) {
  const { bocetos, vacia } = datos.sitio.papelera;
  cuerpo.innerHTML = '<div class="papelera hundido"></div>';
  const caja = cuerpo.firstElementChild;
  if (!bocetos.length) {
    caja.innerHTML = '<p class="papelera__vacia"></p>';
    caja.firstElementChild.textContent = vacia;
    return;
  }
  caja.innerHTML = '<ul class="papelera__lista"></ul>';
  for (const b of bocetos) {
    const li = document.createElement('li');
    li.innerHTML = '<img loading="lazy" alt=""><span></span>';
    li.querySelector('img').src = b.imagen;
    li.querySelector('img').alt = b.titulo;
    li.querySelector('span').textContent = b.titulo;
    caja.firstElementChild.append(li);
  }
}
