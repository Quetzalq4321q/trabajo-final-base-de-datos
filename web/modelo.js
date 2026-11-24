import { estados, modalidades } from './datos.js?v=20261124d';

const relacion = (origen, destino, columna, cardinalidad) => ({ origen, destino, columna, cardinalidad });

export const relacionesModelo = [
  relacion('clientes', 'pedidos', 'id_cliente', '0..N'),
  relacion('pedidos', 'detalle_pedido', 'id_pedido', '0..N'),
  relacion('productos', 'detalle_pedido', 'id_producto', '0..N'),
  relacion('categorias', 'productos', 'id_categoria', '0..N'),
  relacion('productos', 'snacks', 'id_producto', '0..1'),
  relacion('productos', 'bebidas', 'id_producto', '0..1'),
  relacion('productos', 'hamburguesas', 'id_producto', '0..1'),
];

export const esquema = {
  clientes: { titulo: 'Clientes', icono: 'groups', clave: ['id_cliente'], columnas: ['id_cliente', 'nombres', 'apellidos'], texto: 'Vincula los pedidos a un cliente mediante su identificador interno.' },
  categorias: { titulo: 'Categorías', icono: 'category', clave: ['id_categoria'], columnas: ['id_categoria', 'nombre', 'descripcion'], texto: 'Agrupa los productos por sección de la carta.' },
  productos: { titulo: 'Productos', icono: 'restaurant_menu', clave: ['id_producto'], columnas: ['id_producto', 'id_categoria', 'nombre', 'precio', 'disponible'], texto: 'Mantiene el precio vigente y enlaza con un solo subtipo. Las líneas conservan el precio aplicado.' },
  snacks: { titulo: 'Snacks', icono: 'takeout_dining', clave: ['id_producto'], columnas: ['id_producto', 'porcion', 'incluye_cremas'], texto: 'Registra la presentación de los snacks, como cono, al plato o para compartir.' },
  bebidas: { titulo: 'Bebidas', icono: 'local_drink', clave: ['id_producto'], columnas: ['id_producto', 'tipo_bebida', 'envase'], texto: 'Clasifica las bebidas como gaseosa o chicha cuando corresponde.' },
  hamburguesas: { titulo: 'Hamburguesas', icono: 'lunch_dining', clave: ['id_producto'], columnas: ['id_producto', 'tipo_carne', 'incluye_papas'], texto: 'Distingue las variantes de res y pollo e indica si incluyen papas.' },
  pedidos: { titulo: 'Pedidos', icono: 'shopping_bag', clave: ['id_pedido'], columnas: ['id_pedido', 'id_cliente', 'fecha_pedido', 'tipo_pedido', 'estado'], texto: 'Registra cliente, fecha, modalidad y estado de una comanda.' },
  detalle_pedido: { titulo: 'Detalle del pedido', icono: 'list_alt', clave: ['id_pedido', 'id_producto'], columnas: ['id_pedido', 'id_producto', 'cantidad', 'precio_unitario'], texto: 'Resuelve la relación entre pedidos y productos. Registra la cantidad y el precio aplicado.' },
};

export const totalLineas = (lineas) => lineas.reduce((suma, linea) => suma + linea.cantidad * linea.precio_unitario, 0);
export const lineasDe = (tablas, pedido) => tablas.detalle_pedido.filter((linea) => linea.id_pedido === pedido);

function obtenerPedido(tablas, id) {
  const pedido = tablas.pedidos.find((fila) => fila.id_pedido === id);
  if (!pedido) throw new Error('Selecciona un pedido disponible.');
  return pedido;
}

function editable(tablas, id) {
  const pedido = obtenerPedido(tablas, id);
  if (pedido.estado === 'Anulado') throw new Error('Selecciona un pedido vigente.');
  return pedido;
}

function obtenerLinea(tablas, id, producto) {
  const linea = tablas.detalle_pedido.find((fila) => fila.id_pedido === id && fila.id_producto === producto);
  if (!linea) throw new Error('La línea ya no existe en el pedido.');
  return linea;
}

function filasCambiadas(antes, despues, tablas) {
  return tablas.split(', ').flatMap((tabla) => {
    const { clave, columnas } = esquema[tabla];
    const conClave = (filas) => new Map(filas.map((fila) => [JSON.stringify(clave.map((campo) => fila[campo])), fila]));
    const previas = conClave(antes[tabla]);
    const nuevas = conClave(despues[tabla]);
    return [...new Set([...previas.keys(), ...nuevas.keys()])].flatMap((id) => {
      const previa = previas.get(id);
      const nueva = nuevas.get(id);
      const campos = columnas.filter((campo) => previa?.[campo] !== nueva?.[campo]);
      return campos.length ? [{ tabla, previa, nueva, campos }] : [];
    });
  });
}

