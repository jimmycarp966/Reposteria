import { getOrders } from "@/actions/orderActions"
import { OrdersClient } from "./OrdersClient"

export default async function PedidosPage() {
  const result = await getOrders({ page: 1, pageSize: 20 })
  const orders = result.success && result.data ? result.data : []
  const pagination = result.pagination

  return <OrdersClient initialOrders={orders} initialPagination={pagination} />
}
