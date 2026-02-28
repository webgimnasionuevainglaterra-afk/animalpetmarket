# Sistema de inventario sencillo

## Objetivo
Saber cuánto producto hay, por lote y fecha de vencimiento.

## Estructura propuesta

### Tabla `inventario_lotes`
Registra el stock por presentación de producto, con lote y vencimiento.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | PK |
| producto_presentacion_id | uuid | FK → producto_presentaciones |
| lote | text | Número/código de lote |
| cantidad | int | Unidades en stock |
| fecha_vencimiento | date | Fecha de vencimiento |
| created_at | timestamptz | Cuándo se ingresó |

**Relación:** Cada fila = X unidades de una presentación (ej. Royal Canin 1kg), de un lote con vencimiento Y.

### Flujo

1. **Ingreso de stock:** Formulario para cargar lote, cantidad y fecha de vencimiento por presentación.
2. **Consulta de stock:** Suma de `cantidad` por `producto_presentacion_id` (o por producto).
3. **Descuento al despachar:** Al marcar pedido como "Despachado", restar de los lotes (FIFO: primero los que vencen antes).

## Integración con lo existente

- **producto_presentaciones:** Ya existe (500g, 1kg, etc.). El inventario se vincula por `producto_presentacion_id`.
- **pedido_items:** Tiene `producto_id`, `presentacion` (texto), `cantidad`. Al despachar, se busca la presentación y se descuenta.

## Pasos de implementación

1. **Migración:** Crear tabla `inventario_lotes` con índices y RLS.
2. **UI ingreso:** Página `/dashboard/inventario` para cargar lotes (producto → presentación → lote, cantidad, vencimiento).
3. **UI consulta:** Listado de stock por producto/presentación, con alertas de vencimiento cercano.
4. **Descuento automático:** En la acción `marcarDespachado`, antes de registrar la venta, descontar de `inventario_lotes` (FIFO) según los ítems del pedido.
5. **Validación:** No despachar si no hay stock suficiente (opcional).

## Vista de stock útil

```sql
-- Stock total por presentación
SELECT pp.id, p.nombre, pp.nombre as presentacion,
       COALESCE(SUM(il.cantidad), 0) as stock,
       MIN(il.fecha_vencimiento) as proximo_vencimiento
FROM producto_presentaciones pp
JOIN productos p ON p.id = pp.producto_id
LEFT JOIN inventario_lotes il ON il.producto_presentacion_id = pp.id
  AND il.fecha_vencimiento >= current_date
GROUP BY pp.id, p.nombre, pp.nombre;
```
