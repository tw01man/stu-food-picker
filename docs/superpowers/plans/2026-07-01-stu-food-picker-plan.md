# STU Food Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deployable web app that randomly picks a campus restaurant for STU East Coast campus students.

**Architecture:** Two HTML pages (picker + admin) sharing a common CSS and Supabase client. Data stored in Supabase PostgreSQL with RLS protecting write operations.

**Tech Stack:** HTML5, CSS3, Vanilla JS, Supabase JS SDK v2 (CDN import), Supabase PostgreSQL, Vercel

## Global Constraints

- No build tools or frameworks — pure HTML/CSS/JS only
- Mobile-first responsive design
- Supabase anon key safe to embed in client (RLS protects data)
- All text in Chinese (Simplified)
- CDN import: `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2`

---

## File Structure

```
stu-food-picker/
├── index.html              # Picker page (/, public)
├── admin.html              # Admin page (/admin, requires auth)
├── style.css               # Shared global styles
├── script.js               # Picker page logic
├── admin.js                # Admin page logic (auth + CRUD)
├── supabase-client.js      # Supabase init + shared API functions
├── supabase-schema.sql     # Database DDL + seed data
├── docs/
│   └── superpowers/
│       ├── specs/
│       │   └── 2026-07-01-stu-food-picker-design.md
│       └── plans/
│           └── 2026-07-01-stu-food-picker-plan.md
└── .gitignore
```

---

### Task 1: Database Schema SQL

**Files:**
- Create: `supabase-schema.sql`

**Interfaces:**
- Consumes: (none — first task)
- Produces: SQL script that creates two tables (shops, categories) with RLS, seed data for all 26 shops and 4 categories

- [ ] **Step 1: Write the SQL schema**

Write `supabase-schema.sql`:

```sql
-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Shops table
CREATE TABLE IF NOT EXISTS shops (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  canteen TEXT NOT NULL CHECK (canteen IN ('一饭', '二饭', '三饭', 'D饭')),
  categories TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- RLS: anyone can read
CREATE POLICY "Public read access for shops"
  ON shops FOR SELECT USING (true);

CREATE POLICY "Public read access for categories"
  ON categories FOR SELECT USING (true);

-- RLS: only authenticated users can write
CREATE POLICY "Authenticated users can insert shops"
  ON shops FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update shops"
  ON shops FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete shops"
  ON shops FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert categories"
  ON categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update categories"
  ON categories FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete categories"
  ON categories FOR DELETE USING (auth.role() = 'authenticated');

-- Seed categories
INSERT INTO categories (name) VALUES
  ('饭类'),
  ('粉面/粿条'),
  ('麻辣烫'),
  ('汉堡/炸鸡')
ON CONFLICT (name) DO NOTHING;

-- Seed shops (26)
INSERT INTO shops (name, canteen, categories) VALUES
  -- 一饭
  ('一饭粿条', '一饭', ARRAY['粉面/粿条']),
  ('一饭渔粉', '一饭', ARRAY['粉面/粿条']),
  ('一饭南昌拌粉', '一饭', ARRAY['粉面/粿条']),
  ('一饭肠粉', '一饭', ARRAY['粉面/粿条']),
  ('一饭食堂餐', '一饭', ARRAY['饭类']),
  ('一饭烤肉饭', '一饭', ARRAY['饭类']),
  ('一饭烧腊', '一饭', ARRAY['饭类']),
  -- 二饭
  ('二饭陕西小吃', '二饭', ARRAY['粉面/粿条']),
  ('二饭QQ饭', '二饭', ARRAY['饭类']),
  ('二饭烧腊', '二饭', ARRAY['饭类']),
  ('二饭麻辣烫', '二饭', ARRAY['麻辣烫']),
  ('二饭云吞', '二饭', ARRAY['粉面/粿条']),
  ('二饭塔斯汀', '二饭', ARRAY['汉堡/炸鸡']),
  -- 三饭
  ('三饭肯德基', '三饭', ARRAY['汉堡/炸鸡']),
  ('三饭麻辣烫', '三饭', ARRAY['麻辣烫']),
  ('三饭陶罐饭', '三饭', ARRAY['饭类']),
  ('三饭粿条', '三饭', ARRAY['粉面/粿条']),
  ('三饭海南鸡饭', '三饭', ARRAY['饭类']),
  ('三饭食堂餐', '三饭', ARRAY['饭类']),
  -- D饭
  ('D饭牛饭', 'D饭', ARRAY['饭类']),
  ('D饭鸭血粉丝汤', 'D饭', ARRAY['粉面/粿条']),
  ('D饭酸菜鱼', 'D饭', ARRAY['饭类']),
  ('D饭牛肉粿条', 'D饭', ARRAY['粉面/粿条']),
  ('D饭砂锅粉', 'D饭', ARRAY['粉面/粿条']),
  ('D饭沙县小吃', 'D饭', ARRAY['饭类', '粉面/粿条']),
  ('D饭麻辣烫', 'D饭', ARRAY['麻辣烫'])
ON CONFLICT (name) DO NOTHING;
```

