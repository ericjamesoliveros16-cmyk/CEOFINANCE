import { useCallback, useEffect, useState } from 'react'

const COINS = ['ripple', 'bitcoin', 'ethereum', 'solana', 'pax-gold', 'kinesis-silver']
const readOverrides = () => {
  try { return JSON.parse(localStorage.getItem('aureum-overrides') || '{}') } catch { return {} }
}

export function useLivePrices(currency) {
  const [prices, setPrices] = useState({})
  const [rates, setRates] = useState({ SGD: 1.35, USD: 1, EUR: 0.92, PHP: 58.2 })
  const [overrides, setOverrides] = useState(readOverrides)
  const [status, setStatus] = useState('loading')
  const [lastUpdated, setLastUpdated] = useState(null)

  const refresh = useCallback(async () => {
    setStatus('loading')
    const results = await Promise.allSettled([
      fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${COINS.join(',')}&vs_currencies=usd&include_24hr_change=true`).then(r => {
        if (!r.ok) throw new Error(`CoinGecko returned ${r.status}`)
        return r.json()
      }),
      fetch('https://open.er-api.com/v6/latest/USD').then(r => {
        if (!r.ok) throw new Error(`Exchange-rate service returned ${r.status}`)
        return r.json()
      }),
    ])
    let updated = false
    if (results[0].status === 'fulfilled') {
      const raw = results[0].value
      setPrices(current => ({ ...current, ...Object.fromEntries(Object.entries(raw).map(([id, p]) => [id, { usd: p.usd, change: p.usd_24h_change || 0 }])) }))
      updated = true
    }
    if (results[1].status === 'fulfilled' && results[1].value.rates) {
      setRates(current => ({ ...current, ...results[1].value.rates }))
      updated = true
    }
    setStatus(updated ? 'live' : 'manual')
    if (updated) setLastUpdated(new Date())
  }, [])

  useEffect(() => {
    refresh()
    const timer = setInterval(refresh, 60_000)
    return () => clearInterval(timer)
  }, [refresh])

  const setOverride = (key, value) => {
    const next = { ...overrides, [key]: Number(value) }
    setOverrides(next)
    localStorage.setItem('aureum-overrides', JSON.stringify(next))
    setStatus('manual')
  }
  const clearOverride = key => {
    const next = { ...overrides }
    delete next[key]
    setOverrides(next)
    localStorage.setItem('aureum-overrides', JSON.stringify(next))
    refresh()
  }
  const price = id => overrides[id] ?? prices[id]?.usd ?? 0
  const change = id => prices[id]?.change ?? 0
  const rate = rates[currency] || 1
  const convert = usd => (Number(usd) || 0) * rate
  return { prices, rates, overrides, status, lastUpdated, refresh, setOverride, clearOverride, price, change, convert, rate }
}
