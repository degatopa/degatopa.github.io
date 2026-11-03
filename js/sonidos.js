// Sonidos del sistema: tonos cortos sintetizados en el navegador, a volumen bajo.
// Vienen apagados; se encienden en Propiedades de pantalla.
import { obtener } from './prefs.js';

let contexto;

function tono(frecuencia, duracion, tipo = 'square', volumen = 0.03, retraso = 0) {
  if (!obtener().sonidos) return;
  try {
    contexto ??= new AudioContext();
    const t = contexto.currentTime + retraso;
    const osc = contexto.createOscillator();
    const ganancia = contexto.createGain();
    osc.type = tipo;
    osc.frequency.setValueAtTime(frecuencia, t);
    ganancia.gain.setValueAtTime(volumen, t);
    ganancia.gain.exponentialRampToValueAtTime(0.0001, t + duracion);
    osc.connect(ganancia).connect(contexto.destination);
    osc.start(t);
    osc.stop(t + duracion + 0.02);
  } catch {
    /* sin audio disponible */
  }
}

export const sonar = {
  clic: () => tono(1400, 0.025),
  abrir: () => { tono(660, 0.05); tono(990, 0.06, 'square', 0.03, 0.05); },
  cerrar: () => { tono(880, 0.05); tono(520, 0.07, 'square', 0.03, 0.05); },
  error: () => tono(180, 0.18, 'sawtooth', 0.03),
};