- [ ] **Step 2: Verify SQL syntax**

Verify the SQL runs without errors by checking for:
- Correct array syntax (ARRAY[...])
- No orphaned commas
- All 26 shops present
- All 4 categories present
- `ON CONFLICT` handles duplicates gracefully

- [ ] **Step 3: Commit**

```bash
git add supabase-schema.sql
git commit -m "feat: add database schema with RLS and seed data"
```

---

### Task 2: Shared Supabase Client

**Files:**
- Create: `supabase-client.js`

**Interfaces:**
- Consumes: Supabase project URL and anon key (placeholder values)
- Produces:
  - `supabase` — initialized Supabase client instance
  - `getShops(categoryFilter)` → `Promise<Array<{id, name, canteen, categories}>>`
  - `getCategories()` → `Promise<Array<{id, name}>>`
  - `addShop({name, canteen, categories})` → `Promise<{id, name, canteen, categories}>`
  - `updateShop(id, {name, canteen, categories})` → `Promise<{id, name, canteen, categories}>`
  - `deleteShop(id)` → `Promise<void>`
  - `login(email, password)` → `Promise<AuthResponse>`
  - `logout()` → `Promise<void>`
  - `onAuthChange(callback)` → `void`
  - `getUser()` → `User | null`

- [ ] **Step 1: Write supabase-client.js**

```javascript
// Supabase configuration — replace these with your project values
const SUPABASE_URL = 'https://your-project.supabase.co'
const SUPABASE_ANON_KEY = 'your-anon-key'

const { createClient } = supabase
const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// --- Shops API ---

async function getShops(categoryFilter) {
  let query = client.from('shops').select('*').order('name')
  if (categoryFilter && categoryFilter !== '全部') {
    query = query.contains('categories', [categoryFilter])
  }
  const { data, error } = await query
  if (error) throw error
  return data
}

async function addShop({ name, canteen, categories }) {
  const { data, error } = await client
    .from('shops')
    .insert({ name, canteen, categories })
    .select()
    .single()
  if (error) throw error
  return data
}

async function updateShop(id, { name, canteen, categories }) {
  const { data, error } = await client
    .from('shops')
    .update({ name, canteen, categories })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

async function deleteShop(id) {
  const { error } = await client
    .from('shops')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// --- Categories API ---

async function getCategories() {
  const { data, error } = await client
    .from('categories')
    .select('*')
    .order('id')
  if (error) throw error
  return data
}

// --- Auth API ---

async function login(email, password) {
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

async function logout() {
  const { error } = await client.auth.signOut()
  if (error) throw error
}

function onAuthChange(callback) {
  client.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })
}

function getUser() {
  return client.auth.getUser()
}
```

- [ ] **Step 2: Verify syntax**

Check for: matching braces, correct function signatures, all `async` functions return promises, all `error` paths throw.

- [ ] **Step 3: Commit**

```bash
git add supabase-client.js
git commit -m "feat: add shared Supabase client with shops, categories, and auth API"
```

