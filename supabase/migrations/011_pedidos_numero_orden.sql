-- Número de orden para cada pedido (ORD-0001, ORD-0002, ...)
create sequence if not exists pedidos_numero_orden_seq;

alter table pedidos add column if not exists numero_orden int;

-- Asignar números a pedidos existentes (por fecha de creación)
update pedidos p set numero_orden = sub.n from (
  select id, row_number() over (order by created_at) as n from pedidos
) sub where p.id = sub.id;

-- Secuencia para nuevos pedidos
select setval('pedidos_numero_orden_seq', coalesce((select max(numero_orden) from pedidos), 0) + 1);

alter table pedidos alter column numero_orden set default nextval('pedidos_numero_orden_seq');
