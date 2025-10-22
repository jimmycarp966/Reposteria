import { getAllSettings, getEvents, getPriceRules } from "@/actions/settingsActions"
import { ConfigClient } from "./ConfigClient"

export default async function ConfiguracionPage() {
  const [settingsResult, eventsResult, priceRulesResult] = await Promise.all([
    getAllSettings(),
    getEvents(),
    getPriceRules(),
  ])

  const settings = settingsResult.success && settingsResult.data ? settingsResult.data : []
  const events = eventsResult.success && eventsResult.data ? eventsResult.data : []
  const priceRules = priceRulesResult.success && priceRulesResult.data ? priceRulesResult.data : []

  return <ConfigClient settings={settings} events={events} priceRules={priceRules} />
}
