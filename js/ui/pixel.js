// Íconos pixel art propios. Cada ícono es una cuadrícula de caracteres:
// cada carácter es un color de su paleta y '.' es transparente.
// pixelSVG() la convierte en un <svg> con rectángulos nítidos.

export function pixelSVG({ paleta, filas }, { tam, etiqueta } = {}) {
  const alto = filas.length;
  const ancho = filas[0].length;
  let rects = '';
  filas.forEach((fila, y) => {
    let x = 0;
    while (x < ancho) {
      const c = fila[x];
      let fin = x + 1;
      while (fin < ancho && fila[fin] === c) fin++;
      if (c !== '.' && paleta[c]) {
        rects += `<rect x="${x}" y="${y}" width="${fin - x}" height="1" fill="${paleta[c]}"/>`;
      }
      x = fin;
    }
  });
  const dim = tam ? ` width="${tam}" height="${Math.round((tam * alto) / ancho)}"` : '';
  const a11y = etiqueta ? ` role="img" aria-label="${etiqueta}"` : ' aria-hidden="true" focusable="false"';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ancho} ${alto}"${dim}${a11y} shape-rendering="crispEdges">${rects}</svg>`;
}

const VACIA = '................';

export const ICONOS = {
  reel: {
    paleta: { k: '#14141B', g: '#3A3A46', w: '#F3EDDA', r: '#E30613' },
    filas: [
      VACIA, VACIA,
      '.kkkkkkkkkkkkkk.',
      '.kggggggggggggk.',
      '.kwwwwwwwwwwwwk.',
      '.krrrrrrrrrrrrk.',
      '.kwwwwwwwwwwwwk.',
      '.kggggggggggggk.',
      '.kkkkkkkkkkkkkk.',
      '.kkkwwwkkwwwkkk.',
      '.kkkkkkkkkkkkkk.',
      '.kkkkkkkkkkkkkk.',
      '..kkkkkkkkkkkk..',
      VACIA, VACIA, VACIA,
    ],
  },
  carpeta: {
    paleta: { d: '#8A5A12', Y: '#E2A93A', h: '#FFE08A', y: '#F2C14E' },
    filas: [
      VACIA, VACIA,
      '.ddddd..........',
      '.dYYYYd.........',
      '.dYYYYYdddddddd.',
      '.dYYYYYYYYYYYYd.',
      '.dhhhhhhhhhhhhd.',
      '.dyyyyyyyyyyyyd.',
      '.dyyyyyyyyyyyyd.',
      '.dyyyyyyyyyyyyd.',
      '.dyyyyyyyyyyyyd.',
      '.dyyyyyyyyyyyyd.',
      '.dddddddddddddd.',
      VACIA, VACIA, VACIA,
    ],
  },
  documento: {
    paleta: { k: '#404040', w: '#FFFFFF', b: '#0000E8', l: '#9A9A9A', g: '#39D353' },
    filas: [
      VACIA,
      '..kkkkkkkkkkk...',
      '..kwwwwwwwwwk...',
      '..kwbbbbwgggk...',
      '..kwwwwwwgggk...',
      '..kwllllllllk...',
      '..kwwwwwwwwwk...',
      '..kwllllllllk...',
      '..kwwwwwwwwwk...',
      '..kwlllllwwwk...',
      '..kwwwwwwwwwk...',
      '..kwllllllllk...',
      '..kwwwwwwwwwk...',
      '..kkkkkkkkkkk...',
      VACIA, VACIA,
    ],
  },
  cd: {
    paleta: { o: '#8A8A8A', s: '#D9D9D9', w: '#FFFFFF', p: '#F7B6C2', u: '#AFC0FF', h: '#808080', k: '#111111' },
    filas: [
      VACIA,
      '.....oooooo.....',
      '...oosssswwoo...',
      '..ospsssswwuuo..',
      '..oppsssswuuuo..',
      '.opppssssuuuuso.',
      '.oppppshhsuuuso.',
      '.opppphkkhuuwso.',
      '.osppphkkhwwsso.',
      '.ossspshhsswsso.',
      '.owwsssssssuuso.',
      '..owwsssuuuuso..',
      '..owssuuuussso..',
      '...oouuuussoo...',
      '.....oooooo.....',
      VACIA,
    ],
  },
  cuadro: {
    paleta: { f: '#5A3A1A', F: '#8B5A2B', c: '#F3EDDA', y: '#FFE500', b: '#0000E8' },
    filas: [
      VACIA, VACIA,
      '.ffffffffffffff.',
      '.fFFFFFFFFFFFFf.',
      '.fFccccccccccFf.',
      '.fFcccccccyycFf.',
      '.fFcccccccyycFf.',
      '.fFccccccccccFf.',
      '.fFccccbbbcccFf.',
      '.fFcbbbbbbbbcFf.',
      '.fFcbbbbbbbbcFf.',
      '.fFccccccccccFf.',
      '.fFFFFFFFFFFFFf.',
      '.ffffffffffffff.',
      VACIA, VACIA,
    ],
  },
  ficha: {
    paleta: { k: '#404040', r: '#E30613', w: '#FFFFFF', b: '#0000E8', g: '#808080' },
    filas: [
      VACIA, VACIA, VACIA,
      '.kkkkkkkkkkkkkk.',
      '.krrrrrrrrrrrrk.',
      '.kwwwwwwwwwwwwk.',
      '.kwbbbbwwwwwwwk.',
      '.kwbwwbwgggggwk.',
      '.kwbwwbwwwwwwwk.',
      '.kwbbbbwgggwwwk.',
      '.kwwwwwwwwwwwwk.',
      '.kkkkkkkkkkkkkk.',
      VACIA, VACIA, VACIA, VACIA,
    ],
  },
  sobre: {
    paleta: { k: '#606060', w: '#F3EDDA', R: '#E30613' },
    filas: [
      VACIA, VACIA, VACIA,
      '.kkkkkkkkkkkkkk.',
      '.kkwwwwwwwwRRkk.',
      '.kwkwwwwwwwRRwk.',
      '.kwwkwwwwwwkwwk.',
      '.kwwwkwwwwkwwwk.',
      '.kwwwwkwwkwwwwk.',
      '.kwwwwwkkwwwwwk.',
      '.kwwwwwwwwwwwwk.',
      '.kwwwwwwwwwwwwk.',
      '.kkkkkkkkkkkkkk.',
      VACIA, VACIA, VACIA,
    ],
  },
  monitor: {
    paleta: { g: '#C8C4BC', k: '#404040', b: '#0000E8', B: '#3355FF', L: '#39D353' },
    filas: [
      VACIA, VACIA,
      '.gggggggggggggg.',
      '.gkkkkkkkkkkkkg.',
      '.gkbbbbbbbbbbkg.',
      '.gkbBBBBBBBBbkg.',
      '.gkbbbbbbbbbbkg.',
      '.gkbBBBBBBBBbkg.',
      '.gkbbbbbbbbbbkg.',
      '.gkkkkkkkkkkkkg.',
      '.ggggggggggggLg.',
      '......gggg......',
      '....gggggggg....',
      VACIA, VACIA, VACIA,
    ],
  },
  bienvenido: {
    paleta: { k: '#111111', y: '#FFE500' },
    filas: [
      VACIA, VACIA,
      '..kkkkkkkkkkkk..',
      '..kyyyyyyyyyyk..',
      '..kyyyyyyyyyyk..',
      '..kyyyyyyyyyyk..',
      '..kyyyyyyyyyyk..',
      '..kyyyyyyyyyyk..',
      '..kyyyyyyyyyyk..',
      '..kyyyyyyyyyyk..',
      '..kyyyyyyyyyyk..',
      '..kyyyyyyyyyyk..',
      '..kkkkkkkkkkkk..',
      VACIA, VACIA, VACIA,
    ],
  },
  apagar: {
    paleta: { r: '#E30613', k: '#7A0008' },
    filas: [
      VACIA,
      '.......rr.......',
      '...rr..rr..rr...',
      '..rr...rr...rr..',
      '.rr....rr....rr.',
      '.rr....rr....rr.',
      '.rr....rr....rr.',
      '.rr..........rr.',
      '.rr..........rr.',
      '..rr........rr..',
      '...rr......rr...',
      '....rrrrrrrr....',
      VACIA, VACIA, VACIA, VACIA,
    ],
  },
  telefono: {
    paleta: { k: '#222222', g: '#39D353', w: '#DFFFE4' },
    filas: [
      VACIA,
      '.....kkkkkk.....',
      '.....kggggk.....',
      '.....kwwwwk.....',
      '.....kwwwwk.....',
      '.....kwwwwk.....',
      '.....kwwwwk.....',
      '.....kwwwwk.....',
      '.....kggggk.....',
      '.....kgkkgk.....',
      '.....kggggk.....',
      '.....kkkkkk.....',
      VACIA, VACIA, VACIA, VACIA,
    ],
  },
  camara: {
    paleta: { k: '#222222', r: '#E30613', w: '#F3EDDA', b: '#0000E8' },
    filas: [
      VACIA, VACIA,
      '.....kkkk.......',
      '..kkkkkkkkkkkk..',
      '..krrrrrrrrrrk..',
      '..kwwwkkkkwwwk..',
      '..kwwkbbbbkwwk..',
      '..kwwkbbbbkwwk..',
      '..kwwkbbbbkwwk..',
      '..kwwwkkkkwwwk..',
      '..kwwwwwwwwwwk..',
      '..kkkkkkkkkkkk..',
      VACIA, VACIA, VACIA, VACIA,
    ],
  },
  simple: {
    paleta: { k: '#404040', w: '#FFFFFF', l: '#111111' },
    filas: [
      VACIA,
      '..kkkkkkkkkkk...',
      '..kwwwwwwwwwk...',
      '..kwllllllwwk...',
      '..kwwwwwwwwwk...',
      '..kwlllllllwk...',
      '..kwlllllwwwk...',
      '..kwlllllllwk...',
      '..kwwwwwwwwwk...',
      '..kwllllllwwk...',
      '..kwlllllllwk...',
      '..kwwwwwwwwwk...',
      '..kkkkkkkkkkk...',
      VACIA, VACIA, VACIA,
    ],
  },
};

