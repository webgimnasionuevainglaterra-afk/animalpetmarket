-- Política DELETE en ventas para rechazar pedidos despachados
create policy "Autenticados pueden eliminar ventas"
  on ventas for delete to authenticated using (true);
