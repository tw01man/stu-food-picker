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
      <div class="shop-name rolling">${escapeHtml(randomShop.name)}</div>
      <div class="shop-canteen rolling">${escapeHtml(randomShop.canteen)}</div>
    `
    step++
    if (step >= totalSteps) {
      resultCard.innerHTML = `
        <div class="shop-name">${escapeHtml(winner.name)}</div>
        <div class="shop-canteen">${escapeHtml(winner.canteen)}</div>
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
