import { crearBase, estados, modalidades } from './datos.js?v=20261124d';
import { esquema, lineasDe, operar, relacionesModelo, totalLineas } from './modelo.js?v=20261124e';

const pasos = [
  ['Guía de ventas', 'Crea una comanda, agrega productos y revisa cómo se calcula su importe.', 'route', 'guia', 'Guía de ventas', mostrarGuia],
  ['Modelo entidad–relación', 'Explora las ocho entidades de salchipaperia y cómo se relacionan sus claves.', 'account_tree', 'modelo', 'Entidad–relación', mostrarModelo],
  ['Explorar tablas', 'Busca registros en las ocho tablas y sigue sus claves foráneas.', 'table_view', 'tablas', 'Explorar tablas', mostrarTablas],
  ['Editar pedidos', 'Practica con una comanda y observa qué filas cambian en el modelo.', 'edit_note', 'editar', 'Editar pedidos', mostrarPedido],
  ['Resumen del pedido', 'Comprueba las cantidades, el precio aplicado y el total de la comanda.', 'summarize', 'resumen', 'Resumen del pedido', mostrarResumen],
];
const indicePaso = (ruta) => pasos.findIndex((etapa) => etapa[3] === ruta);

const id = (nombre) => document.getElementById(nombre);
const moneda = new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fechaLima = new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima', dateStyle: 'short', timeStyle: 'short' });
const soles = (centavos) => `S/ ${moneda.format(centavos / 100)}`;
const camposMoneda = new Set(['precio', 'precio_unitario']);
const claveLocal = 'red-pepper-trabajo-final-v1';
const referencias = {
  id_cliente: 'clientes', id_categoria: 'categorias', id_producto: 'productos', id_pedido: 'pedidos',
};
const tablasSubtipo = new Set(['snacks', 'bebidas', 'hamburguesas']);

function cargar() {
  const inicio = crearBase();
  try {
    const anterior = JSON.parse(localStorage.getItem(claveLocal));
    if (Number.isSafeInteger(anterior?.secuencias?.pedido) && Array.isArray(anterior.cambios) &&
        Array.isArray(anterior.tablas?.pedidos) && Array.isArray(anterior.tablas.detalle_pedido)) {
      inicio.tablas.pedidos = anterior.tablas.pedidos;
      inicio.tablas.detalle_pedido = anterior.tablas.detalle_pedido;
      inicio.secuencias.pedido = anterior.secuencias.pedido;
      inicio.cambios = anterior.cambios.filter(({ tabla }) => tabla.split(', ').every((nombre) => Object.hasOwn(esquema, nombre)));
      inicio.pedidoActivo = anterior.pedidoActivo;
    }
  } catch {
    // El laboratorio puede iniciarse aunque el almacenamiento no esté disponible.
  }
  return inicio;
}

let base = cargar();
let anterior = null;
let paso = 0;
let tablaModelo = 'pedidos';
let tablaDatos = 'pedidos';
let filtroClave = null;
let pagina = 0;
let pedidoActivo = base.tablas.pedidos.find((p) => p.id_pedido === (base.pedidoActivo ?? 101))?.id_pedido ?? base.tablas.pedidos.at(-1)?.id_pedido;
let accionDialogo;

function nodo(etiqueta, texto = '', clase = '') {
  const elemento = document.createElement(etiqueta);
  elemento.textContent = texto;
  if (clase) elemento.className = clase;
  return elemento;
}

function icono(nombre) {
  const figura = nodo('span', nombre, 'icono');
  figura.setAttribute('aria-hidden', 'true');
  return figura;
}

function boton(texto, accion, nombreIcono, clase = 'boton secundario') {
  const control = nodo('button', '', clase);
  control.type = 'button';
  if (nombreIcono) control.append(icono(nombreIcono));
  control.append(document.createTextNode(texto));
  control.addEventListener('click', accion);
  return control;
}

function opciones(control, filas, valor, etiqueta, elegido) {
  control.replaceChildren(...filas.map((fila) => new Option(etiqueta(fila), valor(fila))));
  if (elegido !== undefined) control.value = String(elegido);
}

