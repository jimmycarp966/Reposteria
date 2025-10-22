import { getOrders } from "@/actions/orderActions"
import { OrdersClient } from "./OrdersClient"

export default async function PedidosPage() {
  const result = await getOrders()
  const orders = result.success && result.data ? result.data : []

  return <OrdersClient orders={orders} />
}
