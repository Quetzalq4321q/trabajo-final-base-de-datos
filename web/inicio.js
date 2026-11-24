const raiz = document.documentElement;
const botonTema = document.getElementById('boton-tema');
const sistema = matchMedia('(prefers-color-scheme: dark)');
let preferencia = raiz.dataset.temaGuardado;

function actualizarTema() {
  const oscuro = preferencia ? preferencia === 'oscuro' : sistema.matches;
  const modoSiguiente = oscuro ? 'claro' : 'oscuro';
  raiz.dataset.tema = oscuro ? 'oscuro' : 'claro';
  botonTema.querySelector('.icono').textContent = oscuro ? 'light_mode' : 'dark_mode';
  botonTema.querySelector('.tema-texto').textContent = oscuro ? 'Claro' : 'Oscuro';
  botonTema.setAttribute('aria-label', `Cambiar a modo ${modoSiguiente}`);
}

botonTema.addEventListener('click', () => {
  const oscuro = preferencia ? preferencia === 'oscuro' : sistema.matches;
  preferencia = oscuro ? 'claro' : 'oscuro';
  try {
    localStorage.setItem('red-pepper-tema', preferencia);
  } catch {
    // La selección sigue activa en esta página.
  }
  actualizarTema();
});
sistema.addEventListener('change', actualizarTema);
actualizarTema();
botonTema.hidden = false;

await import('./app.js?v=20261124g');

raiz.classList.remove('preparando');
document.getElementById('laboratorio').removeAttribute('aria-busy');
document.getElementById('encabezado').hidden = false;
document.getElementById('pie-pasos').hidden = false;
document.getElementById('pasos').inert = false;
