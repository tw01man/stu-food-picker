// Supabase configuration -- replace these with your project values
const SUPABASE_URL = 'https://gpchcpmzapcedaiyjlhw.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwY2hjcG16YXBjZWRhaXlqbGh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NzkzODksImV4cCI6MjA5ODQ1NTM4OX0.7OZz-6l_v20gtxFgdjDZwfoc8lL7qJj0Uyd9ILcY_KI'

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

function escapeHtml(str) {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