function registros(columnas, filas, titulo) {
  if (filas.length === 0) return nodo('p', 'No hay filas para esta consulta.', 'sin-lineas apagado');
  const marco = nodo('div', '', 'registros');
  marco.tabIndex = 0;
  marco.setAttribute('role', 'region');
  marco.setAttribute('aria-label', titulo);
  const tabla = nodo('table');
  tabla.createTHead().insertRow().append(...columnas.map((col) => {
    const encabezado = nodo('th', col.texto, col.clase);
    encabezado.scope = 'col';
    return encabezado;
  }));
  const cuerpo = tabla.createTBody();
  for (const fila of filas) {
    const renglon = cuerpo.insertRow();
    for (let indice = 0; indice < fila.length; indice++) {
      const celda = nodo('td', '', columnas[indice].clase);
      celda.append(fila[indice]);
      renglon.append(celda);
    }
  }
  marco.append(tabla);
  return marco;
}

function mostrarAviso(mensaje, error = false) {
  const aviso = id('aviso');
  aviso.hidden = !mensaje;
  aviso.textContent = mensaje;
  aviso.dataset.error = String(error);
}

function guardar(mensaje) {
  try {
    localStorage.setItem(claveLocal, JSON.stringify({ ...base, pedidoActivo }));
    mostrarAviso(mensaje);
  } catch {
    mostrarAviso(`${mensaje} Los cambios quedan disponibles hasta cerrar la página.`);
  }
}

function ir(indice, enfocar = true) {
  if (!pasos[indice]) return;
  paso = indice;
  const [titulo, descripcion, simbolo, ruta, resumen] = pasos[indice];
  document.querySelectorAll('[data-paso]').forEach((control, i) => {
    if (i === paso) control.setAttribute('aria-current', 'step');
    else control.removeAttribute('aria-current');
    id(pasos[i][3]).hidden = i !== paso;
  });
  id('paso-titulo').textContent = titulo;
  id('paso-descripcion').textContent = descripcion;
  id('hero-icono').textContent = simbolo;
  id('progreso').textContent = `Paso ${indice + 1} de ${pasos.length}`;
  id('paso-pie').textContent = resumen;
  id('anterior').disabled = paso === 0;
  id('siguiente').disabled = paso === pasos.length - 1;
  mostrarAviso('');
  if (enfocar) {
    history.replaceState(null, '', `#${ruta}`);
    id('paso-titulo').focus();
  }
  mostrarPantalla();
}

function mostrarPantalla() {
  pasos[paso][5]();
}

function elegirTabla(tabla, clave = null) {
  tablaDatos = tabla;
  filtroClave = clave;
  id('buscar').value = clave ? String(clave.valor) : '';
  pagina = 0;
  const destino = indicePaso('tablas');
  if (paso === destino) {
    mostrarTablas();
    if (clave) id('tabla-titulo').focus();
  } else ir(destino);
}

function mostrarModelo() {
  for (const control of id('mapa').querySelectorAll('[data-tabla]')) {
    control.setAttribute('aria-pressed', String(control.dataset.tabla === tablaModelo));
  }
  resaltarConexiones();
  const ficha = esquema[tablaModelo];
  const foraneas = new Set(relacionesModelo.filter((relacion) => relacion.destino === tablaModelo).map((relacion) => relacion.columna));
  const campos = nodo('ul', '', 'campos-entidad');
  for (const campo of ficha.columnas) {
    const fila = nodo('li');
    fila.append(nodo('code', campo));
    if (ficha.clave.includes(campo)) fila.append(nodo('span', 'PK', 'sigla-clave'));
    if (foraneas.has(campo)) fila.append(nodo('span', 'FK', 'sigla-clave'));
    campos.append(fila);
  }
  const relaciones = nodo('ul', '', 'enlaces-tabla');
  for (const { origen, destino, columna, cardinalidad } of relacionesModelo) {
    if (origen !== tablaModelo && destino !== tablaModelo) continue;
    const saliente = origen === tablaModelo;
    const tabla = saliente ? destino : origen;
    const elemento = nodo('li');
    const alcance = saliente ? `1 a ${cardinalidad}` : `${cardinalidad} a 1`;
    elemento.append(boton(esquema[tabla].titulo, () => seleccionarEntidad(tabla), null, 'enlace-boton'),
      nodo('code', `${columna} · ${alcance}`));
    relaciones.append(elemento);
  }
  const titulo = nodo('h2', ficha.titulo);
  titulo.tabIndex = -1;
  const volver = boton('Volver al mapa', () => id('mapa').querySelector('[aria-pressed="true"]').focus(), 'arrow_upward', 'boton secundario volver-mapa');
  id('inspector').replaceChildren(titulo, volver, nodo('p', tablaModelo, 'codigo'), nodo('p', ficha.texto),
    nodo('h3', 'Campos y claves'), campos, nodo('h3', 'Relaciones de la entidad'), relaciones,
    boton('Ver filas', () => elegirTabla(tablaModelo), 'table_view'));
}

