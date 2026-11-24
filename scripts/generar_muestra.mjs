import { writeFile } from 'node:fs/promises';
import { bebidas, categorias, clientes, hamburguesas, productos, snacks, ventas } from '../web/datos.js';

const sql = (valor) => {
  if (valor === null || valor === undefined) return 'NULL';
  if (typeof valor === 'string') return `'${valor.replaceAll("'", "''")}'`;
  return String(valor);
};

function insertar(tabla, campos, filas, identidad = false) {
  const valores = filas.map((fila) => `    (${campos.map((campo) => sql(fila[campo])).join(', ')})`);
  return `INSERT INTO ${tabla} (${campos.join(', ')})${identidad ? '\nOVERRIDING SYSTEM VALUE' : ''} VALUES\n${valores.join(',\n')};`;
}

const preciosEnSoles = (filas, campo) => filas.map((fila) => ({ ...fila, [campo]: fila[campo] / 100 }));
const pedidos = ventas.map(({ pedido }) => pedido);
const detalle = ventas.flatMap((venta) => venta.detalle);

const bloques = [
  '-- Muestra ficticia reproducible. Regenerar con node scripts/generar_muestra.mjs.',
  'BEGIN;\nSET LOCAL search_path = salchipaperia, pg_catalog;',
  insertar('clientes', ['id_cliente', 'nombres', 'apellidos'], clientes, true),
  insertar('categorias', ['id_categoria', 'nombre'], categorias),
  insertar('productos', ['id_producto', 'id_categoria', 'nombre', 'precio', 'disponible'], preciosEnSoles(productos, 'precio'), true),
  insertar('snacks', ['id_producto', 'porcion', 'incluye_cremas'], snacks),
  insertar('bebidas', ['id_producto', 'tipo_bebida', 'envase'], bebidas),
  insertar('hamburguesas', ['id_producto', 'tipo_carne', 'incluye_papas'], hamburguesas),
  insertar('pedidos', ['id_pedido', 'id_cliente', 'fecha_pedido', 'tipo_pedido', 'estado'], pedidos, true),
  insertar('detalle_pedido', ['id_pedido', 'id_producto', 'cantidad', 'precio_unitario'], preciosEnSoles(detalle, 'precio_unitario')),
  `SELECT setval(pg_get_serial_sequence('clientes', 'id_cliente'), (SELECT max(id_cliente) FROM clientes));
SELECT setval(pg_get_serial_sequence('productos', 'id_producto'), (SELECT max(id_producto) FROM productos));
SELECT setval(pg_get_serial_sequence('pedidos', 'id_pedido'), (SELECT max(id_pedido) FROM pedidos));`,
  'COMMIT;',
];

await writeFile(new URL('../sql/02_datos_demo.sql', import.meta.url), `${bloques.join('\n\n')}\n`, 'utf8');
