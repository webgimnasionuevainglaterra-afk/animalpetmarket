-- Ofertas: porcentaje de descuento en productos y presentaciones
alter table productos add column if not exists porcentaje_oferta int default null
  check (porcentaje_oferta is null or (porcentaje_oferta >= 1 and porcentaje_oferta <= 99));

alter table producto_presentaciones add column if not exists porcentaje_oferta int default null
  check (porcentaje_oferta is null or (porcentaje_oferta >= 1 and porcentaje_oferta <= 99));

create index if not exists productos_oferta_idx on productos (porcentaje_oferta) where porcentaje_oferta is not null;
create index if not exists producto_presentaciones_oferta_idx on producto_presentaciones (porcentaje_oferta) where porcentaje_oferta is not null;
