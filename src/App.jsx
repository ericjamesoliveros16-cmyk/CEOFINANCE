import { useEffect, useMemo, useState } from 'react'
import {
  Activity, ArrowUpRight, BadgeDollarSign, BarChart3, Bitcoin, BriefcaseBusiness,
  Check, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Download, Eye, EyeOff, FileDown,
  Filter, Gem, Home, KeyRound, LayoutDashboard, LockKeyhole, Menu, MoreHorizontal,
  Plus, Search, Settings, Shield, ShieldCheck, Sparkles, Sprout, TrendingUp, Upload, Wallet, X,
} from 'lucide-react'
import { useLivePrices } from './useLivePrices.js'

const STORE = 'aureum-vault-v1'
const fmt = (n, currency, hidden = false) => hidden ? `${currency === 'SGD' ? 'S$' : currency === 'PHP' ? '₱' : currency === 'EUR' ? '€' : '$'} ••••••` : new Intl.NumberFormat('en', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(n) || 0)
const currencySymbol = c => ({ SGD: 'S$', USD: '$', EUR: '€', PHP: '₱' }[c] || '$')
const uid = () => Math.random().toString(36).slice(2, 9)
const today = () => new Date().toISOString().slice(0, 10)
const seed = {
  goats: [
    { id: 'G-042', name: 'Saffron', breed: 'Boer', category: 'Doe', weight: 54, cost: 860, value: 1250, date: '2024-06-14', status: 'Active', pregnant: true, breedingDate: '2026-09-20', notes: 'Healthy · routine check due' },
    { id: 'G-038', name: 'Atlas', breed: 'Kalahari Red', category: 'Buck', weight: 72, cost: 1100, value: 1480, date: '2024-03-02', status: 'Active', pregnant: false, notes: 'Primary sire' },
    { id: 'G-051', name: 'Clover', breed: 'Boer', category: 'Doe', weight: 48, cost: 740, value: 980, date: '2025-01-19', status: 'Active', pregnant: false },
  ],
  metals: [{ id: uid(), name: 'Gold bullion · 1 oz', metal: 'Gold', weight: 1, unit: 'oz', purity: '999', value: 0 }, { id: uid(), name: 'Silver reserve · 20 oz', metal: 'Silver', weight: 20, unit: 'oz', purity: '999', value: 0 }],
  crypto: [{ id: uid(), name: 'XRP', coinId: 'ripple', quantity: 2400, buy: 0.52, wallet: 'Ledger Cold Vault' }, { id: uid(), name: 'Bitcoin', coinId: 'bitcoin', quantity: 0.18, buy: 42000, wallet: 'Hardware wallet' }, { id: uid(), name: 'Ethereum', coinId: 'ethereum', quantity: 2.4, buy: 2400, wallet: 'Ledger Cold Vault' }, { id: uid(), name: 'Solana', coinId: 'solana', quantity: 18, buy: 95, wallet: 'Exchange · spot' }],
  capital: [{ id: uid(), name: 'Operating reserve', type: 'Cash', value: 28500, currency: 'SGD', notes: 'Private banking' }, { id: uid(), name: 'Orchard residence', type: 'Property', value: 680000, currency: 'SGD', notes: 'Singapore · residential' }, { id: uid(), name: 'Global equity portfolio', type: 'Equities', value: 92000, currency: 'SGD', notes: 'Long-term holdings' }],
  ledger: [{ id: uid(), type: 'System', title: 'Private vault initialized', detail: 'Aureum portfolio is ready for your assets.', impact: 0, date: new Date().toISOString() }],
  currency: 'SGD', private: false, pin: null, hasLaunched: false,
}
function readData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE))
    if (saved && typeof saved === 'object') return { ...seed, ...saved }
  } catch (error) { console.error('Could not read the Aureum vault.', error) }
  return seed
}

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'goats', label: 'Livestock', icon: Sprout },
  { id: 'metals', label: 'Precious metals', icon: Gem },
  { id: 'crypto', label: 'Digital assets', icon: Bitcoin },
  { id: 'capital', label: 'Capital & property', icon: BriefcaseBusiness },
  { id: 'ledger', label: 'Executive ledger', icon: Activity },
]

