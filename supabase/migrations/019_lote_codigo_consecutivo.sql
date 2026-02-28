-- Código consecutivo para lotes: fecha ingreso + cantidad + fecha vencimiento
-- Formato: ING-YYYYMMDD-SEQ-CANT-VENC-YYYYMMDD
create sequence if not exists inventario_lotes_codigo_seq;

-- Función para generar el código al insertar (trigger)
create or replace function generar_codigo_lote()
returns trigger
language plpgsql
as $$
declare
  v_ingreso text;
  v_venc text;
  v_seq int;
begin
  v_ingreso := to_char(now(), 'YYYYMMDD');
  v_venc := replace(new.fecha_vencimiento::text, '-', '');
  v_seq := nextval('inventario_lotes_codigo_seq');
  new.lote := 'ING-' || v_ingreso || '-' || lpad(v_seq::text, 4, '0') || '-' || new.cantidad || '-VENC-' || v_venc;
  return new;
end;
$$;

drop trigger if exists trg_generar_codigo_lote on inventario_lotes;
create trigger trg_generar_codigo_lote
  before insert on inventario_lotes
  for each row
  execute function generar_codigo_lote();