// Glifos de los botones de la barra de título (en negro sobre gris).
const N = { k: '#000000' };
export const GLIFOS = {
  minimizar: { paleta: N, filas: ['........', '........', '........', '........', '........', 'kkkkkk..', 'kkkkkk..'] },
  maximizar: { paleta: N, filas: ['kkkkkkkkk', 'kkkkkkkkk', 'k.......k', 'k.......k', 'k.......k', 'k.......k', 'k.......k', 'kkkkkkkkk'] },
  restaurar: { paleta: N, filas: ['..kkkkkk', '..kkkkkk', '..k....k', 'kkkkkk.k', 'kkkkkk.k', 'k....kkk', 'k....k..', 'kkkkkk..'] },
  cerrar: { paleta: N, filas: ['kk....kk', '.kk..kk.', '..kkkk..', '...kk...', '..kkkk..', '.kk..kk.', 'kk....kk'] },
  atras: { paleta: N, filas: ['...kk...', '..kk....', '.kk.....', 'kkkkkkkk', '.kk.....', '..kk....', '...kk...'] },
  adelante: { paleta: N, filas: ['...kk...', '....kk..', '.....kk.', 'kkkkkkkk', '.....kk.', '....kk..', '...kk...'] },
  arriba: { paleta: N, filas: ['...kk...', '..kkkk..', '.kkkkkk.', 'kk.kk.kk', '...kk...', '...kk...', '...kk...'] },
  lupa: { paleta: N, filas: ['.kkkk....', 'kk..kk...', 'k....k...', 'k....k...', 'kk..kk...', '.kkkkkk..', '.....kkk.', '......kkk', '.......k.'] },
  vistas: { paleta: { b: '#0000E8' }, filas: ['bbb.bbb', 'bbb.bbb', 'bbb.bbb', '.......', 'bbb.bbb', 'bbb.bbb', 'bbb.bbb'] },
  ayuda: { paleta: N, filas: ['.kkkk.', 'kk..kk', '....kk', '...kk.', '..kk..', '......', '..kk..'] },
  // Controles del reproductor
  anterior: { paleta: N, filas: ['kk....k', 'kk...kk', 'kk..kkk', 'kk.kkkk', 'kk..kkk', 'kk...kk', 'kk....k'] },
  siguiente: { paleta: N, filas: ['k....kk', 'kk...kk', 'kkk..kk', 'kkkk.kk', 'kkk..kk', 'kk...kk', 'k....kk'] },
  play: { paleta: N, filas: ['k....', 'kk...', 'kkk..', 'kkkk.', 'kkk..', 'kk...', 'k....'] },
  pausa: { paleta: N, filas: ['kk.kk', 'kk.kk', 'kk.kk', 'kk.kk', 'kk.kk', 'kk.kk', 'kk.kk'] },
  stop: { paleta: N, filas: ['kkkkkk', 'kkkkkk', 'kkkkkk', 'kkkkkk', 'kkkkkk', 'kkkkkk'] },
  // Barra del mensaje nuevo
  enviar: { paleta: N, filas: ['k........', 'kkk......', 'k.kkk....', 'k...kkk..', 'k.....kkk', 'k...kkk..', 'k.kkk....', 'kkk......', 'k........'] },
  cortar: { paleta: N, filas: ['.k.....k.', '..k...k..', '...k.k...', '....k....', '...k.k...', '.kkk.kkk.', 'k..k.k..k', 'k..k.k..k', '.kk...kk.'] },
  copiar: { paleta: N, filas: ['kkkkk...', 'k...k...', 'k..kkkkk', 'k..k...k', 'kkkk...k', '...k...k', '...k...k', '...kkkkk'] },
  pegar: { paleta: N, filas: ['..kkkk..', 'kkk..kkk', 'k......k', 'k.kkkk.k', 'k......k', 'k.kkkk.k', 'k......k', 'kkkkkkkk'] },
  adjuntar: { paleta: N, filas: ['..kkk..', '.k...k.', '.k.k.k.', '.k.k.k.', '.k.k.k.', '.k.k.k.', '.k...k.', '..kkk..'] },
  prioridad: { paleta: { r: '#E30613' }, filas: ['.rr.', '.rr.', '.rr.', '.rr.', '.rr.', '....', '.rr.', '.rr.'] },
  expulsar: { paleta: N, filas: ['...k...', '..kkk..', '.kkkkk.', 'kkkkkkk', '.......', 'kkkkkkk', 'kkkkkkk'] },
  completa: { paleta: N, filas: ['kkk...kkk', 'k.......k', 'k.......k', '.........', '.........', '.........', 'k.......k', 'k.......k', 'kkk...kkk'] },
  volumen: { paleta: N, filas: ['...k.....', '..kk..k..', 'kkkk...k.', 'kkkk.k.k.', 'kkkk...k.', '..kk..k..', '...k.....'] },
  silencio: { paleta: N, filas: ['...k.....', '..kk.....', 'kkkk.k..k', 'kkkk..kk.', 'kkkk.k..k', '..kk.....', '...k.....'] },
};

export const icono = (nombre, opciones) => pixelSVG(ICONOS[nombre] || ICONOS.documento, opciones);
export const glifo = (nombre) => pixelSVG(GLIFOS[nombre]);
