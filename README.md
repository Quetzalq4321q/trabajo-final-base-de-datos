# Trabajo final de Base de Datos · Red Pepper

**Papichulos Team**

- Gabriel Andre Pajuelo Aranibar
- Victor Gabriel Lupinta Flores
- Armando Manuel Enriquez Eguiluz

La entrega modela el catálogo y los pedidos de Red Pepper en PostgreSQL. La muestra contiene 100 pedidos ficticios y la guía visual permite recorrer sus tablas, relaciones y operaciones de práctica.

- [Informe final en PDF](informe/informe_final_red_pepper.pdf)
- [Guía visual](#abrir-la-guía-visual)
- [Scripts de PostgreSQL](sql/)

## Abrir la guía visual

Clona el repositorio con una cuenta de GitHub que tenga acceso. Con Python 3 instalado, inicia el servidor desde la raíz del proyecto.

```sh
git clone https://github.com/Quetzalq4321q/trabajo-final-base-de-datos.git
cd trabajo-final-base-de-datos
python -m http.server 8000 --bind 127.0.0.1
```

En Windows puedes usar `py -3` en lugar de `python`. Pulsa **Ctrl+C** para detener el servidor. [Abrir la guía](http://127.0.0.1:8000/web/) · [Abrir el mapa de entidades](http://127.0.0.1:8000/web/#modelo)

1. En **Modelo entidad–relación**, selecciona una tabla para ver sus claves y relaciones.
2. En **Guía de ventas**, crea una comanda y agrega un producto. El panel **Qué cambió en los datos** muestra los campos modificados.
3. En **Editar pedidos**, cambia la cantidad o mueve una línea a otro pedido.
4. En **Resumen del pedido**, verifica cómo las líneas determinan el total.

La guía usa datos de demostración y guarda las prácticas en el navegador. Incluye dos pedidos adicionales en borrador para ensayar traslados.

## Reproducir la base de datos

Con PostgreSQL iniciado y los comandos `createdb` y `psql` disponibles, crea una base nueva. Sustituye `postgres` por tu usuario local si corresponde.

```sh
createdb -h localhost -U postgres red_pepper_final
psql -X -h localhost -U postgres -d red_pepper_final -v ON_ERROR_STOP=1
```

Dentro de `psql`, ejecuta estos archivos desde la raíz del proyecto.

```text
\encoding UTF8
\i sql/01_esquema.sql
\i sql/02_datos_demo.sql
\i sql/03_consultas.sql
\dt salchipaperia.*
```

El resultado esperado es **8 tablas, 12 clientes ficticios, 38 productos, 100 pedidos, 186 líneas y S/ 2,303.50**. En DataGrip puedes ejecutar los mismos archivos en orden desde una consola conectada a una base vacía. [Consultas de verificación](sql/03_consultas.sql)

La muestra SQL se deriva de [`web/datos.js`](web/datos.js). Para regenerarla, ejecuta `node scripts/generar_muestra.mjs` con Node.js 22 o posterior.
