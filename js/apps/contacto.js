// Contacto: "Mensaje nuevo — Escríbeme para tu fecha" y, a su lado, "DEGA Mensajero" con los otros canales.
// El formulario se envía al servicio configurado en data/sitio.json (contacto.formulario.endpoint, por
// ejemplo Formspree). Si no hay servicio, abre el correo del visitante con el mensaje listo (mailto).
import { glifo, icono } from '../ui/pixel.js';
import { t } from '../ui/html.js';

const ID_MENSAJERO = 'mensajero';
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

let n = 0;

function mensajeroHTML(datos) {
  const c = datos.sitio.contacto;
  const m = datos.sitio.mensajero;
  return `
    <div class="mensajero">
      <div class="mensajero__cabeza">
        <span class="logo-d logo-d--grande" aria-hidden="true">D</span>
        <div>
          <p class="mensajero__nombre marca">Dega</p>
          <p class="mensajero__estado"><span class="mensajero__led" aria-hidden="true"></span>${t(m.estado)}</p>
        </div>
      </div>
      <details class="mensajero__canales" open>
        <summary>Otros canales (3)</summary>
        <ul>
          <li>${icono('sobre')}<span>Correo<br><a href="mailto:${t(c.correo)}">${t(c.correo)}</a></span></li>
          <li>${icono('telefono')}<span>WhatsApp<br><a href="${t(c.whatsappUrl)}" target="_blank" rel="noopener">${t(c.whatsapp)}</a></span></li>
          <li>${icono('camara')}<span>Instagram<br><a href="${t(c.instagramUrl)}" target="_blank" rel="noopener">${t(c.instagram)}</a></span></li>
        </ul>
      </details>
      <p class="mensajero__pie">${t(m.pie)}</p>
    </div>`;
}