function seleccionarEntidad(tabla) {
  tablaModelo = tabla;
  mostrarModelo();
  id('inspector').querySelector('h2').focus();
}

function resaltarConexiones() {
  for (const linea of id('mapa').querySelectorAll('[data-origen]')) {
    linea.classList.toggle('conexion-activa', linea.dataset.origen === tablaModelo || linea.dataset.destino === tablaModelo);
  }
}

const planosMapa = {
  amplio: {
    ancho: 760, alto: 365, mitadTarjeta: 87, mitadAltura: 30,
    posiciones: {
      clientes: [104, 52], categorias: [380, 52], pedidos: [104, 152], productos: [380, 152],
      detalle_pedido: [104, 252], snacks: [656, 152], bebidas: [656, 230], hamburguesas: [656, 308],
    },
  },
  compacto: {
    ancho: 360, alto: 466, mitadTarjeta: 69, mitadAltura: 29,
    posiciones: {
      clientes: [81, 49], categorias: [247, 49], pedidos: [81, 143], productos: [247, 143],
      detalle_pedido: [81, 237], snacks: [247, 237], bebidas: [247, 327], hamburguesas: [247, 417],
    },
    trayectos: {
      'pedidos:detalle_pedido': ['M81 172 V208', 44, 194],
      'productos:detalle_pedido': ['M247 172 V184 H134 V208', 193, 201],
      // Los tres subtipos comparten el carril derecho, fuera de sus tarjetas.
      'productos:snacks': ['M316 143 H339 V237 H316', 279, 201],
      'productos:bebidas': ['M316 143 H339 V327 H316', 279, 291],
      'productos:hamburguesas': ['M316 143 H339 V417 H316', 279, 381],
    },
  },
};

function crearMapa() {
  const mapa = id('mapa');
  const svg = (etiqueta, atributos) => {
    const elemento = document.createElementNS('http://www.w3.org/2000/svg', etiqueta);
    for (const [nombre, valor] of Object.entries(atributos)) elemento.setAttribute(nombre, valor);
    return elemento;
  };
  const conexiones = svg('svg', { class: 'conexiones-modelo', 'aria-hidden': 'true' });
  const definiciones = svg('defs', {});
  const flecha = svg('marker', { id: 'flecha-modelo', markerUnits: 'userSpaceOnUse', markerWidth: 8, markerHeight: 8, refX: 7, refY: 4, orient: 'auto' });
  flecha.append(svg('path', { d: 'M1 1 L7 4 L1 7', class: 'flecha-modelo' }));
  definiciones.append(flecha);
  mapa.append(conexiones);
  const controles = new Map();
  for (const tabla of Object.keys(planosMapa.amplio.posiciones)) {
    const ficha = esquema[tabla];
    const control = boton(ficha.titulo, () => seleccionarEntidad(tabla), ficha.icono, 'opcion nodo-modelo');
    control.dataset.tabla = tabla;
    control.setAttribute('aria-controls', 'inspector');
    control.setAttribute('aria-label', ficha.titulo);
    control.append(nodo('small', tabla));
    mapa.append(control);
    controles.set(tabla, control);
  }

  const redimensionar = (anchoDisponible) => {
    if (!anchoDisponible) return;
    const formato = anchoDisponible < 580 ? 'compacto' : 'amplio';
    if (mapa.dataset.formato === formato) return;
    const { ancho, alto, mitadTarjeta, mitadAltura, posiciones, trayectos } = planosMapa[formato];
    mapa.dataset.formato = formato;
    mapa.style.aspectRatio = `${ancho} / ${alto}`;
    conexiones.setAttribute('viewBox', `0 0 ${ancho} ${alto}`);
    conexiones.replaceChildren(definiciones);
    for (const { origen, destino, cardinalidad } of relacionesModelo) {
      const [x, y] = posiciones[origen];
      const [destinoX, destinoY] = posiciones[destino];
      const vertical = x === destinoX;
      const direccion = Math.sign(destinoX - x);
      const salidaX = x + direccion * mitadTarjeta;
      const llegadaX = destinoX - direccion * mitadTarjeta;
      const carrilX = salidaX + direccion * 20;
      const [ruta, xTexto, yTexto] = trayectos?.[`${origen}:${destino}`] ?? (vertical
        ? [`M${x} ${y + mitadAltura} V${destinoY - mitadAltura}`, x + 43, (y + destinoY) / 2 + 4]
        : [`M${salidaX} ${y} H${carrilX} V${destinoY} H${llegadaX}`, (carrilX + llegadaX) / 2, destinoY - 9]);
      const grupo = svg('g', { 'data-origen': origen, 'data-destino': destino });
      const etiqueta = svg('text', { x: xTexto, y: yTexto, 'text-anchor': 'middle' });
      etiqueta.textContent = `1 a ${cardinalidad}`;
      grupo.append(svg('path', { d: ruta, 'marker-end': 'url(#flecha-modelo)' }), etiqueta);
      conexiones.append(grupo);
    }
    for (const [tabla, control] of controles) {
      const [x, y] = posiciones[tabla];
      control.style.left = `${x / ancho * 100}%`;
      control.style.top = `${y / alto * 100}%`;
      control.style.width = `${2 * mitadTarjeta / ancho * 100}%`;
      control.style.height = `${2 * mitadAltura / alto * 100}%`;
    }
    resaltarConexiones();
  };
  new ResizeObserver(([entrada]) => redimensionar(entrada.contentRect.width)).observe(mapa.parentElement);
}

