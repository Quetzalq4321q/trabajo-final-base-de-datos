-- Ejecutar el archivo completo en la base de pruebas.
-- Los identificadores negativos no consumen valores de la secuencia.
BEGIN;
SET LOCAL search_path = salchipaperia, pg_catalog;

-- Dos comandas de trabajo para practicar el traslado.
INSERT INTO pedidos (id_pedido, id_cliente, tipo_pedido)
OVERRIDING SYSTEM VALUE
VALUES (-1, 1, 'En local'), (-2, 1, 'Para llevar');

-- Agregar tres sánguches Triple clásico a la primera comanda.
SELECT agregar_item(-1, 1, 3);
SELECT '1. Agregar' AS paso, id_pedido, id_producto, cantidad, precio_unitario,
       cantidad * precio_unitario AS subtotal_pen
FROM detalle_pedido
WHERE id_pedido = -1;

-- Editar la cantidad, conservando el precio de la línea.
UPDATE detalle_pedido
SET cantidad = 2
WHERE id_pedido = -1 AND id_producto = 1;
SELECT '2. Editar' AS paso, id_pedido, id_producto, cantidad, precio_unitario,
       cantidad * precio_unitario AS subtotal_pen
FROM detalle_pedido
WHERE id_pedido = -1;

-- Trasladar la línea a la segunda comanda, que está vacía en la demo.
UPDATE detalle_pedido
SET id_pedido = -2
WHERE id_pedido = -1 AND id_producto = 1;
SELECT '3. Mover' AS paso, id_pedido, id_producto, cantidad, precio_unitario,
       cantidad * precio_unitario AS subtotal_pen
FROM detalle_pedido
WHERE id_pedido = -2;

-- Eliminar la línea y comprobar que ambas comandas quedaron vacías.
DELETE FROM detalle_pedido
WHERE id_pedido = -2 AND id_producto = 1;
SELECT '4. Eliminar' AS paso, p.id_pedido, count(d.id_producto) AS lineas,
       coalesce(sum(d.cantidad * d.precio_unitario), 0.00) AS total_pen
FROM pedidos p LEFT JOIN detalle_pedido d USING (id_pedido)
WHERE p.id_pedido IN (-1, -2)
GROUP BY p.id_pedido
ORDER BY p.id_pedido DESC;

ROLLBACK;