---

### Task 3: Shared CSS Styles

**Files:**
- Create: `style.css`

**Interfaces:**
- Consumes: (none — pure styles)
- Produces: Shared stylesheet imported by both index.html and admin.html

- [ ] **Step 1: Write style.css**

```css
/* === Reset & Base === */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { font-size: 16px; -webkit-text-size-adjust: 100%; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
               "Microsoft YaHei", sans-serif;
  background: #f5f0eb; /* warm beige */
  color: #2d2a24;
  line-height: 1.6;
  min-height: 100vh;
}
a { color: inherit; text-decoration: none; }
button { cursor: pointer; font: inherit; border: none; background: none; }
input, select { font: inherit; }

/* === Layout Container === */
.container {
  max-width: 480px;
  margin: 0 auto;
  padding: 20px 16px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* === Header === */
.header {
  text-align: center;
  padding: 24px 0 16px;
}
.header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #e8562a; /* appetizing orange-red */
}
.header p {
  font-size: 0.875rem;
  color: #8a8580;
  margin-top: 4px;
}

/* === Category Filter === */
.filter-bar {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 12px 0 16px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.filter-bar::-webkit-scrollbar { display: none; }

.filter-btn {
  flex-shrink: 0;
  padding: 8px 18px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  background: #fff;
  color: #5a554f;
  border: 1.5px solid #e0dbd4;
  transition: all 0.2s;
  white-space: nowrap;
}
.filter-btn:hover { background: #f0ebe4; }
.filter-btn.active {
  background: #e8562a;
  color: #fff;
  border-color: #e8562a;
}

/* === Result Card === */
.result-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 20px 0;
}

.result-card {
  width: 100%;
  max-width: 360px;
  background: #fff;
  border-radius: 16px;
  padding: 40px 24px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
  min-height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: opacity 0.15s;
}

.result-card .shop-name {
  font-size: 1.75rem;
  font-weight: 700;
  color: #2d2a24;
  margin-bottom: 8px;
}
.result-card .shop-canteen {
  font-size: 1rem;
  color: #8a8580;
}
.result-card .placeholder {
  font-size: 1.1rem;
  color: #b5b0a8;
}
.result-card .empty-state {
  font-size: 1rem;
  color: #b5b0a8;
}
.result-card .empty-state .emoji {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 12px;
}
.result-card .loading-shimmer {
  width: 80%;
  height: 24px;
  background: linear-gradient(90deg, #eee 25%, #f5f5f5 50%, #eee 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 8px;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* rolling animation */
.rolling .shop-name {
  animation: textPulse 0.1s ease-in-out;
}
@keyframes textPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

/* === Pick Button === */
.pick-btn {
  background: #e8562a;
  color: #fff;
  border: none;
  border-radius: 50px;
  padding: 16px 48px;
  font-size: 1.125rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  transition: all 0.2s;
  box-shadow: 0 4px 14px rgba(232,86,42,0.3);
}
.pick-btn:hover { background: #d44a20; transform: translateY(-1px); }
.pick-btn:active { transform: translateY(0); }
.pick-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* === Admin: Login Form === */
.login-form {
  max-width: 340px;
  margin: 60px auto;
  background: #fff;
  border-radius: 16px;
  padding: 32px 24px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
}
.login-form h2 {
  text-align: center;
  margin-bottom: 24px;
  color: #2d2a24;
}
.form-group {
  margin-bottom: 16px;
}
.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 6px;
  color: #5a554f;
}
.form-group input, .form-group select {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid #e0dbd4;
  border-radius: 10px;
  font-size: 1rem;
  background: #fff;
  transition: border-color 0.2s;
}
.form-group input:focus, .form-group select:focus {
  outline: none;
  border-color: #e8562a;
}
.submit-btn {
  width: 100%;
  padding: 12px;
  background: #e8562a;
  color: #fff;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  margin-top: 8px;
}
.submit-btn:hover { background: #d44a20; }
.error-msg {
  color: #d32f2f;
  font-size: 0.875rem;
  text-align: center;
  margin-top: 8px;
}

/* === Admin: Shop Management === */
.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
}
.admin-header h1 { font-size: 1.25rem; color: #2d2a24; }
.logout-btn {
  font-size: 0.875rem;
  color: #8a8580;
  padding: 6px 14px;
  border-radius: 8px;
  border: 1px solid #e0dbd4;
}
.logout-btn:hover { background: #f0ebe4; }

.admin-toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}
.admin-toolbar .search-input {
  flex: 1;
  padding: 10px 14px;
  border: 1.5px solid #e0dbd4;
  border-radius: 10px;
  font-size: 0.9rem;
}
.admin-toolbar .search-input:focus {
  outline: none;
  border-color: #e8562a;
}
.add-btn {
  padding: 10px 20px;
  background: #e8562a;
  color: #fff;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  white-space: nowrap;
}

/* === Shop Table === */
.shop-table {
  width: 100%;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,0.04);
}
.shop-table table {
  width: 100%;
  border-collapse: collapse;
}
.shop-table th {
  background: #faf7f3;
  padding: 12px 14px;
  text-align: left;
  font-size: 0.8rem;
  font-weight: 600;
  color: #8a8580;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.shop-table td {
  padding: 12px 14px;
  font-size: 0.9rem;
  border-top: 1px solid #f0ebe4;
}
.shop-table .actions {
  display: flex;
  gap: 8px;
}
.shop-table .edit-btn, .shop-table .delete-btn {
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
}
.shop-table .edit-btn { color: #e8562a; background: #fef0ea; }
.shop-table .edit-btn:hover { background: #fde0d5; }
.shop-table .delete-btn { color: #d32f2f; background: #ffebee; }
.shop-table .delete-btn:hover { background: #ffcdd2; }

.tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  background: #f0ebe4;
  color: #5a554f;
  margin: 1px 2px;
}

/* === Modal === */
.modal-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}
.modal-overlay.open { display: flex; }
.modal {
  background: #fff;
  border-radius: 16px;
  padding: 28px 24px;
  width: 100%;
  max-width: 380px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.12);
}
.modal h3 { margin-bottom: 20px; color: #2d2a24; }
.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}
.modal-actions .cancel-btn {
  flex: 1;
  padding: 10px;
  border-radius: 10px;
  background: #f0ebe4;
  color: #5a554f;
  font-weight: 500;
}
.modal-actions .confirm-btn {
  flex: 1;
  padding: 10px;
  border-radius: 10px;
  background: #e8562a;
  color: #fff;
  font-weight: 600;
}
.modal-actions .confirm-btn.danger { background: #d32f2f; }
.modal-actions .cancel-btn:hover { background: #e5ded6; }
.modal-actions .confirm-btn:hover { background: #d44a20; }
.modal-actions .confirm-btn.danger:hover { background: #b71c1c; }

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
}
.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  padding: 6px 12px;
  border-radius: 8px;
  background: #f5f0eb;
  cursor: pointer;
}
.checkbox-group input[type="checkbox"] {
  width: auto;
  accent-color: #e8562a;
}

/* === Utility === */
.hidden { display: none !important; }
.loading { opacity: 0.6; pointer-events: none; }

/* === Footer === */
.footer {
  text-align: center;
  padding: 20px 0;
  font-size: 0.75rem;
  color: #b5b0a8;
}
```