function mostrarValor(campo, valor) {
  if (valor === null || valor === undefined) return '—';
  if (camposMoneda.has(campo)) return soles(valor);
  if (campo.startsWith('fecha_')) return fechaLima.format(new Date(valor));
  if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';
  return String(valor);
}

const simplificar = (texto) => texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('es-PE');

function mostrarTablas() {
  const ficha = esquema[tablaDatos];
  id('tabla-elegida').value = tablaDatos;
  id('tabla-titulo').textContent = ficha.titulo;
  id('tabla-texto').textContent = filtroClave ? `Filtro de relación por ${filtroClave.campo}` : ficha.texto;
  const palabras = simplificar(id('buscar').value.trim()).split(/\s+/).filter(Boolean);
  const filas = base.tablas[tablaDatos].filter((registro) => {
    if (filtroClave) return registro[filtroClave.campo] === filtroClave.valor;
    const valores = ficha.columnas.map((campo) => mostrarValor(campo, registro[campo]));
    if (tablasSubtipo.has(tablaDatos)) valores.push(nombreProducto(registro.id_producto));
    const texto = simplificar(valores.join(' '));
    return palabras.every((palabra) => texto.includes(palabra));
  });
  const porPagina = 10;
  const paginas = Math.max(1, Math.ceil(filas.length / porPagina));
  pagina = Math.min(pagina, paginas - 1);
  const columnas = ficha.columnas.map((campo) => ({ texto: campo, clase: camposMoneda.has(campo) ? 'codigo numero' : 'codigo' }));
  const datos = filas.slice(pagina * porPagina, (pagina + 1) * porPagina).map((fila) => ficha.columnas.map((campo) => {
    const valor = fila[campo];
    const texto = mostrarValor(campo, valor);
    const destino = referencias[campo];
    if (destino && destino !== tablaDatos && valor !== null && valor !== undefined) {
      const etiqueta = tablasSubtipo.has(tablaDatos) && campo === 'id_producto' ? `${texto} · ${nombreProducto(valor)}` : texto;
      const enlace = boton(etiqueta, () => elegirTabla(destino, { campo, valor }), null, 'enlace-boton codigo');
      enlace.setAttribute('aria-label', `Ver ${esquema[destino].titulo} con id ${etiqueta}`);
      return enlace;
    }
    return texto;
  }));
  id('registros').replaceChildren(registros(columnas, datos, ficha.titulo));
  id('pagina-ant').disabled = pagina === 0;
  id('pagina-sig').disabled = pagina === paginas - 1;
  id('tabla-pagina').textContent = `${filas.length} ${filas.length === 1 ? 'fila' : 'filas'} · Página ${pagina + 1} de ${paginas}`;
}

