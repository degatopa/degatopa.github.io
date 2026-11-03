// Preferencias del visitante (filtro CRT, ruido VHS, sonidos, intro).
// Se guardan en localStorage; si el navegador lo bloquea, el sitio sigue funcionando con los valores por defecto.

const CLAVE = 'dega-os:prefs';
const POR_DEFECTO = {
  crt: true,
  intensidad: 60, // 0 = suave, 100 = fuerte
  vhs: true,
  sonidos: false,
  saltarIntro: false,
  globoVisto: false,
};

function leer() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE)) || {};
  } catch {
    return {};
  }
}

let actual = { ...POR_DEFECTO, ...leer() };
const oyentes = new Set();

export const obtener = () => ({ ...actual });

export function guardar(cambios) {
  actual = { ...actual, ...cambios };
  try {
    localStorage.setItem(CLAVE, JSON.stringify(actual));
  } catch {
    /* almacenamiento bloqueado: se queda solo en memoria */
  }
  aplicar();
  oyentes.forEach((fn) => fn(obtener()));
}

export function suscribir(fn) {
  oyentes.add(fn);
  return () => oyentes.delete(fn);
}

/** Opacidad del filtro para una intensidad de 0 a 100. */
export const opacidadCRT = (intensidad) => (0.25 + (intensidad / 100) * 0.75).toFixed(2);

export function aplicar(estado = actual) {
  const raiz = document.documentElement;
  raiz.classList.toggle('sin-crt', !estado.crt);
  raiz.classList.toggle('sin-vhs', !estado.vhs);
  raiz.style.setProperty('--crt', opacidadCRT(estado.intensidad));
}