- [ ] **Step 2: Verify CSS**

Check for: no undefined keyframes referenced, all class names match intended usage in HTML, consistent spacing/color tokens, responsive layout.

- [ ] **Step 3: Commit**

```bash
git add style.css
git commit -m "feat: add shared mobile-first CSS styles"
```

---

### Task 4: Picker Page (index.html + script.js)

**Files:**
- Create: `index.html`
- Create: `script.js`

**Interfaces:**
- Consumes: `style.css`, `supabase-client.js`, `getShops()`, `getCategories()`
- Produces: Functional picker page at `/` with category filter, pick animation, and result display

- [ ] **Step 1: Write index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>今天吃啥？ — 汕大东海岸</title>
  <link rel="stylesheet" href="style.css">
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="supabase-client.js"></script>
</head>
<body>
  <div class="container">
    <header class="header">
      <h1>今天吃啥？</h1>
      <p>汕大东海岸校区 · 吃饭抽签器</p>
    </header>

    <div class="filter-bar" id="filterBar"></div>

    <section class="result-section">
      <div class="result-card" id="resultCard">
        <div class="placeholder">点击下方按钮抽一签</div>
      </div>

      <button class="pick-btn" id="pickBtn" onclick="handlePick()">抽一签！</button>
    </section>

    <footer class="footer">
      <span id="shopCount">加载中...</span>
    </footer>
  </div>

  <script src="script.js"></script>
