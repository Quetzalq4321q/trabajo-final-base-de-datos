-- Reportes de ventas en soles. Una venta corresponde a un pedido entregado.
-- Los importes se calculan con el precio histórico de cada línea.
BEGIN READ ONLY;
SET LOCAL search_path = salchipaperia, pg_catalog;

-- Reporte 1. Pedidos, líneas, unidades, venta y ticket promedio por modalidad.
WITH por_pedido AS (
    SELECT p.id_pedido, p.tipo_pedido,
           count(d.id_producto) AS lineas,
           coalesce(sum(d.cantidad), 0) AS unidades,
           coalesce(sum(d.cantidad * d.precio_unitario), 0.00) AS venta_pen
    FROM pedidos p
    LEFT JOIN detalle_pedido d USING (id_pedido)
    WHERE p.estado = 'Entregado'
    GROUP BY p.id_pedido, p.tipo_pedido
)
SELECT tipo_pedido AS modalidad, count(*) AS pedidos, sum(lineas) AS lineas,
       sum(unidades) AS unidades, sum(venta_pen) AS venta_pen,
       round(avg(venta_pen), 2) AS ticket_promedio_pen
FROM por_pedido
GROUP BY tipo_pedido
ORDER BY venta_pen DESC, modalidad;

-- Reporte 2. Los cinco productos con más unidades. El importe y el nombre
-- resuelven empates. El identificador mantiene un orden estable.
SELECT pr.id_producto, pr.nombre, sum(d.cantidad) AS unidades,
       sum(d.cantidad * d.precio_unitario) AS venta_pen
FROM pedidos p
JOIN detalle_pedido d USING (id_pedido)
JOIN productos pr USING (id_producto)
WHERE p.estado = 'Entregado'
GROUP BY pr.id_producto, pr.nombre
ORDER BY unidades DESC, venta_pen DESC, pr.nombre, pr.id_producto
LIMIT 5;

-- Reporte 3. Importes por fecha local. Solo aparecen días con pedidos entregados.
SELECT (p.fecha_pedido AT TIME ZONE 'America/Lima')::date AS fecha_lima,
       count(DISTINCT p.id_pedido) AS pedidos,
       coalesce(sum(d.cantidad * d.precio_unitario), 0.00) AS venta_pen
FROM pedidos p
LEFT JOIN detalle_pedido d USING (id_pedido)
WHERE p.estado = 'Entregado'
GROUP BY fecha_lima
ORDER BY fecha_lima;

COMMIT;
