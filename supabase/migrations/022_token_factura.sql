-- Token único para compartir factura de forma segura
-- Sin el token, /factura/[id] no muestra la factura
alter table pedidos add column if not exists token_factura text unique;

-- Generar tokens para pedidos existentes
update pedidos
set token_factura = encode(gen_random_bytes(24), 'hex')
where token_factura is null;

-- Índice para búsqueda por token
create unique index if not exists pedidos_token_factura_idx on pedidos (token_factura) where token_factura is not null;