</body>
</html>
```

- [ ] **Step 2: Write script.js**

```javascript
// === State ===
let allShops = []
let currentCategory = '全部'
let isPicking = false

// === DOM refs ===
const filterBar = document.getElementById('filterBar')
const resultCard = document.getElementById('resultCard')
const pickBtn = document.getElementById('pickBtn')
const shopCount = document.getElementById('shopCount')

// === Init ===
async function init() {
  try {
    await loadCategories()
    await loadShops()
  } catch (err) {
    resultCard.innerHTML = `<div class="empty-state">加载失败，请刷新重试</div>`
  }
}

// === Load categories ===
async function loadCategories() {
  const categories = await getCategories()
  filterBar.innerHTML = `<button class="filter-btn active" data-cat="全部">全部</button>`
  categories.forEach(cat => {
    const btn = document.createElement('button')
    btn.className = 'filter-btn'
    btn.dataset.cat = cat.name
    btn.textContent = cat.name
    btn.onclick = () => filterByCategory(cat.name)
    filterBar.appendChild(btn)
  })
  // "全部" handler
  filterBar.querySelector('[data-cat="全部"]').onclick = () => filterByCategory('全部')
}

// === Load shops ===
async function loadShops() {
  allShops = await getShops(currentCategory === '全部' ? null : currentCategory)
  updateShopCount()
}

// === Filter ===
async function filterByCategory(category) {
  currentCategory = category
  filterBar.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cat === category)
  })
  await loadShops()
  // Reset result card
  resultCard.innerHTML = `<div class="placeholder">已筛选「${category === '全部' ? '全部店铺' : category}」</div>`
}

function getFilteredShops() {
  if (currentCategory === '全部') return allShops
  return allShops.filter(shop =>
    shop.categories && shop.categories.includes(currentCategory)
  )
}

// === Pick ===
async function handlePick() {
  if (isPicking) return
  const pool = getFilteredShops()
  if (pool.length === 0) {
    resultCard.innerHTML = `<div class="empty-state">
      <span class="emoji">😅</span>
      这个分类暂时没有店铺
    </div>`
    return
  }

  isPicking = true
  pickBtn.disabled = true
  pickBtn.textContent = '抽签中...'

  const winner = pool[Math.floor(Math.random() * pool.length)]
  rollAnimation(pool, winner)

  // Refresh shop count
  updateShopCount()
}

function rollAnimation(pool, winner) {
  const totalSteps = 15 + Math.floor(Math.random() * 8)
  let step = 0
  const minDelay = 40
  const maxDelay = 250

  function tick() {
    const randomShop = pool[Math.floor(Math.random() * pool.length)]
    resultCard.innerHTML = `
      <div class="shop-name rolling">${randomShop.name}</div>
      <div class="shop-canteen rolling">${randomShop.canteen}</div>
    `
    step++
    if (step >= totalSteps) {
      resultCard.innerHTML = `
        <div class="shop-name">${winner.name}</div>
        <div class="shop-canteen">${winner.canteen}</div>
      `
      isPicking = false
      pickBtn.disabled = false
      pickBtn.textContent = '再抽一签！'
      return
    }
    const delay = minDelay + (maxDelay - minDelay) * (step / totalSteps)
    setTimeout(tick, delay)
  }
  tick()
}