function App() {
  const [data, setData] = useState(readData)
  const [tab, setTab] = useState('overview')
  const [dialog, setDialog] = useState(null)
  const [settings, setSettings] = useState(false)
  const [locked, setLocked] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState('')
  const [mobileNav, setMobileNav] = useState(false)
  const [toast, setToast] = useState('')
  const [goatFilter, setGoatFilter] = useState('Active')
  const [ledgerFilter, setLedgerFilter] = useState('All activity')
  const [projectionOpen, setProjectionOpen] = useState(false)
  const [kiddingRate, setKiddingRate] = useState(1.7)
  const [kidsPerKidding, setKidsPerKidding] = useState(1.8)
  const [marketSearch, setMarketSearch] = useState('')
  const [searchResult, setSearchResult] = useState(null)
  const [searching, setSearching] = useState(false)
  const [overrideGold, setOverrideGold] = useState('')
  const [overrideSilver, setOverrideSilver] = useState('')
  const live = useLivePrices(data.currency)

  useEffect(() => { localStorage.setItem(STORE, JSON.stringify(data)) }, [data])
  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(''), 3000); return () => clearTimeout(t) }
  }, [toast])

  const conversion = n => live.convert(n)
  const goatValue = data.goats.filter(g => g.status === 'Active').reduce((s, g) => s + Number(g.value || 0), 0)
  const metalValueUsd = data.metals.reduce((s, m) => {
    const purity = Number(m.purity) / 1000
    const grams = m.unit === 'oz' ? m.weight * 31.1035 : m.weight
    const spot = live.price(m.metal === 'Gold' ? 'pax-gold' : 'kinesis-silver')
    return s + (spot ? grams * purity * spot / 31.1035 : Number(m.value || 0))
  }, 0)
  const cryptoValueUsd = data.crypto.reduce((s, a) => s + Number(a.quantity || 0) * live.price(a.coinId), 0)
  const capitalValueSgd = data.capital.reduce((s, a) => s + Number(a.value || 0) * (a.currency === 'SGD' ? 1 : (live.rates.SGD || 1) / (live.rates[a.currency] || 1)), 0)
  const buckets = useMemo(() => [
    { name: 'Livestock', value: conversion(goatValue), color: '#10B981', icon: Sprout },
    { name: 'Precious metals', value: conversion(metalValueUsd), color: '#D4AF37', icon: Gem },
    { name: 'Digital assets', value: conversion(cryptoValueUsd), color: '#8B7CF6', icon: Bitcoin },
    { name: 'Capital & property', value: capitalValueSgd * (live.rates[data.currency] || 1) / (live.rates.SGD || 1), color: '#6E9BC5', icon: BriefcaseBusiness },
  ], [goatValue, metalValueUsd, cryptoValueUsd, capitalValueSgd, live.rates, data.currency])
  const totalUsd = goatValue / (live.rates.SGD || 1) + metalValueUsd + cryptoValueUsd + capitalValueSgd / (live.rates.SGD || 1)
  const total = conversion(totalUsd)
  const totalAssets = buckets.reduce((s, b) => s + b.value, 0)
  const totalChange = data.crypto.reduce((s, a) => s + Number(a.quantity || 0) * live.price(a.coinId) * live.change(a.coinId) / 100, 0)
  const changePercent = cryptoValueUsd ? totalChange / cryptoValueUsd * 100 : 0
  const money = n => fmt(n, data.currency, data.private)
  const priceDisplay = n => fmt(conversion(n), data.currency, data.private)

  const addLedger = (type, title, detail, impact = 0) => {
    setData(d => ({ ...d, ledger: [{ id: uid(), type, title, detail, impact: Number(impact) || 0, date: new Date().toISOString() }, ...d.ledger] }))
  }
  const openForm = (type, item = null) => setDialog({ type, item })
  const saveForm = (type, values, item) => {
    const id = item?.id || uid()
    const title = { goat: item ? 'Herd record updated' : 'Goat acquired', birth: 'New arrival recorded', metal: item ? 'Metal holding updated' : 'Metal added to vault', crypto: 'Digital asset added', capital: item ? 'Capital record updated' : 'Capital added' }[type]
    if (type === 'goat' || type === 'birth') {
      const goat = { ...values, id: values.id || `G-${String(Date.now()).slice(-4)}`, status: values.status || 'Active', pregnant: false, ...item }
      if (type === 'birth') { goat.cost = 0; goat.category = values.gender === 'Female' ? 'Kid' : 'Kid'; goat.value = Number(values.value || 0); goat.status = 'Active' }
      setData(d => ({ ...d, goats: item ? d.goats.map(g => g.id === id ? { ...g, ...values } : g) : [...d.goats, goat] }))
      addLedger(type === 'birth' ? 'Birth' : item ? 'Valuation' : 'Acquisition', type === 'birth' ? `${values.name} born on farm` : title, `${values.name} · ${values.breed || 'Goat'}`, type === 'birth' ? Number(values.value || 0) : Number(values.value || 0) - Number(values.cost || 0))
    } else if (type === 'metal') {
      setData(d => ({ ...d, metals: item ? d.metals.map(m => m.id === id ? { ...m, ...values } : m) : [...d.metals, { ...values, id }] }))
      addLedger('Acquisition', title, `${values.name} · ${values.metal} · ${values.weight} ${values.unit}`, 0)
    } else if (type === 'crypto') {
      setData(d => ({ ...d, crypto: item ? d.crypto.map(a => a.id === id ? { ...a, ...values } : a) : [...d.crypto, { ...values, id }] }))
      addLedger('Acquisition', title, `${values.quantity} ${values.name} · ${values.wallet}`, 0)
    } else if (type === 'capital') {
      setData(d => ({ ...d, capital: item ? d.capital.map(a => a.id === id ? { ...a, ...values } : a) : [...d.capital, { ...values, id }] }))
      addLedger('Valuation', title, `${values.name} · ${values.type}`, values.value)
    }
    setDialog(null); setToast(title)
  }
  const actionGoat = (goat, action) => {
    const labels = { sold: 'Sale recorded', deceased: 'Mortality recorded', pregnant: 'Breeding milestone recorded', update: 'Herd record updated' }
    setDialog({ type: `goat-${action}`, item: goat, title: labels[action] })
  }
  const submitGoatAction = values => {
    const goat = dialog.item
    let updated = { ...goat, ...values }
    let eventType = 'Valuation', impact = Number(values.value || goat.value) - Number(goat.value || 0), detail = `${goat.name} · herd record updated`
    if (dialog.type === 'goat-sold') {
      updated = { ...updated, status: 'Sold', salePrice: Number(values.salePrice), saleDate: values.saleDate }
      eventType = 'Sale'; impact = Number(values.salePrice) - Number(goat.cost || 0); detail = `${goat.name} sold · realized ${money(impact)}`
    } else if (dialog.type === 'goat-deceased') {
      updated = { ...updated, status: 'Deceased', deathDate: values.deathDate, cause: values.cause }
      eventType = 'Mortality'; impact = -Number(goat.value || 0); detail = `${goat.name} · ${values.cause || 'cause not specified'}`
    } else if (dialog.type === 'goat-pregnant') {
      updated = { ...updated, pregnant: true, breedingDate: values.breedingDate }
      eventType = 'Breeding'; impact = 0; detail = `${goat.name} · expected ${new Date(new Date(`${values.breedingDate}T00:00:00`).getTime() + 150 * 86400000).toLocaleDateString()}`
    }
    setData(d => ({ ...d, goats: d.goats.map(g => g.id === goat.id ? updated : g), ledger: [{ id: uid(), type: eventType, title: dialog.title, detail, impact, date: new Date().toISOString() }, ...d.ledger] }))
    setDialog(null); setToast(dialog.title)
  }
  const deleteItem = (type, item) => {
    const key = type === 'metal' ? 'metals' : type === 'crypto' ? 'crypto' : 'capital'
    setData(d => ({ ...d, [key]: d[key].filter(x => x.id !== item.id) }))
    addLedger('Removal', 'Asset removed', item.name, 0); setToast('Asset removed from portfolio')
  }
  const handlePin = e => {
    e?.preventDefault()
    if (pinInput.length !== 4) return
    if (data.pin && data.pin !== pinInput) { setPinError('Incorrect PIN. Please try again.'); setPinInput(''); return }
    if (!data.pin) setData(d => ({ ...d, pin: pinInput, hasLaunched: true }))
    setLocked(false); setPinInput(''); setPinError('')
  }
  const lockVault = () => { if (!data.pin) { setDialog({ type: 'set-pin' }); return } setLocked(true); setPinInput('') }
  const exportVault = () => {
    const blob = new Blob([JSON.stringify({ ...data, exportedAt: new Date().toISOString(), format: 'aureum-vault-backup-v1' }, null, 2)], { type: 'application/json' })
    const href = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = href; a.download = `aureum-vault-${today()}.json`; a.click(); URL.revokeObjectURL(href)
    setToast('Vault backup exported')
  }
  const importVault = e => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result))
        if (!parsed || !['goats', 'metals', 'crypto', 'capital', 'ledger'].every(k => Array.isArray(parsed[k]))) throw new Error('Invalid Aureum vault backup.')
        setData({ ...seed, ...parsed, exportedAt: undefined, format: undefined }); setToast('Vault backup restored')
      } catch (error) { console.error(error); setToast(error.message || 'Could not import backup') }
    }
    reader.onerror = () => setToast('Could not read the selected backup file')
    reader.readAsText(file); e.target.value = ''
  }
  const searchCoin = async e => {
    e.preventDefault(); if (!marketSearch.trim()) return
    setSearching(true); setSearchResult(null)
    try {
      const r = await fetch(`https://api.coingecko.com/api/v3/coins/${encodeURIComponent(marketSearch.trim().toLowerCase())}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`)
      if (!r.ok) throw new Error('CoinGecko token ID not found. Try a valid ID such as cardano.')
      const coin = await r.json()
      setSearchResult({ id: coin.id, name: coin.name, symbol: coin.symbol.toUpperCase(), price: coin.market_data?.current_price?.usd || 0, change: coin.market_data?.price_change_percentage_24h || 0 })
    } catch (error) { setToast(error.message || 'Unable to search CoinGecko right now') }
    finally { setSearching(false) }
  }
  const addCustomCoin = coin => {
    setData(d => ({ ...d, crypto: [...d.crypto, { id: uid(), name: coin.symbol, coinId: coin.id, quantity: 0, buy: 0, wallet: 'Unassigned wallet' }] }))
    setSearchResult(null); setMarketSearch(''); setToast(`${coin.name} added to digital assets`)
  }
  const navigate = id => { setTab(id); setMobileNav(false) }

  if ((locked || (!data.pin && !data.hasLaunched)) && !dialog?.type?.startsWith('set-pin')) return (
    <LockScreen data={data} pinInput={pinInput} setPinInput={setPinInput} pinError={pinError} handlePin={handlePin} onSkip={() => { setData(d => ({ ...d, hasLaunched: true })); setLocked(false) }} />
  )

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
      <div className="brand"><div className="brand-mark">A</div><div><div className="brand-name">AUREUM</div><div className="brand-sub">PRIVATE WEALTH</div></div><button className="icon-btn sidebar-close mobile-only" onClick={() => setMobileNav(false)} aria-label="Close menu"><X size={18}/></button></div>
      <div className="portfolio-label">PORTFOLIO</div>
      <nav className="side-nav">{navItems.map(item => <button key={item.id} className={`nav-item ${tab === item.id ? 'nav-active' : ''}`} onClick={() => navigate(item.id)}><item.icon size={18}/><span>{item.label}</span>{item.id === 'ledger' && <span className="nav-count">{data.ledger.length}</span>}</button>)}</nav>
      <div className="sidebar-bottom">
        <div className="advisor-card"><div className="advisor-top"><span className="online-dot"/><span>VAULT STATUS</span></div><div className="advisor-title">Your wealth, in focus.</div><div className="advisor-desc">Private by design. Yours to command.</div></div>
        <button className="nav-item settings-nav" onClick={() => setSettings(true)}><Settings size={18}/><span>Executive settings</span></button>
        <div className="profile"><div className="avatar">EJ</div><div className="profile-copy"><b>Executive account</b><span>Private client</span></div><button className="icon-btn" onClick={lockVault} title="Lock vault"><LockKeyhole size={16}/></button></div>
      </div>
    </aside>
    {mobileNav && <button className="scrim nav-scrim" onClick={() => setMobileNav(false)} aria-label="Close navigation"/>}
    <main className="main-area">
      <header className="topbar"><div className="topbar-left"><button className="icon-btn mobile-only" onClick={() => setMobileNav(true)} aria-label="Open menu"><Menu size={19}/></button><div className="breadcrumb">Private office <ChevronRight size={14}/><span>{navItems.find(n => n.id === tab)?.label}</span></div></div><div className="topbar-actions"><div className={`feed-status ${live.status === 'live' ? 'feed-live' : ''}`}><i/><span>{live.status === 'live' ? 'LIVE MARKET FEED' : live.status === 'loading' ? 'CONNECTING' : 'MANUAL OVERRIDE'}</span></div><button className="currency-select" aria-label="Currency"><select value={data.currency} onChange={e => setData(d => ({ ...d, currency: e.target.value }))}>{['SGD', 'USD', 'EUR', 'PHP'].map(c => <option key={c}>{c}</option>)}</select><ChevronDown size={13}/></button><button className="icon-btn privacy-btn" onClick={() => setData(d => ({ ...d, private: !d.private }))} title={data.private ? 'Show balances' : 'Hide balances'}>{data.private ? <EyeOff size={17}/> : <Eye size={17}/>}</button><button className="icon-btn lock-btn" onClick={lockVault} title="Lock vault"><LockKeyhole size={16}/></button><button className="icon-btn settings-top" onClick={() => setSettings(true)} title="Settings"><Settings size={17}/></button></div></header>
      <div className="page-content">
        {tab === 'overview' && <Overview data={data} buckets={buckets} total={total} totalAssets={totalAssets} money={money} live={live} changePercent={changePercent} onNavigate={navigate} onForm={openForm} />}
        {tab === 'goats' && <Goats data={data} filter={goatFilter} setFilter={setGoatFilter} onForm={openForm} onAction={actionGoat} onProjection={() => setProjectionOpen(v => !v)} projectionOpen={projectionOpen} kiddingRate={kiddingRate} setKiddingRate={setKiddingRate} kidsPerKidding={kidsPerKidding} setKidsPerKidding={setKidsPerKidding} money={money} />}
        {tab === 'metals' && <Metals data={data} live={live} priceDisplay={priceDisplay} money={money} onForm={openForm} onDelete={item => deleteItem('metal', item)} setOverrideGold={setOverrideGold} overrideGold={overrideGold} setOverrideSilver={setOverrideSilver} overrideSilver={overrideSilver} />}
        {tab === 'crypto' && <Crypto data={data} live={live} money={money} priceDisplay={priceDisplay} onForm={openForm} onDelete={item => deleteItem('crypto', item)} marketSearch={marketSearch} setMarketSearch={setMarketSearch} searchCoin={searchCoin} searching={searching} searchResult={searchResult} addCustomCoin={addCustomCoin} />}
        {tab === 'capital' && <Capital data={data} money={money} onForm={openForm} onDelete={item => deleteItem('capital', item)} />}
        {tab === 'ledger' && <Ledger data={data} money={money} filter={ledgerFilter} setFilter={setLedgerFilter} />}
      </div>
      <footer className="app-footer"><span>© AUREUM PRIVATE WEALTH</span><span><ShieldCheck size={13}/> ENCRYPTED ON THIS DEVICE</span><span>MARKET DATA FOR INFORMATIONAL PURPOSES</span></footer>
    </main>
    {dialog && <Dialog dialog={dialog} data={data} onClose={() => setDialog(null)} onSave={saveForm} onGoatAction={submitGoatAction} setData={setData} setToast={setToast}/>}
    {settings && <SettingsDrawer data={data} setData={setData} onClose={() => setSettings(false)} onExport={exportVault} onImport={importVault} onLock={lockVault} live={live} setToast={setToast}/>}
    {toast && <div className="toast"><Check size={15}/>{toast}</div>}
  </div>
}

