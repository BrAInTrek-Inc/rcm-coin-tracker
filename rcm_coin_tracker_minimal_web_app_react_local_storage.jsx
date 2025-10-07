# RCM Coin Tracker — Vite + React (modular)

Below is a minimal multi‑file project you can paste into a new repo. It includes:
- **Sold items** support with realized profit.
- **Unrealized P/L** for active holdings.
- LocalStorage persistence (no backend).
- GitHub Pages deploy scripts (via `gh-pages`).

> Replace `YOUR_REPO_NAME` in `vite.config.js` with the repo name you create on GitHub.

---

```text
file: package.json
```
```json
{
  "name": "rcm-coin-tracker",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "gh-pages": "^6.2.0",
    "vite": "^5.4.0"
  }
}
```

```text
file: vite.config.js
```
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// IMPORTANT: set base to "/<YOUR_REPO_NAME>/" for GitHub Pages
export default defineConfig({
  plugins: [react()],
  base: '/YOUR_REPO_NAME/'
})
```

```text
file: index.html
```
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>RCM Coin Tracker</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

```text
file: src/main.jsx
```
```jsx
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

createRoot(document.getElementById('root')).render(<App />)
```

```text
file: src/App.jsx
```
```jsx
import React, { useMemo, useState, useEffect } from 'react'
import { load, save } from './lib/storage.js'
import { calcTotals } from './lib/calc.js'
import { EMPTY_ITEM } from './types.js'
import ItemEditor from './components/ItemEditor.jsx'
import ItemCard from './components/ItemCard.jsx'
import Totals from './components/Totals.jsx'

const TABS = ['Active', 'Sold', 'All', 'Wishlist']

export default function App(){
  const [items, setItems] = useState(() => load('rcm_items', []))
  const [wishlist, setWishlist] = useState(() => load('rcm_wishlist', []))
  const [tab, setTab] = useState('Active')
  const [filter, setFilter] = useState('')
  const [editing, setEditing] = useState(null) // item or null

  // seed a few examples once
  useEffect(() => {
    if(items.length === 0){
      const seed = [
        { ...EMPTY_ITEM, id: crypto.randomUUID(), title: '2017 Canada 150 — 8‑Coin Set (Sealed Box)', year: '2017', series: 'Canada 150', category: 'Sports Heritage & Canadian Pride' },
        { ...EMPTY_ITEM, id: crypto.randomUUID(), title: '2011 $20‑for‑$20 Maple Leaf', year: '2011', series: '20 for 20', pricePaid: '20' }
      ]
      setItems(seed)
    }
  }, [])

  useEffect(()=> save('rcm_items', items), [items])
  useEffect(()=> save('rcm_wishlist', wishlist), [wishlist])

  const filtered = useMemo(() => {
    const src = tab === 'Wishlist' ? wishlist : items
    const q = filter.toLowerCase()
    const byTab = src.filter(it => {
      if(tab==='Active') return it.status!=='sold'
      if(tab==='Sold') return it.status==='sold'
      return true
    })
    if(!q) return byTab
    return byTab.filter(it => [it.title,it.year,it.series,it.category,it.notes].some(x=> (x||'').toLowerCase().includes(q)))
  }, [items, wishlist, filter, tab])

  const totals = useMemo(()=> calcTotals(items), [items])

  const onDelete = id => setItems(items.filter(i=>i.id!==id))
  const onEdit = item => setEditing(item)
  const onSave = (draft) => {
    if(!draft.title.trim()) return
    setItems(prev => {
      const exists = prev.some(p=>p.id===draft.id)
      return exists ? prev.map(p=> p.id===draft.id? draft: p) : [draft, ...prev]
    })
    setEditing(null)
  }

  const onSell = (id, soldPrice, soldDate) => {
    setItems(prev => prev.map(p => p.id===id ? { ...p, status:'sold', soldPrice: String(soldPrice||''), soldDate: soldDate||new Date().toISOString().slice(0,10) } : p))
  }

  const onAddNew = () => setEditing({ ...EMPTY_ITEM, id: crypto.randomUUID() })

  return (
    <div className="container">
      <header className="header">
        <h1>RCM Coin Tracker</h1>
        <div className="actions">
          <button onClick={onAddNew}>Add Item</button>
          <input placeholder="Search…" value={filter} onChange={e=>setFilter(e.target.value)} />
        </div>
      </header>

      <nav className="tabs">
        {TABS.map(t => (
          <button key={t} className={t===tab? 'active':''} onClick={()=>setTab(t)}>{t}</button>
        ))}
      </nav>

      {tab!=='Wishlist' && <Totals totals={totals} />}

      {editing && (
        <ItemEditor draft={editing} onCancel={()=>setEditing(null)} onSave={onSave} />
      )}

      <div className="grid">
        {filtered.map(item => (
          <ItemCard key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} onSell={onSell} />
        ))}
      </div>

      {tab==='Wishlist' && (
        <section className="wishlist">
          <h2>Hunting List</h2>
          <p className="muted">Note targets (e.g., Remembrance Day 2025, Canada 150, Batman, Montreal, 1967 Centennial silver, $20‑for‑$20s near face). Move to inventory when bought.</p>
          <ItemEditor draft={{ ...EMPTY_ITEM, id: crypto.randomUUID() }} onCancel={()=>{}} onSave={(d)=> setWishlist([d, ...wishlist])} />
          <ul className="list">
            {wishlist.map(w => (
              <li key={w.id}>{w.title} {w.year?`(${w.year})`:''}</li>
            ))}
          </ul>
        </section>
      )}

      <footer className="footer">Local‑only. Data stored in your browser. Export/backup coming next.</footer>
    </div>
  )
}
```

```text
file: src/components/ItemCard.jsx
```
```jsx
import React, { useMemo, useState } from 'react'