const nombreProducto = (producto) => base.tablas.productos.find((fila) => fila.id_producto === producto).nombre;
const etiquetaPedido = (p) => `#${p.id_pedido} · ${p.tipo_pedido} · ${p.estado}`;
const pedidoVigente = () => base.tablas.pedidos.find((fila) => fila.id_pedido === pedidoActivo);

function selectorPedidos(control) {
  opciones(control, [...base.tablas.pedidos].reverse(), (p) => p.id_pedido, etiquetaPedido, pedidoActivo);
  control.disabled = base.tablas.pedidos.length === 0;
}

function formularioCampo(texto, control, nombre) {
  control.name = nombre;
  control.required = true;
  const etiqueta = nodo('label', texto);
  etiqueta.append(control);
  return etiqueta;
}

function dialogo(titulo, texto, confirmar, campos, accion) {
  accionDialogo = accion;
  id('dialogo-titulo').textContent = titulo;
  id('dialogo-info').textContent = texto;
  id('confirmar-dialogo').textContent = confirmar;
  id('dialogo-campos').replaceChildren(...campos);
  id('dialogo').showModal();
}

function confirmarBorrado(titulo, texto, accion) {
  dialogo(titulo, texto, 'Confirmar borrado', [], () => accion);
  id('cancelar-dialogo').focus();
}

function moverLinea(linea) {
  const disponibles = base.tablas.pedidos.filter((p) => p.id_pedido !== pedidoActivo && p.estado !== 'Anulado').reverse();
  if (!disponibles.length) {
    mostrarAviso('Crea otro pedido vigente para recibir la línea.', true);
    return;
  }
  const control = nodo('select');
  opciones(control, disponibles, (p) => p.id_pedido, etiquetaPedido);
  dialogo('Mover línea', `El producto ${nombreProducto(linea.id_producto)} conserva la cantidad y su precio al cambiar de pedido.`,
    'Mover línea', [formularioCampo('Pedido de destino', control, 'destino')], (datos) => ({
      tipo: 'mover', id: linea.id_pedido, producto: linea.id_producto, destino: Number(datos.get('destino')),
    }));
}

function ajustarLinea(linea) {
  const control = nodo('input');
  Object.assign(control, { type: 'number', min: '1', max: '999', value: linea.cantidad });
  dialogo('Editar cantidad', `Modifica las unidades de ${nombreProducto(linea.id_producto)}.`, 'Guardar cantidad',
    [formularioCampo('Cantidad nueva', control, 'cantidad')], (datos) => ({
      tipo: 'cantidad', id: linea.id_pedido, producto: linea.id_producto, cantidad: Number(datos.get('cantidad')),
    }));
}

function formularioPedido(pedido) {
  const cliente = nodo('select');
  const modalidad = nodo('select');
  opciones(cliente, base.tablas.clientes, (c) => c.id_cliente, (c) => `${c.nombres} ${c.apellidos}`, pedido?.id_cliente);
  opciones(modalidad, modalidades, (x) => x, (x) => x, pedido?.tipo_pedido);
  dialogo(pedido ? 'Editar pedido' : 'Nuevo pedido',
    pedido ? 'Cambia el cliente o la modalidad del pedido actual.' : 'Elige el cliente y la modalidad para crear la primera fila de la venta.',
    pedido ? 'Guardar pedido' : 'Crear pedido',
    [formularioCampo('Cliente', cliente, 'cliente'), formularioCampo('Modalidad', modalidad, 'modalidad')],
    (datos) => ({ tipo: pedido ? 'editar-pedido' : 'crear', id: pedido?.id_pedido, cliente: Number(datos.get('cliente')), modalidad: datos.get('modalidad') }));
}