function updateShopCount() {
  const filtered = getFilteredShops()
  shopCount.textContent = `${filtered.length} 家店铺参与抽签`
}

// === Start ===
init().catch(() => {
  resultCard.innerHTML = `<div class="empty-state">加载失败，请刷新重试</div>`
})
```

- [ ] **Step 3: Verify picker page**

Check: init flow (load categories → load shops), filter toggles correctly show/hide shops, empty category shows message, animation completes and displays winner, loading/error states render properly.

- [ ] **Step 4: Commit**

```bash
git add index.html script.js
git commit -m "feat: add food picker page with category filter and roll animation"
```

---

### Task 5: Admin Page (admin.html + admin.js)

**Files:**
- Create: `admin.html`
- Create: `admin.js`

**Interfaces:**
- Consumes: `style.css`, `supabase-client.js`, all API functions
- Produces: Admin page at `/admin` with auth, CRUD shop management

- [ ] **Step 1: Write admin.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>店铺管理 — 汕大东海岸</title>
  <link rel="stylesheet" href="style.css">
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="supabase-client.js"></script>
</head>
<body>
  <div class="container">
    <!-- Login Section -->
    <div id="loginSection" class="login-form">
      <h2>管理员登录</h2>
      <div class="form-group">
        <label for="email">邮箱</label>
        <input type="email" id="email" placeholder="请输入邮箱">
      </div>
      <div class="form-group">
        <label for="password">密码</label>
        <input type="password" id="password" placeholder="请输入密码">
      </div>
      <button class="submit-btn" onclick="handleLogin()">登录</button>
      <div id="loginError" class="error-msg"></div>
    </div>

    <!-- Admin Section -->
    <div id="adminSection" class="hidden">
      <div class="admin-header">
        <h1>店铺管理</h1>
        <button class="logout-btn" onclick="handleLogout()">退出登录</button>
      </div>

      <div class="admin-toolbar">
        <input type="text" class="search-input" id="searchInput"
               placeholder="搜索店铺..." oninput="handleSearch(this.value)">
        <button class="add-btn" onclick="openAddModal()">+ 新增</button>
      </div>

      <div class="shop-table" id="shopTable">
        <table>
          <thead>
            <tr>
              <th>名称</th>
              <th>食堂</th>
              <th>分类</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody id="shopTableBody"></tbody>
        </table>
      </div>
    </div>

    <footer class="footer">
      <span>汕大东海岸校区 · 吃饭抽签器</span>
    </footer>
  </div>

  <!-- Shop Form Modal -->
  <div class="modal-overlay" id="shopModal">
    <div class="modal">
      <h3 id="modalTitle">新增店铺</h3>
      <div class="form-group">
        <label for="shopName">店铺名称</label>
        <input type="text" id="shopName" placeholder="如一饭粿条">
      </div>
      <div class="form-group">
        <label for="shopCanteen">所属食堂</label>
        <select id="shopCanteen">
          <option value="一饭">一饭</option>
          <option value="二饭">二饭</option>
          <option value="三饭">三饭</option>
          <option value="D饭">D饭</option>
        </select>
      </div>
      <div class="form-group">
        <label>分类（可多选）</label>
        <div class="checkbox-group" id="categoryCheckboxes"></div>
      </div>
      <div class="modal-actions">
        <button class="cancel-btn" onclick="closeModal()">取消</button>
        <button class="confirm-btn" id="modalConfirmBtn" onclick="handleSaveShop()">保存</button>
      </div>
    </div>
  </div>

  <!-- Delete Confirmation Modal -->
  <div class="modal-overlay" id="deleteModal">
    <div class="modal">
      <h3>确认删除</h3>
      <p style="color: #5a554f; margin-bottom: 8px;" id="deleteConfirmText">确定要删除这个店铺吗？</p>
      <div class="modal-actions">
        <button class="cancel-btn" onclick="closeDeleteModal()">取消</button>
        <button class="confirm-btn danger" onclick="handleDeleteShop()">删除</button>
      </div>
    </div>
  </div>

  <script src="admin.js"></script>
</body>
</html>
```

