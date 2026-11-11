// Editor.exe: edita el contenido de data/*.json desde el propio DEGA OS.
// Muestra cada sección como un formulario, marca en rojo lo que falta llenar (textos entre [corchetes])
// y guarda a través del servidor local (scripts/servir.mjs). Solo existe en tu computador.
import { t } from '../ui/html.js';

const ARCHIVOS = ['sitio', 'proyectos', 'software', 'titulos'];
const PENDIENTE = /\[[^\]]*\]/;
const CLAVE_NODO = 'dega-os:editor-nodo';

const ETIQUETAS = {
  titulo: 'Título', rec: 'Línea pequeña de arriba', titular: 'Titular grande', texto: 'Texto',
  botonPrincipal: 'Botón principal', botonSecundario: 'Botón secundario', creditos: 'Créditos',
  archivo: 'Nombre de archivo que se muestra', video: 'Nombre del video (en assets/videos)', artista: 'Artista',
  tipo: 'Tipo (se ve debajo del nombre)', filtro: 'Categoría', fecha: 'Fecha o año', reconocimiento: 'Reconocimiento o premio',
  idea: 'La idea', rol: 'Mi rol', herramientas: 'Herramientas usadas', operacion: 'Operación', pantalla: 'Pantalla',
  frase: 'Lo que dijo la banda', fotos: 'Fotos', src: 'Archivo (por ejemplo assets/fotos/foto.webp)', alt: 'Descripción de la foto',
  nombre: 'Nombre', etiqueta: 'Etiqueta', tag: 'Etiqueta corta', uso: 'Para qué lo uso', desde: 'Desde (año)',
  color: 'Color de la carátula', tinta: 'Color del texto', encabezado: 'Encabezado del cuadro', corto: 'Texto de la placa',
  institucion: 'Institución', placa: 'Nombre corto para la placa', anio: 'Año', imagen: 'Imagen (ruta, por ejemplo assets/titulos/diploma.webp)',
  linea: 'Línea personal', pared: 'Pared (fondo, izquierda o derecha)', destacado: 'Cuadro destacado (más grande)', reservado: 'Marco reservado (vacío)',
  detalle: 'Detalle', foto: 'Foto (ruta, por ejemplo assets/fotos/dega.webp)', pieFoto: 'Pie de la foto',
  aviso: 'Aviso de prototipo (bórralo cuando los textos estén listos)', ultimaEdicion: 'Última edición',
  introduccion: 'Introducción', secciones: 'Secciones', ficha: 'Ficha', fichaTecnica: 'Ficha técnica', campo: 'Campo', valor: 'Valor',
  referencias: 'Referencias', categorias: 'Categorías', historial: 'Historial', bio: 'Biografía', dossier: 'Dossier (ruta del PDF)',
  dispositivos: 'Trayectoria (premios, estudios, shows…)', acerca: 'Acerca de esta página', pdf: 'Archivo PDF', grupo: 'Grupo', items: 'Elementos', icono: 'Ícono', correo: 'Correo',
  whatsapp: 'WhatsApp', whatsappUrl: 'Enlace de WhatsApp', instagram: 'Instagram', instagramUrl: 'Enlace de Instagram',
  respuesta: 'Tiempo de respuesta', disponible: 'Disponible desde', formulario: 'Formulario', servicio: 'Servicio',
  endpoint: 'Dirección de Formspree', nota: 'Nota', estado: 'Estado', pie: 'Pie', lineas: 'Líneas del registro', lema: 'Lema',
  consejos: 'Consejos por sección', modelo: 'Modelo 3D', menu: 'Pregunta del menú', crt: 'Aviso del filtro CRT', base: 'Base',
  condiciones: 'Condiciones', cambios: 'Rondas de cambios', demo: 'Demo', otros: 'Colectivos y proyectos', descripcion: 'Descripción',
  url: 'Dirección del sitio', sistema: 'Sistema', registradoA: 'Registrado a', equipo: 'Equipo',
  direccion: 'Dirección (barra del navegador)', subtitulo: 'Subtítulo', boton: 'Botón', veaseTambien: 'Véase también',
  ruta: 'Sección del sitio a la que lleva', paleta: 'Paleta', piePaleta: 'Pie de la paleta', fuente: 'Fuente', sala: 'Nombre de la sala',
  bocetos: 'Bocetos', vacia: 'Texto cuando está vacía', id: 'Identificador (se usa en la dirección)', base_videos: 'Carpeta o URL de los videos',
};
const LARGOS = new Set(['idea', 'texto', 'frase', 'linea', 'nota', 'descripcion', 'aviso', 'bio', 'introduccion', 'uso', 'pie', 'estado', 'crt', 'creditos', 'consejos']);
// Campos que pueden no aplicar a un proyecto: se marcan con "No aplica" y se guardan como null.
const NULABLES = new Set(['operacion', 'pantalla', 'frase', 'reconocimiento']);
const PLANTILLAS = {
  fotos: { src: '', alt: '' },
  creditos: { rol: '', nombre: '' },
  bocetos: { imagen: '', titulo: '' },
  referencias: { titulo: '', fuente: '', ruta: '' },
  historial: { fecha: '', texto: '' },
  ficha: { campo: '', valor: '' },
  fichaTecnica: { campo: '', valor: '' },
};