export function crear(cuerpo, { datos, ventana, wm, esMovil, params }) {
  const id = `msg-${++n}`;
  const c = datos.sitio.contacto;
  let prioridad = false;

  const campo = (nombre, etiqueta, { tipo = 'text', ayuda = '', marcador = '', valor = '', requerido = false, clase = '' } = {}) => `
    <div class="msg__campo ${clase}">
      <label for="${id}-${nombre}">${etiqueta}${requerido ? ' <span class="msg__req" aria-hidden="true">*</span>' : ''}</label>
      <input class="campo" id="${id}-${nombre}" name="${nombre}" type="${tipo}" placeholder="${t(marcador)}" value="${t(valor)}"
        ${requerido ? 'required aria-required="true"' : ''} aria-describedby="${id}-${nombre}-error${ayuda ? ` ${id}-${nombre}-ayuda` : ''}">
      ${ayuda ? `<p class="msg__ayuda" id="${id}-${nombre}-ayuda">${ayuda}</p>` : ''}
      <p class="msg__error" id="${id}-${nombre}-error" aria-live="polite"></p>
    </div>`;

  cuerpo.innerHTML = `
    <form class="msg" novalidate>
      <div class="msg__barra" role="toolbar" aria-label="Mensaje">
        <button type="submit" class="msg__herr msg__herr--fuerte">${glifo('enviar')}<span>Enviar</span></button>
        <span class="herr__separador" aria-hidden="true"></span>
        <button type="button" class="msg__herr" data-accion="cortar">${glifo('cortar')}<span>Cortar</span></button>
        <button type="button" class="msg__herr" data-accion="copiar">${glifo('copiar')}<span>Copiar</span></button>
        <button type="button" class="msg__herr" data-accion="pegar">${glifo('pegar')}<span>Pegar</span></button>
        <span class="herr__separador" aria-hidden="true"></span>
        <button type="button" class="msg__herr" data-accion="adjuntar">${glifo('adjuntar')}<span>Adjuntar</span></button>
        <button type="button" class="msg__herr" data-accion="prioridad" aria-pressed="false">${glifo('prioridad')}<span>Prioridad</span></button>
      </div>

      <div class="msg__cuerpo">
        <div class="msg__fila"><span class="msg__etiqueta" id="${id}-para-e">Para:</span><output class="campo msg__para" aria-labelledby="${id}-para-e">${t(c.correo)}</output></div>
        <div class="msg__fila">${campo('email', 'De:', { tipo: 'email', marcador: 'tu correo', requerido: true, clase: 'msg__campo--fila' })}</div>
        <div class="msg__fila">${campo('asunto', 'Asunto:', { valor: 'Visuales para mi show', clase: 'msg__campo--fila' })}</div>

        <fieldset class="grupo msg__ficha">
          <legend>Ficha del show</legend>
          <div class="msg__rejilla">
            ${campo('artista', 'Artista o banda', { marcador: 'Nombre' })}
            ${campo('fecha', 'Fecha', { tipo: 'date' })}
            ${campo('lugar', 'Lugar', { marcador: 'Ciudad, venue o festival' })}
            ${campo('pantalla', 'Tamaño de pantalla', { marcador: 'Ej.: LED 6 × 3 m, o no sé aún' })}
          </div>
        </fieldset>

        <div class="msg__campo msg__campo--mensaje">
          <label for="${id}-mensaje">Mensaje <span class="msg__req" aria-hidden="true">*</span></label>
          <textarea class="campo" id="${id}-mensaje" name="mensaje" rows="7" required aria-required="true" aria-describedby="${id}-mensaje-error" placeholder="Hola, Dega. Tengo un show y quiero visuales."></textarea>
          <p class="msg__error" id="${id}-mensaje-error" aria-live="polite"></p>
        </div>

        <label class="opcion msg__demo"><input type="checkbox" name="demo"${params.demo ? ' checked' : ''}> Quiero una demo visual de mi canción (${t(datos.sitio.condiciones.demo)}, sin costo)</label>
        ${campo('enlace', 'Enlace a la canción (Drive, WeTransfer, SoundCloud)', { tipo: 'url', marcador: 'https://…', ayuda: 'Pega un enlace en vez de adjuntar el archivo. Es obligatorio si pides la demo.' })}
        <input type="text" name="_gotcha" class="sr-only" tabindex="-1" autocomplete="off" aria-hidden="true">
      </div>

      <div class="msg__abajo">
        <p class="msg__nota">Los campos con * son obligatorios. La ficha del show me ayuda a cotizar más rápido.</p>
        <button type="submit" class="btn-principal msg__enviar">ENVIAR</button>
      </div>
      <p class="explorador__estado" role="status"><span data-estado>Redactando</span></p>
      ${esMovil() ? `<section aria-label="Otros canales">${mensajeroHTML(datos)}</section>` : ''}
    </form>

    <dialog class="dialogo" aria-labelledby="${id}-dlg-t">
      <div class="dialogo__titulo" id="${id}-dlg-t">DEGA Correo</div>
      <div class="dialogo__cuerpo">
        <span class="dialogo__icono" aria-hidden="true">i</span>
        <p data-dialogo></p>
      </div>
      <form method="dialog" class="dialogo__botones"><button class="btn" value="ok">Aceptar</button></form>
    </dialog>`;

  const form = cuerpo.querySelector('form.msg');
  const estado = cuerpo.querySelector('[data-estado]');
  const dialogo = cuerpo.querySelector('dialog');
  const $campo = (nombre) => form.elements[nombre];

  // ---------- Barra de herramientas ----------

  let ultimoCampo = null;
  form.addEventListener('focusin', (e) => {
    if (e.target.matches('input.campo, textarea')) ultimoCampo = e.target;
  });

  form.addEventListener('click', async (e) => {
    const accion = e.target.closest('[data-accion]')?.dataset.accion;
    if (!accion) return;
    const el = ultimoCampo;
    const seleccion = el && el.selectionStart !== null ? el.value.slice(el.selectionStart, el.selectionEnd) : '';
    try {
      if (accion === 'copiar' || accion === 'cortar') {
        if (!seleccion) return (estado.textContent = 'Selecciona un texto primero.');
        await navigator.clipboard.writeText(seleccion);
        if (accion === 'cortar') el.setRangeText('', el.selectionStart, el.selectionEnd, 'end');
        estado.textContent = accion === 'cortar' ? 'Texto cortado.' : 'Texto copiado.';
        el.focus();
      }
      if (accion === 'pegar') {
        if (!el) return (estado.textContent = 'Haz clic en un campo antes de pegar.');
        el.setRangeText(await navigator.clipboard.readText(), el.selectionStart, el.selectionEnd, 'end');
        el.focus();
      }
    } catch {
      estado.textContent = 'El navegador no dejó usar el portapapeles: usa Ctrl+C, Ctrl+X y Ctrl+V.';
    }
    if (accion === 'adjuntar') {
      $campo('enlace').focus();
      estado.textContent = 'En vez de adjuntar archivos, pega el enlace a tu canción.';
    }
    if (accion === 'prioridad') {
      prioridad = !prioridad;
      e.target.closest('button').setAttribute('aria-pressed', String(prioridad));
      estado.textContent = prioridad ? 'Prioridad alta: lo verás marcado como urgente.' : 'Prioridad normal.';
    }
  });

  // ---------- Validación ----------

  function marcarError(nombre, mensaje) {
    const el = $campo(nombre);
    el.setAttribute('aria-invalid', mensaje ? 'true' : 'false');
    form.querySelector(`#${id}-${nombre}-error`).textContent = mensaje;
  }

  function validar() {
    const errores = [];
    const email = $campo('email').value.trim();
    const mensaje = $campo('mensaje').value.trim();
    const enlace = $campo('enlace').value.trim();
    const demo = $campo('demo').checked;
    const revisar = (nombre, mensajeError) => {
      marcarError(nombre, mensajeError || '');
      if (mensajeError) errores.push(nombre);
    };
    revisar('email', !email ? 'Escribe tu correo para poder responderte.' : !CORREO.test(email) ? 'Ese correo no parece válido. Revisa que tenga @ y dominio.' : '');
    revisar('mensaje', mensaje ? '' : 'Cuéntame algo de tu show en el mensaje.');
    let errorEnlace = '';
    if (enlace) {
      try {
        if (!/^https?:$/.test(new URL(enlace).protocol)) throw new Error();
      } catch {
        errorEnlace = 'El enlace debe empezar por https://';
      }
    } else if (demo) {
      errorEnlace = 'Para la demo necesito el enlace a tu canción.';
    }
    revisar('enlace', errorEnlace);
    return errores;
  }

  form.addEventListener('input', (e) => {
    if (e.target.getAttribute('aria-invalid') === 'true') validar();
  });

  // ---------- Envío ----------

  function datosDelFormulario() {
    const f = (n) => $campo(n).value.trim();
    return {
      email: f('email'),
      _replyto: f('email'),
      _subject: `${prioridad ? '[URGENTE] ' : ''}${f('asunto') || 'Visuales para mi show'}`,
      artista: f('artista'),
      fecha: f('fecha'),
      lugar: f('lugar'),
      pantalla: f('pantalla'),
      mensaje: f('mensaje'),
      demo: $campo('demo').checked ? 'Sí' : 'No',
      enlace: f('enlace'),
      prioridad: prioridad ? 'Alta' : 'Normal',
      _gotcha: f('_gotcha'),
    };
  }

  function mostrarDialogo(texto) {
    cuerpo.querySelector('[data-dialogo]').textContent = texto;
    dialogo.showModal();
  }

  function enviarPorCorreo(d) {
    const cuerpoCorreo = [
      d.mensaje,
      '',
      '— Ficha del show —',
      `Artista o banda: ${d.artista || '-'}`,
      `Fecha: ${d.fecha || '-'}`,
      `Lugar: ${d.lugar || '-'}`,
      `Tamaño de pantalla: ${d.pantalla || '-'}`,
      `Demo: ${d.demo}`,
      `Enlace a la canción: ${d.enlace || '-'}`,
      '',
      `Responder a: ${d.email}`,
    ].join('\n');
    location.href = `mailto:${c.correo}?subject=${encodeURIComponent(d._subject)}&body=${encodeURIComponent(cuerpoCorreo)}`;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errores = validar();
    if (errores.length) {
      estado.textContent = `Revisa ${errores.length === 1 ? 'el campo marcado' : `los ${errores.length} campos marcados`}.`;
      $campo(errores[0]).focus();
      return;
    }
    const d = datosDelFormulario();
    if (d._gotcha) return; // trampa para robots

    const endpoint = c.formulario.endpoint;
    if (!endpoint) {
      enviarPorCorreo(d);
      estado.textContent = 'Mensaje listo en tu programa de correo.';
      mostrarDialogo(`Abrí tu programa de correo con el mensaje listo: solo dale Enviar. Respondo en ${c.respuesta}.`);
      return;
    }

    const botones = form.querySelectorAll('[type="submit"]');
    botones.forEach((b) => (b.disabled = true));
    estado.textContent = 'Enviando…';
    try {
      const r = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(d),
      });
      if (!r.ok) throw new Error(String(r.status));
      form.reset();
      prioridad = false;
      form.querySelector('[data-accion="prioridad"]').setAttribute('aria-pressed', 'false');
      estado.textContent = 'Mensaje enviado.';
      mostrarDialogo(`Tu mensaje está en camino. Respondo en ${c.respuesta}.`);
    } catch {
      estado.innerHTML = `No se pudo enviar. Escríbeme directo a <a href="mailto:${t(c.correo)}">${t(c.correo)}</a>.`;
    } finally {
      botones.forEach((b) => (b.disabled = false));
    }
  });

  // Esc cierra solo el diálogo, no la ventana de atrás.
  dialogo.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    e.preventDefault();
    dialogo.close();
  });

  // "Pedir una demo" desde la DEGApedia cuando la ventana ya está abierta.
  ventana.alRecibir = (p) => {
    if (p.demo) {
      $campo('demo').checked = true;
      $campo('enlace').focus();
    }
  };

  if (!esMovil()) {
    ventana.alCerrar.push(() => wm.cerrar(ID_MENSAJERO));
    setTimeout(async () => {
      const ancho = 340;
      await wm.abrir({
        id: ID_MENSAJERO,
        titulo: 'DEGA Mensajero',
        icono: 'bienvenido',
        botones: ['cerrar'],
        ancho,
        alto: 560,
        x: Math.min(ventana.x + ventana.el.offsetWidth + 16, window.innerWidth - ancho - 12),
        y: ventana.y + 56,
        contenido: (cuerpoM) => (cuerpoM.innerHTML = mensajeroHTML(datos)),
      });
      // El mensajero queda en estilo inactivo; el formulario, al frente.
      wm.enfocar(ventana.id);
      if (params.demo) $campo('enlace').focus();
      else $campo('email').focus();
    }, 0);
  }
}
