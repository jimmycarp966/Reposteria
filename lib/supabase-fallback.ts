/**
 * Sistema de fallback para cuando no hay conexión a Supabase
 * Proporciona datos de ejemplo para desarrollo
 */

// Datos de ejemplo para desarrollo
export const MOCK_DATA = {
  ingredients: [
    {
      id: '1',
      name: 'Harina 000',
      unit: 'kg',
      cost_per_unit: 120,
      supplier: 'Distribuidora Central',
      lead_time_days: 2,
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Azúcar',
      unit: 'kg',
      cost_per_unit: 80,
      supplier: 'Distribuidora Central',
      lead_time_days: 1,
      created_at: new Date().toISOString()
    },
    {
      id: '3',
      name: 'Huevos',
      unit: 'docena',
      cost_per_unit: 300,
      supplier: 'Granja Local',
      lead_time_days: 0,
      created_at: new Date().toISOString()
    }
  ],
  
  recipes: [
    {
      id: '1',
      name: 'Torta de Chocolate',
      description: 'Deliciosa torta de chocolate casera',
      servings: 8,
      version: 1,
      active: true,
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Cupcakes de Vainilla',
      description: 'Cupcakes esponjosos de vainilla',
      servings: 12,
      version: 1,
      active: true,
      created_at: new Date().toISOString()
    }
  ],
  
  products: [
    {
      id: '1',
      recipe_id: '1',
      name: 'Torta de Chocolate',
      base_cost_cache: 150,
      suggested_price_cache: 240,
      sku: 'TORTA-CHOC-001',
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      recipe_id: '2',
      name: 'Cupcakes de Vainilla',
      base_cost_cache: 80,
      suggested_price_cache: 128,
      sku: 'CUP-VAIN-001',
      created_at: new Date().toISOString()
    }
  ],
  
  orders: [
    {
      id: '1',
      type: 'DAILY',
      status: 'PENDING',
      delivery_date: (() => {
        const now = new Date()
        const year = now.getFullYear()
        const month = (now.getMonth() + 1).toString().padStart(2, '0')
        const day = now.getDate().toString().padStart(2, '0')
        return `${year}-${month}-${day}`
      })(),
      delivery_time: '15:00',
      total_cost: 150,
      total_price: 240,
      notes: 'Pedido de ejemplo',
      created_at: new Date().toISOString(),
      order_items: [
        {
          id: '1',
          order_id: '1',
          product_id: '1',
          quantity: 1,
          unit_price: 240,
          cost_at_sale: 150,
          production_time_estimate_minutes: 120,
          product: {
            id: '1',
            name: 'Torta de Chocolate',
            image_url: null
          }
        }
      ]
    }
  ],
  
  inventory: [
    {
      id: '1',
      ingredient_id: '1',
      quantity: 5,
      unit: 'kg',
      location: 'Despensa',
      last_updated: new Date().toISOString(),
      ingredient: {
        id: '1',
        name: 'Harina 000',
        unit: 'kg',
        cost_per_unit: 120
      }
    },
    {
      id: '2',
      ingredient_id: '2',
      quantity: 3,
      unit: 'kg',
      location: 'Despensa',
      last_updated: new Date().toISOString(),
      ingredient: {
        id: '2',
        name: 'Azúcar',
        unit: 'kg',
        cost_per_unit: 80
      }
    },
    {
      id: '3',
      ingredient_id: '3',
      quantity: 2,
      unit: 'docena',
      location: 'Heladera',
      last_updated: new Date().toISOString(),
      ingredient: {
        id: '3',
        name: 'Huevos',
        unit: 'docena',
        cost_per_unit: 300
      }
    }
  ]
}

/**
 * Verifica si hay conexión a Supabase
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { supabase } = await import('./supabase')
    const { data, error } = await supabase
      .from('settings')
      .select('key')
      .limit(1)
    
    return !error
  } catch {
    return false
  }
}

/**
 * Obtiene datos de fallback para desarrollo
 */
export function getFallbackData(type: keyof typeof MOCK_DATA) {
  return MOCK_DATA[type]
}

/**
 * Simula estadísticas mensuales
 */
export function getMockMonthlyStats() {
  return {
    totalRevenue: 2400,
    totalCost: 1500,
    profit: 900,
    profitMargin: 37.5,
    orderCount: 8
  }
}

/**
 * Simula próximos pedidos
 */
export function getMockUpcomingOrders() {
  const today = new Date()
  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 7)
  
  return [
    {
      id: '1',
      type: 'DAILY',
      status: 'PENDING',
      delivery_date: nextWeek.toISOString().split('T')[0],
      delivery_time: '15:00',
      total_cost: 150,
      total_price: 240,
      notes: 'Pedido de ejemplo',
      order_items: [
        {
          id: '1',
          quantity: 1,
          unit_price: 240,
          product: {
            name: 'Torta de Chocolate'
          }
        }
      ]
    }
  ]
}

/**
 * Simula ingredientes con stock bajo
 */
export function getMockLowStockIngredients() {
  return [
    {
      id: '1',
      quantity: 2,
      unit: 'kg',
      location: 'Despensa',
      last_updated: new Date().toISOString(),
      ingredient: {
        id: '1',
        name: 'Harina 000',
        unit: 'kg'
      }
    }
  ]
}