export default function ItemCard({ item, onEdit, onDelete, onSell }){
  const pnl = useMemo(()=>{
    const paid = parseFloat(item.pricePaid||0)
    const val = parseFloat(item.estValue||0)
    if(Number.isNaN(paid) || Number.isNaN(val)) return null
    return (val - paid).toFixed(2)
  }, [item.pricePaid, item.estValue])

  const realized = useMemo(()=>{
    const paid = parseFloat(item.pricePaid||0)
    const sold = parseFloat(item.soldPrice||0)
    if(item.status==='sold' && !Number.isNaN(paid) && !Number.isNaN(sold)) return (sold - paid).toFixed(2)
    return null
  }, [item.status, item.pricePaid, item.soldPrice])

  const [sellMode, setSellMode] = useState(false)
  const [sellPrice, setSellPrice] = useState('')
  const [sellDate, setSellDate] = useState('')

  return (
    <div className="card">
      <div className="card-top">
        <div>
          <h3>{item.title || 'Untitled Coin'}</h3>
          <div className="meta">
            {item.year && <span>{item.year}</span>}
            {item.series && <span>{item.series}</span>}
            {item.condition && <span>{item.condition}</span>}
            {item.category && <span>{item.category}</span>}
          </div>
        </div>
        <div className="buttons">
          <button onClick={() => onEdit(item)}>Edit</button>
          <button className="ghost" onClick={() => onDelete(item.id)}>Delete</button>
        </div>
      </div>

      <div className="row four">
        <div className="pill"><label>Paid</label><b>{item.pricePaid || '—'}</b></div>
        <div className="pill"><label>Est. Value</label><b>{item.estValue || '—'}</b></div>
        <div className="pill">
          <label>{item.status==='sold' ? 'Realized P/L' : 'Unrealized P/L'}</label>
          <b className={((realized??pnl) && parseFloat(realized??pnl) >= 0) ? 'pos' : 'neg'}>{(realized??pnl) ?? '—'}</b>
        </div>
        <div className="pill"><label>Status</label><b>{item.status==='sold' ? `Sold ${item.soldDate||''}` : 'Active'}</b></div>
      </div>

      <div className="row">
        <div className="notes">{item.notes || 'No notes yet.'}</div>
        {item.link && <a className="link" href={item.link} target="_blank" rel="noreferrer">Mint page</a>}
      </div>

      {item.status!=='sold' && (
        <div className="sell">
          {!sellMode && <button onClick={()=>setSellMode(true)}>Mark as Sold</button>}
          {sellMode && (
            <div className="sell-form">
              <input type="number" step="0.01" placeholder="Sold price (CAD)" value={sellPrice} onChange={e=>setSellPrice(e.target.value)} />
              <input type="date" value={sellDate} onChange={e=>setSellDate(e.target.value)} />
              <button onClick={()=>{ onSell(item.id, sellPrice, sellDate); setSellMode(false); }}>Save</button>
              <button className="ghost" onClick={()=>setSellMode(false)}>Cancel</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

```text
file: src/components/ItemEditor.jsx
```
```jsx
import React, { useState } from 'react'
import { EMPTY_ITEM } from '../types.js'

export default function ItemEditor({ draft, onSave, onCancel }){
  const [d, setD] = useState(draft || { ...EMPTY_ITEM, id: crypto.randomUUID() })
  const set = (k) => (e) => setD({ ...d, [k]: e.target.value })
  return (
    <div className="editor">
      <input placeholder="Official name" value={d.title} onChange={set('title')} />
      <div className="two">
        <input placeholder="Year" value={d.year} onChange={set('year')} />
        <input placeholder="Series / Theme" value={d.series} onChange={set('series')} />
      </div>
      <div className="two">
        <input placeholder="Category" value={d.category} onChange={set('category')} />
        <input placeholder="Condition (Sealed, BU, etc.)" value={d.condition} onChange={set('condition')} />
      </div>
      <div className="two">
        <input placeholder="Price paid (CAD)" value={d.pricePaid} onChange={set('pricePaid')} />
        <input placeholder="Est. value (CAD)" value={d.estValue} onChange={set('estValue')} />
      </div>
      <input placeholder="Mint/product link" value={d.link} onChange={set('link')} />
      <textarea placeholder="Notes" value={d.notes} onChange={set('notes')} />
      <div className="row">
        <button onClick={()=>onSave(d)}>Save</button>
        <button className="ghost" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}
```

```text
file: src/components/Totals.jsx
```
```jsx
import React from 'react'

export default function Totals({ totals }){
  return (
    <div className="totals">
      <div className="pill"><label>Invested</label><b>${totals.invested.toFixed(2)}</b></div>
      <div className="pill"><label>Est. Value (Active)</label><b>${totals.estValueActive.toFixed(2)}</b></div>
      <div className="pill"><label>Unrealized P/L</label><b className={totals.unrealized>=0?'pos':'neg'}>${totals.unrealized.toFixed(2)}</b></div>
      <div className="pill"><label>Realized P/L</label><b className={totals.realized>=0?'pos':'neg'}>${totals.realized.toFixed(2)}</b></div>
    </div>
  )
}
```

```text
file: src/lib/storage.js
```
```js
export const load = (k, fallback) => {
  try { return JSON.parse(localStorage.getItem(k) || JSON.stringify(fallback)) } catch { return fallback }
}
export const save = (k, v) => localStorage.setItem(k, JSON.stringify(v))
```

```text
file: src/lib/calc.js
```
```js
export function calcTotals(items){
  const invested = items.reduce((s,i)=> s + (parseFloat(i.pricePaid)||0), 0)
  const estValueActive = items.filter(i=>i.status!=='sold').reduce((s,i)=> s + (parseFloat(i.estValue)||0), 0)
  const unrealized = items.filter(i=>i.status!=='sold').reduce((s,i)=> s + ((parseFloat(i.estValue)||0) - (parseFloat(i.pricePaid)||0)), 0)
  const realized = items.filter(i=>i.status==='sold').reduce((s,i)=> s + ((parseFloat(i.soldPrice)||0) - (parseFloat(i.pricePaid)||0)), 0)
  return { invested, estValueActive, unrealized, realized }
}
```

```text
file: src/types.js
```
```js
export const EMPTY_ITEM = {
  id: '',
  title: '',
  year: '',
  series: '',
  pricePaid: '',
  estValue: '',
  condition: 'Sealed',
  notes: '',
  link: '',
  category: 'Sports Heritage & Canadian Pride',
  status: 'active', // 'active' | 'sold'
  soldPrice: '',
  soldDate: ''
}
```

```text
file: src/styles.css
```
```css
:root{ --bg:#0b0b0f; --fg:#e7e7ea; --muted:#9aa0a6; --card:#14141a; --line:#23232d; --pos:#1ea672; --neg:#d33f49; }
*{ box-sizing:border-box; }
body{ margin:0; font: 14px/1.45 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; background:var(--bg); color:var(--fg); }
.container{ max-width:1100px; margin:0 auto; padding:24px; }
.header{ display:flex; gap:12px; align-items:center; justify-content:space-between; flex-wrap:wrap; }
.header h1{ margin:0; font-size:28px; }
.header .actions{ display:flex; gap:8px; }
button{ background:#2b2b34; color:var(--fg); border:1px solid var(--line); padding:8px 12px; border-radius:12px; cursor:pointer; }
button.ghost{ background:transparent; }
input, textarea{ width:100%; background:#101019; color:var(--fg); border:1px solid var(--line); padding:10px 12px; border-radius:12px; }
textarea{ min-height:84px; }
.tabs{ display:flex; gap:8px; margin:16px 0; flex-wrap:wrap; }
.tabs button{ background:#16161e; }
.tabs .active{ outline:2px solid #444; }
.grid{ display:grid; gap:12px; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); }
.card{ background:var(--card); border:1px solid var(--line); border-radius:16px; padding:14px; display:grid; gap:10px; }
.card-top{ display:flex; justify-content:space-between; gap:8px; }
.card h3{ margin:0 0 4px; font-size:16px; }
.meta{ display:flex; gap:6px; flex-wrap:wrap; color:var(--muted); }
.buttons{ display:flex; gap:6px; }
.row{ display:flex; gap:10px; justify-content:space-between; align-items:center; }
.row.four{ display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
.pill{ background:#101019; padding:10px 12px; border:1px solid var(--line); border-radius:12px; }
.pill label{ display:block; color:var(--muted); font-size:12px; margin-bottom:4px; }
.pill b{ font-size:14px; }
.pos{ color:var(--pos); } .neg{ color:var(--neg); }
.notes{ color:var(--muted); }
.link{ color:#7fb0ff; text-decoration:underline; }
.editor{ background:var(--card); border:1px dashed var(--line); border-radius:16px; padding:14px; display:grid; gap:10px; margin:8px 0 16px; }
.editor .two{ display:grid; grid-template-columns:1fr 1fr; gap:8px; }
.sell{ display:flex; justify-content:flex-end; }
.sell-form{ display:flex; gap:8px; }
.totals{ display:grid; grid-template-columns: repeat(4, minmax(140px,1fr)); gap:8px; margin-bottom:8px; }
.footer{ margin-top:16px; color:var(--muted); text-align:center; font-size:12px; }
.list{ margin:8px 0; padding-left:18px; }
.wishlist .muted{ color:var(--muted); }
```

```text
file: README.md
```
```md
# RCM Coin Tracker (Vite + React)

Local‑first tracker for RCM coin buys with **Sold** support (realized P/L) and **Active** holdings (unrealized P/L). No server.

## Quick start

```bash
npm create vite@latest rcm-coin-tracker -- --template react
cd rcm-coin-tracker
# replace the generated files with the files in this repo
npm i
```

### Configure GitHub Pages
1. Edit `vite.config.js` and set:
   ```js
   base: '/YOUR_REPO_NAME/'
   ```
2. Commit and push to GitHub.
3. Deploy:
   ```bash
   npm run deploy
   ```
   This publishes the `dist/` build to the special **gh-pages** branch.
4. In GitHub → **Settings → Pages**: set **Source** to **Deploy from a branch** and pick `gh-pages`.

> **Repo visibility**
> - On **GitHub Free (personal)**, Pages requires a **public** repo. If you want the code private and the site public, consider **GitHub Pro** **or** use a two‑repo setup (private source + public Pages repo with only the built files).
> - **Private Pages (access‑controlled)** are for **Enterprise Cloud organizations** only.

## Use
- **Add Item** → track `pricePaid`, `estValue`.
- **Mark as Sold** → enter `soldPrice` and optional date → realized P/L appears, item moves to **Sold** tab.
- **Totals** show Invested, Est. Value (active), Unrealized P/L, Realized P/L.
- All data persists in your browser (localStorage).

## Dev
```bash
npm run dev
```

## Build
```bash
npm run build && npm run preview
```
```
