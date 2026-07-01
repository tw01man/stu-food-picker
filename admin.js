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
      <input type="checkbox" value="${escapeHtml(cat.name)}">
      ${escapeHtml(cat.name)}
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
      <td>${escapeHtml(shop.name)}</td>
      <td>${escapeHtml(shop.canteen)}</td>
      <td>${shop.categories.map(c => `<span class="tag">${escapeHtml(c)}</span>`).join('')}</td>
      <td class="actions">
        <button class="edit-btn" onclick="openEditModal('${String(shop.id).replace(/'/g, "\\'")}')">编辑</button>
        <button class="delete-btn" onclick="openDeleteModal('${String(shop.id).replace(/'/g, "\\'")}')">删除</button>
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