function agregarDesdeGuia() {
  const producto = nodo('select');
  const cantidad = nodo('input');
  opciones(producto, base.tablas.productos.filter((p) => p.disponible), (p) => p.id_producto, (p) => `${p.nombre} · ${soles(p.precio)}`);
  Object.assign(cantidad, { type: 'number', min: '1', max: '999', value: '1' });
  dialogo('Agregar producto', 'Al guardar podrás ver la cantidad y el precio unitario en el detalle.', 'Agregar producto',
    [formularioCampo('Producto', producto, 'producto'), formularioCampo('Cantidad', cantidad, 'cantidad')], (datos) => ({
      tipo: 'agregar', id: pedidoActivo, producto: Number(datos.get('producto')), cantidad: Number(datos.get('cantidad')),
    }));
}

function borrarPedido() {
  confirmarBorrado('Borrar pedido', `Se eliminará el pedido #${pedidoActivo} junto a todas sus líneas de práctica.`,
    { tipo: 'borrar-pedido', id: pedidoActivo });
}

function tablaLineas(pedido, lineas, editable) {
  const cliente = base.tablas.clientes.find((c) => c.id_cliente === pedido.id_cliente);
  const columnas = [{ texto: 'Producto' }, { texto: 'Cant.', clase: 'numero' }, { texto: 'Importe', clase: 'numero' }];
  if (editable) columnas.push({ texto: 'Acciones' });
  const filas = lineas.map((linea) => {
    const nombre = nombreProducto(linea.id_producto);
    const fila = [nombre, String(linea.cantidad), soles(linea.cantidad * linea.precio_unitario)];
    if (editable) {
      const acciones = nodo('div', '', 'acciones');
      acciones.append(boton('Editar', () => ajustarLinea(linea), 'edit'), boton('Mover', () => moverLinea(linea), 'swap_horiz'),
        boton('Borrar', () => confirmarBorrado('Borrar línea', `${nombre} se eliminará del pedido #${pedidoActivo} y su importe se recalculará.`,
          { tipo: 'borrar-linea', id: linea.id_pedido, producto: linea.id_producto }), 'delete'));
      fila.push(acciones);
    }
    return fila;
  });
  const pie = nodo('div', '', 'pie-tabla');
  const identificacion = nodo('div', '', 'estado-texto');
  if (cliente) identificacion.append(nodo('p', `${cliente.nombres} ${cliente.apellidos}`));
  identificacion.append(nodo('p', `Estado · ${pedido.estado}`));
  pie.append(identificacion, nodo('strong', soles(totalLineas(lineas)), 'numero'));
  return [registros(columnas, filas, 'Líneas del pedido'), pie];
}

function mostrarCambios(contenedor) {
  contenedor.replaceChildren(nodo('h2', 'Qué cambió en los datos'));
  const [ultimo, ...historial] = base.cambios;
  if (!ultimo) {
    contenedor.append(nodo('p', 'Crea un pedido o edita una línea para comparar los valores de antes y después.', 'apagado'));
    return;
  }
  contenedor.append(nodo('p', ultimo.mensaje));
  if (ultimo.filas?.length) {
    for (const [indice, { tabla, previa, nueva, campos }] of ultimo.filas.entries()) {
      const ficha = esquema[tabla];
      const operacion = previa && nueva ? 'Actualizada' : nueva ? 'Creada' : 'Eliminada';
      const fila = nueva ?? previa;
      const claves = ficha.clave.map((campo) => fila[campo]).join(' / ');
      const detalle = nodo('details', '', 'cambio-fila');
      detalle.open = indice < 2;
      const titulo = nodo('summary');
      titulo.append(nodo('code', tabla), nodo('span', `${operacion} · ${claves}`, 'apagado'));
      const columnas = [{ texto: 'Campo' }, { texto: 'Antes' }, { texto: 'Después' }];
      const datos = campos.map((campo) => [nodo('code', campo), mostrarValor(campo, previa?.[campo]),
        nodo('span', mostrarValor(campo, nueva?.[campo]), 'valor-cambiado')]);
      detalle.append(titulo, registros(columnas, datos, `Cambios en ${tabla}`));
      contenedor.append(detalle);
    }
  } else {
    contenedor.append(nodo('p', ultimo.filas ? 'Los valores quedaron iguales.' : ultimo.tabla, 'apagado'));
  }
  if (anterior) contenedor.append(boton('Deshacer último cambio', deshacer, 'undo'));
  if (historial.length) {
    const recientes = nodo('details', '', 'historial');
    const lista = nodo('ul', '', 'cambios');
    lista.append(...historial.map((evento) => nodo('li', evento.mensaje)));
    recientes.append(nodo('summary', 'Actividad anterior'), lista);
    contenedor.append(recientes);
  }
}