const humanizar = (k) => ETIQUETAS[k] || String(k).replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
const tienePendiente = (v) =>
  typeof v === 'string' ? PENDIENTE.test(v) : v && typeof v === 'object' ? Object.values(v).some(tienePendiente) : false;
const contarPendientes = (v) =>
  typeof v === 'string' ? (PENDIENTE.test(v) ? 1 : 0) : v && typeof v === 'object' ? Object.values(v).reduce((n, x) => n + contarPendientes(x), 0) : 0;
const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'proyecto';

function leerNodo() {
  try {
    return sessionStorage.getItem(CLAVE_NODO);
  } catch {
    return null;
  }
}
function guardarNodo(id) {
  try {
    sessionStorage.setItem(CLAVE_NODO, id);
  } catch {
    /* sin almacenamiento */
  }
}

async function cargar() {
  const lista = await Promise.all(ARCHIVOS.map((n) => fetch(`data/${n}.json`, { cache: 'no-store' }).then((r) => r.json())));
  return Object.fromEntries(ARCHIVOS.map((n, i) => [n, lista[i]]));
}

export async function crear(cuerpo, { ventana }) {
  let copia = await cargar();
  const sucios = new Set();
  let soloPendientes = false;
  let seleccion = leerNodo() || 'bienvenido';

  cuerpo.innerHTML = `
    <div class="ed">
      <div class="ed__barra" role="toolbar" aria-label="Editor">
        <button type="button" class="btn-amarillo" data-accion="guardar" disabled>GUARDAR</button>
        <button type="button" class="btn" data-accion="descartar" disabled>Descartar cambios</button>
        <label class="opcion"><input type="checkbox" data-accion="pendientes"> Mostrar solo lo que falta llenar</label>
        <p class="ed__total" aria-live="polite"></p>
      </div>
      <div class="ed__cuerpo">
        <nav class="ed__nav hundido" aria-label="Secciones del contenido"></nav>
        <div class="ed__form" tabindex="-1"></div>
      </div>
      <p class="explorador__estado" role="status"><span data-estado>Lo marcado en rojo es lo que falta llenar.</span></p>
    </div>`;

  const $ = (s) => cuerpo.querySelector(s);
  const estado = $('[data-estado]');
  const formEl = $('.ed__form');
  const nombresSoftware = () => copia.software.discos.map((d) => d.nombre);

  // ---------- Secciones del contenido ----------

  const nodo = (id, titulo, archivo, ruta, claves) => ({ id, titulo, archivo, ruta, claves });
  function grupos() {
    const { sitio, proyectos, software, titulos } = copia;
    return [
      { grupo: 'Inicio', items: [nodo('bienvenido', 'Bienvenido y presentación', 'sitio', ['bienvenido']), nodo('guia', 'Dega, el pez guía', 'sitio', ['guia']), nodo('arranque', 'Pantalla de arranque', 'sitio', ['arranque'])] },
      {
        grupo: 'Trabajos',
        nuevo: true,
        items: proyectos.proyectos.map((p, i) => nodo(`p:${p.id}`, p.titulo.replace(/[«»]/g, '') || p.archivo, 'proyectos', ['proyectos', i])),
      },
      { grupo: 'DEGApedia', items: [nodo('degapedia', 'Artículo, cómo trabajo y nota', 'sitio', ['degapedia']), nodo('sobremi', 'Biografía y trayectoria', 'sitio', ['sobreMi'])] },
      { grupo: 'Software', items: software.discos.map((d, i) => nodo(`s:${d.id}`, d.nombre, 'software', ['discos', i])) },
      { grupo: 'Títulos', items: [nodo('sala', 'Sala', 'titulos', [], ['sala', 'descripcion']), ...titulos.cuadros.map((c, i) => nodo(`t:${c.id}`, c.titulo, 'titulos', ['cuadros', i]))] },
      { grupo: 'Hoja de vida', items: [nodo('hojaDeVida', 'Hoja de vida', 'sitio', ['hojaDeVida'])] },
      {
        grupo: 'Contacto',
        items: [nodo('contacto', 'Datos y formulario', 'sitio', ['contacto']), nodo('mensajero', 'DEGA Mensajero', 'sitio', ['mensajero']), nodo('general', 'Base, condiciones y colectivos', 'sitio', [], ['base', 'condiciones', 'otros'])],
      },
      { grupo: 'Sitio', items: [nodo('meta', 'Título para buscadores y redes', 'sitio', ['meta']), nodo('videos', 'Videos', 'sitio', ['videos'])] },
    ];
  }
  const objetoDe = (n) => n.ruta.reduce((o, k) => o[k], copia[n.archivo]);
  const vistaDe = (n) => {
    const obj = objetoDe(n);
    return n.claves ? Object.fromEntries(n.claves.map((k) => [k, obj[k]])) : obj;
  };
  const todos = () => grupos().flatMap((g) => g.items);

  // ---------- Barra lateral ----------

  function pintarNav() {
    const nav = $('.ed__nav');
    nav.innerHTML = grupos()
      .map((g) => {
        const items = g.items.filter((n) => !soloPendientes || tienePendiente(vistaDe(n)));
        if (!items.length && !g.nuevo) return '';
        return `<h3 class="ed__grupo">${t(g.grupo)}</h3><ul>${items
          .map((n) => {
            const faltan = contarPendientes(vistaDe(n));
            return `<li><button type="button" class="ed__item" data-nodo="${t(n.id)}" aria-current="${n.id === seleccion}">
              <span>${t(n.titulo)}</span>${faltan ? `<span class="ed__falta" title="Campos por llenar">${faltan}</span>` : ''}</button></li>`;
          })
          .join('')}</ul>${g.nuevo ? '<button type="button" class="btn ed__nuevo" data-accion="nuevo-proyecto">+ Nuevo proyecto</button>' : ''}`;
      })
      .join('');
    const total = todos().reduce((n, x) => n + contarPendientes(vistaDe(x)), 0);
    $('.ed__total').textContent = total ? `Faltan ${total} campos por llenar` : 'Todo está lleno';
  }

  // ---------- Formulario ----------

  function marcar(archivo) {
    sucios.add(archivo);
    $('[data-accion="guardar"]').disabled = false;
    $('[data-accion="descartar"]').disabled = false;
    estado.textContent = 'Hay cambios sin guardar.';
    ventana.el.querySelector('.ventana__texto').textContent = 'Editor de contenido *';
    pintarNav();
  }

  function campoTexto(padre, k, archivo, { etiqueta, largo }) {
    const v = padre[k] ?? '';
    const caja = document.createElement('label');
    caja.className = 'ed__campo';
    const control = largo || v.length > 70 ? document.createElement('textarea') : document.createElement('input');
    if (control.tagName === 'TEXTAREA') control.rows = Math.min(8, Math.max(2, Math.ceil(v.length / 70)));
    control.className = 'campo';
    control.value = v;
    caja.innerHTML = `<span class="ed__etiqueta">${t(etiqueta)}</span>`;
    caja.append(control);
    const pintarFalta = () => caja.classList.toggle('ed__campo--falta', PENDIENTE.test(control.value));
    pintarFalta();
    control.addEventListener('input', () => {
      // Un campo de foto o imagen vacío se guarda como null (sin imagen).
      padre[k] = control.value === '' && padre[k] === null ? null : control.value;
      if (['foto', 'imagen'].includes(k) && control.value.trim() === '') padre[k] = null;
      pintarFalta();
      marcar(archivo);
    });
    return caja;
  }

  function campo(padre, k, archivo, contexto = {}) {
    const v = padre[k];
    const etiqueta = typeof k === 'number' ? `${contexto.singular || 'Elemento'} ${k + 1}` : humanizar(k);
    if (soloPendientes && !tienePendiente(v) && !(contexto.forzar)) return null;

    if (k === 'id') {
      const caja = document.createElement('p');
      caja.className = 'ed__id';
      caja.textContent = `${etiqueta}: ${v}`;
      return caja;
    }
    // Categoría de un proyecto: menú con las categorías que existen.
    if (k === 'filtro' && archivo === 'proyectos') {
      const caja = document.createElement('label');
      caja.className = 'ed__campo';
      caja.innerHTML = `<span class="ed__etiqueta">${t(etiqueta)}</span><select class="campo">${copia.proyectos.filtros
        .map((f) => `<option${f === v ? ' selected' : ''}>${t(f)}</option>`)
        .join('')}</select>`;
      caja.querySelector('select').addEventListener('change', (e) => {
        padre[k] = e.target.value;
        marcar(archivo);
      });
      return caja;
    }
    // Herramientas: casillas con los programas de Software.
    if (k === 'herramientas' && Array.isArray(v)) {
      const caja = document.createElement('fieldset');
      caja.className = 'ed__grupo-campos';
      caja.innerHTML = `<legend>${t(etiqueta)}</legend><div class="ed__casillas">${nombresSoftware()
        .map((n) => `<label class="opcion"><input type="checkbox" value="${t(n)}"${v.includes(n) ? ' checked' : ''}> ${t(n)}</label>`)
        .join('')}</div>`;
      caja.addEventListener('change', () => {
        padre[k] = [...caja.querySelectorAll('input:checked')].map((c) => c.value);
        marcar(archivo);
      });
      return caja;
    }
    if (typeof v === 'boolean') {
      const caja = document.createElement('label');
      caja.className = 'opcion ed__casilla';
      caja.innerHTML = `<input type="checkbox"${v ? ' checked' : ''}> ${t(etiqueta)}`;
      caja.querySelector('input').addEventListener('change', (e) => {
        padre[k] = e.target.checked;
        marcar(archivo);
      });
      return caja;
    }
    if ((k === 'color' || k === 'tinta') && typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v)) {
      const caja = document.createElement('label');
      caja.className = 'ed__campo ed__campo--color';
      caja.innerHTML = `<span class="ed__etiqueta">${t(etiqueta)}</span><input type="color" value="${v}">`;
      caja.querySelector('input').addEventListener('input', (e) => {
        padre[k] = e.target.value.toUpperCase();
        marcar(archivo);
      });
      return caja;
    }
    // Campos que pueden no aplicar (Operación, Pantalla…): casilla "No aplica".
    if (NULABLES.has(k) && (v === null || typeof v === 'string')) {
      const caja = document.createElement('div');
      caja.className = 'ed__nulable';
      const pintar = () => {
        caja.replaceChildren();
        const casilla = document.createElement('label');
        casilla.className = 'opcion ed__no-aplica';
        casilla.innerHTML = `<input type="checkbox"${padre[k] === null ? ' checked' : ''}> No aplica`;
        casilla.querySelector('input').addEventListener('change', (e) => {
          padre[k] = e.target.checked ? null : '';
          marcar(archivo);
          pintar();
        });
        if (padre[k] === null) {
          const nota = document.createElement('p');
          nota.className = 'ed__etiqueta ed__apagado';
          nota.textContent = `${etiqueta}: no aparece en la página`;
          caja.append(nota);
        } else {
          caja.append(campoTexto(padre, k, archivo, { etiqueta, largo: LARGOS.has(k) }));
        }
        caja.append(casilla);
      };
      pintar();
      return caja;
    }
    if (typeof v === 'number') {
      const caja = document.createElement('label');
      caja.className = 'ed__campo';
      caja.innerHTML = `<span class="ed__etiqueta">${t(etiqueta)}</span><input type="number" class="campo" value="${v}">`;
      caja.querySelector('input').addEventListener('input', (e) => {
        padre[k] = Number(e.target.value);
        marcar(archivo);
      });
      return caja;
    }
    if (v === null || typeof v === 'string') {
      return campoTexto(padre, k, archivo, { etiqueta, largo: LARGOS.has(k) || LARGOS.has(contexto.padre) });
    }
    if (Array.isArray(v)) return campoLista(padre, k, archivo, etiqueta);
    if (typeof v === 'object') {
      const caja = document.createElement('fieldset');
      caja.className = 'ed__grupo-campos';
      caja.innerHTML = `<legend>${t(etiqueta)}</legend>`;
      for (const clave of Object.keys(v)) {
        const hijo = campo(v, clave, archivo, { padre: k });
        if (hijo) caja.append(hijo);
      }
      return caja;
    }
    return null;
  }

  function campoLista(padre, k, archivo, etiqueta) {
    const lista = padre[k];
    const caja = document.createElement('fieldset');
    caja.className = 'ed__grupo-campos ed__lista';
    caja.innerHTML = `<legend>${t(etiqueta)}</legend>`;
    const singular = { fotos: 'Foto', creditos: 'Crédito', secciones: 'Sección', referencias: 'Referencia', historial: 'Entrada', bio: 'Párrafo', introduccion: 'Párrafo', lineas: 'Línea', items: 'Elemento', dispositivos: 'Grupo', otros: 'Colectivo', bocetos: 'Boceto', categorias: 'Categoría', paleta: 'Color' }[k];
    lista.forEach((_, i) => {
      const fila = document.createElement('div');
      fila.className = 'ed__fila';
      const hijo = campo(lista, i, archivo, { singular, padre: k, forzar: !soloPendientes });
      if (!hijo) return;
      fila.append(hijo);
      const quitar = document.createElement('button');
      quitar.type = 'button';
      quitar.className = 'btn ed__quitar';
      quitar.textContent = 'Quitar';
      quitar.setAttribute('aria-label', `Quitar ${singular || 'elemento'} ${i + 1}`);
      quitar.addEventListener('click', () => {
        lista.splice(i, 1);
        marcar(archivo);
        pintarForm();
      });
      fila.append(quitar);
      caja.append(fila);
    });
    const agregar = document.createElement('button');
    agregar.type = 'button';
    agregar.className = 'btn ed__agregar';
    agregar.textContent = `+ Agregar ${(singular || 'elemento').toLowerCase()}`;
    agregar.addEventListener('click', () => {
      const modelo = PLANTILLAS[k] || lista.find((x) => x && typeof x === 'object');
      lista.push(modelo ? Object.fromEntries(Object.keys(modelo).map((c) => [c, Array.isArray(modelo[c]) ? [] : typeof modelo[c] === 'string' ? '' : modelo[c]])) : '');
      marcar(archivo);
      pintarForm();
    });
    caja.append(agregar);
    return caja;
  }

  function pintarForm() {
    const n = todos().find((x) => x.id === seleccion) || todos()[0];
    seleccion = n.id;
    guardarNodo(seleccion);
    const scroll = formEl.scrollTop;
    const obj = objetoDe(n);
    formEl.innerHTML = `<h2 class="ed__titulo">${t(n.titulo)}</h2>`;
    for (const k of n.claves || Object.keys(obj)) {
      const c = campo(obj, k, n.archivo);
      if (c) formEl.append(c);
    }
    if (soloPendientes && !tienePendiente(vistaDe(n))) {
      formEl.insertAdjacentHTML('beforeend', '<p class="ed__vacio">Aquí no falta nada por llenar.</p>');
    }
    if (n.archivo === 'proyectos' && n.ruta[0] === 'proyectos') {
      formEl.insertAdjacentHTML('beforeend', '<p class="ed__peligro"><button type="button" class="btn" data-accion="borrar-proyecto">Eliminar este proyecto</button></p>');
    }
    formEl.scrollTop = scroll;
    pintarNav();
  }

  // ---------- Acciones ----------

  async function guardar() {
    const boton = $('[data-accion="guardar"]');
    boton.disabled = true;
    estado.textContent = 'Guardando…';
    // Un proyecto nuevo toma su identificador (y su dirección #/trabajos/...) del título.
    for (const p of copia.proyectos.proyectos) {
      if (!p.id.startsWith('nuevo-')) continue;
      const base = slug(p.titulo.replace(/\[[^\]]*\]/g, '')) || 'proyecto';
      let id = base;
      for (let i = 2; copia.proyectos.proyectos.some((o) => o !== p && o.id === id); i++) id = `${base}-${i}`;
      p.id = id;
    }
    try {
      for (const archivo of sucios) {
        const r = await fetch(`__editor/data/${archivo}.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(copia[archivo]) });
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `Error ${r.status}`);
      }
      sucios.clear();
      estado.textContent = 'Guardado. Recargando la página para ver los cambios…';
      window.removeEventListener('beforeunload', avisarSalida);
      setTimeout(() => location.reload(), 600);
    } catch (e) {
      estado.textContent = `No se pudo guardar: ${e.message}. ¿Está abierto el servidor local (ABRIR DEGA OS.cmd)?`;
      boton.disabled = false;
    }
  }

  const avisarSalida = (e) => {
    if (!sucios.size) return;
    e.preventDefault();
    e.returnValue = '';
  };
  window.addEventListener('beforeunload', avisarSalida);
  ventana.alCerrar.push(() => window.removeEventListener('beforeunload', avisarSalida));

  cuerpo.addEventListener('click', async (e) => {
    const item = e.target.closest('[data-nodo]');
    if (item) {
      seleccion = item.dataset.nodo;
      pintarForm();
      formEl.scrollTop = 0;
      formEl.focus({ preventScroll: true });
      return;
    }
    const accion = e.target.closest('[data-accion]')?.dataset.accion;
    if (accion === 'guardar') guardar();
    if (accion === 'descartar') {
      copia = await cargar();
      sucios.clear();
      $('[data-accion="guardar"]').disabled = true;
      $('[data-accion="descartar"]').disabled = true;
      ventana.el.querySelector('.ventana__texto').textContent = 'Editor de contenido';
      estado.textContent = 'Cambios descartados.';
      pintarForm();
    }
    if (accion === 'nuevo-proyecto') {
      const proyectos = copia.proyectos.proyectos;
      proyectos.push({
        id: `nuevo-${Date.now().toString(36)}`,
        archivo: 'NUEVO.MOV',
        video: 'NUEVO',
        titulo: '[título]',
        artista: '[artista]',
        tipo: '[tipo]',
        filtro: copia.proyectos.filtros[0],
        fecha: '[año]',
        idea: '[idea]',
        rol: '[rol]',
        herramientas: [],
        operacion: null,
        pantalla: null,
        frase: '[frase de la banda]',
        fotos: [],
        creditos: [],
      });
      seleccion = `p:${proyectos[proyectos.length - 1].id}`;
      marcar('proyectos');
      pintarForm();
    }
    if (accion === 'borrar-proyecto') {
      const n = todos().find((x) => x.id === seleccion);
      const p = objetoDe(n);
      if (!confirm(`¿Eliminar «${p.titulo.replace(/[«»]/g, '')}» de Trabajos? Su video no se borra.`)) return;
      copia.proyectos.proyectos.splice(n.ruta[1], 1);
      seleccion = 'bienvenido';
      marcar('proyectos');
      pintarForm();
    }
  });

  $('[data-accion="pendientes"]').addEventListener('change', (e) => {
    soloPendientes = e.target.checked;
    pintarForm();
  });

  pintarForm();
}
