import { getAllSettings, getEvents, getPriceRules } from "@/actions/settingsActions"
import { getTaskCategories } from "@/actions/categoryActions"
import { ConfigClient } from "./ConfigClient"

export default async function ConfiguracionPage() {
  const [settingsResult, eventsResult, priceRulesResult, categoriesResult] = await Promise.all([
    getAllSettings(),
    getEvents(),
    getPriceRules(),
    getTaskCategories(),
  ])

  const settings = settingsResult.success && settingsResult.data ? settingsResult.data : []
  const events = eventsResult.success && eventsResult.data ? eventsResult.data : []
  const priceRules = priceRulesResult.success && priceRulesResult.data ? priceRulesResult.data : []
  const categories = categoriesResult.success && categoriesResult.data ? categoriesResult.data : []

  return <ConfigClient settings={settings} events={events} priceRules={priceRules} categories={categories} />
}
