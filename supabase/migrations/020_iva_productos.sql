-- IVA 19% opcional por producto
-- aplica_iva: si true, se suma 19% al precio base. El admin decide por producto.
-- Por defecto true (lo legal) pero puede desactivarse si el producto está exento.

alter table productos
  add column if not exists aplica_iva boolean not null default true;

comment on column productos.aplica_iva is 'Si true, se cobra IVA 19% sobre el precio. Por defecto true.';

-- En presentaciones: nullable = hereda del producto
alter table producto_presentaciones
  add column if not exists aplica_iva boolean;

comment on column producto_presentaciones.aplica_iva is 'Si null, hereda de productos.aplica_iva. Si no null, override por presentación.';