function mostrarGuia() {
  const pedido = pedidoVigente();
  selectorPedidos(id('pedido-guia'));
  mostrarCambios(id('guia-cambios'));
  if (!pedido) {
    id('flujo-guia').replaceChildren();
    id('guia-acciones').replaceChildren();
    id('guia-lineas').replaceChildren(nodo('p', 'Crea un pedido para empezar.', 'sin-lineas apagado'));
    return;
  }
  const lineas = lineasDe(base.tablas, pedidoActivo);
  const cliente = base.tablas.clientes.find((c) => c.id_cliente === pedido.id_cliente);
  const editable = pedido.estado !== 'Anulado';
  const etapa = lineas.length ? 3 : 2;
  const tarjetas = [
    ['clientes', 'Cliente', `${cliente.nombres} ${cliente.apellidos}`, 'El pedido guarda el identificador del cliente.', { campo: 'id_cliente', valor: pedido.id_cliente }],
    ['pedidos', 'Pedido', `#${pedidoActivo} · ${pedido.tipo_pedido}`, `Estado · ${pedido.estado}`, { campo: 'id_pedido', valor: pedidoActivo },
      editable && boton('Editar pedido', () => formularioPedido(pedido), 'edit')],
    ['detalle_pedido', 'Detalle', `${lineas.length} ${lineas.length === 1 ? 'línea' : 'líneas'}`, 'Cada línea enlaza un producto con el pedido.', { campo: 'id_pedido', valor: pedidoActivo },
      editable && boton('Agregar producto', agregarDesdeGuia, 'add_shopping_cart', 'boton primario')],
    [null, 'Total', soles(totalLineas(lineas)), 'Suma la cantidad por el precio aplicado de cada línea.', null,
      boton('Ver resumen', () => ir(indicePaso('resumen')), 'summarize')],
  ];
  id('flujo-guia').replaceChildren(...tarjetas.map(([tabla, titulo, valor, texto, filtro, accion], indice) => {
    const tarjeta = nodo('li', '', 'tarjeta-guia');
    const siguiente = editable && indice === etapa;
    if (siguiente) tarjeta.setAttribute('aria-current', 'step');
    const cabecera = nodo('div', '', 'etapa-guia');
    cabecera.append(icono(esquema[tabla]?.icono ?? 'summarize'), nodo('h3', titulo));
    if (siguiente) cabecera.append(nodo('span', 'Siguiente', 'siguiente-guia'));
    tarjeta.append(cabecera, nodo('strong', valor, 'valor-guia'), nodo('p', texto, 'apagado'));
    if (accion) tarjeta.append(accion);
    if (tabla) {
      const enlace = boton(tabla, () => elegirTabla(tabla, filtro), 'table_view', 'enlace-boton codigo tabla-guia');
      enlace.setAttribute('aria-label', `Ver tabla ${tabla}`);
      tarjeta.append(enlace);
    }
    return tarjeta;
  }));
  id('guia-lineas').replaceChildren(...tablaLineas(pedido, lineas, editable));
  id('guia-acciones').replaceChildren(boton('Borrar pedido', borrarPedido, 'delete'),
    boton('Abrir editor de pedidos', () => ir(indicePaso('editar')), 'edit_note'));
}

function mostrarPedido() {
  const pedido = pedidoVigente();
  const editable = Boolean(pedido) && pedido.estado !== 'Anulado';
  selectorPedidos(id('pedido-editar'));
  id('agregar').hidden = !editable;
  id('editar-cabecera').disabled = !editable;
  id('cambiar-estado').hidden = !pedido;
  mostrarCambios(id('aprendizaje'));
  if (!pedido) {
    id('pedido-lineas').replaceChildren(nodo('p', 'Crea un pedido para empezar.', 'sin-lineas apagado'));
    return;
  }
  opciones(id('estado'), estados, (x) => x, (x) => x, pedido.estado);
  id('pedido-lineas').replaceChildren(...tablaLineas(pedido, lineasDe(base.tablas, pedidoActivo), editable));
  id('aprendizaje').append(boton('Ver tabla de detalle', () => elegirTabla('detalle_pedido', { campo: 'id_pedido', valor: pedidoActivo }), 'table_view'));
}

