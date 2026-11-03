// Ventana provisional para las secciones que llegan en fases siguientes.
export function crear(cuerpo, { def, ventana }) {
  cuerpo.innerHTML = `
    <div class="obra hundido">
      <p class="obra__titulo">EN CONSTRUCCIÓN_</p>
      <p class="obra__texto"></p>
      <p class="obra__fase">Llega en la fase ${def.fase}.</p>
    </div>`;
  cuerpo.querySelector('.obra__texto').textContent = ventana.titulo;
}