- [ ] **Step 2: Write admin.js**

```javascript
// === State ===
let shops = []
let categories = []
let editingShopId = null
let deletingShopId = null
let searchTerm = ''

// === DOM refs ===
const loginSection = document.getElementById('loginSection')
const adminSection = document.getElementById('adminSection')
const shopTableBody = document.getElementById('shopTableBody')
const searchInput = document.getElementById('searchInput')
const shopModal = document.getElementById('shopModal')
const deleteModal = document.getElementById('deleteModal')
const modalTitle = document.getElementById('modalTitle')
const shopName = document.getElementById('shopName')
const shopCanteen = document.getElementById('shopCanteen')
const categoryCheckboxes = document.getElementById('categoryCheckboxes')
const modalConfirmBtn = document.getElementById('modalConfirmBtn')
const loginError = document.getElementById('loginError')
const email = document.getElementById('email')
const password = document.getElementById('password')

// === Init ===
async function init() {
  // Check auth state
  const { data: { user } } = await getUser()
  if (user) {
    showAdmin()
  }

  onAuthChange((event, session) => {
    if (session) {
      showAdmin()
    } else {
      showLogin()
    }
  })
}

// === Auth ===
async function handleLogin() {
  loginError.textContent = ''
  if (!email.value || !password.value) {
    loginError.textContent = '请输入邮箱和密码'
    return
  }
  try {
    await login(email.value, password.value)
  } catch (err) {
    loginError.textContent = '登录失败，请检查邮箱和密码'
  }
}

async function handleLogout() {
  await logout()
  showLogin()
}

function showLogin() {
  loginSection.classList.remove('hidden')
  adminSection.classList.add('hidden')
}

function showAdmin() {
  loginSection.classList.add('hidden')
  adminSection.classList.remove('hidden')
  loadData()
}

// === Load data ===
async function loadData() {
  try {
    categories = await getCategories()
    shops = await getShops()
    renderCategories()
    renderTable()
  } catch (err) {
    // handle silently
  }
}

// === Render ===
function renderCategories() {
  categoryCheckboxes.innerHTML = categories.map(cat => `
    <label>
      <input type="checkbox" value="${cat.name}">
      ${cat.name}
    </label>
  `).join('')
}

function renderTable() {
  const filtered = shops.filter(shop =>
    !searchTerm || shop.name.includes(searchTerm) || shop.canteen.includes(searchTerm)
  )
  if (filtered.length === 0) {
    shopTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#b5b0a8;padding:24px;">没有找到匹配的店铺</td></tr>`
    return
  }
  shopTableBody.innerHTML = filtered.map(shop => `
    <tr>
      <td>${shop.name}</td>
      <td>${shop.canteen}</td>
      <td>${shop.categories.map(c => `<span class="tag">${c}</span>`).join('')}</td>
      <td class="actions">
        <button class="edit-btn" onclick="openEditModal('${shop.id}')">编辑</button>
        <button class="delete-btn" onclick="openDeleteModal('${shop.id}')">删除</button>
      </td>
    </tr>
  `).join('')
}

// === Search ===
function handleSearch(value) {
  searchTerm = value
  renderTable()
}

// === Add / Edit ===
function openAddModal() {
  editingShopId = null
  modalTitle.textContent = '新增店铺'
  shopName.value = ''
  shopCanteen.value = '一饭'
  categoryCheckboxes.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false)
  modalConfirmBtn.textContent = '添加'
  shopModal.classList.add('open')
}

async function openEditModal(shopId) {
  editingShopId = shopId
  const shop = shops.find(s => String(s.id) === shopId)
  if (!shop) return

  modalTitle.textContent = '编辑店铺'
  shopName.value = shop.name
  shopCanteen.value = shop.canteen
  categoryCheckboxes.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.checked = shop.categories.includes(cb.value)
  })
  modalConfirmBtn.textContent = '保存'
  shopModal.classList.add('open')
}

function closeModal() {
  shopModal.classList.remove('open')
  editingShopId = null
}

