// Propiedades de pantalla: configura el filtro CRT, el ruido VHS y los sonidos del sistema.
// Los cambios se ven en el monitor de muestra y se guardan al Aplicar o Aceptar.
let n = 0;

export function crear(cuerpo, { prefs, wm, ventana }) {
  const id = `pantalla-${++n}`;
  let borrador = prefs.obtener();

  cuerpo.innerHTML = `
    <div class="pantalla">
      <div class="pestanas" role="tablist" aria-label="Propiedades de pantalla">
        <button type="button" class="pestana" role="tab" id="${id}-tab" aria-selected="true" aria-controls="${id}-panel">Efectos retro</button>
      </div>
      <div class="panel-pestana pantalla__panel" role="tabpanel" id="${id}-panel" aria-labelledby="${id}-tab">
        <div class="monitor" aria-hidden="true">
          <div class="monitor__vidrio">
            <div class="monitor__mini monitor__mini--oscura"></div>
            <div class="monitor__mini"></div>
            <div class="monitor__crt"></div>
          </div>
          <span class="monitor__led"></span>
        </div>

        <fieldset class="grupo">
          <legend>Filtro de pantalla antigua</legend>
          <label class="opcion opcion--fuerte"><input type="checkbox" name="crt"> Activar filtro CRT (líneas de barrido, curvatura y viñeta)</label>
          <div class="deslizador">
            <label for="${id}-intensidad">Intensidad</label>
            <span aria-hidden="true">Suave</span>
            <input type="range" id="${id}-intensidad" name="intensidad" min="0" max="100" step="5" aria-valuetext="">
            <span aria-hidden="true">Fuerte</span>
          </div>
          <label class="opcion"><input type="checkbox" name="vhs"> Ruido VHS en los videos</label>
          <label class="opcion"><input type="checkbox" name="sonidos"> Sonidos del sistema (clics y ventanas)</label>
          <p class="nota">Se guarda en este navegador. Si tu equipo es lento, apágalo.</p>
          <p class="nota nota--ayuda" hidden>El filtro CRT imita una pantalla de tubo: líneas de barrido, bordes curvos y oscuros. También lo enciendes o apagas con el LED «CRT» de la barra de tareas.</p>
        </fieldset>
      </div>
      <div class="pantalla__acciones">
        <button type="button" class="btn" data-accion="aceptar">Aceptar</button>
        <button type="button" class="btn" data-accion="cancelar">Cancelar</button>
        <button type="button" class="btn" data-accion="aplicar" disabled>Aplicar</button>
      </div>
    </div>`;

  const campo = (nombre) => cuerpo.querySelector(`[name="${nombre}"]`);
  const crtMuestra = cuerpo.querySelector('.monitor__crt');
  const aplicarBoton = cuerpo.querySelector('[data-accion="aplicar"]');

  function pintar() {
    campo('crt').checked = borrador.crt;
    campo('intensidad').value = borrador.intensidad;
    campo('intensidad').disabled = !borrador.crt;
    campo('intensidad').setAttribute('aria-valuetext', `${borrador.intensidad} de 100`);
    campo('vhs').checked = borrador.vhs;
    campo('sonidos').checked = borrador.sonidos;
    crtMuestra.hidden = !borrador.crt;
    crtMuestra.style.opacity = prefs.opacidadCRT(borrador.intensidad);
    const guardado = prefs.obtener();
    aplicarBoton.disabled = ['crt', 'intensidad', 'vhs', 'sonidos'].every((k) => guardado[k] === borrador[k]);
  }

  cuerpo.querySelector('.grupo').addEventListener('input', (e) => {
    const { name, type, checked, value } = e.target;
    borrador = { ...borrador, [name]: type === 'checkbox' ? checked : Number(value) };
    pintar();
  });

  cuerpo.querySelector('.pantalla__acciones').addEventListener('click', (e) => {
    const accion = e.target.closest('[data-accion]')?.dataset.accion;
    if (accion === 'aplicar' || accion === 'aceptar') {
      const { crt, intensidad, vhs, sonidos } = borrador;
      prefs.guardar({ crt, intensidad, vhs, sonidos });
      pintar();
    }
    if (accion === 'aceptar' || accion === 'cancelar') wm.cerrar(ventana.id);
  });

  // Si el LED de la barra cambia el filtro mientras la ventana está abierta, el formulario lo refleja.
  const dejar = prefs.suscribir((estado) => {
    borrador = { ...borrador, crt: estado.crt };
    pintar();
  });
  ventana.alCerrar.push(dejar);

  ventana.el.addEventListener('ayuda', () => {
    const ayuda = cuerpo.querySelector('.nota--ayuda');
    ayuda.hidden = !ayuda.hidden;
  });

  pintar();
}
