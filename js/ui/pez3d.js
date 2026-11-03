// Visor 3D mínimo, sin librerías, para el pez Dega (assets/dega/dega.glb, hecho en Blender).
// Lee un GLB de una sola malla con textura, lo dibuja con WebGL a baja resolución (look de los 2000)
// y lo anima nadando: balanceo, flote y aleteo de la cola. Con movimiento reducido queda quieto.

const VS = `
attribute vec3 aPos;
attribute vec3 aNor;
attribute vec2 aUv;
uniform mat4 uMvp;
uniform mat4 uModelo;
uniform float uTiempo;
uniform float uAleteo;
varying vec2 vUv;
varying float vLuz;
void main() {
  vec3 p = aPos;
  // La cola (x negativa) se mueve más que la cabeza (x positiva).
  float cola = clamp((0.6 - p.x) / 1.8, 0.0, 1.0);
  p.z += sin(uTiempo * 7.0 - p.x * 2.5) * 0.16 * cola * cola * uAleteo;
  vec3 n = normalize(mat3(uModelo) * aNor);
  vLuz = 0.55 + 0.6 * max(dot(n, normalize(vec3(0.3, 0.7, 0.8))), 0.0);
  vUv = aUv;
  gl_Position = uMvp * vec4(p, 1.0);
}`;

const FS = `
precision mediump float;
uniform sampler2D uTextura;
varying vec2 vUv;
varying float vLuz;
void main() {
  vec4 c = texture2D(uTextura, vUv);
  gl_FragColor = vec4(c.rgb * vLuz, 1.0);
}`;

// ---------- Matrices 4×4 (columna mayor, como WebGL) ----------

