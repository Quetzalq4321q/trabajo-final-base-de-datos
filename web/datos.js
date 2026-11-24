export const categorias = [
  { id_categoria: 'RPSAN', nombre: 'Sánguches' },
  { id_categoria: 'RPEMP', nombre: 'Empanadas' },
  { id_categoria: 'RPSAL', nombre: 'Salchipapas' },
  { id_categoria: 'RPPLA', nombre: 'Salchipapas al plato' },
  { id_categoria: 'RPCOM', nombre: 'Para compartir' },
  { id_categoria: 'RPHAM', nombre: 'Hamburguesas' },
  { id_categoria: 'RPBEB', nombre: 'Bebidas de la carta' },
];

const carta = [
  ['RPSAN', 'Triple clásico', 500, 'Sánguche'],
  ['RPSAN', 'Triple mixto', 550, 'Sánguche'],
  ['RPSAN', 'Triple de durazno', 600, 'Sánguche'],
  ['RPSAN', 'Baguetino de pollo a la brasa', 700, 'Baguetino'],
  ...['Ají de gallina', 'Rocoto relleno', 'Lomo saltado', 'Pizza', 'Hawaiana', 'Queso', 'Triple', 'Chorizo']
    .map((relleno) => ['RPEMP', `Empanada de ${relleno.toLowerCase()}`, 500, 'Empanada']),
  ['RPSAL', 'Salchicono', 500, 'Cono', true],
  ['RPSAL', 'Cono Mix', 600, 'Cono', true],
  ['RPSAL', 'Salchipapa clásica', 800, 'Porción estándar', true],
  ['RPSAL', 'Double Black', 900, 'Porción estándar', true],
  ['RPSAL', 'Choripapas', 1000, 'Porción estándar', true],
  ['RPSAL', 'Salchibrasa', 1000, 'Porción estándar', true],
  ['RPPLA', 'Salchichaufa', 1200, 'Al plato', true],
  ['RPPLA', 'Mostrito con pechuga a la plancha', 1600, 'Al plato'],
  ['RPPLA', 'Jack Pepper', 1400, 'Al plato'],
  ['RPPLA', 'Cheese Pepper', 1500, 'Al plato', true],
  ['RPCOM', 'Extrema', 3000, 'Bandeja para 4 personas'],
  ['RPCOM', 'La Gaucha', 2500, 'Para 4 personas'],
  ...[['Hamburguesa clásica', 800], ['Cheese Burguer', 900], ['La Royal', 1000], ['Doble Burguer', 1500]]
    .flatMap(([nombre, precio]) => ['Res', 'Pollo'].map((carne) => ['RPHAM', `${nombre} de ${carne.toLowerCase()}`, precio, carne])),
  ['RPBEB', 'Chicha morada', 300, 'Chicha'],
  ['RPBEB', 'Maracuyá', 300],
  ['RPBEB', 'Coca-Cola', 400, 'Gaseosa'],
  ['RPBEB', 'Inca Kola', 400, 'Gaseosa'],
  ['RPBEB', 'Fanta', 350, 'Gaseosa'],
  ['RPBEB', 'Agua Cielo', 200],
];

export const productos = carta.map(([id_categoria, nombre, precio], indice) => ({
  id_producto: indice + 1, id_categoria, nombre, precio, disponible: true,
}));

const alimentos = productos.filter((p) => p.id_categoria !== 'RPBEB');
const productosBebida = productos.filter((p) => p.id_categoria === 'RPBEB');
export const snacks = alimentos.filter((p) => p.id_categoria !== 'RPHAM').map(({ id_producto }) => ({
  id_producto, porcion: carta[id_producto - 1][3], incluye_cremas: carta[id_producto - 1][4] ?? null,
}));

export const hamburguesas = alimentos.filter((p) => p.id_categoria === 'RPHAM').map(({ id_producto }) => ({
  id_producto, tipo_carne: carta[id_producto - 1][3], incluye_papas: true,
}));

export const bebidas = productosBebida.map(({ id_producto }) => ({
  id_producto, tipo_bebida: carta[id_producto - 1][3] ?? null, envase: null,
}));

const identidadesFicticias = [
  ['Lucía Elena', 'Salazar Vega'], ['Diego Alonso', 'Huamán Paredes'], ['Camila', 'Rojas Quispe'],
  ['Mateo Andrés', 'Cáceres Flores'], ['Valeria Inés', 'Mendoza Rivas'], ['Sebastián', 'Torres Zavaleta'],
  ['Adriana Milagros', 'Condori Núñez'], ['Nicolás', 'Chávez Medina'], ['Mariana Sofía', 'Vargas León'],
  ['Gabriel Andrés', 'Benavides Soto'], ['Renata', 'Ponce Aguilar'], ['Joaquín', 'Velásquez Campos'],
];

export const clientes = identidadesFicticias.map(([nombres, apellidos], indice) => ({
  id_cliente: indice + 1, nombres, apellidos,
}));

export const modalidades = ['En local', 'Para llevar', 'Delivery'];
export const estados = ['Pendiente', 'En Cocina', 'Entregado', 'Anulado'];

function fechaVenta(indice) {
  const dia = new Date(Date.UTC(2026, 9, 24 + Math.floor(indice * 30 / 100))).toISOString().slice(0, 10);
  const hora = String(12 + (indice * 7) % 9).padStart(2, '0');
  const minutos = String((indice * 13) % 60).padStart(2, '0');
  return `${dia}T${hora}:${minutos}:00-05:00`;
}

function linea(id_pedido, producto, cantidad) {
  return { id_pedido, id_producto: producto.id_producto, cantidad, precio_unitario: producto.precio };
}

export const ventas = Array.from({ length: 100 }, (_, indice) => {
  const id = indice + 1;
  const pedido = {
    id_pedido: id, id_cliente: (indice * 5) % clientes.length + 1, fecha_pedido: fechaVenta(indice),
    tipo_pedido: modalidades[indice % modalidades.length], estado: 'Entregado',
  };
  const detalle = [linea(id, alimentos[indice % alimentos.length], 1 + indice % 3)];
  if (indice % 7 !== 6) {
    detalle.push(linea(id, productosBebida[Math.floor(indice / 2) % productosBebida.length], 1 + indice % 2));
  }
  return { pedido, detalle };
});

export function crearBase() {
  const pedidos = ventas.map(({ pedido }) => pedido);
  const detalle = ventas.flatMap((venta) => venta.detalle);
  const borradores = [
    { id_pedido: 101, id_cliente: 1, fecha_pedido: '2026-11-23T10:00:00-05:00', tipo_pedido: 'En local', estado: 'Pendiente' },
    { id_pedido: 102, id_cliente: 2, fecha_pedido: '2026-11-23T10:05:00-05:00', tipo_pedido: 'Para llevar', estado: 'Pendiente' },
  ];
  return structuredClone({
    tablas: {
      clientes, categorias, productos, snacks, bebidas, hamburguesas,
      pedidos: [...pedidos, ...borradores], detalle_pedido: [...detalle, linea(101, productos[12], 1), linea(102, productosBebida[0], 1)],
    },
    secuencias: { pedido: 103 },
    cambios: [],
  });
}
