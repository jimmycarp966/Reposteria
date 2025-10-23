[Previous content up to line 548]

### 3. `confirm_order_and_update_stock(order_id UUID, force_confirm BOOLEAN DEFAULT FALSE) → JSON`

**Transacción atómica** que confirma un pedido y opcionalmente descuenta stock.

```sql
BEGIN TRANSACTION;

1. Verificar stock (call check_stock_availability)
2. Si hay faltantes Y force_confirm = FALSE → ROLLBACK + retornar error con lista de faltantes

3. UPDATE orders SET 
   status = 'CONFIRMED',
   has_stock_shortage = (hay_faltantes)

4. Si hay stock suficiente:
   INSERT INTO inventory_movements
   - Para cada ingrediente usado
   - quantity = -(SUM por producto)
   - type = 'OUT'

   UPDATE inventory
   - quantity = quantity - usado

COMMIT;
RETURN { 
  success: true, 
  message: '...', 
  has_shortages: boolean,
  shortages: [] // lista de faltantes si hay
}
```

[Rest of the file remains the same]