const multiplicar = (a, b) => {
  const r = new Float32Array(16);
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++)
      r[j * 4 + i] = a[i] * b[j * 4] + a[4 + i] * b[j * 4 + 1] + a[8 + i] * b[j * 4 + 2] + a[12 + i] * b[j * 4 + 3];
  return r;
};
const perspectiva = (fov, aspecto, cerca, lejos) => {
  const f = 1 / Math.tan(fov / 2);
  const d = 1 / (cerca - lejos);
  return new Float32Array([f / aspecto, 0, 0, 0, 0, f, 0, 0, 0, 0, (lejos + cerca) * d, -1, 0, 0, 2 * lejos * cerca * d, 0]);
};
const trasladar = (x, y, z) => new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]);
const rotarY = (a) => new Float32Array([Math.cos(a), 0, -Math.sin(a), 0, 0, 1, 0, 0, Math.sin(a), 0, Math.cos(a), 0, 0, 0, 0, 1]);
const rotarX = (a) => new Float32Array([1, 0, 0, 0, 0, Math.cos(a), Math.sin(a), 0, 0, -Math.sin(a), Math.cos(a), 0, 0, 0, 0, 1]);
const rotarZ = (a) => new Float32Array([Math.cos(a), Math.sin(a), 0, 0, -Math.sin(a), Math.cos(a), 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

// ---------- GLB ----------

async function leerGLB(url) {
  const datos = await (await fetch(url)).arrayBuffer();
  const vista = new DataView(datos);
  const largoJSON = vista.getUint32(12, true);
  const json = JSON.parse(new TextDecoder().decode(new Uint8Array(datos, 20, largoJSON)));
  const inicioBin = 20 + largoJSON + 8;
  const bin = datos.slice(inicioBin); // copia alineada en 0, para poder usar Float32Array
  const TIPOS = { 5126: Float32Array, 5123: Uint16Array, 5125: Uint32Array, 5121: Uint8Array };
  const COMPONENTES = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
  const accesor = (i) => {
    const a = json.accessors[i];
    const bv = json.bufferViews[a.bufferView];
    return new TIPOS[a.componentType](bin, bv.byteOffset + (a.byteOffset || 0), a.count * COMPONENTES[a.type]);
  };
  const prim = json.meshes[0].primitives[0];
  const material = json.materials[prim.material];
  const imagen = json.images[json.textures[material.pbrMetallicRoughness.baseColorTexture.index].source];
  const bvImagen = json.bufferViews[imagen.bufferView];
  const textura = await createImageBitmap(new Blob([new Uint8Array(bin, bvImagen.byteOffset, bvImagen.byteLength)], { type: imagen.mimeType }));
  return {
    posiciones: accesor(prim.attributes.POSITION),
    normales: accesor(prim.attributes.NORMAL),
    uvs: accesor(prim.attributes.TEXCOORD_0),
    indices: accesor(prim.indices),
    textura,
  };
}

/**
 * Dibuja el pez en el canvas y lo anima.
 * @returns {Promise<{ animar: (intensidad: number) => void, destruir: () => void } | null>}  null si no hay WebGL
 */
export async function crearPez(canvas, url, { quieto = false } = {}) {
  const gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: false });
  if (!gl) return null;
  const malla = await leerGLB(url);

  const compilar = (tipo, fuente) => {
    const s = gl.createShader(tipo);
    gl.shaderSource(s, fuente);
    gl.compileShader(s);
    return s;
  };
  const programa = gl.createProgram();
  gl.attachShader(programa, compilar(gl.VERTEX_SHADER, VS));
  gl.attachShader(programa, compilar(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(programa);
  gl.useProgram(programa);

  const atributo = (nombre, datos, tamano) => {
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, datos, gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(programa, nombre);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, tamano, gl.FLOAT, false, 0, 0);
  };
  atributo('aPos', malla.posiciones, 3);
  atributo('aNor', malla.normales, 3);
  atributo('aUv', malla.uvs, 2);
  const ib = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, malla.indices, gl.STATIC_DRAW);

  // Textura con filtro "nearest": píxeles visibles, como un juego de los 2000.
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, malla.textura);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const u = (n) => gl.getUniformLocation(programa, n);
  const uMvp = u('uMvp');
  const uModelo = u('uModelo');
  const uTiempo = u('uTiempo');
  const uAleteo = u('uAleteo');
  gl.enable(gl.DEPTH_TEST);
  // Las caras del modelo no tienen un sentido uniforme: se dibujan las dos.
  gl.disable(gl.CULL_FACE);

  let emocion = 0; // sube cuando Dega habla y vuelve a 0 sola
  let cuadro = 0;
  const inicio = performance.now();

  function dibujar(ahora) {
    const t = quieto ? 0.6 : (ahora - inicio) / 1000;
    emocion = Math.max(0, emocion - 0.01);
    const giro = -0.55 + Math.sin(t * 0.7) * 0.35;
    const modelo = multiplicar(
      trasladar(0, Math.sin(t * 1.6) * 0.08 + emocion * Math.abs(Math.sin(t * 9)) * 0.12, 0),
      multiplicar(rotarY(giro), multiplicar(rotarZ(Math.sin(t * 1.1) * 0.08), rotarX(0.12))),
    );
    const vista = trasladar(0, 0, -3.4);
    const proyeccion = perspectiva(0.75, canvas.width / canvas.height, 0.1, 20);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(uMvp, false, multiplicar(proyeccion, multiplicar(vista, modelo)));
    gl.uniformMatrix4fv(uModelo, false, modelo);
    gl.uniform1f(uTiempo, t);
    gl.uniform1f(uAleteo, quieto ? 0 : 1 + emocion * 2);
    gl.drawElements(gl.TRIANGLES, malla.indices.length, gl.UNSIGNED_SHORT, 0);
    if (!quieto) cuadro = requestAnimationFrame(dibujar);
  }
  dibujar(performance.now());

  return {
    /** Un saltito y aleteo más rápido, por ejemplo cuando Dega empieza a hablar. */
    animar(intensidad = 1) {
      emocion = Math.min(1, intensidad);
      if (quieto) dibujar(performance.now());
    },
    destruir() {
      cancelAnimationFrame(cuadro);
    },
  };
}