async function handleSaveShop() {
  const name = shopName.value.trim()
  if (!name) { alert('请输入店铺名称'); return }

  const selectedCategories = Array.from(
    categoryCheckboxes.querySelectorAll('input[type="checkbox"]:checked')
  ).map(cb => cb.value)
  if (selectedCategories.length === 0) { alert('请选择至少一个分类'); return }

  const data = { name, canteen: shopCanteen.value, categories: selectedCategories }

  try {
    if (editingShopId) {
      await updateShop(editingShopId, data)
    } else {
      await addShop(data)
    }
    closeModal()
    shops = await getShops()
    renderTable()
  } catch (err) {
    alert(editingShopId ? '更新失败，请重试' : '添加失败，请重试')
  }
}

// === Delete ===
function openDeleteModal(shopId) {
  deletingShopId = shopId
  const shop = shops.find(s => String(s.id) === shopId)
  document.getElementById('deleteConfirmText').textContent =
    `确定要删除「${shop ? shop.name : ''}」吗？`
  deleteModal.classList.add('open')
}

function closeDeleteModal() {
  deleteModal.classList.remove('open')
  deletingShopId = null
}

async function handleDeleteShop() {
  if (!deletingShopId) return
  try {
    await deleteShop(deletingShopId)
    closeDeleteModal()
    shops = await getShops()
    renderTable()
  } catch (err) {
    alert('删除失败，请重试')
  }
}

// === Start ===
init()
```

- [ ] **Step 3: Verify admin page**

Check: auth flow (login → show admin, logout → show login), CRUD operations work (add, edit, delete), search filtering, category checkboxes populate correctly, error states handled.

- [ ] **Step 4: Commit**

```bash
git add admin.html admin.js
git commit -m "feat: add admin page with auth and shop CRUD management"
```

---

### Task 6: .gitignore + Final Verification

**Files:**
- Create: `.gitignore`

- [ ] **Step 1: Write .gitignore**

```
node_modules/
.env
.DS_Store
Thumbs.db
```

- [ ] **Step 2: Verify complete file structure**

```
stu-food-picker/
├── .gitignore
├── index.html
├── admin.html
├── style.css
├── script.js
├── admin.js
├── supabase-client.js
├── supabase-schema.sql
└── docs/
    └── superpowers/
        ├── specs/
        │   └── 2026-07-01-stu-food-picker-design.md
        └── plans/
            └── 2026-07-01-stu-food-picker-plan.md
```

All 8 source files present. No extra files. No missing files.

- [ ] **Step 3: Verify HTML pages have correct CDN and script imports**

- `index.html`: imports `style.css` → `supabase CDN` → `supabase-client.js` → `script.js`
- `admin.html`: imports `style.css` → `supabase CDN` → `supabase-client.js` → `admin.js`

Both pages load Supabase CDN before `supabase-client.js` (which uses `supabase` global).

- [ ] **Step 4: Check data consistency with spec**

- 26 shops total in seed data
- 4 categories: 饭类, 粉面/粿条, 麻辣烫, 汉堡/炸鸡
- 沙县小吃 has both ["饭类", "粉面/粿条"]
- All shops reference valid canteen values (一饭, 二饭, 三饭, D饭)
- RLS policies match spec (public read, auth write)

- [ ] **Step 5: Commit**

```bash
git add .gitignore
git commit -m "chore: add .gitignore and finalize project structure"
```

---

## Deployment Instructions (for user)

After all code is written, guide the user through:

1. **Supabase setup:**
   - Create new project at supabase.com
   - Open SQL Editor, paste and run `supabase-schema.sql`
   - Go to Authentication → Settings → enable email/password auth
   - Create an admin user (Authentication → Users → Add User)
   - Go to Project Settings → API → copy Project URL and anon key

2. **Configure `supabase-client.js`**:
   - Replace `SUPABASE_URL` and `SUPABASE_ANON_KEY` placeholders

3. **Deploy to Vercel:**
   - Push code to GitHub
   - Import repo in Vercel
   - Deploy (static files, no build step needed)