export function operar(base, accion) {
  const siguiente = structuredClone(base);
  const { tablas, secuencias, cambios } = siguiente;
  const { tipo, id, producto } = accion;
  const fecha = new Date().toISOString();
  let elegido = id;
  let mensaje;
  let cambia;

  switch (tipo) {
    case 'crear':
    case 'editar-pedido': {
      if (!tablas.clientes.some((cliente) => cliente.id_cliente === accion.cliente) || !modalidades.includes(accion.modalidad)) {
        throw new Error('Selecciona un cliente de prueba y una modalidad.');
      }
      if (tipo === 'crear') {
        elegido = secuencias.pedido++;
        tablas.pedidos.push({ id_pedido: elegido, id_cliente: accion.cliente, tipo_pedido: accion.modalidad, fecha_pedido: fecha, estado: 'Pendiente' });
        mensaje = `Se creó el pedido #${elegido}.`;
      } else {
        const pedido = editable(tablas, id);
        Object.assign(pedido, { id_cliente: accion.cliente, tipo_pedido: accion.modalidad });
        mensaje = `Se guardó el cliente y la modalidad del pedido #${id}.`;
      }
      cambia = 'pedidos';
      break;
    }
    case 'agregar':
    case 'cantidad': {
      editable(tablas, id);
      if (!Number.isInteger(accion.cantidad) || accion.cantidad < 1 || accion.cantidad > 999) throw new Error('La cantidad debe estar entre 1 y 999.');
      const ficha = tablas.productos.find((fila) => fila.id_producto === producto && fila.disponible);
      if (!ficha) throw new Error('Elige un producto disponible.');
      const linea = lineasDe(tablas, id).find((fila) => fila.id_producto === producto);
      if (tipo === 'cantidad' && !linea) throw new Error('Selecciona una línea existente.');
      if (linea) {
        const nuevaCantidad = tipo === 'cantidad' ? accion.cantidad : linea.cantidad + accion.cantidad;
        if (nuevaCantidad > 999) throw new Error('Cada línea admite hasta 999 unidades.');
        linea.cantidad = nuevaCantidad;
      } else {
        tablas.detalle_pedido.push({ id_pedido: id, id_producto: producto, cantidad: accion.cantidad, precio_unitario: ficha.precio });
      }
      mensaje = `Se ${tipo === 'cantidad' ? 'actualizó' : 'agregó'} ${ficha.nombre} en el pedido #${id}.`;
      cambia = 'detalle_pedido';
      break;
    }
    case 'mover': {
      editable(tablas, id);
      editable(tablas, accion.destino);
      if (id === accion.destino) throw new Error('Selecciona un pedido de destino diferente.');
      const origen = obtenerLinea(tablas, id, producto);
      const destino = lineasDe(tablas, accion.destino).find((fila) => fila.id_producto === producto);
      if (destino) {
        if (origen.precio_unitario !== destino.precio_unitario) throw new Error('Los precios históricos difieren entre los pedidos.');
        if (origen.cantidad + destino.cantidad > 999) throw new Error('El traslado excede el máximo de unidades por línea.');
        destino.cantidad += origen.cantidad;
        tablas.detalle_pedido = tablas.detalle_pedido.filter((fila) => fila !== origen);
      } else {
        origen.id_pedido = accion.destino;
      }
      mensaje = `Se movió la línea del pedido #${id} al #${accion.destino}.`;
      cambia = 'detalle_pedido';
      break;
    }
    case 'borrar-linea': {
      editable(tablas, id);
      const linea = obtenerLinea(tablas, id, producto);
      tablas.detalle_pedido = tablas.detalle_pedido.filter((fila) => fila !== linea);
      mensaje = `Se borró una línea del pedido #${id}.`;
      cambia = 'detalle_pedido';
      break;
    }
    case 'estado': {
      const pedido = obtenerPedido(tablas, id);
      if (!estados.includes(accion.estado)) throw new Error('Selecciona un estado válido.');
      pedido.estado = accion.estado;
      mensaje = `El pedido #${id} pasó a «${accion.estado}».`;
      cambia = 'pedidos';
      break;
    }
    case 'borrar-pedido': {
      obtenerPedido(tablas, id);
      tablas.pedidos = tablas.pedidos.filter((fila) => fila.id_pedido !== id);
      tablas.detalle_pedido = tablas.detalle_pedido.filter((fila) => fila.id_pedido !== id);
      elegido = tablas.pedidos.findLast((fila) => fila.estado === 'Pendiente')?.id_pedido ?? tablas.pedidos.at(-1)?.id_pedido;
      mensaje = `Se borró el pedido #${id} con sus líneas.`;
      cambia = 'pedidos, detalle_pedido';
      break;
    }
    default:
      throw new Error('La operación solicitada no está disponible.');
  }

  cambios.unshift({ mensaje, tabla: cambia, filas: filasCambiadas(base.tablas, tablas, cambia) });
  cambios.splice(12);
  return { base: siguiente, elegido, mensaje };
}
