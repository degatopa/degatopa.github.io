// Árbol desplegable accesible (role="tree"): flechas para moverse, derecha/izquierda para abrir
// y cerrar, Enter para abrir un enlace o alternar un grupo.
import { icono } from './pixel.js';
import { t } from './html.js';

/**
 * @param {HTMLElement} contenedor
 * @param {{ raiz: string, grupos: { grupo: string, icono?: string, items: (string|{texto: string, ruta: string})[] }[], etiqueta: string }} o
 */
export function crearArbol(contenedor, { raiz, grupos, etiqueta }) {
  const hoja = (item) =>
    typeof item === 'string'
      ? `<li role="treeitem" tabindex="-1" class="arbol__hoja">${t(item)}</li>`
      : `<li role="treeitem" tabindex="-1" class="arbol__hoja"><a href="#/${t(item.ruta)}" tabindex="-1">${t(item.texto)}</a></li>`;

  contenedor.innerHTML = `
    <ul class="arbol" role="tree" aria-label="${t(etiqueta)}">
      <li role="treeitem" aria-expanded="true" tabindex="0" class="arbol__raiz">
        <span class="arbol__fila"><span class="arbol__cuadro" aria-hidden="true"></span><b>${t(raiz)}</b></span>
        <ul role="group">
          ${grupos.map((g) => `
            <li role="treeitem" aria-expanded="true" tabindex="-1" class="arbol__grupo">
              <span class="arbol__fila"><span class="arbol__signo" aria-hidden="true"></span>${g.icono ? icono(g.icono) : ''}${t(g.grupo)}</span>
              <ul role="group">${g.items.map(hoja).join('')}</ul>
            </li>`).join('')}
        </ul>
      </li>
    </ul>`;

  const arbol = contenedor.querySelector('.arbol');
  const visibles = () =>
    [...arbol.querySelectorAll('[role="treeitem"]')].filter((el) => !el.parentElement.closest('[aria-expanded="false"]'));

  function enfocar(el) {
    arbol.querySelectorAll('[role="treeitem"]').forEach((i) => (i.tabIndex = -1));
    el.tabIndex = 0;
    el.focus();
  }
  const alternar = (el) => el.hasAttribute('aria-expanded') && el.setAttribute('aria-expanded', String(el.getAttribute('aria-expanded') !== 'true'));

  arbol.addEventListener('click', (e) => {
    const fila = e.target.closest('.arbol__fila');
    const item = e.target.closest('[role="treeitem"]');
    if (fila && item && item.closest('.arbol__raiz') !== item) alternar(item);
    if (item) enfocar(item);
  });

  arbol.addEventListener('keydown', (e) => {
    const item = e.target.closest('[role="treeitem"]');
    if (!item) return;
    const lista = visibles();
    const i = lista.indexOf(item);
    const abierto = item.getAttribute('aria-expanded');
    switch (e.key) {
      case 'ArrowDown': enfocar(lista[Math.min(i + 1, lista.length - 1)]); break;
      case 'ArrowUp': enfocar(lista[Math.max(i - 1, 0)]); break;
      case 'Home': enfocar(lista[0]); break;
      case 'End': enfocar(lista[lista.length - 1]); break;
      case 'ArrowRight':
        if (abierto === 'false') item.setAttribute('aria-expanded', 'true');
        else if (abierto === 'true') enfocar(lista[i + 1]);
        break;
      case 'ArrowLeft':
        if (abierto === 'true' && !item.classList.contains('arbol__raiz')) item.setAttribute('aria-expanded', 'false');
        else if (item.parentElement.closest('[role="treeitem"]')) enfocar(item.parentElement.closest('[role="treeitem"]'));
        break;
      case 'Enter':
      case ' ':
        if (item.querySelector(':scope > a')) item.querySelector(':scope > a').click();
        else alternar(item);
        break;
      default:
        return;
    }
    e.preventDefault();
  });
}
