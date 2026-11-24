-- Inventario del esquema y totales esperados para la muestra original.
SELECT table_name AS tabla
FROM information_schema.tables
WHERE table_schema = 'salchipaperia' AND table_type = 'BASE TABLE'
ORDER BY table_name;

SELECT (SELECT count(*) FROM salchipaperia.clientes) AS clientes,
       (SELECT count(*) FROM salchipaperia.productos) AS productos,
       (SELECT count(*) FROM salchipaperia.pedidos) AS pedidos,
       count(*) AS lineas, sum(cantidad * precio_unitario) AS total_pen
FROM salchipaperia.detalle_pedido;

-- Importe de todas las comandas por modalidad, incluyendo los borradores.
SELECT p.tipo_pedido AS modalidad, count(DISTINCT p.id_pedido) AS pedidos,
       coalesce(sum(d.cantidad * d.precio_unitario), 0.00) AS total_pen
FROM salchipaperia.pedidos p LEFT JOIN salchipaperia.detalle_pedido d USING (id_pedido)
GROUP BY p.tipo_pedido
ORDER BY modalidad;

-- Catálogo de hamburguesas con los atributos de su subtipo.
SELECT p.nombre, h.tipo_carne, h.incluye_papas, p.precio
FROM salchipaperia.hamburguesas h JOIN salchipaperia.productos p USING (id_producto)
ORDER BY p.nombre;

-- Cambiar el número de pedido para consultar otra comanda.
SELECT p.id_pedido, concat_ws(' ', c.nombres, c.apellidos) AS cliente,
       p.fecha_pedido AT TIME ZONE 'America/Lima' AS fecha_lima,
       prod.nombre AS producto, d.cantidad, d.precio_unitario,
       d.cantidad * d.precio_unitario AS subtotal_pen
FROM salchipaperia.pedidos p
JOIN salchipaperia.clientes c USING (id_cliente)
JOIN salchipaperia.detalle_pedido d USING (id_pedido)
JOIN salchipaperia.productos prod USING (id_producto)
WHERE p.id_pedido = 1
ORDER BY prod.nombre;