function PageTitle({ eyebrow, title, description, actions }) {
  return <div className="page-title-row"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{description && <p>{description}</p>}</div>{actions && <div className="title-actions">{actions}</div>}</div>
}
function Overview({ data, buckets, total, totalAssets, money, live, changePercent, onNavigate, onForm }) {
  const allocation = [...buckets].sort((a, b) => b.value - a.value)
  const portfolioCoins = data.crypto.slice(0, 4)
  const marquee = ['XRP', 'BTC', 'ETH', 'SOL', 'PAXG', 'KAG']
  return <div className="page-stack">
    <div className="market-strip"><div className="market-label"><span className="live-pulse"/> MARKET WATCH</div><div className="market-track">{marquee.map((id, i) => <span className="ticker" key={id}><b>{id}</b><span>{id === 'PAXG' ? priceDisplayShort(live.price('pax-gold'), data.currency, data.private) : id === 'KAG' ? priceDisplayShort(live.price('kinesis-silver'), data.currency, data.private) : priceDisplayShort(live.price({ XRP: 'ripple', BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana' }[id]), data.currency, data.private)}</span><em className={(live.change({ XRP: 'ripple', BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana' }[id] || 'ripple') >= 0) ? 'positive' : 'negative'}>{id === 'PAXG' || id === 'KAG' ? 'SPOT' : `${live.change({ XRP: 'ripple', BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana' }[id]).toFixed(2)}%`}</em>{i < marquee.length - 1 && <span className="ticker-divider"/>}</span>)}</div><div className="market-updated">{live.lastUpdated ? `UPDATED ${live.lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'AWAITING FEED'}</div></div>
    <PageTitle eyebrow="TUESDAY, 18 NOVEMBER 2026" title="Good evening, Executive." description="Your private office. One clear view of everything you’ve built." actions={<button className="button-secondary" onClick={() => onForm('capital')}><Plus size={16}/> Add an asset</button>}/>
    <section className="hero-card"><div className="hero-top"><div className="hero-caption"><span className="hero-icon"><BadgeDollarSign size={17}/></span><span>CONSOLIDATED NET WORTH</span><span className="secure-tag"><ShieldCheck size={12}/> PRIVATE VIEW</span></div><span className="hero-date">AS OF TODAY <span className="hero-date-dot"/></span></div><div className="hero-main"><div><div className="hero-total">{money(total)}</div><div className="hero-change"><span className="change-pill"><ArrowUpRight size={14}/>{Math.abs(changePercent).toFixed(2)}%</span><span>24H market movement</span><span className="change-separator"/> <span>{money(Math.abs(live.convert(data.crypto.reduce((s, a) => s + Number(a.quantity || 0) * live.price(a.coinId) * live.change(a.coinId) / 100, 0))))}</span></div></div><div className="hero-watermark">A</div></div><div className="hero-bottom"><span><span className="live-pulse"/> CONSOLIDATED ACROSS {buckets.filter(b => b.value > 0).length} ASSET CLASSES</span><span>VALUATIONS REFRESHED AUTOMATICALLY</span></div></section>
    <div className="quick-actions"><div className="quick-label">QUICK ACTIONS</div><button className="quick-action" onClick={() => onForm('goat')}><span className="quick-icon gold-icon"><Plus size={17}/></span><span><b>Acquire an asset</b><small>Add to your portfolio</small></span><ChevronRight size={16}/></button><button className="quick-action" onClick={() => onForm('birth')}><span className="quick-icon green-icon"><Sprout size={17}/></span><span><b>Log a birth</b><small>Record herd growth</small></span><ChevronRight size={16}/></button><button className="quick-action" onClick={() => onNavigate('capital')}><span className="quick-icon blue-icon"><TrendingUp size={17}/></span><span><b>Update valuation</b><small>Review your holdings</small></span><ChevronRight size={16}/></button></div>
    <div className="overview-grid"><section className="panel allocation-panel"><div className="panel-head"><div><div className="panel-kicker">PORTFOLIO COMPOSITION</div><h2>Asset allocation</h2></div><button className="text-button" onClick={() => onNavigate('capital')}>Full portfolio <ChevronRight size={14}/></button></div><div className="allocation-total"><strong>{money(total)}</strong><span>Across {buckets.length} asset classes</span></div><div className="allocation-bar">{allocation.map(b => <div key={b.name} style={{ width: `${totalAssets ? Math.max(b.value / totalAssets * 100, b.value ? 1.5 : 0) : 0}%`, background: b.color }} title={`${b.name}: ${totalAssets ? (b.value / totalAssets * 100).toFixed(1) : 0}%`}/>)}</div><div className="allocation-list">{allocation.map(b => {const I = b.icon; return <div className="allocation-row" key={b.name}><span className="allocation-name"><i style={{ background: b.color }}/><I size={15}/>{b.name}</span><span className="allocation-number">{money(b.value)}</span><span className="allocation-percent">{totalAssets ? (b.value / totalAssets * 100).toFixed(1) : '0.0'}%</span></div>})}</div><div className="allocation-foot"><span>Net worth includes market-priced assets and manual valuations.</span><span className="foot-live"><span className="live-pulse"/> LIVE</span></div></section>
    <section className="panel holdings-panel"><div className="panel-head"><div><div className="panel-kicker">DIGITAL ASSETS</div><h2>Your market positions</h2></div><button className="round-arrow" onClick={() => onNavigate('crypto')}><ChevronRight size={17}/></button></div><div className="holdings-list">{portfolioCoins.map(c => {const usd = c.quantity * live.price(c.coinId); const coin = c.name.slice(0, 1).toUpperCase(); return <div className="holding-row" key={c.id}><div className={`coin-avatar coin-${c.coinId}`}>{coin}</div><div className="holding-info"><b>{c.name}</b><span>{Number(c.quantity).toLocaleString()} {c.name.toUpperCase()}</span></div><div className="holding-value"><b>{fmt(live.convert(usd), data.currency, data.private)}</b><span className={live.change(c.coinId) >= 0 ? 'positive' : 'negative'}>{live.change(c.coinId) >= 0 ? '+' : ''}{live.change(c.coinId).toFixed(2)}%</span></div></div>})}</div><button className="holdings-footer" onClick={() => onNavigate('crypto')}>View digital assets desk <ChevronRight size={14}/></button></section></div>
    <section className="insight-card"><span className="insight-icon"><Sparkles size={17}/></span><div><b>A considered approach to wealth.</b><p>Your portfolio is consolidated across real assets, digital markets and private capital. Keep every valuation current for a clearer picture.</p></div><span className="insight-mark">AUREUM · PRIVATE OFFICE</span></section>
  </div>
}
function priceDisplayShort(usd, currency, hidden) { return hidden ? '••••••' : `${currencySymbol(currency)}${Number(usd || 0).toLocaleString('en', { maximumFractionDigits: 2 })}` }

function Goats({ data, filter, setFilter, onForm, onAction, onProjection, projectionOpen, kiddingRate, setKiddingRate, kidsPerKidding, setKidsPerKidding, money }) {
  const goats = data.goats.filter(g => filter === 'Active' ? g.status === 'Active' : g.status !== 'Active')
  const active = data.goats.filter(g => g.status === 'Active')
  const does = active.filter(g => g.category === 'Doe').length
  const due = active.filter(g => g.pregnant).length
  const projection = years => {
    let count = active.length, value = active.reduce((s, g) => s + Number(g.value || 0), 0)
    for (let i = 0; i < years; i++) { const born = Math.round(active.filter(g => g.category === 'Doe').length * kiddingRate * kidsPerKidding); count += born; value += born * 650 }
    return { count, value }
  }
  return <div className="page-stack"><PageTitle eyebrow="REAL ASSETS · LIVESTOCK" title="The herd." description="From first arrival to future generations, every animal accounted for." actions={<><button className="button-secondary" onClick={() => onForm('birth')}><Sprout size={16}/> Log a birth</button><button className="button-primary" onClick={() => onForm('goat')}><Plus size={16}/> Acquire goat</button></>}/>
    <div className="stat-grid three"><Stat label="ACTIVE HERD" value={active.length} suffix="head" icon={Sprout}/><Stat label="HERD VALUATION" value={money(active.reduce((s, g) => s + Number(g.value || 0), 0))} icon={BadgeDollarSign}/><Stat label="EXPECTING" value={due} suffix={due === 1 ? 'doe' : 'does'} icon={Activity} accent="green"/></div>
    <section className="panel projection-panel"><button className="projection-toggle" onClick={onProjection}><span className="projection-icon"><TrendingUp size={17}/></span><span><b>Herd projection calculator</b><small>Model your herd’s potential over time</small></span><ChevronDown size={17} className={projectionOpen ? 'rotate-icon' : ''}/></button>{projectionOpen && <div className="projection-body"><div className="projection-controls"><label>Expected kiddings / doe / year<input type="number" min="0" max="4" step=".1" value={kiddingRate} onChange={e => setKiddingRate(Number(e.target.value))}/></label><label>Average kids per kidding<input type="number" min="1" max="5" step=".1" value={kidsPerKidding} onChange={e => setKidsPerKidding(Number(e.target.value))}/></label></div><div className="projection-results">{[1, 3].map(years => <div className="projection-result" key={years}><span>{years}-YEAR OUTLOOK</span><b>{projection(years).count} <small>head</small></b><em>Est. value {money(projection(years).value)}</em></div>)}</div><p className="fine-print">Illustrative estimate assumes the current doe count remains constant, no attrition and a S$650 average kid valuation.</p></div>}</section>
    <div className="section-toolbar"><div className="segmented-control"><button className={filter === 'Active' ? 'selected' : ''} onClick={() => setFilter('Active')}>Active herd <span>{active.length}</span></button><button className={filter === 'Archived' ? 'selected' : ''} onClick={() => setFilter('Archived')}>Archived <span>{data.goats.length - active.length}</span></button></div><span className="list-count">Showing {goats.length} animals</span></div>
    <div className="goat-grid">{goats.map(g => <GoatCard key={g.id} goat={g} money={money} onAction={onAction} onEdit={() => onForm('goat', g)}/>)}</div>
    {!goats.length && <Empty icon={Sprout} title="No animals in this view" text="Add a goat or switch to the archived herd." action={() => onForm('goat')} actionText="Add a goat"/>}
    <div className="ledger-note"><ShieldCheck size={15}/> Every herd event is recorded in your <b>Executive ledger</b>.</div>
  </div>
}
function GoatCard({ goat, money, onAction, onEdit }) {
  const dueDate = goat.pregnant && goat.breedingDate ? new Date(new Date(`${goat.breedingDate}T00:00:00`).getTime() + 150 * 86400000) : null
  const days = dueDate ? Math.ceil((dueDate - new Date()) / 86400000) : null
  return <article className="panel goat-card"><div className="goat-card-top"><div className="goat-avatar"><Sprout size={20}/></div><button className="icon-btn" onClick={onEdit} aria-label={`Edit ${goat.name}`}><MoreHorizontal size={18}/></button></div><div className="goat-name-row"><h3>{goat.name}</h3><span className={`status-chip ${goat.status !== 'Active' ? 'status-muted' : ''}`}>{goat.status}</span></div><div className="goat-meta">{goat.id} <span>·</span> {goat.breed} <span>·</span> {goat.category}</div><div className="goat-value-row"><div><span>EST. MARKET VALUE</span><b>{money(goat.value)}</b></div><div><span>WEIGHT</span><b>{goat.weight || '—'} <small>kg</small></b></div></div>{goat.pregnant && <div className="pregnancy-card"><span className="pregnancy-dot"/><span>Expecting</span><b>{days > 0 ? `${days} days to go` : 'Due date passed'}</b><small>Due {dueDate.toLocaleDateString()}</small></div>}{goat.status === 'Active' ? <div className="goat-actions"><button onClick={onEdit}>Update record</button><button onClick={() => onAction(goat, 'pregnant')}>Breeding</button><button className="action-more" onClick={() => onAction(goat, 'sold')}>Lifecycle</button></div> : <div className="archived-note">{goat.status === 'Sold' ? `Sold for ${money(goat.salePrice || 0)}` : `Deceased · ${goat.cause || 'recorded'}`}</div>}</article>
}

function Metals({ data, live, priceDisplay, money, onForm, onDelete, setOverrideGold, overrideGold, setOverrideSilver, overrideSilver }) {
  const total = data.metals.reduce((s, m) => {const oz = m.unit === 'oz' ? m.weight : m.weight / 31.1035; return s + oz * Number(m.purity) / 1000 * live.price(m.metal === 'Gold' ? 'pax-gold' : 'kinesis-silver')}, 0)
  return <div className="page-stack"><PageTitle eyebrow="TANGIBLE RESERVES · BULLION" title="The metals vault." description="Physical gold and silver, priced against live spot proxies." actions={<button className="button-primary" onClick={() => onForm('metal')}><Plus size={16}/> Add holding</button>}/>
    <div className="metal-spot-grid">{[['Gold spot', 'pax-gold', 'XAU', 'gold'], ['Silver spot', 'kinesis-silver', 'XAG', 'silver']].map(([label, id, ticker, kind]) => <div className={`spot-card spot-${kind}`} key={id}><div className="spot-top"><span className="spot-icon"><Gem size={17}/></span><span className="spot-unit">USD / TROY OZ</span></div><span className="spot-label">{label}</span><b>{priceDisplay(live.price(id))}</b><span className="spot-note"><span className="live-pulse"/> {live.overrides[id] ? 'MANUAL PRICE' : `${ticker} · COINGECKO PROXY`}</span></div>)}</div>
    <div className="spot-disclaimer"><CircleHelp size={15}/> PAX Gold (PAXG) and Kinesis Silver (KAG) are used as spot-price proxies. Metal values are estimates, not dealer quotes.</div>
    <section className="panel asset-table-panel"><div className="panel-head"><div><div className="panel-kicker">PHYSICAL HOLDINGS</div><h2>Vault inventory</h2></div><div className="total-pill">Total value <b>{priceDisplay(total)}</b></div></div><div className="table-scroll"><table><thead><tr><th>ASSET</th><th>METAL</th><th>WEIGHT</th><th>PURITY</th><th>FINE WEIGHT</th><th>EST. VALUE</th><th/></tr></thead><tbody>{data.metals.map(m => {const oz = m.unit === 'oz' ? m.weight : m.weight / 31.1035; const pure = oz * Number(m.purity) / 1000; const value = pure * live.price(m.metal === 'Gold' ? 'pax-gold' : 'kinesis-silver'); return <tr key={m.id}><td><div className="table-primary">{m.name}</div></td><td><span className={`metal-pill ${m.metal.toLowerCase()}`}>{m.metal}</span></td><td className="tabular">{m.weight} {m.unit}</td><td className="tabular">{m.purity}</td><td className="tabular">{pure.toFixed(3)} oz</td><td className="tabular table-value">{priceDisplay(value)}</td><td><div className="row-actions"><button onClick={() => onForm('metal', m)}>Edit</button><button onClick={() => onDelete(m)} aria-label={`Delete ${m.name}`}><X size={15}/></button></div></td></tr>})}</tbody></table></div>{!data.metals.length && <div className="empty-table">Your metals vault is ready for its first holding.</div>}</section>
    <div className="panel manual-spot"><div><b>Offline spot-price override</b><p>Set an indicative USD price per troy ounce. Overrides take priority until cleared.</p></div><div className="override-controls">{[['Gold', 'pax-gold', overrideGold, setOverrideGold], ['Silver', 'kinesis-silver', overrideSilver, setOverrideSilver]].map(([label, key, val, setter]) => <div className="override-field" key={key}><label>{label} USD / oz</label><div><input type="number" placeholder={live.price(key).toFixed(2)} value={val} onChange={e => setter(e.target.value)}/>{live.overrides[key] ? <button onClick={() => { live.clearOverride(key); setter('') }}>Clear</button> : <button onClick={() => { if (Number(val) > 0) {live.setOverride(key, val); setter('')} }}>Set</button>}</div></div>)}</div></div>
  </div>
}

function Crypto({ data, live, money, priceDisplay, onForm, onDelete, marketSearch, setMarketSearch, searchCoin, searching, searchResult, addCustomCoin }) {
  const total = data.crypto.reduce((s, a) => s + Number(a.quantity || 0) * live.price(a.coinId), 0)
  return <div className="page-stack"><PageTitle eyebrow="DIGITAL WEALTH · MULTI-ASSET" title="The digital assets desk." description="A clear view of your token positions, across every wallet." actions={<button className="button-primary" onClick={() => onForm('crypto')}><Plus size={16}/> Add position</button>}/>
    <div className="stat-grid three"><Stat label="TOTAL DIGITAL ASSETS" value={priceDisplay(total)} icon={Bitcoin}/><Stat label="POSITIONS" value={data.crypto.length} suffix="assets" icon={Wallet}/><Stat label="LIVE MARKET FEED" value={live.status === 'live' ? 'Connected' : 'Manual prices'} icon={Activity} accent="green"/></div>
    <section className="panel asset-table-panel"><div className="panel-head"><div><div className="panel-kicker">YOUR WALLETS</div><h2>Portfolio positions</h2></div><div className="total-pill">Market value <b>{priceDisplay(total)}</b></div></div><div className="table-scroll"><table><thead><tr><th>ASSET</th><th>QUANTITY</th><th>PRICE</th><th>24H</th><th>AVG. BUY</th><th>UNREALIZED P&L</th><th>WALLET</th><th/></tr></thead><tbody>{data.crypto.map(a => {const p = live.price(a.coinId), value = a.quantity * p, pnl = a.buy ? (p - a.buy) * a.quantity : 0, pct = a.buy ? (p - a.buy) / a.buy * 100 : 0; return <tr key={a.id}><td><div className="crypto-table-name"><div className={`coin-avatar coin-${a.coinId}`}>{a.name.slice(0, 1).toUpperCase()}</div><div><div className="table-primary">{a.name}</div><small>{a.coinId}</small></div></div></td><td className="tabular">{Number(a.quantity).toLocaleString()}</td><td className="tabular table-value">{priceDisplay(p)}</td><td><span className={live.change(a.coinId) >= 0 ? 'positive' : 'negative'}>{live.change(a.coinId) > 0 ? '+' : ''}{live.change(a.coinId).toFixed(2)}%</span></td><td className="tabular">{a.buy ? priceDisplay(a.buy) : '—'}</td><td><span className={pnl >= 0 ? 'positive' : 'negative'}>{a.buy ? `${pnl >= 0 ? '+' : ''}${priceDisplay(pnl)} (${pct.toFixed(1)}%)` : '—'}</span></td><td className="wallet-label">{a.wallet || '—'}</td><td><div className="row-actions"><button onClick={() => onForm('crypto', a)}>Edit</button><button onClick={() => onDelete(a)} aria-label={`Delete ${a.name}`}><X size={15}/></button></div></td></tr>})}</tbody></table></div>{!data.crypto.length && <div className="empty-table">Add a position to begin tracking your digital assets.</div>}</section>
    <section className="panel coin-search"><div className="coin-search-copy"><div className="panel-kicker">EXPAND YOUR UNIVERSE</div><h2>Add any CoinGecko asset</h2><p>Find a token by its CoinGecko ID, then add it to your desk.</p></div><form onSubmit={searchCoin} className="search-form"><Search size={16}/><input aria-label="CoinGecko token ID" placeholder="Try: cardano, chainlink, avalanche…" value={marketSearch} onChange={e => setMarketSearch(e.target.value)}/><button disabled={searching}>{searching ? 'Searching…' : 'Search'}</button></form>{searchResult && <div className="search-result"><div className="coin-avatar">{searchResult.symbol.slice(0, 1)}</div><div><b>{searchResult.name} <span>{searchResult.symbol}</span></b><small>{searchResult.id} · {priceDisplay(searchResult.price)}</small></div><button className="button-primary small-button" onClick={() => addCustomCoin(searchResult)}><Plus size={14}/> Add</button></div>}</section>
    <p className="fine-print">Market data provided by CoinGecko. Prices can be delayed or unavailable due to public API rate limits. This is not investment advice.</p>
  </div>
}

function Capital({ data, money, onForm, onDelete }) {
  const sum = data.capital.reduce((s, a) => s + Number(a.value || 0), 0)
  return <div className="page-stack"><PageTitle eyebrow="PRIVATE CAPITAL · PROPERTY · EQUITIES" title="Capital & property." description="Cash reserves, real estate and equities. The full picture, in one place." actions={<button className="button-primary" onClick={() => onForm('capital')}><Plus size={16}/> Add holding</button>}/>
    <div className="capital-hero"><div><div className="panel-kicker">MANUALLY VALUED HOLDINGS</div><div className="capital-total">{money(sum)}</div><span>Across {data.capital.length} private capital positions</span></div><div className="capital-decoration"><BriefcaseBusiness size={30}/></div></div>
    <div className="capital-category-grid">{['Cash', 'Equities', 'Property'].map(type => {const list = data.capital.filter(a => a.type === type); const value = list.reduce((s, a) => s + Number(a.value || 0), 0); const I = type === 'Cash' ? Wallet : type === 'Equities' ? BarChart3 : Home; return <div className="panel category-card" key={type}><div className="category-top"><span className="quick-icon gold-icon"><I size={17}/></span><span>{list.length} holdings</span></div><span className="category-label">{type === 'Cash' ? 'CASH RESERVES' : type === 'Equities' ? 'EQUITIES' : 'REAL ESTATE'}</span><b>{money(value)}</b><div className="category-foot">{list.slice(0, 2).map(x => x.name).join(' · ') || 'No holdings yet'}</div></div>})}</div>
    <section className="panel capital-list"><div className="panel-head"><div><div className="panel-kicker">PRIVATE CAPITAL</div><h2>Holdings register</h2></div><span className="list-count">{data.capital.length} positions</span></div>{data.capital.map(a => <div className="capital-row" key={a.id}><div className="capital-row-icon">{a.type === 'Cash' ? <Wallet size={17}/> : a.type === 'Property' ? <Home size={17}/> : <BarChart3 size={17}/>}</div><div className="capital-row-info"><b>{a.name}</b><span>{a.type} · {a.notes || a.currency || 'Manually valued'}</span></div><div className="capital-row-value"><b>{money(a.value)}</b><span>{a.currency || 'SGD'} · manual valuation</span></div><div className="row-actions"><button onClick={() => onForm('capital', a)}>Edit</button><button onClick={() => onDelete(a)} aria-label={`Delete ${a.name}`}><X size={15}/></button></div></div>)}{!data.capital.length && <Empty icon={BriefcaseBusiness} title="Build your private capital register" text="Add cash reserves, property or equity positions." action={() => onForm('capital')} actionText="Add a holding"/>}</section>
    <div className="valuation-note"><Activity size={15}/><span>These valuations are managed by you. Update them periodically for an accurate consolidated net worth.</span></div>
  </div>
}

function Ledger({ data, money, filter, setFilter }) {
  const types = ['All activity', ...new Set(data.ledger.map(e => e.type))]
  const entries = data.ledger.filter(e => filter === 'All activity' || e.type === filter)
  const iconFor = type => type === 'Birth' ? Sprout : type === 'Sale' ? BadgeDollarSign : type === 'Mortality' ? Activity : type === 'Breeding' ? Sprout : type === 'Acquisition' ? Plus : type === 'Valuation' ? TrendingUp : ShieldCheck
  return <div className="page-stack"><PageTitle eyebrow="PRIVATE RECORD · AUDIT HISTORY" title="The executive ledger." description="A transparent, chronological record of your portfolio’s story." actions={<div className="filter-select"><Filter size={15}/><select value={filter} onChange={e => setFilter(e.target.value)}>{types.map(t => <option key={t}>{t}</option>)}</select><ChevronDown size={13}/></div>}/>
    <div className="ledger-summary"><div><span>TOTAL ENTRIES</span><b>{data.ledger.length}</b></div><div><span>THIS MONTH</span><b>{data.ledger.filter(e => new Date(e.date).getMonth() === new Date().getMonth()).length}</b></div><div><span>RECORD INTEGRITY</span><b className="integrity"><ShieldCheck size={16}/> Intact</b></div></div>
    <section className="panel timeline-panel"><div className="timeline-header"><div><div className="panel-kicker">RECENT ACTIVITY</div><h2>Portfolio timeline</h2></div><span className="secure-tag"><LockKeyhole size={12}/> PRIVATE</span></div>{entries.length ? <div className="timeline">{entries.map((event, index) => {const I = iconFor(event.type); return <div className="timeline-row" key={event.id}><div className={`timeline-icon timeline-${event.type.toLowerCase()}`}><I size={16}/></div><div className="timeline-content"><div className="timeline-title">{event.title}</div><div className="timeline-detail">{event.detail}</div><div className="timeline-meta"><span>{event.type}</span><i/> {new Date(event.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</div></div><div className={`timeline-impact ${event.impact > 0 ? 'positive' : event.impact < 0 ? 'negative' : ''}`}>{event.impact ? `${event.impact > 0 ? '+' : ''}${money(event.impact)}` : '—'}</div></div>})}</div> : <Empty icon={Activity} title="No activity found" text="Choose another filter to see more entries."/>}</section>
    <div className="ledger-note"><ShieldCheck size={15}/> Audit entries are stored locally in this browser and included in your vault backup.</div>
  </div>
}

function Stat({ label, value, suffix, icon: Icon, accent }) {
  return <div className="panel stat-card"><div className={`stat-icon ${accent === 'green' ? 'stat-green' : ''}`}><Icon size={17}/></div><div className="stat-label">{label}</div><div className="stat-value">{value}<small>{suffix}</small></div><div className="stat-caption"><span className="live-pulse"/> PORTFOLIO SNAPSHOT</div></div>
}
function Empty({ icon: Icon, title, text, action, actionText }) {
  return <div className="empty-state"><div className="empty-icon"><Icon size={20}/></div><b>{title}</b><p>{text}</p>{action && <button className="button-secondary" onClick={action}><Plus size={15}/>{actionText}</button>}</div>
}

function LockScreen({ data, pinInput, setPinInput, pinError, handlePin, onSkip }) {
  const firstTime = !data.pin && !data.hasLaunched
  return <main className="lock-screen"><div className="lock-grain"/><div className="lock-brand"><div className="brand-mark">A</div><div><div className="brand-name">AUREUM</div><div className="brand-sub">PRIVATE WEALTH</div></div></div><div className="lock-content"><div className="lock-emblem"><div className="lock-emblem-inner"><Shield size={25}/></div><span/></div><div className="lock-eyebrow">{firstTime ? 'YOUR PRIVATE OFFICE AWAITS' : 'YOUR PRIVATE OFFICE'}</div><h1>{firstTime ? 'Set your executive PIN.' : 'Welcome back.'}</h1><p>{firstTime ? 'A 4-digit PIN keeps your portfolio private on this device.' : 'Enter your PIN to access your private wealth.'}</p><form onSubmit={handlePin}><div className="pin-dots">{[0, 1, 2, 3].map(i => <span key={i} className={pinInput.length > i ? 'pin-filled' : ''}/>)}</div><input className="pin-input" type="password" inputMode="numeric" pattern="[0-9]*" maxLength="4" autoFocus value={pinInput} onChange={e => { setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4)) }} aria-label="4-digit PIN"/>{pinError && <div className="pin-error">{pinError}</div>}<div className="keypad">{['1','2','3','4','5','6','7','8','9','', '0', '⌫'].map((num, index) => <button type={num === '⌫' ? 'button' : 'button'} key={`${num}-${index}`} disabled={!num} onClick={() => num === '⌫' ? setPinInput(v => v.slice(0, -1)) : setPinInput(v => (v + num).slice(0, 4))}>{num === '⌫' ? <ChevronLeft size={18}/> : num}</button>)}</div><button className="button-primary lock-submit" type="submit">{firstTime ? 'Set PIN & enter vault' : 'Unlock private office'}<ChevronRight size={16}/></button></form>{firstTime && <button className="skip-pin" onClick={onSkip}>Skip for now <span>·</span> Set up later</button>}</div><div className="lock-footer"><span><ShieldCheck size={13}/> YOUR DATA STAYS ON THIS DEVICE</span><span>EST. PRIVATE · AUREUM</span></div></main>
}

const fields = {
  goat: [{ name: 'name', label: 'Tag ID / name', required: true, placeholder: 'e.g. G-052 · Juniper' }, { name: 'breed', label: 'Breed', required: true, placeholder: 'Boer, Kalahari Red…' }, { name: 'category', label: 'Category', type: 'select', options: ['Doe', 'Buck', 'Kid'] }, { name: 'weight', label: 'Weight (kg)', type: 'number' }, { name: 'cost', label: 'Purchase cost', type: 'number' }, { name: 'value', label: 'Current market value', type: 'number', required: true }, { name: 'date', label: 'Acquisition date', type: 'date' }, { name: 'notes', label: 'Health notes', placeholder: 'Optional notes' }],
  birth: [{ name: 'name', label: 'Tag ID / name', required: true }, { name: 'breed', label: 'Breed', placeholder: 'Boer…' }, { name: 'motherId', label: 'Dam / mother', type: 'select', options: [] }, { name: 'gender', label: 'Gender', type: 'select', options: ['Female', 'Male'] }, { name: 'weight', label: 'Birth weight (kg)', type: 'number' }, { name: 'value', label: 'Estimated market value', type: 'number' }, { name: 'date', label: 'Birth date', type: 'date' }],
  metal: [{ name: 'name', label: 'Holding name', required: true, placeholder: 'e.g. 1 oz Maple Leaf' }, { name: 'metal', label: 'Metal', type: 'select', options: ['Gold', 'Silver'] }, { name: 'weight', label: 'Weight', type: 'number', required: true }, { name: 'unit', label: 'Weight unit', type: 'select', options: ['oz', 'g'] }, { name: 'purity', label: 'Purity', type: 'select', options: ['999', '916', '750', '585'] }],
  crypto: [{ name: 'name', label: 'Asset name / symbol', required: true, placeholder: 'e.g. XRP, Bitcoin' }, { name: 'coinId', label: 'CoinGecko ID', required: true, placeholder: 'e.g. ripple, bitcoin' }, { name: 'quantity', label: 'Token quantity', type: 'number', required: true }, { name: 'buy', label: 'Average buy price (USD)', type: 'number' }, { name: 'wallet', label: 'Wallet / vault label', placeholder: 'e.g. Ledger Cold Vault' }],
  capital: [{ name: 'name', label: 'Holding name', required: true, placeholder: 'e.g. Singapore operating account' }, { name: 'type', label: 'Asset class', type: 'select', options: ['Cash', 'Equities', 'Property'] }, { name: 'value', label: 'Current valuation', type: 'number', required: true }, { name: 'currency', label: 'Valuation currency', type: 'select', options: ['SGD', 'USD', 'EUR', 'PHP'] }, { name: 'notes', label: 'Details', placeholder: 'Institution, location or notes' }],
}

function Dialog({ dialog, data, onClose, onSave, onGoatAction, setData, setToast }) {
  const [values, setValues] = useState(() => dialog.item ? { ...dialog.item } : { date: today(), saleDate: today(), deathDate: today(), breedingDate: today(), metal: 'Gold', unit: 'oz', purity: '999', currency: 'SGD', type: 'Cash', category: 'Doe', gender: 'Female' })
  const [confirmPin, setConfirmPin] = useState('')
  const [pin, setPin] = useState('')
  const type = dialog.type
  const labels = { goat: dialog.item ? 'Update herd record' : 'Acquire a goat', birth: 'Record a new arrival', metal: dialog.item ? 'Edit vault holding' : 'Add precious metal', crypto: dialog.item ? 'Edit digital position' : 'Add digital asset', capital: dialog.item ? 'Update capital valuation' : 'Add a capital holding' }
  const actionFields = type === 'goat-sold' ? [{ name: 'salePrice', label: 'Sale price', type: 'number', required: true }, { name: 'saleDate', label: 'Sale date', type: 'date', required: true }] : type === 'goat-deceased' ? [{ name: 'deathDate', label: 'Date of death', type: 'date', required: true }, { name: 'cause', label: 'Cause / notes', placeholder: 'Optional notes' }] : type === 'goat-pregnant' ? [{ name: 'breedingDate', label: 'Breeding date', type: 'date', required: true }] : [{ name: 'weight', label: 'Updated weight (kg)', type: 'number' }, { name: 'value', label: 'Updated market value', type: 'number', required: true }, { name: 'notes', label: 'Health notes', placeholder: 'Optional notes' }]
  const goats = type === 'goat' ? fields.goat : type === 'birth' ? fields.birth.map(f => f.name === 'motherId' ? { ...f, options: data.goats.filter(g => g.status === 'Active' && g.category === 'Doe').map(g => g.name) } : f) : type === 'metal' ? fields.metal : type === 'crypto' ? fields.crypto : type === 'capital' ? fields.capital : actionFields
  const handleSubmit = e => {
    e.preventDefault()
    if (type === 'set-pin') {
      if (pin.length !== 4 || pin !== confirmPin) { setToast(pin.length !== 4 ? 'PIN must be 4 digits' : 'PINs do not match'); return }
      setData(d => ({ ...d, pin, hasLaunched: true })); onClose(); setToast('Executive PIN enabled'); return
    }
    if (type.startsWith('goat-')) onGoatAction(values)
    else onSave(type, values, dialog.item)
  }
  return <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}><section className="modal" role="dialog" aria-modal="true"><div className="modal-head"><div><div className="panel-kicker">{type.startsWith('goat-') ? 'HERD MANAGEMENT' : type === 'set-pin' ? 'SECURITY' : 'PORTFOLIO MANAGEMENT'}</div><h2>{labels[type] || dialog.title || 'Set executive PIN'}</h2></div><button className="icon-btn" onClick={onClose} aria-label="Close"><X size={19}/></button></div><form onSubmit={handleSubmit}><div className="form-grid">{type === 'set-pin' ? <><label className="form-field"><span>4-digit PIN</span><input type="password" inputMode="numeric" maxLength="4" required value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))} placeholder="••••"/></label><label className="form-field"><span>Confirm PIN</span><input type="password" inputMode="numeric" maxLength="4" required value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))} placeholder="••••"/></label></> : goats.map(f => <label className={`form-field ${f.name === 'notes' || f.name === 'cause' ? 'field-full' : ''}`} key={f.name}><span>{f.label}{f.required && <i> *</i>}</span>{f.type === 'select' ? <select required={f.required} value={values[f.name] ?? f.options?.[0] ?? ''} onChange={e => setValues(v => ({ ...v, [f.name]: e.target.value }))}>{f.options?.map(o => <option key={o}>{o}</option>)}</select> : <input type={f.type || 'text'} required={f.required} placeholder={f.placeholder || ''} value={values[f.name] ?? ''} onChange={e => setValues(v => ({ ...v, [f.name]: e.target.value }))}/>}</label>)}{type === 'birth' && <div className="form-note field-full"><Sprout size={14}/> Born on farm · no acquisition cost · adds estimated value to net worth.</div>}{type === 'goat-sold' && <div className="form-note field-full"><BadgeDollarSign size={14}/> Sale proceeds and realized profit will be recorded in the ledger.</div>}{type === 'goat-deceased' && <div className="form-note field-full warning-note"><Activity size={14}/> This animal’s current value will be deducted from active net worth.</div>}{type === 'goat-pregnant' && <div className="form-note field-full"><Sprout size={14}/> A 150-day gestation countdown will be added to this doe’s record.</div>}</div><div className="modal-actions"><button type="button" className="button-secondary" onClick={onClose}>Cancel</button><button type="submit" className="button-primary">{type === 'set-pin' ? <KeyRound size={15}/> : <Check size={15}/>} {type === 'set-pin' ? 'Save PIN' : 'Save to portfolio'}</button></div></form></section></div>
}

function SettingsDrawer({ data, setData, onClose, onExport, onImport, onLock, live, setToast }) {
  const [pin, setPin] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPinForm, setShowPinForm] = useState(false)
  const submitPin = e => { e.preventDefault(); if (pin.length !== 4 || pin !== confirm) { setToast(pin.length !== 4 ? 'PIN must be 4 digits' : 'PINs do not match'); return } setData(d => ({ ...d, pin, hasLaunched: true })); setPin(''); setConfirm(''); setShowPinForm(false); setToast('Executive PIN updated') }
  const clearPin = () => { setData(d => ({ ...d, pin: null, hasLaunched: true })); setToast('PIN protection disabled') }
  return <div className="drawer-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}><aside className="settings-drawer"><div className="drawer-head"><div><div className="panel-kicker">AUREUM · PRIVATE OFFICE</div><h2>Executive settings</h2></div><button className="icon-btn" onClick={onClose} aria-label="Close settings"><X size={19}/></button></div><div className="drawer-content">
    <div className="settings-section"><div className="settings-section-title"><ShieldCheck size={16}/> VAULT SECURITY</div><div className="settings-row"><div><b>Executive PIN</b><small>{data.pin ? 'PIN protection is enabled' : 'No PIN set on this device'}</small></div><span className={`settings-status ${data.pin ? 'enabled' : ''}`}>{data.pin ? 'ENABLED' : 'OPTIONAL'}</span></div>{showPinForm ? <form className="pin-settings-form" onSubmit={submitPin}><input type="password" inputMode="numeric" maxLength="4" placeholder="New 4-digit PIN" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))}/><input type="password" inputMode="numeric" maxLength="4" placeholder="Confirm PIN" value={confirm} onChange={e => setConfirm(e.target.value.replace(/\D/g, ''))}/><div><button type="button" className="button-secondary" onClick={() => setShowPinForm(false)}>Cancel</button><button className="button-primary">Save PIN</button></div></form> : <div className="security-buttons"><button className="button-secondary" onClick={() => setShowPinForm(true)}><KeyRound size={15}/>{data.pin ? 'Change PIN' : 'Set a PIN'}</button>{data.pin && <button className="button-secondary" onClick={onLock}><LockKeyhole size={15}/>Lock vault now</button>}{data.pin && <button className="button-quiet" onClick={clearPin}>Disable PIN</button>}</div>}</div>
    <div className="settings-section"><div className="settings-section-title"><FileDown size={16}/> VAULT BACKUP</div><p className="settings-description">Your portfolio and audit history are stored in this browser. Export a backup for safekeeping or restore from a previous export.</p><div className="backup-card"><div className="backup-card-icon"><Download size={18}/></div><div><b>Export vault backup</b><small>Download all portfolio data as JSON</small></div><button className="button-secondary" onClick={onExport}>Export <Download size={14}/></button></div><label className="import-button"><Upload size={15}/> Import backup JSON<input type="file" accept=".json,application/json" onChange={onImport}/></label><div className="backup-hint"><Shield size={13}/> Imports replace your current portfolio. Export first to keep a copy.</div></div>
    <div className="settings-section"><div className="settings-section-title"><Activity size={16}/> MARKET DATA</div><div className="settings-row"><div><b>Price feed status</b><small>Public APIs · refresh every 60 seconds</small></div><span className={`settings-status ${live.status === 'live' ? 'enabled' : ''}`}>{live.status === 'live' ? 'LIVE' : 'MANUAL'}</span></div><button className="button-secondary refresh-button" onClick={live.refresh}><Activity size={15}/> Refresh market data</button><div className="settings-description market-attribution">CoinGecko · open.er-api.com · Indicative prices only.</div></div>
    <div className="settings-foot"><span className="brand-mark small-mark">A</span><span>Aureum Private Wealth</span><small>Portfolio stored locally on this device.</small></div>
  </div></aside></div>
}

export default App

