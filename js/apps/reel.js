// Ventana "Reproductor DEGA": el reel y la lista con todos los videos de proyectos.json.
import { crearReproductor, listaDeVideos } from '../ui/reproductor.js';

export async function crear(cuerpo, { datos, navegar, ventana, params }) {
  const lista = listaDeVideos(datos);
  const indice = Math.max(0, lista.findIndex((v) => v.id === (params.video || 'reel')));
  const reproductor = await crearReproductor(cuerpo, {
    lista,
    indice,
    autoplay: true,
    bucle: true,
    creditos: datos.sitio.bienvenido.creditos,
    teclas: ventana.el,
    navegar,
    // El título de la ventana y su botón en la barra muestran el archivo que suena.
    alCambiar: (item) => {
      const titulo = `Reproductor DEGA — ${item.archivo}`;
      ventana.el.querySelector('.ventana__texto').textContent = titulo;
      ventana.boton.querySelector('.tarea__texto').textContent = item.archivo;
    },
  });
  ventana.alCerrar.push(reproductor.destruir);
}