function mostrarResumen() {
  const pedido = pedidoVigente();
  selectorPedidos(id('pedido-resumen'));
  mostrarCambios(id('resumen-cambios'));
  const contenedor = id('resumen-pedido');
  if (!pedido) {
    contenedor.replaceChildren(nodo('p', 'Crea un pedido desde la guía para ver su total.', 'sin-lineas apagado'));
    return;
  }
  const lineas = lineasDe(base.tablas, pedidoActivo);
  const detalle = nodo('dl', '', 'resumen-grid');
  const unidades = lineas.reduce((suma, linea) => suma + linea.cantidad, 0);
  for (const [concepto, valor] of [['Líneas del pedido', lineas.length], ['Unidades', unidades], ['Total de la comanda', soles(totalLineas(lineas))]]) {
    const fila = nodo('div');
    fila.append(nodo('dt', concepto), nodo('dd', String(valor)));
    detalle.append(fila);
  }
  contenedor.replaceChildren(detalle, ...tablaLineas(pedido, lineas, false));
}

function ejecutar(accion) {
  try {
    const cambio = operar(base, accion);
    anterior = { base, pedidoActivo };
    base = cambio.base;
    pedidoActivo = cambio.elegido;
    mostrarPantalla();
    guardar(cambio.mensaje);
  } catch (error) {
    mostrarAviso(error.message, true);
  }
}

function deshacer() {
  ({ base, pedidoActivo } = anterior);
  anterior = null;
  mostrarPantalla();
  guardar('Se deshizo el último cambio de práctica.');
}

document.querySelectorAll('[data-paso]').forEach((control, indice) => {
  control.addEventListener('click', () => ir(indice));
  control.addEventListener('keydown', (evento) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(evento.key)) return;
    evento.preventDefault();
    ir(indice + (evento.key === 'ArrowLeft' ? -1 : 1));
  });
});
id('anterior').addEventListener('click', () => ir(paso - 1));
id('siguiente').addEventListener('click', () => ir(paso + 1));
id('tabla-elegida').addEventListener('change', (evento) => elegirTabla(evento.target.value));
id('buscar').addEventListener('input', () => { filtroClave = null; pagina = 0; mostrarTablas(); });
id('pagina-ant').addEventListener('click', () => { pagina--; mostrarTablas(); });
id('pagina-sig').addEventListener('click', () => { pagina++; mostrarTablas(); });
for (const control of ['pedido-guia', 'pedido-editar', 'pedido-resumen']) {
  id(control).addEventListener('change', (evento) => { pedidoActivo = Number(evento.target.value); mostrarPantalla(); });
}
for (const control of ['nuevo-guia', 'nuevo-pedido']) id(control).addEventListener('click', () => formularioPedido());
id('editar-cabecera').addEventListener('click', () => formularioPedido(pedidoVigente()));
id('agregar').addEventListener('submit', (evento) => {
  evento.preventDefault();
  const datos = new FormData(evento.currentTarget);
  ejecutar({ tipo: 'agregar', id: pedidoActivo, producto: Number(datos.get('producto')), cantidad: Number(datos.get('cantidad')) });
});
id('cambiar-estado').addEventListener('submit', (evento) => {
  evento.preventDefault();
  ejecutar({ tipo: 'estado', id: pedidoActivo, estado: id('estado').value });
});
id('borrar-pedido').addEventListener('click', borrarPedido);
id('volver-guia').addEventListener('click', () => ir(indicePaso('guia')));
id('dialogo-form').addEventListener('submit', (evento) => {
  evento.preventDefault();
  const accion = accionDialogo(new FormData(evento.currentTarget));
  id('dialogo').close();
  ejecutar(accion);
});
id('cancelar-dialogo').addEventListener('click', () => id('dialogo').close());

opciones(id('tabla-elegida'), Object.entries(esquema), ([tabla]) => tabla, ([tabla, ficha]) => `${ficha.titulo} (${tabla})`);
opciones(id('producto'), base.tablas.productos, (p) => p.id_producto, (p) => `${p.nombre} · ${soles(p.precio)}`);
crearMapa();
const ruta = location.hash === '#cobros' ? 'resumen' : location.hash.slice(1);
ir(Math.max(0, indicePaso(ruta)), false);
