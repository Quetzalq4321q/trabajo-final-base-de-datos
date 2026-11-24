-- Esquema definitivo. Ejecutar en una base de pruebas vacía.
BEGIN;
CREATE SCHEMA salchipaperia;
REVOKE ALL ON SCHEMA salchipaperia FROM PUBLIC;
SET LOCAL search_path = salchipaperia, pg_catalog;

CREATE TABLE clientes (
    id_cliente bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombres varchar(60) NOT NULL CHECK (btrim(nombres) <> ''),
    apellidos varchar(60) NOT NULL CHECK (btrim(apellidos) <> '')
);

CREATE TABLE categorias (
    id_categoria varchar(10) PRIMARY KEY,
    nombre varchar(40) NOT NULL UNIQUE CHECK (btrim(nombre) <> ''),
    descripcion varchar(120)
);

CREATE TABLE productos (
    id_producto bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_categoria varchar(10) NOT NULL REFERENCES categorias,
    nombre varchar(100) NOT NULL CHECK (btrim(nombre) <> ''),
    precio numeric(10,2) NOT NULL CHECK (precio >= 0),
    disponible boolean NOT NULL DEFAULT true,
    UNIQUE (id_categoria, nombre)
);

CREATE TABLE snacks (
    id_producto bigint PRIMARY KEY REFERENCES productos ON DELETE CASCADE,
    porcion varchar(30) NOT NULL CHECK (btrim(porcion) <> ''),
    incluye_cremas boolean DEFAULT true
);

CREATE TABLE bebidas (
    id_producto bigint PRIMARY KEY REFERENCES productos ON DELETE CASCADE,
    tipo_bebida text CHECK (tipo_bebida IN ('Gaseosa', 'Chicha')),
    envase varchar(30) CHECK (btrim(envase) <> '')
);

CREATE TABLE hamburguesas (
    id_producto bigint PRIMARY KEY REFERENCES productos ON DELETE CASCADE,
    tipo_carne text CHECK (tipo_carne IN ('Res', 'Pollo')),
    incluye_papas boolean
);

CREATE TABLE pedidos (
    id_pedido bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_cliente bigint NOT NULL REFERENCES clientes,
    fecha_pedido timestamptz NOT NULL DEFAULT now(),
    tipo_pedido text NOT NULL CHECK (tipo_pedido IN ('En local', 'Para llevar', 'Delivery')),
    estado text NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'En Cocina', 'Entregado', 'Anulado'))
);

CREATE TABLE detalle_pedido (
    id_pedido bigint NOT NULL REFERENCES pedidos ON DELETE CASCADE,
    id_producto bigint NOT NULL REFERENCES productos,
    cantidad integer NOT NULL CHECK (cantidad > 0),
    precio_unitario numeric(10,2) NOT NULL CHECK (precio_unitario >= 0),
    PRIMARY KEY (id_pedido, id_producto)
);

CREATE INDEX pedidos_cliente_idx ON pedidos (id_cliente);
CREATE INDEX pedidos_fecha_idx ON pedidos (fecha_pedido, id_pedido);
CREATE INDEX detalle_producto_idx ON detalle_pedido (id_producto);

CREATE FUNCTION comprobar_subtipo() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, salchipaperia AS $$
DECLARE
    producto bigint;
    subtipos integer;
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.id_producto <> NEW.id_producto THEN
        RAISE EXCEPTION 'La identidad del producto o del subtipo es inmutable' USING ERRCODE = '23514';
    END IF;
    producto := CASE WHEN TG_OP = 'DELETE' THEN OLD.id_producto ELSE NEW.id_producto END;
    PERFORM FROM productos WHERE id_producto = producto FOR NO KEY UPDATE;
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;
    SELECT (EXISTS (SELECT FROM snacks WHERE id_producto = producto))::int
         + (EXISTS (SELECT FROM bebidas WHERE id_producto = producto))::int
         + (EXISTS (SELECT FROM hamburguesas WHERE id_producto = producto))::int
    INTO subtipos;
    IF subtipos <> 1 THEN
        RAISE EXCEPTION 'El producto % debe tener exactamente un subtipo', producto USING ERRCODE = '23514';
    END IF;
    RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER producto_subtipo AFTER INSERT OR UPDATE OF id_producto, id_categoria ON productos
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION comprobar_subtipo();
CREATE CONSTRAINT TRIGGER snack_subtipo AFTER INSERT OR UPDATE OF id_producto OR DELETE ON snacks
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION comprobar_subtipo();
CREATE CONSTRAINT TRIGGER bebida_subtipo AFTER INSERT OR UPDATE OF id_producto OR DELETE ON bebidas
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION comprobar_subtipo();
CREATE CONSTRAINT TRIGGER hamburguesa_subtipo AFTER INSERT OR UPDATE OF id_producto OR DELETE ON hamburguesas
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION comprobar_subtipo();

CREATE FUNCTION agregar_item(p_pedido bigint, p_producto bigint, p_cantidad integer) RETURNS void
LANGUAGE plpgsql SET search_path = pg_catalog, salchipaperia AS $$
DECLARE
    precio_actual numeric(10,2);
BEGIN
    IF p_cantidad IS NULL OR p_cantidad <= 0 THEN
        RAISE EXCEPTION 'La cantidad debe ser positiva' USING ERRCODE = '23514';
    END IF;
    SELECT precio INTO precio_actual FROM productos WHERE id_producto = p_producto AND disponible;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Producto % indisponible o inexistente', p_producto USING ERRCODE = '23514';
    END IF;
    INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario)
    VALUES (p_pedido, p_producto, p_cantidad, precio_actual)
    ON CONFLICT (id_pedido, id_producto) DO UPDATE
    SET cantidad = detalle_pedido.cantidad + EXCLUDED.cantidad;
END;
$$;

REVOKE ALL ON ALL TABLES IN SCHEMA salchipaperia FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA salchipaperia FROM PUBLIC;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA salchipaperia FROM PUBLIC;
COMMIT;
